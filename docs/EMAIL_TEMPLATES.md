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
- Anything beyond your plan. If you would like live shamisen (+¥65,000) or a second performer with shamisen (+¥130,000), reply and we re-quote

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
> 含まれないもの:プラン外のもの。生三味線(+¥65,000)や2名出演(+¥130,000)を希望なら再見積
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

## G. ゴルフ(Private Mt. Fuji Golf Experience)の流れ

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
- `Private Mt. Fuji Golf Experience from Tokyo`:3価格 ¥180,000(2 golfers)/ ¥220,000(3 golfers)/ ¥280,000(4 golfers)
- `Professional photography and video — Mt. Fuji golf`:2価格 ¥120,000(2 golfers)/ ¥144,000(3 golfers)
- 支払いリンクは**人数ごとに1本を使い回す**(2026-10-04 決定。「支払い回数を制限」は付けない)。品目 = 人数に合う価格 ×1、数量変更は「許可しない」。「支払い後」のリダイレクトは `https://kamehame-japan.com/{lang}/booked/?session_id={CHECKOUT_SESSION_ID}`(お客様の言語。英語なら `/en/`)。撮影オプション付き・5〜6名は、その予約用に別のリンクを作る。
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
翌営業日まで 提携先から詳細が届いたら確定通知(G-C)。届かなくても G-B は当日中に送る
7日前      無料キャンセル期限(18:00)。提携先の手配が最終か確認
前日       リマインド(G-D):集合時刻・ガイドの電話・天気・持ち物
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

We are now making the final arrangements with the course and your guide. Within one business day you will receive your confirmation with the meeting point in your hotel lobby, your guide's name and phone, and the car details.

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
> ゴルフ場とガイドと最終手配中で、1営業日以内に集合場所・ガイドの名前と電話・車両を記載した確定通知を送ります。
> (未入手なら)ホテル名/お二人の氏名と利き手/当日の携帯番号を返信してください。

### G-C. 確定通知(詳細が揃ったら)

**件名:** `Confirmed — Private Mt. Fuji Golf Experience, {weekday, date} · {予約番号}`

```
Hello {name},

Everything is arranged for your golf day. Here are the details.

DATE AND MEETING
{Weekday, date} — please be in the lobby of {hotel name} by {time − 5 min}. The car leaves at {time}.
Your guide, {guide name}, will be waiting in the lobby {landmark, e.g. near the reception desk}.

YOUR COURSE
{Course name}, {area}
Tee off at {tee time}. About {x} hours by private car from your hotel; you arrive around {time} and check in with your guide.

YOUR GUIDE AND CAR
{Guide name} — phone / WhatsApp: {number} (for the day itself, if you are running late or cannot find each other)
Car: {make / colour}, driver {name}

WHAT WE HAVE ARRANGED
- Rental clubs: {one ladies' set, one men's set; both right-handed}
- Lunch at the clubhouse
- {Professional photography and video — yes / no}
- A ball marker with your names in kanji, handed to you on the day; your highlight film follows by email within {x} days

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
> 日時・集合:{date}、{ホテル名}のロビーに{出発5分前}まで。出発 {time}。ガイド {名前} が {目印} でお待ちします
> コース:{コース名}。ティーオフ {時刻}。ホテルから約{x}時間、{到着時刻}頃に到着しガイドがチェックイン
> ガイド・車両:{名前}、電話/WhatsApp {番号}(当日用)。車両 {車種・色}、ドライバー {名前}
> 手配済み:レンタルクラブ({内容})/クラブハウス昼食/撮影オプション有無/ボールマーカーは当日お渡し、ハイライト映像は{x}日以内にメール
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
- English-speaking golf guide who rides with you and plays the round with you
- Lunch at the clubhouse
- Highlight film of the day and a ball marker with your name in kanji
Not included: golf shoes (bring your own, or ask us about rental). Optional: professional photography and video, ¥{120,000} for {n} golfers.

CANCELLATION (from payment, Japan time)
Free until 18:00 on {date − 7}; 50% from {date − 6} to {date − 2}; 100% from {date − 1} and no-shows. Weather closure: full refund except costs already incurred.

AFTER PAYMENT
Within one business day you receive the meeting point in your hotel lobby, your guide's name and phone / WhatsApp, and the car details.

Could you also reply with your hotel's name, both golfers' full names (and whether either of you plays left-handed), and a mobile number for the day? Before or after paying — either is fine.

Warm regards,
{your name}
KAMEHAME JAPAN · Prosent Inc.
hello@kamehame-japan.com
```

