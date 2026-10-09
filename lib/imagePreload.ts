const loadedImages = new Set<string>();
const loadingImages = new Map<string, Promise<void>>();

const DEFAULT_IMAGE_TIMEOUT_MS = 20_000;

const DIRECTIONS = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'] as const;
const DIVINER_ROOT = '/assets/strategists/diviners';

const POTENO_BASIC_ASSETS = [
  ...DIRECTIONS.map((direction) => `/assets/poteno/Idle/rotations/${direction}.png`),
  ...Array.from({ length: 4 }, (_, frame) => `/assets/poteno/animations/Breathing_Idle/south/frame_00${frame}.png`),
];

const STRATEGIST_BASIC_ASSETS = [
  '/assets/strategists/koumei/koumei_neutral.png',
  '/assets/strategists/sunzi/sunzi_neutral.png',
  '/assets/strategists/hanbei/hanbei_neutral.png',
];

const DIVINER_BASIC_ASSETS = [
  `${DIVINER_ROOT}/seimei/seimei_neutral.png`,
  `${DIVINER_ROOT}/seimei/seimei_advice.png`,
  `${DIVINER_ROOT}/taikobo/taikobo_neutral.png`,
  `${DIVINER_ROOT}/tamamo/tamamo_neutral.png`,
  `${DIVINER_ROOT}/saint_germain/saint_germain_neutral.png`,
  `${DIVINER_ROOT}/asteria/asteria_neutral.png`,
  `${DIVINER_ROOT}/davinci/davinci_neutral.png`,
];

/** Images required for the first room frame and basic walking only. */
export const STARTUP_CRITICAL_ASSETS = [
  '/assets/mochi-type-1-new/rotations/south.png',
  ...Array.from({ length: 4 }, (_, frame) => `/assets/mochi-type-1-new/animations/Walking/south/frame_00${frame}.png`),
] as const;

export const SLEEP_CRITICAL_ASSETS = [
  ...Array.from({ length: 7 }, (_, frame) => `/assets/mochi-type-1-new/animations/Peacefully_sleeping_in_bed_with_subtle_breathing_t/south/frame_00${frame}.png`),
] as const;

/** Likely first interactions. These warm up after the room is already usable. */
const EARLY_INTERACTION_ASSETS = [
  '/assets/suuhimochi-type-1.png',
  '/assets/suuhimochi/characters/suuhimochi-01/zoom/body/body-front.png',
  '/assets/suuhimochi/characters/suuhimochi-01/zoom/eyes/neutral/eye_neutral_open.png',
  '/assets/suuhimochi/characters/suuhimochi-01/zoom/eyes/neutral/eye_neutral_half.png',
  '/assets/suuhimochi/characters/suuhimochi-01/zoom/eyes/neutral/eye_neutral_closed.png',
  '/assets/suuhimochi/characters/suuhimochi-01/zoom/mouth/neutral/mouth_neutral_closed.png',
  '/assets/suuhimochi/characters/suuhimochi-01/zoom/mouth/neutral/mouth_neutral_half.png',
  '/assets/suuhimochi/characters/suuhimochi-01/zoom/mouth/neutral/mouth_neutral_open.png',
  '/assets/suuhimochi/characters/suuhimochi-01/zoom/arms/left/arm-left-down.png',
  '/assets/suuhimochi/characters/suuhimochi-01/zoom/arms/right/arm-right-down.png',
  ...POTENO_BASIC_ASSETS,
  ...STRATEGIST_BASIC_ASSETS,
  ...DIVINER_BASIC_ASSETS,
] as const;

const ROOM_ITEM_ASSETS = [
  '/assets/items/wooden-bookshelf-with-plant-and-mushroom.png',
  '/assets/items/bed_flower_red.png',
  '/assets/items/bed_leaf_green.png',
  '/assets/items/bed_check_yellow.png',
  '/assets/items/green-yellow-wooden-cabinet.png',
  '/assets/items/hanging-plant-shelf.png',
  '/assets/items/tulip-wall-frame.png',
  '/assets/items/wooden-floor-lamp.png',
  '/assets/items/leaf-rug.png',
  '/assets/items/round-wooden-low-table.png',
  '/assets/items/flower-cushion.png',
  '/assets/items/potted-plant.png',
  '/assets/items/blue-ceramic-vase.png',
  '/assets/items/wall-clock-analog-thin.png',
  '/assets/items/wall-clock-pixel.png',
  '/assets/kamen/kamen-frame/kamen-frame.png',
  '/assets/kamen/kamen-0.png',
];

