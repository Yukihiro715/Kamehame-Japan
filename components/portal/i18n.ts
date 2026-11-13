"use client";

/** The partner portal's languages (docs/PARTNER_PLATFORM.md 5). Japanese is
 *  the source; English is kept complete by the type. The choice lives in the
 *  user's profile (`users.lang`) and in localStorage before sign-in. The
 *  operations portal stays Japanese. */
export type PortalLang = "ja" | "en";
export const PORTAL_LANGS: PortalLang[] = ["ja", "en"];
export const PORTAL_LANG_NAME: Record<PortalLang, string> = { ja: "日本語", en: "English" };

const ja = {
  brand: { partner: "パートナー向け管理画面", ops: "運営", loginPartner: "パートナー向け管理画面", loginOps: "運営画面" },
  nav: { dashboard: "サマリー", reservations: "予約実績・紹介料", cases: "代理予約・相談", experiences: "体験を探す", materials: "QR・紹介リンク", settlement: "紹介料・精算", guide: "使い方" },
  shell: { signOut: "サインアウト", chooseSite: "拠点を選ぶ", noSite: "閲覧できる拠点がありません。KAMEHAME JAPAN にお問い合わせください。", footer: "KAMEHAME JAPAN パートナー向け管理画面 · 株式会社プロセント · お問い合わせ hello@kamehame-japan.com", language: "言語" },
  login: { h: "サインイン", email: "メールアドレス", note: "パスワードはありません。登録されたメールアドレスに6桁のコードをお送りします。", send: "コードを送る", code: "6桁のコード", signIn: "サインイン", changeEmail: "アドレスを変える", devNote: "検証環境: メールは送らず、コードをここに表示しています。", sentNote: "登録済みのアドレスなら、6桁のコードをメールでお送りしました。届かない場合は迷惑メールもご確認ください。", codeLabel: "コード" },
  common: { retry: "再読み込み", loading: "読み込み中…", empty: "該当するデータはありません。", search: "検索", clear: "条件を消す", save: "保存", cancel: "やめる", open: "開く", detail: "詳細", back: "一覧へ", copy: "URL をコピー", copied: "コピーしました", copyFailed: "コピーできませんでした。表示されているURLを選択してコピーしてください。", send: "送信", sending: "送信中…", run: "実行", reasonRequired: "理由（必須）", reasonOptional: "理由（任意）", all: "すべて", undecided: "未定", none: "—", yes: "○", items: (n: number) => `${n} 件`, updated: "更新", created: "登録", taxIncl: "税込", taxExcl: "税抜" },
  period: { this_month: "今月", last_month: "先月", this_quarter: "当四半期", last_quarter: "前四半期", from: "開始日", to: "終了日", show: "表示" },
  errors: { password_invalid: "IDまたはパスワードが違います。初めての方は初回設定を行ってください。", password_locked: "試行回数の上限です。15分ほど待ってからお試しください。", password_reset_invalid: "リンクの有効期限・パスワードの文字数（12〜128文字）をご確認ください。", demo_invalid: "IDまたはパスワードが違います。", demo_locked: "試行回数の上限です。15分ほど待ってからお試しください。", demo_read_only: "デモは閲覧専用です。", unauthenticated: "サインインしてください。", forbidden: "この操作の権限がありません。", not_found: "見つかりません。", ledger_unavailable: "台帳データベースに接続できません。", invalid: "コードが違います。", expired: "コードの有効期限が切れました。もう一度コードを送ってください。", locked: "試行回数の上限です。もう一度コードを送ってください。", reason_required: "理由を入力してください。", unknown_experience: "体験が見つかりません。", feature_off: "この拠点ではこの機能が使えません。", case_locked: "決済後の変更は運営へご連絡ください。", case_closed: "終了した案件です。", customer_name_required: "お客様の代表者名を入力してください。", bad_email: "メールアドレスが正しくありません。", bad_guests: "人数が正しくありません。", body_required: "本文か添付が必要です。", too_large: "ファイルが大きすぎます。", bad_type: "PDF・画像・テキストのみ添付できます。", media_unavailable: "添付の保存先が未設定です。", generic: "エラーが発生しました。" },
  status: {
    reservation: { provisional: "仮予約", arranging: "手配中", confirmed: "予約確定", completed: "実施済み", cancelled: "キャンセル", no_show: "未実施" },
    payment: { unpaid: "未決済", partial: "一部決済", paid: "決済済み", partially_refunded: "一部返金", refunded: "全額返金", disputed: "支払紛争" },
    entry: { estimated: "見込", pending: "確認待ち", confirmed: "確定", voided: "取消", adjusted: "確定（調整あり）" },
    hold: { rate_missing: "料率未設定", payee_missing: "精算先未設定", performed_in_future: "実施日時が未来", amount_pending: "対象金額未確定", payment_incomplete: "決済未完了", dispute_open: "紛争中", refund_allocation: "返金配賦待ち" },
    statement: { draft: "下書き", issued: "発行済み・確認待ち", acknowledged: "確認済み", disputed: "異議あり", settled: "支払済み", void: "無効（訂正済み）" },
    dispute: { open: "回答待ち", upheld: "訂正されます", rejected: "原案どおり", withdrawn: "取り下げ" },
    kase: { received: "受付済み", checking: "空き・条件確認中", proposed: "提案済み", awaiting_customer: "お客様の回答待ち", awaiting_payment: "支払い待ち", paid: "決済済み・予約確定待ち", confirmed: "予約確定", performed: "実施済み", cancelled: "キャンセル", unavailable: "手配不可" },
    quote: { draft: "下書き", shared: "共有中", paid: "決済済み", superseded: "旧版", expired: "期限切れ", void: "取消" },
    paymentMode: { stripe: "オンライン決済（カード）", external: "提携先への支払い（運営が決済済みを登録）", none: "決済なし（現地払いのみ）" },
    visibility: { internal: "運営内部", partner: "パートナーと運営", customer: "お客様にも表示" },
    lineKind: { base: "基本料金", addon: "オプション", arrangement: "手配料", onsite: "現地払い" },
    medium: { brochure: "パンフレット", room_tv: "客室TV", front: "フロント", web: "Web", other: "共通" },
    bookingMode: { instant: "予約する", request: "空きを確認する", quote: "見積もりを依頼する" },
    bookingModeTag: { instant: "即時予約", request: "リクエスト予約", quote: "見積もり型" },
    lang: { en: "英語", ja: "日本語", es: "スペイン語", fr: "フランス語", "zh-tw": "繁体字中国語" },
    estimatedNote: "見込・精算対象外",
  },
  dashboard: {
    title: (site: string) => `${site} の実績`, period: (from: string, to: string, at: string) => `期間 ${from} 〜 ${to}（日本時間）· 更新 ${at}`, funnel: "集客・予約状況", confirmedH: "確定実績・精算（体験実施後）",
    accesses: "リンクが開かれた回数", accessesNote: "QR・紹介リンクの合計。繰り返し開いた分も含みます", visits: "重複をまとめた訪問回数", visitsNote: "同じブラウザ・同じリンクへの30分以内の再訪を1回に集計。人数ではありません", provisional: "仮予約件数", provisionalNote: "予約作成日で集計", confirmed: "予約確定件数", paid: "決済済み件数", fullyRefunded: (n: number) => `全額返金 ${n} 件`, cancelled: "キャンセル件数",
    estimated: "未実施予約の見込紹介料（税抜）", estimatedNote: "見込・精算対象外", performed: "実施確認済み件数", performedNote: "実施日で集計", baseNet: "実施済み予約の税抜対象売上", commissionNet: "確定税抜紹介料", taxRef: (v: string) => `税込参考 ${v}`, unpaid: "確定未払残高（税抜）", unpaidNote: (v: string) => `現在残高 · 税込参考 ${v}`, paidOut: "支払い済み合計（振込額）", paidOutNote: "全四半期・振込手数料控除後",
    note: "「決済済み」は確定実績ではありません。紹介料は体験の実施確認後に確定し、四半期ごとに精算します。正式な税額と支払額は精算書に表示します。",
  },
  reservations: {
    title: "予約実績・紹介料一覧", from: "予約日（から）", to: "予約日（まで）", xFrom: "体験日（から）", xTo: "体験日（まで）", status: "予約状況", ref: "照合番号",
    note: "税込参考額は目安で、正式な税額は精算書に表示します。お客様の個人情報は表示しません。",
    head: ["照合番号", "予約日", "体験", "体験日", "人数", "予約状況", "決済状況", "対象額（税抜）", "料率", "紹介料（税抜）", "税込参考", "精算状態"],
  },
  experiences: {
    title: "体験一覧と紹介条件", referable: "紹介可", notReferable: "紹介対象外・設定待ち",
    note: "予約方式: 「予約する」は日程が空いていればそのまま、「空きを確認する」は会場の確認後に確定、「見積もりを依頼する」は人数・条件で料金が変わる体験です。いずれも取り次ぎ案件として登録すると、KAMEHAME JAPAN が空き確認と見積もりを行います。基本料金は税込です。紹介料は「割引後の対象料金（税抜）× 紹介料率」で、現地払い・追加オプション・別途手配費は含みません。目安は基本料金1単位で計算したもので、実際の人数・割引で変わります。参考予約単価は実績がない間は運営の入力値です。",
    basePrice: "基本料金", perGroup: "（税込・1組）", perPerson: "（税込・1名）", refAvg: "参考予約単価", rate: "紹介料率", example: "紹介料の目安（税抜）", linkUrl: "紹介URL", getQr: "QRを取得", getLink: "この体験の紹介リンクを取得",
  },
  materials: {
    allTitle: "全体験一覧へのQRコードとリンク", note: "QRは印刷物に、リンクはメールやWebに。QRとリンクは別の識別子で、どちらから来たかを区別します（QR用URLをそのまま共有された場合もQR経由に数えます）。印刷後に掲載する体験を変えても、同じQRのまま使えます。QRにお客様や口座の情報は入りません。",
    issue: "QRコードとリンクを発行する", qrAlt: "全体験一覧のQRコード", qrPrint: "QRコード（印刷用）", qrContent: "QRの中身", linkCopy: "紹介リンク（コピー用）", copyLink: "リンクをコピー",
    perTitle: "体験別のQRコードとリンク", perNote: "体験を選んで、この画面からQRとリンクを発行できます。体験一覧からも発行できます。", perHead: ["対象", "種類", "URL", "QR", "発行日"], perEmpty: "体験別のリンクはまだありません。", link: "リンク",
    brochure: "パンフレット", brochureOpen: "最新のパンフレット（PDF）を開く", brochureSoon: "準備中です。用意でき次第ここに表示されます。", issuedTitle: "KAMEHAME JAPAN が発行した媒体別リンク", issuedHead: ["ラベル", "媒体", "対象", "種類", "URL", "QR"], allExperiences: "全体験一覧",
  },
  settlement: {
    title: "精算", unpaid: "確定未払残高（税抜）", taxRef: (v: string) => `税込参考 ${v}`, paid: "お支払い済み額（税込）", minPayout: "最低お支払額（税込）", minPayoutNote: "未満は次回へ繰越",
    note: "精算は暦四半期（1–3月、4–6月、7–9月、10–12月）ごとに、実施確認済みの紹介料を集計した「お支払い通知書」を KAMEHAME JAPAN が発行し、翌月末にお振込みします（貴社からの請求書は不要です）。通知書の内容に相違がある場合は、記載の期限までに異議をお申し立てください。", feeNote: (v: string) => ` 振込手数料（${v}）は貴社ご負担として振込額から差し引きます。`,
    statements: "お支払い通知書", head: ["期間", "版", "状態", "税込合計", "前期繰越", "お振込額", "次回繰越", "振込予定日", "異議期限", ""], empty: "お支払い通知書はまだありません。四半期の締め後に発行されます。", billingOnly: "通知書の確認・異議申立ては、請求担当者の権限を持つ方だけが行えます。",
    profileTitle: "精算・振込設定", profileName: "設定名", bank: "振込口座", bankMissing: "未登録（KAMEHAME JAPAN にご連絡ください）", disputeDays: "異議申立て期限", disputeDaysV: (n: number) => `発行から ${n} 日`, noProfile: "精算設定がまだありません。KAMEHAME JAPAN が登録します。", lastUpdated: "最終更新",
    periodLabel: (y: string, q: string) => `${y}年 第${q}四半期（${(Number(q) - 1) * 3 + 1}〜${Number(q) * 3}月）`,
  },
  statement: {
    title: "お支払い通知書", csv: "明細 CSV", print: "印刷 / PDF保存", issued: "発行", deadline: "異議申立て期限", acknowledged: "確認", settled: "お支払い完了", ack: "内容を確認しました", ackDone: "確認しました。記載の予定日にお振込みします。",
    disputeTarget: "異議の対象", whole: "通知書全体", reason: "理由", reasonPh: "相違点をお書きください", dispute: "異議を申し立てる", disputeDone: "異議を受け付けました。KAMEHAME JAPAN から回答します。", billingOnly: "確認・異議申立ては請求担当者の権限が必要です。", disputesHead: ["日時", "対象", "理由", "状態", "回答"], item: "明細",
    sheet: { h: "紹介料 お支払い通知書", period: "対象期間", revision: (v: number) => `訂正版 ${v}`, no: "通知書番号", issuedOn: "発行日", unissued: "（未発行・下書き）", to: "宛先", toSuffix: " 御中", regNo: "登録番号", profile: "精算設定", payee: "振込先名義", from: "発行者", company: "株式会社プロセント",
      net: "紹介料（税抜）", tax: "消費税（10%・合計に対して1回計算）", gross: "税込合計", carriedIn: "前期からの繰越", payable: "お支払い対象額", carriedOutRefund: "返金による差額", carriedOutMin: (v: string) => `最低お支払額 ${v} 未満`, carriedOut: (why: string) => `次回への繰越（${why}）`, fee: (who: string) => `振込手数料（${who}）`, feeHotel: "貴社ご負担", feeUs: "当社負担", transfer: "お振込額", payDate: "お振込予定日", noTransfer: "今回のお振込はありません",
      itemsHead: ["区分", "実施日", "照合番号", "体験", "紹介元", "対象額（税抜）", "料率", "金額（税抜）", "備考"], noItems: "明細はありません。", entry: "紹介料", adjustment: "前期訂正",
      note1: "紹介料は、実施確認済みの予約について、割引・返金反映後の税抜金額に契約料率を乗じ、予約ごとに1回四捨五入して算出しています。消費税は通知書の合計に対して1回計算します。", note2: (v: string) => `お支払い対象額が最低お支払額（税込 ${v}）に満たない場合、および返金等で差額がマイナスになった場合は、次回の通知書に繰り越して合算・相殺します。`, note3: (d: string) => `内容に相違がある場合は ${d} までにパートナー向け管理画面からお知らせください。期限までにご連絡がない場合は、ご確認いただいたものとしてお支払い手続きを進めます。`, note4: "本通知書は KAMEHAME JAPAN（株式会社プロセント）が作成する支払通知書であり、貴社からの請求書のご提出は不要です。税務上の記載事項はご契約条件に従います。" },
  },
  cases: {
    title: "取り次ぎ案件", newCase: "新しい案件を登録", openOnly: "進行中のみ", showAll: "終了分も表示",
    intro: "お客様のご希望を登録すると、KAMEHAME JAPAN が空き確認と見積もりを行い、お客様向けの見積もり・決済ページを用意します。お客様が別の端末で決済しても、貴社からの紹介として記録されます。", managerNote: "拠点管理者のため、拠点の全案件が表示されます。", agentNote: "ご自身が登録または担当する案件が表示されます。",
    noAccess: "この拠点では予約取り次ぎが使えないか、取り次ぎの役割が割り当てられていません。KAMEHAME JAPAN にお問い合わせください。",
    head: ["案件", "状態", "体験", "希望日", "人数", "お客様", "見積もり", "担当", "更新", ""], emptyOpen: "進行中の案件はありません。", emptyAll: "案件はまだありません。", version: (v: number) => `第${v}版`,
    newTitle: "案件を登録", wishes: "ご希望の内容", kind: "種類", kindExperience: "掲載中の体験・ツアー", kindFree: "自由相談（内容を備考に）", experience: "体験", date: "希望日", altDates: "代替日（カンマ区切り、最大5つ）", timePref: "時間帯の希望", timePh: "午後、10時ごろ など", guests: "人数", lang: "お客様の希望言語", requirements: "希望条件・備考", requirementsPh: "食事制限、記念日、移動の都合、予算感など", extraH: "この商品の追加項目",
    customerH: "お客様と担当", customerNote: "相談の段階では代表者名だけで登録できます。連絡先は予約に必要になった時点で追加してください。お客様向けの見積もりメールは、メールアドレスがある場合に運営から送れます。", customerName: "お客様の代表者名（必須）", email: "メールアドレス", phone: "電話番号", country: "国・地域", assignee: "貴社の担当者", partnerRef: "貴社の管理番号（任意）", submit: "案件を登録する", submitting: "登録中…", backToList: "一覧へ戻る",
    facts: { experience: "体験", free: "（自由相談・運営が商品を決めます）", date: "希望日", alt: (d: string) => `（代替 ${d}）`, guests: "人数", lang: "希望言語", customer: "お客様", noEmail: "メール未登録", requirements: "希望条件・備考", assignee: "担当", ref: "管理番号" },
    next: { received: "KAMEHAME JAPAN が内容を確認します。", checking: "運営が空き・条件を確認しています。質問があれば下の連絡欄に届きます。", proposed: "見積もりを共有しました。お客様向け URL をお渡しください（オンライン決済なし）。", awaiting_customer: "お客様の回答をお待ちしています。回答が届いたら連絡欄でお知らせください。", awaiting_payment: "お客様向け URL をお渡しください。お客様がページから決済すると自動で進みます。", paid: "決済を確認しました。運営が空き枠を確保し、予約確定を登録します。", confirmed: "予約が確定しました。集合場所・当日の案内は連絡欄をご覧ください。", performed: "実施済みです。紹介料は実施確認後に確定し、四半期の精算に載ります。", cancelled: "キャンセルされました。", unavailable: "手配できませんでした。理由は連絡欄をご覧ください。" },
    customerUrl: "お客様向け URL", edit: "お客様情報・希望を編集", withdraw: "案件を取り下げる", withdrawConfirm: "取り下げる", withdrawPh: "理由（お客様の都合、日程変更など）", withdrawn: "取り下げました。", saved: "保存しました。", meta: (c: string, u: string, by: string) => `登録 ${c} · 更新 ${u} · 登録者 ${by}`,
    quotes: "見積もり", noQuotes: "運営が見積もりを作成・共有するとここに表示されます。", ledger: "予約・紹介料", ledgerNote: "見積もりを共有すると予約台帳に仮予約が作られ、紹介元はこの案件の拠点に固定されます。", reservation: "予約", amountCheck: "金額要確認", commission: "紹介料", messagesH: "連絡・資料",
    quote: { version: (v: number) => `第${v}版`, created: "作成", shared: "共有", paid: "決済", head: ["区分", "内容", "単価", "数量", "金額（税込）", "紹介対象"], onsite: "（現地）", total: "お支払い総額（税込）", onsiteTotal: "現地払い合計", payment: "お支払い", validUntil: "有効期限", includes: "含まれるもの", excludes: "含まれないもの", onsiteNote: "現地払いの条件", cancel: "キャンセル条件", confirmation: "予約確定の条件", commissionL: "紹介料（パートナー限定）", noPolicy: "料率未設定（運営が設定すると表示されます）", commissionV: (base: string, rate: string, est: string) => `対象額 ${base}（税抜） × ${rate} = 見込み ${est}（税抜）。実施確認後に確定します。` },
    thread: { none: "まだ連絡はありません。", ops: "KAMEHAME 運営", partner: "パートナー", system: "システム", compose: "運営への連絡", composeOps: "連絡・メモ", composePh: "質問、条件の変更、お客様からの回答など", composePhOps: "条件の確認、集合場所、当日の連絡先など", visibility: "表示範囲", visInternal: "運営内部（パートナーに見えない）", visPartner: "パートナーと運営", visCustomer: "お客様にも表示（見積もりページに添付を掲載）", attach: "添付（PDF・画像、15MB まで）", uploadFail: "アップロードに失敗しました。" },
    ledgerRow: (base: string, rate: string, c: string) => `対象額 ${base}（税抜） × ${rate} = ${c}（税抜）`,
  },
  guide: {
    title: "使い方", lead: "KAMEHAME JAPAN のパートナー向け管理画面は、提携パートナー（ホテル・旅行代理店・ガイド）がお客様に日本の体験を紹介し、その紹介料を受け取るための画面です。言語は右上で切り替えられ、メールも同じ言語で届きます。",
    sections: [
      ["実績", "QR・リンク経由のアクセス、予約、決済、実施確認済みの紹介料を期間で確認します。「決済済み」は確定実績ではなく、紹介料は体験の実施確認後に確定します。"],
      ["予約実績・紹介料", "貴社の紹介で生まれた予約の一覧です。照合番号（R-XXXXXX）で運営とやり取りできます。お客様の個人情報は表示しません。"],
      ["代理予約・相談", "お客様のご希望を案件として登録すると、KAMEHAME JAPAN が空き確認と見積もりを行い、お客様向けの見積もり・決済ページ（URL）を用意します。案件から生まれた予約の紹介元は貴社の拠点に固定され、お客様が別の端末で決済しても変わりません。運営とのやり取り・資料共有は案件ページの連絡欄で行います。"],
      ["体験一覧", "紹介できる体験と条件（基本料金、紹介料率、目安）です。各体験の紹介リンクを取得したり、取り次ぎ案件を登録したりできます。"],
      ["QR・リンク", "印刷物用の QR コードとメール・Web 用のリンクです。どちらから来たかを区別して集計します。"],
      ["精算", "暦四半期ごとに、実施確認済みの紹介料をまとめた「お支払い通知書」を KAMEHAME JAPAN が発行し、翌月末にお振込みします（貴社からの請求書は不要です）。内容に相違があれば期限までに異議を申し立ててください。最低お支払額（税込 3,000 円）未満は次回へ繰り越します。"],
      ["紹介料の計算", "割引・返金を反映した税抜の対象金額 × 契約料率を、予約ごとに四捨五入します。現地払い・追加オプション・手配費は対象外です。消費税は通知書の合計に対して 1 回計算します。"],
      ["サインイン", "パスワードはありません。登録されたメールアドレスに届く 6 桁のコードでサインインします。担当者の追加は KAMEHAME JAPAN（hello@kamehame-japan.com）にご依頼ください。"],
    ] as [string, string][],
  },
};
type Dict = typeof ja;

