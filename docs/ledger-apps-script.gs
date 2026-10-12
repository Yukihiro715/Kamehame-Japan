/**
 * KAMEHAME JAPAN 顧客対応台帳 — 自動登録スクリプト
 *
 * サイトのフォームから予約リクエストが届くたびに、Cloudflare Worker がこの
 * ウェブアプリに JSON を1件 POST します。ここで「予約一覧」と「手配・体験詳細」
 * に1行ずつ追加します。既存の行には触れません。
 *
 * 設置手順は docs/LEDGER_SYNC.md。
 */

var SHEET_MAIN = "予約一覧";
var SHEET_DETAIL = "手配・体験詳細";
var OWNER = "ゆきひろ";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var r = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var main = ss.getSheetByName(SHEET_MAIN);
    var detail = ss.getSheetByName(SHEET_DETAIL);
    if (!main || !detail) throw new Error("シートが見つかりません: " + SHEET_MAIN + " / " + SHEET_DETAIL);

    var id = nextId_(main, r);
    var received = (r.receivedAt || "").slice(0, 10).replace(/-/g, "/");
    var expDate = r.experienceDate ? r.experienceDate.replace(/-/g, "/") : "";
    var dueDate = addDays_(received, 1);
    var isTrade = r.kind === "trade";

    // 予約一覧 A:Z (U 見込粗利 は数式列なので空のまま)
    var mainRow = [
      id,                                             // A 予約・案件ID
      isTrade && r.company ? r.name + " / " + r.company : r.name, // B お客様名／窓口
      r.category || "",                               // C 体験カテゴリ
      isTrade ? "対応不要" : "受付",                     // D 予約状況
      expDate,                                        // E 体験日
      r.party || "",                                  // F 人数
      isTrade ? "未請求" : "入金未確認",                  // G 支払い状況
      isTrade ? "取引条件を返信" : "パートナーに空き確認 → コース・料金・条件と決済リンクを送付", // H 次のアクション
      dueDate,                                        // I 対応期限
      OWNER,                                          // J 担当
      received,                                       // K 最終連絡日(自動返信)
      received,                                       // L 受付日
      isTrade ? "旅行会社・代理店" : "Webフォーム",         // M 受付経路
      langJa_(r.lang),                                // N 対応言語
      r.email || "",                                  // O メール
      r.phone || "",                                  // P 電話／WhatsApp
      r.estimate || "",                               // Q サイト概算（税込）
      "",                                             // R 提示額（税込）
      "",                                             // S 入金額
      "",                                             // T 仕入総額（税込）
      null,                                           // U 見込粗利（自動）: 触らない
      "",                                             // V 支払日
      r.freeCancelUntil ? r.freeCancelUntil.replace(/-/g, "/") : "", // W 顧客の無料取消期限
      "",                                             // X キャンセル・失注理由
      "",                                             // Y 確認メールURL
      "自動登録(サイトフォーム " + (r.receivedAt || "") + ")。自動返信" + (r.ackSent ? "送信済み" : "未送信") + "、担当者フォローアップ" + (r.followUpScheduled ? "予約済み" : "なし") + "。" // Z 確認メモ
    ];
    appendRow_(main, mainRow);

    // 手配・体験詳細 A:U (B お客様名 は数式列の場合があるので空のまま)
    var wants = [r.messageJa ? r.messageJa : "", r.message ? "(原文) " + r.message : ""].filter(String).join("\n");
    var rentals = [r.rental || "", r.clubs ? "クラブ希望: " + (r.clubsJa || r.clubs) : ""].filter(String).join("\n");
    var pickup = [r.pickupJa || r.pickup || "", r.departure ? "出発 " + r.departure : ""].filter(String).join("／");
    var detailRow = [
      id,                                             // A 予約・案件ID
      null,                                           // B お客様名（自動）: 触らない
      r.area || "",                                   // C エリア
      r.courseMode === "specific" ? "希望コース指定: " + (r.course || "") : "", // D 会場・コース・店舗
      [r.experienceTitle || "", r.plan || "", r.courseMode === "recommended" ? "おすすめコース(標準料金)" : ""].filter(String).join("／"), // E 体験名／プラン内容
      r.departure || "",                              // F 集合・出発時刻
      "",                                             // G 体験開始時刻
      pickup,                                         // H 集合・送迎場所
      r.party ? r.party + "名" : "",                   // I 人数内訳
      r.name,                                         // J 参加者氏名・国籍
      [wants, r.level ? "ゴルフ経験: " + r.level : "", r.interpreter ? "通訳: " + r.interpreter : ""].filter(String).join("\n"), // K 希望・アレルギー等
      rentals,                                        // L レンタル・持参品
      r.addons || "",                                 // M 追加オプション
      r.partner || "",                                // N パートナー
      "未着手",                                        // O 手配状況
      "",                                             // P 原価内訳・未確定費用
      "",                                             // Q 仕入先の取消料開始日
      r.freeCancelUntil ? "顧客: " + r.freeCancelUntil.replace(/-/g, "/") + " まで無料(サイト規定)" : "", // R キャンセル条件
      "",                                             // S 決済リンク
      "",                                             // T 申込・問い合わせ原本
      r.priceNote || ""                               // U 手配メモ・未確認事項
    ];
    appendRow_(detail, detailRow);

    return ContentService.createTextOutput(JSON.stringify({ ok: true, id: id })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/** KJ-YYMMDD-NN(体験日ベース)。体験日がない問い合わせは KJ-INQ-YYMMDD-NN(受付日ベース)。 */
function nextId_(sheet, r) {
  var base = r.experienceDate ? "KJ-" + r.experienceDate.slice(2).replace(/-/g, "") : "KJ-INQ-" + (r.receivedAt || "").slice(2, 10).replace(/-/g, "");
  var ids = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1).getValues().map(function (v) { return String(v[0]); });
  var n = 0;
  ids.forEach(function (v) {
    var m = v.match(new RegExp("^" + base + "-(\\d+)$"));
    if (m) n = Math.max(n, parseInt(m[1], 10));
  });
  return base + "-" + ("0" + (n + 1)).slice(-2);
}

