# ホテル紹介管理システム 段階1: 既存調査と差分設計

要件書「KAMEHAME JAPAN ホテル紹介管理システム 開発要件書 v1.1（2026-10-27）」の段階1の提出物。
既存リポジトリを調査し、連携できる項目、欠けている項目、差分設計、移行計画、設定初期値の一覧をまとめた。
調査日 2026-10-27。コードは未変更。

## 1. 結論

- 既存サイトには **データベースのテーブル、ログイン、管理画面が存在しない**。予約・決済・メールの記録はすべて Google スプレッドシート（顧客対応台帳）に Apps Script 経由で書かれている。
- したがって要件のうち「紹介料台帳」「権限制御」「四半期締め」「支払通知書」「操作履歴」は、既存機能の拡張ではなく **新規のデータ層（Cloudflare D1）と認証基盤を足す** 形になる。D1 と Drizzle の配線は雛形として既にあり、テーブルを定義すれば使える。
- 予約の流れ（フォーム → 台帳、体験の事前決済 → Stripe Checkout → Webhook）は再利用できる。紹介元の識別子を **仮予約の作成と同じ処理の中で保存する** 差し込み点も特定できた。
- 要件の前提のうち、既存データでは満たせないものが 4 つある: 税抜金額、実施済みの記録、返金の自動取得、紹介対象／対象外の明細区分。いずれも新しいマスタと入力口を設けて解決する（4章）。
- 着手前にオーナー判断が必要な事項を 9 章にまとめた。特に **D1 の作成権限、検証環境、Workers の有料プラン、税抜の算出ルール** は段階2の前提になる。

## 2. 既存調査の結果

