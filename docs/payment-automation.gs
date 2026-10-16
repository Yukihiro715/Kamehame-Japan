/** Standalone Apps Script project. See PAYMENT_AUTOMATION.md before enabling.
 * Properties: SPREADSHEET_ID, AUTOMATION_TOKEN, RESEND_API_KEY, TEAM_EMAIL,
 * STAFF_EMAILS (comma separated), LIVE_SEND_ENABLED=true after acceptance tests.
 * One-minute trigger: processGolfQueue. Does not run in ChatGPT's session.
 */
var JOB_SHEET = 'メール自動化管理';
var LOG_SHEET = 'メール配信ログ';
var JOB_HEADERS = ['案件ID','リクエストID','お客様名','メール','体験日','送信区分','状態','送信予定','手動判定理由','受付メールID','支払いメールID','15分メールID','手動停止','配達日時','開封日時（参考）','決済リンククリック日時（参考）','配達エラー','入金日時','入金額','最終エラー','内部データ','割引前金額','割引額','使用プロモーションコード／ID'];
var LOG_HEADERS = ['イベントID','案件ID','メールID','メール種別','イベント','発生日時','決済セッションID','備考'];
function props_() { return PropertiesService.getScriptProperties(); }
function book_() { return SpreadsheetApp.openById(props_().getProperty('SPREADSHEET_ID')); }
function json_(x) { return ContentService.createTextOutput(JSON.stringify(x)).setMimeType(ContentService.MimeType.JSON); }
function sheet_(name, headers) {
  var ss = book_(), s = ss.getSheetByName(name);
  if (!s) { s = ss.insertSheet(name); s.getRange(1,1,1,headers.length).setValues([headers]); s.setFrozenRows(1); s.setFrozenColumns(2); s.getRange(1,1,1,headers.length).setBackground('#eaecef').setFontWeight('bold'); }
  var actual = s.getRange(1,1,1,headers.length).getValues()[0];
  if (JSON.stringify(actual) !== JSON.stringify(headers)) throw new Error(name + 'の見出しが変更されています');
  return s;
}
function literal_(x) { return typeof x === 'string' && /^[=+@-]/.test(x) ? "'" + x : x; }
function saveJob_(j, row) {
  var s = sheet_(JOB_SHEET, JOB_HEADERS), a=j.audit || {};
  var values=[j.id,j.requestId,j.enquiry.name,j.enquiry.email,j.enquiry.dates,j.mode,j.status,j.dueAt,j.reason||'',j.ackId||'',j.paymentId||'',j.introId||'',j.stop||'',a.delivered||'',a.opened||'',a.clicked||'',a.bounce||'',j.paidAt||'',j.paidAmount||'',j.error||'',JSON.stringify(j),j.paidSubtotal===undefined?'':j.paidSubtotal,j.paidDiscount===undefined?'':j.paidDiscount,j.paidDiscountReference||''];
  s.getRange(row,1,1,values.length).setValues([values.map(literal_)]);
  SpreadsheetApp.flush();
}
function jobs_() {
  var s=sheet_(JOB_SHEET,JOB_HEADERS); if(s.getLastRow()<2)return [];
  return s.getRange(2,1,s.getLastRow()-1,JOB_HEADERS.length).getValues().map(function(r,i){
    if(!r[20])return null; var j=JSON.parse(r[20]); j.stop=String(r[12]||''); return {job:j,row:i+2};
  }).filter(Boolean);
}
function doPost(e) {
  var lock=LockService.getScriptLock();
  try {
    var p=JSON.parse(e.postData.contents);
    // mail_event (manual-mail queue) is authorised by MAIL_QUEUE_TOKEN, everything else by AUTOMATION_TOKEN.
    var secret=props_().getProperty(p.action==='mail_event'?'MAIL_QUEUE_TOKEN':'AUTOMATION_TOKEN');
    if(!secret || typeof p.token!=='string' || p.token!==secret)return json_({ok:false,error:'unauthorized'});
    lock.waitLock(20000);
    if(p.action==='enqueue')return json_(enqueue_(p));
    if(p.action==='event')return json_(event_(p));
    if(p.action==='mail_event')return json_(mailEvent_(p)); // mail-queue.gs (same project)
    return json_({ok:false,error:'unknown_action'});
  } catch(err) { console.error(String(err)); return json_({ok:false,error:'operation_failed'}); }
  finally { if(lock.hasLock())lock.releaseLock(); }
}
function master_() {
  var s=book_().getSheetByName('Stripe決済リンク管理');
  if(!s)throw new Error('決済リンク管理がありません');
  var width=s.getLastColumn(), h=s.getRange(4,1,1,width).getValues()[0], n=Math.max(s.getLastRow()-4,1);
  return s.getRange(5,1,n,width).getValues().filter(function(r){return r[0];}).map(function(r){var o={};h.forEach(function(k,i){o[k]=r[i];});return o;});
}
// Existing standard rows with a blank count mean all golfers need rental clubs.
// Discount rows require an explicit integer count; price alone is not an identity.
function masterOwnCount_(row,n) {
  var value=row['クラブ不要人数'];
  if(value===undefined||value===null||String(value).trim()==='')return 0;
  if(!/^\d+$/.test(String(value)))return -1;
  var count=Number(value);return Number.isSafeInteger(count)&&count>=0&&count<=n?count:-1;
}
function decision_(p, rows, now) {
  var e=p.enquiry, reasons=[], n=Number(e.party), date=String(e.dates||'').slice(0,10);
  var d=new Date(date+'T00:00:00Z'), today=new Date(now+9*3600000).toISOString().slice(0,10);
  var validDate=/^\d{4}-\d{2}-\d{2}$/.test(date)&&isFinite(d.getTime())&&d.toISOString().slice(0,10)===date;
  if(!validDate)reasons.push('日程が不明');
  else if((d.getTime()-Date.parse(today+'T00:00:00Z'))/86400000<=4)reasons.push('開催4日以内');
  if(e.experience!=='mt-fuji-golf-day'||e.courseMode!=='recommended')reasons.push('指定コース・対象外プラン');
  if(['tokyo','saitama','chiba'].indexOf(e.pickupRegion)<0||!e.pickup)reasons.push('送迎場所の個別確認');
  if([2,3,4].indexOf(n)<0||['tokyo','fuji'].indexOf(e.areaId)<0)reasons.push('エリア・人数の確認');
  var rentals=String(e.rentalKeys||'').split(',');
  var rentalValid=rentals.length===n&&rentals.every(function(k){return k==='own'||/^required:(right|left)$/.test(k);});
  var ownCount=rentals.filter(function(k){return k==='own';}).length, clubDiscount=ownCount*5000;
  if(!rentalValid)reasons.push('レンタル情報の確認');
  if(e.clubs&&e.clubs.trim())reasons.push('クラブ仕様の個別確認');
  if(e.caddie!=='none'&&e.caddie!=='required')reasons.push('キャディ希望の確認');
  if(e.addons||(e.addonIds&&e.addonIds.length))reasons.push('追加オプション');
  if(e.message&&!/^(none|no|n\/a|thanks|thank you|なし|特になし)[.!。！\s]*$/i.test(e.message.trim()))reasons.push('備考の個別確認');
  if(e.lang!=='en'||!p.payment)reasons.push('支払い案内テンプレートの確認');
  var caddie=e.caddie==='required'?'あり':'なし', area=e.areaId==='fuji'?'富士山エリア':'東京近郊';
  var candidates=rows.filter(function(r){return r['区分']==='標準プラン'&&r['体験カテゴリ']==='プライベートゴルフ'&&r['エリア']===area&&Number(r['人数'])===n&&r['キャディ']===caddie&&masterOwnCount_(r,n)===ownCount&&String(r['料金版'])===p.priceVersion&&r['自動送信可']==='可';});
  var link=candidates.length===1?candidates[0]:null;
  if(!link)reasons.push(candidates.length>1?'決済リンクが複数登録':'確認済み決済リンクなし');
  else {
    var extra=Number(link['キャディ追加料金（税込）']), total=Number(link['決済総額（税込）']);
    if(!/^https:\/\/(book|buy)\.stripe\.com\/[A-Za-z0-9]+$/.test(String(link['顧客用決済URL']))||link['Stripeリンク状態']!=='有効'||link['通貨']!=='JPY'||!/^plink_[A-Za-z0-9]+$/.test(String(link['Payment Link ID（plink_）'])))reasons.push('Stripe設定未確認');
    if(String(link['キャディ追加料金（税込）']).trim()===''||!Number.isSafeInteger(total)||total<=0||!Number.isSafeInteger(extra)||extra<0||!Number.isSafeInteger(p.baseTotal)||p.baseTotal<=0||total!==p.baseTotal+extra-clubDiscount||(caddie==='なし'&&extra!==0))reasons.push('料金不一致');
  }
  return {mode:reasons.length?'manual':'payment',reason:reasons.join('／'),link:reasons.length?null:link,ownCount:ownCount,clubDiscount:clubDiscount};
}
function enqueue_(p) {
  if(!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(p.requestId||'')||!p.enquiry||!p.ack||!p.followUp||!p.ledger)throw new Error('invalid request');
  var old=jobs_().filter(function(x){return x.job.requestId===p.requestId;})[0];
  if(old)return {ok:true,id:old.job.id,ackSent:!!old.job.ackId};
  var now=Date.now(), choice=decision_(p,master_(),now);
  // UUID suffix avoids races with the legacy ledger's separate script lock.
  var id='KJ-'+String(p.enquiry.dates).slice(2,10).replace(/-/g,'')+'-G'+p.requestId.slice(0,8);
  var j=Object.assign({},p,{id:id,createdAt:new Date(now).toISOString(),mode:choice.mode,reason:choice.reason,status:'received',dueAt:'',audit:{},attempts:{}});delete j.token;delete j.action;
  var row=sheet_(JOB_SHEET,JOB_HEADERS).getLastRow()+1;saveJob_(j,row);
  try {
    writeLedger_(j);j.ledgerWritten=true;saveJob_(j,row);
    j.ackId=send_(j,'ack',j.ack.text,j.enquiry.email);j.ackAt=new Date().toISOString();
    j.dueAt=new Date(Date.now()+(j.mode==='payment'?10:15)*60000).toISOString();j.status='queued';saveJob_(j,row);
  } catch(err) {j.status='error';j.error=String(err);saveJob_(j,row);}
  notify_(j,row,'受付', (j.mode==='manual'?'【要手動対応】'+j.reason:'【10分後に支払い案内予定】')+'\nキャディ: '+j.enquiry.caddie+'\n'+j.teamText);
  return {ok:true,id:j.id,ackSent:!!j.ackId};
}
function send_(j, kind, text, recipient, html) {
  if(props_().getProperty('LIVE_SEND_ENABLED')!=='true')throw new Error('自動送信は未有効化');
  var key=props_().getProperty('RESEND_API_KEY');if(!key)throw new Error('Resend未設定');
  var idempotency='golf/'+j.requestId+'/'+kind;
  var payload={from:'Yukihiro, KAMEHAME JAPAN <hello@kamehame-japan.com>',to:[recipient],reply_to:kind.indexOf('ops-')===0?j.enquiry.email:'hello@kamehame-japan.com',subject:'['+j.id+'] '+j.subject,text:text,html:html||html_(text),headers:{'X-KJ-Automation':'1','X-KJ-Reference':j.id},tags:[{name:'kind',value:kind},{name:'booking',value:j.id}]};
  var res=UrlFetchApp.fetch('https://api.resend.com/emails',{method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+key,'Idempotency-Key':idempotency},payload:JSON.stringify(payload),muteHttpExceptions:true});
  if(res.getResponseCode()<200||res.getResponseCode()>=300)throw new Error('Resend送信失敗 '+res.getResponseCode());
  var body=JSON.parse(res.getContentText());if(!body.id)throw new Error('送信ID未確認');return body.id;
}
function html_(text) {
  var escaped=String(text).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  return '<html><body><div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;white-space:pre-wrap">'+escaped.replace(/https:\/\/[^\s<>]+/g,function(u){return '<a href="'+u+'">'+u+'</a>';})+'</div></body></html>';
}
function notify_(j,row,key,body) {
  j.notifications=j.notifications||{};j.pendingNotifications=j.pendingNotifications||{};if(j.notifications[key])return; j.pendingNotifications[key]=body;
  try {
    var team=props_().getProperty('TEAM_EMAIL');if(!team)throw new Error('運営通知先未設定');
    var id=send_(j,'ops-'+Utilities.base64EncodeWebSafe(key).replace(/=/g,''), '['+key+'] '+body+'\n\n台帳: '+book_().getUrl()+'\n手動停止する場合は「メール自動化管理」の「手動停止」に「停止」と入力。',team);
    j.notifications[key]=id;delete j.pendingNotifications[key];saveJob_(j,row);
  } catch(err) {j.error=String(err);saveJob_(j,row);}
}
function fillPayment_(template,values,html) {
  var result=String(template).replace(/\{\{([A-Z_]+)\}\}/g,function(_,key){
    if(!Object.prototype.hasOwnProperty.call(values,key))throw new Error('未置換のメール項目');
    var v=String(values[key]);return html?v.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'):v;
  });
  return result;
}
/** Manual Resend mail isn't in Gmail's Sent folder. Use the approved queue too.
 * Sending/uncertain outcomes also hold, to avoid a second customer email. */
