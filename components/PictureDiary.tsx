'use client';
import { useState } from 'react';
import type { PictureDiaryConsent } from '@/lib/pictureDiary';
import type { PictureDiaryRecord } from '@/lib/pictureDiaryClient';
import styles from './PictureDiary.module.css';

export function PictureDiarySettings({ consent, onChoose }: { consent: PictureDiaryConsent; onChoose: (enabled: boolean) => void }) {
  return <section className={styles.settings} aria-label="絵日記の設定"><h3>ことばの絵日記</h3>
    <p>覚えたことばを使って、翌日の最初の起動に昨日の絵日記を描くよ。</p>
    <p>一般的な単語・カテゴリー・記録のある日付・関連語を最大24語送ります。個人のお名前、日誌の本文、会話の文章は送りません。</p>
    <label><input type="checkbox" checked={consent.enabled} onChange={(event) => onChoose(event.target.checked)} />学習情報を送って絵日記を作ることに同意する</label>
    <small>いつでも変更できます。同意した日より前の分や、お休みした日の分をまとめて作ることはありません。</small>
  </section>;
}
const messages = { DEFAULT: '人間さんが帰ってくるのを、おうちで待っていたよ。', CHECKING: '昨日の絵日記を確認・作成中…', GENERATING: 'いま絵日記を描いているみたい。', INSUFFICIENT: '描く材料がまだ足りないみたい。', FAILED: '今回は絵日記を作れませんでした。', UNAVAILABLE: 'いまは絵日記を利用できません。ほかの機能はそのまま使えます。', GENERATED: '覚えていることばから描いた絵日記だよ。' };
function PictureDiaryItem({ record, label, enabled, onCheck, comment }: { record: PictureDiaryRecord; label?: string; enabled: boolean; onCheck: () => void; comment?: string }) {
  const [failedImage, setFailedImage] = useState('');
  const isDefault = record.status === 'DEFAULT' || record.source === 'DEFAULT';
  const defaultComments = ['きょうもお部屋で待っていたよ。', '窓の外を見ながら、帰りを待っていたの。', 'お部屋でゆっくりしながら待っていたよ。', 'また会えるのを楽しみに待っていたの。'];
  const diaryComment = isDefault ? defaultComments[((record.dayNumber ?? 1) - 1) % defaultComments.length] : comment || messages.GENERATED;
  return <article data-image-source={isDefault ? 'DEFAULT' : record.status === 'GENERATED' ? 'CLOUDFLARE' : 'NONE'}>{label && <h4>{label}</h4>}{record.status !== 'GENERATED' && record.status !== 'DEFAULT' && <output>{messages[record.status]}</output>}
    {record?.imageUrl && failedImage !== record.imageUrl && <img src={record.imageUrl} alt={isDefault ? `DAY${record.dayNumber ?? ''}の既定絵日記` : `${record.diaryDate}に覚えたことばの絵日記`} referrerPolicy="no-referrer" onError={() => setFailedImage(record.imageUrl!)} />}
    {['GENERATED', 'DEFAULT'].includes(record.status) && record.imageUrl && failedImage !== record.imageUrl && <p className={`${styles.comment} journal-diary-comment`}>{diaryComment}</p>}
    {record?.imageUrl && failedImage === record.imageUrl && <p>画像を開けませんでした。保存期限が過ぎている可能性があります。</p>}
    {record?.expiresAt && <small>画像の保存期限：{new Date(record.expiresAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}（日本時間）</small>}
    {enabled && record && ['GENERATING', 'FAILED', 'UNAVAILABLE', 'CHECKING'].includes(record.status) && <button type="button" onClick={onCheck}>画像を再確認する</button>}
  </article>;
}
export function PictureDiaryCard({ records, enabled, onCheck, individual, date: selectedDate, comment }: { records: PictureDiaryRecord[]; enabled: boolean; onCheck: () => void; individual?: string; date?: string; comment?: string }) {
  const date = selectedDate ?? [...records].sort((a, b) => b.diaryDate.localeCompare(a.diaryDate)).at(0)?.diaryDate;
  const latest = records.filter((record) => record.diaryDate === date).slice(-2);
  if (!latest.length && (selectedDate || !enabled)) return null;
  return <section className={styles.card} aria-label="ことばの絵日記"><h3>ことばの絵日記{date ? ` · ${date}` : ''}</h3>
    {latest.length ? latest.map((record) => <PictureDiaryItem key={record.localCompanionId} record={record} enabled={enabled} onCheck={onCheck} comment={comment}
      label={individual && (latest.length > 1 || record.localCompanionId !== individual) ? record.localCompanionId === individual ? 'いまのすうひもち' : '前のすうひもち' : undefined} />)
      : <output>今日のことばから、明日の最初の起動に描くよ。</output>}
  </section>;
}