| 領域 | 現状（ファイル） | 紹介管理で使えるか |
|---|---|---|
| ホスティング | Cloudflare Workers。設定は `vite.config.ts` の `localBindingConfig`（wrangler.toml はなく、ビルド時に生成）。`.github/workflows/deploy.yml` が main への push で `wrangler deploy`。 | 使える。D1 のマイグレーション実行ステップを追加する必要あり。 |
| データベース | `db/schema.ts` は空（`export {}`）。`drizzle/meta/_journal.json` に移行なし。`.openai/hosting.json` の `d1: null`。本番に D1 は存在しない。 | 配線（`db/index.ts` の `getDb()`、`npm run db:generate`）は再利用。**D1 データベースの新規作成が必要。** |
| KV / cron | KV `READY_STATE`（決済受付可否のキャッシュ 1 キー）。cron `*/5 * * * *` で `worker/index.ts` の `scheduled` が動く。 | cron の口は再利用（セッション掃除、締め日の前処理）。 |
| 認証 | 利用者ログインなし。保護された API は共有トークン（`MAIL_QUEUE_TOKEN`, `GOLF_AUTOMATION_TOKEN`）か Webhook 署名のみ（`lib/mail-queue.ts:53-63`, `lib/payment-webhooks.ts:38`）。人の承認は Google シートの編集で記録。 | 定数時間比較のトークン検証と HMAC 検証は再利用。**ホテル・運営のログインは新規。** |
| 管理画面 | なし。`app/previews/*` は URL 秘匿のレビュー用。運営はシート（予約一覧、手配・体験詳細、決済・連絡管理、体験決済管理、メール自動化管理、メール配信ログ、メール送信キュー）で作業。 | 運営画面は新規。シートは当面「顧客対応」の帳簿として併存（7章）。 |
| 予約作成（問い合わせ） | `app/api/contact/route.ts` → `Enquiry`（`lib/contact.ts:21`、`requestId` = 申込ID）→ Resend/メール → Slack → `postToLedger`（`lib/ledger.ts:129`、6 秒タイムアウト、再送なし、**台帳側は冪等でない**）。ID は Apps Script が `KJ-YYMMDD-NN` を採番。 | 差し込み点として使える。紹介元を `Enquiry` に加え、D1 に同時保存する。 |
| 予約作成（体験の事前決済） | `/api/experience-checkout` → `openExperienceCheckout`（`lib/experience-checkout.ts:219`）。Apps Script `experience_create`（`requestId` で冪等）→ Stripe Checkout Session（`client_reference_id = KJ-E-<hex>`、metadata に `booking_flow`, `booking_reference`, `experience_slug`, `policy_version`, `guests` 等）。 | 差し込み点として使える。`ExperienceOrder` に紹介元を加え、Stripe metadata にも載せる。 |
| 予約作成（ゴルフ） | `mt-fuji-golf-day` は `GOLF_AUTOMATION_URL` のキュー、または手配モードでは staff メール → Stripe Payment Link（`lib/golf-arrangement-payments.ts`、`client_reference_id` なし）。 | 紹介元の保存は可能。**手配料の決済と予約の自動突合がない**ため、初期は運営が決済を予約に紐付ける。 |
| 決済 Webhook | `app/api/webhooks/stripe` → `lib/payment-webhooks.ts`。署名検証（300 秒許容）、イベント ID で重複排除（Apps Script 側）。`checkout.session.completed` のみ。**返金・紛争イベントの処理なし。** | 署名検証は再利用。返金（`charge.refunded`）と紛争（`charge.dispute.*`）の受信を追加。 |
| 金額・税 | すべて税込 JPY。`Experience.taxIncluded: true`（`lib/catalog.ts:304`）。**税抜金額・税率はどこにも保存されていない。** ゴルフ入金チェックは `amount_tax === 0` を要求。 | 税抜は新しい商品マスタから算出（4.4）。 |
| 明細の種別 | 事前決済は 1 行のみ（オプション不可）。現地払い・追加オプション・別途手配費は構造化されていない（コピー上の記述のみ）。 | 紹介対象フラグ付きの明細種別を新設。 |
| 割引 | ゴルフ自前クラブ割引 ¥5,000（`lib/golf-prices.ts:87`）、Stripe プロモーションコード（Payment Link のみ、台帳 V/W/X 列）。体験決済は割引不可（`subtotal === amount` を要求）。サイト内クーポン機能はない。 | Stripe の `total_details.amount_discount` を保存し、割引後の対象額で計算。 |
| 予約状態 | 体験: `awaiting_payment → paid_pending / payment_processing / payment_failed / expired`。台帳: 受付、仮予約受領、支払待ち、入金済・手配待ち 等。確定・キャンセル・**実施済みは手入力で、コード上の状態はない。** | 実施確認は運営画面で登録（4.5）。 |
| 流入計測 | `lib/attribution.ts`: UTM・クリック ID を localStorage（`kh-attribution-v1`、30 日）に保存。明示同意（`kh-consent-2 = granted`）がある時だけ動く。`/api/contact` のみ送信、体験決済には未送信。 | 型・検証関数・30 日の考え方は再利用。**紹介元はこれとは別項目**（要件 3.3）としてサーバー側で持つ。 |
| 同意 | `lib/consent.ts`: 1 つの同意で広告・解析をまとめて制御。EEA/UK/CH は既定拒否、他地域は既定許可。サーバー側の同意判定はなし。Cookie は未使用（localStorage のみ）。 | 紹介 Cookie の扱いは判断事項（9 章 D4）。 |
| 通知 | Resend（`RESEND_API_KEY`）、`send_email` バインディング、Slack Incoming Webhook（`lib/slack.ts`）。送信可否は Apps Script のプロパティで制御（`LIVE_SEND_ENABLED` 等）。Worker 側にテスト送信先の制限はない。 | Resend で招待・精算書公開・異議・支払完了の通知を送る。**開発中は送信先許可リストを Worker 側に追加。** |
| UI | shadcn（new-york、61 部品: sidebar, table, form, chart, dialog, tabs, input-otp 等）、Tailwind 4、ブランド変数（`--ink`, `--paper`, `--kame` 等）、5 言語 i18n。 | ホテル・運営画面はこの部品で日本語のみ作る。 |
| QR / PDF / CSV | コードもライブラリも存在しない。 | 新規（4.7）。 |
| テスト | `npm test`（ビルド + `tests/*.test.mjs`、node:test）。 | 同じ枠組みで受入テスト T01〜T30 を書く。 |

### 既存の不整合（紹介管理に関係するもの）

