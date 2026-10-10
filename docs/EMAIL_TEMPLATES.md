# 問い合わせ対応メールのテンプレート

フォーム送信時の自動返信(①)はサイトが自動で送ります(`lib/mail-copy.ts`、5言語)。
ここにあるのは、担当者が hello@kamehame-japan.com から**手で送る**メールです。
英語が本文、日本語は担当者向けの対訳です。`{ }` の箇所を置き換えて送ってください。

送る順番:
```
① 自動返信(サイトが送信)
② 受け入れ先に空き確認 → 結果が出たら
③-A 空きあり → 条件案内(このファイルの A)
③-B 空きなし → 代替日の提案(B)
④ 入金確認 → 正式手配 → 確定通知(C)
⑤ 前日リマインド(D、任意)
```

---

## A. 条件案内(空きあり・支払いリンク付き)

**件名:** `Your date is available — {experience}, {date} at {time}`

```
Hello {name},

Good news: the host can take your party of {n} on {date} at {time}.

Here is everything you need to decide.

PLAN AND PRICE
{Plan name, e.g. Signature — Private Geisha Evening with Live Shamisen}
¥{total} for {n} guests — the total for your private group ({regular / peak} season rate).
Tax and service charge are included. Nothing is added on the day.

WHAT'S INCLUDED
- A private tatami room for your party
- The multi-course Japanese dinner (seasonal menu) — or, if you told us: vegetarian / gluten-free / wagyu steak set
- Free-flow drinks, including alcohol
- {By plan — The Evening: one geiko or maiko / With Live Shamisen: one geiko or maiko + live shamisen / Two Performers: two geiko or maiko + live shamisen}: conversation, one or two dances, ozashiki games
- An interpreter guide throughout — English, Spanish or French (as chosen in the request)
- Commemorative photographs

NOT INCLUDED
- Anything beyond your plan. If you would like live shamisen (+¥70,000) or a second performer with shamisen (+¥135,000), reply and we re-quote

MEETING
Gion / Higashiyama, Kyoto, about 8 minutes on foot from Gion-Shijo Station.
The house's name and street address come with your confirmation, together with a map and your guide's contact.

CANCELLATION
Your booking is confirmed when your payment arrives, and these terms apply from then (days counted to the date, Japan time):
- up to 14 days before: free — full refund
- 13 to 4 days before: 50%
- 3 days before or later, and no-shows: 100%
Date changes follow the same scale. If the host cannot provide a geiko or maiko for your date, you receive a full refund.

TO CONFIRM
Please pay by {deadline, e.g. Friday 26 September, 17:00 Japan time} through this secure link:
{Stripe payment link}
Please use the same name and email address as in your request, so we can match your payment straight away.
(Bank transfer is also possible — reply and we will send the details.)

As soon as the payment is in, we arrange your evening with the house and send you the confirmation with the address, map and your guide's contact — within one business day.

Anything we should pass on to the kitchen or the house (allergies, a birthday)? Just reply to this email.

Warm regards,
{your name}
KAMEHAME JAPAN · Prosent Inc.
hello@kamehame-japan.com
```

**日本語対訳(担当者用)**
> {name} 様 / ご希望の {date} {time}、{n}名様で受け入れ先の空きが取れました。
> プランと料金:{プラン名}、{n}名で合計 ¥{total}({通常期/繁忙期}料金。税・サービス料込。当日の追加なし)
> 含まれるもの:貸切座敷/和食コース/飲み放題(アルコール含む)/プランに応じた出演者(お座敷:芸妓または舞妓1名/生三味線つき:1名+地方の生三味線/出演者2名:2名+地方の生三味線。歓談・舞・お座敷遊び)/通訳ガイド(英・西・仏から選択)/記念撮影
> 含まれないもの:プラン外のもの。生三味線(+¥70,000)や2名出演(+¥135,000)を希望なら再見積
> 集合:祇園・東山エリア、祇園四条駅から徒歩約8分。店名・住所・地図・ガイド連絡先は確定通知でお伝えします
> キャンセル:入金で予約確定、以降は当社規定(14日前まで無料、13〜4日前50%、3日前以降・無連絡100%。日本時間で起算)。正式手配は遅くとも開催14日前までに行う。芸舞妓が手配できなかった場合は全額返金
> 確定するには:{期限}までに決済リンクからお支払いください(銀行振込も可)。お問い合わせ時と同じ氏名・メールアドレスで決済してください
> 入金確認後1営業日以内に、住所・地図・ガイド連絡先を記載した確定通知を送ります
> アレルギー・お祝いなど、伝えておくことがあれば返信してください

---

## B. 空きなし → 代替日の提案

**件名:** `About your request — {experience}, {date}`

```
Hello {name},

Thank you for your patience. I'm sorry — the host cannot take {date} at {time}: {short reason, e.g. no geiko or maiko is available that evening / the room is already booked}.

These dates are open, if any of them works for you:
- {date 1} at {time}
- {date 2} at {time}
- {date 3} at {time}

Reply with the one you prefer (or another date, and we will check it) and I will hold it while we confirm the details. The price and conditions are the same as on the experience page.

If none of these fit, I completely understand — and if you would like a hand with a different experience in Kyoto or Tokyo, just say so.

Warm regards,
{your name}
KAMEHAME JAPAN · Prosent Inc.
hello@kamehame-japan.com
```

