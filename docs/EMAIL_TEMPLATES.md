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
- {By plan — Select: one geiko or maiko / Signature: one geiko or maiko + live shamisen / Private Reserve: two geiko or maiko + live shamisen}: conversation, one dance, ozashiki games
- An interpreter guide throughout — English, Spanish or French (as chosen in the request)
- Commemorative photographs

NOT INCLUDED
- Anything beyond your plan. If you would like live shamisen or a second host, reply and we re-quote on the matching plan (Signature / Private Reserve)

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
> 含まれるもの:貸切座敷/和食コース/飲み放題(アルコール含む)/プランに応じた出演者(Select:芸妓または舞妓1名/Signature:1名+地方の生三味線/Private Reserve:2名+地方の生三味線。歓談・舞・お座敷遊び)/通訳ガイド(英・西・仏から選択)/記念撮影
> 含まれないもの:プラン外のもの。生三味線や2名出演を希望なら該当プランで再見積(単品オプションの案内はしない)
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

## 運用メモ

- **返信は必ず hello@kamehame-japan.com から**(Google グループの「グループとして送信」または担当者の送信元に hello@ を追加)。お客様は自動返信の返信先が hello@ なので、スレッドが1本になります。
- 条件案内(A)を送ったら、**受け入れ先には「仮押さえ」の連絡**をしておく(正式手配は入金後。芸舞妓の手配開始=受け入れ先の取消料発生なので、入金前に正式手配しない)。
- **正式手配は入金確認後、遅くとも開催14日前まで**に行う(14日前を切っている予約はすぐに手配)。お客様の無料キャンセル期間(14日前まで)と受け入れ先の取消料発生(正式手配後)を重ねないための基準。都をどり期間(4月)は直前まで出演状況が読めないので、空き返信の時点でその旨を一言添える。
- サイトの締切は**7日前17時(日本時間)**。カレンダーもそこで止まる。10〜14日前を推奨と案内している。
- **Stripe の支払いリンクは作り直しが必要**(2026-09-17 の料金改定で、下の8本は旧料金。使わない)。新しい料金は「プラン × 時期」の基本料金(2名まで)+追加人数。Stripe では次の構成が扱いやすい:
  - 商品「Private Geisha Evening」に価格6本(Select / Signature / Private Reserve × 通常期 / 繁忙期)。検索キー例: `geiko_select_regular` `geiko_select_peak` `geiko_signature_regular` … `geiko_reserve_peak`
  - 商品「Additional guest」に価格2本(通常期 ¥39,800 / 繁忙期 ¥49,800)
  - 支払いリンクは「プラン×時期」の6本。各リンクに同じ時期の「Additional guest」を2品目として追加し、**数量を変更可能(0〜3)**にしておくと、3〜5名でもリンク1本で足ります(お客様に「Additional guest の数量を N にしてください」と案内、またはこちらで数量を指定した個別リンクを都度発行)
  - 6名以上は都度見積もり → その金額で個別リンクを発行
- 条件案内(A)には該当する1本だけを貼る。入金は Stripe の通知メールの**氏名・メールアドレス**で問い合わせと突き合わせる(本文で「同じ氏名・メールで決済」を依頼済み)。

| 旧リンク(2026-09-17 改定前・使用しない) | 通常 | 繁忙期 |
| --- | --- | --- |
| 2名 | https://buy.stripe.com/6oU5kD4jL8Z55eD6IW3Je00 | https://buy.stripe.com/cNibJ1aI98Z5ayXc3g3Je08 |
| 3名 | https://buy.stripe.com/cNi28reYpejp0Yn7N03Je02 | https://buy.stripe.com/28E8wP03v5MT36vc3g3Je04 |
| 4名 | https://buy.stripe.com/5kQeVd17z6QX22rd7k3Je05 | https://buy.stripe.com/dRm5kDdUl4IPayX4AO3Je07 |
| 5名 | https://buy.stripe.com/28EeVd9E57V1cH5gjw3Je01 | https://buy.stripe.com/00w00jbMd6QX8qPffs3Je06 |

  (Stripe 側でこれらのリンクを「無効」にしておくこと)

- 入金確認 → 確定通知(C)は**同日中**に(正式手配は上のルールで14日前まで)。この間が空くとお客様が不安になります。
- 体験当日の翌日に、お礼+レビュー依頼のメールを送る(文面は `docs/CONTENT.md` の口コミ収集フロー参照。Bókun導入後は自動化)。