/** 既存の数式列(null)を壊さずに、最終行の次に書き込む。 */
function appendRow_(sheet, row) {
  var target = sheet.getLastRow() + 1;
  for (var c = 0; c < row.length; c++) {
    if (row[c] === null) continue;
    sheet.getRange(target, c + 1).setValue(row[c]);
  }
}

function langJa_(code) {
  return { en: "英語", ja: "日本語", es: "スペイン語", fr: "フランス語", "zh-tw": "繁体字中国語" }[code] || code || "";
}

function addDays_(ymd, days) {
  if (!ymd) return "";
  var p = ymd.split("/");
  var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2] + days));
  return d.getUTCFullYear() + "/" + ("0" + (d.getUTCMonth() + 1)).slice(-2) + "/" + ("0" + d.getUTCDate()).slice(-2);
}

/** 動作確認用: エディタから実行すると「予約一覧」にテスト行を1件追加します。 */
function testAppend() {
  var sample = {
    receivedAt: "2026-10-12 10:00", kind: "guest", name: "TEST Golfer (please ignore)", email: "test@example.com", lang: "en",
    experienceSlug: "mt-fuji-golf-day", experienceTitle: "東京発 プライベートゴルフ", category: "プライベートゴルフ",
    area: "東京近郊", areaId: "tokyo", courseMode: "recommended", dates: "2026-11-30 07:00", experienceDate: "2026-11-30", departure: "07:00",
    party: "2", pickup: "Park Hyatt Tokyo", pickupJa: "パークハイアット東京", level: "Casual", rental: "ゴルファー1: 必要(右利き) · ゴルファー2: 持参する",
    clubs: "One ladies set", clubsJa: "レディース1セット", estimate: "¥250,000", priceNote: "¥250,000 — 2名パッケージ(東京近郊・おすすめコース)",
    message: "We would like a caddie.", messageJa: "キャディをお願いします。", freeCancelUntil: "2026-11-23 18:00", partner: "Rion Japan",
    ackSent: true, followUpScheduled: true
  };
  var out = doPost({ postData: { contents: JSON.stringify(sample) } });
  Logger.log(out.getContent());
}