- ゴルフ Webhook の参照 ID 正規表現（`lib/payment-webhooks.ts:95`、`KJ-\d{6}-G[0-9a-f]{8}`）と Apps Script の採番（`KJ-YYMMDD-NN`）が一致しない。紹介料の決済突合をここに頼らない。
- 予約 ID が経路ごとに異なる（`KJ-YYMMDD-NN` / `KJ-INQ-…` / `KJ-E-<hex>`）。D1 側では内部 UUID を主キーにし、既存 ID は「外部参照」として列で持つ。
- 台帳 webhook の追記は冪等でない（再送で行が増える）。D1 側は `requestId` を一意キーにする。

## 3. 欠けているもの（新規に作る）

1. データ層: D1 データベース本体、テーブル、マイグレーション、デプロイ時の適用。
2. 認証: 招待制ログイン（ホテル担当者・運営）、セッション、役割（管理者 / 予約運営 / 経理 / ホテル閲覧 / ホテル請求）。
3. 紹介リンク: 公開トークン、`/r/<token>` の恒久中継 URL、QR 生成（PNG/SVG）、媒体別識別子、アクセス計測、ボット除外。
4. 紹介セッション: サーバー側で検証できる紹介 Cookie（30 日）と、仮予約作成時の固定。
5. 商品の紹介条件: 体験ごとの料率・適用開始日・版・紹介可否・参考単価・税抜単価。
6. 明細モデル: 基本体験 / 追加オプション / 別途手配費 / 現地払い の種別、紹介料対象フラグ、税率、割引、返金。
7. 実施確認の入力口と、確定条件の判定。
8. 返金・紛争の Webhook 受信と配賦。
9. 紹介料台帳、四半期締め、繰越、支払バッチ、振込記録、訂正明細。
10. 支払通知書（PDF/CSV）、ホテルの確認・異議、版管理。
11. ホテル画面・運営画面、操作履歴、CSV 出力、例外一覧。
12. 検証環境（現状は本番 Worker 1 つだけ）。

## 4. 差分設計

### 4.1 全体構成

- 既存の Worker（`kamehame-japan`）に、D1 バインディング `DB` とテーブルを追加する。アプリは同じリポジトリ・同じデプロイ。
- 新しいルート:
  - `/r/<token>`: 紹介中継。`worker/index.ts` の `fetch` で app router より前に処理する（トークン解決 → イベント記録 → Cookie 設定 → 許可済みの自社ページへ 302）。
  - `/hotel/*`: ホテル画面（日本語、noindex、要ログイン）。
  - `/ops/*`: 運営画面（日本語、noindex、要ログイン + 役割）。
  - `/api/referral/*`, `/api/hotel/*`, `/api/ops/*`: 画面用 API。すべてサーバー側で施設・法人権限を判定。
- 既存ルート（`/api/contact`, `/api/experience-checkout`, `/api/webhooks/stripe`）に紹介元の受け渡しと D1 書き込みを追加する。既存の台帳・メール・Slack はそのまま動かす（失敗しても紹介元の記録を失わない順序にする）。
- 既存の D1 雛形（`db/index.ts`, `drizzle.config.ts`, `npm run db:generate`）を使い、`drizzle/` に SQL 移行を生成。デプロイに `wrangler d1 migrations apply --remote` を追加。

### 4.2 紹介元の取得と固定（要件 3.3, 7）

1. `/r/<token>` でトークンを D1 の `referral_links` で解決する。無効・停止中なら通常の体験一覧へ 302 し、紹介セッションは作らない（既存予約の紹介料は維持）。
2. 有効なら `referral_events` に 1 行（時刻、リンク、媒体、UA 区分、IP ハッシュは保存しない）、`referral_sessions` に 1 行（セッション ID、ホテル、リンク、期限 = 30 日）。
3. ブラウザには **署名付きの第一者 Cookie `kh_ref`**（値 = セッション ID + HMAC、`HttpOnly; Secure; SameSite=Lax; Max-Age=30 日`）を置く。サーバーは毎回署名と D1 の期限を検証する。localStorage は使わない（改ざん・端末移動の前提に合わせる）。
4. 302 先は `referral_links.target`（体験一覧、または体験詳細の許可済みパス）。任意の外部 URL は不可。
5. 予約作成（`/api/contact` の `parse()` と `openExperienceCheckout`）で Cookie を読み、**同じトランザクション**で `reservation_referrals` と予約行を作る（D1 の `batch()` を使う）。その時点の `experience_referral_policies` の版を保存する。料率がなければ `rate_missing` として保留で記録する。
6. 以後のアクセスで帰属は変えない。最後の有効アクセスが優先（A の QR → B の QR → 予約 なら B）。広告流入（`lib/attribution.ts` の記録）は別項目のまま、上書きしない。
7. 決済ページへ移る前に予約へ紐付くため、Stripe metadata には `referral_hotel`（施設の公開 ID）と `reservation_id` を載せる。Webhook ではこれを使わず、D1 の `reservation_referrals` を正とする。
8. 紹介元不明でも予約は妨げない。コード入力欄は作らない。運営画面の「紹介元訂正」で理由付きで補正する。

