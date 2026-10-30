import type { GameSave } from './storage';
import { getPersonaStage } from './food';

export type GachaRarity = 'N' | 'R' | 'SR';
export type GachaRewardKind = 'furniture' | 'snack' | 'experience';
export type GachaReward = {
  id: string;
  rarity: GachaRarity;
  kind: GachaRewardKind;
  name: string;
  icon: string;
  image?: string;
  amount: number;
};
export type GachaDraw = { id: string; rewardId: string; drawnAt: string };

// Rates and rewards live here, never in the animation. These are the first
// gacha rates; there was no pre-existing draw table to migrate.
export const GACHA_RARITY_RATES: Readonly<Record<GachaRarity, number>> = {
  N: 0.7,
  R: 0.25,
  SR: 0.05,
};

export const GACHA_REWARDS: readonly GachaReward[] = [
  { id: 'snack-star-cookie', rarity: 'N', kind: 'snack', name: 'ほしのクッキー', icon: '✦', amount: 1 },
  { id: 'snack-honey-candy', rarity: 'N', kind: 'snack', name: 'はちみつキャンディ', icon: '🍬', amount: 1 },
  { id: 'experience-small', rarity: 'N', kind: 'experience', name: 'ぺるそなのひらめき', icon: '✧', amount: 2 },
  { id: 'gacha-cushion', rarity: 'R', kind: 'furniture', name: 'おそろいの花クッション', icon: '❀', image: '/assets/items/flower-cushion.png', amount: 1 },
  { id: 'gacha-vase', rarity: 'R', kind: 'furniture', name: 'おそろいの青い花瓶', icon: '◈', image: '/assets/items/blue-ceramic-vase.png', amount: 1 },
  { id: 'experience-medium', rarity: 'R', kind: 'experience', name: 'ぺるそなのきらめき', icon: '✧', amount: 5 },
  { id: 'gacha-plant', rarity: 'SR', kind: 'furniture', name: 'おそろいの鉢植え', icon: '❃', image: '/assets/items/potted-plant.png', amount: 1 },
  { id: 'experience-large', rarity: 'SR', kind: 'experience', name: 'ぺるそなの大きなきらめき', icon: '✦', amount: 12 },
];

export const GACHA_FURNITURE_IDS = GACHA_REWARDS.filter((reward) => reward.kind === 'furniture').map((reward) => reward.id);
export const GACHA_SNACKS = GACHA_REWARDS.filter((reward) => reward.kind === 'snack');

export function getGachaReward(id: string): GachaReward | undefined {
  return GACHA_REWARDS.find((reward) => reward.id === id);
}

export function drawGacha(random: () => number = Math.random, ownedFurniture: Record<string, number> = {}): GachaReward {
  const roll = Math.max(0, Math.min(0.999999999, random()));
  const rarity: GachaRarity = roll < GACHA_RARITY_RATES.N
    ? 'N'
    : roll < GACHA_RARITY_RATES.N + GACHA_RARITY_RATES.R ? 'R' : 'SR';
  // The room places one instance per furniture ID. Once owned, that slot is
  // removed from the pool; same-rarity experience remains available instead.
  const pool = GACHA_REWARDS.filter((reward) => reward.rarity === rarity && (reward.kind !== 'furniture' || !ownedFurniture[reward.id]));
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}

export function sanitizeGachaInventory(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  // Keep valid historical IDs even if a later release changes the draw table.
  return Object.fromEntries(Object.entries(value).filter(([id, count]) => Boolean(id) && Number.isFinite(count) && Number(count) > 0).map(([id, count]) => [id, Math.floor(Number(count))]));
}

export function sanitizeGachaHistory(value: unknown): GachaDraw[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.filter((entry): entry is GachaDraw => {
    if (!entry || typeof entry !== 'object') return false;
    const item = entry as Partial<GachaDraw>;
    if (typeof item.id !== 'string' || !item.id || seen.has(item.id) || typeof item.rewardId !== 'string' || !item.rewardId || typeof item.drawnAt !== 'string') return false;
    seen.add(item.id);
    return true;
  });
}

/** Spend and grant in one save snapshot, before any animation begins. */
export function applyGachaDraw(save: GameSave, draw: GachaDraw): GameSave | null {
  const reward = getGachaReward(draw.rewardId);
  if (!reward || save.gachaCoins < 1 || save.gachaHistory.some((item) => item.id === draw.id) || (reward.kind === 'furniture' && (save.gachaFurnitureInventory[reward.id] ?? 0) > 0)) return null;
  const personaExp = save.personaExp + (reward.kind === 'experience' ? reward.amount : 0);
  return {
    ...save,
    gachaCoins: save.gachaCoins - 1,
    gachaHistory: [...save.gachaHistory, draw],
    gachaFurnitureInventory: reward.kind === 'furniture'
      ? { ...save.gachaFurnitureInventory, [reward.id]: (save.gachaFurnitureInventory[reward.id] ?? 0) + reward.amount }
      : save.gachaFurnitureInventory,
    gachaSnackInventory: reward.kind === 'snack'
      ? { ...save.gachaSnackInventory, [reward.id]: (save.gachaSnackInventory[reward.id] ?? 0) + reward.amount }
      : save.gachaSnackInventory,
    personaExp,
    personaStage: getPersonaStage(personaExp),
  };
}
