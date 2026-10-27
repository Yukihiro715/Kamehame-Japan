# ホテル紹介管理（段階2）: 紹介リンク・帰属・紹介料台帳

要件書 v1.1 の段階2。段階1の調査は `docs/HOTEL_REFERRAL_STAGE1.md`。
ここでは、何ができるようになったか、オーナーが一度だけ行う設定、運用で使う SQL、確認方法をまとめる。
ホテル画面・運営画面・精算書は段階3・4（未実装）。

## できるようになったこと

| 項目 | 内容 | コード |
|---|---|---|
| 紹介リンク | `https://kamehame-japan.com/r/<token>` に来た訪問を記録し、30 日の紹介セッション Cookie（`kh_ref`、HttpOnly）を置いて、リンクが指す自社ページへ 302 する。無効なトークン・停止中のリンク・提携終了後は通常ページへ案内し、セッションは作らない。ボット・リンクプレビュー・`?kh_test=1` の運営テストは記録するが集計から除外。 | `lib/referral/links.ts`, `worker/index.ts` |
| 帰属の固定 | 問い合わせ（`/api/contact`）と体験の事前決済（`/api/experience-checkout`）で、予約行と紹介元を **同じバッチ** で保存する。最後に有効だった紹介が採用される（A→B→予約なら B）。予約後の訪問で変わらない。宿泊客にコード入力は求めない。 | `lib/referral/attach.ts`, `lib/referral/reservations.ts` |
| 商品の紹介条件 | 体験ごとの料率・税率・適用開始日・版。行がなければ「料率未設定」として保留（5% を仮に当てない）。改定は新規予約から。 | `experience_referral_policies` |
| 明細と税抜 | 基本体験 / 追加オプション / 別途手配費 / 現地払い の種別と紹介料対象フラグ。税抜は明細ごとにその明細の税率で算出。総額を一律で割らない。 | `reservation_lines` |
| 決済・返金・紛争 | Stripe の Webhook を署名検証後に 1 回だけ記録（`integration_events`）。割引は対象明細に比例配賦。返金は 1 明細なら自動配賦、複数明細なら運営の配賦待ち（支払保留）。順序逆転・再送に耐える。 | `lib/referral/stripe-events.ts` |
| 紹介料 | 割引・返金反映後の税抜 × 保存済み料率を予約単位で 1 回四捨五入。確定後の変更は差分明細（`commission_adjustments`）。 | `lib/referral/money.ts` |
| 確定条件 | 実施確認（運営が登録）＋ 実施日時が過去 ＋ 対象額確定 ＋ 決済完了 ＋ 紛争・返金配賦の未解決なし ＋ 精算先あり。日付経過だけでは確定しない。 | `recomputeCommission` |
| 通知 | 紹介元のある問い合わせは、社内通知メール・Slack・台帳メモに「紹介元ホテル: 〇〇」が入る。 | `lib/notification.ts` |
| 検証環境 | `staging` ブランチへの push で別 Worker（`kamehame-japan-staging`）に配備。全ページ Basic 認証、noindex。 | `.github/workflows/deploy-staging.yml` |

変わらないもの: 既存のメール、Slack、Google シート台帳、Apps Script への転送はそのまま。D1 が無い環境では紹介機能が静かに無効になり、予約は従来どおり通る。

## オーナーが一度だけ行う設定

1. **Cloudflare API トークンに D1 の権限を追加**（決定 D1）
   Cloudflare ダッシュボード → 右上のプロフィール → My Profile → API Tokens → GitHub Actions で使っているトークン（`CLOUDFLARE_API_TOKEN`）を Edit → Permissions に `Account / D1 / Edit` を追加 → Continue to summary → Update Token。
   これで次回の main への push 時に、ワークフローが `kamehame-ledger` を作成し、移行を適用し、`DB` を紐付ける。権限が無いあいだはその手順だけ失敗し、サイトは従来どおり配備される（ログに "could not create the D1 database" と出る）。
2. **Workers Paid プラン**（決定 D2）
   Workers & Pages → Plans → Workers Paid（月額 5 ドル）。PDF 生成（段階4）と締め処理の CPU 時間のため。
3. **Stripe Webhook のイベント追加**
   Stripe ダッシュボード → Developers → Webhooks → 既存のエンドポイント（`/api/webhooks/stripe`）→ イベントに `charge.refunded`, `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed` を追加。署名シークレットは変わらない。
