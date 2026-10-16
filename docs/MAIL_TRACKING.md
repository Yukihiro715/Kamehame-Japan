# 個別メールの承認送信と配達・開封・クリック計測

人が作成・承認した個別メール（見積もり、返信、リマインド、確定案内）を、台帳の
「メール送信キュー」から **hello@kamehame-japan.com** 名義で Resend 経由で送り、
配達・開封・クリックをメール単位で台帳に戻す仕組みです。ゴルフの自動受付・決済案内
（`PAYMENT_AUTOMATION.md`）とは **独立したスイッチ** で動き、既存の15分フォロー、
予約の台帳追加、自動返信には触れません。

> 2026-10-16 時点の状態: **本番稼働中**（`MANUAL_SEND_ENABLED=true`）。Apps Script（2ファイル）の配置と
> Web アプリ公開、プロパティ、トリガー、Cloudflare の `MAIL_QUEUE_TOKEN` / `MAIL_QUEUE_URL` / `RESEND_READ_KEY`、
> Resend の Webhook（署名検証済み）とトラッキングを設定し、管理用テスト宛先で2通の受入テストを完了。
> 送信・配達・開封・決済リンククリック／その他リンククリックの分離・同一案件の複数メール・控え送信・
> Message-ID の後追い取得を本番で確認した。下の「完了条件」に項目ごとの結果がある。

## 構成

```
ChatGPT／担当者 ──(行を追加)──▶ 台帳「メール送信キュー」(下書き)
担当者 ──(承認✓)──▶ 承認ハッシュ＝宛先・件名・本文・HTML・返信元の固定版
Apps Script processMailQueue (1分毎) ──POST /api/mail/send (Bearer MAIL_QUEUE_TOKEN)──▶ Worker ──▶ Resend
Resend ──Webhook(署名)──▶ Worker /api/webhooks/resend ──(kind=manual のみ)──▶ Apps Script mail_event ──▶ キュー行・メール配信ログ・決済／連絡管理 Z:AD
Apps Script reconcileMailQueue (1時間毎) ──GET /api/mail/status──▶ Worker ──▶ Resend（Webhook取りこぼしの照合）
```

- 送信元 `Yukihiro, KAMEHAME JAPAN <hello@kamehame-japan.com>`、返信先 `hello@kamehame-japan.com`（従来どおり）。
- Resend のタグ `kind=manual` / `booking=<案件ID>` / `mail=<メールID>` と `X-KJ-Reference` ヘッダーを付けます。
  Webhook はこのタグでキューへ振り分けます。ack／payment／intro はゴルフ自動化（`GOLF_AUTOMATION_URL`）へ、
  follow-up 等は無視します。どちらのキューも、それぞれの URL とトークンが設定されたときだけ有効です。
- メールID は `案件ID-M01, -M02…`。同じ案件の見積もり・返信・リマインドは別行＝別メールIDで管理し、履歴は混ざりません。
- 冪等キーは `manual/<メールID>/<承認ハッシュ先頭16桁>`。再実行・タイムアウト時も同じ内容は同じキーで送るため、
  Resend 側で24時間は二重送信になりません。1時間を超えて送信中のままの行は「要確認」で停止します（自動再送なし）。
- 案件IDは **予約一覧に存在する ID だけ**（KJ-YYMMDD-NN、KJ-INQ-YYMMDD-NN、ゴルフ自動化の KJ-YYMMDD-Gxxxxxxxx）。
  存在しない ID や、予約一覧のメールと違う宛先は送らず「要確認」にします。新しい案件を作ることはありません。
- HTML とテキストに対応（テキストは必須、HTML は任意）。開封計測は HTML メールだけで可能なため、
  テキストのみは「計測対象外（テキストのみ）」、HTML で未検知は「未検知」と表示します。
- クリックは Stripe の決済リンク（book／buy／checkout.stripe.com、または台帳の決済URL）とそれ以外（署名・サイト）を分けて記録します。
- 開封・クリックは参考値です。入金は従来どおり Stripe の実決済（`event_` の署名検証済みイベント）だけで判定します。
- 過去に Gmail から送ったメールは計測対象外で、推測で埋めません。

## 台帳のタブ（作成済み）

`メール送信キュー`（A〜Z）