**日本語対訳**
> 申し訳ありません、{date} {time} は受け入れ先の都合({理由})でお取りできませんでした。
> 代わりに {候補1〜3} が空いています。ご希望があれば返信ください。別の日でも確認します。
> 料金・条件は体験ページのとおりです。都合が合わなければ、他の体験のご相談もどうぞ。

---

## C. 確定通知(入金確認後)

**件名:** `Confirmed — {experience}, {date} at {time} · {予約番号 KJ-YYMMDD-NN}`

```
Hello {name},

Your evening is confirmed. Thank you — we have received your payment of ¥{total} and the house has arranged your geiko or maiko for the date.

DATE AND TIME
{Weekday, date} — please arrive by {time minus 10 min} (the banquet begins at {time})

WHERE
{Venue name}
{Street address in Japanese and English}
Map: {Google Maps link}
About 10 minutes on foot from Gion-Shijo Station (Keihan line). Look for the red lantern.

YOUR GUIDE
{Guide name} will meet you at {meeting point, e.g. the entrance / the station exit} at {time minus 10 min}.
Phone / WhatsApp: {number} — for the day itself, if you are running late or cannot find the way.

WHAT WE HAVE PASSED ON
{e.g. One vegetarian guest; birthday of Ms. X}
If anything has changed, reply to this email as soon as you can.

GOOD TO KNOW
- No dress code. Seating is on tatami.
- Photos and video are welcome throughout, the dance included — no flash, no tripods.
- Your host will pour and talk but, by custom, will not eat at the table — please don't press food or drink on her.
- Cancellation from now: 13 to 4 days before 50%, from 3 days before 100% (free until 14 days before).

We hope you have a wonderful evening. If anything comes up before then, we are at hello@kamehame-japan.com.

Warm regards,
{your name}
KAMEHAME JAPAN · Prosent Inc.
```

**日本語対訳**
> ご予約が確定しました。¥{total} のお支払いを確認し、受け入れ先が芸舞妓を手配しました。
> 日時:{日付} {開始10分前}までに到着(開始 {time})
> 場所:{店名}{住所}{地図リンク}。祇園四条駅から徒歩約10分、赤提灯が目印
> ガイド:{名前} が {集合場所} で {開始10分前} にお待ちします。当日連絡先:{番号}
> 受け入れ先に伝えた内容:{食事制限・お祝いなど}。変更があればすぐ返信を
> 補足:ドレスコードなし/畳席/撮影可(フラッシュ・三脚不可)/芸舞妓は席で飲食しない慣習/この時点からのキャンセルは13〜4日前50%、3日前以降100%(14日前まで無料)

---

## D. 前日リマインド(任意)

**件名:** `Tomorrow — {experience}, {time}`

```
Hello {name},

A quick note for tomorrow: {Guide name} will meet you at {meeting point} at {time minus 10 min}.
Address: {address} — map: {link}
Guide's phone / WhatsApp: {number}

The forecast for Kyoto is {weather}; {e.g. bring an umbrella / it will be warm}.

See you tomorrow evening.
{your name}, KAMEHAME JAPAN
```

---

## E. お礼と口コミのお願い(体験翌日)

**件名:** `Thank you for last night — one small favour`

```
Hello {name},

Thank you for spending the evening with us. We hope {geiko/maiko name, if shared} and the house made it one to remember.

One favour: would you leave a short review? It takes two minutes, and it helps the next guests decide.
https://kamehame-japan.com/en/review/?experience=evening-with-geiko&ref={予約番号}   (日本語ページは /ja/review/、他言語も同様)

Only guests with a confirmed booking can review, and we publish reviews as written. A photo from the evening is welcome if you'd like to add one.

If anything fell short, please tell us directly by replying to this email — we read every message.

Warm regards,
{your name}
KAMEHAME JAPAN · Prosent Inc.
```

**日本語対訳**
> 昨夜はありがとうございました。二分ほどで書ける口コミをお願いできますか({予約ごとのフォームリンク})。
> 予約確認済みの方だけが投稿でき、内容は手を加えずに掲載します。写真も歓迎です。
> 至らない点があれば、このメールへの返信で直接お知らせください。

**予約番号のルール:** `KJ-体験日(YYMMDD)-連番`(例 `KJ-261012-01`)。入金確認時に採番し、確定通知(C)の件名・本文、口コミ依頼(E)のリンク、Stripe の決済メモに同じ番号を入れる。

**口コミフォーム**(サイト内 `/{lang}/review/`。URL に体験と予約番号を入れて送る。届いた内容は写真付きで hello@ にメールされ、件名に予約番号が付く。半自動運用: 確定通知を送る際に E も書き、Gmail の「送信日時を設定」で体験翌日の朝に予約送信しておく)
- 総合評価(1〜5)/ タイトル / 感想 / 表示名(イニシャル可)/ 国 / 利用シーン(カップル・家族・友人・ひとり・仕事)/ 写真(任意)/ 「サイトへの掲載に同意する」
- 届いたものは `lib/reviews.ts` に追加して公開(`verified: true`)。最初の1件からでも表示できます。**自作・依頼による創作は不可**(景表法のステマ規制、Google のレビューポリシー)。
- Google のビジネスプロフィールへの投稿は、上記フォームの完了画面で任意にお願いする(サブ)。

