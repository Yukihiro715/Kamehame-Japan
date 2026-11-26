# KAMEHAME JAPAN デザインルール（UI/UX 統一ガイド）

新しい画面を作るとき、既存の見た目・振る舞いから外れないための約束事です。
ChatGPT / Claude / Codex など、どの開発担当がどのセッションで作っても同じ結果になることを目的にしています。
**新規画面の着手前に必ず読み、着手後は末尾のチェックリストで自己確認してください。**

実装の正本はコードです。本書と食い違う場合は `app/globals.css`、`lib/catalog.ts`、`app/[lang]/[collection]/[slug]/page.tsx` を優先し、本書を直してください。

---

## 0. 最初に決めること：新しい画面は本当に必要か

| 作りたいもの | 正しいやり方 |
|---|---|
| 新しい体験・商品（チケット、教室、ツアー、会場） | **新規ページを作らない。** `lib/catalog.ts` に `Experience` を1件追加し、`lib/catalog.ja.ts` / `.es.ts` / `.fr.ts` / `.zh-tw.ts` に翻訳を追加する。体験詳細ページ（`app/[lang]/[collection]/[slug]/page.tsx`）が自動で描画する。参考：`tokyo-idol-live-night`（チケット2種）、`kanji-name-calligraphy`（1人単価）、`evening-with-geiko`（プラン制）、`kyoto-ryokan-beauty-clinic`（金額非表示・相談のみ）。 |
| 新しいカテゴリ | 5つのカタログの `categories` 配列に同じ `slug` で追加し、`components/site/home-page.tsx` の `catTypes` に5言語の小見出しを追加。 |
| 提携先から条件が届く前の確認用ページ | `lib/partner-listing-drafts.ts` に下書きを追加（`app/previews/partner-listings/[slug]`）。写真がなければ写真枠が自動で「準備中」になる。 |
| 体験以外の案内ページ（サポート、LP、説明ページ） | `app/[lang]/<name>/page.tsx` を新設し、本書の「ページの骨格」に従う。参考：`app/[lang]/support/` と `components/site/support-*.tsx`。 |
| 運営画面・パートナー画面 | `app/ops`・`app/partner` 配下。`components/portal/shell` と `app/portal.css` を使う。公開サイトのスタイルを持ち込まない（逆も同じ）。 |

「それっぽい新しいデザイン」を足すより、**既存の部品を同じクラス名で使い回す**ことが最優先です。

---

## 1. デザイントークン（色・書体・角丸・影）

すべて `app/globals.css` の `:root` に定義済み。**新しい色・フォント・角丸を追加しない。**

| 変数 | 値 | 用途 |
|---|---|---|
| `--ink` | `#171a21` | 文字色、濃い背景（ヘッダー・フッター）、枠線 2px |
| `--paper` | `#f7f2e7` | ページ背景（`body`、`.subpage`） |
| `--rice` | `#e9e1cf` | 薄いベージュの面、画像の下地、プレースホルダ |
| `--white` | `#fffdf8` | カード・表・入力欄の背景（純白 `#fff` は使わない） |
| `--kame` | `#ee7c18` | ブランドのオレンジ。CTA、アイコン、強調、フォーカス |
| `--gold` | `#ffc93c` | CTA のホバー |
| `--muted` | `#6f6c64` | 補足文、表の見出し |
| 本文の濃いグレー | `#4a463e` | 説明文の本文（変数化されていない慣例色） |
| `--border` | `rgba(23,24,19,.18)` | 細い罫線 |
| `--font-display` | `'Anton'`（英数字のみ） | 見出し、価格、ラベル。**必ず `font-weight:400` と組み合わせる**（Anton は1ウェイトのみ） |
| 本文書体 | `Arial, Helvetica, sans-serif` | 本文。日本語は OS 標準ゴシックにフォールバック |
| 角丸 | 基本 `0` | **四角が基本。** 例外は写真グリッド（16px）、チップ（999px）、オプション枠・チェック枠（10〜12px）のみ |
| 影 | `8px 8px 0 rgba(23,26,33,.85)`（ヒーロー写真）／`6px 6px 0`（一覧カード）／`5px 5px 0`（特徴カード） | **ぼかしのないオフセット影**。`box-shadow: 0 4px 12px ...` のような柔らかい影は使わない |