function manualQueueActivity_(j) {
  if(typeof qrows_!=='function')return '';
  var fromTime=Date.parse(j.createdAt), email=String(j.enquiry.email).trim().toLowerCase();
  return qrows_().some(function(x){
    var r=x.r, same=String(r[QC.to]).trim().toLowerCase()===email;
    var status=String(r[QC.status]), exact=String(r[QC.caseId]).trim()===j.id;
    var at=new Date(r[QC.sentAt]||r[QC.approvedAt]||r[QC.createdAt]).getTime();
    return same&&(exact||at>=fromTime)&&[QS.approved,QS.sending,QS.sent,QS.check,QS.error].indexOf(status)>=0;
  })?'個別メール送信・承認済み（要確認を含む）':'';
}
function humanActivity_(j) {
  var manual=manualQueueActivity_(j);if(manual)return manual;
  var email=j.enquiry.email.toLowerCase(), staff=(props_().getProperty('STAFF_EMAILS')||'').toLowerCase().split(',').map(function(x){return x.trim();});
  staff.push('hello@kamehame-japan.com');
  staff.push(Session.getEffectiveUser().getEmail().toLowerCase());staff=staff.concat(GmailApp.getAliases().map(function(x){return x.toLowerCase();}));
  var fromTime=Date.parse(j.createdAt), after=Math.floor(fromTime/1000)-1;
  var threads=GmailApp.search('after:'+after+' {from:'+email+' to:'+email+'}',0,100);
  if(threads.length>=100)return 'メール照合件数上限・手動確認';
  var result='';threads.forEach(function(t){var msgs=t.getMessages(), exact=msgs.some(function(m){return m.getSubject().indexOf('['+j.id+']')>=0;});
    msgs.forEach(function(m){
      if(m.getDate().getTime()<fromTime||m.isDraft()||m.getHeader('X-KJ-Automation')==='1')return;
      var from=address_(m.getFrom()), tos=(m.getTo()+' '+m.getCc()).toLowerCase();
      if(from===email)result=exact?'お客様から返信':'お客様の別件メールの可能性・手動確認';
      if(staff.indexOf(from)>=0&&tos.indexOf(email)>=0)result=exact?'担当者が返信済み':'同じ宛先への手動送信あり・案件を確認';
    });
  });return result;
}
function address_(s){var m=String(s).toLowerCase().match(/<([^>]+)>/);return (m?m[1]:String(s)).trim().toLowerCase();}
function processGolfQueue() {
  var lock=LockService.getScriptLock();if(!lock.tryLock(1000))return;
  try {
    var start=Date.now();
    jobs_().forEach(function(x){
      if(Date.now()-start>240000)return;
      var j=x.job;Object.keys(j.pendingNotifications||{}).forEach(function(k){notify_(j,x.row,k,j.pendingNotifications[k]);});if(j.status!=='queued'&&j.status!=='sending')return;
      try {
        if(j.stop||j.paidAt||j.audit.bounce){j.status='held';j.reason=j.stop||'入金済み・配達エラー';saveJob_(j,x.row);return;}
        if(Date.now()-Date.parse(j.dueAt)>60*60000){j.status='held';j.reason='送信予定から1時間超過・手動確認';saveJob_(j,x.row);notify_(j,x.row,'要確認',j.reason);return;}
        var human=humanActivity_(j);if(human){j.status='held';j.reason=human;saveJob_(j,x.row);notify_(j,x.row,'自動停止',human);return;}
        if(Date.now()<Date.parse(j.dueAt))return;
        // Re-read the approved link and all eligibility rules immediately before send.
        if(j.mode==='payment'){
          var choice=decision_(j,master_(),Date.now());
          if(choice.mode!=='payment'){if(j.pendingMessage)throw new Error('送信開始後の決済条件変更・手動確認');j.mode='manual';j.reason=choice.reason;j.dueAt=new Date(Date.parse(j.ackAt)+15*60000).toISOString();saveJob_(j,x.row);notify_(j,x.row,'要手動対応',j.reason);return;}
          var link=choice.link, total=Number(link['決済総額（税込）']);
          if(j.pendingMessage && (j.expectedAmount!==total || j.paymentLinkId!==link['Payment Link ID（plink_）'] || j.paymentUrl.split('?')[0]!==link['顧客用決済URL']))throw new Error('送信再開前に決済条件が変更・手動確認');
          j.paymentUrl=link['顧客用決済URL']+'?client_reference_id='+encodeURIComponent(j.id);
          j.clubDiscount=choice.clubDiscount;j.ownClubCount=choice.ownCount;
          j.expectedAmount=total;j.paymentLinkId=link['Payment Link ID（plink_）'];
          if(!j.pendingMessage) {
            if(!j.payment.html || j.payment.version!=='photo-2026-10-16')throw new Error('写真付きテンプレート未確認・手動対応');
            if(choice.ownCount && (j.payment.text.indexOf('{{CLUB_DISCOUNT_LINE}}')<0 || j.payment.html.indexOf('{{CLUB_DISCOUNT_LINE}}')<0))throw new Error('クラブ割引テンプレート未確認・手動対応');
            var values={TOTAL:total.toLocaleString('en-US'),PER_PERSON:Math.round(total/Number(j.enquiry.party)).toLocaleString('en-US'),PAYMENT_URL:j.paymentUrl,CLUB_DISCOUNT_LINE:choice.ownCount?'This total includes a ¥5,000 discount for each golfer who does not need rental clubs ('+choice.ownCount+' golfer(s), ¥'+choice.clubDiscount.toLocaleString('en-US')+' off in total). Rental clubs are included only for the remaining '+(Number(j.enquiry.party)-choice.ownCount)+' golfer(s).':'Standard rental clubs are included for all golfers.',CADDIE_LINE:j.enquiry.caddie==='required'?'• Course caddie: included in the price below':'• Course caddie: not included (standard package)'};
            j.pendingMessage={kind:'payment',text:fillPayment_(j.payment.text,values,false),html:fillPayment_(j.payment.html,values,true)};
          }
        }
        if(!j.pendingMessage)j.pendingMessage={kind:'intro',text:j.followUp.text,html:j.followUp.html||html_(j.followUp.text)};
        // Persist exact payload before I/O. Retry only this same payload/key, within
        // Resend's 24h idempotency window (our recovery limit is one hour).
        j.status='sending';saveJob_(j,x.row);
        // Recheck after persistence, as a staff reply may arrive during preparation.
        var finalHuman=humanActivity_(j);if(finalHuman){j.status='held';j.reason=finalHuman;saveJob_(j,x.row);notify_(j,x.row,'自動停止',finalHuman);return;}
        var mid=send_(j,j.pendingMessage.kind,j.pendingMessage.text,j.enquiry.email,j.pendingMessage.html);
        if(j.pendingMessage.kind==='payment'){j.paymentId=mid;j.paymentSentAt=new Date().toISOString();updatePaymentLedger_(j);}else j.introId=mid;
        j.status='sent';saveJob_(j,x.row);notify_(j,x.row,'送信済み',j.pendingMessage.kind==='payment'?'支払い案内を送信しました':'未対応のため15分フォローを送信しました');
      } catch(err) {j.status='error';j.error=String(err);saveJob_(j,x.row);notify_(j,x.row,'処理エラー',j.error+'\n送信済みの可能性もあるため、確認前に再送しないでください。');}
    });
    props_().setProperty('LAST_QUEUE_RUN',new Date().toISOString());
  } finally {lock.releaseLock();}
}
function upsert_(sheetName,id,fields) {
  var s=book_().getSheetByName(sheetName);if(!s)throw new Error(sheetName+'なし');
  var h=s.getRange(1,1,1,s.getLastColumn()).getValues()[0], ids=s.getRange(2,1,Math.max(s.getLastRow()-1,1),1).getValues().map(function(r){return String(r[0]);});
  var at=ids.indexOf(id), row=at<0?(ids.findIndex(function(v){return !v;})+2):at+2;if(row<2)row=s.getLastRow()+1;
  if(row>s.getMaxRows())s.insertRowsAfter(s.getMaxRows(),1);
  s.getRange(row,1).setValue(id);
  Object.keys(fields).forEach(function(k){var c=h.indexOf(k);if(c>=0)s.getRange(row,c+1).setValue(literal_(fields[k]));});return row;
}
function writeLedger_(j) {
  var r=j.ledger,e=j.enquiry;
  upsert_('予約一覧',j.id,{'お客様名／窓口':e.name,'体験カテゴリ':'プライベートゴルフ','対応ステータス':'仮予約受領','体験日':r.experienceDate?new Date(r.experienceDate+'T00:00:00+09:00'):'','人数':Number(e.party),'支払い状況':'入金未確認','次のアクション':j.mode==='payment'?'10分後に支払い案内予定':'要手動対応: '+j.reason,'担当':'ゆきひろ','受付日':new Date(r.receivedAt.replace(' ','T')+':00+09:00'),'受付経路':'Webフォーム','対応言語':e.lang==='en'?'英語':e.lang,'顧客の無料取消期限':r.freeCancelUntil?new Date(r.freeCancelUntil.replace(' ','T')+':00+09:00'):'','メール':e.email,'電話／WhatsApp':e.whatsapp||'','サイト概算（税込）':j.baseTotal||'','確認メモ':'自動化ID: '+j.requestId});
  upsert_('手配・体験詳細',j.id,{'エリア':r.area||'','体験名／プラン内容':r.experienceTitle||'','集合・出発時刻':r.departure||'','集合・送迎場所':e.pickup||'','人数内訳':e.party+'名','参加者氏名・国籍':e.name,'希望・アレルギー等':e.message||'','レンタル・持参品':[e.rental,e.clubs].filter(Boolean).join('／'),'追加オプション':(e.addons||'')+'／キャディ: '+e.caddie,'手配状況':'未着手','手配メモ・未確認事項':j.reason});
  upsert_('決済・連絡管理',j.id,{'運用区分':j.mode==='payment'?'通常':'直前・個別対応','リマインド運用':'一時停止','運用メモ':'メール自動化管理参照: '+j.requestId});
}
function updatePaymentLedger_(j) {
  upsert_('予約一覧',j.id,{'対応ステータス':'支払待ち','提示額（税込）':j.expectedAmount,'次のアクション':'入金確認後、コース・送迎・レンタル手配'});
  upsert_('手配・体験詳細',j.id,{'決済リンク':j.paymentUrl});
  upsert_('決済・連絡管理',j.id,{'決済案内送信日時':new Date(j.paymentSentAt),'運用メモ':'支払い案内メールID: '+j.paymentId});
}
function event_(p) {
  var v=p.event, provider=p.provider, eventId=p.eventId;
  if(!eventId||!v)throw new Error('イベント不正');
  var s=sheet_(LOG_SHEET,LOG_HEADERS), ids=s.getLastRow()>1?s.getRange(2,1,s.getLastRow()-1,1).getValues():[];
  if(ids.some(function(r){return r[0]===eventId;}))return {ok:true,duplicate:true};
  var data=v.data||{}, session=data.object||{}, all=jobs_(), x=all.filter(function(x){var j=x.job;return provider==='stripe'?session.client_reference_id===j.id:[j.ackId,j.paymentId,j.introId].indexOf(data.email_id)>=0;})[0];
  // A webhook may arrive before send() returned. Ask the provider to retry;
  // never permanently acknowledge an event that cannot yet be reconciled.
  if(!x)return provider==='stripe'?{ok:true,ignored:true}:{ok:false,error:'unmatched_event'};
  var j=x.job, at=v.created_at||new Date((v.created||Date.now()/1000)*1000).toISOString(), kind=data.email_id===j.paymentId?'payment':data.email_id===j.ackId?'ack':'intro', note='';
  if(provider==='resend') {
    j.audit=j.audit||{};
    if(kind==='payment'&&v.type==='email.delivered')j.audit.delivered=j.audit.delivered||at;
    if(kind==='payment'&&v.type==='email.opened')j.audit.opened=j.audit.opened||at;
    if(kind==='payment'&&v.type==='email.clicked'&&data.click&&data.click.link===j.paymentUrl)j.audit.clicked=j.audit.clicked||at;
    if(['email.bounced','email.failed','email.suppressed','email.complained'].indexOf(v.type)>=0){j.audit.bounce=v.type;j.stop='配達エラー・苦情';note='メールアドレス確認／WhatsApp・SMSの手動連絡を検討';}
    if(v.type==='email.delivery_delayed')note='一時的な配達遅延。未開封とは別に確認';
  } else if(provider==='stripe'&&v.type==='checkout.session.async_payment_failed') {
    note='非同期決済が失敗。お客様への支払い方法確認が必要';
  } else if(provider==='stripe'&&['checkout.session.completed','checkout.session.async_payment_succeeded'].indexOf(v.type)>=0) {
    if(session.payment_status!=='paid')note='決済手続き完了・入金待ち';
    else if(!j.paymentId||session.payment_link!==j.paymentLinkId||session.currency!=='jpy'||!validPaidAmount_(session,j.expectedAmount)||session.livemode!==true){note='割引前金額・割引内訳・決済リンク・モード不一致。要手動照合';}
    else if(j.paidSession&&j.paidSession!==session.id){note='重複決済の可能性・要確認';}
    else {j.paidSession=session.id;j.paidAt=j.paidAt||at;j.paidAmount=session.amount_total;j.stop='入金済み';
      j.paidSubtotal=session.amount_subtotal;j.paidDiscount=session.total_details.amount_discount;
      j.paidDiscountReference=discountReference_(session);
      upsert_('予約一覧',j.id,{'対応ステータス':'入金済・手配待ち','支払い状況':'入金済','入金額':j.paidAmount,'支払日':new Date(j.paidAt),'次のアクション':'入金から24時間以内にコース・スタート時刻をご案内'});
      upsert_('決済・連絡管理',j.id,{'入金確認日時':new Date(j.paidAt),'Stripe決済ID':session.id,'リマインド運用':'停止','停止・保留理由':'入金済み'});
      note='入金確認。24時間以内に手配結果を案内してください';
    }
  }
  saveJob_(j,x.row);
  if(note)notify_(j,x.row,eventId,note);
  s.appendRow([eventId,j.id,data.email_id||'',provider==='stripe'?'payment':kind,v.type,at,session.id||'',note].map(literal_));
  return {ok:true};
}
/** Only signed Stripe amounts reach here. Fixed JPY packages have no extra tax/shipping.
 * Free/100%-off sessions remain manual; missing detail never means zero discount. */
