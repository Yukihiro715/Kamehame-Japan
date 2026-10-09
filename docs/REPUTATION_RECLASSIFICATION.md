# セキュリティ判定（5件）再分類の手順書 — 2026-10-09

調査: 2026-10-09（ベンダー5社の調査と裏取り、根本原因4本、判定3名、要約1本の自動調査の結果を整理したもの）。進捗と前提は `SITE_REPUTATION.md` を参照。申請を出したら各項目に日付を書き足すこと。

## 1. 結論

1. **5件の正体**: SSLTrust の「Website Security Check」は VirusTotal（VT）の集計で、5件は各社のURL分類DBに保存された「blacklist」方式の判定。Forcepoint ThreatSeeker =「Phishing and Other Frauds」（Forcepoint 自身の Site Lookup で確認済み。http/https/裸ドメインが該当、www は「Newly Registered Websites」）、Fortinet =「phishing」（FortiGuard 上の実カテゴリは未確認・推定「Phishing」）、Sophos =「malware」（カテゴリ「Spyware and malware」、脅威名 Mal/HTMLGen-A ＝レピュテーション判定でマルウェア検出ではない）、Webroot（OpenText BrightCloud）=「malicious」（カテゴリ「Phishing and Other Frauds」）、alphaMountain.ai =「Phishing」。
2. **判定でないもの**: 実際のフィッシング被害報告・マルウェア検出・人の通報ではない。PhishTank（69,258件中0）/ OpenPhish / URLhaus / Google Safe Browsing / Norton / Sucuri（修正後）/ Yandex / SURBL / Quad9・Cloudflare セキュリティDNS はすべてクリーン。サイト全ページ検査で認証情報・カード入力欄・不正スクリプト・難読化・クローキングは存在しない。Chrome/Safari/Edge 等の一般ブラウザは警告を出さない。
3. **最有力原因（確度 高・約65〜75%）**: 登録39日・履歴ゼロ（Wayback/証明書透明性/パッシブDNS/検索インデックス全部ゼロ）・WHOIS非公開・1年契約の新規ドメインが、多言語・高額・「メールで送る決済リンク」型の予約サイトとして突然現れたことに対する各社ML自動スコアリング。副次要因: 8/31〜9/15 にお名前.com のパーキングページとして共有IP 150.95.255.38（alphaMountain と Webroot が悪性評価）上にあった（中、この2社）、10/8 まで残っていた `</html>` 後の `<script>`（Sophos の「malware」について中、他3社は低）、メール経由の判定流入（低・約10%）。
4. **自然には消えない**: VT の 10/8 再スキャンは修正後のヘッダ（HSTS/CSP 等）を記録しているのに5件とも残った ＝ 保存済み判定。サイト改修や再スキャンだけでは変わらない。5社は別々のDBで共有フィードではない（1社が直っても他社は消えない）。
5. **最速で結果が変わる手段**: 5社それぞれに手動で再分類申請（本日中・合計約1.5時間）→ 各社の反映を各社ツールで確認 → VT で6オブジェクトを「Reanalyze」→ SSLTrust を1回再実行。目安: Webroot 24〜48h、Sophos 24〜72h（製品反映まで最大5営業日）、Forcepoint 96h以内に評価＋日次DB反映、Fortinet・alphaMountain は SLA なし（数日〜数週間）。

---

## 2. ベンダー別の対応

到達範囲（影響するユーザー数）が広い順。ただし**5社すべて当日中に出す**（処理が速いのは Webroot と Forcepoint）。

### 2.0 申請前の共通準備（10分）

- 申請を出し終えるまで SSLTrust / VirusTotal / URLVoid 等の再スキャンを実行しない（毎回 VT 経由で約93エンジンに再提出され、判定が更新・固定される）。
- 用意するもの: トップページのスクリーンショット（2MB以下）、Google Safe Browsing「No unsafe content found」の画面、/en/legal/ に記載の担当者名、会社メールボックス hello@kamehame-japan.com（個人 Gmail や「+」付きアドレスは使わない）。
- 旧文面の「the only form is an enquiry form」は**使わない**（サイトには /en/review/ のレビューフォーム（写真添付あり）、/en/trade/ の業者向けフォーム、/partners/ の日本語パートナーフォームもあり、審査員がクロールすれば矛盾する）。
- 共通英文（全社で使う本文。各社のコメント欄にはこれを貼り、最後の要望カテゴリ名だけ各社の綴りに合わせる）:

```
Site owner request: please re-categorize kamehame-japan.com as "Travel".

KAMEHAME JAPAN (https://kamehame-japan.com/) is operated by Prosent Inc. (株式会社プロセント), a company registered in Tokyo, Japan. Corporate number: 7010001232139 (Japan National Tax Agency register; the number was assigned in January 2023, so the company predates the domain). Our seller details (company name, address, corporate number, contact mailbox) are disclosed under Japan's Act on Specified Commercial Transactions at https://kamehame-japan.com/en/legal/, and our corporate site is https://prosent.co.jp/.

The site, launched in September 2026, presents a small number of curated travel experiences for visitors to Japan (a private geisha dinner in Kyoto, a kanji calligraphy session in Tokyo and a Mt. Fuji golf day) in English, Japanese, Spanish, French and Traditional Chinese.

The site has no login, no user accounts and no payment page. Its only forms are a booking enquiry form and a travel-trade enquiry form (name, email, dates, party size or company, message), a guest-review form (first name, review text, optional photo) and a Japanese-language partner-venue form. None of them asks for a password, a one-time code, a bank login or payment-card details. Payment is made only through a Stripe-hosted payment link (book.stripe.com) that we send by email after an enquiry; card details are never entered on this site and never requested by email.

The domain was registered on 31 August 2026 and has been hosted on Cloudflare since 15 September 2026. A page-markup defect in our own build output (framework script tags emitted after the closing </html> tag; not injected code) that one scanner flagged as "html_anomaly" was corrected on 8 October 2026, and that scanner (Sucuri SiteCheck) now reports the site clean. Google Safe Browsing and Norton Safe Web rate the site as safe, and Google's own category for the site on VirusTotal is "travel".

We respectfully request that kamehame-japan.com, www.kamehame-japan.com and both the http:// and https:// forms be re-categorized as "Travel".
```

