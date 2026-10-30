'use client';
import { SHARED_EXPLANATION, type SharedPreference } from '@/lib/sharedKnowledge';
import styles from './SharedKnowledgeSettings.module.css';

export function SharedKnowledgeNotice({ ready, preference, onChoose }: { ready: boolean; preference: SharedPreference; onChoose: (enabled: boolean) => void }) {
  if (!ready || preference.decided) return null;
  return <div className={styles.noticeBackdrop}>
    <aside className={styles.notice} role="dialog" aria-modal="true" aria-label="共有知識への参加設定">
      <h2>すうひもちがネットから言葉を拾ってきてもいい？</h2>
      <p>人間さんが教えてくれた言葉をヒントに、ネットで新しいお話を探してくるの！</p>
      <strong>すうひもちセンターに送るもの</strong>
      <p>「ラーメン」「将棋」「徳川家康」など、一般的な単語や有名人・歴史人物の名前だけ。</p>
      <strong>送らないもの</strong>
      <p>個人のお名前、日誌、会話の文章などの個人的な情報。</p>
      <small>あとから設定で変更できるよ！</small>
      <div><button type="button" onClick={() => onChoose(true)}>拾ってきて！</button><button type="button" onClick={() => onChoose(false)}>今はいいよ</button></div>
    </aside>
  </div>;
}
export function SharedKnowledgeSettings({ preference, onChoose, status }: { preference: SharedPreference; onChoose: (enabled: boolean) => void; status: string }) {
  return <section className={styles.settings} aria-label="共有知識の設定">
    <label><input type="checkbox" checked={preference.enabled} onChange={(event) => onChoose(event.target.checked)} />共有知識を利用する</label>
    <p>{SHARED_EXPLANATION}</p><small>公開辞書に完全一致した語だけを送信します。OFFでも通常の会話・ことばコンボは使えます。変更はすぐに保存されます。</small>
    <output aria-live="polite">{preference.enabled ? status || '利用する（取得はバックグラウンド）' : '利用しない（共有機能への通信なし）'}</output>
  </section>;
}