function validPaidAmount_(s,expected) {
  var t=s.total_details;
  return typeof s.id==='string'&&/^cs_/.test(s.id)&&t&&
    [expected,s.amount_subtotal,s.amount_total,t.amount_discount,t.amount_tax,t.amount_shipping].every(function(n){return Number.isSafeInteger(n)&&n>=0;})&&
    expected>0&&s.amount_subtotal===expected&&s.amount_total>0&&
    t.amount_tax===0&&t.amount_shipping===0&&t.amount_discount<expected&&
    s.amount_total===expected-t.amount_discount;
}
function discountReference_(s) {
  var refs=(Array.isArray(s.discounts)?s.discounts:[]).map(function(d){
    var r=d&&(d.promotion_code||d.coupon);
    return typeof r==='string'?r:r&&(r.code?r.code+(r.id?' ('+r.id+')':''):r.id)||'';
  }).filter(Boolean);
  return refs.join(', ')||(s.total_details.amount_discount>0?'コード未取得（Stripe決済IDで確認）':'');
}
/** Run only after the documented configuration and dry-run tests. This function
 * creates the minute trigger; it does not turn live sends on automatically. */
function installGolfQueue() {
  ['SPREADSHEET_ID','AUTOMATION_TOKEN','RESEND_API_KEY','TEAM_EMAIL','STAFF_EMAILS'].forEach(function(k){if(!props_().getProperty(k))throw new Error(k+'が未設定');});
  sheet_(JOB_SHEET,JOB_HEADERS);sheet_(LOG_SHEET,LOG_HEADERS);master_();GmailApp.getAliases();
  if(!ScriptApp.getProjectTriggers().some(function(t){return t.getHandlerFunction()==='processGolfQueue';}))ScriptApp.newTrigger('processGolfQueue').timeBased().everyMinutes(1).create();
}
