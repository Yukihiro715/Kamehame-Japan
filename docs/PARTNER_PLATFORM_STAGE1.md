# 提携パートナープラットフォーム Step 1: 現状確認・差分設計

要件書「KAMEHAME JAPAN 提携パートナープラットフォーム 開発要件」（2026-11-06）の Step 1 の提出物。
既存のホテル紹介機能（`docs/HOTEL_REFERRAL_STAGE1.md`、`docs/HOTEL_REFERRAL.md`）を、実コード・スキーマ・テスト・本番設定と照合し、本要件との差分、設計、移行方針、未決事項、見積もりをまとめる。

## 1. 結論

- 要件書の「実装済みとされている機能」は **すべて実コードで確認できた**（2 章）。ホテル紹介の段階 2・3 はそのまま土台にできる。
- 作り直しは不要。拡張点は 3 つに絞れる。
  1. 「ホテル」を「提携パートナー（契約先 → 拠点 → 利用者）」に一般化する。テーブルは増やさず、既存の `partner_legal_entities` / `hotels` / `memberships` に **種別・形態・利用機能の列を足す** だけで、個人ガイドや施設を持たない代理店も表せる（4 章）。
  2. 段階 4（四半期締め・精算書・確認/異議・支払バッチ・訂正・通知）は未実装で、要件 9 章の初期値（四半期締め・翌月末払い・3,000 円繰越）は既存の `settlement_profiles.min_payout_jpy` と `money.ts`（T11/T12 の判定）に一致している。新規テーブルは精算書・明細・異議・支払バッチの 5 つ（4.4）。
  3. 予約取り次ぎは完全に新規。案件・見積もり・顧客向け共有ページ・コメント/添付の 4 テーブルと、既存の Stripe Checkout（`lib/experience-checkout.ts`）を見積もり決済に流用する（4.5）。紹介元は Cookie ではなく **案件に直接固定**（`reservation_referrals.basis` に `case` を追加）。
- 開発を止める未決事項は 3 つ（D-1 精算書の方式と記載事項、D-2 Workers Paid と PDF の方式、D-3 取り次ぎ商品の初期範囲）。残りは既定値で進められる（6 章）。
- 見積もりは Step 2 が 3 週間、Step 3 が 3 週間、Step 4 が 1 週間、合計 7 週間程度（7 章）。

## 2. 現状の照合結果

| 要件書の記載 | 確認結果 | 根拠 |
|---|---|---|
| 紹介リンク `/r/<token>`、30 日 Cookie、ボット・プレビュー除外 | 実装済み。`kh_ref` は HttpOnly、サーバーで存在と期限を検証。`?kh_test=1` は test 分類 | `lib/referral/links.ts`、`worker/index.ts`、`tests/referral-worker.test.mjs` |
| 問い合わせ・事前決済予約への紹介元固定 | 実装済み。予約行と `reservation_referrals` を同じバッチで保存、最後に有効な紹介が勝つ（T04）、予約後は変わらない | `lib/referral/attach.ts`、`createReservation`、`tests/referral-ledger.test.mjs` |
| 体験ごとの料率・税率、明細種別、税抜計算 | 実装済み。`experience_referral_policies`（版・適用開始日）、`reservation_lines`（base/addon/arrangement/onsite、紹介対象フラグ、明細ごとの税率） | `migrations/0001`、`lib/referral/money.ts` |
| Stripe の決済・返金・紛争の取り込み | 実装済み。署名検証後に `integration_events` で重複排除、返金は 1 明細なら自動配賦・複数明細は運営配賦（T15/T16） | `lib/referral/stripe-events.ts`、`lib/payment-webhooks.ts` |
| 紹介料の計算・確定条件 | 実装済み。実施確認＋実施日経過＋金額確定＋決済完了＋未解決なし＋精算先あり。確定後は差分明細（`commission_adjustments`） | `recomputeCommission`（`lib/referral/reservations.ts`） |
| 6 桁コードのサインイン、権限管理 | 実装済み。役割 5 種（ops_admin / ops_booking / ops_finance / hotel_viewer / hotel_billing）、セッション 30 日/12 時間、CSRF ヘッダー | `lib/portal/auth.ts`、`tests/portal-api.test.mjs`（T02/T03） |
| `/hotel/` 実績・予約一覧（個人情報なし）・体験一覧・紹介条件・QR・残高 | 実装済み。精算画面は残高と「精算書は段階 4」の案内のみ | `components/portal/hotel/*`、`lib/portal/metrics.ts` |
| `/ops/` 予約・実施確認・訂正・明細・入金・返金配賦・法人・精算設定・料率・メンバー・操作履歴 | 実装済み。加えて乗合ゴルフ・コース名・人気体験・レビュー素材の画面がある | `components/portal/ops/*`、`lib/portal/ops.ts` |
| 本番 D1、staging 環境 | 両方稼働。本番の `kamehame-ledger` に移行 0001〜0007 適用済み、staging は別 Worker・別 D1 | デプロイログ（2026-11-04） |

