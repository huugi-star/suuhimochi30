import assert from 'node:assert/strict';
import { createServer } from 'vite';

const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true }, appType: 'custom' });

try {
  const six = await vite.ssrLoadModule('/lib/potenoSixDivination.ts');
  const reference = six.calculateDaVinciResult('1991-05-21');
  assert.equal(reference.calculationVersion, 'davinci-structure-v1');
  assert.equal(reference.provisional, false);
  assert.deepEqual(reference.core.reductionPath, [28, 10, 1]);
  assert.equal(reference.core.number, 1);
  assert.deepEqual(reference.style.reductionPath, [26, 8]);
  assert.equal(reference.style.number, 8);
  assert.equal(reference.relation.id, 'leap');
  assert.equal(reference.geometry.coreShape, 'point');
  assert.equal(reference.geometry.styleShape, 'octagon');
  assert.match(reference.fixedReading, /途中の工程を一度並べる/);
  assert.match(reference.characterReading, /最初の点/);

  // No current date, location or browser zone participates in a natal blueprint.
  assert.deepEqual(six.calculateDaVinciResult('1991-05-21'), reference);
  const originalTz = process.env.TZ;
  process.env.TZ = 'UTC'; const utc = six.calculateDaVinciResult('1991-05-21');
  process.env.TZ = 'Asia/Tokyo'; const tokyo = six.calculateDaVinciResult('1991-05-21');
  if (originalTz === undefined) delete process.env.TZ; else process.env.TZ = originalTz;
  assert.deepEqual(utc, tokyo);

  // Masters stop only on CORE and preserve their base geometry and relation number.
  const eleven = six.calculateDaVinciResult('2000-01-08');
  const twentyTwo = six.calculateDaVinciResult('1990-01-02');
  const thirtyThree = six.calculateDaVinciResult('1999-01-04');
  assert.deepEqual(eleven.core.reductionPath, [11]); assert.equal(eleven.core.number, 11); assert.equal(eleven.core.baseNumber, 2); assert.equal(eleven.core.geometry, 'double-line');
  assert.deepEqual(twentyTwo.core.reductionPath, [22]); assert.equal(twentyTwo.core.number, 22); assert.equal(twentyTwo.core.baseNumber, 4); assert.equal(twentyTwo.core.geometry, 'double-square');
  assert.deepEqual(thirtyThree.core.reductionPath, [33]); assert.equal(thirtyThree.core.number, 33); assert.equal(thirtyThree.core.baseNumber, 6); assert.equal(thirtyThree.core.geometry, 'double-hexagon');
  assert.equal(six.reduceStyle(11), 2); assert.equal(six.reduceStyle(22), 4); assert.equal(six.reduceStyle(33), 6);

  // Relation precedence uses effective base numbers: overlap, then mirror, then layers.
  assert.equal(six.getDaVinciRelation(4, 4), 'overlap');
  assert.equal(six.getDaVinciRelation(1, 8), 'leap');
  assert.equal(six.getDaVinciRelation(8, 1), 'compression');
  assert.equal(six.getDaVinciRelation(1, 9), 'mirror');
  assert.equal(six.getDaVinciRelation(4, 6), 'mirror');
  assert.equal(six.getDaVinciRelation(4, 5), 'same_layer');
  assert.equal(six.getDaVinciRelation(3, 4), 'development');
  assert.equal(six.getDaVinciRelation(8, 4), 'reduction');

  // Required Master fixtures: relation always uses the retained CORE base number.
  for (const [birthDate, master, base, style] of [['1980-01-19', 11, 2, 2], ['1980-01-03', 22, 4, 4], ['1980-04-29', 33, 6, 6]]) {
    const result = six.calculateDaVinciResult(birthDate);
    assert.equal(result.core.number, master); assert.equal(result.core.isMaster, true); assert.equal(result.core.baseNumber, base); assert.equal(result.core.effectiveNumber, base);
    assert.equal(result.style.number, style); assert.equal(result.relation.id, 'overlap');
  }

  // Regression fixture: the same-layer wording must not imply formation or repeat the CORE lead-in.
  const sameLayer = six.calculateDaVinciResult('1991-10-24');
  assert.deepEqual(sameLayer.core.reductionPath, [27, 9]); assert.equal(sameLayer.core.number, 9); assert.equal(sameLayer.core.effectiveNumber, 9); assert.equal(sameLayer.core.isMaster, false); assert.equal(sameLayer.core.geometry, 'circle'); assert.equal(sameLayer.core.layer, 'integration');
  assert.deepEqual(sameLayer.style.reductionPath, [34, 7]); assert.equal(sameLayer.style.number, 7); assert.equal(sameLayer.style.geometry, 'heptagram'); assert.equal(sameLayer.style.layer, 'integration');
  assert.equal(sameLayer.relation.id, 'same_layer'); assert.equal(sameLayer.relation.label, '同系列');
  assert.equal((sameLayer.fixedReading.match(/中心には/g) ?? []).length, 1);
  assert.doesNotMatch(sameLayer.fixedReading, /近い距離のまま形に/);

  // Old results are retained verbatim rather than being recalculated on record creation.
  const legacy = { type: 'numerology', calculationVersion: 'skeleton-v1', provisional: true, birthDate: '2000-01-01', lifePathNumber: 3, geometry: '三角形' };
  const automatic = six.calculateAutomaticDivinations({ birthDate: '2000-01-01', targetDate: '2026-09-27' });
  const saved = six.createSixDivinationRecord({ response: { type: 'SIX_DIVINATION_RESPONSE', master: 'davinci', integratedReading: '保存済み', potenoSummary: '保存済み', focus: [] }, currentDay: 1, consultation: '', results: { seimei: automatic.seimei, taikobo: six.generateIChingResult(), tamamo: six.revealTamamoResult('traveler'), saintGermain: { type: 'tarot', cards: six.shuffledTarotDeck().slice(0, 3).map((card, index) => six.revealTarotCard(card.id, ['表層', '深層', '鍵'][index])) }, asteria: automatic.asteria, davinci: legacy } });
  assert.deepEqual(saved.sixResults.davinci, legacy);
  console.log('PASS Da Vinci structure v1');
} finally {
  await vite.close();
}
