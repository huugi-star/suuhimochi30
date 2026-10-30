# 外部情報503と候補があっても発話できない不具合

## 実測（2026-10-25、日本時間）

公開APIを実際に取得し、アプリのプロキシでも確認した。情報センターWorkerは変更していない。

| API | 確認結果 |
| --- | --- |
| `/safe-trends` | 19:13頃の直接取得はHTTP 200、542件（Google 270・Wikipedia 272）、stale=false。19:15のアプリ取得は上流HTTP 503。19:21:45のアプリ取得でCloudflare 1102、Ray `a5007ef94babb554` を確認。 |
| `/safe-youtube` | HTTP 200、53件、stale=false。アプリの変換後も53件。 |
| `/safe-briefs` | 19:13:30、HTTP 503、Cloudflare 1102、Ray `a50072f17e138340`。応答は `Worker exceeded resource limits`、`worker_exceeded_resources`、`retryable=false`、`owner_action_required=true`。 |

Google・Wikipediaは同じ `/safe-trends` を使うため、同じ障害を2つの情報源の欄に表示する。今回確認できた503は、GoogleやWikipediaの取得先そのもののHTTP 503ではなく、公開APIを提供するCloudflare WorkerのCPU時間またはメモリ上限による終了である。直接取得が成功する場合もあり、恒常的な公開0件とは区別する。

`/api/external-topics` は一部成功時にHTTP 200で正常なYouTubeと失敗診断を返す。最後の確認ではコールド起動したアプリサーバーに過去のtrendsキャッシュがなく、受信はGoogle 0・Wikipedia 0・YouTube 53だった。端末側に有効なGoogle/Wikipediaの正常キャッシュがあれば、これを今回の部分成功で消さずに維持する。存在しないデータは作らない。

## アプリ側で再現した別の原因

取得・変換・照合に成功しても、最後のセリフ重複チェックで停止していた。

長いタイトルを一律「まだ知らない名前」に置き換える説明会話があり、1情報源で実質4種類のセリフしかできなかった。`/safe-briefs` の完成セリフが使えないと、この説明会話に集中する。

実際に取得したYouTube 53件のうち52件が長いタイトルだった。修正前は5回の選択後、48件の候補が残っているのに最終選択がnullになる状態を再現した。話題IDが異なっても、セリフ本文が同じため24時間の重複防止に該当するのが原因だった。

修正では、受信したタイトルの先頭18文字以内をそのまま引用し、長い場合は「…」を付ける。動画の内容や新しい事実は作らず、長いタイトル全文も読み上げない。Gemmaの有効な完成セリフがあれば、引き続き原文を優先する。同じ話題・同じセリフの重複制限は維持する。

## 保持と再試行

- 正常キャッシュは通信失敗で破棄しない。サーバーがコールド起動し、片方の情報源しか返せない場合も端末の有効な別情報源を維持する。
- 成功した公開0件・公開停止は反映する。期限切れキャッシュを新しい情報として会話に復活させない。
- 通常の通信失敗は5分、Cloudflare 1102は1時間待機する。サーバーで情報源ごとに制御し、完成セリフは端末にも待機時刻を保存する。再読み込みや連続した手動更新で同じ失敗先へ再試行を集中させない。
- 失敗の待機時間を理由に正常キャッシュ自体の寿命を5分へ短縮しない。
- 診断にはHTTPステータス、Cloudflareコード、Ray ID、再試行可能時刻だけを保存し、応答本文や任意の例外文字列は保存・表示しない。
- 開発者モニターに `/safe-briefs` の状態、会話素材数、セリフ重複制限後の発話可能数、完成セリフ数を追加する。設定・開発者画面・他の会話・睡眠中の発話待機は維持する。

## Worker側で必要な対応（未実施）

`/safe-trends` と `/safe-briefs` のGETハンドラーについて、上記時刻・Ray IDを使いWorkers LogsとCPU時間・メモリ使用量を確認する。公開済みデータの読み出し・整形処理を上限内に収め、安定してJSONを返せるように修正する必要がある。応答だけでは、ハンドラー内の具体的な負荷箇所やCPU・メモリのどちらかまでは特定できない。

アプリ側の修正だけでは、新しいGemma完成セリフの供給を回復できない。正常な情報源と有効な既存キャッシュによる会話継続は確認した。

## 変更ファイル

- `lib/infoHubFailure.ts`：安全な上流エラー情報と待機時刻。
- `lib/infoHubBriefServer.ts`, `app/api/external-briefs/route.ts`：完成セリフのプロキシ診断と再試行抑制。
- `lib/infoHubServer.ts`：情報源ごとの再試行抑制と正常キャッシュの維持。
- `lib/externalInfoClient.ts`：部分成功時の端末キャッシュ維持、自動取得の待機。
- `lib/externalBriefClient.ts`：完成セリフの正常キャッシュと再読み込み後も続く待機。
- `lib/externalTopics.ts`：上流診断の復元、話題を区別できる短いタイトル引用。
- `lib/externalMonologues.ts`：最終の発話可能判定をモニターと共通化。
- `components/useExternalMonologues.ts`：有効なスナップショットだけを会話に使う。
- `components/ExternalTopicMonitor.tsx`, `components/SuuhimochiGame.tsx`：発話段階・完成セリフ障害の診断表示と個体IDの受け渡し。
- `scripts/test-external-degraded.mjs`, `scripts/test-external-monologues.mjs`, `scripts/test-external-topics.mjs`, `scripts/test-external-monologues-browser.mjs`, `package.json`：障害と重複の再発防止テスト。

## 確認

新規障害テスト4件、既存ひとり言17件、v6.4互換10件、外部情報・モニター・起動・自発会話・出典・デイリーミッション・既存会話181件のテスト、型チェック、対象lint、本番ビルドが成功。

既存ブラウザ検証にPCとスマートフォンの障害ケースを追加。trends/briefsの503、長いタイトルのYouTube 50件、旧汎用セリフの使用履歴がある状態から、新しい話題の枠付き表示、再読み込みで別話題を選ぶこと、1102の再取得抑制、クリック進行、元ネタリンク、保存・報酬不変を確認した。通常の5情報源・左右配置・二重クリック・通常会話除外も成功。公開APIへの再試行を増やさないため、ブラウザの外部通信は模擬応答を使い、実APIは上記の少数の取得で別途確認した。
