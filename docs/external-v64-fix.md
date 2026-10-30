# Google・Wikipediaのv6.4接続修正（2026-10-19）

## 公開APIを調査した結果

管理画面ではなく、safe-trends／safe-youtubeの公開GETを確認した。
調査時点のsafe-trendsはcount=277、sourceCounts.google=237、sourceCounts.wikipedia=40、stale=false、googleStale=false。
safe-youtubeはcount=28。公開件数は管理画面の取得数や公開候補数と同じとは限らない。

- Google更新：2026-10-19T05:00:39.816Z。
- Wikipedia更新：2026-10-19T05:19:53.806Z、集計対象dataDate=2026-10-15。
- YouTube更新：2026-10-19T00:00:40.159Z。

公開データは存在するため、Workerは変更していない。

## 原因と修正

1. Googleの公開項目には個別urlがない。アプリがurlを必須としていたため除外していた。
   Googleの出典には固定の公開Google Trendsページを使う。存在しない記事URLは作らない。
2. WikipediaはurlではなくsourceUrlを使う。両形式を検証の上で受け付ける。
3. 大カテゴリーは分かるが中カテゴリーがnullの話題が多数ある。
   Google・Wikipediaではnullのまま保持する。タイトル・明示的関連語の一致には使えるが、中カテゴリーを推測せず、
   大カテゴリーだけを根拠に会話へ採用しない。YouTubeの既存の中カテゴリー検証は維持する。
4. Wikipediaの7件は旧PERSON_5であり、アプリの選択肢からは廃止されていた。
   既存の互換ID PERSON_LEGACY_FAMOUSへ決定的に対応させ、本人の職業・人物種別は推測しない。
5. 現行コードには「フィード先頭200件」「キャッシュ先頭400件」の切り捨てがあった。
   Googleの後に並んだWikipediaが消える。検証・重複除去後に情報源ごと500件を保持する方式へ変更。
   安全性のための検査項目上限も情報源別とし、長いGoogleの前方配列がWikipediaを押し出さないようにした。
6. 従来の今すぐ再取得は端末だけを迂回し、アプリサーバーの日次キャッシュを再利用していた。
   refresh=1で両方を迂回する。上流の固定公開APIをGETするだけで、収集Cron・管理APIは呼ばない。
7. 旧キャッシュはschemaVersion=2への一度だけのバックグラウンド移行対象とした。
   新形式の正常キャッシュは日次再利用する。旧キャッシュがあっても部屋や会話の表示を通信待ちにしない。

正しい情報源ID google_trending_now／wikipedia_pageviews／youtubeを明示的に受け付ける。
relatedToは安全なrelatedTermsとして保持し、明示的に同じ語であるものだけを照合する。
dataDateは取得・フィード更新時刻とは別に保存し、古い集計対象日を「今日起きたこと」として扱わない。
フィード更新自体が古い、stale指定、URL・分類が不正などの安全性検証は維持する。

## キャッシュ・保存・モニター

取得成功時だけ端末キャッシュを更新。HTTP・通信・全情報源失敗時は正常な端末・サーバーキャッシュを保持する。
一方だけ失敗したときも、有効な範囲の既存ソースを保持し、失敗状態をモニターへ伝える。
正常な公開0件は失敗と区別し、0件として更新する。期限切れデータは会話へ復活させない。
辞書、日誌、会話履歴、仮面経験値、友好度、起動表示フラグは移行・再取得から変更しない。

DEV→外部話題に、情報源ごとの公開・受信・変換・保存・候補数、最終成功、最終エラー、除外理由を追加した。
公開0件／通信失敗／旧形式・期限切れキャッシュ／変換全件除外を区別する。
現在のユーザー辞書に根拠がなければ、保存件数が多くても会話候補は0件になる。

## 追加・変更ファイル