未完了・未確認事項の確認:

| 事項 | 状態 |
|---|---|
| 段階 4 一式 | 未実装。`hotel/settlement` API は `statements: []` を返す固定実装。`commission_entries.statement_id` と `commission_adjustments.statement_id` は列だけ用意済み |
| 受入テスト T11–T12・T18–T21・T25–T30 | T11/T12（最低支払額と手数料の判定）と T25/T26（実施日の四半期帰属）は `money.ts` / `ledger` の単体テストで先行実装済み。T18–T21、T27–T30 は未着手 |
| `PORTAL_BOOTSTRAP_ADMIN` の本番設定 | リポジトリからは確認できない。本番 `/ops/login/` にオーナーのメールでサインインできれば設定済み。未設定なら Cloudflare の変数に追加（`docs/HOTEL_REFERRAL.md`「最初の運営アカウント」） |
| Stripe Webhook の返金・紛争イベント | コードは `charge.refunded` / `charge.dispute.*` を処理できる。Stripe 側のエンドポイント設定に追加されているかはダッシュボードで確認が必要 |
| PDF 生成方式、Workers Paid | 未決。Worker 内で PDF を作るには日本語フォント（数 MB）と CPU 時間が要り、無料プラン（3 MB・10 ms）では収まらない。代替は 4.4 の「印刷用 HTML + CSV」 |

既存の紹介元判定ルール（30 日、最後の有効な紹介、予約後不変、ボット除外、提携終了後は無効）は本要件で変更しない。取り次ぎ案件の固定は **別の根拠（`basis = 'case'`）として併存** させ、同じ予約に Cookie 由来の紹介元があっても案件の紹介元を優先する（紹介元が異なる場合は例外一覧に出し、運営が理由付きで確定する）。

## 3. 用語の対応

| 要件書 | 既存 | 本設計での扱い |
|---|---|---|
| 契約・精算先 | `partner_legal_entities` + `settlement_profiles` | そのまま。`partner_type`・`entity_kind` を追加 |
| 紹介元の拠点 | `hotels` | テーブル名は維持し、画面と API の表記を「拠点」に変更。`site_kind` を追加。個人ガイドは「契約先 1 : 拠点 1」を自動作成 |
| 利用者 | `users` + `memberships`（scope_type `hotel`） | そのまま。役割を追加（4.2） |
| 利用機能 | なし | 拠点ごとのフラグ `features_json`（4.1） |

## 4. 差分設計

### 4.1 提携パートナーへの一般化（Step 2）

移行 `0008_partners.sql`（すべて追加列・既定値付き。既存行は「ホテル・法人・リンク紹介のみ」として読める）:

```sql
ALTER TABLE partner_legal_entities ADD COLUMN partner_type TEXT NOT NULL DEFAULT 'hotel';   -- hotel | agency | guide | other
ALTER TABLE partner_legal_entities ADD COLUMN entity_kind TEXT NOT NULL DEFAULT 'company';  -- company | individual
ALTER TABLE partner_legal_entities ADD COLUMN contact_email TEXT;
ALTER TABLE hotels ADD COLUMN site_kind TEXT NOT NULL DEFAULT 'hotel';                      -- hotel | branch | guide | other
ALTER TABLE hotels ADD COLUMN features_json TEXT NOT NULL DEFAULT '{"refer":true,"cases":false,"settlement":true,"members":false}';
```