### 2.1 Fortinet（FortiGuard Web Filtering）

- **今日の判定**: VT/SSLTrust 上で Fortinet =「phishing site」、URLVoid でも「Fortinet: Detected」（36中これ1件のみ）。FortiGuard 自身のルックアップは GET が全面 403、POST は captcha 必須のため読めていない。VT の文字列「phishing site」= FortiGuard カテゴリ「Phishing」（Security Risk 群、定義「Counterfeit web pages that duplicate legitimate business web pages for the purpose of eliciting financial, personal or other private information」）は推定。VT のドメイン単位では「Fortinet: Clean」の画面も確認されており URL 単位と食い違うので、**申請前に自分で https://www.fortiguard.com/webfilter に kamehame-japan.com を入れて captcha を解き、https と http の両方の実カテゴリを確認・スクショ**する。
- **誰に影響するか**: FortiGate ファイアウォール（企業・学校・ホテル・空港・公共Wi-Fiで最も普及）、FortiClient（会社貸与PC）、FortiProxy、FortiSASE、FortiMail（メール内リンク）、FortiSandbox。該当ネットワークでは赤い「Web Page Blocked! Category: Phishing」画面になる。一般ブラウザや家庭用ウイルス対策には影響しない。
- **申請URL**: https://www.fortiguard.com/faq/wfratingsubmit?url=https://kamehame-japan.com/ （URL欄が事前入力される。ルックアップ結果画面の「Request a Review」リンクも同じフォーム）。
- **ログイン要否**: 不要。captcha は2段階: ALTCHA「I'm not a robot」のチェック → 検証後に「Additional Security Verification / Type the characters shown in the image.」が現れ6文字コード入力（「Play audio」「New image」あり）。所有者確認の仕組みはなし（Name/Email/Company の整合性のみ）。
- **入力項目**（ウィザード「1 Service area → 2 Choose a form → 3 Your details」の3画面目）:

| 項目（原文） | 入れる値 |
|---|---|
| URL * | `https://kamehame-japan.com/`（1回だけ。http版は別送しない） |
| Suggest a category * | `Travel`（アルファベット順の一覧から選ぶ。代替: `Business`） |
| Attach a screenshot image file（任意, Max 2M bytes） | トップページのスクショ |
| Name * | /en/legal/ の担当者名 |
| Email * | `hello@kamehame-japan.com`（書式チェックなし。打ち間違いに注意） |
| Company Name * | `Prosent Inc.` |
| Comment | 下記英文 |
| ALTCHA → 画像コード | 全部入力してから最後に解く。非表示のハニーポット項目にブラウザの自動入力が触れないよう、自動入力は使わない |
| Submit | 押す前にフォーム全体をスクショ（確認メール・チケット番号は約束されていない） |

- **所要時間**: 入力15分。SLA なし。実例: 3日で解決、同日解決（コミュニティ経由）、数週間返事なし。7日経っても変わらなければ1回だけ再送し、https://www.fortiguard.com/faq/general-contact と、Fortinet Community Support Forum（無料アカウント要、職員が同日修正した前例あり）に短い投稿。反映後も各 FortiGate のローカルキャッシュが数時間残ることがある。
- **貼り付ける英文（Comment欄）**:

```
[共通英文をここに貼る]

Note: http://kamehame-japan.com/ redirects (301) to https://kamehame-japan.com/. Requested category: Travel (fallback: Business). FortiGuard currently rates the site "Phishing"; the site contains no login, password or card fields and imitates no third-party brand (the site title "KAMEHAME JAPAN" matches the domain name). Thank you for reviewing.
```

### 2.2 Sophos（SophosLabs / Intelix URL レピュテーション）

- **今日の判定**: VT で Sophos =「malware」（method blacklist）、カテゴリ「spyware and malware」、脅威名「Mal/HTMLGen-A」（Sophos 公式: 悪性または侵害されたと見なすサイトへの Web レピュテーションブロックで、マルウェア本体の検出ではない）。4つのURL変種すべてで同じ。VT のドメイン単位エンジン行は「clean」だがカテゴリは「spyware and malware」のまま。Sophos 自身の Intelix（https://intelix.sophos.com/url）は hCaptcha で自動確認不可。オーナーは通常ブラウザで Guest モードのまま URL を入れて「Analyze」し、表示されたリスク/カテゴリとレポートIDを控える（Sophos Home の資格情報は使えない）。
- **誰に影響するか**: Sophos Firewall（XGS/SFOS）配下のオフィス・ホテル・学校・ゲストWi-Fi、Sophos UTM（2026-06-30 EOL）、Intercept X / Sophos Endpoint（Sophos Central 管理の社用PC）、Sophos Home（**家庭用**ウイルス対策・Windows/Mac）、Sophos Mobile、DNS Protection、Protected Browser、Sophos Email（Time-of-Click 保護: 送った予約メール・Stripe リンクのクリックが遮断されうる）。VT を参照する SOC ツール。
- **申請URL**: 推奨ルート＝メール **url_review@labs.sophos.com**（Sophos 公式 Recommended Read、2026-10-07 更新）。代替＝Web フォーム https://support.sophos.com/support/s/filesubmission?language=en_US →「Web Address (URL)」→「Are you a Sophos Customer?」= No（この環境では画面を描画できず項目は利用者報告ベース: Product（迷ったら「Endpoint Protection (Managed by Sophos Central)」）、First name、Last name、Email、Company、Firewall serial（任意）、URL、Comments →「Submit URL」。確認メール・ケース番号なし）。任意の追加＝Sophos Community Chat に「URL Reassessment Request」スレッド（無料 Sophos ID ＋グループ参加が必要。職員が Labs を督促してくれる）。
- **ログイン要否**: メールは不要、所有者確認もなし。Intelix 内の「Disagree?」ボタンはサポートライセンス保有者専用で使えない。
- **入力項目**（メール）:

| 項目 | 値 |
|---|---|
| To | `url_review@labs.sophos.com` |
| Subject | `hxxps://kamehame-japan.com/`（Sophos 指定の無害化表記: https→hxxps, http→hxxp） |
| Body | 下記英文（他の変種は本文に列挙。別便で `hxxp://kamehame-japan.com/` を送ってもよい） |

- **所要時間**: 10分。Labs の再評価 24〜72h（多くは24h未満）、各製品への反映は最大5営業日、Sophos Home KB は「15日待って Intelix で再確認」。確認メールは来ない。反映確認は Intelix（Guest）と VT。
- **貼り付ける英文（メール本文）**:

```
Dear SophosLabs,

[共通英文をここに貼る]

SophosLabs currently classifies this domain as "Spyware and malware" (shown as "Sophos: malware", threat name Mal/HTMLGen-A, on VirusTotal, and as "malware site" on SSLTrust). The verdict is a stored reputation entry: VirusTotal's re-analysis on 8 October 2026 already recorded the corrected page and its new security headers (HSTS, CSP frame-ancestors, X-Content-Type-Options), yet the result persisted. Please reassess the following and categorize the site as Travel (or General business):

hxxps://kamehame-japan.com/
hxxp://kamehame-japan.com/
hxxps://www.kamehame-japan.com/
hxxp://www.kamehame-japan.com/

Intelix report ID (Guest lookup): [ID if obtained]
Contact: Prosent Inc. (株式会社プロセント), [person in charge], hello@kamehame-japan.com

Thank you.
```

### 2.3 Webroot / OpenText BrightCloud

- **今日の判定**: VT で Webroot =「malicious」（method blacklist）を https/http/www の全4 URL と www ドメインで表示、カテゴリ「Phishing and Other Frauds」（BrightCloud カテゴリ ID 57）は裸ドメイン含む全オブジェクトに付与（裸ドメインのエンジン行だけ「clean」＝カテゴリ表が判定を駆動している）。SSLTrust「malicious site」。ベンダー自身の https://support.threatintel.opentext.com/tools/url-ip-lookup.php は reCAPTCHA Enterprise（画像課題）で自動確認不可。数値レピュテーションスコアは不明。オーナーは通常ブラウザで確認・スクショ可。
- **誰に影響するか**: Webroot SecureAnywhere（**家庭用**ウイルス対策。「Web Threat Shield」拡張がブロックページ「classified as malicious, according to Webroot」を表示し、検索結果に赤アイコン）、Webroot Business Endpoint、Webroot/OpenText DNS Protection、BrightCloud を OEM 利用する機器（HPE Aruba WebCC、F5 BIG-IP IP Intelligence、Cradlepoint（2018年資料）、A10（旧資料）、Citrix）。VT 参照ツール。
- **申請URL**: https://support.threatintel.opentext.com/tools/change-request.php （brightcloud.com の旧URLはここへ転送。ルックアップ結果のサイドバーにも同じフォーム）。FAQ: https://support.threatintel.opentext.com/static/files/OpenText-Threat-Intelligence-Public-Change-Request-FAQ.pdf
- **ログイン要否**: 不要。reCAPTCHA Enterprise のみ。所有者確認なし（メールアドレスのドメインだけが手掛かり）。
- **入力項目**（原文ラベル）:

| 項目（原文） | 入れる値 |
|---|---|
| URL or IP: * | `kamehame-japan.com`（http:// も www. も付けない。先頭スペース禁止。FAQ「変種をすべて出す必要なし、1つで足りる」） |
| Optional: I would like to suggest a category for this URL | クリック → モーダル「OpenText Web Categories」→ `Travel` だけにチェック（`Business and Economy` は追加しない。1カテゴリしか受けないパートナー製品がある）→「Done」。リンク下に「Category Selected: Travel」と出る |
| Your email: * | `hello@kamehame-japan.com`（ASCII のみ、`+` を含むアドレス不可） |
| Your product/integration: | `Site owner`（20文字以内。「Site owner / VirusTotal」は23文字で切れる） |
| Additional comments about this request: | 下記148文字（上限150。`& + # %` は送信処理でURLエンコードされず壊れるので使わない） |
| reCAPTCHA | **全項目を入力し終えてから**最後にチェック |
| Submit（青いリンク） | クリック。入力中に Enter を押すと送信されるので押さない。成功すると緑のメッセージが出てフォームが空になる |

- **所要時間**: 10分。「Web Analysts typically process all requests within 24-48 hours」。FAQ の「確認メール2通」は現在存在しない「Receive Notifications」チェックボックス前提なので、来ない可能性あり → 48h 後に上記ルックアップで自分で確認。カテゴリ変更で「malicious」は消えるが、数値スコアはホワイトリスト化されず経年で改善。
- **貼り付ける英文（コメント欄・148文字）**:

```
Legitimate travel-experience site of Prosent Inc. (Tokyo). No logins or credentials collected; Stripe links by email. Please recategorize as Travel.
```

### 2.4 Forcepoint（ThreatSeeker / Forcepoint URL Database）