const ZOOM_EYE_EMOTIONS = ['angry', 'happy', 'nervous', 'sad', 'surprised', 'thinking'] as const;
const ZOOM_MOUTH_EMOTIONS = ['nervous', 'sad', 'surprised', 'thinking'] as const;
const ZOOM_EXPRESSION_ASSETS = [
  '/assets/suuhimochi/characters/suuhimochi-01/zoom/eyes/Really/Really.png',
  '/assets/suuhimochi/characters/suuhimochi-01/zoom/eyes/smile/smile.png',
  ...ZOOM_EYE_EMOTIONS.flatMap((emotion) => (
    (['open', 'half', 'closed'] as const).map((frame) => {
      const assetFrame = emotion === 'angry' && frame === 'closed' ? 'close' : frame;
      return `/assets/suuhimochi/characters/suuhimochi-01/zoom/eyes/${emotion}/eye_${emotion}_${assetFrame}.png`;
    })
  )),
  ...ZOOM_MOUTH_EMOTIONS.flatMap((emotion) => (
    (['closed', 'half', 'open'] as const).map((frame) => `/assets/suuhimochi/characters/suuhimochi-01/zoom/mouth/${emotion}/mouth_${emotion}_${frame}.png`)
  )),
];

const MASK_FAMILIES = [
  { folder: 'adventurer', middle: 'S', ending: 'F', suffix: 'Q' },
  { folder: 'architect', middle: 'D', ending: 'F', suffix: 'H' },
  { folder: 'builder', middle: 'R', ending: 'F', suffix: 'H' },
  { folder: 'guardian', middle: 'R', ending: 'A', suffix: 'H' },
  { folder: 'idealist', middle: 'S', ending: 'A', suffix: 'Q' },
  { folder: 'performer', middle: 'D', ending: 'A', suffix: 'Q' },
  { folder: 'pioneer', middle: 'D', ending: 'F', suffix: 'Q' },
  { folder: 'prophet', middle: 'D', ending: 'A', suffix: 'H' },
  { folder: 'ruler', middle: 'R', ending: 'F', suffix: 'Q' },
  { folder: 'savior', middle: 'R', ending: 'A', suffix: 'Q' },
  { folder: 'seeker', middle: 'S', ending: 'F', suffix: 'H' },
  { folder: 'supporter', middle: 'S', ending: 'A', suffix: 'H' },
] as const;

const MASK_ASSETS = MASK_FAMILIES.flatMap(({ folder, middle, ending, suffix }) => [
  `/assets/kamen/${folder}/archetype.png`,
  ...(['B', 'E', 'I'] as const).flatMap((first) => (['C', 'L', 'T'] as const).map((third) => {
    const fileName = `${first}${middle}${third}${ending}-${suffix}`;
    // This one source file intentionally uses lowercase on disk.
    return `/assets/kamen/${folder}/${folder === 'pioneer' && fileName === 'IDCF-Q' ? 'idcf-q' : fileName}.png`;
  })),
]);

