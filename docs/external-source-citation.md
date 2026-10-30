# 外部情報ひとり言の元ネタ表示

起動時のズーム会話と更新時のひとり言の、既存吹き出し下部に小さな出典を表示する。通常・SELF・LEARN会話には表示しない。

## 表示・安全性

- Wikipedia・YouTube：選ばれた既存話題の情報源・タイトル・URLを利用。受信済みの個別記事URLがあれば一覧URLより優先する。
- Googleトレンド：v6.8.29の受信sourceUrlを優先して「最近の話題をGoogleで検索」を表示。X検索・記事URLは受信時だけ別リンクを追加する。旧一覧URLは公開タイトルによる最近の検索へ移行する。詳細は `google-trend-search-links.md` を参照。
- 共有知識：許可済み共有セリフのキーワードとWikipediaの出典URLを利用。既存のライセンス・出典表記も維持する。
- 天気：既存予報の都道府県・代表区域をタイトルに含め、情報源「気象庁」と公式URLを利用する。
- 長いタイトルは1行の省略表示。URLなし・不正URLは情報源名のみ。
- HTTPS・資格情報なしのURLに限定。HTMLとして解釈せずReactのテキストとして表示する。
- 別タブ・`noopener noreferrer`・`no-referrer`。リンクを吹き出しボタンの内側に入れず、タップ・クリックによる会話送り、起動会話のスキップ、部屋の移動を防ぐ。

表示用メタデータだけを会話候補へ追加し、会話の本文・選択・取得・保存・報酬処理は変更しない。出典表示の状態は端末の一時UI状態で、通常会話開始・外部会話終了時に消去する。Workerは変更しない。

## 変更ファイル

- `lib/externalSourceCitation.ts`：情報源名・安全なURL・Google一覧判定。
- `lib/externalMonologues.ts`：選ばれた既存データに出典を添付。
- `components/ExternalSourceCaption.tsx`・`.module.css`：既存吹き出しの出典表示と省略表示。
- `components/SuuhimochiGame.tsx`：外部ひとり言だけへの表示・終了時の消去・リンク操作の分離。
- `scripts/test-external-source-citation.mjs`：情報源、URL、安全性、Google一覧、HTMLエスケープ、通常会話の非表示、個別記事優先の検証。
- `scripts/test-external-monologues-browser.mjs`：5情報源、別タブ、開いた前後の保存データ不変、会話が進まないこと、長いタイトル、PC・スマートフォンの検証。
- `package.json`：単体テストコマンド `test:external-source-citation`。

## 検証方法

`npm run test:external-source-citation`、`npm run test:external-monologues:browser`、既存の会話・外部情報・起動・共有知識・天気の回帰テスト、`npx tsc --noEmit`、対象モジュールのlint、`npm run build`を使用する。ブラウザテストでは隔離したテスト用保存データと元ネタページのスタブを使い、ユーザーの実際の保存データは変更しない。

2026-10-22確認結果：新規単体6件・既存回帰293件・ブラウザ9フローが成功。5情報源のリンク、Google一覧と個別記事、長いタイトルの省略、通常会話での非表示、別タブのopener無効化、リンク操作前後の保存データ・会話状態不変を確認した。PC・横画面スマートフォンのスクリーンショットでも吹き出し下部の配置を確認。実際の公開APIを使用したDay16の起動ズーム・スキップも成功（選択情報源：YouTube）。型チェック・対象モジュールlint・本番ビルドも成功した。ビルド時には既存のNitro任意依存モジュールのトレース警告が出るが、終了コードは0。