- **今日の判定**（ベンダー自身の Site Lookup、2026-10-09 ゲスト利用で2回確認）: 結果表「Site Lookup Result」（列: URL | URL Database Category | Real-time Category）で、`http://kamehame-japan.com/`、`https://kamehame-japan.com/`、`kamehame-japan.com` = **Phishing and Other Frauds / Phishing and Other Frauds**。`https://www.kamehame-japan.com/` = Newly Registered Websites / Newly Registered Websites。VT でも裸ドメインの apex URL のみ「phishing」、www とドメイン単位は「clean / newly registered websites」。Forcepoint はドメイン単位ではなくページ単位で分類するため、URL 形ごとに申請が必要。
- **誰に影響するか**: Forcepoint Web Security（クラウド/オンプレ）、Forcepoint ONE SSE（SmartEdge Agent 入り社用PC）、Forcepoint NGFW、Forcepoint Email Security（URL 分析でリンクが無効化されうる＝文書化は未確認・蓋然性あり）、DLP。同じDBを使う **WatchGuard Firebox WebBlocker / DNSWatch**（中小企業に普及。WatchGuard 自身のポータルが「Search the Forcepoint database」と明記）。VT 参照ツール。一般ブラウザ・家庭用AVには影響しない。
- **申請URL**: https://support.forcepoint.com/s/site-lookup
- **ログイン要否**: 不要（ゲスト可。KB 000005432「If you aren't a Forcepoint customer or partner, you can access the Site Lookup Tool as a guest (no login needed)」）。古い KB 000005089 は「ログイン必須」と書くが実機でゲスト動作を確認済み。**ゲストではメール欄が無効化（灰色）**されており回答メールは来ない。ゲストの残回数「10 URL analysis remaining」はブラウザセッション単位（新しいブラウザで再び10）。
- **入力項目**:
  1. 「Site Lookup Tool」>「Enter a URL」> ラベル「Analyze a URL for malicious content:」のテキストエリア（placeholder「One URL per line...」）に1行ずつ: `http://kamehame-japan.com/` / `https://kamehame-japan.com/` / `kamehame-japan.com` / `https://www.kamehame-japan.com/` / `https://kamehame-japan.com/en/`（余力があれば /ja/ /es/ /fr/ /zh-tw/ も）→「Analyze」。
  2. 結果表の「Phishing and Other Frauds」の行ごとに「Recategorization」ボタン（「More Details」の ACE Insight 経路は描画されなかったので使わない）。
  3. モーダル「What is your suggestion?」: URL / URL Database / Real-time Categorization（読み取り専用）→「Suggest:」ボタン「Please select from this list」→ 一覧（158件、サブカテゴリは「Parent: Child」表記）から**裸の `Travel`**（T まで下げるか「Tra」と打つ。代替 `Business and Economy`。「Security: Phishing and Other Frauds」「Extended Protection: Newly Registered Websites」は選ばない）→「Comments:」（placeholder「Please provide an explanation for your suggestion.」、文字数上限なし）に下記長文、サーバーに拒否されたら短文 →「Site Owner」チェックを入れる → メール欄は灰色で入力不可 →「Submit」。www 行（Newly Registered）も同様に Travel を提案。
  4. 行ごとに繰り返す。
- **所要時間**: 20分。「Forcepoint Security Labs team will investigate and evaluate your request within 96 hours」→ 承認なら次の日次DBロールアウトで反映。確認メールなし → 4〜5日後に Site Lookup を再実行。WatchGuard 側はさらに数日遅れることがある。一括代替: URL-feedback@forcepoint.com に URL一覧 .txt をパスワード「infected」の zip で送付（顧客向け、30分で受付ID、72h で結果CSV）。
- **貼り付ける英文（Comments 欄・長文）**:

```
[共通英文をここに貼る]

Current Forcepoint category: "Phishing and Other Frauds" (URL Database and Real-time) for http://kamehame-japan.com/, https://kamehame-japan.com/ and kamehame-japan.com; https://www.kamehame-japan.com/ is "Newly Registered Websites". Requested category for all of them: Travel. The site counterfeits no other site: it imitates no brand, has no login and collects no financial or account information.
```

- **短文版（サーバーが長文を拒否した場合）**:

```
Site owner. KAMEHAME JAPAN is run by Prosent Inc. (株式会社プロセント, Tokyo, corporate no. 7010001232139, see https://kamehame-japan.com/en/legal/ and https://prosent.co.jp/). Curated travel experiences in Japan; enquiry forms only, no logins or card entry; payments via Stripe links by email. Please recategorize as Travel.
```

### 2.5 alphaMountain.ai

- **今日の判定**: VT で alphaMountain.ai =「phishing」（malicious）を www ドメインと4つの URL オブジェクトで表示、ドメインの categories 欄「Phishing (alphaMountain.ai)」。裸ドメインのエンジン行だけ「unrated」だが、同じ分（10/8 13:48Z）に apex URL は「phishing」なので「解除されつつある」とは解釈しない。両 Cloudflare IP は「unrated」。ベンダー自身の threatYeti は bot 判定でこの環境からは読めず数値スコア（7.0以上＝risky）は不明。オーナーは通常ブラウザで https://threatyeti.com/search?q=kamehame-japan.com（ゲスト 5回/日）を開き、カテゴリ/スコアをスクショして申請に添える。
- **誰に影響するか**: 5社で最も直接影響が小さい。消費者製品なし。VT のエンジン行と categories 欄を供給（→ SSLTrust・SOC・メール解析ツールに再掲）、社名非公開の SWG/SEG/DNS フィルタへの OEM フィード、SOC 連携（Cisco XDR、Splunk、ThreatQ、Cellopoint（メールGW）、FortiSOAR 等）。Chrome 拡張「a9 Web Protection」は未検証。
- **申請URL**: https://alphamountain.freshdesk.com/support/tickets/new （公式「Report a False Positive」ページ https://www.alphamountain.ai/false-positive/ からのリンク）。
- **ログイン要否**: **要**。無料の Freshdesk サポートポータルアカウント: https://alphamountain.freshdesk.com/support/signup（Full name / Email / reCAPTCHA → 有効化メールでパスワード設定）または ログイン画面の「Continue with Google」（Google Workspace の @kamehame-japan.com アカウント推奨）。登録メールは会社ドメインにする（所有者確認の仕組みは他になく、申請者メールのドメインと本文の担当者情報だけが根拠）。
- **入力項目**（ログイン後のフォームは未観測。ログイン不要の旧ウィジェットで見た同一チケット項目が出る見込み）:

