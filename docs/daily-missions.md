# デイリーミッションと日誌の予定

## 現行：すうひもちコイン

部屋の既存ミッションポストから開く。ミッションは円の内側の2列×3段だけに表示する。カードを押すと対象機能へ直接進む。日誌にミッション一覧は表示しない。

### 花の演出と行動への導線

見た目は木と金の額縁・木の棚板・柔らかな夜空色の専用パネルで構成し、CSSの光粒と淡い花びらを背景に置く。既存の `/assets/mochi-zoom/south.png` を見守り役として表示する。スマホ縦画面ではリングの下、低い横長画面ではリングの隣に配置し、ミッションボタンを隠さない。進捗0〜6と完成・達成一覧の表示に合わせて短い一言を変える。完成時はミッションを隠したコインと金色の光を主役にし、見守り役の横に完成見出しを表示する。動きを減らす設定では背景の明滅も止める。画像生成や重いUIライブラリは追加しない。

見た目の変更ファイル: `components/DailyMissionCoin.tsx`、`components/DailyMissionCoin.module.css`、`components/DailyMissionBoard.module.css`。キャラクター・一言・画面内配置の検証を `scripts/test-mission-coin-browser.mjs` に追加。ミッション判定と保存処理は変更していない。

各達成で約0.85秒の花を再生し、光球・円弧・刻印と同期する。1〜2個は花びら7枚、3〜4個は花びらと小花14個、5個は22個、6個は36個。コイン化時にも広い範囲へ36個の花吹雪を出す。動きを減らす設定では粒子を省略して達成表示へ進む。`celebratedMissionIds` に表示開始済みのミッションを保存し、戻るたびに同じ祝福を再生しない。未表示の達成は次回開いたときに順番に祝う。この記録操作は達成条件や報酬を変更しない。

ログインは部屋へ、今日の予定は日誌の今日の予定入力へ、結果記録は昨日の予定（なければ今日）の3択へ、明日の予定は該当入力へ、実績追加は「＋追加」の入力へ移動する。ことばは既存の学習画面へ直接進む。日誌・ことば画面から戻るとリングを再表示して今回の達成を祝う。就寝中はことば学習ボタンを理由付きで無効にする。初回の日誌閲覧で昨日を開く通常動作は、ミッション以外から開いたときに維持する。日誌の対象日は0時の暦日、ミッション集計は7時の活動日を使う。

追加・変更: `components/MissionFlowers.tsx`、`components/MissionFlowers.module.css`、`lib/missionNavigation.ts`（追加）、`DailyMissionCoin`、`DailyMissionBoard`と各CSS、`SuuhimochiGame`、`JournalPanel`、`JournalTasks`、`lib/dailyMissions.ts`。導線の実ゲーム検証は `scripts/test-mission-navigation-browser.mjs`（追加）。既存コイン・日誌テストも継続利用する。

6種類はログイン・今日の予定・結果記録・新語学習・明日の予定・予定外の完了実績。結果記録は昨日の予定全件が対象で、昨日の予定がなければ今日の予定全件を対象にする。DAY1から全6種類を達成できる。

ミッションは日本時間05:00で切り替わる。日誌の予定対象日は従来の暦日のまま。00:00〜04:59に行った操作も、その時点の日誌の今日・明日の予定を使って判定し、達成を前活動日のミッションへ保存する。

`dailyMissions[活動日].coinCompletedAt` がその日のコイン1枚の獲得記録。6種類の達成後に一度だけ設定する。`coinPresentedAt` は完成演出を最後まで表示した記録で、コイン枚数を増やす処理ではない。再起動ではコイン表示を復元する。旧4種類の達成データも保持する。

達成数順に12時位置から光球を点灯し、円弧を時計回りにつなぐ。6/6で最後の円弧、発光、COMPLETE、ミッション消失、同じ位置・大きさのコインへの変化を約3.3秒で再生する。動きを減らす設定では完成表示へ直接切り替える。完成コインを押すと達成済みミッションを確認できる。

既存のガチャ用通貨・日誌の実・交友度・仮面経験値はミッション判定では加算しない。コインは日別の獲得記録で管理し、利用・ショップ機能は追加しない。

検証：`node scripts/test-mission-coin.mjs`、`node scripts/test-daily-missions.mjs`、`node scripts/test-journal-checklist.mjs`、`node scripts/test-mission-coin-browser.mjs`、TypeScript型チェック。ブラウザ用Playwrightの場所は既存同様 `SUUHIMOCHI_BROWSER_MODULES`、Chromeは `SUUHIMOCHI_BROWSER_EXECUTABLE` で指定する。

### コイン改修の変更ファイルと検証

- UI: `components/DailyMissionCoin.tsx`、`components/DailyMissionCoin.module.css`（追加）、`components/DailyMissionBoard.tsx`、`components/DailyMissionBoard.module.css`。
- 接続・保存: `lib/dailyMissions.ts`、`components/useDailyMissions.ts`、`components/SuuhimochiGame.tsx`、`lib/storage.ts`（保存項目の説明更新）。
- テスト: `scripts/test-mission-coin.mjs`、`scripts/test-mission-coin-browser.mjs`（追加）、`scripts/test-daily-missions.mjs`、`scripts/test-journal-checklist.mjs`（承認済みの6種類・今日の結果への代替仕様に期待値を更新）。
- 本ドキュメント。

