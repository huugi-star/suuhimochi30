# すうひもち30 × 共有知識 v6.8.8

## 実装とプライバシー境界

初期OFF。部屋が通常操作できる状態になってから、非モーダルの参加説明を一度選択する。断っても通常会話・コンボ等に影響しない。選択は`suuhimochi-shared-knowledge-consent-v1`へ保存し、30日リセットとは独立する。設定→「共有知識を利用する」で即時変更可能。OFFにすると進行中の取得を中止し、以降の共有API呼び出し・候補選出を停止する。

ONのときだけアプリAPI経由で公開共有辞書を200件ずつ全ページ取得する。`nextOffset`の進行・上限を確認し、全ページ完了時だけ正常キャッシュを置き換える。原則24時間ごとに更新し、失敗時は前回正常キャッシュを使う。キャッシュがなければ共有機能だけ停止する。失敗の再試行には5分間隔を設ける。

単語辞書は端末に残す。共有可否の肯定的な証拠は、WorkerがWikipediaの説明文で検証した共有辞書との**文字列完全一致だけ**。部分一致・別名・NFKC・大小文字の曖昧一致を使わず、本人申告カテゴリーは許可の証拠にしない。加えて家族/友人/大切な人/学校職場の人、プロフィール名・呼び名は私的な名前として拒否する。このカテゴリー判定は共有を許可するためではなく、追加の拒否条件である。

日誌、会話ログ、回答、嗜好、ユーザー名、プロフィール、WordEntry全体、個体IDを送る処理はない。辞書外の語も送らない。照合できた**公開辞書の語だけ**を`/shared-dialogues?keyword=...`のGETへ渡す。1回のバックグラウンド更新では最大5語。自由入力の収集や`/keywords/submit`、AI生成APIは使わない。

アプリAPI側でも、ブラウザーから与えられた許可リストやカテゴリーを信用せず、固定Worker URLから独自に共有辞書を取得して再確認する。未知語はWorkerへ転送しない。本文・クッキー・認証情報は転送しない。タイムアウト、応答サイズ制限、URL/形式検証を備える。共有APIには同意を示す専用ヘッダーを要求するが、それ自体は認証・共有可否の証拠ではない。

共有辞書とセリフは信頼しきらず、禁止話題・個人情報らしい文字列・HTML・指示文を拒否する。これらの文字列フィルターに完全性の保証はなく、未知の隠語や人名の文脈は完全には判定できない。基本の安全性は、Worker側のWikipedia抜粋検証・公開時の再検査との多層構成で確保する。Workerの既存フィルターは変更していない。

## 会話と既存体験の保護

取得された`dialogue`は空白・改行まで原文保存。`style`は実スキーマどおり0〜5、`thoughtStyle`も保持する。要約・書き換え・付け足しは行わない。既存の名前置換と、句読点での無改変ページ分割だけを利用する。

既存の自発ズーム会話の起動/更新機会、および既存の通常会話・コンボ後の外部発見を選ぶ境界で、利用可能な共有知識→外部トレンドの順に選ぶ。SELF/LEARN台本・想起会話自体は置き換えず、通常12枠と既存の報酬経路は維持する。Day1の出会い・興味取得・コンボ導線中や、操作/モーダル/睡眠/卒業時には割り込まない。

表示しても新しいWordEntry・意味・仮面経験値・友好度を作らない。共有会話の表示/スキップ/終了と出典だけを個体の`sharedKnowledgeHistory`へ保存する。通常会話の後に出る場合は、元の台本の返答と既存の一度だけの完了報酬を保持する。同じセリフは個体内で再利用しない。同じ語は24時間、共有会話全体は30分の間隔を設ける。出現頻度は`SHARED_MIN_INTERVAL_MS`、`SHARED_WORD_INTERVAL_MS`、取得上限は`SHARED_REQUEST_LIMIT`で調整可能。