| 項目（原文） | 入れる値 |
|---|---|
| Requester（email, 必須） | `hello@kamehame-japan.com` |
| Your Name | 担当者名 |
| Subject（必須） | `False positive: kamehame-japan.com classified as Phishing - request category Travel` |
| Description（必須, リッチテキスト） | 下記英文 |
| Disputed Website | `kamehame-japan.com` |
| Suggest New Category for Disputed Website（ドロップダウン） | `Travel`（代替 `Business/Economy`。`Unrated`「Newly Registered Domains」は選ばない。ドロップダウンが無い場合は Description に書く） |

- **所要時間**: アカウント作成込み20分。SLA 非公開（「Requests are processed in the order in which they are received」、現実的に数営業日）。再分類後の社内反映は最大24h。KB の指示: threatYeti が「Clean」を示したら VT で6変種すべて「Reanalyze」（VT は自動では取り込まない）。
- **貼り付ける英文（Description 欄）**:

```
[共通英文をここに貼る]

Current classification: "Phishing (alphaMountain.ai)", as shown on VirusTotal for www.kamehame-japan.com and for the http/https URL objects. Requested category: Travel (fallback: Business/Economy). Google's content category for the site on VirusTotal is "travel", and alphaMountain rates both of the site's IP addresses (104.21.13.233 and 172.67.133.107) as unrated.

Company details:
Company: Prosent Inc. (株式会社プロセント)
Japanese corporate number: 7010001232139
Registered address: Kachidoki 1-3-1, 43F, Chuo-ku, Tokyo 104-0054, Japan (as published at https://kamehame-japan.com/en/legal/)
Operator website: https://prosent.co.jp/

Verification (company officer):
Name: [name]
Title: [title]
Telephone: [number]
Email: hello@kamehame-japan.com

Disputed hosts/URLs:
kamehame-japan.com
www.kamehame-japan.com
http://kamehame-japan.com/
https://kamehame-japan.com/
http://www.kamehame-japan.com/
https://www.kamehame-japan.com/

threatYeti screenshot attached: [yes/no]
```

### 2.6 5社以外で既に赤判定のもの（同日に出す）

| サービス | 今日の判定 | 申請先 | 備考 |
|---|---|---|---|
| Trend Micro Site Safety | http:// が「Dangerous / Phishing」、https は「Untested / newly observed」 | https://global.sitesafety.trendmicro.com/ → http と https を検索 →「Proceed to URL Reclassification Request」（feedback.php）→ カテゴリ Travel | 2〜7日。一般旅行者が検索で見つけやすい赤判定 |
| CRDF Threat Center | VT ドメイン単位で唯一「malicious」 | https://threatcenter.crdf.fr/false_positive.html?indicator=kamehame-japan.com | ドメインのみ |
| IPQualityScore | ScamAdviser 経由で「reported for phishing / suspicious」（ML 判定。自社ページは回数制限で未読） | https://www.ipqualityscore.com/contact-us（ドメイン用の正式フォームは見つからず） | |
| ScamAdviser | 「Likely Unsafe」Trust Score 0（IPQS フラグ＋ドメイン年齢＋低 Tranco が理由） | https://www.scamadviser.com/claim-your-site で Business Verification | IPQS が消えてもドメイン年齢分は残る |

### 2.7 確認ループ（申請後）

- 48〜72h 後、以後週1回: Forcepoint Site Lookup、OpenText URL/IP Lookup、Intelix（Guest）、threatYeti、FortiGuard webfilter、Trend Micro、ScamAdviser を再確認。
- あるベンダーが新カテゴリを示したら VT で「Reanalyze」: ドメイン `kamehame-japan.com`、`www.kamehame-japan.com`、URL ID `8d6d6c3e744d1560bcd3dc925c71ec724232e35fac73ea1fb7aaf32929465f4b`（https apex）、`5d384cc4ab55e844d2e9771acffe316ad39a218add2425ee0bf308ec631637fb`（http apex）、`35c279b3f374b88c1a731ba8c2130bba181f82b36ae0d9076d4fc7fec5120236`（https www）、`0e0200be5d3200cf381067079b009f3abc273cf48a0e3c2a89723f657d355796`（http www）。その後 SSLTrust を1回。どのエンジンがいつ消えたか記録する（VT はエンジン別履歴を残さない）。
- 任意: VT 無料アカウントでドメインと4 URL に所有者コメントと「harmless」投票（現在 0/0）。

---

## 3. 根本原因の評価