### 4.3 認証と権限

- 方式: メールのマジックリンク + 6 桁コード（`components/ui/input-otp` あり）。パスワードは持たない。招待制（運営が招待 → 招待トークン 72 時間）。
- セッション: D1 の `sessions`（ランダム ID のハッシュ、期限 = ホテル 30 日 / 運営 12 時間、失効フラグ）。Cookie `kh_sess`（HttpOnly, Secure, SameSite=Lax）。
- 役割: `ops_admin`, `ops_booking`, `ops_finance`（口座・支払確定は finance のみ）、`hotel_viewer`, `hotel_billing`（明細確認・口座申請）。`memberships` で利用者 × 施設 or 精算設定 × 役割。
- API は全件 `requireScope(session, { hotelId | settlementProfileId | role })` を通す。CSV / PDF のダウンロード URL もログイン必須で、ID は推測できない UUID。
- CSRF: 状態変更は同一オリジン + カスタムヘッダー + SameSite。レート制限は KV カウンタ（ログイン、`/r/`）。
- 運営の強固な認証: 初期はマジックリンク + 許可メールドメイン + 12 時間セッション。TOTP は後続。

### 4.4 税抜金額と対象明細（要件 8.1）

- 既存データは税込のみなので、**商品マスタに税抜単価を持たせる**。`experience_referral_policies` に `tax_rate`（10%）と `unit_price_excl_tax_jpy`（運営入力、税込 ÷ 1.10 の四捨五入値を初期案として表示するが、保存は運営の確認を経た値）を持つ。
- 予約明細（`reservation_lines`）は 1 行ごとに `kind`（`base` / `addon` / `arrangement` / `onsite`）、`commissionable`、`tax_rate`、`gross_jpy`（税込）、`net_jpy`（税抜）、`discount_jpy`、`refunded_net_jpy` を持つ。税抜は **明細単位** で確定し、総額を一律で割らない。
- 現行の事前決済は 1 行（基本体験 × 請求人数）なので、`base` 1 行で表現できる。ゴルフ手配は `arrangement`（手配料）+ `onsite`（プレー代、ゴルフ場払い、対象外）+ `addon`（指定レンタルクラブ、対象外の初期案）。
- 割引: Stripe の `total_details.amount_discount` を対象明細に比例配賦（最大剰余法、明細順で安定）。初期の商品構成では 1 行なので配賦は自明。
- 内訳が確認できない予約は `amount_pending` として保留し、運営の例外一覧に出す。

### 4.5 実施確認と確定条件（要件 3.5, 9）

- 既存に実施完了情報がないため、**運営画面で「実施済み」を登録する**（実施日時、確認者、確認日時、メモ）。将来、台帳シートから Apps Script → `/api/ops/attendance` にトークン付きで同期する口も用意する。
- 確定判定 `commission_entries.status = confirmed` の条件: 実施確認済み、実施日時が過去、対象明細が `amount_pending` でない、必要な決済が `paid`、未解決の返金配賦・紛争がない。日付経過だけでは確定しない。
- 未実施キャンセル・無断キャンセルは `commission = 0` で `voided`。手動調整でも未実施予約を精算対象にできない（DB 制約 + API 検証）。

### 4.6 紹介料・税・丸め（要件 8.2, 8.3, 8.4）