- 見出し（h1/h2/h3、価格、バッジ、ステップ番号）は `font-family:var(--font-display); font-weight:400; text-transform:uppercase; letter-spacing:.02〜.08em`。
- 日本語・繁体字（`[lang="ja"]`, `[lang="zh-tw"]`）では Anton が当たらないため、見出しは自動的にゴシックになる。**日本語でも uppercase/letter-spacing の指定はそのまま残す**（英数字部分の整合のため）。
- ダークモードはない。`prefers-color-scheme` の分岐を追加しない。

---

## 2. 余白・幅・ブレークポイント

| 項目 | 値 |
|---|---|
| 左右の余白（セクション） | `padding-inline: clamp(24px, 7vw, 120px)` |
| 本文の最大幅 | セクション内の要素は `max-width: 880px`（`.xp-section > *`）。リード文は 520px |
| 2カラム（本文＋サイドカード） | `.xp-cols { grid-template-columns: minmax(0,1fr) 400px; gap: clamp(32px,4.5vw,72px) }`、サイドは `position:sticky; top:96px` |
| セクション間 | `.xp-section { padding-top: 56px }`、h2 の下 22px |
| 旅行サポートの帯（`SupportBanner`） | 上下とも 40px 以上の余白。直前の本文に密着させない（スマホは 32px） |
| ヘッダー高さ | 88px（`.site-header`）、サブページは `variant="solid"` で黒背景固定 |
| ブレークポイント | **980px**（2カラム→1カラム）、**700px**（スマホ。写真グリッド→横スクロール、3列→1列）、必要に応じて 650 / 520 |

スマホでは：
- 写真は `.gallery-track` が横スクロール（スナップ）になる。
- サイドの予約カードは写真の直下に移動し、画面下に `StickyRequestBar`（価格＋CTA）が固定表示される。
- 3カラムの特徴カード・ステップは1カラムになる。
- 横スクロールが発生しないこと（`min-width:0` を忘れない）。

---

## 3. ページの骨格（公開サイト）

公開サイトのページは次の順番・クラス名で組む。**順番を入れ替えない。**

```
<main className="subpage detail-page xp xp2" lang={lang}>
  <SiteHeader variant="solid" lang={lang} />
  <Breadcrumbs trail={[{home}, {city or section}, {title}]} />
  {preview && <p className="xp-preview-banner" role="status">…</p>}   ← 非公開ページのみ

  <header className="xp-head"><h1>タイトル</h1></header>          ← h1 は1ページに1つ。eyebrow（斜めの帯）は使わない

  <section className="xp-mv">                                         ← 写真。無い場合も枠を残す
    <div className="xp-hero-photo"><HeroCarousel photos lang /></div>
    <Gallery photos lang note />
    <ul className="xp-conditions"> 条件チップ（エリア・所要時間・人数・言語） </ul>
  </section>

  <div className="xp-cols">
    <aside className="xp-side">  <BookingCard … /> または .bk-card  </aside>   ← 価格・予約・状態
    <div className="xp-main">
      <ExperienceFacts />                      ← id="booking-facts" 「予約前に確認したい基本情報」
      <section className="xp-section" id="overview">  概要（.xp-lede + 段落）
      <section className="xp-section" id="pricing">   料金表（.xp-pricing）または プラン比較（.plan-compare）
      <SupportBanner lang place="mid" />       ← 体験ページには旅行サポートの帯を2か所（中盤・記事付近）
      含まれるもの / 含まれないもの（.check-list / .check-list.muted）
      特徴 3〜4枚（.xp-highlights > .xp-highlight、lucide アイコン）
      当日の流れ（timeline）、会場について（.xp-venue-cols + .know-list）
      <ExperienceAccess />                     ← id="access" 駅・ホテルからの行き方
      FAQ（.faq-list > details/summary）
      <section className="xp-section xp-request" id="request">  予約の流れ（.xp-flow）→ キャンセル（CancellationTable）→ フォーム（EnquiryForm）
      <SupportBanner lang place="end" />
    </div>
  </div>
  <section className="more-in"> 同じ都市の他の体験 </section>
  <SiteFooter lang={lang} />
</main>
```

体験以外のページ（サポート、LP）も、`SiteHeader solid` → パンくず → `h1` → 写真 → 本文（`.xp-section`）→ `SiteFooter` の並びを守る。**独自のレイアウト（全幅カード、横並びタイル、独自のヒーロー）を発明しない。**