| 列 | 内容 | 入力者 |
|---|---|---|
| A メールID | 自動採番（承認時） | 自動 |
| B 案件ID | 予約一覧の ID | ChatGPT／担当者 |
| C 種別 | 見積もり／返信／リマインド／確定案内／その他 | ChatGPT／担当者 |
| D 宛先 | お客様のメール（予約一覧と一致させる） | ChatGPT／担当者 |
| E 件名 | `[案件ID] …` を推奨（Gmail 検索と照合に使う） | ChatGPT／担当者 |
| F 本文（英語・テキスト） | 送る英文 | ChatGPT／担当者 |
| G 本文HTML（任意） | HTML 版（開封計測に必要） | 任意 |
| H 日本語訳（確認用） | 承認者の確認用。送信しない | ChatGPT |
| I 返信元Message-ID（任意） | `<…@…>`。空欄で種別が返信／リマインドなら Gmail から自動検索（`MAIL_THREAD_LOOKUP=true` のとき） | 任意 |
| J 承認 | チェックで承認。内容を直すと自動で外れる | 担当者 |
| K〜M | 承認日時・承認者・承認ハッシュ（M は非表示） | 自動 |
| N 状態 | 下書き→承認済み→送信中→送信済み／エラー／要確認／取消 | 自動（取消は手動） |
| O〜Q | 送信日時・ResendメールID・Message-ID | 自動 |
| R〜U | 配達日時・開封（参考）・決済リンククリック（参考）・その他リンククリック（参考） | 自動 |
| V〜W | 配達エラー・最終エラー | 自動 |
| X〜Y | 作成日時・作成経路（ChatGPT／手入力／Claude） | 任意 |
| Z 内部データ | 冪等キー・イベント履歴（非表示、編集しない） | 自動 |

- `メール配信ログ`: 既存タブ。個別メールのイベントは メール種別 `manual:<メールID>` で追記（イベントID重複は無視）。
- `メール配信集計`: 11〜18行目に個別メールの送信・配達・開封・クリック・エラー・未完了行を追加（数式）。
- `決済・連絡管理`: Z〜AD 列に「最終個別メール送信日時／件名／最終開封／最終決済リンククリック／送信件数」を案件ごとに更新。
  既存の A〜Y 列・数式・入力規則は変更していません。送信時に 予約一覧 の「最終連絡日」が送信日より古ければ送信日に更新します。

## 本番設定の順序

1. **Apps Script**（台帳を扱う Gmail アカウントで、`PAYMENT_AUTOMATION.md` と同じ独立プロジェクト。既存の台帳スクリプトは上書きしない）
   - ファイル1: `docs/payment-automation.gs`、ファイル2: `docs/mail-queue.gs`（同じプロジェクトに2ファイル。`doPost` が `mail_event` を振り分けます）。
   - スクリプトのプロパティ: `SPREADSHEET_ID`、`AUTOMATION_TOKEN`（ゴルフ用。未使用でも可）、`TEAM_EMAIL`、
     `MAIL_QUEUE_TOKEN`（24文字以上のランダム値）、`MAIL_SEND_URL=https://kamehame-japan.com/api/mail/send`、
     `MAIL_STATUS_URL=https://kamehame-japan.com/api/mail/status`、`MANUAL_SEND_ENABLED=false`（最初は false）、
     `MAIL_THREAD_LOOKUP=true`（返信の Gmail 照合を使う場合）、`ARCHIVE_COPY_TO=hello@kamehame-japan.com`（任意: 送信控えの宛先。グループ可）。
     `ARCHIVE_BCC` は設定しないでください（控えを開いたスタッフの操作がお客様の開封・クリックとして記録されます）。
     `LIVE_SEND_ENABLED` はゴルフ自動化のスイッチで、このキューには影響しません。
   - 「ウェブアプリ」としてデプロイ（自分として実行、全員がアクセス可）。`/exec` URL を控える。
   - `installMailQueue()` を実行して権限を許可し、トリガー3つ（processMailQueue 毎分、reconcileMailQueue 毎時、onQueueEdit 編集時）を作成。