- `features_json` の 4 つが要件 3-1 の機能権限（リンク紹介・予約取り次ぎ・精算閲覧確認・メンバー管理）。種別と独立に運営画面で切り替える。
- 個人ガイド: 法人登録で `entity_kind = 'individual'`、拠点を 1 つ自動作成（`site_kind = 'guide'`、名前は本人名）。精算設定は既存どおり拠点作成時に自動でできる。
- 施設を持たない代理店: 拠点 = 支店（`branch`）。本社だけなら拠点 1 つ。
- 既存の紹介リンク・QR・帰属・料率・台帳は列追加だけなので **データ移行は不要**。`public_id`、`hotel_ref`、トークンは変わらない。
- 画面表記: 運営の「ホテル・法人」→「提携パートナー」、ホテル画面のヘッダー →「パートナー画面」。URL は `/hotel/` のまま（要件 3-3）。`/partner/` を追加するなら `/hotel/*` から 308 で転送（今回は任意）。

### 4.2 権限（Step 2）

`memberships.role` の CHECK に 2 つ追加（既存値は維持）:

| 役割 | 範囲 | できること |
|---|---|---|
| hotel_viewer（表記: 閲覧担当者） | 拠点 | 実績・紹介予約一覧（個人情報なし）・体験一覧・QR |
| hotel_billing（請求担当者） | 拠点 | 上記 + 精算書の閲覧・確認・異議 |
| **partner_agent（取り次ぎ担当）** 新規 | 拠点 | 自分が登録した案件の作成・進捗・顧客情報・コメント・資料 |
| **partner_manager（拠点管理者）** 新規 | 拠点 | 拠点の全案件 + メンバー招待（`features.members` が真のとき） |
| ops_admin / ops_booking / ops_finance | 運営 | 既存どおり。案件の見積もり・確定・帰属訂正は ops_booking 以上、支払操作は ops_finance 以上 |

- 判定は既存どおり毎回サーバー（`memberships`）。拠点の `features_json` に無い機能は役割があっても API で拒否する。
- 案件・添付・共有 URL も同じ関数で検証する（`canSeeCase(principal, case)`）。顧客向け共有ページはトークンのみで、案件 ID・紹介料・コメントを返さない API を別に用意する。

### 4.3 既存紹介フローの回帰（Step 2）

- `tests/referral-ledger.test.mjs`、`referral-worker`、`portal-api`、`attribution` を変更なしで通すことを完了条件にする。
- 追加: 「既存ホテル行が移行後も `partner_type = 'hotel'`・`refer = true` で読める」「`features.refer = false` の拠点ではリンク作成と `/r/` の新規セッションが止まる（既存セッションの予約は影響なし）」。

### 4.4 段階 4: 精算（Step 2）

新規テーブル（`0009_settlement.sql`）:

| テーブル | 主な列 | 備考 |
|---|---|---|
| `statements` | id, profile_id, period（`2026-Q4`）, version, status（draft/issued/acknowledged/disputed/settled/void）, net_jpy, tax_jpy, gross_jpy, carried_in_jpy, carried_out_jpy, payable_jpy, bank_fee_jpy, transfer_jpy, pay_date_jst, dispute_deadline_jst, issued_at/by, acknowledged_at/by, pdf_key, csv_key, supersedes_id | `UNIQUE(profile_id, period, version)`。締めの再実行は draft を作り直すだけで、issued 以降は新しい version（訂正版）を作る |
| `statement_items` | statement_id, entry_id または adjustment_id, reservation_id, performed_on_jst, base_net_jpy, rate_bp, commission_net_jpy | 1 明細 = 台帳 1 行。`commission_entries.statement_id` / `commission_adjustments.statement_id` に書き戻し、二重計上を防ぐ |
| `statement_disputes` | id, statement_id, raised_by, reason, item_id?, status（open/resolved/withdrawn）, resolution, resolved_by/at | 異議は明細単位でも精算書単位でも |
| `payout_batches` | id, pay_date_jst, status（prepared/exported/recorded）, created_by, exported_at, csv_key | 銀行送金は含めない（要件 11） |
| `payouts` | id, batch_id, profile_id, statement_ids_json, gross_jpy, bank_fee_jpy, transfer_jpy, status（pending/paid/failed/held）, paid_at, reference, note | 支払済み登録で `statements.status = settled` |