Wikipedia出典は共有会話の間にクリック可能なリンクとして表示する。`target=_blank`、`rel=noopener noreferrer`、`referrerPolicy=no-referrer`を付ける。リンクのクリックはスキップとして消費しない。出典URLはHTTPSのWikipedia記事URLに限定する。

30日アーカイブへ共有履歴も保存し、次の個体の履歴は空にする。端末同意は維持する。共有語や共有セリフを取得しただけでは、個体の単語辞書や他人の記憶を増やさない。

添付の`lib/externalBriefs.ts`をアプリへ取り込み、既存型・公開関数・`aiDialogueVersion=2`を維持した。共有セリフにはその`plain`整形関数を使わず、原文を維持する。Workerの`/safe-briefs`、Google/Wikipedia/YouTube取得、Gemma自動/手動生成には手を加えていない。

## 変更ファイル

- `lib/sharedKnowledge.ts`：同意・検証・完全一致候補・無改変セリフ・個体履歴・頻度定数。
- `lib/sharedKnowledgeClient.ts`：同意ゲート、ページ送り、正常キャッシュ維持、取消・タイムアウト。
- `lib/sharedKnowledgeServer.ts`：固定公開APIとサーバー側許可辞書の再確認。
- `app/api/shared-knowledge/dictionary/route.ts`、`app/api/shared-knowledge/dialogues/route.ts`：読み取り専用のアプリAPI。
- `lib/externalBriefs.ts`：添付ブリッジの互換取り込み。
- `components/SharedKnowledgeSettings.tsx`、同`.module.css`：初回説明と設定ON/OFF。
- `components/SuuhimochiGame.tsx`：キャッシュ接続、候補の優先、出典・既存ズームUI。
- `lib/wordMemory.ts`、`lib/graduation.ts`、`lib/storage.ts`：共有履歴と個体アーカイブの互換拡張。
- `scripts/test-shared-knowledge.mjs`、`scripts/test-shared-knowledge-browser.mjs`、`package.json`：検証。
- 本書。

Worker添付フォルダーへの追加は、`wrangler.example.jsonc`、`db/preflight-readonly.sql`、`tests/test-deployment-safety.mjs`のみ。Worker本体と`db/schema.sql`は変更していない。

## Cloudflare：本番反映前に人間さんが確認する項目

**この実装作業では本番デプロイ、リモートD1へのSQL実行、D1削除、Cron手動実行はしていない。**

2026-10-21の公開API実測：`/shared-status`は`NOT_CONFIGURED / requiredBinding=KNOWLEDGE_DB / autoEnabled=false`。共有辞書・セリフも`NOT_CONFIGURED`。`/safe-briefs`は正常な公開データを返している。したがって、現状の実サービスで共有セリフを利用できない原因は、アプリではなくD1バインディング未設定である。未設定時も従来の会話は利用できる。

1. Cloudflareで既存Worker名・アカウント・KV/D1の実際のリソースID、現在のコードとCronを確認する。添付の`wrangler.example.jsonc`は例であり、実IDを含まない。勝手に新規D1を作らない。
2. 既存D1がある場合、**全DBをバックアップし、ファイル内容と復元可能性を確認する**。例：`npx wrangler d1 export <実際のDB名> --remote --output <バックアップ先.sql>`。これは未実行の手順例。
3. バックアップ確認後、`db/preflight-readonly.sql`を読み取り専用で実行し、削除される語の全一覧と、関連セリフ/ジョブ件数を確認する。既存テーブルがない新規DBでは、まずスキーマの有無を確認する。
4. 実際の削除条件は`shared_keywords WHERE origin!='wikipedia' OR approved!=1`。その語に属する`shared_dialogues`、`shared_jobs`も最初の収集Cronで削除される。スキーマを導入しただけではなく、**本番コードを有効化する前に**削除範囲への了承が必要。
5. 新規D1の場合だけ、同梱`db/schema.sql`の作成処理を確認して適用する。既存v6.8.7スキーマへは不要。共有テーブル以外を移行しない。
6. KV=`DISCOVERIES`、Workers AI=`AI`、D1=`KNOWLEDGE_DB`を既存の正しいリソースへ紐付ける。`ADMIN_PASSWORD`、`YOUTUBE_API_KEY`は既存Secretを維持し、ソースやアプリへ書き出さない。
7. 確認・了承後にのみ`worker-v6.8.8.js`を既存Workerへ反映する。Cronは`0 * * * *`と`*/5 * * * *`。5分Cronの毎時5分に辞書収集、それ以外で生成する。
8. 共有7,800＋手動200 Neurons/日はWorker内の概算予算。アカウント全体の実消費・課金上限ではないためDashboardでも確認する。予算不足/プロバイダーエラー時の予約解放・課金見積計上・停止は既存Workerのまま維持。
9. 公開`/shared-dictionary`が`OK`になった後、その辞書の語だけで`/shared-dialogues`を確認する。既存の`/safe-briefs`と3情報源の公開も確認する。共有語がまだ0件・生成未完了なら通常会話へフォールバックする。

