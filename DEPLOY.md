# kamehame-japan.com リリース手順

構成: お名前.com(ドメイン取得)+ Cloudflare(DNS / Workers ホスティング)。
このリポジトリは `@cloudflare/vite-plugin` を使っており、ビルドすると
`dist/server/wrangler.json`(デプロイ設定)が自動生成されるため、
デプロイは `npx wrangler deploy` 一発で完了する。

## 0. 前提

- Node.js 22.13 以上 / Git が入ったPC
- クレジットカード(お名前.comの支払い用。Cloudflareは無料プランでOK)

## 1. お名前.com でドメイン取得

1. https://www.onamae.com/ で `kamehame-japan.com` を検索し、カートに入れる
2. 申込画面の注意点:
   - **「Whois情報公開代行」に必ずチェック**(取得と同時なら無料。後付けは有料)
   - レンタルサーバー等の**同時申込オプションはすべて外す**(ホスティングはCloudflareを使う)
   - 登録年数は1年でOK。**自動更新の設定を確認**(切らすとサイトが落ちる)
3. アカウント作成 → 支払い → 取得完了
4. **重要**: 取得後に届く「メールアドレス有効性認証」メールのURLを必ずクリックする
   (放置するとドメインが利用制限される)
5. 広告メールが多いので、お名前.com Naviの「メール配信設定」で不要な通知をオフにしてよい

## 2. Cloudflare にサイト(ゾーン)を追加

1. https://dash.cloudflare.com/sign-up でアカウント作成(無料)
2. ダッシュボード →「+ サイトを追加(既存のドメインを接続)」→ `kamehame-japan.com` を入力
3. プランは **Free** を選択
4. DNSレコードのスキャン画面 → 既存レコードは無いので、そのまま「続行」でOK
5. 画面に **Cloudflareのネームサーバーが2つ**表示される
   (例: `xxx.ns.cloudflare.com` / `yyy.ns.cloudflare.com`)→ 控える

## 3. お名前.com 側でネームサーバーを変更

1. お名前.com Navi にログイン →「ネームサーバーの変更」(ドメイン設定内)
2. `kamehame-japan.com` を選択
3. **「他のネームサーバーを利用」**タブを選び、
   ネームサーバー1・2に手順2で控えたCloudflareの2つを入力 → 確認 → 設定
4. 反映を待つ(通常10分〜1時間、最大72時間)。
   Cloudflareダッシュボードのサイトが「**アクティブ**」表示になれば完了
   (Cloudflareから "Your site is now active" メールも届く)

## 4. Workers へデプロイ

作業PCのターミナルで:

```bash
# 初回のみ
git clone https://github.com/Yukihiro715/Kamehame-Japan.git
cd Kamehame-Japan
git checkout <リリースするブランチ>   # 例: main にマージ済みなら main
npm ci

# Cloudflareアカウントと連携(ブラウザが開くので許可する。初回のみ)
npx wrangler login

# ビルドしてデプロイ
npm run deploy
```

- 初回は `workers.dev` のサブドメイン名の登録を求められることがある → 任意の名前でOK
- 完了すると `https://kamehame-japan.<アカウント名>.workers.dev` が表示される
  → まずこのURLで全ページの表示を確認する

## 5. カスタムドメインを割り当て

1. Cloudflareダッシュボード → **Workers & Pages** → `kamehame-japan`
2. **Settings → Domains & Routes → + Add → Custom Domain**
3. `kamehame-japan.com` を入力して追加(DNSレコードとSSL証明書は自動設定)
4. 同じ手順で `www.kamehame-japan.com` も追加(www でもアクセス可能にする)
5. 数分待って https://kamehame-japan.com が開けばリリース完了

## 6. リリース後の確認チェックリスト

- [ ] トップ / 一覧(/en/tokyo/ 等)/ 体験詳細 / /partners/ が表示される
- [ ] 存在しないURLで404になる
- [ ] スマートフォンで表示崩れがない(予約バーの固定表示含む)
- [ ] https でアクセスでき、鍵マークが出る

## 7. 以後の更新フロー(自動デプロイ)

GitHub Actions による自動デプロイを設定済み(`.github/workflows/deploy.yml`)。
**main ブランチにコードが入ると、自動でビルドして Cloudflare Workers に公開される。**

初回セットアップ(1回だけ):
1. Cloudflare ダッシュボード右上のプロフィール →「マイ プロフィール」→「APIトークン」
2. 「トークンを作成する」→ テンプレート「**Cloudflare Workers を編集する**」を使用 → アカウントを選択 → 続行 → トークンを作成 → 表示された文字列をコピー(この画面でしか見られない)
3. GitHub のリポジトリページ → **Settings → Secrets and variables → Actions → New repository secret**
4. Name: `CLOUDFLARE_API_TOKEN` / Secret: コピーしたトークン → Add secret

以後の更新は main へのプッシュだけで公開まで自動。手動で動かしたいときは
GitHub の Actions タブ →「Deploy to Cloudflare Workers」→ Run workflow。

## 8. 手動デプロイ(予備)

```bash
git pull
npm ci        # package.json が変わったときのみ
npm run deploy
```

## 9. 未接続のまま公開している項目(順次対応)

- Bókun 予約ウィジェット(予約ボックスは「開設準備中」表示)
- パートナーフォームの送信先(現在は準備中表記)
- GA4 / 広告CV計測タグ
- OGP画像・robots.txt・sitemap.xml
- FR / ES / 繁体字中国語ページ

## 費用の目安

- ドメイン: .com の一般的な相場(初年度は割引が多い、更新は年1,500〜2,000円程度)
- Cloudflare: Freeプラン ¥0(Workers無料枠は10万リクエスト/日で当面十分)