| 順位 | 原因 | 確度 | 根拠（要点） | オーナーで直せるか |
|---|---|---|---|---|
| 1 | **履歴ゼロの新規ドメインに対する各社MLの自動リスク判定**（登録 2026-08-31、39日、WHOIS 非公開、1年契約、DNSSEC なし、Wayback/CT/pDNS/検索ゼロ、Tranco/VT 人気ランクなし、DV 証明書、Cloudflare）が「Phishing and Other Frauds」等の汎用詐欺カテゴリとして**保存**された | 高（約65〜75%。Forcepoint/Fortinet/alphaMountain の主因、Webroot にも寄与） | 5件とも VT で method「blacklist」。Forcepoint のドメイン単位カテゴリは文字通り「newly registered websites」、Trend Micro は「newly observed domain」、ScamAdviser/IPQS は「age (very) young」。証拠ベースのリストはすべて0件、VT 投票/コメント 0、urlscan 公開スキャン 0、targeted_brand null。10/8 の修正後ページを VT がクロールしても5件残った | 保存判定は各社への再分類申請でしか消えない。新規性シグナルは契約年数延長・DNSSEC・外部フットプリントで徐々に下がる |
| 2 | **パーキング期間の共有IP**: 8/31〜9/15 はお名前.com のパーキングページ（Apache, GMO 共有IP 150.95.255.38）。VT の初回観測（9/8）と初回URL提出（9/9 04:33/07:31Z）はこの期間。150.95.255.38 は VT で alphaMountain と Webroot だけが「malicious」評価、コメント「malware source IP」 | 中（約20〜40%。alphaMountain と Webroot の種として） | 5社中この2社だけが同IPを悪性評価。現 Cloudflare IP は 0/92。旧 vhost は今も Host: kamehame-japan.com に 301 を返す。相関のみで各社の登録日は不明 | 一部可: 申請文にホスティング履歴を書く。GMO/お名前.com に旧 vhost の削除を依頼 |
| 3 | **10/8 まで `</body></html>` の後に出ていた vinext RSC の `<script>`**（9/15〜17 の公開から 10/8 08:21Z の修正まで）を Sophos のクローラが「Mal/HTMLGen-A」として記録 | 中（約25〜50%、Sophos のみ。Webroot に低、phishing 3社には低） | Sucuri が同一マークアップを「Known malware (html_anomaly)」と判定した実績、Sophos/Webroot だけ「malware/malicious」表記。反証: 9/9 の VT 初回提出時はまだパーキングページ、9/15〜10/8 のベンダークロール日時の証拠なし、Forcepoint の Real-time 判定は修正後も Phishing | 内容は修正済み（12 URL で `</html>` 後 0 バイトを確認）。Sophos への再評価依頼のみ必要 |
| 4 | **サイトの文言・構造が「偽ツアー業者」テンプレに重なる**: 「pay through the link we send」「Credit card or bank transfer」、16万〜18万円の PreOrder 商品、セッションなしでも「your payment has been received and your booking is confirmed」を表示する公開 /en/booked/、他チャネル由来の★レビューと「only confirmed bookings can review」の矛盾、「COMING SOON」が5枠中3枠、送信できない /partners/ フォーム、prosent.co.jp からの逆リンクなし、検索で見つからない ELNX TRAVEL 登録番号 | 低〜中（約20〜35%。原因1への入力特徴） | 内容検査で確認。反証: Google の VT カテゴリは「travel」、内容スキャナ系（Sucuri/Quttera/Dr.Web/Kaspersky/ESET/BitDefender）はクリーン | 可（4章）。保存判定自体は変わらないが再判定・人の審査で効く |
| 5 | **ベンダー間の相互強化**（3件→5件、10/5→10/9、サイト側の変化は修正のみ） | 低〜中（約25%。増幅要因であり起点ではない） | alphaMountain「cross-validated by a variety of sources」。反証: 単一共有フィードではない（alphaMountain の提携先に他4社なし、Forcepoint は apex URL のみ、CRDF はドメインのみ、Sophos は malware 表記） | 間接的: 速いベンダー（Webroot/Sophos/Forcepoint）から消すと他社の「裏付け」が減る |
| 6 | **メール経由**: 新ドメインから海外の初対面客に送る返信/Stripe リンクメールを受信側ゲートウェイ（FortiMail/Sophos Email/Forcepoint Email/Webroot/alphaMountain SEG）がフィッシング判定し Web DB に流入 | 低（約10%） | DMARC が `v=DMARC1; p=none;`（rua/ruf なし）で証拠ゼロ。反証: SURBL/PhishTank/OpenPhish 不掲載、送信基盤は Google Workspace（2048bit DKIM）と Resend 自社IP で整合 | 可視化のみ: DMARC rua/ruf 追加、Postmaster Tools、Resend ダッシュボード |

**共通メカニズム（確実）**: 5件とも保存判定で、VT の 10/8 13:37〜13:49Z 再解析は修正後のヘッダ（HSTS, CSP frame-ancestors, nosniff, Referrer-Policy, Permissions-Policy）を記録済みなのに全部残った。裸ドメインのオブジェクトでは Sophos/Webroot/Forcepoint のエンジン行が「clean」なのにカテゴリ欄に詐欺カテゴリが残る＝カテゴリ表が URL 判定を駆動。再分類申請なしでは消えない。

**原因ではないと確認できたもの**:
- 「Kamehameha」（Kamehameha Schools / ksbe.edu、ドラゴンボール）のブランド偽装: PhishTank 69,258件に kamehame* 0件、ブランドリストにもなし、VT targeted_brand null、ブランドは亀（kame）由来でサイト名「KAMEHAME JAPAN」はドメインと一致（Fortinet の「URL と製品名の不一致」ヒューリスティックは該当せず。引用されていた前例 thecupcut.com は改造APK配布サイトで類例ではない）。
- ドメインの前歴（ドロップキャッチ等）: RDAP に 2026-08-31 の登録イベントのみ、Wayback 0件、2026-09-15 以前の証明書なし、パッシブDNS 0件。
- 認証情報・カード窃取、マルウェア、難読化、不審 iframe、クローキング: フォームは問い合わせ/レビュー/業者/パートナーのみ（password/card/CVC/IBAN 欄 0）、eval/atob/base64/data: URI 0、iframe は GTM noscript と Google マップのみ、7 UA・5言語・VT リファラで HTML がバイト一致。
- 現 Cloudflare IP 104.21.13.233 / 172.67.133.107 と同居サイト: 両IP とも VT 0/92、5社とも clean/unrated。
- 類似ドメイン: kamehame-japan.jp/.co.jp/.net/.org/.info/.xyz/.app/.tokyo、kamehamejapan.com、kamehameha-japan.com 等すべて未登録。kamehame.com は2012年からの無関係なパーキングドメイン。
- 証拠ベースのフィード掲載・通報: PhishTank/OpenPhish/URLhaus/Phishing Army/Phishing.Database/oisd 0件、GSB ステータス clean（10/9）、Yandex clean、SURBL 不掲載、OTX 0、VT 投票/コメント 0。
- GTM/GA4/Google Ads/Meta Pixel/Clarity、DMARC p=none/SPF ~all、現在の RSC インラインペイロード（&amp; のみの JSON）、Fortinet の NRD(10日)/NOD(30分) 窓（9/10 頃に満了済み）、Trend Micro の http 判定（VT エンジンではなく別DB）。

