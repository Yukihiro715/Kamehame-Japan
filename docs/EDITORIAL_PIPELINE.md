# 記事制作の初期運用

目的は、商品につながる英語記事を1人で確認・公開できること。初期版は「登録済みテーマ → 出典取得 → 執筆 → 別リクエストで批評 → 日本語レビューと本文プレビュー → 人が確認 → 公開PR」です。自動レビューは事実の正しさを保証しません。検索順位・全ページのインデックス登録も保証できません。

## 最初の設定

1. この実装PRをレビューしてmainへマージする。記事はまだ公開されません。
2. GitHub Settings → Secrets and variables → Actions のSecretsに `OPENAI_API_KEY` と `FIRECRAWL_API_KEY` を登録。ChatGPTや接続済みFirecrawlのキーはActionsへ自動で渡りません。チャットやコードにキーを書かないでください。
3. 同画面のVariablesに `OPENAI_MODEL` を設定。Responses APIのStructured Outputsに対応し、契約上利用できるモデルIDを選んでください。
4. Settings → Actions → GeneralでGitHub ActionsによるPR作成を許可する。組織の制限があれば管理者の設定が必要です。

初期版に定期実行はありません。1本が期待通りできることと費用を確認してから、週2本などに進みます。

## ふだんの操作

1. Actions → **Editorial draft and review** → Run workflow。main、`generate`、テーマのslugを選ぶ。
2. 作られた下書きPRと、実行のArtifacts内の `preview.html` / `review.md` を見る。HTMLは本文確認用で、サイト全体を再現するプレビューではありません。外部の自社画像を読み込みます。
3. 本文、商品条件、根拠、権利を確認。未確認事項があればJSON原稿を修正し、根拠も更新する。`questionsJa`や`blockersJa`を、確認せずに消さないこと。機械レビュー後に直した箇所は人が再確認する。
4. 同workflowで `approve` と同じslugを選び、確認チェックを入れる。`editorial/<slug>` ブランチから**JSONだけ**を読み、新しい `editorial-publish/<slug>` PRを作る。
5. 公開PRの本文・差分・Artifacts・実行結果を確認し、Ready for reviewにしてmainへマージ。既存のCloudflareデプロイで公開。下書きPRは閉じてよい。

下書きPRをマージしても `status: draft` の記事はページ・一覧・サイトマップに出ません。公開PRは自動マージされません。既存ブランチがあるテーマは上書きせず停止します。再生成したい場合は旧PRとブランチを整理してから実行してください。

GitHub標準トークンが作成したPRは、別のPRトリガーのworkflowを起動しない場合があります。このworkflow自身でテストとbuildを実行します。必須チェックを設定している場合はその運用との整合を確認してください。失敗時にブランチだけ残ったら、その実行ログを確認してPR作成を再開します。

## 対象と出典

`content/editorial-topics.json` に漢字・ゴルフ・芸妓/舞妓の3テーマを登録。初回は漢字の記事を推奨。検索ボリュームは未取得のため、この順番は売上や順位の予測ではありません。

- 商品条件はコードを実行して得た**公開カタログデータ**を正とする。コード内コメント、顧客情報、非公開ファイルはモデルに渡さない。
- 外部調査は承認済みURLを1〜3件取得。競合の参考記事は `kind: reference`、公的な一次情報は `kind: official`。Deeper Japanを含め、次のテーマに合う具体的URLを人が選んで追加できる。初期版は自動競合巡回・検索語の自動発掘を行わない。
- 価格や予約条件を競合から転用しない。体験談、権威、口コミを創作しない。外部文章や写真を流用しない。
- 原稿の各ブロックと主張に出典IDを記録。公開ページには参考リンクを表示。原文全文は公開リポジトリに保存しない。引用を避け、外部1出典の要約は100語以内をモデルに指示する（人も確認）。

## コマンド

APIキーなしで本文と日本語レビューを確認する場合は `npm run editorial -- sample choosing-kanji-for-your-name`。`examples/editorial/` の原稿は自社データと実際に取得したJNTO解説をもとにCodexが作った検証用サンプルです。API自動生成の成功例ではなく、独立レビュー・公開承認も未実施です。公開データにもテーマの生成済み判定にも入りません。

```sh
npm run editorial -- generate choosing-kanji-for-your-name
npm run editorial -- preview choosing-kanji-for-your-name
npm run editorial -- check
npm run test:editorial
npm run editorial -- approve choosing-kanji-for-your-name --reviewer=YOUR_GITHUB_NAME --confirm-content-and-image-rights
npm run build
```

原稿は `content/journal/<slug>.json`。JSONの構造は `scripts/editorial/schema.mjs`。承認後に原稿・出典・写真を変更すると承認ハッシュが無効になり、再承認までbuildが止まる。既に公開済みの記事を修正する場合は一度draftに戻してプレビュー・再確認し、approveを実行する。

`lib/journal.generated.json` はbuild時に再生成する公開データ。手で編集しない。生成記事は既存Journal、関連記事、商品リンク、canonical、英語のhreflang、Article構造化データ、サイトマップへ接続。生成記事のlastmodは実際の原稿更新日を使用し、関連する一覧・商品ページにも更新日を反映する。既存の内容変更に基づくサイトマップ日付管理と連携する。

## 検査・費用・公開後

- draftは公開データから除外。公開にはレビューpass、未解決事項なし、人の確認記録と一致するハッシュが必要。
- 承認時に現行商品条件との差分を検査。公開後の商品変更はcheck/buildで再確認を促す。サイト全体のデプロイは商品条件の差分だけでは止めない。
- 形式・出典ID・重複タイトル・長い重複文・外部の連続12語一致・画像ファイル・秘密情報らしき文字列を検査。意味上の重複や微妙な誤りは人の判断が必要。
- 1実行は最大3ページ取得、生成2回、出力上限6,000/3,000トークン。入力にも文字数上限あり。自動リトライなし、workflow15分上限。使用量はJSONに保存。これは円建ての支出上限ではないため、API提供元の予算/通知も設定する。失敗リクエストにも課金される場合がある。
- 記事→商品のクリックで `article_product_click` をdataLayerへ送る。GTMでGA4イベントへ接続する設定は別途必要。新しい個人情報は送らない。
- 公開後は実URLの200、noindexの有無、canonical、サイトマップを確認し、重要記事はSearch Consoleで確認。サイトマップ掲載はGoogleへの発見支援で、登録保証ではない。公開2〜4週後を目安に表示・検索語・商品クリックを確認し、読者に足りない内容を改稿する。

次の段階: GSC/GA4連携、テーマの自動優先順位付け、週次の定期実行、古い出典の再取得。これらはこの初期版ではまだ稼働しません。

API仕様: [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses)、[Firecrawl Scrape](https://docs.firecrawl.dev/features/scrape)。
