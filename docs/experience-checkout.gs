/** Add to the EXISTING payment-automation Apps Script project.
 * Uses its AUTOMATION_TOKEN, SPREADSHEET_ID, RESEND_API_KEY, TEAM_EMAIL and
 * EXPERIENCE_LIVE_SEND_ENABLED. No Stripe key is stored in Apps Script.
 * Run setupExperienceCheckout once; redeploy the existing web-app version.
 */
var EXPERIENCE_VERSION = '2026-10-22';
var EXPERIENCE_SHEET = '体験決済管理';
var EXPERIENCE_HEADERS = ['案件ID','受付日時','体験','希望日時','参加人数','請求人数','予定金額','状態','決済セッションID','入金日時','支払受付メールID','最終エラー','内部データ'];
function experienceRows_() {
  var s=sheet_(EXPERIENCE_SHEET,EXPERIENCE_HEADERS);
  return s.getLastRow()<2?[]:s.getRange(2,1,s.getLastRow()-1,EXPERIENCE_HEADERS.length).getValues().map(function(r,i){return {row:i+2,job:JSON.parse(r[12])};});
}
function saveExperience_(j,row) {
  var o=j.order;
  sheet_(EXPERIENCE_SHEET,EXPERIENCE_HEADERS).getRange(row,1,1,EXPERIENCE_HEADERS.length).setValues([[
    j.id,new Date(j.createdAt),o.title,o.date+' '+o.time,o.guests,o.quantity,o.amount,j.status,j.sessionId||'',j.paidAt?new Date(j.paidAt):'',j.receiptId||'',j.error||'',JSON.stringify(j)
  ].map(literal_)]);
  SpreadsheetApp.flush();
}
function experienceAction_(p) {
  if(p.action==='experience_health') {
    var ready=props_().getProperty('EXPERIENCE_LIVE_SEND_ENABLED')==='true' && !!props_().getProperty('RESEND_API_KEY') && !!props_().getProperty('TEAM_EMAIL') &&
      ScriptApp.getProjectTriggers().some(function(t){return t.getHandlerFunction()==='processExperienceQueue';});
    // Health is read-only. setupExperienceCheckout creates the sheet, not this request.
    var s=book_().getSheetByName(EXPERIENCE_SHEET);
    ready=ready&&!!s&&JSON.stringify(s.getRange(1,1,1,EXPERIENCE_HEADERS.length).getValues()[0])===JSON.stringify(EXPERIENCE_HEADERS);
    return {ok:true,ready:!!ready,version:EXPERIENCE_VERSION};
  }
  var all=experienceRows_();
  if(p.action==='experience_create') {
    var o=p.order;
    if(!o||!/^([0-9a-f]{8})-([0-9a-f]{4})-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(o.requestId)||o.policyVersion!==EXPERIENCE_VERSION||o.consent!==true||!Number.isSafeInteger(o.amount)||o.amount<=0||!p.receipt||typeof p.receipt.text!=='string')throw Error('invalid experience request');
    var old=all.filter(function(x){return x.job.order.requestId===o.requestId;})[0];
    if(old){if(JSON.stringify(old.job.order)!==JSON.stringify(o))throw Error('request conflict');writeExperienceLedger_(old.job);return {ok:true,id:old.job.id,createdAt:old.job.createdAt,status:old.job.status};}
    if(all.filter(function(x){return Date.now()-x.job.createdAt<60000;}).length>=60||all.filter(function(x){return x.job.order.email===o.email&&Date.now()-x.job.createdAt<3600000;}).length>=5)throw Error('request limit');
    // Prevent a refreshed form from making a second simultaneous payment request.
    if(all.some(function(x){var j=x.job;return j.order.email===o.email&&j.order.slug===o.slug&&j.order.date===o.date&&j.order.time===o.time&&j.status!=='expired'&&j.status!=='payment_failed'&&(j.paidAt||Date.now()-j.createdAt<3600000);}))throw Error('duplicate booking; contact team');
    var j={id:'KJ-E-'+o.requestId.replace(/-/g,''),createdAt:Date.now(),order:o,receipt:p.receipt,status:'awaiting_payment',events:[]};
    var row=sheet_(EXPERIENCE_SHEET,EXPERIENCE_HEADERS).getLastRow()+1;
    saveExperience_(j,row);writeExperienceLedger_(j);
    return {ok:true,id:j.id,createdAt:j.createdAt,status:j.status};
  }
  var id=p.id||(p.session&&p.session.reference), x=all.filter(function(x){return x.job.id===id;})[0];
  if(!x)throw Error('unknown experience booking');
  var j=x.job;
  if(p.action==='experience_session') {
    if(!/^cs_live_[A-Za-z0-9]+$/.test(p.sessionId)||j.sessionId&&j.sessionId!==p.sessionId)throw Error('session conflict');
    j.sessionId=p.sessionId;saveExperience_(j,x.row);return {ok:true};
  }
  if(p.action!=='experience_event'||typeof p.eventId!=='string')throw Error('unknown action');
  if(j.events.indexOf(p.eventId)>=0)return {ok:true,duplicate:true};
  var s=p.session;
  if(!s||s.livemode!==true||s.flow!=='experience_provisional'||s.policyVersion!==j.order.policyVersion||s.slug!==j.order.slug||s.currency!=='jpy'||s.amount!==j.order.amount||s.subtotal!==j.order.amount||s.moreItems||!s.items||s.items.length!==1||s.items[0].price!==j.order.price||s.items[0].quantity!==j.order.quantity)throw Error('payment mismatch');
  // The signed webhook may win the race with experience_session after Stripe created it.
  if(j.sessionId&&j.sessionId!==s.id)throw Error('duplicate payment session; manual review required');
  j.sessionId=s.id;
  if(s.paymentStatus==='paid') {
    j.paidAt=j.paidAt||Date.now();j.status='paid_pending';
  } else if(!j.paidAt) {
    if(p.eventType==='checkout.session.async_payment_failed')j.status='payment_failed';
    else if(p.eventType==='checkout.session.expired')j.status='expired';
    else j.status='payment_processing';
  }
  j.events.push(p.eventId);saveExperience_(j,x.row);
  // A trigger retries durable downstream tasks. Webhooks do not wait for email.
  return {ok:true};
}
function writeExperienceLedger_(j) {
  var o=j.order,paid=!!j.paidAt;
  var cities={tokyo:'東京',osaka:'大阪',kyoto:'京都',nagoya:'名古屋',okinawa:'沖縄',kanazawa:'金沢',himeji:'姫路'};
  var charge=o.chargeUnit==='group'?'1組分（'+o.guests+'名）':o.quantity+'名分';
  var interpreter=o.interpreter?{en:'英語',es:'スペイン語',fr:'フランス語',none:'不要'}[o.interpreter]:'';
  // Match the existing ledger's strict dropdown labels, not website locale codes.
  var language={en:'英語',ja:'日本語',es:'スペイン語',fr:'フランス語','zh-tw':'繁体字中国語'}[o.lang]||'その他';
  experienceUpsert_('予約一覧',j.id,{
    'お客様名／窓口':o.name,'体験カテゴリ':/ramen-class$/.test(o.slug)?'料理・グルメ':o.slug==='kanji-name-calligraphy'?'漢字・書道':o.slug==='evening-with-geiko'?'京都芸妓・舞妓':'その他',
    '対応ステータス':paid?'入金済・手配待ち':'仮予約受領','体験日':new Date(o.date+'T00:00:00+09:00'),'人数':o.guests,
    '支払い状況':paid?'入金済':'未請求','次のアクション':paid?'施設に空き確認 → 予約確定連絡。不可なら代替案／合意できなければ全額返金':'決済待ち。予約未確定・施設への手配は入金確認後',
    '担当':'ゆきひろ','受付日':new Date(j.createdAt),'受付経路':'Webフォーム','対応言語':language,'メール':o.email,
    'サイト概算（税込）':o.amount,'提示額（税込）':o.amount,'入金額':paid?o.amount:'','支払日':paid?new Date(j.paidAt):'',
    '確認メモ':'体験決済管理参照。予約未確定。実参加'+o.guests+'名／請求'+charge+'。規定版 '+o.policyVersion+'。GAS直接登録・Gmailからの再登録不要。'
  },paid?{'対応ステータス':['仮予約受領','決済案内準備','支払待ち'],'支払い状況':['未請求','入金未確認'],'次のアクション':['決済待ち。予約未確定・施設への手配は入金確認後']}:undefined);
  experienceUpsert_('手配・体験詳細',j.id,{'エリア':cities[o.city]||'東京','体験名／プラン内容':o.title,'体験開始時刻':o.time,'人数内訳':'実参加'+o.guests+'名／請求'+charge,'希望・アレルギー等':(o.message||'なし')+(interpreter?'\n通訳希望: '+interpreter:''),'手配状況':'未着手','手配メモ・未確認事項':'希望日時は未確定。選択プラン・表示条件への同意取得済み。'});
  experienceUpsert_('決済・連絡管理',j.id,{'運用区分':'通常','リマインド運用':paid?'停止':'手動','Stripe決済ID':j.sessionId||'','入金確認日時':paid?new Date(j.paidAt):'','停止・保留理由':paid?'入金済み・施設確認待ち':'','運用メモ':'体験決済管理参照。予約確定メールは施設受入確認後に担当者が送付。'},paid?{'リマインド運用':['手動','自動送信','一時停止']}:undefined);
}
function experienceSend_(j,kind,to,subject,text) {
  if(props_().getProperty('EXPERIENCE_LIVE_SEND_ENABLED')!=='true')throw Error('sending disabled');
  var res=UrlFetchApp.fetch('https://api.resend.com/emails',{method:'post',contentType:'application/json',
    headers:{Authorization:'Bearer '+props_().getProperty('RESEND_API_KEY'),'Idempotency-Key':'experience-'+j.id+'-'+kind},
    payload:JSON.stringify({from:'KAMEHAME JAPAN <enquiries@kamehame-japan.com>',to:[to],reply_to:'hello@kamehame-japan.com',subject:subject,text:text}),muteHttpExceptions:true});
  var data=JSON.parse(res.getContentText());
  if(res.getResponseCode()<200||res.getResponseCode()>=300||!data.id)throw Error('email failed '+res.getResponseCode());
  return data.id;
}
function processExperienceQueue() {
  var lock=LockService.getScriptLock();if(!lock.tryLock(1000))return;
  try {
    var start=Date.now();
    experienceRows_().forEach(function(x){
      if(Date.now()-start>240000)return;
      var j=x.job;if(!j.paidAt||(j.ledgerPaid&&j.receiptId&&j.teamId))return;
      try {
        if(!j.ledgerPaid){writeExperienceLedger_(j);j.ledgerPaid=true;saveExperience_(j,x.row);}
        // Do not retry an ambiguous send after the provider's 24-hour dedup window.
        if(j.sendStartedAt&&Date.now()-j.sendStartedAt>20*3600000)throw Error('メール送信の再試行期限超過。配信履歴を確認して手動対応');
        if(!j.sendStartedAt){j.sendStartedAt=Date.now();saveExperience_(j,x.row);}
        var o=j.order;
        var sendErrors=[];
        if(!j.receiptId)try{
          var text=j.receipt.text+'\n\nReference: '+j.id+'\n'+o.title+'\n'+o.date+' '+o.time+' JST\nGuests: '+o.guests+' / Charge: '+(o.chargeUnit==='group'?'1 group':o.quantity+' guests')+'\nJPY '+o.amount.toLocaleString('en-US')+' (tax included)\n\nhello@kamehame-japan.com\nKAMEHAME JAPAN | Prosent Inc.';
          j.receiptId=experienceSend_(j,'receipt',o.email,j.receipt.subject+' | '+j.id,text);saveExperience_(j,x.row);
        }catch(err){sendErrors.push('受付メール: '+String(err));}
        if(!j.teamId)try{
          var team='【入金済・予約未確定】施設の受入確認が必要です。\n'+j.id+'\n'+o.title+'\n希望: '+o.date+' '+o.time+' JST\n実参加'+o.guests+'名／請求'+(o.chargeUnit==='group'?'1組分':o.quantity+'名分')+'\n通訳: '+(o.interpreter||'なし')+'\n入金: ¥'+o.amount+'\n'+o.name+' <'+o.email+'>\n備考: '+o.message+'\nStripe: '+j.sessionId+'\n台帳へ直接登録済み・Gmail起点の重複登録不要。\n満席なら代替日時を提案し、合意できなければ全額返金してください。';
          j.teamId=experienceSend_(j,'team',props_().getProperty('TEAM_EMAIL'),'【要手配・入金済】'+j.id+' '+o.title,team);saveExperience_(j,x.row);
        }catch(err){sendErrors.push('運営通知: '+String(err));}
        if(sendErrors.length)throw Error(sendErrors.join(' / '));
        j.error='';saveExperience_(j,x.row);
      }catch(err){j.error=String(err);saveExperience_(j,x.row);}
    });
  } finally {lock.releaseLock();}
}
function setupExperienceCheckout() {
  ['SPREADSHEET_ID','AUTOMATION_TOKEN','RESEND_API_KEY','TEAM_EMAIL'].forEach(function(k){if(!props_().getProperty(k))throw Error(k+' missing');});
  ['予約一覧','手配・体験詳細','決済・連絡管理'].forEach(experienceLedgerSnapshot_);
  sheet_(EXPERIENCE_SHEET,EXPERIENCE_HEADERS);
  if(!ScriptApp.getProjectTriggers().some(function(t){return t.getHandlerFunction()==='processExperienceQueue';}))ScriptApp.newTrigger('processExperienceQueue').timeBased().everyMinutes(1).create();
}

