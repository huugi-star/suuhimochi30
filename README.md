# すうひもちと僕の30日

「知らないもちが、自分の端末に住み始めた」最初の5分を試すための、React + Vite製玩具プロトタイプです。

## 起動方法

1. `npm install`
2. `npm run dev`

表示された `http://localhost:3000` をブラウザで開いてください。

Windowsでは `start.bat` をダブルクリックしても起動できます。

進行状況はブラウザのlocalStorageだけに保存されます。画面左下の小さな「DEV」から初期化・タイプ変更・時間帯変更・独り言の確認ができます。

## ローカル会話

会話はAPI・LLMなしで動きます。名前・説明・感想・関連作品を分けて記憶し、話の途中では自動終了しません。終えるときは「今日はここまで」。同日でも何度でも再開できます。

設計の分析・変更点・限界は [会話設計の再検討](docs/conversation-redesign.md) にまとめています。

検証: `npm run test:conversation`、`npx tsc --noEmit --incremental false`、`npm run build`。

## Vercelで公開する

1. このフォルダーをGitHubリポジトリにpushします。
2. VercelでリポジトリをImportします。
3. Node.js 22以上を選び、そのままDeployします。ビルドコマンドは `npm run build` です。

Vercel上ではNitroがサーバー出力と静的アセットを自動生成するため、追加の環境変数やリダイレクト設定は不要です。進行状況は引き続き各ブラウザのlocalStorageにだけ保存されるため、公開後も端末・ブラウザごとに別のデータとして扱われます。