---

## 4. 部品カタログ（必ずこれを使う）

| 役割 | 使うもの | 備考 |
|---|---|---|
| ヘッダー／フッター | `<SiteHeader variant="solid" lang />`、`<SiteFooter lang />` | トップ以外は solid。言語切替はヘッダーとフッターに既存 |
| パンくず | `<Breadcrumbs trail />` | ホーム → 都市/セクション → 現在地 |
| 写真 | `<HeroCarousel>` + `<Gallery>` | PC はグリッド（1枚目が大、残りが 2×2）＋「すべての写真を見る」。スマホはカルーセル＋右下の「写真N枚」ボタンだけ（「すべての写真を見る」は非表示。同じ機能を2か所に出さない）。写真が無い間は `.listing-photo-pending`（プレビューページ参照）を置く |
| 条件チップ | `<ul className="xp-conditions"><li><Icon size={14}/> 文言</li>` | アイコンは `lucide-react`（MapPin / Clock3 / Users / Languages）。最大4つ |
| 価格・予約カード | `<BookingCard>`（予約可）、`.bk-card` に `.soon-flag` + `.xp-note`（準備中・相談のみ） | 価格は `.bk-price b`（Anton）、単位は `.bk-unit`。USD 表示は `<Fx>` `<Yen>` `<JpyRef>`（`components/site/money.tsx`）を通す。**金額を素の文字列で書かない** |
| CTA ボタン | `.bk-cta`（予約カード）、`.contact-cta`（フォーム送信）、`.sb-cta` 等の既存 | オレンジ地・黒文字・Anton・角丸なし。ホバーで `--gold`。**青や緑のボタン、角丸ボタン、グラデーションは禁止** |
| 一覧カード | `<ListingCard>`（`.lc` 系） | 写真スワイプ付き、説明文なし。旅行サポートの一覧は `<SupportCard>` が同じ `.lc` を再利用している |
| 基本情報の表 | `<ExperienceFacts>`（`dl` + `experience-facts.module.css`） | 項目名は `lib/experience-seo.ts` の `FACT_COPY` から |
| 料金表 | `<table className="xp-pricing compact">` | 人数 / グループ総額 / 1名あたり。総額は `td.total`（Anton） |
| プラン・チケット種別 | `pricing.plans` + `planText`（カタログ）→ `.plan-compare` と `.bk-plans` | 1人単価のチケットは `planMode:"perPerson"`、グループ料金は `supplement` / `extraGuest` |
| チェック一覧 | `.check-list`（含まれる）、`.check-list.muted`（含まれない・確認中） | 先頭記号は `✓` / `—` を `span.tick` で |
| 特徴カード | `.xp-highlights > .xp-highlight`（svg + b + p） | 3〜4枚。影 5px |
| ステップ | `.xp-flow`（番号付き3ステップ） | 予約の流れ |
| FAQ | `.faq-list > details > summary + p` | `+`／`–` の開閉記号は CSS が付ける |
| 注意書き・補足 | `.xp-note`（本文）、`.form-hint`（入力欄の下） | |
| オプション | `.addon`（ページ側）、`.form-addons .form-check`（フォーム側） | カタログの `addOns` から自動 |
| キャンセル表 | `<CancellationTable>` | `cancellationTiers` があれば表、無ければ `.xp-cancel` の文章 |
| フォーム | `<EnquiryForm kind="guest" lang experience />`（体験）、`<SupportForm>`（サポート） | 入力欄は `.enquiry-form input/textarea`：白地・黒2px枠・フォーカスでオレンジ枠＋オフセット影。**独自フォーム・独自バリデーション UI を作らない**。送信先は `/api/contact` |
| 通貨・言語 | `<CurrencySwitcher>` `<LanguageSwitcher>` は既存の位置のみ | |
| 同意バナー | `<ConsentBanner>` は layout が出す | ページ側で触らない |

shadcn の `components/ui/*`（`Button` など）は Tailwind ベースで角丸・小型。**公開サイトの画面では原則使わない**（運営画面向け）。公開サイトは `globals.css` のクラスで組む。

---

## 5. 文章・多言語のルール