---

## G. ゴルフ(Private Golf Day from Tokyo — Mt. Fuji or Tokyo Area)の流れ

> **2026-10-10 改定(LP改修指示書 v4)。** 1ページで2エリア、2〜4名すべて料金表示(lib/golf-prices.ts が唯一の価格マスタ):東京近郊 ¥250,000 / ¥290,000 / ¥330,000、富士山エリア ¥270,000 / ¥310,000 / ¥350,000(2名 / 3名 / 4名、おすすめコース、平日・土日祝共通の開始価格、税・サービス料込み)。**希望コースの指定だけ**個別見積もり(Custom quote)。両エリアともハイヤー送迎・英語ガイド・18ホールのプレー代・レンタルクラブ(標準セット)・規定内の昼食込み。**ガイドはプレーしない**(送迎同行・チェックイン・レンタル手配のサポート)。問い合わせには「エリア」「人数」「コース方式(おすすめ / 指定+コース名)」「希望日と出発希望(希望なし可)」「ホテル(未定なら『Hotel not decided yet』+おおよそのエリア)」「ゴルフ経験・ハンディキャップ」「参加者ごとのレンタル要否と利き手」「クラブの希望」「WhatsApp」「オプション」が付く。第2希望日は廃止。通知メールの `Price:` 行はサーバーが価格マスタから計算した参考価格(版 `2026-10-10`)で、ブラウザの表示額は使わない。以下のテンプレートの「guide … plays the round with you」「course caddie」の行は使わず、送迎込み・ガイド同行(プレーなし)の表現に読み替える。旧価格(¥180,000/220,000/280,000)は 2026-10-10 以前の予約にのみ適用。
> Stripe の商品名はエリアが分かる名前にする(例 `Golf · Tokyo Area · 2 golfers`、`Golf · Mt. Fuji Area · 2 golfers`): 決済完了ページの `purchase` イベントが商品名をそのまま GA4 に送るので、エリア別の成約数が取れる。予約番号は決済リンクの `?client_reference_id=KJ-…` で渡せる。

芸妓と同じ骨格ですが、**支払いの前にコース名とティータイムを提示する**とページで約束しているので、順番が一つ増えます。

```
① 自動返信(サイトが送信)
② 初回返信(G-0)— 24時間以内。提携先がすぐ返せる場合は「今日か明日」、週末などで時間がかかる場合は日付を伝える
③ ゴルフ提携先に照会(G-1)→ コース・ティータイム・料金・仮押さえ期限が出たら
④ 条件案内+支払いリンク(G-A)
⑤ 入金確認 → 提携先に正式手配 → 確定通知(G-C:集合場所・ガイド連絡先・車両)
⑥ 前日リマインド(任意)、翌日お礼+口コミ依頼(E と同じ)
```

**Stripe の商品(ゴルフ)** — 初回に作成し、以後は価格だけ差し替える
- 2026-10-10 以降(v4): 人数×エリアで6本。`Golf · Tokyo Area · 2 golfers` ¥250,000 / `… · 3 golfers` ¥290,000 / `… · 4 golfers` ¥330,000、`Golf · Mt. Fuji Area · 2 golfers` ¥270,000 / `… · 3 golfers` ¥310,000 / `… · 4 golfers` ¥350,000(決済額は必ずグループ総額。3名の1名あたり参考額 ¥96,667 / ¥103,333 を掛け戻さない)。コース指定(個別見積もり)は見積もりごとにリンクを作る。旧: `Private Mt. Fuji Golf Experience from Tokyo` 3価格 ¥180,000 / ¥220,000 / ¥280,000(既存予約のみ)
- `Highlight film — Mt. Fuji golf`:¥96,000(2〜3名のグループ。4名は不可。当日の追加も可。卸 ¥80,000)
- `Kanji ball marker — Mt. Fuji golf`:¥6,000、ユニットラベル `golfer`、数量 = 人数(2週間前までに確定した予約のみ。卸 1名 ¥5,000)
- 支払いリンクは**人数ごとに1本を使い回す**(2026-10-04 決定。「支払い回数を制限」は付けない)。品目 = 人数に合う価格 ×1、数量変更は「許可しない」。「支払い後」のリダイレクトは `https://kamehame-japan.com/{lang}/booked/?session_id={CHECKOUT_SESSION_ID}`(お客様の言語。英語なら `/en/`)。オプション付き(映像 ×1、マーカー ×人数)・5〜6名・コース指定の追加料金ありは、その予約用に別のリンクを作る。
- 入金の照合は Stripe の通知の**氏名・メールアドレス・金額**で行う(メールで「問い合わせと同じ氏名・メールで決済」を依頼済み)。照合できたら Stripe の支払いに予約番号をメモする。
- 作成済みのリンク(2026-10-04):