確認済み: 型チェック、既存ミッション15件、日誌チェックリスト10件、新しいコインの獲得・復元・7時境界・DAY1・早朝利用・報酬分離。実際のコンポーネントと共通CSSをブラウザで動かし、360×640、390×844、680×370、1365×900の0/6〜6/6、完成演出、達成内容の再表示、再読込、翌日のリセット、動きを減らす設定を検証した。

本番ビルドはRSC・SSR・クライアントの変換を通過したが、Nitroの依存関係梱包で `.output/server/node_modules/source-map-js/lib` 作成時のWindows `EPERM` により停止。ビルド成功とは扱っていない。詳細ログは `outputs/verification/mission-coin/build.log`。スクリーンショットは同ディレクトリのPNG。

## 初期実装の履歴（現在の仕様は上記を参照）

日誌の上部に、ミッション一覧・今日と明日の予定・昨日の結果を表示する。部屋には達成数を表示する。既存の「やったこと」、ホップ・ステップ・ジャンプの評価、日誌本文は予定へ変換しない。

## 操作と判定

- 日誌の「今日の予定を書く」「明日の予定を書く」から既存の箇条書き入力画面を利用する。「記録する」で保存する。
- 予定は対象日で保存する。前日に書いた明日の予定は、対象日になった時点で「今日の予定を書く」の達成に反映する。
- 昨日の各予定に「達成」「未達成」を選ぶ。すべてを報告したら結果報告ミッション達成となる。未達成の報告も有効。未報告は自動的に未達成へ変更しない。
- 昨日の予定がなければ結果報告は対象外、分母は3となる。予定があれば分母は4。
- ログインは画面利用開始・日付変更・復帰時に自動判定する。新語は既存の単語登録処理が初めて登録した時刻で判定する。重複語や掘り下げ回答だけでは達成しない。
- 予定・ミッションだけ日本時間0時で切り替える。従来の日誌・会話などの午前7時の活動日基準は変更しない。

## 保存と共通データ

`GameSave.taskPlans` は対象日付ごとの予定ID・本文・登録日時・結果・報告日時、`GameSave.dailyMissions` は日付とミッションIDごとの初回達成日時を保存する。`getDailyMissionSummary()` から達成数と対象外を含む状態を参照できる。判定は何度実行しても達成時刻を再発行しない。

旧セーブの新フィールドは空で復元する。旧単語には登録日を推測して付けず、今後登録する単語の `learnedAt` を利用する。単語登録が0時直前、画面反映が直後になった場合も登録日へ記録する。予定とミッションは個人の日付別記録として30日サイクルをまたいで保持し、既存の日誌のアーカイブ処理は変えない。

ミッション達成からコイン・交友度・仮面経験値・経験の実などは付与しない。従来のことば学習や日誌による報酬は、その既存操作から従来どおり処理する。予定本文は単語登録や外部情報への送信に使わない。

## 変更箇所

- `lib/dailyMissions.ts`: 日付・予定・結果・共通達成判定・保存データ検証。
- `lib/storage.ts`: 保存フィールドと旧データの復元。
- `lib/conversationTypes.ts`, `lib/wordMemory.ts`: 新語の実登録時刻。
- `components/useDailyMissions.ts`: 0時・画面復帰・既存操作の監視。
- `components/JournalTasks.tsx`, `components/JournalTasks.module.css`: 日誌の予定・結果・ミッション表示。
- `components/JournalPanel.tsx`, `components/JournalEntryEditor.tsx`: 既存入力画面の再利用。
- `components/SuuhimochiGame.tsx`: 既存保存・辞書と接続、部屋の達成数。
- `scripts/test-daily-missions.mjs`, `scripts/test-daily-missions-browser.mjs`, `package.json`: テスト。

## 確認コマンド

`npm run test:daily-missions`、`npm run test:conversation`、`npx tsc --noEmit`、`npm run build`。

ブラウザは開発サーバーに対して `npm run test:daily-missions:browser` を実行する。PlaywrightとChromeは既存テスト同様に `SUUHIMOCHI_BROWSER_MODULES` と `SUUHIMOCHI_BROWSER_EXECUTABLE` で指定できる。独立したテスト保存データで、PC・スマートフォン、予定・全件報告、新語・重複語、再起動、日本時間0時の切り替えと報酬不変を検証する。

2026-10-25の確認結果：新規ロジック15件、ブラウザ3ケース（PC・スマートフォン横画面・0時切り替え）、既存会話181件が成功。外部情報・起動・共有知識・天気・ガチャ・軍師・六占の既存テストも成功。スマートフォンの日誌は新しい欄を含め縦スクロールできるように調整した。

TypeScript型チェック、本番ビルド、新規モジュール・日誌UIなどの対象lintは成功。ただし `lib/conversationTypes.ts` を含めたlintには、変更前から存在する `MemoryRelation.subjectId: 'human' | string` の冗長な型に関する指摘1件が残る。この既存の型定義は今回変更していない。