処理:

1. **締め**（運営、四半期ごと、冪等）: 期間内に `performed_on_jst` があり `status in (confirmed, adjusted)` かつ `statement_id` が空の台帳行と、未収載の調整明細を精算先ごとに集計 → draft 作成。前期の `carried_out_jpy` を `carried_in_jpy` に繰越。税は精算書合計に 1 回（T09）。最低支払額 3,000 円は **税込で判定、振込手数料は差引のみ**（T11/T12、既存 `money.ts`）。未満なら `carried_out = payable`、`transfer = 0`。マイナス（支払後返金）は次期へ繰越して相殺。
2. **発行**: draft → issued。精算書ページ（印刷用 HTML）、明細 CSV、通知メール（請求担当者へ）。異議期限は発行日 + 14 日（既定、D-1）。
3. **確認・異議**（パートナー）: 期限内に「確認」または「異議」（理由必須）。異議は運営が解決し、必要なら訂正版（新 version）を発行。期限を過ぎた未確認は自動で確認扱い（D-1）。
4. **支払バッチ**（経理）: 支払日を指定して対象（issued/acknowledged かつ transfer > 0 かつ精算設定に口座あり）を集計 → CSV 出力（全銀形式ではなく列定義付きの汎用 CSV） → 結果を登録（paid/failed、参照番号） → 通知。
5. **確定後の訂正**: 精算書に載った行の変更は既存どおり `commission_adjustments` に入り、次の締めで「前期訂正」として明細に出る。発行済み精算書は書き換えない。

PDF の方式（D-2）:

- 案 A（推奨・初期）: 精算書を **印刷用 HTML**（A4、`@media print`）で提供し、ブラウザの「PDF に保存」で原本にする。CSV は別途。追加のプランや依存なし。
- 案 B: `pdf-lib` + Noto Sans JP のサブセット（R2 に置いて実行時に読む）で Worker 内生成し R2 に保存。Workers Paid（CPU 時間 30 秒、サイズ制限緩和）が前提。R2 は有効化済み（2026-11-04）。
- 案 A で始め、経理の要望が固まった時点で B を追加するのが安全。

### 4.5 予約取り次ぎ（Step 3）

新規テーブル（`0010_cases.sql`）:

| テーブル | 主な列 |
|---|---|
| `partner_cases` | id, public_ref（`KC-YYMMDD-NN`）, legal_entity_id, site_id, created_by_user_id, assignee_user_id, partner_ref, kind（experience/free）, experience_slug, preferred_date, alt_dates_json, time_pref, guests, lang, requirements, customer_name, customer_email, customer_phone, customer_country, extra_json（商品別項目）, status, reservation_id, assigned_ops, created_at, updated_at |
| `case_quotes` | id, case_id, version, status（draft/shared/accepted/superseded/expired/paid）, title, lines_json（kind/description/quantity/gross/tax_rate/commissionable）, total_jpy, includes, excludes, onsite_note, cancel_terms, confirmation_note, valid_until, share_token, stripe_session_id, checkout_url, created_by, shared_at, paid_at |
| `case_messages` | id, case_id, visibility（internal/partner/customer）, author_user_id, author_kind（ops/partner）, body, attachment_key（R2）, attachment_name, created_at |
| （既存）`reservation_referrals` | `basis` に `'case'` を追加、`case_id` 列を追加 |

状態（要件 5-3）は 4 つの軸を分けて持つ:

