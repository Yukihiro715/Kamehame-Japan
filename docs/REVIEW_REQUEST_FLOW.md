# 口コミ依頼メールの運用フロー（引き継ぎ用）

体験が終わったお客様に、翌日の朝に口コミ・写真・動画をお願いするメールを送る。文面は `docs/EMAIL_TEMPLATES.md` の **E**、技術的な仕組みは `docs/REVIEW_MEDIA.md`。

## 1. いつ・誰に

- 送る相手: 予約が確定し、体験を実施したお客様（代表者のメールアドレス）。
- タイミング: 体験翌日の朝（日本時間 9〜10 時目安）。確定通知を送る時点で E を下書きし、Gmail の「送信日時を設定」で予約送信しておく。
- 送信元: hello@kamehame-japan.com（返信もここに届く）。

## 2. リンクの作り方

```
https://kamehame-japan.com/{言語}/review/?experience={体験スラッグ}&ref={予約番号}
```

- `{言語}`: `en`（英語）、`ja`、`es`、`fr`、`zh-tw`。お客様とやり取りした言語に合わせる。
- `{体験スラッグ}`: 体験ページ URL の最後の部分（下の一覧）。
- `{予約番号}`: `KJ-体験日(YYMMDD)-連番`（例 `KJ-261012-01`）。確定通知と同じ番号。フォームに自動で入り、届いた口コミと予約の照合に使う。
- 例: `https://kamehame-japan.com/en/review/?experience=evening-with-geiko&ref=KJ-261012-01`

| 体験 | スラッグ |
|---|---|
| 芸妓・舞妓とのお座敷（京都） | `evening-with-geiko` |
| 名前を漢字で・書道（東京） | `kanji-name-calligraphy` |
| ラーメン作り（渋谷） | `shibuya-ramen-class` |
| ラーメン作り（道頓堀） | `dotonbori-ramen-class` |
| 剣道体験・日本橋道場 | `nihonbashi-kendo-experience` |
| 武士道体験・日本剣道形 | `nihonbashi-bushido-experience` |
| 剣道体験ツアー（東京／大阪／京都／名古屋／沖縄／金沢／姫路） | `tokyo-kendo-experience-tour` ほか `{都市}-kendo-experience-tour` |
| カスタムゴルフ手配 | `mt-fuji-golf-day` |
| 茶道・庭園茶室（西京都） | `kyoto-garden-teahouse-tea-ceremony` |
| 茶道・東山（共同） | `kyoto-higashiyama-shared-tea-ceremony` |
| 茶道・東山（貸切） | `kyoto-higashiyama-private-tea-ceremony` |
| 茶道・東山 別邸（貸切） | `kyoto-higashiyama-annex-tea-ceremony` |

乗合バスゴルフ（提携旅行会社の販売）は体験ページがないため、`experience` を省いた `https://kamehame-japan.com/en/review/?ref={受付番号}` を使い、本文で「Shared Bus Golf Tour」と書く。

## 3. メール本文（E）

件名: `Thank you for last night — could you help us with one small thing?`

要点（全文は EMAIL_TEMPLATES.md）:
1. お礼。
2. KAMEHAME JAPAN は始まったばかりで、短い口コミと、あれば写真・短い動画をお願いしたい（上のリンク）。
3. フォームで「写真・動画をサイトと SNS（Instagram、Facebook、YouTube）で使ってよいか」をチェックで選べる。表示はファーストネームのみ、メールでいつでも撤回可。使ってほしくなければチェック不要、口コミだけでも歓迎。
4. 予約確認済みの方だけが投稿でき、内容は手を加えずに掲載する。
5. 不満があればこのメールへの返信で直接教えてほしい。

## 4. 送った後に起きること

- お客様が送信すると、hello@ に `[Review] {体験} — {星}★ — {名前} — {予約番号}` の件名でメールが届く（写真は添付、動画はファイル名と保存先）。
- 写真・動画は運営画面の「レビュー素材」 https://kamehame-japan.com/ops/reviews/ に、本文・許諾の有無と一緒に並ぶ。「SNS・サイト利用: 許諾あり」のものだけ使う。
- 口コミ本文の掲載は手作業: 予約と照合し、`lib/reviews.ts` に `source: "direct"`, `verified: true` で追加（自作・依頼による創作は不可）。
- 1 週間返事がなければ、同じリンクで一度だけリマインドしてよい（しつこくしない）。