- 金額は JPY 整数、計算は整数演算（1/10000 単位の固定小数）で行い、浮動小数点を使わない。丸めは `ROUND_HALF_UP` を 1 か所の関数に閉じ込める。
- 予約ごとの紹介料本体 = Σ(対象明細の割引・返金反映後税抜 × 保存済み料率) を予約単位で 1 回丸める。
- 消費税は精算書単位・税率ごとに本体を合計してから 1 回丸める。予約別の税込は「参考」表示。
- 返金: `charge.refunded` を受けたら `refunds` に記録し、対象明細への配賦が決まるまで当該予約の未払分を保留。配賦後は新しい税抜対象額で再計算し、差額を `commission_adjustments` に残す。全額取消は元の金額を正確に相殺する。
- 発行済み精算書は上書きせず、訂正明細を次の精算書または訂正版に載せる。

### 4.7 帳票・QR

- QR: 依存を増やさない純 JS の QR 符号化（SVG 文字列と PNG を Worker 内で生成）。印刷物用に SVG、画面・メール用に PNG。URL は `https://kamehame-japan.com/r/<token>`。
- CSV: Worker で生成。先頭が `= + - @` の値はクォートと先頭の `'` で無害化（数式インジェクション対策）。文字コードは UTF-8 BOM 付き。
- PDF: `pdf-lib` で生成し、日本語フォント（Noto Sans JP のサブセット）は `public/fonts/` に置いて `env.ASSETS` から読む（Worker 本体のサイズ制限にかからない）。生成は非同期（`waitUntil` + 生成状態を D1 に記録、画面は「作成中」を表示）。
- 保存: 生成した PDF/CSV は D1 に版情報、実体は R2（`kamehame-documents`、非公開）。R2 がない場合は都度再生成で代替可能だが、原本の版保持のため R2 を推奨。

### 4.8 精算処理（要件 9）

- 四半期締めは運営画面の「プレビュー → 確定」。確定は `settlement_runs`（期間、実行者、状態）を 1 行作り、対象の `commission_entries` を精算書に紐付ける。同じ期間を再実行しても、既に精算書に入った明細は拾わない（一意制約 `commission_entry_id` × `statement_line`）。
- 最低振込額 3,000 円は精算・振込設定ごと、税込・確認済み・保留除外・手数料控除前で判定。未満は `carried_forward`。
- 支払バッチ `payment_batches` と `payment_allocations`。1 つの債務は同時に 1 バッチのみ（一意制約）。CSV 出力は `exported`、振込成功の登録で `paid`。失敗は `failed` にして未払へ戻し、実費手数料は別記録。

### 4.9 検証環境

- 現状は本番 Worker のみ。**別名の Worker（例 `kamehame-japan-staging`）+ 専用 D1 + 専用 KV** を用意し、ブランチ `staging` から別ワークフローでデプロイする。`robots` は全拒否、Basic 認証またはアクセス制限を入れる。
- 本番の Stripe は使わず、Stripe のテストモードと Webhook シークレットを検証環境に設定する。メールは許可リストの宛先にだけ送る（Worker 側に `NOTIFY_ALLOWLIST` を追加）。

## 5. データモデル案（D1 / Drizzle）

要件 11 章の名称に合わせた。主キーは UUID（文字列）、時刻は ISO 文字列（UTC）と JST 判定用の日付列を併用。