/** Non-blocking assets, ordered so likely next actions warm up first. */
export const BACKGROUND_PRELOAD_ASSETS = [
  '/assets/backgrounds/room-morning.png',
  '/assets/backgrounds/room-noon.png',
  '/assets/backgrounds/room-evening.png',
  '/assets/backgrounds/room-night-lit.png',
  '/assets/backgrounds/room-night-unlit.png',
  '/assets/backgrounds/room-midnight-lit.png',
  '/assets/backgrounds/room-midnight-unlit.png',
  ...ROOM_ITEM_ASSETS,
  '/assets/strategists/koumei/koumei_advice.png',
  '/assets/strategists/koumei/koumei_serious.png',
  '/assets/strategists/sunzi/sunzi_advice.png',
  '/assets/strategists/sunzi/sunzi_confident.png',
  '/assets/strategists/hanbei/hanbei_advice.png',
  '/assets/strategists/hanbei/hanbei_serious.png',
  `${DIVINER_ROOT}/taikobo/taikobo_advice.png`,
  `${DIVINER_ROOT}/tamamo/tamamo_interested.png`,
  `${DIVINER_ROOT}/saint_germain/saint_germain_advice.png`,
  `${DIVINER_ROOT}/asteria/asteria_shy.png`,
  `${DIVINER_ROOT}/davinci/davinci_thinking.png`,
  `${DIVINER_ROOT}/seimei/seimei_serious.png`,
  `${DIVINER_ROOT}/taikobo/taikobo_serious.png`,
  `${DIVINER_ROOT}/tamamo/tamamo_serious.png`,
  `${DIVINER_ROOT}/saint_germain/saint_germain_serious.png`,
  `${DIVINER_ROOT}/asteria/asteria_serious.png`,
  `${DIVINER_ROOT}/davinci/davinci_serious.png`,
  ...DIRECTIONS.flatMap((direction) => [
    `/assets/mochi-type-1-new/rotations/${direction}.png`,
    ...Array.from({ length: 4 }, (_, frame) => `/assets/mochi-type-1-new/animations/Walking/${direction}/frame_00${frame}.png`),
  ]),
  ...ZOOM_EXPRESSION_ASSETS,
  '/assets/suuhimochi/characters/suuhimochi-01/zoom/scare/scare.png',
  '/assets/suuhimochi/characters/suuhimochi-01/zoom/arms/left/arm-left-down.png',
  '/assets/suuhimochi/characters/suuhimochi-01/zoom/arms/left/arm-left-open.png',
  '/assets/suuhimochi/characters/suuhimochi-01/zoom/arms/left/arm-left-up.png',
  '/assets/suuhimochi/characters/suuhimochi-01/zoom/arms/left/left-hand_chest.png',
  '/assets/suuhimochi/characters/suuhimochi-01/zoom/arms/right/arm-right-down.png',
  '/assets/suuhimochi/characters/suuhimochi-01/zoom/arms/right/arm-right-open.png',
  '/assets/suuhimochi/characters/suuhimochi-01/zoom/arms/right/arm-right-up.png',
  '/assets/suuhimochi/characters/suuhimochi-01/zoom/arms/right/right-hand_chest.png',
  '/assets/items/experience-fruits/experience-fruit-bulb.png',
  '/assets/items/experience-fruits/experience-fruit-bulb-spoiled.png',
  '/assets/items/experience-fruits/experience-fruit-round.png',
  '/assets/items/experience-fruits/experience-fruit-round-spoiled.png',
  '/assets/items/experience-fruits/experience-fruit-white-apple.png',
  '/assets/items/experience-fruits/experience-fruit-white-apple-spoiled.png',
  '/assets/effects/gahoon.png',
] as const;

/** 151MB超の仮面群は図鑑等を開く時のオンデマンド用。起動後にも自動取得しない。 */
export const ON_DEMAND_MASK_ASSETS = MASK_ASSETS;

export type NetworkPreloadProfile = {
  constrained: boolean;
  batchSize: number;
  pauseMs: number;
  criticalConcurrency: number;
};

type NetworkInformationLike = {
  downlink?: number;
  effectiveType?: string;
  rtt?: number;
  saveData?: boolean;
};

export function getNetworkPreloadProfile(): NetworkPreloadProfile {
  if (typeof navigator === 'undefined') {
    return { constrained: false, batchSize: 4, pauseMs: 220, criticalConcurrency: 6 };
  }
  const connection = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
  const constrained = Boolean(
    connection?.saveData
    || connection?.effectiveType === 'slow-2g'
    || connection?.effectiveType === '2g'
    || (typeof connection?.downlink === 'number' && connection.downlink <= 5)
    || (typeof connection?.rtt === 'number' && connection.rtt >= 1_000),
  );
  return constrained
    ? { constrained: true, batchSize: 1, pauseMs: 900, criticalConcurrency: 3 }
    : { constrained: false, batchSize: 4, pauseMs: 220, criticalConcurrency: 6 };
}