今回のGET方式は旧`POST /keywords/submit`を使わないため、新しくTurnstileを要求しない。未知語の収集、検索順位変更、人手による単語承認を追加していない。

Worker本体SHA256：`8BFE689ECB531A0F9BA32B213D9F6D85852C645937DBAEC84D23B096AAE6344F`。

## テスト方法

- `npm run test:shared-knowledge`：初期OFF/拒否/取消、全ページ・完全一致、一般人名/プロフィール/悪意ある入力、無改変6スタイル、障害・正常キャッシュ、サーバー再検証、履歴・30日リセット、safe-briefs互換。
- `npm run test:shared-knowledge:browser`：独立した保存領域で初期OFF→拒否→設定ON→取得→再起動→出典→スキップ→再起動重複防止→OFF、PC/横向きスマートフォン幅。公開データは固定モックで再現し、実個人データや本番D1は使わない。
- アプリの既存会話・起動・外部連携・コンボ・日誌・軍師/六占等のテストと、TypeScript型チェック、本番ビルド。
- Workerは`node --check worker-v6.8.8.js`。同梱ブリッジを`.test-output`へコンパイルした後、`node --test tests/*.mjs`。D1はインメモリーSQLiteだけを使う。
- 新規Worker安全テストは、事前SQLが読み取り専用であること、旧語の削除範囲、7,800での推論停止、API quotaエラー時の停止/即時再試行防止を確認する。

実サービスのD1設定・本番Cron・Gemma実推論・本番バックアップと削除確認は未実施。これらは上記手順と設定確認が完了するまで行わない。

### 2026-10-21 検証結果

- TypeScript型チェック、新規モジュール/テストのlint、本番ビルド成功。
- アプリ：新規共有17件＋既存会話181件・起動14件・外部13件・自発会話16件・モニター11件・v6.4取り込み10件＝262件成功。
- 画像、ガチャ、POTENO、軍師・六占関連の既存10スクリプト成功。
- Worker：既存15ファイル＋追加の導入安全テスト1ファイル＝16件成功。共有D1・予算・削除テストはすべてインメモリーSQLiteで実行し、リモートのデータは変更していない。
- ブラウザ：共有5フロー、既存起動12フロー、外部モニターPC/スマートフォン幅2ケースが成功。ブラウザの未処理例外なし。実機スマートフォンではなくChromeのモバイル相当表示を利用。
- 出典ポップアップはDOMの`window.opener === null`を検証。Playwright内部のopener追跡オブジェクトと比較すると巨大なオブジェクトの検査が発生するため、そのテスト表現を修正した。アプリ側のセリフ生成やメモリ使用を変更したものではない。
- 既存の大きなGame UI全体にあるlint指摘やWindows Nitroの依存リンク警告の一括修正は今回の範囲外。新規コードのlintと必須の型/ビルド/テストは成功している。