---

## 4. サイト側で追加でやるべきこと

順番はこのまま。1〜3 は申請日に、4〜11 は1週間以内、12〜 は2週間以内。

1. **再スキャン停止**（申請完了まで SSLTrust/VT/URLVoid を回さない）。効果: VT 経由の再提出で判定が更新・固定されるのを防ぎ、後の1回の Reanalyze を意味あるものにする。
2. **/{lang}/booked/ のゲート化**: 「your payment has been received and your booking is confirmed」は `/api/booking` が有効な `cs_live_` セッションで paid=true を返した時だけ描画し、セッションなしは中立文（「Looking for your booking? Check the receipt email from Stripe」）かトップへ。/booked/ と /thanks/ に `X-Robots-Tag: noindex, nofollow` ヘッダも付ける（現状 meta のみ）。効果: 誰でも見られる「支払い完了」ページ＋読み込み時の `history.replaceState` という詐欺サイト型の特徴を除去。
3. **決済の明記**: /en/legal/（各言語の legal）と各体験ページに「card payments are processed on a Stripe-hosted page (book.stripe.com); we never ask for card details by email」と書く。効果: 「pay through the link we send」だけの文言が持つ詐欺シグナルを下げ、審査員が確認できる。
4. **/partners/ フォームの修正**: `method=post` ＋ 送信ハンドラ（/api/contact に kind: partner）にするか、明示的なメールリンクに置換。`<html lang>` を ja にする（または /ja/partners/ へ移動）。効果: 「動かないフォーム」「言語宣言と中身の不一致」というプレースホルダー感の除去。
5. **レビュー表示の整合**: ★4.8・5件の横に「Reviews from the host venue's guests via other channels」と明記し、トップの「only confirmed bookings can review」は実際にそうなるまで外す。効果: 偽レビュー疑いの除去。
6. **運営会社リンクの双方向化**: prosent.co.jp（サービス/ニュース）に KAMEHAME JAPAN の記載とリンクを置く（現在 prosent.co.jp に「kamehame」0件）。効果: JSON-LD sameAs とフッター「Operated by Prosent Inc.」をクローラと審査員が裏取りできる。
7. **ELNX TRAVEL の裏付け**: 法的表示から東京都の旅行サービス手配業登録（第20922号）の登録簿エントリにリンクするか登録証を掲載、できなければ番号を外す（Web 検索3回でヒットなし）。効果: 検証不能な許認可表示という減点要因の除去。
8. **/.well-known/security.txt** を 200 text/plain で配信（Contact: mailto:hello@kamehame-japan.com、Expires、Preferred-Languages: en, ja、Canonical）。現状 308→404。効果: 人の審査で見られる基本衛生。
9. **隠し要素の削減**: 画面外ハニーポット `website` 入力を Cloudflare Turnstile に置換（既に Cloudflare 上）、体験ページの空の `div#bokun-widget-mount hidden` を使うまで削除。効果: 「個人情報フォーム内の隠し入力」ヒューリスティックの除去。
10. **任意の強化**: CSP に `script-src 'self' https://www.googletagmanager.com https://static.cloudflareinsights.com`（＋GTM が注入するホスト）を追加、www が証明書でカバーされていることを確認のうえ HSTS preload。効果: 人の審査での印象改善。
11. **DMARC の可視化（今日）**: `_dmarc.kamehame-japan.com` TXT を `v=DMARC1; p=none; rua=mailto:<レポート受信箱>; ruf=mailto:<同じ>; fo=1; adkim=r; aspf=r; sp=none` に変更。2〜4週間のレポートで送信元が Google Workspace（smtp.google.com / google セレクタ）と Resend（send.forge.rmta.net / resend セレクタ）だけと確認できたら `p=quarantine; pct=100` → `p=reject`、`sp=reject`。効果: メール経由説と偽装の有無を確認できる唯一の計測。判定自体は変わらない。
12. **DNS/登録の信頼シグナル**: Cloudflare で DNSSEC を有効化しお名前.com に DS 登録、CAA（`0 issue "letsencrypt.org"` / `"pki.goog"` / `"sectigo.com"`）、任意で MTA-STS + TLS-RPT、お名前.com で契約を2〜3年に延長、WHOIS で組織名表示を検討。効果: IPQS/ScamAdviser/Netcraft 型スコアと NRD モデルの入力改善。判定は直接変わらない。
13. **外部フットプリント**: Google Search Console にサイトマップ送信（TXT 検証済み）、Bing Webmaster Tools 登録（SmartScreen 側の唯一の窓口）、Wayback「Save Page Now」1回（現在0件）、urlscan.io の公開スキャン1回（現在0件）、Google ビジネスプロフィール作成。効果: 今後のヒューリスティック判定に履歴を与える。
14. **旧ホストの切断**: GMO/お名前.com に 150.95.255.38 上の旧 vhost（今も kamehame-japan.com に 301 を返す）の削除を依頼。効果: VT で alphaMountain/Webroot が悪性評価する共有IPとの最後の結び付きを消す。
15. **防御的ドメイン（任意）**: kamehamejapan.com、kamehame-japan.jp/.net/.org（すべて未登録）を取得し apex へ 301。効果: 将来の第三者による類似ドメインの再汚染防止。現判定には無関係。
16. **メール運用**: Stripe リンクは名前付きの Google Workspace 受信箱から、社名・住所・法的表示 URL 入りの署名で、リンク文字列＝表示URL（短縮URL不可）で送る。問い合わせ自動返信は簡素に。効果: 受信側ゲートウェイでの誤判定とそこからの再流入を減らす。
17. **監視**: Google Postmaster Tools、Resend ダッシュボード、DMARC レポート、週1の SSLTrust/VT と `urlscan.io/api/v1/search/?q=domain:kamehame-japan.com`、「kamehame japan」の Google アラート。

---