2. **Cloudflare Worker**（Settings → Variables and Secrets、すべて Secret）
   - `MAIL_QUEUE_TOKEN`（Apps Script と同じ値）、`MAIL_QUEUE_URL`（上の `/exec` URL）、`RESEND_WEBHOOK_SECRET`（Resend の署名秘密値）。
   - `GOLF_AUTOMATION_URL` / `GOLF_AUTOMATION_TOKEN` は **設定しない**（設定するとゴルフ自動受付が有効になります）。
   - `RESEND_API_KEY` は既存のまま。送信は Worker が行うので、Apps Script に Resend キーは不要です。
   - `RESEND_READ_KEY`（任意）: 既存キーが Resend の「Sending access」限定だと、送信後の Message-ID 取得と毎時の照合（Retrieve Email）が
     401/403 で失敗します（キューの内部データに `reconcileHttp: 502` と `upstream` が残ります）。その場合は Resend → API Keys で
     「Full access」のキーを追加し、この名前で Secret に入れます。読み取りにだけ使い、送信は従来のキーのままです。
3. **Resend**
   - Webhooks に `https://kamehame-japan.com/api/webhooks/resend` を登録。購読: sent, delivered, delivery_delayed, bounced, failed, suppressed, complained, opened, clicked。
   - 送信ドメインの Open tracking / Click tracking を有効化（開封は HTML の画像、クリックはリンクのリダイレクトで計測）。
   - API キーに送信権限があること（既存の `kamehame-site` キー）。`GET /emails/:id`（照合用）が拒否される場合は読み取り権限のあるキーに差し替え。
4. **テスト**（実顧客には送らない）
   - 予約一覧に **テスト案件**（例 `KJ-INQ-261016-99`、メール＝管理者のテスト宛先）を1行だけ用意。
   - キューにテスト行を追加→承認→`MANUAL_SEND_ENABLED=true`→1分以内に送信済みになること。
   - 下記「完了条件」を順に確認し、終わったらテスト案件とキュー行を削除（メール配信ログの行は残して可）。

## 日常の送信手順

1. ChatGPT で英文と日本語訳を作成（下のプロンプト）。ChatGPT に Google スプレッドシートの接続があれば
   「メール送信キュー」の最終行の次に **B〜I 列**を書かせる（A・J 以降は空欄、N は「下書き」、Y は「ChatGPT」）。
   接続がなければ、ChatGPT の出力をそのまま B〜I にコピーする。
2. 台帳で宛先・件名・本文・日本語訳を確認し、**J 列の承認にチェック**。メールIDが入り、状態が「承認済み」になる。
   直したいときは本文等を編集すると承認が外れるので、直してから再度チェック。
3. 1分以内に「送信済み」になり、ResendメールID と Message-ID が入る。配達・開封・クリックは届き次第、同じ行に入る。
4. 返信・リマインドは種別を「返信」「リマインド」にすると、Gmail の同じお客様とのやり取りから元メールの Message-ID を探して
   `In-Reply-To` / `References` を付けます（見つからなければヘッダーなしで送信し、内部データに記録）。
   元メールの Message-ID が分かっていれば I 列に貼れます（Gmail: その他 → メッセージのソースを表示 → Message-ID）。

ChatGPT 用プロンプト（例）:

```
以下の条件で、KAMEHAME JAPAN のお客様向け英文メールと、承認者確認用の日本語訳を作ってください。
出力は Google スプレッドシート「メール送信キュー」に追加する1行として、次の8項目をこの順で、タブ区切りで返してください。
案件ID／種別（見積もり・返信・リマインド・確定案内・その他）／宛先メール／件名（先頭に [案件ID] を付ける）／英文本文（プレーンテキスト）／HTML本文（空欄で可）／日本語訳／返信元Message-ID（不明なら空欄）
件名・本文に改行以外の制御文字を入れないこと。署名は Yukihiro, KAMEHAME JAPAN | Prosent Inc. / hello@kamehame-japan.com。
条件: …（案件の内容）
```

## Gmail での履歴確認

- Resend 経由の送信は Gmail の「送信済み」には残りません。`ARCHIVE_COPY_TO` にグループ（hello@）を設定すると、送信成功の直後に
  スクリプト実行アカウントの Gmail から件名 `[控え 案件ID メールID] 元の件名` の控えがメンバー全員へ届きます。
  控えは Resend を通らないため、開いてもリンクを押しても計測に影響しません。控えの送信に失敗しても送信済み判定は変わらず、内部データに記録されます。