- app/api/external-topics/route.ts：明示再取得のクエリーを認識。
- lib/infoHubServer.ts：サーバーキャッシュ迂回、成功・失敗情報と正常キャッシュ保持。
- lib/externalTopics.ts：v6.4公開形式、固定ID互換、情報源別の上限、関連語・集計対象日、除外理由。
- lib/externalInfoClient.ts：旧0件キャッシュの移行、両キャッシュ迂回、最終試行診断。
- lib/externalTopicMonitor.ts：情報源別の段階別件数と原因の投影。
- components/ExternalTopicMonitor.tsx：診断表示、集計対象日・関連語表示。
- components/SuuhimochiGame.tsx：旧キャッシュを即時に使い、移行取得を表示待ちにしない。
- app/globals.css：情報源別表示のスタイル。
- scripts/test-external-v64.mjs（追加）：大量Google＋Wikipedia、互換形式、旧キャッシュ、再取得・保存の検証。
- scripts/verify-external-public.mjs（追加）：実公開API→アプリ変換/API→独立した検証キャッシュの監査。
- scripts/test-external-monitor.mjs／test-external-monitor-browser.mjs／test-startup-browser.mjs：再取得URL・新形式キャッシュ、旧形式起動回帰。
- package.json：新規検証コマンド。
- docs/external-topic-monitor.md／external-v64-fix.md：仕様・調査結果。

startupExperience.tsの一度だけの機会判定、Day1の興味取得、SELF6＋LEARN6、日誌・報酬・卒業処理は変更していない。

## 検証方法

npm run test:external-v64、test:external-topics、test:external-monitor、test:startup、test:conversation。
型チェックはnpx tsc --noEmit、対象lintはoxlint。WindowsのビルドはUV_THREADPOOL_SIZE=1で実行する。
開発UIはtest:external-monitor:browser、本番起動はtest:startup:browserで検証する。
verify:external-publicは実公開APIを読み、SUUHIMOCHI_TEST_URLを指定すると生成済みアプリAPIも経由する。
検証用辞書の候補数は利用者本人の辞書の候補数ではない。自動学習させず、純粋な照合入力として使う。

## 最終確認結果（2026-10-19 14:40 JST）

生成済み本番サーバーの /api/external-topics?refresh=1 → 実公開API → アプリ変換 → 独立した検証キャッシュを通した。
safe-trendsはcount=277、stale=false、Google237／Wikipedia40。safe-youtubeは28。

| 情報源 | 公開 | 受信 | 変換 | 保存 | 検証用既知語での候補 |
| --- | ---: | ---: | ---: | ---: | ---: |
| Google | 237 | 237 | 237 | 237 | 1 |
| Wikipedia | 40 | 40 | 40 | 40 | 1 |
| YouTube | 28 | 28 | 28 | 28 | 1 |

除外0件。WikipediaのdataDate=2026-10-15も保持した。
検証用既知語は「すとぷり」「中島歩」「12/25（金）公開『巨頭ｵ』予告編」。辞書へ学習登録はせず、照合用配列で使用。
空辞書の場合の候補は全情報源0件。利用中の本人の辞書・候補数は読み取ったり書き換えたりしていない。
検証キャッシュ以外のゲーム保存用値は取得前後で全文一致した。

型チェック・対象lint・本番ビルド成功。v6.4新規10件、既存会話181件、外部連携13件、モニター11件、起動・記帳14件、周辺10スクリプト成功。
PC・スマートフォン相当のモニター操作が成功。本番起動8フロー（旧形式キャッシュ移行中の起動を含む）も成功し、未処理ブラウザ例外0件。
WindowsビルドはUV_THREADPOOL_SIZE=1で成功。一部依存リンクの既存EPERM警告は残る。

更新したアプリでDEV→外部話題→今すぐ再取得を行えば、両方のアプリキャッシュを迂回して再確認できる。
辞書・日誌などを含むデータ初期化は不要。既存の0件キャッシュはバックグラウンド移行でも更新対象になる。
