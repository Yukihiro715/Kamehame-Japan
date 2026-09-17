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

PRICE
¥{total} for {n} guests — the total for your private group.
Tax and service charge are included. Nothing is added on the day.

WHAT'S INCLUDED
- A private tatami room for your party
- The multi-course Japanese dinner (seasonal menu)
- Free-flow drinks, including alcohol
- One geiko or maiko: conversation, one dance, ozashiki games
- An English-speaking interpreter guide throughout
- Commemorative photographs

NOT INCLUDED
- An additional geiko, maiko or shamisen player (¥60,500 each) — say the word if you would like one

MEETING
Gion / Higashiyama, Kyoto, about 10 minutes on foot from Gion-Shijo Station.
The house's name and street address come with your confirmation, together with a map and your guide's contact.

CANCELLATION
Once we formally arrange your evening with the house — which we do when your payment arrives — the house's terms apply:
- up to 4 days before: 50%
- 3 to 2 days before: 75%
- from the day before, and no-shows: 100%
Date changes follow the same scale. If the host cannot provide a geiko or maiko for your date, you receive a full refund.

TO CONFIRM
Please pay by {deadline, e.g. Friday 26 September, 17:00 Japan time} through this secure link:
{Stripe payment link}
Please use the same name and email address as in your request, so we can match your payment straight away.
(Bank transfer is also possible — reply and we will send the details.)

As soon as the payment is in, we arrange your evening with the house and send you the confirmation with the address, map and your guide's contact — within one business day.

Anything we should pass on to the kitchen or the house (allergies, a chair instead of tatami, a birthday)? Just reply to this email.

Warm regards,
{your name}
KAMEHAME JAPAN · Prosent Inc.
hello@kamehame-japan.com
```

**日本語対訳(担当者用)**
> {name} 様 / ご希望の {date} {time}、{n}名様で受け入れ先の空きが取れました。
> 料金:{n}名で合計 ¥{total}(税・サービス料込。当日の追加なし)
> 含まれるもの:貸切座敷/和食コース/飲み放題(アルコール含む)/芸妓または舞妓1名(歓談・舞・お座敷遊び)/英語通訳ガイド/記念撮影
> 含まれないもの:芸舞妓・地方の追加(各¥60,500)
> 集合:祇園・東山エリア、祇園四条駅から徒歩約10分。店名・住所・地図・ガイド連絡先は確定通知でお伝えします
> キャンセル:入金後に正式手配 → 以降は受け入れ先の規定(4日前まで50%、3〜2日前75%、前日以降・無連絡100%)。芸舞妓が手配できなかった場合は全額返金
> 確定するには:{期限}までに決済リンクからお支払いください(銀行振込も可)。お問い合わせ時と同じ氏名・メールアドレスで決済してください
> 入金確認後1営業日以内に、住所・地図・ガイド連絡先を記載した確定通知を送ります
> アレルギー・椅子の要否・お祝いなど、伝えておくことがあれば返信してください

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

**件名:** `Confirmed — {experience}, {date} at {time}`

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
{e.g. One vegetarian guest; a chair for one guest; birthday of Ms. X}
If anything has changed, reply to this email as soon as you can.

GOOD TO KNOW
- No dress code. Seating is on tatami (a chair is ready if you asked for one).
- Photos and video are welcome throughout, the dance included.
- Your host will pour and talk but, by custom, will not eat at the table — please don't press food or drink on her.
- Cancellation from now: 3–2 days before 75%, from the day before 100%.

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
> 受け入れ先に伝えた内容:{食事制限・椅子・お祝いなど}。変更があればすぐ返信を
> 補足:ドレスコードなし/畳席/撮影自由/芸舞妓は席で飲食しない慣習/この時点からのキャンセルは3〜2日前75%、前日以降100%

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

## 運用メモ

- **返信は必ず hello@kamehame-japan.com から**(Google グループの「グループとして送信」または担当者の送信元に hello@ を追加)。お客様は自動返信の返信先が hello@ なので、スレッドが1本になります。
- 条件案内(A)を送ったら、**受け入れ先には「仮押さえ」の連絡**をしておく(正式手配は入金後。芸舞妓の手配開始=キャンセル料発生なので、入金前に正式手配しない)。
- Stripe の支払いリンクは**人数×季節ごとに固定の8本**(下表)。条件案内(A)には該当する1本だけを貼る。入金は Stripe の通知メールの**氏名・メールアドレス**で問い合わせと突き合わせる(本文で「同じ氏名・メールで決済」を依頼済み)。
- 繁忙期は 3/15〜5/31 と 10/1〜11/30(体験日で判定)。6名以上は受け入れ先に見積もりを取ってから、Stripe で都度リンクを作る。

| 人数 | 通常 | 繁忙期 |
| --- | --- | --- |
| 2名 | ¥139,600 · https://buy.stripe.com/6oU5kD4jL8Z55eD6IW3Je00 | ¥159,600 · https://buy.stripe.com/cNibJ1aI98Z5ayXc3g3Je08 |
| 3名 | ¥157,500 · https://buy.stripe.com/cNi28reYpejp0Yn7N03Je02 | ¥187,500 · https://buy.stripe.com/28E8wP03v5MT36vc3g3Je04 |
| 4名 | ¥166,000 · https://buy.stripe.com/5kQeVd17z6QX22rd7k3Je05 | ¥206,000 · https://buy.stripe.com/dRm5kDdUl4IPayX4AO3Je07 |
| 5名 | ¥190,000 · https://buy.stripe.com/28EeVd9E57V1cH5gjw3Je01 | ¥240,000 · https://buy.stripe.com/00w00jbMd6QX8qPffs3Je06 |

  (2026-09-17 に Stripe 管理画面の金額と照合済み。Stripe 側で無効になっている ¥157,500 のリンクが1本あるが、使わない)
- 入金確認 → 受け入れ先に正式手配 → 確定通知(C)は**同日中**に。この間が空くとお客様が不安になります。
- 体験当日の翌日に、お礼+レビュー依頼のメールを送る(文面は `docs/CONTENT.md` の口コミ収集フロー参照。Bókun導入後は自動化)。