| テーブル | 主な列 | 備考 |
|---|---|---|
| `partner_legal_entities` | id, name, address, registration_status(registered/unregistered/unverified), registration_number, verified_at, verified_by | 税登録情報。番号形式だけで登録済みにしない。 |
| `hotels` | id, legal_entity_id, name, public_id, status(active/suspended/terminated), created_at | 施設。 |
| `settlement_profiles` | id, legal_entity_id, name, bank_* (暗号化, 表示はマスク), payee_name, payee_address, min_payout_jpy(3000), fee_borne_by(hotel), valid_from, valid_to, version | 精算・振込設定。 |
| `settlement_profile_hotels` | profile_id, hotel_id, valid_from, valid_to | 同一施設・同一期間に有効な設定が重複しない制約。 |
| `users`, `sessions`, `invitations`, `memberships` | role, scope_type(hotel/profile/ops), scope_id | 認証・権限。 |
| `referral_links` | id, token, hotel_id(null = チェーン共通), chain_profile_id, experience_slug(null = 一覧), medium(brochure/room_tv/front/other), kind(qr/url), target_path, status | 公開トークンは 22 文字以上のランダム。 |
| `referral_events` | id, link_id, at, session_id, ua_class(human/bot/preview/test), excluded | 「QR経由アクセス数」の元。 |
| `referral_sessions` | id, hotel_id, link_id, created_at, expires_at(30 日), last_seen_at | Cookie が指す先。 |
| `experience_referral_policies` | id, experience_slug, rate_bp(例 500 = 5%), tax_rate_bp(1000), unit_price_excl_tax_jpy, reference_avg_jpy, reference_note, referral_enabled, valid_from, version | 料率未設定の体験は行なし = 紹介対象外または設定待ち。 |
| `reservations` | id, request_id(一意), external_ref(KJ-…), flow(contact/experience/golf), experience_slug, experience_date, guests, status(provisional/arranging/confirmed/completed/cancelled/no_show), payment_status, created_at | 既存の予約を D1 でも持つ。 |
| `reservation_lines` | id, reservation_id, kind, commissionable, tax_rate_bp, gross_jpy, net_jpy, discount_jpy, refunded_net_jpy, source(stripe/manual) | 4.4 参照。 |
| `reservation_referrals` | reservation_id(一意), hotel_id, link_id, session_id, fixed_at, basis(cookie/manual), policy_id, policy_version, status(attributed/rate_missing/corrected) | 予約と同じトランザクションで作成。 |
| `payments`, `refunds`, `disputes` | stripe_event_id(一意), session_id, charge_id, amount_jpy, status, received_at | Webhook の重複排除と順序逆転に対応。 |
| `attendances` | reservation_id, performed_at, confirmed_by, confirmed_at, note | 実施確認。 |
| `commission_entries` | id, reservation_id, settlement_profile_id, profile_version, base_net_jpy, rate_bp, commission_net_jpy, performed_on, status(estimated/pending/confirmed/voided/adjusted), confirmed_at, confirmed_by | 台帳本体。 |
| `commission_adjustments` | id, entry_id, delta_net_jpy, reason, created_by, statement_line_id | 返金・訂正。 |
| `settlement_runs`, `settlement_statements`, `statement_lines` | period_start/end, version, status(draft/published/confirmed/disputed/superseded), tax_by_rate(JSON), total_*; lines は entry/adjustment 単位で一意 | 四半期締めと精算書。 |
| `statement_acknowledgements` | statement_id, version, user_id, action(confirm/dispute), reason, at | 確認・異議。 |
| `payment_batches`, `payment_allocations` | batch: status(preparing/exported/paid/failed), reference, fee_jpy, paid_at; allocation: statement_id 一意 | 二重振込防止。 |
| `balance_transfers` | from_profile_id, to_profile_id, amount_jpy, reason, created_by | 残高移管（元と先を同時記録）。 |
| `audit_logs`, `integration_events` | actor, action, target, before/after(JSON), at; provider, event_id(一意), status | 操作履歴・連携状況。 |
| `documents` | id, kind(statement_pdf/statement_csv/report_pdf), statement_id, version, r2_key, created_at | 帳票の版。 |

## 6. 設定初期値の一覧（運営設定に表示する）

| 設定 | 推奨初期値 | 根拠 | 区分 |
|---|---|---|---|
| 精算期間 | 暦四半期（1–3, 4–6, 7–9, 10–12 月、JST） | 要件 2, 3.1 | 確定（期間は 3 ヶ月） |
| 支払日 | 締め月の翌月末。銀行休業日は前営業日 | 要件 3.1 | 推奨初期値 |
| 最低振込額 | 3,000 円（税込・確認済み・手数料控除前） | 要件 2, 3.1 | 確定 |
| 振込手数料 | ホテル負担、実費を振込ごとに 1 回控除 | 要件 2, 9 | 確定 |
| 紹介有効期間 | 紹介アクセスから 30 日、最後の有効アクセス優先 | 要件 3.3 | 推奨初期値 |
| 帰属の固定時点 | 仮予約作成時 | 要件 3.3 | 確定 |
| 紹介料の計算 | 割引後の対象税抜 × 体験ごとの料率、予約単位で四捨五入 | 要件 2, 8.2 | 確定 |
| 消費税 | 10%、精算書単位・税率ごとに 1 回丸め | 要件 8.3 | 推奨初期値（税率は設定） |
| 料率未設定の体験 | 紹介対象外／設定待ち（5% を仮適用しない） | 要件 5.2 | 確定 |
| 実施確認 | 運営が登録。日付経過で自動確定しない | 要件 3.5 | 確定 |
| 訪問の定義 | 同一セッション 30 分以内の連続アクセスを 1 訪問 | 要件 12 | 推奨初期値 |
| ボット除外 | 既知 UA、リンクプレビュー、運営テストフラグ | 要件 12 | 推奨初期値 |
| セッション期限 | ホテル 30 日、運営 12 時間 | 4.3 | 推奨初期値 |
| 招待・再設定トークン | 72 時間 / 15 分 | 4.3 | 推奨初期値 |
| 支払通知方式 | KAMEHAME が通知書を作成、ホテルが画面で確認 | 要件 3.2 | 推奨初期値 |
| 紹介割引 | なし | 要件 3.4 | 確定（初期） |
| 精算通貨 | JPY | 要件 4 | 確定（初期） |
| 負荷の仮定 | 3,500 施設、100,000 予約 | 要件 12 | 設計の仮定 |