| 人数 | 金額 | リンク |
| --- | --- | --- |
| 2名 | ¥180,000 | https://book.stripe.com/6oU9AT3fHa390YnaZc3Je0d |
| 3名 | ¥220,000 | https://book.stripe.com/cNi28r7vX6QX6iH2sG3Je0c |
| 4名 | ¥280,000 | https://book.stripe.com/14AfZh6rT1wD9uT5ES3Je0b |

  無効化済み(金額が ¥18,000 になっていた最初の2名用): https://book.stripe.com/00wfZh7vXcbhePd0ky3Je0a

### 入金後の流れ(ゴルフ)

```
入金当日   Stripe の通知(氏名・メール・金額)を問い合わせと照合 → 予約番号を採番(KJ-体験日-連番)、Stripe の支払いにメモ
          → 提携先に正式手配(G-2)。ガイド名・連絡先・車両・ロビー集合の案内を依頼
          → お客様に「入金確認」(G-B)。足りない情報(ホテル名・氏名・利き手・携帯)はここで集める
翌営業日まで 確定通知(G-C:集合場所・コース・持ち物)。ガイド名・電話・車両は提携先から前日に届くので G-D で送る
7日前      無料キャンセル期限(18:00)。提携先の手配が最終か確認
前日       前日案内(G-D):集合時刻・ガイドの名前と電話・車両・天気・持ち物(提携先の情報が届き次第、必ず送る)
翌日       お礼+口コミ依頼(E と同じ。URL の experience=mt-fuji-golf-day)。ハイライト映像は提携先から届き次第転送
```

### G-2. 提携先への正式手配(日本語)

> 件名: 【正式手配】富士山ゴルフ {月/日(曜)} {n}名 {予約番号}
> 入金を確認しましたので正式手配をお願いします。
> 日程・コース・ティータイム / 出発 {時刻} {ホテル名}(ロビー集合 {出発5分前}) / 参加者氏名(性別・HC・利き手) / レンタルクラブ / お客様の携帯 / 撮影オプションの有無
> 折り返しお願いしたいこと: ①当日のガイド名と電話(WhatsApp 可否) ②車両(車種・ナンバー・ドライバー名) ③ロビーでの目印 ④ハイライト映像の納品時期 ⑤貴社の取消条件の起算日

### G-B. 入金確認(入金当日)

**件名:** `Payment received — Private Mt. Fuji Golf Experience, {weekday, date} · {予約番号}`

```
Hello {name},

Thank you — we have received your payment of ¥{total}, and your golf day on {weekday, date} is confirmed. Your booking reference is {予約番号}.

We are now making the final arrangements with the course and your guide. Within one business day you will receive your confirmation with the meeting point in your hotel lobby. Your guide's name and phone number and the car details come the day before your round.

{If anything is still missing:}
To complete the arrangements, could you reply with:
- The name of your hotel in {area}
- Both golfers' full names, and whether either of you plays left-handed
- A mobile number or WhatsApp we can reach on the day

Warm regards,
{your name}
KAMEHAME JAPAN · Prosent Inc.
```

**日本語対訳**
> ¥{total} のお支払いを確認しました。{date} のゴルフは確定です。予約番号は {番号}。
> ゴルフ場とガイドと最終手配中で、1営業日以内に集合場所を記載した確定通知を送ります。ガイドの名前と電話・車両は前日にお知らせします。
> (未入手なら)ホテル名/お二人の氏名と利き手/当日の携帯番号を返信してください。

### G-C. 確定通知(詳細が揃ったら)

**件名:** `Confirmed — Private Mt. Fuji Golf Experience, {weekday, date} · {予約番号}`

```
Hello {name},

Everything is arranged for your golf day. Here are the details.

DATE AND MEETING
{Weekday, date} — please be in the lobby of {hotel name} by {time − 5 min}. The car leaves at {time}.
Your guide will be waiting in the lobby {landmark, e.g. near the reception desk}. Their name and phone number, and the car details, follow the day before.

YOUR COURSE
{Course name}, {area}
Tee off at {tee time}. About {x} hours by private car from your hotel; you arrive around {time} and check in with your guide.

WHAT WE HAVE ARRANGED
- Rental clubs: {one ladies' set, one men's set; both right-handed}
- Lunch at the clubhouse
- {Highlight film — yes (delivered about a week after) / no}
- {Ball markers with your names in kanji — yes, handed to you on the day / no}

WHAT TO BRING
- Golf shoes {or: rental shoes in sizes … are reserved for you}
- A jacket to wear on arrival at the clubhouse, and a collared shirt for the course
- Glove, sunscreen or a layer for the morning — it is cooler near Mt. Fuji than in Tokyo

GOOD TO KNOW
- The car waits 15 minutes at the hotel; after that we may miss the tee time.
- If the course closes for weather, it decides on the day; you are refunded everything except costs already incurred.
- Cancellation from now: {6 to 2 days before: 50%; from the day before: 100% — with the actual dates}.

We hope you have a wonderful day. If anything comes up before then, we are at hello@kamehame-japan.com.

Warm regards,
{your name}
KAMEHAME JAPAN · Prosent Inc.
```