- 対応言語は `en / es / ja / fr / zh-tw` の5つ（`lib/i18n.ts` の `LANGS`）。公開ページは **5言語すべて**で成立させる。UI文言は `t(lang)`（`lib/i18n.ts`）に追加し、ハードコードしない。
- 日本語の体裁は **敬体（です・ます）**。英語は簡潔で具体的。誇張（最高・唯一・絶対）、保証できない約束、未確定の数字は書かない。
- **提携先の社名・店名・講師名・住所・電話・外部リンク・卸値・手数料は公開ページに出さない**（オーナー方針。個別に許可された店名のみ例外。例：クリニック名は可）。商品は常に「KAMEHAME JAPAN の商品」として書く。
- 価格は税込を明記し、`¥12,000` 形式（`yen()`）。「〜」「From」の表現は価格が変動する場合のみ。
- レビュー・評価・体験談・写真の「お客様の声」を**創作しない**。`REVIEWS_PUBLISHED` と実データのみ。
- 医療（クリニック）は医療広告ガイドライン：体験談・ビフォーアフター・最上級・キャンペーン表現なし、自由診療・費用・リスクを明記。
- 「毎日開催」「空きあり」など運営上の断定は、カタログの `availability` に根拠がある場合のみ表示する。
- 予約締切は `availability.cutoffDays` / `cutoffTime` に持たせる。表示文（「前々日の18:00まで」等）・フォームの最短日・カレンダーの選択不可日はここから自動で揃う。本文や FAQ に締切日を手書きするときは同じ値にする。
- 中止時の連絡手段は「メール」のみと書く（電話は書かない）。

---

## 6. 画像のルール

- 形式は **WebP**、長辺 1600px、`public/images/<slug>-<内容>.webp`。元ファイル名（地名・社名・IMG_xxxx）を残さない。
- 使えるのは **提携先から掲載用に提供された写真か、購入ライセンス（PIXTA 標準・モデルリリース済）のみ**。公式サイト・Airbnb・SNS からの転載は、許可の記録がない限り不可。無い間は写真枠を「準備中」にする。
- ヒーロー1枚目は横位置（3:2 前後）。人物・ステージなど主題がはっきりしたものを先頭に。
- `alt` は5言語で、写真に写っているものを具体的に（「体験の様子」のような汎用文は不可）。
- 提携先のロゴ・看板・グループ名が写っている写真は、文字として本文に転記しない。
- OG 画像は 1200×630 を `public/og/<slug>.jpg` に置く（任意。無ければヒーロー写真が使われる）。

---

## 7. 公開状態・SEO

| `status` | 見え方 |
|---|---|
| `"live"` | 一覧・カテゴリ・サイトマップ・検索に出る。予約フォームが有効 |
| `"preview"` | URL 直打ちのみ。`noindex`、一覧・サイトマップ非掲載、上部に黄色いプレビュー帯。`/api/contact` は live 商品のリクエストしか受けない |
| `"soon"` | 一覧に「近日公開」として出るが予約不可 |

- 新規は **`preview` で作って本番に出し、オーナーが staging / 本番 URL で確認して「リリース」と言ってから `live`** にする。
- `app/previews/*` は常に `robots: noindex, nofollow, noarchive`。
- 構造化データ（Product / FAQ / BreadcrumbList）は `lib/experience-seo.ts` と `lib/seo.ts` が生成する。ページ側で JSON-LD を手書きしない。
- 旧 URL を消すときは `redirect()` で新 URL に転送する（例：旧プレビュー → 商品ページ）。

---

## 8. アクセシビリティ・動作

- 画像には `alt`、アイコンだけのボタンには `aria-label`。装飾アイコンは `aria-hidden`。
- 見出しは h1 → h2 → h3 の順。`.xp-section` の h2 を飛ばして h3 を使わない。
- フォーカス可視：入力欄はオレンジ枠、リンク・ボタンはブラウザ既定を消さない。
- `prefers-reduced-motion` ではアニメーションを止める（既存の `@media(prefers-reduced-motion:reduce)` を踏襲）。
- タップ領域は 44px 以上。スマホの固定バー（`StickyRequestBar`）と同意バナーが重ならないこと。
- クライアントコンポーネント（`"use client"`）は必要最小限（フォーム、ギャラリー、通貨）。ページ本体はサーバーコンポーネントで描画し、JS 無しでも内容が読めること。

---

## 9. やってはいけないこと（よくある逸脱）

