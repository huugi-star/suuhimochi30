export type PersonaStage = 0 | 1 | 2 | 3;

export type ExperienceFruitKind = 'experience' | 'white';
export type ExperienceFruitVariant = 'bulb' | 'round' | 'white-apple';

export type ExperienceFruitRecord = {
  id: string;
  sourceDate: string;
  kind: ExperienceFruitKind;
  variant: ExperienceFruitVariant;
  generatedAt: string;
  expiresAt: string;
  experienceText?: string;
  eatenAt?: string;
};

export type ExperienceMealState = {
  /** 06:00始まりの食事用活動日。異なる日なら回数は自動的に0として扱う。 */
  activityDate: string;
  mealsEaten: number;
  lastMealAt: string;
};

export type ExperienceMealStatus = {
  state: 'hungry' | 'full' | 'doneToday';
  mealsEaten: number;
  remainingMs: number;
  nextMealNumber: 1 | 2 | 3 | null;
};

export const EXPERIENCE_FRUIT_SHELF_LIFE_MS = 24 * 60 * 60 * 1000;
export const EXPERIENCE_MEAL_COOLDOWN_MS = 5 * 60 * 60 * 1000;
export const EXPERIENCE_MEALS_PER_ACTIVITY_DAY = 3;
// Three fruits are a day's meals. Eating every fresh fruit advances the mask
// around DAY 8 / 16 / 24, keeping the growth paced across the 30-day cycle.
export const PERSONA_STAGE_THRESHOLDS = [0, 24, 48, 72] as const;

const FRUIT_IMAGES: Record<ExperienceFruitVariant, { fresh: string; spoiled: string }> = {
  bulb: {
    fresh: '/assets/items/experience-fruits/experience-fruit-bulb.png',
    spoiled: '/assets/items/experience-fruits/experience-fruit-bulb-spoiled.png',
  },
  round: {
    fresh: '/assets/items/experience-fruits/experience-fruit-round.png',
    spoiled: '/assets/items/experience-fruits/experience-fruit-round-spoiled.png',
  },
  'white-apple': {
    fresh: '/assets/items/experience-fruits/experience-fruit-white-apple.png',
    spoiled: '/assets/items/experience-fruits/experience-fruit-white-apple-spoiled.png',
  },
};