**日本語対訳**
> 手配がすべて整いました。
> 日時・集合:{date}、{ホテル名}のロビーに{出発5分前}まで。出発 {time}。ガイドが {目印} でお待ちします(名前・電話・車両は前日に)
> コース:{コース名}。ティーオフ {時刻}。ホテルから約{x}時間、{到着時刻}頃に到着しガイドがチェックイン
> 手配済み:レンタルクラブ({内容})/クラブハウス昼食/ハイライト映像の有無(約1週間後にお届け)/ボールマーカーの有無(当日お渡し)
> 持ち物:ゴルフシューズ(またはレンタル手配済み)/到着時のジャケットと襟付きシャツ/グローブ・日焼け止め・上着(富士山麓は東京より涼しい)
> 補足:車はホテルで15分待機/天候クローズは発生済み費用を除き返金/この時点からのキャンセル規定(実際の日付で)

### G-0. 初回返信(照会中)

**件名:** `Your request — Private Mt. Fuji Golf Experience, {date}`

```
Hello {name},

Thank you for your request. We are now checking courses in the Mt. Fuji region for {weekday, date}, with a {time} departure from your hotel in {area}, for {n} golfers{, with rental clubs for both of you}.

You will have the proposed course, tee time and final price {today or tomorrow / by {day}}. Nothing is charged until you have seen them and decided to go ahead.

Warm regards,
{your name}
KAMEHAME JAPAN · Prosent Inc.
hello@kamehame-japan.com
```

### G-1. 提携先への照会(日本語・担当者が送る)

> 件名: 【予約照会】富士山ゴルフ {月/日(曜)} {n}名 {出発エリア}発 {出発時刻}
> 日程 / 出発時刻・場所(ホテル名) / 人数(性別・HC) / レンタルクラブ(レディース・メンズ、利き手) / 希望コースがあれば
> 確認事項: ①コース候補とティータイム(出発時刻に合うもの) ②料金(卸条件どおりか) ③ティータイムの仮押さえと、いつまで押さえられるか ④シューズのレンタル可否 ⑤2〜3名はガイドがラウンド同行、4名はキャディ ⑥集合(ロビーは出発5分前)と車両
> お客様にはコース・ティータイム・料金を提示したうえでお支払いいただき、入金後に正式手配をお願いします。

### G-A. 条件案内(コース確定・支払いリンク付き)

短く、リンクを上に(支払い完了率を優先。詳しい条件はページにある)。

**件名:** `Your golf day is available — Private Mt. Fuji Golf Experience, {weekday, date} · {time} departure`

```
Hello {name},

Good news — your course is arranged:

- {Weekday, date} · departure from your hotel in {area} at {time}
- {Course name}, {area} · tee off at {tee time}
- ¥{total} for {n} golfers, all in (tax included, nothing added on the day)

TO CONFIRM
Pay by {deadline, e.g. Thursday 9 October, 18:00 Japan time} through this secure link:
{Stripe payment link}
Please use the same name and email as in your request. Your booking is confirmed as soon as the payment arrives. The tee time is held until then; after the deadline it may have to change.

WHAT'S INCLUDED
- Private car from your hotel to the course and back
- Green fee, rental clubs {for both of you (ladies' and men's sets)}
- English-speaking golf guide who rides with you and helps with check-in, rental clubs and the clubhouse (the guide does not play)
- Lunch at the clubhouse
Not included: golf shoes (bring your own, or ask us about rental). Optional: a highlight film of your day (¥96,000 per group of two or three, delivered about a week later) and ball markers with your names in kanji (¥6,000 per golfer, confirmed two weeks ahead).

CANCELLATION (from payment, Japan time)
Free until 18:00 on {date − 7}; 50% from {date − 6} to {date − 2}; 100% from {date − 1} and no-shows. Weather closure: full refund except costs already incurred.

AFTER PAYMENT
Within one business day you receive your confirmation with the meeting point in your hotel lobby. Your guide's name and phone / WhatsApp and the car details come the day before your round.

Could you also reply with your hotel's name, both golfers' full names (and whether either of you plays left-handed), and a mobile number for the day? Before or after paying — either is fine.

Warm regards,
{your name}
KAMEHAME JAPAN · Prosent Inc.
hello@kamehame-japan.com
```

**日本語対訳(担当者用)**
> コースの手配ができました:{date} {area}のホテルを{time}出発/{コース名}、ティーオフ{時刻}/{n}名で合計 ¥{total}(税込、当日の追加なし)
> 確定するには:{期限}までに決済リンクから。問い合わせと同じ氏名・メールで。入金で予約確定。ティータイムは期限まで押さえ、過ぎると変わる可能性がある
> 含まれるもの:ホテル往復の専用車/プレーフィ・レンタルクラブ/英語ガイド(同乗・チェックインと現地サポート、プレーはしない)/クラブハウス昼食。含まれないもの:シューズ。オプション:ハイライト映像 ¥96,000(2〜3名のグループ、約1週間後)/漢字ボールマーカー 1名 ¥6,000(2週間前までの確定が条件)
> キャンセル(入金後・日本時間):7日前18時まで無料、6〜2日前50%、前日以降・無連絡100%。天候クローズは発生済み費用を除き返金
> 入金後1営業日以内に、ロビー集合場所を記載した確定通知を送る。ガイドの名前と連絡先・車両は前日に送る
> 返信でほしいこと(支払いの前後どちらでも):ホテル名/2名の氏名と利き手/当日の携帯