export function getBackgroundPreloadAssets(constrained = false) {
  const sources = [...BACKGROUND_PRELOAD_ASSETS, ...EARLY_INTERACTION_ASSETS];
  if (!constrained) return uniqueImageSources(sources);
  return uniqueImageSources(sources.filter((src) => (
    src.startsWith('/assets/backgrounds/')
    || src.startsWith('/assets/mochi-type-1-new/')
    || src.startsWith('/assets/suuhimochi/characters/')
    || src.startsWith('/assets/items/experience-fruits/')
  )));
}

export function uniqueImageSources(sources: readonly string[]) {
  return [...new Set(sources.filter(Boolean))];
}

export async function preloadImage(
  src: string,
  options: { timeoutMs?: number } = {},
): Promise<void> {
  if (loadedImages.has(src)) return;
  const pending = loadingImages.get(src);
  if (pending) return pending;

  const task = (async () => {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const finish = (result: 'load' | 'error' | 'timeout') => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        image.onload = null;
        image.onerror = null;
        if (result === 'load') resolve();
        else reject(new Error(result === 'timeout' ? `Timed out loading image: ${src}` : `Failed to load image: ${src}`));
      };
      const timer = window.setTimeout(() => finish('timeout'), options.timeoutMs ?? DEFAULT_IMAGE_TIMEOUT_MS);
      image.onload = () => finish('load');
      image.onerror = () => finish('error');
      image.src = src;
    });
    if (typeof image.decode === 'function') {
      try {
        await image.decode();
      } catch {
        // A successful load is enough to start; decode failures can recover in <img>.
      }
    }
    loadedImages.add(src);
  })().finally(() => loadingImages.delete(src));

  loadingImages.set(src, task);
  return task;
}

export async function preloadCriticalImages(
  sources: readonly string[],
  onProgress?: (loaded: number, total: number) => void,
  options: { concurrency?: number; timeoutMs?: number } = {},
) {
  const uniqueSources = uniqueImageSources(sources);
  let loaded = 0;
  let nextIndex = 0;
  const results: PromiseSettledResult<void>[] = new Array(uniqueSources.length);
  onProgress?.(0, uniqueSources.length);
  const worker = async () => {
    while (nextIndex < uniqueSources.length) {
      const index = nextIndex;
      nextIndex += 1;
      try {
        await preloadImage(uniqueSources[index], { timeoutMs: options.timeoutMs });
        results[index] = { status: 'fulfilled', value: undefined };
      } catch (reason) {
        results[index] = { status: 'rejected', reason };
      } finally {
        loaded += 1;
        onProgress?.(loaded, uniqueSources.length);
      }
    }
  };
  const concurrency = Math.max(1, Math.min(options.concurrency ?? 6, uniqueSources.length || 1));
  await Promise.all(Array.from({ length: concurrency }, worker));
  return { sources: uniqueSources, results };
}

type IdleCapableWindow = Window & typeof globalThis & {
  requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
  cancelIdleCallback?: (handle: number) => void;
};

export function preloadImagesInIdleBatches(
  sources: readonly string[],
  options: { batchSize?: number; pauseMs?: number } = {},
) {
  const queue = uniqueImageSources(sources).filter((src) => !loadedImages.has(src));
  const batchSize = options.batchSize ?? 8;
  const pauseMs = options.pauseMs ?? 140;
  const idleWindow = window as IdleCapableWindow;
  let cancelled = false;
  let timeoutId: number | null = null;
  let idleId: number | null = null;

  const schedule = () => {
    if (cancelled || queue.length === 0) return;
    if (idleWindow.requestIdleCallback) {
      idleId = idleWindow.requestIdleCallback(runBatch, { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(runBatch, pauseMs);
    }
  };
  const runBatch = () => {
    if (cancelled) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      timeoutId = window.setTimeout(runBatch, pauseMs);
      return;
    }
    const batch = queue.splice(0, batchSize);
    void Promise.allSettled(batch.map((src) => preloadImage(src))).then((results) => {
      results.forEach((result, index) => {
        if (result.status === 'rejected') console.warn('[image-preload] Background image failed:', batch[index], result.reason);
      });
      schedule();
    });
  };

  schedule();
  return () => {
    cancelled = true;
    if (timeoutId !== null) window.clearTimeout(timeoutId);
    if (idleId !== null) idleWindow.cancelIdleCallback?.(idleId);
  };
}