| 軸 | 値 | 保存先 |
|---|---|---|
| 案件進行 | received → checking → proposed → awaiting_customer → awaiting_payment → paid → confirmed → performed / cancelled / unavailable | `partner_cases.status` |
| 決済 | 見積もり版ごと: shared / paid / expired / superseded | `case_quotes.status` + `payments` |
| 予約確定 | provisional → confirmed / cancelled（既存 `reservations.status`） | `reservations` |
| 紹介料 | estimated / pending / confirmed / adjusted（既存） | `commission_entries` |

パートナー画面の表示はこの 4 軸から導出し、保存しない（矛盾が起きない）。

流れ:

1. パートナーが案件を登録（商品を選ぶと `extra_json` の項目が増える。ゴルフは要件 5-1 の 8 項目）。顧客情報は代表者名と連絡先のみ必須、残りは任意。
2. 運営が案件を受け、空き確認・見積もり作成（明細は既存の明細種別と紹介対象フラグをそのまま使う）。「共有」で `share_token` を発行し、顧客向けページ `/{lang}/quote/<token>/` と Stripe Checkout セッションを作る。Checkout の `client_reference_id` は `KJ-C-<quote id>`、metadata に `booking_flow = partner_case`、`case_id`、`quote_version`。
3. パートナーは案件詳細で顧客向け URL をコピーして顧客に渡す（メール送信は運営からも可能）。パートナー限定で紹介対象額・料率・紹介料見込み・確定条件を表示。
4. 顧客が決済 → Webhook（既存 `receiveWebhook` に `KJ-C-` の分岐を追加）→ **予約行を作成し、紹介元を `basis = 'case'` で固定**（Cookie 不要、別端末でも維持）→ 案件 `paid`、予約 `provisional`。空き枠確保が必要な商品は、運営の「予約確定」操作で `confirmed`（要件 4 の分離）。
5. 見積もりを変更したら旧版を `superseded` にし、Stripe の Checkout セッションを **expire**（`POST /v1/checkout/sessions/{id}/expire`）。旧 URL は顧客向けページで「新しい見積もりがあります」と案内する。万一 expire 前に決済が通った場合は差額を調整明細として運営が処理する（例外一覧に出す）。
6. 実施確認以降は既存の紹介料フローと同じ。

顧客向けページ（要件 6）: 体験内容・日程・人数・総額・含む/含まない・オプション・現地払い・キャンセル条件・有効期限・予約確定の条件・決済ボタン。紹介料・内部コメント・パートナー名は出さない（T-N05）。見積書 PDF は段階 4 の方式（D-2）に揃えるため初期は対象外。

連絡・資料（要件 7）: `case_messages` の `visibility` で 3 区分。添付はレビュー素材と同じ R2（`cases/<case id>/`）に置き、`/api/portal/{hotel|ops}/case-file?key=` で権限検証後に配信。顧客向けページには `visibility = customer` の資料だけを `share_token` 経由で配信する。通知はメール（新コメント・見積もり共有・決済完了・予約確定）。

体験一覧（要件 8）: 既存 `experienceTerms` に、カタログ（`lib/catalog.ts`）から取れる場所・所要時間・言語・人数・貸切・料金・締切・キャンセル条件を結合し、予約方式を `bookingType`（instant / request）と「見積もり型」（`pricePending` または料金が条件で変わる商品）から導く。ボタンは「予約する / 空きを確認する / 見積もりを依頼する」の 3 種。在庫連携はしない。

### 4.6 画面

| 画面 | URL | Step |
|---|---|---|
| 運営: 提携パートナー一覧・詳細（種別・形態・機能・拠点・メンバー） | `/ops/partners/`（既存を拡張） | 2 |
| 運営: 精算（期間一覧 → 締め → 精算書 → 異議 → 支払バッチ） | `/ops/settlement/`、`/ops/settlement/<statement>/`、`/ops/payouts/` | 2 |
| パートナー: 精算（精算書一覧・確認・異議・印刷用） | `/hotel/settlement/`（既存を拡張）、`/hotel/settlement/<statement>/` | 2 |
| パートナー: 案件一覧・新規・詳細（進捗・顧客・見積もり・コメント・資料） | `/hotel/cases/`、`/hotel/cases/new/`、`/hotel/cases/<id>/` | 3 |
| 運営: 案件一覧・詳細（見積もり作成・共有・確定・帰属） | `/ops/cases/`、`/ops/cases/<id>/` | 3 |
| 顧客: 見積もり共有ページ | `/{lang}/quote/<token>/` | 3 |
| パートナー: 体験一覧（予約方式の出し分け） | `/hotel/experiences/`（既存を拡張） | 3 |

