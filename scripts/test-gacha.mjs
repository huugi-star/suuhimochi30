import assert from 'node:assert/strict';
import { createServer } from 'vite';

const data = new Map();
globalThis.window = { localStorage: {
  getItem: (key) => data.get(key) ?? null,
  setItem: (key, value) => data.set(key, value),
  removeItem: (key) => data.delete(key),
} };

const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true }, appType: 'custom' });
try {
  const { drawGacha, GACHA_REWARDS, GACHA_RARITY_RATES, applyGachaDraw } = await vite.ssrLoadModule('/lib/gacha.ts');
  const { EMPTY_SAVE, storeSave, loadSave } = await vite.ssrLoadModule('/lib/storage.ts');
  assert.equal(Object.values(GACHA_RARITY_RATES).reduce((sum, rate) => sum + rate, 0), 1);
  assert.equal(drawGacha(() => 0).rarity, 'N');
  assert.equal(drawGacha(() => .71).rarity, 'R');
  assert.equal(drawGacha(() => .99).rarity, 'SR');

  for (const kind of ['furniture', 'snack', 'experience']) {
    const reward = GACHA_REWARDS.find((item) => item.kind === kind);
    const draw = { id: `test-${kind}`, rewardId: reward.id, drawnAt: '2026-10-11T00:00:00.000Z' };
    const initial = { ...EMPTY_SAVE, gachaCoins: 2 };
    const granted = applyGachaDraw(initial, draw);
    assert.equal(granted.gachaCoins, 1);
    assert.equal(granted.gachaHistory.length, 1);
    assert.equal(applyGachaDraw(granted, draw), null, 'one draw cannot grant twice');
    if (kind === 'furniture') assert.equal(granted.gachaFurnitureInventory[reward.id], 1);
    if (kind === 'furniture') assert.equal(applyGachaDraw(granted, { ...draw, id: 'new-id' }), null, 'one furniture slot cannot be awarded twice');
    if (kind === 'snack') assert.equal(granted.gachaSnackInventory[reward.id], 1);
    if (kind === 'experience') assert.equal(granted.personaExp, reward.amount);
    storeSave(granted);
    const restored = loadSave();
    assert.equal(restored.gachaCoins, 1);
    assert.deepEqual(restored.gachaHistory, [draw]);
    if (kind === 'furniture') assert.equal(restored.gachaFurnitureInventory[reward.id], 1);
    if (kind === 'snack') assert.equal(restored.gachaSnackInventory[reward.id], 1);
    if (kind === 'experience') assert.equal(restored.personaExp, reward.amount);
  }
  assert.equal(applyGachaDraw({ ...EMPTY_SAVE, gachaCoins: 0 }, { id: 'empty', rewardId: GACHA_REWARDS[0].id, drawnAt: '' }), null);
  console.log('PASS gacha: rarity selection, atomic grant, no duplicate, all reward kinds, restore');
} finally {
  await vite.close();
}
