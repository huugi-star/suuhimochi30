export type WordComboDanceExpression = 'arc' | 'squint';

export type WordComboDanceFrame = {
  src: string;
  durationMs: number;
  /** A small rest after this pose, so the dance has readable pauses. */
  holdMs: number;
  offsetX: number;
  offsetY: number;
  scale: number;
  variant?: 'legacy' | 'normal' | 'smile' | 'finish';
  pose?: number;
};

export const WORD_COMBO_DANCE_FRAME_DURATIONS = [
  150, 150, 160, 220, 150, 160,
] as const;

// The third squint pose is also the combo's resting pose. Holding poses 3 and
// 6 gives the little dance an intentional stop-and-go rhythm instead of a
// continuously agitated loop.
export const WORD_COMBO_DANCE_FRAME_HOLDS = [
  100, 100, 350, 100, 160, 470,
] as const;

const DANCE_ASSET_ROOT = '/assets/suuhimochi/characters/suuhimochi-01/dance';
const DANCE_ASSET_VERSION = '20261011b';
const KANA_DANCE_ASSET_VERSION = '20261016a';

export const WORD_COMBO_INPUT_POSE_MS = 180;
export const WORD_COMBO_INPUT_IDLE_MS = 1200;
export const WORD_COMBO_FINISH_POSE_MS = 300;

const POSE_NAMES = [
  'center',
  'left_step',
  'left_hit',
  'bounce',
  'right_step',
  'right_hit',
] as const;

const FINISH_NAMES = ['jump', 'victory', 'point', 'landing', 'star'] as const;

const KANA_ROW_POSES = [
  { kana: 'あいうえおぁぃぅぇぉ', pose: 1 },
  { kana: 'かきくけこ', pose: 2 },
  { kana: 'さしすせそ', pose: 3 },
  { kana: 'たちつてとっ', pose: 4 },
  { kana: 'なにぬねの', pose: 5 },
  { kana: 'はひふへほ', pose: 6 },
  { kana: 'まみむめも', pose: 1 },
  { kana: 'やゆよゃゅょ', pose: 3 },
  { kana: 'らりるれろ', pose: 5 },
  { kana: 'わをんゎ', pose: 6 },
] as const;

const KANA_POSE_MOTION: ReadonlyArray<
  Pick<WordComboDanceFrame, 'offsetX' | 'offsetY' | 'scale'>
> = [
  { offsetX: 0, offsetY: 0, scale: 0.94 },
  { offsetX: -2.1, offsetY: 0.8, scale: 0.95 },
  { offsetX: -1.2, offsetY: -1.1, scale: 0.97 },
  { offsetX: 0, offsetY: -2.4, scale: 1.01 },
  { offsetX: 2.1, offsetY: 0.8, scale: 0.95 },
  { offsetX: 1.2, offsetY: -1.1, scale: 0.97 },
];

const FINISH_POSE_MOTION: ReadonlyArray<
  Pick<WordComboDanceFrame, 'offsetX' | 'offsetY' | 'scale'>
> = [
  { offsetX: 0, offsetY: -2.8, scale: 1.03 },
  { offsetX: 0, offsetY: -0.8, scale: 1.04 },
  { offsetX: 1.5, offsetY: -0.6, scale: 1.02 },
  { offsetX: 0, offsetY: 0.5, scale: 1.01 },
  { offsetX: 0, offsetY: -1.2, scale: 1.05 },
];

function toHiraganaBase(character: string) {
  const decomposed = character.normalize('NFKD')[0] ?? '';
  const codePoint = decomposed.codePointAt(0);
  if (codePoint && codePoint >= 0x30a1 && codePoint <= 0x30f6)
    return String.fromCodePoint(codePoint - 0x60);
  return decomposed;
}

export function getWordComboDancePoseForKana(character: string): number | null {
  const hiragana = toHiraganaBase(character);
  return KANA_ROW_POSES.find((row) => row.kana.includes(hiragana))?.pose ?? null;
}

function getKanaPoseFrame(
  pose: number,
  variant: 'normal' | 'smile',
  durationMs: number,
): WordComboDanceFrame {
  const poseIndex = Math.min(6, Math.max(1, Math.floor(pose))) - 1;
  return {
    src: `${DANCE_ASSET_ROOT}/${variant}/dance_${variant}_${String(poseIndex + 1).padStart(2, '0')}_${POSE_NAMES[poseIndex]}.png?v=${KANA_DANCE_ASSET_VERSION}`,
    durationMs,
    holdMs: 0,
    variant,
    pose: poseIndex + 1,
    ...KANA_POSE_MOTION[poseIndex],
  };
}

function getFinishFrame(index: number): WordComboDanceFrame {
  const finishIndex = Math.min(5, Math.max(1, Math.floor(index))) - 1;
  return {
    src: `${DANCE_ASSET_ROOT}/finish/dance_finish_${String(finishIndex + 1).padStart(2, '0')}_${FINISH_NAMES[finishIndex]}.png?v=${KANA_DANCE_ASSET_VERSION}`,
    durationMs: WORD_COMBO_FINISH_POSE_MS,
    holdMs: 0,
    variant: 'finish',
    pose: finishIndex + 1,
    ...FINISH_POSE_MOTION[finishIndex],
  };
}