### 4.7 移行方針

- 0008 は列追加のみ。既存ホテルは移行後も同じ画面・同じリンクで動く。
- 段階 4 の初回締めは、台帳の `confirmed` 行のうち `statement_id` が空のものすべてを対象にする（過去四半期分も遡って 1 期ごとに締める）。本番にはまだ確定済みの紹介料がないため、実質ゼロからの開始。
- 既存契約に別条件がある場合は `settlement_profiles`（最低支払額、手数料負担）と新設の `dispute_days` / `pay_offset` 列（既定 14 日 / 翌月末）を精算先ごとに上書きする。全件一律の上書きはしない。
- 切り戻し: 新テーブルは既存処理が参照しないため、Worker を前の版に戻せば旧動作に戻る。列追加は既定値付きで旧コードと両立する。

## 5. 受入テストの対応表

既存番号（要件書 v1.1）と本要件 13 章の確認項目の対応。番号のない項目は T-N として採番した。

| 確認項目（要件 13） | 既存 | 自動化 | Step |
|---|---|---|---|
| 既存 QR・紹介リンクから予約・紹介料計上 | T04–T06, T13–T17 | 既存テストを変更なしで通す | 2 |
| 種別と利用機能を独立に設定 | T-N01 | node:test（API） | 2 |
| 個人ガイド・施設なし代理店の登録 | T-N02 | node:test | 2 |
| 取り次ぎ案件が別端末決済でも紹介元維持 | T-N03 | node:test（Webhook → `basis = case`） | 3 |
| 同じ案件・決済・Webhook の重複で二重計上なし | T15/T16 + T-N04 | node:test | 3 |
| 決済完了と予約確定の分離 | T-N05 | node:test | 3 |
| 見積もり変更後に旧条件で誤決済されない | T-N06 | node:test（expire 呼び出しと旧版拒否） | 3 |
| 顧客向け資料に紹介料・内部情報なし | T-N07 | node:test + Playwright | 3 |
| 他パートナーの案件・顧客・添付を閲覧不可 | T02/T03 + T-N08 | node:test | 3 |
| キャンセル・一部返金・紛争・支払後返金の精算反映 | T13, T18–T21 | node:test | 2 |
| 締め再実行で精算書・支払対象が重複しない | T27 | node:test | 2 |
| 3,000 円未満の繰越、次期合算、マイナス調整 | T11/T12, T28 | node:test（既存 + 追加） | 2 |
| 精算書 PDF/CSV と画面の金額一致 | T29 | node:test（CSV と API）、PDF は目視 | 2 |
| 精算確定後の訂正と支払履歴の追跡 | T30 | node:test | 2 |
| 既存データの欠損なし | T-N09 | 移行前後の件数・合計の比較スクリプト | 2 |

T18–T21（確認・異議・支払・通知）、T23/T24（画面）は Step 2 / 4 で Playwright を含めて実施する。要件書 v1.1 の T01〜T30 の原文は本リポジトリに無いため、番号は `docs/HOTEL_REFERRAL_STAGE1.md` 10 章の対応表に従った。原文を共有いただければ内容を突き合わせる。

## 6. 未決事項

### 開発を止めるもの（Step 2 着手前に決定が必要）