const en: Dict = {
  brand: { partner: "Partner portal", ops: "Operations", loginPartner: "Partner portal", loginOps: "Operations" },
  nav: { dashboard: "Results", reservations: "Bookings & commissions", cases: "Bookings on behalf of guests", experiences: "Experiences", materials: "QR & links", settlement: "Settlement", guide: "Guide" },
  shell: { signOut: "Sign out", chooseSite: "Choose a site", noSite: "There is no site you can view. Please contact KAMEHAME JAPAN.", footer: "KAMEHAME JAPAN partner portal · Prosent Inc. · hello@kamehame-japan.com", language: "Language" },
  login: { h: "Sign in", email: "E-mail address", note: "There is no password. We e-mail a six-digit code to your registered address.", send: "Send code", code: "Six-digit code", signIn: "Sign in", changeEmail: "Change address", devNote: "Staging: no mail is sent; the code is shown here.", sentNote: "If the address is registered, a six-digit code is on its way. Check your spam folder if it does not arrive.", codeLabel: "Code" },
  common: { retry: "Try again", loading: "Loading…", empty: "Nothing to show.", search: "Search", clear: "Clear", save: "Save", cancel: "Cancel", open: "Open", detail: "Details", back: "Back to list", copy: "Copy URL", copied: "Copied", copyFailed: "Could not copy. Select and copy the displayed URL instead.", send: "Send", sending: "Sending…", run: "Confirm", reasonRequired: "Reason (required)", reasonOptional: "Reason (optional)", all: "All", undecided: "TBD", none: "—", yes: "Yes", items: (n: number) => `${n} item${n === 1 ? "" : "s"}`, updated: "Updated", created: "Created", taxIncl: "tax incl.", taxExcl: "tax excl." },
  period: { this_month: "This month", last_month: "Last month", this_quarter: "This quarter", last_quarter: "Last quarter", from: "From", to: "To", show: "Show" },
  errors: { password_invalid: "Incorrect ID or password. First-time users must set up a password.", password_locked: "Too many attempts. Try again in 15 minutes.", password_reset_invalid: "Invalid or expired link, or password outside 12–128 characters. Request a new link if needed.", demo_invalid: "Incorrect ID or password.", demo_locked: "Too many attempts. Please try again in 15 minutes.", demo_read_only: "The demo is read only.", unauthenticated: "Please sign in.", forbidden: "You do not have permission for this.", not_found: "Not found.", ledger_unavailable: "The ledger database is unavailable.", invalid: "The code is wrong.", expired: "The code has expired. Request a new one.", locked: "Too many attempts. Request a new code.", reason_required: "Please give a reason.", unknown_experience: "Experience not found.", feature_off: "This site does not have this feature.", case_locked: "After payment, please contact KAMEHAME JAPAN for changes.", case_closed: "This case is closed.", customer_name_required: "Please enter the customer's name.", bad_email: "The e-mail address is not valid.", bad_guests: "The number of guests is not valid.", body_required: "A message or an attachment is needed.", too_large: "The file is too large.", bad_type: "Only PDF, images and text files can be attached.", media_unavailable: "Attachments are not configured.", generic: "Something went wrong." },
  status: {
    reservation: { provisional: "Provisional", arranging: "Arranging", confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled", no_show: "No-show" },
    payment: { unpaid: "Unpaid", partial: "Partly paid", paid: "Paid", partially_refunded: "Partly refunded", refunded: "Refunded", disputed: "Disputed" },
    entry: { estimated: "Estimated", pending: "Pending check", confirmed: "Confirmed", voided: "Voided", adjusted: "Confirmed (adjusted)" },
    hold: { rate_missing: "rate not set", payee_missing: "payee not set", performed_in_future: "date in the future", amount_pending: "amount pending", payment_incomplete: "payment incomplete", dispute_open: "dispute open", refund_allocation: "refund to allocate" },
    statement: { draft: "Draft", issued: "Issued, awaiting review", acknowledged: "Acknowledged", disputed: "Disputed", settled: "Paid", void: "Void (revised)" },
    dispute: { open: "Awaiting reply", upheld: "Will be corrected", rejected: "Stands as issued", withdrawn: "Withdrawn" },
    kase: { received: "Received", checking: "Checking availability", proposed: "Quote shared", awaiting_customer: "Awaiting customer", awaiting_payment: "Awaiting payment", paid: "Paid, awaiting confirmation", confirmed: "Booking confirmed", performed: "Completed", cancelled: "Cancelled", unavailable: "Not available" },
    quote: { draft: "Draft", shared: "Shared", paid: "Paid", superseded: "Superseded", expired: "Expired", void: "Withdrawn" },
    paymentMode: { stripe: "Online card payment", external: "Paid to the partner operator (recorded by KAMEHAME)", none: "No online payment (paid on the day)" },
    visibility: { internal: "Operations only", partner: "Partner and operations", customer: "Shown to the customer too" },
    lineKind: { base: "Base price", addon: "Option", arrangement: "Arrangement fee", onsite: "Paid on the day" },
    medium: { brochure: "Brochure", room_tv: "Room TV", front: "Front desk", web: "Web", other: "General" },
    bookingMode: { instant: "Book", request: "Check availability", quote: "Request a quote" },
    bookingModeTag: { instant: "Instant booking", request: "On request", quote: "Quoted" },
    lang: { en: "English", ja: "Japanese", es: "Spanish", fr: "French", "zh-tw": "Traditional Chinese" },
    estimatedNote: "estimate, not yet payable",
  },
  dashboard: {
    title: (site: string) => `Results for ${site}`, period: (from: string, to: string, at: string) => `${from} to ${to} (Japan time) · updated ${at}`, funnel: "Traffic and bookings", confirmedH: "Confirmed results and settlement (after the experience)",
    accesses: "Link opens", accessesNote: "QR and referral links, including repeat opens", visits: "Visits excluding repeat opens", visitsNote: "Same browser and link within 30 minutes count once. Not unique people.", provisional: "Provisional bookings", provisionalNote: "By booking date", confirmed: "Confirmed bookings", paid: "Paid bookings", fullyRefunded: (n: number) => `${n} fully refunded`, cancelled: "Cancellations",
    estimated: "Estimated commission, not yet performed (tax excl.)", estimatedNote: "Estimate, not yet payable", performed: "Experiences performed", performedNote: "By date performed", baseNet: "Commissionable sales, performed (tax excl.)", commissionNet: "Confirmed commission (tax excl.)", taxRef: (v: string) => `${v} with tax, for reference`, unpaid: "Confirmed, unpaid balance (tax excl.)", unpaidNote: (v: string) => `Current balance · ${v} with tax, for reference`, paidOut: "Total transferred", paidOutNote: "All quarters, after bank fees",
    note: "\"Paid\" is not a confirmed result. Commission is confirmed after the experience has taken place and is settled every quarter. The formal tax and payment amounts are on the payment notice.",
  },
  reservations: {
    title: "Bookings & commissions", from: "Booked from", to: "Booked to", xFrom: "Experience from", xTo: "Experience to", status: "Booking status", ref: "Reference",
    note: "Amounts with tax are for reference; the formal tax is on the payment notice. No customer personal data is shown.",
    head: ["Reference", "Booked", "Experience", "Date", "Guests", "Booking", "Payment", "Base (tax excl.)", "Rate", "Commission (tax excl.)", "With tax (ref.)", "Settlement"],
  },
  experiences: {
    title: "Experiences and referral terms", referable: "Referable", notReferable: "Not referable yet",
    note: "Booking mode: \"Book\" goes ahead when the date is free, \"Check availability\" is confirmed by the venue, and \"Request a quote\" is for experiences whose price depends on the party and the conditions. In every case, registering a booking request lets KAMEHAME JAPAN check availability and quote. Base prices include tax. Commission is the commissionable price after discounts (tax excluded) × the referral rate; on-site payments, options and arrangement fees are excluded. The example uses one unit of the base price; the real figure depends on the party and discounts. The reference booking value is an operations estimate until there is history.",
    basePrice: "Base price", perGroup: "(tax incl., per group)", perPerson: "(tax incl., per person)", refAvg: "Reference booking value", rate: "Referral rate", example: "Commission example (tax excl.)", linkUrl: "Referral URL", getQr: "Get the QR", getLink: "Get a referral link for this experience",
  },
  materials: {
    allTitle: "QR code and link to all experiences", note: "Use the QR on printed material and the link in e-mails or on the web. They carry different identifiers, so we can tell which one a guest used (a shared QR URL still counts as the QR). You can change the experiences on offer after printing; the QR stays valid. The QR holds no customer or bank details.",
    issue: "Issue the QR code and link", qrAlt: "QR code to all experiences", qrPrint: "QR code (for print)", qrContent: "QR contents", linkCopy: "Referral link (to copy)", copyLink: "Copy link",
    perTitle: "QR codes and links per experience", perNote: "Select an experience and create its QR code and link here, or from the Experiences page.", perHead: ["Experience", "Type", "URL", "QR", "Issued"], perEmpty: "No per-experience links yet.", link: "Link",
    brochure: "Brochure", brochureOpen: "Open the latest brochure (PDF)", brochureSoon: "In preparation. It will appear here when ready.", issuedTitle: "Links issued by KAMEHAME JAPAN per medium", issuedHead: ["Label", "Medium", "Experience", "Type", "URL", "QR"], allExperiences: "All experiences",
  },
  settlement: {
    title: "Settlement", unpaid: "Confirmed, unpaid balance (tax excl.)", taxRef: (v: string) => `${v} with tax, for reference`, paid: "Paid out (tax incl.)", minPayout: "Minimum payout (tax incl.)", minPayoutNote: "Below this, carried to the next period",
    note: "Every calendar quarter (Jan–Mar, Apr–Jun, Jul–Sep, Oct–Dec), KAMEHAME JAPAN issues a payment notice for the commission on experiences that have taken place, and transfers it at the end of the following month. You do not need to send an invoice. If anything on a notice differs, raise a dispute by the deadline shown.", feeNote: (v: string) => ` The bank transfer fee (${v}) is borne by you and deducted from the transfer.`,
    statements: "Payment notices", head: ["Period", "Ver.", "Status", "Total (tax incl.)", "Carried in", "Transfer", "Carried out", "Pay date", "Dispute by", ""], empty: "No payment notices yet. They are issued after each quarter closes.", billingOnly: "Only users with the billing role can acknowledge or dispute a notice.",
    profileTitle: "Settlement and bank details", profileName: "Profile", bank: "Bank account", bankMissing: "Not registered (please contact KAMEHAME JAPAN)", disputeDays: "Dispute window", disputeDaysV: (n: number) => `${n} days from issue`, noProfile: "No settlement profile yet. KAMEHAME JAPAN will set it up.", lastUpdated: "Last updated",
    periodLabel: (y: string, q: string) => `Q${q} ${y}`,
  },
  statement: {
    title: "Payment notice", csv: "Items CSV", print: "Print / save as PDF", issued: "Issued", deadline: "Dispute by", acknowledged: "Acknowledged", settled: "Paid", ack: "I have reviewed this notice", ackDone: "Acknowledged. The transfer follows on the scheduled date.",
    disputeTarget: "Dispute", whole: "The whole notice", reason: "Reason", reasonPh: "Describe what differs", dispute: "Raise a dispute", disputeDone: "Your dispute has been received. KAMEHAME JAPAN will reply.", billingOnly: "Acknowledging or disputing needs the billing role.", disputesHead: ["When", "Item", "Reason", "Status", "Reply"], item: "Item",
    sheet: { h: "Commission payment notice", period: "Period", revision: (v: number) => `Revision ${v}`, no: "Notice no.", issuedOn: "Issued", unissued: "(draft, not issued)", to: "To", toSuffix: "", regNo: "Registration no.", profile: "Settlement profile", payee: "Payee", from: "Issued by", company: "Prosent Inc.",
      net: "Commission (tax excl.)", tax: "Consumption tax (10%, once on the total)", gross: "Total (tax incl.)", carriedIn: "Carried in from the previous period", payable: "Payable", carriedOutRefund: "negative balance after refunds", carriedOutMin: (v: string) => `below the minimum payout of ${v}`, carriedOut: (why: string) => `Carried to the next period (${why})`, fee: (who: string) => `Bank transfer fee (${who})`, feeHotel: "borne by you", feeUs: "borne by us", transfer: "Transfer", payDate: "Transfer date", noTransfer: "No transfer this period",
      itemsHead: ["Type", "Date", "Reference", "Experience", "Referrer", "Base (tax excl.)", "Rate", "Amount (tax excl.)", "Note"], noItems: "No items.", entry: "Commission", adjustment: "Prior-period correction",
      note1: "Commission is calculated per booking that has taken place: the tax-exclusive amount after discounts and refunds × the contracted rate, rounded once per booking. Consumption tax is calculated once on the notice total.", note2: (v: string) => `If the payable amount is below the minimum payout (${v} tax incl.), or negative after refunds, it is carried to the next notice and combined or offset there.`, note3: (d: string) => `If anything differs, tell us through the partner portal by ${d}. Without a reply by then, the notice counts as acknowledged and the payment proceeds.`, note4: "This is a payment notice prepared by KAMEHAME JAPAN (Prosent Inc.); no invoice from you is required. Tax particulars follow your contract." },
  },
  cases: {
    title: "Booking requests", newCase: "New request", openOnly: "Open only", showAll: "Show closed too",
    intro: "Register what your customer would like; KAMEHAME JAPAN checks availability, prepares a quote and a page where the customer can review and pay. Bookings that come from a request are attributed to your site regardless of cookies or devices.", managerNote: "As site manager you see every request of the site.", agentNote: "You see the requests you registered or are assigned to.",
    noAccess: "Booking requests are not enabled for this site, or your account has no booking role. Please contact KAMEHAME JAPAN.",
    head: ["Request", "Status", "Experience", "Date", "Guests", "Customer", "Quote", "Agent", "Updated", ""], emptyOpen: "No open requests.", emptyAll: "No requests yet.", version: (v: number) => `v${v}`,
    newTitle: "New booking request", wishes: "What the customer would like", kind: "Type", kindExperience: "A listed experience or tour", kindFree: "Open request (describe it in the notes)", experience: "Experience", date: "Preferred date", altDates: "Alternative dates (comma separated, up to 5)", timePref: "Preferred time", timePh: "afternoon, around 10:00…", guests: "Guests", lang: "Customer's language", requirements: "Requirements and notes", requirementsPh: "Dietary needs, an anniversary, travel logistics, budget…", extraH: "Details for this product",
    customerH: "Customer and contact", customerNote: "At the enquiry stage only the customer's name is needed. Add contact details when the booking needs them. If an e-mail address is given, operations can send the quote to the customer directly.", customerName: "Customer's name (required)", email: "E-mail", phone: "Phone", country: "Country / region", assignee: "Your contact person", partnerRef: "Your own reference (optional)", submit: "Register the request", submitting: "Registering…", backToList: "Back to list",
    facts: { experience: "Experience", free: "(open request; operations will choose the product)", date: "Preferred date", alt: (d: string) => `(alternatives ${d})`, guests: "Guests", lang: "Language", customer: "Customer", noEmail: "no e-mail", requirements: "Requirements / notes", assignee: "Contact", ref: "ref." },
    next: { received: "KAMEHAME JAPAN is reviewing the request.", checking: "Operations are checking availability and conditions. Questions arrive in the messages below.", proposed: "A quote has been shared. Pass the customer URL to your customer (no online payment).", awaiting_customer: "Waiting for the customer's answer. Let us know in the messages when it arrives.", awaiting_payment: "Pass the customer URL to your customer. Once they pay on that page, the request moves on automatically.", paid: "Payment received. Operations are securing the slot and will confirm the booking.", confirmed: "The booking is confirmed. Meeting point and day-of details are in the messages.", performed: "Completed. Commission is confirmed after the experience and appears in the quarterly settlement.", cancelled: "Cancelled.", unavailable: "Could not be arranged. See the messages for the reason." },
    customerUrl: "Customer URL", edit: "Edit customer details and wishes", withdraw: "Withdraw the request", withdrawConfirm: "Withdraw", withdrawPh: "Reason (customer's change of plans, dates…)", withdrawn: "Withdrawn.", saved: "Saved.", meta: (c: string, u: string, by: string) => `Created ${c} · updated ${u} · by ${by}`,
    quotes: "Quotes", noQuotes: "Quotes appear here once operations prepare and share them.", ledger: "Booking and commission", ledgerNote: "Sharing a quote opens a provisional booking in the ledger, attributed to this request's site.", reservation: "Booking", amountCheck: "amount to check", commission: "Commission", messagesH: "Messages and documents",
    quote: { version: (v: number) => `Version ${v}`, created: "created", shared: "shared", paid: "paid", head: ["Type", "Description", "Unit", "Qty", "Amount (tax incl.)", "Commissionable"], onsite: "(on the day)", total: "Total to pay (tax incl.)", onsiteTotal: "Paid on the day", payment: "Payment", validUntil: "Valid until", includes: "Included", excludes: "Not included", onsiteNote: "Paid on the day", cancel: "Cancellation", confirmation: "How the booking is confirmed", commissionL: "Commission (partner only)", noPolicy: "Rate not set yet (shown once operations set it)", commissionV: (base: string, rate: string, est: string) => `Base ${base} (tax excl.) × ${rate} = estimated ${est} (tax excl.), confirmed after the experience.` },
    thread: { none: "No messages yet.", ops: "KAMEHAME operations", partner: "Partner", system: "System", compose: "Message to operations", composeOps: "Message / note", composePh: "Questions, changes, the customer's answers…", composePhOps: "Conditions, meeting point, day-of contact…", visibility: "Visible to", visInternal: "Operations only (hidden from the partner)", visPartner: "Partner and operations", visCustomer: "Customer too (attachment shown on the quote page)", attach: "Attachment (PDF or image, up to 15 MB)", uploadFail: "The upload failed." },
    ledgerRow: (base: string, rate: string, c: string) => `Base ${base} (tax excl.) × ${rate} = ${c} (tax excl.)`,
  },
  guide: {
    title: "Guide", lead: "The KAMEHAME JAPAN partner portal is where partners (hotels, travel agencies and guides) refer their guests to experiences in Japan and receive commission. Switch the language at the top right; e-mails follow the same language.",
    sections: [
      ["Results", "Traffic via QR codes and links, bookings, payments and confirmed commission for a period. \"Paid\" is not a confirmed result: commission is confirmed after the experience has taken place."],
      ["Bookings & commissions", "Bookings that came from your referrals. Use the reference (R-XXXXXX) when talking to operations. No customer personal data is shown."],
      ["Bookings on behalf of guests", "Register what a customer would like; KAMEHAME JAPAN checks availability, prepares a quote and a customer page (URL) for review and payment. Bookings from a request are attributed to your site even if the customer pays on another device. Messages and documents are exchanged on the request page."],
      ["Experiences", "The experiences you can refer and their terms (base price, referral rate, example). Get a referral link or register a booking request from each one."],
      ["QR & links", "A QR code for print and a link for e-mail and the web; we count which one a guest used."],
      ["Settlement", "Every calendar quarter KAMEHAME JAPAN issues a payment notice for the commission on experiences that took place and transfers it at the end of the following month (no invoice from you is needed). Dispute anything that differs by the deadline. Amounts below the minimum payout (¥3,000 incl. tax) are carried to the next period."],
      ["How commission is calculated", "The commissionable amount after discounts and refunds (tax excluded) × the contracted rate, rounded once per booking. On-site payments, options and arrangement fees are excluded. Consumption tax is calculated once on the notice total."],
      ["Signing in", "There is no password: a six-digit code is e-mailed to your registered address. To add colleagues, ask KAMEHAME JAPAN (hello@kamehame-japan.com)."],
    ] as [string, string][],
  },
};

export const DICT: Record<PortalLang, Dict> = { ja, en };
export type PortalDict = Dict;

let current: PortalLang = "ja";
/** The language the shell decided on; module-level so formatters and shared pieces need no prop. */
export const setPortalLang = (l: PortalLang) => { current = l; };
export const portalLang = () => current;
export const t = () => DICT[current];
/** A code → label lookup that never throws on an unknown code. */
export const label = (group: Record<string, string>, code: string | null | undefined, fallback = "—") => (code ? group[code] ?? code : fallback);
export const asPortalLang = (v: unknown): PortalLang => (v === "en" ? "en" : "ja");
/** Browser default before sign-in: a stored choice, else the browser's language. */
export function detectPortalLang(): PortalLang {
  try { const stored = localStorage.getItem("kh-portal-lang"); if (stored === "en" || stored === "ja") return stored; } catch { /* ignore */ }
  try { return navigator.language.toLowerCase().startsWith("ja") ? "ja" : "en"; } catch { return "ja"; }
}