- hello@ が Google グループの場合、Apps Script は人のアカウント（グループのメンバー）で動かします。差出人 hello@ は Resend のドメイン認証で成立し、
  Google アカウントは不要です。お客様の返信はグループ経由で実行アカウントの受信箱に届くので、配信設定を「毎回メール」にしておくと Gmail 照合が使えます。
- 件名の `[案件ID]` と、台帳の ResendメールID／Message-ID で突き合わせます。Resend の管理画面（Emails）でも本文・配信状況を確認できます。
- 返信関係（スレッド化）は、受信側メールアプリが `In-Reply-To`/`References` を見て決めます。Resend の API 仕様上
  カスタムヘッダーは送れますが、**本番での実機確認は未実施**です。テスト送信で、Gmail・Apple Mail・Outlook でスレッド化されるか確認してください。

## 停止・復旧

- 全体停止: Apps Script のプロパティ `MANUAL_SEND_ENABLED=false`（承認済み行は送られずに待機）。トリガーを止めれば計測の取り込みも止まります。
- 個別停止: 行の状態を「取消」にするか、承認のチェックを外す（承認済みのまま送信中になった行は止められません）。
- Worker 側の停止: Cloudflare で `MAIL_QUEUE_TOKEN` を削除すると送信・計測ともに 503 になります（ゴルフ自動化・サイトの自動返信には影響なし）。
- 復旧: 「送信中」で1時間超の行や「要確認」の行は、Resend の Emails で実際に送信されたかを確認してから、未送信なら **新しい行**で送り直します。
  同じ行を再承認して再送することはできない設計です（送信済み・エラーの行は承認を受け付けません）。
- Webhook を取りこぼした場合は毎時の照合で `配達済み（照合）` などが入ります。Apps Script の実行ログと `LAST_MAIL_QUEUE_RUN` を確認してください。

## 完了条件（テスト宛先で確認する項目と、現時点の状態）

| 項目 | コード／単体テスト | 本番動作確認（2026-10-16、テスト案件 KJ-TEST-261016-01） |
|---|---|---|
| 承認した内容が一度だけ送信される（再実行・再試行で重複しない） | 済（tests/mail-queue.test.mjs） | 済（M01・M02 とも送信1回、冪等キー記録） |
| 未承認・下書きは送信されない／編集で承認が外れる | 済 | 済（下書き行は未送信のまま。編集→承認解除は単体テストのみ） |
| 配達・開封・決済リンククリックが正しい案件とメールに反映される | 済（イベント照合・順序逆転・重複排除） | 済（配達1秒後、開封、Stripe リンククリックを M01 に記録） |
| 署名リンクのクリックは決済リンククリックに数えない | 済 | 済（サイトリンクは「その他リンククリック」に分離） |
| 同じ案件への複数メールで履歴が混ざらない | 済（メールID単位） | 済（M02 送信後も M01 の開封・クリックは不変。決済・連絡管理は最新件名・件数2） |
| テキストのみのメールは開封「計測対象外」 | 済 | 済（M02） |
| Webhook 再送・送信処理の再試行で重複しない | 済（イベントID／冪等キー） | 配信ログに重複なし（強制再送は未実施） |
| 送信控えが hello@ に計測なしで届く | 済 | 済（copy_sent） |
| Message-ID の取得（送信直後は未付与→毎時照合で補完） | 済 | 済（`RESEND_READ_KEY` 設定後） |
| 配達エラー（bounce）の記録と通知 | 済 | 未（実宛先での bounce は発生させていない） |
| 既存の予約・自動返信・台帳数式に影響がない | 既存テスト通過。台帳は列追加のみ | 列追加後の数式は目視確認済み。ゴルフページ・/api/contact は変更なしを確認 |
| 返信が元メールのスレッドにまとまる | In-Reply-To / References を付与 | M02 を M01 への返信として送信（受信側の表示は担当者の目視確認による） |

テスト案件（予約一覧・決済・連絡管理・メール送信キューの `KJ-TEST-261016-01`）は確認後に削除する。

## 関連ファイル

- Worker: `lib/mail-queue.ts`、`app/api/mail/send/route.ts`、`app/api/mail/status/route.ts`、`lib/payment-webhooks.ts`（振り分け）。
- Apps Script: `docs/mail-queue.gs`（新規）、`docs/payment-automation.gs`（`mail_event` の1行追加）。
- テスト: `tests/mail-queue.test.mjs`（Worker 7件・Apps Script 5件）。