**コース指定の追加料金:** 富士クラシックなどの名門コースを指定された場合、卸値が基本プランより高く(海外客の追加料金があるコースもある)、G-A の PRICE に「course supplement for {course}: +¥…」を1行足して、合計を案内する(2026-10-06 の例: 3名・富士クラシック、卸値 ¥219,000 → 案内 ¥290,000)。サイトにも「コース指定は追加料金、見積もりで提示」と明記済み。

### G-D. 前日案内(ガイド・車両が届いたら。必ず送る)

**件名:** `Tomorrow — {course}, {time} pick-up · {予約番号}`

```
Hello {name},

Everything is ready for tomorrow.

- {time − 5 min}: please be in the lobby of {hotel name}, {landmark}. The car leaves at {time}.
- Your guide: {guide name} — phone / WhatsApp {number} (for tomorrow, if you are running late or cannot find each other)
- Car: {make / colour}, driver {name}
- {Course name}, tee off {tee time}

The forecast for the course is {weather}; {e.g. bring a layer for the morning / an umbrella}.

See you tomorrow.
{your name}, KAMEHAME JAPAN
```

**日本語対訳**
> 明日の準備が整いました。{出発5分前}に{ホテル名}のロビー({目印})へ。出発 {time}。ガイド {名前}、電話/WhatsApp {番号}。車両 {車種・色}、ドライバー {名前}。{コース名}、ティーオフ {時刻}。天気 {予報}。

**運用:** 氏名・ホテル名・連絡先は支払いの条件にしない(まず入金)。足りないものは確定通知(G-C)を送る前に集める。提携先への正式手配は入金後すぐ(無料キャンセルは7日前まで、提携先の取消条件と重ならないよう確認)。

---

## 運用メモ

- **返信は必ず hello@kamehame-japan.com から**(Google グループの「グループとして送信」または担当者の送信元に hello@ を追加)。お客様は自動返信の返信先が hello@ なので、スレッドが1本になります。
- 条件案内(A)を送ったら、**受け入れ先には「仮押さえ」の連絡**をしておく(正式手配は入金後。芸舞妓の手配開始=受け入れ先の取消料発生なので、入金前に正式手配しない)。
- **正式手配は入金確認後、遅くとも開催14日前まで**に行う(14日前を切っている予約はすぐに手配)。お客様の無料キャンセル期間(14日前まで)と受け入れ先の取消料発生(正式手配後)を重ねないための基準。都をどり期間(4月)は直前まで出演状況が読めないので、空き返信の時点でその旨を一言添える。
- サイトの締切は**7日前17時(日本時間)**。カレンダーもそこで止まる。10〜14日前を推奨と案内している。
- **料金(2026-10-06 改定)**: 人数別の総額 + プランの定額追加。受け入れ先の定価の10%引き(卸値)に、2名 ¥35,000 / 3名 ¥40,000 / 4名 ¥45,000 / 5名 ¥55,000 を上乗せし千円単位に切り上げ。追加出演者は受け入れ先 各¥60,500(両シーズン同額・10%引き対象)に ¥15,000(三味線)/ ¥25,000(2名+三味線)を上乗せ

| 人数 | 通常期 | ハイシーズン(3/15〜5/31、10/1〜11/30) |
| --- | --- | --- |
| 2名 | ¥161,000 | ¥179,000 |
| 3名 | ¥182,000 | ¥209,000 |
| 4名 | ¥195,000 | ¥231,000 |
| 5名 | ¥226,000 | ¥271,000 |

  - 生三味線つき: +¥70,000 / 出演者2名(2名+生三味線): +¥135,000(人数・季節にかかわらず定額)。6名以上は個別見積もり
- **Stripe の商品**(2026-10-06 に作り直し。料金改定のときはここの価格だけを差し替える)
  - `Private Geisha Evening in Kyoto`: 8価格(2 guests regular ¥161,000 / 3 guests regular ¥182,000 / 4 guests regular ¥195,000 / 5 guests regular ¥226,000 / 2 guests high season ¥179,000 / 3 guests high season ¥209,000 / 4 guests high season ¥231,000 / 5 guests high season ¥271,000)。各価格の説明欄に人数と季節を書く
  - `Live shamisen (jikata) — Private Geisha Evening`: ¥70,000
  - `Second performer and live shamisen — Private Geisha Evening`: ¥135,000
  - 旧商品(Select / Signature / Private Reserve / Additional guest)は**アーカイブ**して、新規リンクで選ばないようにする
  - 繁忙期(high season)は 3/15〜5/31 と 10/1〜11/30。**体験日**で判断する(問い合わせ日ではない)