## 7. 移行計画

- 既存予約: D1 に遡及投入しない。紹介元のない予約に UTM 等から紹介料を発生させない。必要なら運営が「移行対象一覧」から根拠付きで紐付ける（初期は空）。
- 二重管理の扱い: 紹介料・精算の正は D1。顧客対応（手配、連絡、入金確認）は当面シートのまま。新規予約は **D1 とシートの両方** に書く（D1 を先に、シートは従来どおり best effort）。
- 実施済みの同期: 第 1 段階は運営画面の手入力。第 2 段階で台帳シートの「実施済み」列を Apps Script から API へ送る（トークン認証、冪等）。
- 切戻し: 新ルートと D1 書き込みはフラグ（`HOTEL_REFERRAL_ENABLED`）で止められるようにし、既存の予約・決済・メールはフラグに関係なく従来どおり動く。D1 を落としても予約は通る（紹介元の記録だけ失われ、例外一覧に残す）。
- 既存の不整合（2 章末）は本件とは別の小さな修正として扱う。

## 8. 実装順序と見積りの目安

| 段階 | 内容 | 目安 |
|---|---|---|
| 1 | 本書（完了） | — |
| 2 | D1 作成・テーブル・移行、`/r/<token>`、Cookie、予約作成への差し込み、商品マスタ、明細と税抜、決済・返金 Webhook、紹介料計算と単体テスト（T04–T10, T13–T17） | 設計確定から 2 週間程度 |
| 3 | 認証・招待・権限、ホテル画面（実績、体験一覧、予約一覧、QR）、運営画面（ホテル・法人・精算設定・料率・例外・実施確認・訂正）、CSV、操作履歴（T01–T03, T06, T22–T24） | 3 週間程度 |
| 4 | 四半期締め、繰越、精算書 PDF/CSV、確認・異議、支払バッチ、訂正、通知、検証環境での受入テスト全件（T11–T12, T18–T21, T25–T30） | 2–3 週間程度 |

いずれも検証環境と Stripe テストモードで行い、本番 Stripe や実顧客へのメールは使わない。

## 9. 着手前にオーナー判断が必要な事項