**日本語対訳(担当者用)**
> コースの手配ができました:{date} {area}のホテルを{time}出発/{コース名}、ティーオフ{時刻}/{n}名で合計 ¥{total}(税込、当日の追加なし)
> 確定するには:{期限}までに決済リンクから。問い合わせと同じ氏名・メールで。入金で予約確定。ティータイムは期限まで押さえ、過ぎると変わる可能性がある
> 含まれるもの:ホテル往復の専用車/プレーフィ・レンタルクラブ/英語ガイド(同乗・一緒にラウンド)/クラブハウス昼食/ハイライト映像とボールマーカー。含まれないもの:シューズ。オプション:撮影 ¥{120,000}
> キャンセル(入金後・日本時間):7日前18時まで無料、6〜2日前50%、前日以降・無連絡100%。天候クローズは発生済み費用を除き返金
> 入金後1営業日以内に、ロビー集合場所・ガイドの名前と連絡先・車両を送る
> 返信でほしいこと(支払いの前後どちらでも):ホテル名/2名の氏名と利き手/当日の携帯

**運用:** 氏名・ホテル名・連絡先は支払いの条件にしない(まず入金)。足りないものは確定通知(G-C)を送る前に集める。提携先への正式手配は入金後すぐ(無料キャンセルは7日前まで、提携先の取消条件と重ならないよう確認)。

---

## 運用メモ

- **返信は必ず hello@kamehame-japan.com から**(Google グループの「グループとして送信」または担当者の送信元に hello@ を追加)。お客様は自動返信の返信先が hello@ なので、スレッドが1本になります。
- 条件案内(A)を送ったら、**受け入れ先には「仮押さえ」の連絡**をしておく(正式手配は入金後。芸舞妓の手配開始=受け入れ先の取消料発生なので、入金前に正式手配しない)。
- **正式手配は入金確認後、遅くとも開催14日前まで**に行う(14日前を切っている予約はすぐに手配)。お客様の無料キャンセル期間(14日前まで)と受け入れ先の取消料発生(正式手配後)を重ねないための基準。都をどり期間(4月)は直前まで出演状況が読めないので、空き返信の時点でその旨を一言添える。
- サイトの締切は**7日前17時(日本時間)**。カレンダーもそこで止まる。10〜14日前を推奨と案内している。
- **料金(2026-10-06 改定)**: 人数別の総額 + プランの定額追加。受け入れ先の定価の10%引き(卸値)に、2名 ¥30,000 / 3名 ¥35,000 / 4名 ¥40,000 / 5名 ¥50,000 を上乗せし千円単位に切り上げ。追加出演者は受け入れ先 各¥60,500(両シーズン同額・10%引き対象)に ¥10,000(三味線)/ ¥20,000(2名+三味線)を上乗せ

| 人数 | 通常期 | ハイシーズン(3/15〜5/31、10/1〜11/30) |
| --- | --- | --- |
| 2名 | ¥156,000 | ¥174,000 |
| 3名 | ¥177,000 | ¥204,000 |
| 4名 | ¥190,000 | ¥226,000 |
| 5名 | ¥221,000 | ¥266,000 |

  - 生三味線つき: +¥65,000 / 出演者2名(2名+生三味線): +¥130,000(人数・季節にかかわらず定額)。6名以上は個別見積もり
- **Stripe の商品**(2026-10-06 に作り直し。料金改定のときはここの価格だけを差し替える)
  - `Private Geisha Evening in Kyoto`: 8価格(2 guests regular ¥156,000 / 3 guests regular ¥177,000 / 4 guests regular ¥190,000 / 5 guests regular ¥221,000 / 2 guests high season ¥174,000 / 3 guests high season ¥204,000 / 4 guests high season ¥226,000 / 5 guests high season ¥266,000)。各価格の説明欄に人数と季節を書く
  - `Live shamisen (jikata) — Private Geisha Evening`: ¥65,000
  - `Second performer and live shamisen — Private Geisha Evening`: ¥130,000
  - 旧商品(Select / Signature / Private Reserve / Additional guest)は**アーカイブ**して、新規リンクで選ばないようにする
  - 繁忙期(high season)は 3/15〜5/31 と 10/1〜11/30。**体験日**で判断する(問い合わせ日ではない)
- **支払いリンクは予約ごとに1本作る**(使い回さない)。空きが確定し、条件案内(A)を送るときに:
  1. Stripe →「支払いリンク」→「＋新規作成」
  2. 1品目: `Private Geisha Evening in Kyoto` の、人数と体験日の季節に合う価格、数量1
  3. 2品目: 生三味線つきなら `Live shamisen` ×1、出演者2名なら `Second performer and live shamisen` ×1(お座敷プランは2品目なし)。数量の変更は「お客様に許可しない」
  4. 「支払い後」→「顧客をウェブサイトにリダイレクト」→ `https://kamehame-japan.com/en/booked/?session_id={CHECKOUT_SESSION_ID}`(サイトの予約確定ページ。金額の表示と広告の成果計測をここで行う)
  5. 「支払い回数を制限」は付けない(2026-10-04 決定。入金は氏名・メール・金額で照合する)
  6. 作成したリンクを条件案内(A)の `{Stripe payment link}` に貼る
  - 例: 生三味線つき・通常期・4名 → 4 guests regular ×1(¥190,000)+ Live shamisen ×1(¥65,000)= ¥255,000。サイトの見積もりと同額になる
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