function getDanceablePoses(value: string) {
  return Array.from(value).flatMap((character) => {
    const pose = getWordComboDancePoseForKana(character);
    return pose === null ? [] : [pose];
  });
}

/** Returns only newly committed kana; deletion and unconfirmed romaji yield no dance. */
export function getNewlyCommittedKana(previous: string, next: string) {
  if (next === previous) return '';
  let prefixLength = 0;
  while (
    prefixLength < previous.length
    && prefixLength < next.length
    && previous[prefixLength] === next[prefixLength]
  ) prefixLength += 1;

  let suffixLength = 0;
  while (
    suffixLength < previous.length - prefixLength
    && suffixLength < next.length - prefixLength
    && previous[previous.length - 1 - suffixLength] === next[next.length - 1 - suffixLength]
  ) suffixLength += 1;

  const inserted = next.slice(prefixLength, next.length - suffixLength);
  return Array.from(inserted)
    .filter((character) => getWordComboDancePoseForKana(character) !== null)
    .join('');
}

export function getWordComboInputDanceFrames(kana: string): WordComboDanceFrame[] {
  return getDanceablePoses(kana).map((pose) =>
    getKanaPoseFrame(pose, 'normal', WORD_COMBO_INPUT_POSE_MS));
}

export function getWordComboConfirmedDanceFrames(
  word: string,
  random: () => number = Math.random,
): WordComboDanceFrame[] {
  const poses = getDanceablePoses(word);
  if (poses.length === 0) return [];
  // Short words retain a readable 100–150ms beat. Longer words accelerate so
  // even the 30-character input limit remains around two seconds including
  // the 300ms finish pose.
  const poseMs = Math.min(130, Math.max(45, Math.floor(1600 / poses.length)));
  const frames = poses.map((pose) => getKanaPoseFrame(pose, 'smile', poseMs));
  if (poses.length >= 5) {
    const finishIndex = Math.min(4, Math.max(0, Math.floor(random() * 5))) + 1;
    frames.push(getFinishFrame(finishIndex));
  }
  return frames;
}

export const WORD_COMBO_DANCE_IDLE_SRC =
  `${DANCE_ASSET_ROOT}/dance_03_squint.png?v=${DANCE_ASSET_VERSION}`;

// The source PNGs share a 1254 x 1254 canvas, but the body centre and lowest
// opaque pixel differ slightly per generated frame. These small, clamped
// corrections keep the torso in one place while preserving the intended hop.
const FRAME_CORRECTIONS: Record<
  WordComboDanceExpression,
  ReadonlyArray<Pick<WordComboDanceFrame, 'offsetX' | 'offsetY' | 'scale'>>
> = {
  arc: [
    { offsetX: 2.4, offsetY: 1.8, scale: 0.92 },
    { offsetX: -2.6, offsetY: 2.1, scale: 0.92 },
    { offsetX: 0.6, offsetY: -0.4, scale: 0.92 },
    { offsetX: 0.6, offsetY: -2.2, scale: 0.92 },
    { offsetX: 0.3, offsetY: 0.2, scale: 0.92 },
    { offsetX: 0.3, offsetY: 0.2, scale: 0.92 },
  ],
  squint: [
    { offsetX: 0.6, offsetY: 0, scale: 0.92 },
    { offsetX: -2, offsetY: 0.9, scale: 0.92 },
    { offsetX: -2.3, offsetY: 1.4, scale: 0.92 },
    { offsetX: 0, offsetY: -1.8, scale: 0.92 },
    { offsetX: -1.6, offsetY: 1.5, scale: 0.92 },
    { offsetX: -0.3, offsetY: 0.4, scale: 0.92 },
  ],
};

export function getWordComboDanceFrames(
  expression: WordComboDanceExpression,
): WordComboDanceFrame[] {
  return WORD_COMBO_DANCE_FRAME_DURATIONS.map((durationMs, index) => ({
    src: `${DANCE_ASSET_ROOT}/dance_${String(index + 1).padStart(2, '0')}_${expression}.png?v=${DANCE_ASSET_VERSION}`,
    durationMs,
    holdMs: WORD_COMBO_DANCE_FRAME_HOLDS[index],
    variant: 'legacy',
    pose: index + 1,
    ...FRAME_CORRECTIONS[expression][index],
  }));
}

export const WORD_COMBO_DANCE_CYCLE_MS =
  WORD_COMBO_DANCE_FRAME_DURATIONS.reduce(
    (total, durationMs, index) =>
      total + durationMs + WORD_COMBO_DANCE_FRAME_HOLDS[index],
    0,
  );

// A completed answer nudges the tempo up one level. Even at six answers the
// poses still have time to read as a dance rather than a frantic animation.
export function getWordComboDanceCycleMs(
  combo: number,
  _boosted = false,
  perfect = false,
) {
  const comboIndex = Math.min(6, Math.max(0, Math.floor(combo)));
  const cycleByCombo = [2700, 2600, 2450, 2300, 2150, 2000, 1850] as const;
  return perfect ? 1750 : cycleByCombo[comboIndex];
}