- **支払いリンクは予約ごとに1本作る**(使い回さない)。空きが確定し、条件案内(A)を送るときに:
  1. Stripe →「支払いリンク」→「＋新規作成」
  2. 1品目: `Private Geisha Evening in Kyoto` の、人数と体験日の季節に合う価格、数量1
  3. 2品目: 生三味線つきなら `Live shamisen` ×1、出演者2名なら `Second performer and live shamisen` ×1(お座敷プランは2品目なし)。数量の変更は「お客様に許可しない」
  4. 「支払い後」→「顧客をウェブサイトにリダイレクト」→ `https://kamehame-japan.com/en/booked/?session_id={CHECKOUT_SESSION_ID}`(サイトの予約確定ページ。金額の表示と広告の成果計測をここで行う)
  5. 「支払い回数を制限」は付けない(2026-10-04 決定。入金は氏名・メール・金額で照合する)
  6. 作成したリンクを条件案内(A)の `{Stripe payment link}` に貼る
  - 例: 生三味線つき・通常期・4名 → 4 guests regular ×1(¥195,000)+ Live shamisen ×1(¥70,000)= ¥255,000。サイトの見積もりと同額になる
  - 6名以上は見積もり額で決める。見積もり額の価格を追加して同じ手順で発行
  - Stripe の「請求書」機能は使わない(支払い後にサイトへ戻らないため、予約確定の計測ができない)
- 入金は Stripe の通知メールの**氏名・メールアドレス**で問い合わせと突き合わせる(本文で「同じ氏名・メールで決済」を依頼済み)。リンクを予約ごとに分けているので、どのリンクで払われたかでも照合できる。

| 旧リンク(2026-09-17 改定前・使用しない・無効化済みであること) | 通常 | 繁忙期 |
| --- | --- | --- |
| 2名 | https://buy.stripe.com/6oU5kD4jL8Z55eD6IW3Je00 | https://buy.stripe.com/cNibJ1aI98Z5ayXc3g3Je08 |
| 3名 | https://buy.stripe.com/cNi28reYpejp0Yn7N03Je02 | https://buy.stripe.com/28E8wP03v5MT36vc3g3Je04 |
| 4名 | https://buy.stripe.com/5kQeVd17z6QX22rd7k3Je05 | https://buy.stripe.com/dRm5kDdUl4IPayX4AO3Je07 |
| 5名 | https://buy.stripe.com/28EeVd9E57V1cH5gjw3Je01 | https://buy.stripe.com/00w00jbMd6QX8qPffs3Je06 |

  (Stripe 側でこれらのリンクを「無効」にしておくこと)

- 入金確認 → 確定通知(C)は**同日中**に(正式手配は上のルールで14日前まで)。この間が空くとお客様が不安になります。
- 体験当日の翌日に、お礼+レビュー依頼のメールを送る(文面は `docs/CONTENT.md` の口コミ収集フロー参照。Bókun導入後は自動化)。

---

## H. ラーメン作り教室(東京・渋谷 / 大阪・道頓堀)— 2026-10-10 公開

提携先:クレッシェンド株式会社(Cresc. Inc.、Viyago Japan)。連絡先 trade@viyago.jp / 080-2565-9506。店名・住所はサイトに出さない(オーナー指示)。2ページ構成:東京(`/tokyo/shibuya-ramen-class/`、Ramen Dojo Tokyo、1F 2-16-29 Ohashi, Meguro-ku)と大阪(`/osaka/dotonbori-ramen-class/`、Ramen Dojo Osaka、大阪市中央区宗右衛門町7-9 地下1階)。条件確認シートは大阪店名義で記入されたもので、オーナー判断(2026-10-10)で東京にも同条件を適用。大阪店は車椅子・ベビーカー不可(東京店は可)。大阪店の写真はOTA掲載分のうち店名ロゴが写っていない3点(＋東京店の工程写真2点)を使用。

- 売値 ¥25,000/名(税込表示)。提携先の一般価格 ¥17,500/名、当社卸 ¥15,000/名(いずれも税別。卸は税込 ¥16,500 相当)。Stripe手数料 3.6% を引いた粗利の目安は 1名あたり約 ¥7,600。
- 開催:毎日 11:00 / 13:30 / 16:00 / 18:30、約90分、1回16名まで(貸切20名、目安 ¥600,000 前後)。予約締切は前日。仮押さえは催行30日以上前の予約に限り、見積提示から5日間(未決済で自動解除)。最終人数確定は催行14日前。
- 含むもの:指導・材料・器具・エプロン・実食・飲料。ベジタリアン・ヴィーガン対応可。ハラール対応スープは要事前連絡・追加料金(金額未定)。未就学児は体験不可(保護者同伴で見学可)。子ども料金なし(大人と同額)。
- 取消(標準・19名以下):催行30日前まで無料、29〜14日前 50%、13日前以降 100%、無断不参加 100%。日程変更は14日前まで1回無料。請求基準は当社の支払額(卸)。ページの規定もこれに合わせてある。
- 予約の流れ:当面はメールで照会(営業日24時間以内に回答)。確定には日時・商品・人数・代表者名・言語・食事制限と全額決済。遅刻の待機は5〜10分。
- 未確認:最少催行人数(通常枠)、ハラール追加料金、保険、写真の使用期間・掲載前確認(両店とも)。

## I. 剣道体験・武士道体験(東京・日本橋)— 2026-10-10 プレビュー

