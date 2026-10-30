/** Stable, local-only fallback drawings. The paths point to supplied files in public/assets/picture-diary. */
const waitingDrawings = [
  'ChatGPT 画像 2026年10月27日 00_08_29-1.png',
  'ChatGPT 画像 2026年10月27日 00_08_30-2.png',
  'ChatGPT 画像 2026年10月27日 00_08_32-3.png',
  'ChatGPT 画像 2026年10月27日 00_08_33-4.png',
  'ChatGPT 画像 2026年10月27日 00_08_35-5.png',
  'ChatGPT 画像 2026年10月27日 00_08_38-6.png',
  'ChatGPT 画像 2026年10月27日 00_08_39-7.png',
  'ChatGPT 画像 2026年10月27日 00_08_40-8.png',
  'ChatGPT 画像 2026年10月27日 00_08_41-9.png',
  'ChatGPT 画像 2026年10月27日 00_08_42-10.png',
  '玄関で待つ小さな冒険家-1.png',
  '玄関で待つ小さな探検家-2.png',
  'クレヨン風の玄関で待つ小さな飛行士-3.png',
  '玄関で待つ小さな飛行帽の仲間-4.png',
  'クレヨン風の玄関で待つ小さな仲間-5.png',
  '玄関で待つパイロット帽の小さな仲間-6.png',
  'ドアを待つ小さなパイロット-7.png',
  'クレヨンタッチの玄関で待つ小さな仲間-8.png',
  '玄関で待つ小さなパイロット-9.png',
  'ドアを待つ小さな仲間-10.png',
  '雨を眺める小さなパイロット-1.png',
  '雨の日の窓辺でほっこりする小さな旅人-2.png',
  '雨の日の窓辺と小さな冒険家-3.png',
  '雨の日の窓辺で見つめる小さな仲間-4.png',
  '雨窓を眺めるパイロット帽の子-5.png',
  '雨の日の窓辺と小さな仲間-6.png',
  '雨の窓辺で憩う小さな冒険家-7.png',
  '雨の日の窓辺でひと休み-8.png',
  '雨の日のクレヨンくま時間-9.png',
  '雨夜を見つめる小さな冒険家-10.png',
] as const;

export const DEFAULT_PICTURE_DIARY_IMAGES = waitingDrawings.map((fileName, index) => ({
  dayNumber: index + 1,
  fileName,
  imageUrl: '/assets/picture-diary/' + encodeURIComponent(fileName),
}));

export function defaultPictureDiaryForDay(dayNumber: number) {
  return Number.isInteger(dayNumber) && dayNumber >= 1 && dayNumber <= 30
    ? DEFAULT_PICTURE_DIARY_IMAGES[dayNumber - 1] ?? null : null;
}

/** A stored fallback may only point to the app's supplied local diary assets. */
export function isDefaultPictureDiaryUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value.startsWith('/assets/picture-diary/')) return false;
  try {
    const url = new URL(value, 'https://local.suuhimochi.invalid');
    if (url.origin !== 'https://local.suuhimochi.invalid' || url.search || url.hash || url.pathname.includes('..')) return false;
    const fileName = decodeURIComponent(url.pathname.slice('/assets/picture-diary/'.length));
    return DEFAULT_PICTURE_DIARY_IMAGES.some((item) => item.fileName === fileName);
  } catch { return false; }
}

export function diaryCycleDayNumber(startDate: string, diaryDate: string): number | null {
  const valid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
    && new Date(value + 'T12:00:00Z').toISOString().slice(0, 10) === value;
  if (!valid(startDate) || !valid(diaryDate)) return null;
  const start = Date.parse(startDate + 'T12:00:00Z');
  const target = Date.parse(diaryDate + 'T12:00:00Z');
  const dayNumber = Math.round((target - start) / 86400000) + 1;
  return dayNumber >= 1 && dayNumber <= 30 ? dayNumber : null;
}