| # | 事項 | 選択肢と推奨 |
|---|---|---|
| D1 | **D1 データベースの作成権限** | GitHub Actions の `CLOUDFLARE_API_TOKEN` に D1 の編集権限を追加するか、オーナーがダッシュボードで `kamehame-ledger` を作成して ID を渡す。推奨: トークンに D1 権限を追加（移行の自動適用に必要）。 |
| D2 | **Workers の有料プラン** | 無料プランは 1 リクエストあたり CPU 10 ms、Worker サイズ 3 MB。PDF 生成・締め処理・認証のハッシュ計算で不足する見込み。推奨: Workers Paid（月額 5 ドル）。R2 も有料プラン側の無料枠で足りる。 |
| D3 | **検証環境** | 別 Worker + 別 D1 + Stripe テストモードを用意する（4.9）。推奨: 用意する。ドメインは `staging.kamehame-japan.com` を提案。 |
| D4 | **紹介 Cookie の同意上の扱い** | 既存は広告・解析を 1 つの同意で制御し、EEA は既定拒否。紹介 Cookie を (a) 機能 Cookie として同意不要で設置（プライバシーポリシーに追記）、(b) 既存同意に従属（EEA の拒否時は紹介元を取得しない、ホテル紹介料が落ちる）。推奨: (a)。契約上の帰属に必要な第一者 Cookie で、個人を特定せず、広告には使わない旨を明記する。 |
| D5 | **税抜単価の確定ルール** | 既存は税込のみ。体験ごとに運営が税抜単価を登録する（初期値として税込 ÷ 1.10 の四捨五入を表示）。全商品が標準税率 10% の課税取引であることの確認が必要。 |
| D6 | **紹介対象の明細区分** | 初期案: 事前決済の基本体験 = 対象。ゴルフ手配料 = 対象、指定レンタルクラブ = 対象外（仕入が大半のため）、ゴルフのプレー代・現地払い = 対象外。おふくろ等の見積り型 = 運営が金額確定後に対象額を入力。 |
| D7 | **実施確認の責任者と方法** | 初期は運営の手入力（誰が、いつまでに）。台帳シートからの同期は第 2 段階。 |
| D8 | **PDF の原本保存** | R2（非公開バケット）に保存するか、都度再生成にするか。推奨: R2。 |
| D9 | **ホテル画面の言語・ブランド** | 日本語のみ、KAMEHAME のトークン（生成り・墨・橙）を踏襲。運営画面も同じ。 |
| D10 | **運営アカウントの対象者** | 招待する運営メンバー（管理者・予約運営・経理）のメールアドレス一覧。経理権限を誰が持つか。 |
| D11 | **ゴルフ手配料の決済突合** | 現状の Payment Link は予約 ID を持たない。紹介料のためには (a) 運営が決済を予約に手で紐付ける（初期）、(b) 手配料も Stripe Checkout（予定中の Checkout 実装）に寄せて自動突合。推奨: (b) を Checkout 実装と同時に。 |

## 10. 受入テストの対応表（要件 13）

| テスト | 実装段階 | 自動化 |
|---|---|---|
| T01, T04, T05, T06, T07, T08, T09, T10, T13, T14, T15, T16, T17 | 段階 2 | node:test（計算・Webhook・帰属） |
| T02, T03, T22, T23, T24 | 段階 3 | node:test（API 権限）+ Playwright（画面） |
| T11, T12, T18, T19, T20, T21, T25–T30 | 段階 4 | node:test（締め・支払・移管） |

## 11. 本番開始チェック（要件 14 の欄を引き継ぐ）

- [ ] 四半期締め・翌月末払い、3,000 円の税込判定、繰越条件を運営設定で確認。
- [ ] 紹介有効期間、競合優先順位、提携停止時の扱いを利用条件に反映。
- [ ] 実際の商品内訳と紹介料対象外費用の分類を確認（D5, D6）。
- [ ] 実施完了の情報源と責任者を決定（D7）。
- [ ] 施設別／一括の精算設定、対象施設、振込口座、明細の公開範囲を確認。
- [ ] QR からコード入力なしで帰属し、施設と媒体を分けて報告できることを確認。
- [ ] 通知書方式、ホテルの確認方法、税登録情報、振込手数料の帳票上の扱いを経理担当が確認。
- [ ] 権限制御、重複通知、返金、繰越、税込端数のテストに合格。
- [ ] 実メール送信と本番データ移行の対象を確認。

## 参照したもの

- 要件書 v1.1（2026-10-27）。
- リポジトリ: `vite.config.ts`, `.github/workflows/deploy.yml`, `worker/index.ts`, `db/`, `drizzle/`, `app/api/**`, `lib/contact.ts`, `lib/ledger.ts`, `lib/experience-checkout.ts`, `lib/payment-webhooks.ts`, `lib/provisional-booking.ts`, `lib/attribution.ts`, `lib/consent.ts`, `lib/mail-queue.ts`, `lib/notification.ts`, `lib/slack.ts`, `lib/catalog.ts`, `lib/pricing.ts`, `docs/*.md`, `docs/*.gs`, `tests/*.test.mjs`。
- Mimipo for Travel の実績報告書は要件書の要約に従い、実データは参照・転載していない。