4. **検証環境**（決定 D3）
   - GitHub で `staging` ブランチを作る（`main` から）。push すると `kamehame-japan-staging` が `https://kamehame-japan-staging.<account>.workers.dev` に配備される。
   - Cloudflare → Workers & Pages → `kamehame-japan-staging` → Settings → Variables and Secrets に、**Secret** として `STAGING_BASIC_AUTH`（例 `kame:長いパスワード`）を追加。これが無いあいだは 503「staging locked」。
   - 検証用の Stripe **テストモード** のキーと Webhook シークレット（`STRIPE_CHECKOUT_KEY` は `rk_test_` ではなく、現行コードが `rk_live_` を要求するため、体験決済の疎通は段階3で切替を入れる）、Resend のテスト送信先、Slack のテスト用 Webhook をこの Worker にだけ設定する。本番の秘密情報は入れない。
5. **プライバシーポリシーへの追記**（決定 D4）
   `kh_ref` は「提携ホテルからのご紹介を記録するための第一者 Cookie（30 日）。個人を特定せず、広告には使いません」。段階3で `app/[lang]/privacy` に 5 言語で追記する。

## 運用（段階3の画面ができるまで）

ホテル・リンク・料率の登録は、当面 `wrangler d1 execute` で行う。実行は本番の D1 を直接書き換えるので、まず `--local` または検証環境で試す。

```bash
# 例: 法人・施設・精算設定・リンク・料率（値は差し替える）
npx wrangler d1 execute kamehame-ledger --remote --command "
INSERT INTO partner_legal_entities (id, name, created_at, updated_at) VALUES ('le-example', '株式会社サンプルホテルズ', datetime('now'), datetime('now'));
INSERT INTO hotels (id, legal_entity_id, public_id, name, created_at, updated_at) VALUES ('h-example-shinjuku', 'le-example', 'HP-0001', 'サンプルホテル新宿', datetime('now'), datetime('now'));
INSERT INTO settlement_profiles (id, legal_entity_id, name, valid_from, created_at, updated_at) VALUES ('sp-example-shinjuku', 'le-example', 'サンプルホテル新宿 精算', '2026-11-01', datetime('now'), datetime('now'));
INSERT INTO settlement_profile_hotels (profile_id, hotel_id, valid_from) VALUES ('sp-example-shinjuku', 'h-example-shinjuku', '2026-11-01');
INSERT INTO referral_links (id, token, hotel_id, medium, kind, target_path, label, status, created_at, updated_at) VALUES ('l-example-brochure', '<22文字のランダム>', 'h-example-shinjuku', 'brochure', 'qr', '/en/', 'パンフレット', 'active', datetime('now'), datetime('now'));
INSERT INTO experience_referral_policies (id, experience_slug, rate_bp, tax_rate_bp, valid_from, version, created_at) VALUES ('pol-golf-1', 'mt-fuji-golf-day', 500, 1000, '2026-11-01T00:00:00Z', 1, datetime('now'));
"
```

- トークンは `node -e "console.log(require('crypto').randomBytes(16).toString('base64url'))"` で作る。QR の中身は `https://kamehame-japan.com/r/<token>`。
- 料率は basis point（500 = 5%）。税率も同じ（1000 = 10%）。
- 実施確認は段階3の運営画面まで、`attendances` への INSERT で代替できる（`confirmAttendance` と同じ列）。
- 配賦待ちの返金（`refunds.allocation_status = 'pending'`）は、該当明細の `refunded_gross_jpy` を更新して `allocated` にすると、次の再計算で反映される。

## 確認方法

- 単体: `node --test tests/referral-money.test.mjs tests/referral-ledger.test.mjs`（node:sqlite に実際の移行を適用して実行）。
- Worker: `npm test`（`tests/referral-worker.test.mjs` が `/r/<token>` と検証環境のゲートを確認）。
- 本番での疎通: D1 が紐付いたら `https://kamehame-japan.com/r/<token>?kh_test=1` にアクセスし、302 と `Set-Cookie: kh_ref=…` を確認。`referral_events` に `ua_class = 'test'` の行が入る。

## 受入テストの対応（段階2で自動化したもの）

T04, T05, T06, T07, T08, T10, T13, T14, T15, T16, T17, T23（リンク側）, T25, T26 を `tests/referral-ledger.test.mjs` と `tests/referral-money.test.mjs` で確認。T09, T11, T12 の計算部分も同上。残りは段階3・4。

## 設計上の注意

- `DB` が無いときは `lib/referral/attach.ts` が何もしない。紹介機能の停止はバインディングを外すか、`referral_links.status` を `paused` にする。
- 予約の作成は `request_id` で冪等。既存の Apps Script 台帳が同じ ID を使うので、両者を突合できる。
- 体験決済の外部参照は Apps Script と同じ規則（`KJ-E-` + request_id のハイフン除去）で先に埋める。Webhook はこの値（`client_reference_id`）で予約を見つける。
- ゴルフ手配料の Payment Link には予約 ID が無いので、入金は当面、運営が `payments` に記録する（Checkout 実装時に自動化）。
