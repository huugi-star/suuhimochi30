# Googleトレンド：最近の話題への検索リンク

## 公開レスポンス確認（2026-10-22）

情報センターの公開 `/safe-briefs` と `/safe-trends` を読み取り、次のフィールドを確認した。

- `sourceUrl`：`https://www.google.com/search?q=…&tbs=qdr%3Aw&hl=ja`。最近の話題の検索URL。
- `googleSearchUrl`：説明カードにある検索URLの互換フィールド。
- `xSearchUrl`：Google検索の `site:x.com` を含むURL。Xへの直接検索URLとは限らないため、受信した宛先をそのまま利用する。
- `articleUrl`：実際の記事がある説明カードのみ。ない場合はnull。
- `trendSourceUrl`：従来の一覧URL。今回のリンク先には利用しない。
- `sourceLinkLabel`・`sourceLinkKind`：検索リンクの説明。アプリは固定の日本語ラベルを使い、不明なラベルや指示を実行しない。

## 変更

Googleの主リンクは検証済みの受信 `sourceUrl` を最優先にし、表示を「最近の話題をGoogleで検索」にする。X検索URLがあれば「Xで話題を見る」、記事URLがあれば「関連記事」を追加する。記事を主検索リンクに置き換えない。

旧キャッシュに一覧・検索分析URLしかない場合は、**公開話題のタイトルだけ**で直近1週間のGoogle検索URLを作る。個人の辞書・日誌・会話文章は検索語へ追加しない。Xや記事のURLは存在しない場合に生成しない。

HTTPS・資格情報なし・制御文字なしのURLだけを利用する。検索リンクはGoogleの `/search` と検索語、XリンクはX検索またはGoogleの `site:x.com` 検索であることも確認する。別タブ・noopener/noreferrer・no-referrerを維持し、どのリンクを押しても会話は進まない。

リンクが複数行になる場合は出典欄の実際の高さを既存の配置計算に渡し、スマートフォンでも見切れを防ぐ。クリック進行・二重クリック防止・しっぽの向き・カメラ・移動・表情・会話本文は変更しない。YouTube・Wikipedia・共有知識・天気の従来表示は維持する。

## 変更ファイル

- `lib/externalBriefs.ts`：公開カードのgoogleSearchUrl・xSearchUrlを保持。
- `lib/externalTopics.ts`：sourceUrl優先と追加URLの正規化・キャッシュ復元。
- `lib/externalMonologues.ts`：検索・X・記事URLを選択された会話へ渡す。
- `lib/externalSourceCitation.ts`：Google向けのリンク検証・旧キャッシュ互換。
- `components/ExternalSourceCaption.tsx`・`.module.css`：Google専用ラベルと追加リンク、必要な高さの確保。
- `scripts/test-external-source-citation.mjs`：sourceUrl優先・任意リンク・安全性・キャッシュ保持の単体テスト。
- `scripts/test-external-monologues-browser.mjs`：PC・スマートフォンの3リンク、別タブ、非進行、配置・通常会話の回帰確認。
- `scripts/verify-google-search-links.mjs`：公開API・アプリAPI・キャッシュ復元を通した実取得確認。

## 実取得結果

`node scripts/verify-google-search-links.mjs`（2026-10-22T14:05:49Z）：

| 対象 | Google話題 | X検索URL保持 | 記事URL |
| --- | ---: | ---: | ---: |
| 公開safe-trends → 正規化 → キャッシュ復元 | 301 | 301 | 0 |
| 公開safe-briefs → 変換 | 240 | 240 | 4 |
| アプリ /api/external-briefs → 変換 | 240 | 240 | 4 |

公開件数は更新で変動する。Worker・D1・Cron・本番デプロイは変更していない。

## 動作確認結果

- 単体9件・既存回帰293件・ブラウザ12フローが成功。
- PC・スマートフォン横画面で、検索・X・関連記事の3リンクが吹き出し下に収まり、別タブで開くことを確認。
- 3種類のリンクそれぞれについて、リンク前後の現在ページ・ゲーム保存・会話履歴が変わらないことを確認。
- 任意リンクなし・不正URL・旧キャッシュ、通常会話の非表示、YouTube・Wikipedia・共有知識・気象庁の従来リンクを確認。
- クリック進行・表示保持・連打抑止・情報更新中の非置換・左右の配置としっぽ・カメラ復帰の回帰確認を継続。
- TypeScript型チェック・対象モジュールlint・本番ビルド成功。