| # | 事項 | 選択肢と推奨 |
|---|---|---|
| D-1 | **精算書の方式と記載事項** | 推奨: KAMEHAME が作成する「支払通知書」方式（要件 9-2 どおり、パートナーの請求書は不要）。記載: 期間、明細（実施日・体験・照合番号・対象額・料率・紹介料）、税抜計、消費税（合計に 1 回）、税込計、繰越、振込予定額、手数料、振込予定日、異議期限。税務上の項目（インボイス番号の扱い、源泉の有無）は経理に確認してから帳票に載せる。異議期限は発行から 14 日、期限後は確認扱い |
| D-2 | **PDF の方式と Workers Paid** | 推奨: 初期は印刷用 HTML + CSV（案 A）。PDF 原本の自動生成が必要なら Workers Paid（月 5 ドル）を有効にして案 B を追加 |
| D-3 | **取り次ぎの初期対象商品** | 推奨: ゴルフ（カスタム手配）と事前決済の体験（芸妓・剣道・書道・ラーメン・茶道）。乗合バスゴルフは提携旅行会社の販売のため対象外。自由相談は常に可 |

### 既定値で進めるもの（異論がなければこのまま）

| # | 事項 | 既定値 |
|---|---|---|
| E-1 | パートナー種別 | hotel / agency / guide / other。形態は company / individual |
| E-2 | 利用機能の初期値 | 既存ホテル: 紹介○ 取り次ぎ× 精算○ メンバー×。新規は運営が登録時に選ぶ |
| E-3 | 案件の照合番号 | `KC-体験日なし-連番` ではなく登録日ベース `KC-YYMMDD-NN`。顧客向けページには出さない |
| E-4 | 見積もりの有効期限 | 既定 7 日（運営が変更可）。期限切れは Checkout を expire |
| E-5 | 取り次ぎ案件の紹介料 | リンク紹介と同じ料率表（`experience_referral_policies`）。取り次ぎ専用料率は作らない（将来、列追加で対応可） |
| E-6 | 顧客情報の閲覧 | partner_agent は自分の案件、partner_manager は拠点の案件。リンク紹介の予約一覧は従来どおり個人情報なし |
| E-7 | 支払バッチの出力 | 列定義付き汎用 CSV（振込先名義・口座（復号は経理のみ）・金額・参照番号）。全銀形式は対象外 |
| E-8 | 通知 | メールのみ（Resend）。パートナーへ: 精算書発行・異議回答・支払完了・見積もり共有・決済完了・予約確定。運営へ: 新規案件・異議・顧客決済 |
| E-9 | URL | `/hotel/` を維持。表記のみ「パートナー」に変更 |
| E-10 | 紹介料を受け取る相手と旅行代金を支払う相手 | 現行どおり精算先 = 契約先。将来の卸・再販のために `settlement_profiles` を予約側と分離できる構造は既にある（追加実装はしない） |

## 7. 見積もり

| Step | 内容 | 目安 |
|---|---|---|
| 1 | 本書 | 完了 |
| 2 | 提携パートナー一般化（0008、権限、運営・パートナー画面の表記と機能切替）、段階 4 精算一式（0009、締め・発行・確認/異議・支払バッチ・訂正・通知・印刷用精算書・CSV）、回帰テスト、T11–T12・T18–T21・T25–T30 | 3 週間 |
| 3 | 取り次ぎ（0010、案件・見積もり・共有ページ・Checkout 連携・Webhook 分岐・帰属固定・進捗・コメント/添付・体験一覧の出し分け・通知）、T-N03〜T-N08 | 3 週間 |
| 4 | ホテル・代理店・ガイドの 3 シナリオで staging 受入、移行リハーサル、ドキュメント、リリース手順と切り戻し | 1 週間 |

いずれも staging と Stripe テストモードで行い、本番 Stripe や実顧客へのメールは使わない。Step 2 の前半（0008 と表記変更）は 1 週目に本番へ出せるため、個人ガイド・代理店の登録は早めに始められる。

## 8. 本番に必要な設定（Step 2 着手までに）

1. `PORTAL_BOOTSTRAP_ADMIN` の本番設定を確認（`/ops/login/` にサインインできるか）。
2. Stripe ダッシュボードの Webhook に `charge.refunded`、`charge.dispute.created/updated/closed`、`checkout.session.expired` が含まれているか確認。
3. D-2 で案 B を選ぶ場合は Workers Paid を有効化。
4. 精算先の口座情報は既存どおり暗号化保存（経理のみ復号）。復号鍵の Worker シークレット名は Step 2 の設計時に決める。