function cleanItems(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function getPersonaStage(experience: number): PersonaStage {
  const safeExperience = Math.max(0, Math.floor(Number(experience) || 0));
  if (safeExperience >= PERSONA_STAGE_THRESHOLDS[3]) return 3;
  if (safeExperience >= PERSONA_STAGE_THRESHOLDS[2]) return 2;
  if (safeExperience >= PERSONA_STAGE_THRESHOLDS[1]) return 1;
  return 0;
}

/** Meals reset at 06:00, independently of the journal's 07:00 activity-day boundary. */
function activityDateForFood(date: Date) {
  const shifted = new Date(date);
  shifted.setHours(shifted.getHours() - 6);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, '0')}-${String(shifted.getDate()).padStart(2, '0')}`;
}

export function getExperienceMealStatus(
  mealState: ExperienceMealState,
  now = new Date(),
): ExperienceMealStatus {
  const activityDate = activityDateForFood(now);
  const mealsEaten = mealState.activityDate === activityDate
    ? Math.min(EXPERIENCE_MEALS_PER_ACTIVITY_DAY, Math.max(0, Math.floor(mealState.mealsEaten || 0)))
    : 0;
  if (mealsEaten >= EXPERIENCE_MEALS_PER_ACTIVITY_DAY) {
    return { state: 'doneToday', mealsEaten, remainingMs: 0, nextMealNumber: null };
  }

  const lastMealAt = new Date(mealState.lastMealAt).getTime();
  const remainingMs = mealsEaten > 0 && Number.isFinite(lastMealAt)
    ? Math.max(0, lastMealAt + EXPERIENCE_MEAL_COOLDOWN_MS - now.getTime())
    : 0;
  if (remainingMs > 0) {
    return {
      state: 'full',
      mealsEaten,
      remainingMs,
      nextMealNumber: (mealsEaten + 1) as 1 | 2 | 3,
    };
  }
  return {
    state: 'hungry',
    mealsEaten,
    remainingMs: 0,
    nextMealNumber: (mealsEaten + 1) as 1 | 2 | 3,
  };
}

export function getFoodActivityDate(date = new Date()) {
  return activityDateForFood(date);
}

export function createExperienceFruitBatch({
  existing,
  sourceDate,
  kind,
  doneItems,
  now = new Date(),
  random = Math.random,
}: {
  existing: ExperienceFruitRecord[];
  sourceDate: string;
  kind: ExperienceFruitKind;
  doneItems?: string[];
  now?: Date;
  random?: () => number;
}): { fruits: ExperienceFruitRecord[]; created: ExperienceFruitRecord[] } {
  if (!sourceDate || existing.some((fruit) => fruit.sourceDate === sourceDate)) {
    return { fruits: existing, created: [] };
  }

  const items = cleanItems(doneItems);
  if (kind === 'experience' && items.length === 0) return { fruits: existing, created: [] };

  const generatedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + EXPERIENCE_FRUIT_SHELF_LIFE_MS).toISOString();
  const variant: ExperienceFruitVariant = kind === 'white'
    ? 'white-apple'
    : random() < 0.5 ? 'bulb' : 'round';
  const batchToken = `${sourceDate}-${now.getTime()}-${Math.floor(random() * 1_000_000)}`;
  const itemOffset = items.length > 0 ? Math.floor(random() * items.length) : 0;
  const created = Array.from({ length: 3 }, (_, index): ExperienceFruitRecord => ({
    id: `experience-fruit-${batchToken}-${index + 1}`,
    sourceDate,
    kind,
    variant,
    generatedAt,
    expiresAt,
    ...(items.length > 0 ? { experienceText: items[(itemOffset + index) % items.length] } : {}),
  }));

  return { fruits: [...existing, ...created], created };
}

export function isFruitSpoiled(fruit: ExperienceFruitRecord, now = new Date()) {
  const expiresAt = new Date(fruit.expiresAt).getTime();
  return !Number.isFinite(expiresAt) || now.getTime() >= expiresAt;
}

export function getFruitImage(fruit: Pick<ExperienceFruitRecord, 'variant'>, spoiled = false) {
  const images = FRUIT_IMAGES[fruit.variant] ?? FRUIT_IMAGES.round;
  return spoiled ? images.spoiled : images.fresh;
}

export function sanitizeExperienceFruits(value: unknown): ExperienceFruitRecord[] {
  if (!Array.isArray(value)) return [];
  const variants = new Set<ExperienceFruitVariant>(['bulb', 'round', 'white-apple']);
  return value.flatMap((candidate) => {
    if (!candidate || typeof candidate !== 'object') return [];
    const fruit = candidate as Partial<ExperienceFruitRecord>;
    if (
      typeof fruit.id !== 'string'
      || typeof fruit.sourceDate !== 'string'
      || (fruit.kind !== 'experience' && fruit.kind !== 'white')
      || !fruit.variant
      || !variants.has(fruit.variant)
      || typeof fruit.generatedAt !== 'string'
      || typeof fruit.expiresAt !== 'string'
    ) return [];
    return [{
      id: fruit.id,
      sourceDate: fruit.sourceDate,
      kind: fruit.kind,
      variant: fruit.variant,
      generatedAt: fruit.generatedAt,
      expiresAt: fruit.expiresAt,
      ...(typeof fruit.experienceText === 'string' && fruit.experienceText.trim()
        ? { experienceText: fruit.experienceText.trim() }
        : {}),
      ...(typeof fruit.eatenAt === 'string' ? { eatenAt: fruit.eatenAt } : {}),
    }];
  });
}