1. 新しい色・フォント・角丸・ぼかし影・グラデーションを追加する。
2. インラインスタイルや Tailwind ユーティリティで公開ページを組む（`style={{}}` は例外的に `marginTop` 程度まで）。
3. ページ専用の CSS ファイルを増やす。必要なら `globals.css` の該当ブロックの近くに追記し、クラス名は既存の接頭辞（`xp-`, `bk-`, `lc-`, `sp-`, `form-`）に揃える。既存プレビュー用の `preview.css` のような小さな追加はよいが、既存クラスの上書きはしない。
4. `eyebrow`（斜めのオレンジ帯）を見出しの上に置く。トップページ以外では使わない。
5. 価格・金額を素の文字列や計算なしで表示する（`lib/pricing.ts` を通す）。
6. フォームを独自実装する、送信先を増やす、顧客データをクライアントに残す。
7. 提携先の名前・連絡先・卸値・手数料・原価をページ、コメント、alt、画像ファイル名に入れる。
8. 1言語だけで公開する（`APPROVED_ENGLISH_FALLBACK` は既存ページの救済用で、新規には使わない）。
9. レビュー・評価・サンプル体験談を作る。
10. 画像を公式サイト等から勝手に取って置く。

---

## 10. 着手〜公開の手順とチェックリスト

```
npm run build                  # READY_STATE_KV_ID=00000000000000000000000000000kv1 npm run build（サイトマップも再生成）
node --test tests/*.test.mjs   # 全テスト（約 350 件）
npx tsc --noEmit -p .          # 型
npm run lint
```

ローカル確認：`npx wrangler dev --local --config dist/server/wrangler.json --port 8788 --var KH_ENV:staging --var STAGING_BASIC_AUTH:kame:test` → Playwright で **PC（1380px）とスマホ（390px）** の全画面スクリーンショットを撮り、既存の体験ページ（例：`/ja/tokyo/kanji-name-calligraphy/`）と並べて比較する。

公開前チェック：
- [ ] 既存ページと並べて、ヘッダー・パンくず・h1・写真枠・チップ・サイドカード・セクション見出しの位置と見た目が同じ
- [ ] 色は `--ink / --paper / --rice / --white / --kame / --gold / --muted` 以外を使っていない
- [ ] 見出しは Anton（weight 400・uppercase）、本文は Arial 系
- [ ] 角丸・ぼかし影・グラデーションを追加していない
- [ ] 5言語とも内容が揃っている（`t(lang)` とカタログ各ファイル）
- [ ] 提携先の名前・連絡先・卸値・原価が本文・alt・ファイル名・コメントに無い
- [ ] 写真はライセンス済み WebP、alt は具体的
- [ ] 金額は `yen()` / `<Fx>` 経由、税込表記
- [ ] `status` は `preview` で開始、`noindex` が効いている
- [ ] スマホで横スクロールが無く、固定バーと同意バナーが重ならない
- [ ] `npm run build` と `node --test tests/*.test.mjs` が通り、必要なら `tests/` にページのテストを追加した
- [ ] 本番反映は `main`、確認用は `staging`。公開（`live`）切替はオーナーの指示後

---

## 11. 参考にすべき実装

| 目的 | 見るファイル |
|---|---|
| 体験詳細ページの正本 | `app/[lang]/[collection]/[slug]/page.tsx` |
| チケット2種（1人単価プラン） | `lib/catalog.ts` の `tokyo-idol-live-night`、`lib/pricing.ts` の `planMode:"perPerson"` |
| 相談のみ・金額非表示・クーポン | `kyoto-ryokan-beauty-clinic`（`consultationOnly`, `perk`, `feeTable`） |
| 体験以外の案内ページ | `app/[lang]/support/page.tsx`、`app/[lang]/support/babysitter/page.tsx`、`lib/support.ts` |
| 確認用プレビュー（写真なしの枠） | `app/previews/partner-listings/[slug]/page.tsx` + `preview.css` |
| 一覧カード | `components/site/listing-card.tsx`、`components/site/support-card.tsx` |
| フォームと API | `components/site/enquiry-form.tsx`、`app/api/contact/route.ts`、`lib/contact.ts` |
| 通貨表示 | `components/site/money.tsx`、`lib/pricing.ts` |
| テストの書き方 | `tests/idol-live.test.mjs`、`tests/support.test.mjs`、`tests/partner-listing-drafts.test.mjs` |