提携先候補:株式会社Kendo Spirit(代表 海野大地、設立 2025年4月、所在地 東京都中央区日本橋浜町3-33-3 中島ビル 2-B、道場 2F SEC Nihonbashi Building, 2-9 Nihonbashikobunachō, Chuo-ku 103-0024、contact@kendospirit.jp / 080-8924-6085、公式 kendospirit.jp)。ページには社名・代表名・ビル名を出していない(検索されて直接予約されるのを避けるため)。写真はDriveの「PR写真」フォルダ(所有者 info@kendospirit.jp)から。条件確認シートは未取得。

- ページ:`/tokyo/nihonbashi-kendo-experience/`(約2時間、6歳〜、8名まで)と `/tokyo/nihonbashi-bushido-experience/`(約1時間、15歳〜、2〜8名、日本剣道形)。いずれも status "preview"。
- 公式サイトの一般価格(仮置き):剣道 大人 ¥20,000/子ども6〜15歳 ¥15,000/シニア65歳〜 ¥18,000、武士道 ¥10,000。当社売値は未定のため、ページには一般価格をそのまま仮置きしている。
- 公式の条件:英語・日本語対応、用具一式貸出、写真・動画データ提供、見学可、貸切可(1〜50名以上の団体対応)、キャンセルは開始24時間前まで無料・以降100%。ページの規定もこれに合わせてある。
- 未確認(先方への質問事項):卸値または送客手数料、開催時刻と曜日(固定の回があるか、予約締切)、回答期限と仮押さえ、決済方法(当社が集金して送金か)、最少催行人数(武士道は通常2名以上)、子ども・シニア料金の卸条件、貸切料金、9名以上の団体料金、保険、写真の使用条件(ロゴ入りカットの扱い・使用期間・掲載前確認)、海外の方向けの連絡手段(当日)、英語の講師が常時いるか、祝日・年末年始の休み。

## J. 茶道体験(東京・四谷)— 2026-10-10 プレビュー

提携先候補:四谷のギャラリー内茶室でAirbnb体験「茶道で心を満たす体験」を主催する茶道宗徧流教授(ホスト名 Kaori Watanabe、会場 Gallery&Studio r_cafe 有庵、新宿区160-0005)。Airbnbの公開情報のみで作成し、先方とは未接触。ページにはホスト名・会場名を出していない。

- ページ:`/tokyo/yotsuya-tea-ceremony/`(約90分、5歳〜、10名まで、英語)。status "preview"。写真は既存のWikimedia素材を仮置き。
- Airbnbの公開条件:¥8,800/名(早割 ¥7,040)、開始前日までキャンセル無料、持ち物は靴下、運動強度「軽め」、午後の回(15:00〜16:30 / 16:00〜17:30 など)。ページの価格はAirbnbの通常価格を仮置き。
- 未確認(先方への質問事項):提携可否と窓口、卸値・手数料、当社売値、開催曜日・時刻、予約締切と回答期限、最少催行人数、お菓子の有無、食事制限対応、会場の写真と使用許諾、子ども料金、貸切可否、保険、決済方法。

## K. 剣道体験ツアー(SAMURAI TRIP / 株式会社パークフォーアス)— 2026-10-10 プレビュー

ページ:`/tokyo/tokyo-kendo-experience-tour/`(5言語、status "preview")。事業者名・代表名はページに出していない。写真は公式サイトのもの(メールで使用許諾あり)。価格は大人卸値 ¥18,000 税抜の税込 ¥19,800 を仮置き(子ども9〜13歳は ¥16,500 相当)。当社売値は未定。キャンセル規定はメールどおり(15日前まで無料、14〜3日前50%、2日前以降100%)。質問事項は本文末尾。

### メールの内容(2026-10-06、永松氏より)

2026-10-07 にボーグ(KAMEHAME)宛てに届いた条件メール(Drive PDF)は、Kendo Spiritではなく「SAMURAI TRIP」(株式会社パークフォーアス 代表 永松謙使、samuraitrip07@gmail.com / 080-5642-3141、samuraitrip07.com)のもの。東京のほか大阪・京都・名古屋・沖縄・金沢・姫路で開催、会場は先方が都市中心部から車30〜50分圏で手配(指定不可)、平日10時〜が基本(名古屋13:30、沖縄13:00)、2〜200名。少人数(2〜13名)大人(14歳〜)¥18,000・子ども(9〜13歳)¥15,000(いずれも税抜、送客手数料15%)、団体(14〜200名)フル装備 ¥16,000/道衣・袴・竹刀 ¥13,000/竹刀のみ ¥9,000(税抜、手数料なし)。入金後に手配開始(銀行振込・PayPal)、全員の性別と身長区分を催行2週間前までに提出、キャンセルは2週間〜3日前50%・2日前〜100%、含むもの:用具一式・講師ガイド・会場・手ぬぐい。公式サイトとTripAdvisorの写真・文章は使用可。

### 未確認(先方への質問事項)

卸値の扱い(¥18,000税抜に対し手数料15%は当社の取り分か値引きか、税込表記)、当社売値、東京会場の候補エリアと集合方法、開始時刻の幅と土日の可否、通常期の回答期限と仮押さえ、入金から催行までの最短日数、メール添付の「注意事項」資料、14〜19名の軽装プランの卸値、70名以上の条件、保険、写真の使用期間、名前入り写真の扱い、当日の緊急連絡先、雨天・会場都合の中止時の扱い、他都市の会場エリアと時刻。