## 5. お客様に言ってよいこと／言ってはいけないこと

**言ってよいこと（検証済みの事実）**
- 運営は株式会社プロセント（Prosent Inc.、東京、法人番号 7010001232139）で、会社情報は https://kamehame-japan.com/en/legal/ に特定商取引法に基づき掲載している。
- サイトにはログインやアカウントがなく、フォームは氏名・メール・日程・本文などの問い合わせ用のみ。カード情報をサイトで入力することも、メールで尋ねることもない。
- 支払いは問い合わせ後にメールで送る Stripe の決済ページ（book.stripe.com）だけで行う。
- Google Safe Browsing、Norton Safe Web、Sucuri SiteCheck（現在）、Yandex はクリーン。PhishTank/OpenPhish/URLhaus 等のフィッシングリストに掲載なし。Quad9 や Cloudflare のセキュリティDNS もブロックしていない。
- 一部の企業・ホテル・学校のネットワークフィルタや一部のセキュリティ製品が、2026年8月登録の新しいドメインを誤分類して警告を出すことがある。各社に再審査を申請中で、通常は数日〜2週間程度で見直される。
- 10月8日にページの記述上の不具合（ビルド出力の構造エラー）を修正済みで、現在のスキャンはクリーン。

**言ってはいけないこと（未検証・誤り・約束できない）**
- 「一度もフラグされたことがない」「すべてのスキャナーでクリーン」「安全認証済み」（Trend Micro(http)、ScamAdviser 0/100、CRDF、VT 5/93 は現時点で赤。Sucuri も10/8まで html_anomaly を出していた）。
- 「マルウェアは検出されなかったとベンダーが確認した」（Sophos の Mal/HTMLGen-A はレピュテーション判定であり、ベンダーは理由を公表していない）。
- 「○日までに消える」「48時間/96時間で解決」などの日付（各社の数値は目安で、Fortinet と alphaMountain は SLA なし。VT/SSLTrust は再解析まで表示が変わらない）。
- 「企業ユーザーしか見ない」「一般のお客様には警告は出ない」（Webroot SecureAnywhere、Sophos Home、Trend Micro 製品は家庭用。一般ブラウザは出さない、とだけ言う）。
- 原因の断定: 「HTML の不具合が原因だった」「Cloudflare の共有IPのせい」「Kamehameha と似ているから」「ベンダー同士がコピーした」「当社のメールがフィッシング扱いされた」「誰かが当社ドメインを偽装した」（いずれも仮説か反証済み）。
- 「サイトのフォームは問い合わせフォームだけ」（レビュー・業者・パートナーフォームがある）。
- ELNX TRAVEL の旅行サービス手配業登録（第20922号）を独立に確認済みの事実として引用すること（「法的表示に記載のとおり」とのみ）。
- 「Spamhaus/URIBL はクリーン」「Microsoft SmartScreen はクリーン」（未確認）。
- IPQS が「通報を受けた」などの詳細（ScamAdviser 経由の ML 判定のみで、人の通報ではない）。
- お客様に自身で VirusTotal や SSLTrust を回すよう勧めること（再提出になる）。

---

## 6. 確認できなかったこと

- **Fortinet**: FortiGuard 上の実際のカテゴリ（GET ルックアップは全クエリで 403、POST は captcha 必須）。VT の「phishing site」＝FortiGuard「Phishing」は推定。VT ドメイン単位の「Fortinet: Clean」画面との食い違いの理由。送信後の確認画面の有無。Cyber Threat Alliance 創設メンバーの件は Partners 表示のみ。
- **Sophos**: Intelix の実判定（hCaptcha、突破しない）。Submit-a-sample Web フォームの実項目（Salesforce Lightning が描画不能、外部リーダーも同様）と KBA-000002950 の原文。コミュニティスレッド 151884 の引用（他スレッド 151762/151746 で同趣旨を確認）。
- **Webroot/BrightCloud**: 数値 Web Reputation スコアと影響要因一覧（reCAPTCHA Enterprise）。確認メールが実際に届くか。非顧客向け Webroot サポートチケットの受理可否。A10/Cradlepoint/Aruba 現行版の BrightCloud 利用状況（古い資料のみ）。
- **Forcepoint**: csi.forcepoint.com（この環境から到達不能。Hub の Site Lookup が後継）。ゲストの1日あたり上限（セッション単位であることのみ確認）。Hub 自己登録（/s/login/SelfRegister）の非顧客受理可否。Email Security が「Phishing and Other Frauds」リンクをどう扱うかの公式記述。「More Details」（ACE Insight）画面の動作。
- **alphaMountain**: threatYeti の実スコア・カテゴリと要因（Pro 限定）。ログイン後のチケットフォームの実レイアウト（旧ウィジェットと同一と推定）。Chrome 拡張「a9 Web Protection」の現行ストア掲載。
- **共通**: 10/5 時点で陽性だった3社の内訳（VT はエンジン別履歴を保持しない）。各社が最初に判定した日時と理由（非公開）。Spamhaus DBL・URIBL の掲載状況（公開リゾルバ拒否コード、認証DNSにも到達不可。SURBL のみ不掲載を確認）。MXToolbox（API キー要）、abuse.ch URLhaus/ThreatFox API（Auth-Key 要）、Cloudflare Radar、Cisco Talos、Microsoft SmartScreen、IPQS 自社ページ（無料上限）、Scamdoc、crt.sh（0件＝遅延。Cert Spotter と実証明書では 2026-09-15 の Let's Encrypt と 09-21 の Sectigo を確認）、Common Crawl。
- **サイト**: ELNX TRAVEL（第20922号）の登録実在（東京都の登録簿は未照会）。Trend Micro が http のみ「Dangerous」とした理由と、分類時点で http が返していた内容。EEA ロケールでの同意後に Meta Pixel / Clarity が読み込まれるか（en-US では未読み込み）。/api/contact と /partners/ の POST 挙動（送信禁止のため）。