// Independent helpers support the deployed legacy golf script without changing its behavior.
function experienceLedgerSnapshot_(name) {
  var s=book_().getSheetByName(name);if(!s)throw new Error(name+'なし');
  var w=s.getLastColumn(), n=Math.max(s.getLastRow(),2), range=s.getRange(1,1,n,w);
  var values=range.getValues(), formulas=range.getFormulas();
  if(values[0][0]!=='予約・案件ID')throw new Error(name+'のID見出しが変更されています');
  return {sheet:s,headers:values[0],values:values,formulas:formulas,width:w};
}
// Formula-only template rows are vacant; any manual input reserves the row.
function experienceLedgerSlot_(t,id,fields) {
  Object.keys(fields).forEach(function(k){if(t.headers.indexOf(k)<0)throw new Error('台帳の見出しがありません: '+k);});
  var matches=[];t.values.forEach(function(r,i){if(i&&String(r[0])===id)matches.push(i+1);});
  if(matches.length>1)throw new Error('台帳の案件IDが重複しています');
  if(matches.length)return matches[0];
  for(var i=1;i<t.values.length;i++)if(t.values[i].every(function(v,c){return !!t.formulas[i][c]||v===''||v===null;}))return i+1;
  return t.values.length+1;
}
// New/retried registration fills empty inputs only. Explicit state transitions
// supply expected previous values; staff edits and formulas are never replaced.
function experienceUpsert_(sheetName,id,fields,expected) {
  var t=experienceLedgerSnapshot_(sheetName), s=t.sheet, row=experienceLedgerSlot_(t,id,fields);
  if(row>s.getMaxRows()) {
    var prev=s.getMaxRows();s.insertRowsAfter(prev,1);
    var src=s.getRange(prev,1,1,t.width), dest=s.getRange(row,1,1,t.width);
    src.copyTo(dest,SpreadsheetApp.CopyPasteType.PASTE_FORMAT,false);
    src.copyTo(dest,SpreadsheetApp.CopyPasteType.PASTE_DATA_VALIDATION,false);
    src.getFormulasR1C1()[0].forEach(function(f,c){if(f)s.getRange(row,c+1).setFormulaR1C1(f);});
  }
  // Re-read immediately before writing; don't use a stale row snapshot.
  var range=s.getRange(row,1,1,t.width), current=range.getValues()[0], formulas=range.getFormulas()[0];
  if(current[0]&&String(current[0])!==id)throw new Error('台帳行が変更されました');
  if(!current[0]&&current.some(function(v,c){return !formulas[c]&&v!==''&&v!==null;}))throw new Error('空き行に手動入力があります');
  if(!current[0])s.getRange(row,1).setValue(id);
  Object.keys(fields).forEach(function(k){
    var c=t.headers.indexOf(k), allow=expected&&expected[k];
    if(formulas[c])return;
    if(current[c]===''||current[c]===null||(allow&&allow.indexOf(current[c])>=0))s.getRange(row,c+1).setValue(literal_(fields[k]));
  });
  range.setWrap(true);s.setRowHeight(row,72);return row;
}
