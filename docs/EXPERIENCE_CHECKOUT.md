# 体験の仮予約・先払い（2026-10-22）

## 実装したフロー

希望日・開始時刻・人数・氏名・メール・備考 → 表示総額と仮予約／取消条件に同意 → Stripe Checkout → 支払い受付（予約は未確定） → 施設受入確認 → 担当者から予約確定メール。満席なら代替日時を提案し、合意できなければ元の支払方法で全額返金。

施設への照会、代替案の調整、最終確認メール、返金操作は担当者が行う。決済をもって自動で施設予約を確定したり、施設へ自動メールしたりはしない。

| 体験 | 単価（税込） | 直決済対象 | Stripe Price |
|---|---:|---|---|
| Tokyo Kendo Experience | ¥19,800 | 14歳以上、2〜13名 | price_1USyu1DpZ5Y8WoJ2tnGKPAdj |
| Ramen Making Class near Shibuya | ¥26,500 | 通常プラン、1〜16名 | price_1USyuLDpZ5Y8WoJ2Er2OtMAL |
| Kanji Name Calligraphy | ¥19,800 | 1〜4名、最低2名分請求 | price_1UJVn2DpZ5Y8WoJ2ZFthxVOo |

書道1名=¥39,600、2名=¥39,600、3名=¥59,400、4名=¥79,200。実参加人数と請求人数を別々に記録する。剣道9〜13歳、ハラール追加料金、特別手配等は決済前に個別見積もり。カレンダーは空き枠連携ではなく希望日時の選択。剣道は平日の10:00希望として受け付け、祝日等を含む最終受入可否は施設に確認する。

## 本番で必要な設定

コードのみのデプロイでは直決済は有効にならない。設定が欠ける場合は従来の問い合わせフォームを表示し、決済APIは503で停止する。

1. **既存のメール自動化Apps Script** に `docs/experience-checkout.gs` を追加する。既存 `doPost` のロック取得直後に `docs/payment-automation.gs` の次の分岐を追加する。他の本番変更は上書きしない。

   ```js
   if(/^experience_/.test(p.action)&&typeof experienceAction_==='function')return json_(experienceAction_(p));
   ```

2. `setupExperienceCheckout()` を1回実行する。既存顧客台帳に **体験決済管理** シートを作成し、`processExperienceQueue` の1分トリガーを作成する。既存の `SPREADSHEET_ID`、`AUTOMATION_TOKEN`、`RESEND_API_KEY`、`TEAM_EMAIL`、`EXPERIENCE_LIVE_SEND_ENABLED=true` を利用する。既存Webアプリの新バージョンとしてデプロイする（URLを維持）。

3. Stripeアカウント **KAMEHAME JAPAN / acct_1UGdMSDpZ5Y8WoJ2** の本番制限付きキーを作成し、Cloudflare本番Workerの **Secret** `STRIPE_CHECKOUT_KEY` に登録する。最低限、Checkout Sessions書込／参照とPrices参照を許可し、必要な依存権限はStripeの画面に従う。返金、入金、商品変更などの権限は不要。キー値をGitやチャットに貼らない。

4. Stripeの本番Webhook送信先を `https://kamehame-japan.com/api/webhooks/stripe` に設定する。snapshot形式で以下を購読する。

   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`

   対応する署名シークレットをCloudflareの **Secret** `STRIPE_EXPERIENCE_WEBHOOK_SECRET` に追加する。既存の `STRIPE_WEBHOOK_SECRET` は保持する。同じKAMEHAMEアカウントの新旧署名を受け付け、署名検証後の予約振り分けと金額照合は維持する。既存送信先があれば重複作成せず購読を確認する。2026-10-22に作成した送信先は `we_1UTD7oDpZ5Y8WoJ2oCk3q3Ru`。本番署名テストで既存値との不一致を確認したため、上書きせず追加方式とした。

5. 既存の `STRIPE_READ_KEY`（Checkout Sessions参照・明細展開可能）、`GOLF_AUTOMATION_URL`、`GOLF_AUTOMATION_TOKEN` が同じ本番アカウント／台帳を指すことを確認する。ゴルフ用のURL名だが、新しいexperienceアクションを独立処理し、ゴルフのジョブは作成しない。

6. 下記の受入確認後、Cloudflare **Secret** `EXPERIENCE_CHECKOUT_ENABLED` を `true` に設定する。通常のvarsは再デプロイで消えることがあるためSecretを使う。`GET /api/experience-checkout` が `{"ready":true}` になり、3商品の全5言語で新しいフォームが表示されることを確認する。APIキーだけでは有効にならず、台帳の稼働確認も必須。

## 受入確認

ローカルのモックテストは金額・人数改ざん拒否、最低請求人数、JST締切、同意、二重送信、署名、非同期決済、重複イベント、台帳再試行、受付メール再試行、5言語フォームを検証。既存ゴルフ／メールキューの回帰テストも実行する。

**実Stripeでの通し決済は別途必要。** 本番カードで無断のテスト請求を行わない。分離したStripe Sandboxで同じ商品条件を作り、テスト用価格ID・テストキー・テストモード許可を使う隔離検証環境で確認する。本番コードはlive-onlyなので、テスト許可を本番に持ち込まない。

- 3商品で決済画面の金額・人数・説明を確認。書道1名と2名の請求額が同じで、台帳の参加人数は別であること。
- 支払い成功、キャンセルして戻る、認証失敗、非同期成功／失敗を確認。
- 決済後、`/{lang}/booked/?stay=1&session_id={CHECKOUT_SESSION_ID}` に戻り「支払い受付・予約未確定」と表示。
- 台帳の「予約一覧」「手配・体験詳細」「決済・連絡管理」と「体験決済管理」が更新されること。
- お客様には支払い受付メールのみ、運営には要手配通知。施設確認前の予約確定メールは送らない。
- 重複Webhook／再送で二重記録・二重メールが生じないこと。
- GA4 `purchase` は支払い確認後のみ、1セッションにつき1回。明細のpriceは単価（行合計÷数量）。

## 再試行・運用

- 同じ申込はUUIDと内容を照合し、同じStripe Idempotency-Keyを利用。セッション作成と台帳保存が終わるまで支払URLを返さない。
- 25分を過ぎた同じ申込は自動で新しいセッションを作らず、運営確認へ。Stripeセッションは作成から1時間で失効。同一顧客・体験・日時の重複申込を防止するため、変更・長時間経過時は個別確認。
- 入金は署名済みWebhook＋Stripeから取得したセッション明細を照合する。戻り画面へのアクセスだけでは台帳更新もメール送信もしない。
- 支払い済み状態を先に保存してから、1分トリガーで台帳更新と受付メールを再試行する。受付メールと運営通知は独立して再試行。曖昧な送信結果はResendの同一キーで20時間以内のみ再試行し、それ以降は「最終エラー」を見て手動照合する。
- 「体験決済管理」の内部データ／セッションIDは編集しない。手配完了や取消等の手動ステータスは上書きしない。
- 金額・商品・通貨・セッション不一致は成功応答にせず再試行対象にする。Stripeの配信失敗と台帳の最終エラーを確認する。
- 利用者都合の取消条件は表示の既存規定を維持し、支払い時点から適用。手配不可かつ代替案に合意できない場合の全額返金を別途明示。
- 停止時は `EXPERIENCE_CHECKOUT_ENABLED=false`。新規チェックアウトのみ停止し、既に発生した決済通知と受付メールの処理は継続する。
