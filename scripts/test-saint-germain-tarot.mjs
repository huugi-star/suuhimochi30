import assert from 'node:assert/strict';
import { createServer } from 'vite';

const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true }, appType: 'custom' });
try {
  const six = await vite.ssrLoadModule('/lib/potenoSixDivination.ts');
  assert.equal(six.TAROT_DECK.length, 78, '78枚を維持する');
  for (const card of six.TAROT_DECK) {
    assert.ok(card.coreTheme && card.uprightMeaning && card.reversedMeaning, `${card.name}に意味を持たせる`);
  }
  const cards = [
    six.revealTarotCard('major-0', '表層', () => .1),
    six.revealTarotCard('杯-1', '深層', () => .9),
    six.revealTarotCard('剣-3', '鍵', () => .1),
  ];
  assert.equal(cards[0].orientation, 'upright');
  assert.equal(cards[1].orientation, 'reversed');
  const result = six.createSaintGermainResult(cards);
  assert.equal(result.calculationVersion, 'saint-germain-three-card-v1');
  assert.equal(result.provisional, false);
  assert.match(result.fixedMeaning.surface, /表に出ている心理/);
  assert.match(result.fixedMeaning.depth, /その下では/);
  assert.match(result.fixedMeaning.key, /理解する鍵/);
  assert.ok(result.characterReading.includes(cards[0].coreTheme));
  assert.ok(result.characterReading.includes(cards[1].coreTheme));
  assert.ok(result.characterReading.includes(cards[2].coreTheme));
  assert.ok([...result.characterReading].length >= 40 && [...result.characterReading].length <= 70, '伯爵の読みを40〜70字の短い物語にする');
  assert.equal(result.cards[1].orientationMeaning, six.TAROT_DECK.find((card) => card.id === '杯-1').reversedMeaning);
  console.log('PASS SAINT GERMAIN tarot v1');
} finally { await vite.close(); }
