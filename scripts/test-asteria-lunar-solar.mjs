import assert from 'node:assert/strict';
import { createServer } from 'vite';

const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true }, appType: 'custom' });

try {
  const six = await vite.ssrLoadModule('/lib/potenoSixDivination.ts');
  const input = { birthDate: '1991-05-21', targetDate: '2026-09-27' };
  const result = six.calculateAsteriaResult(input);

  // Fixed, date-only reference: all visible top-level layers are stable and structured.
  assert.equal(result.calculationVersion, 'asteria-lunar-solar-v1');
  assert.equal(result.provisional, false);
  assert.deepEqual(result.birthSun, { longitude: 59.59, sign: 'taurus', label: '牡牛座', calculationMode: 'date-reference', assumedTime: '12:00 JST', nearSignBoundary: true, boundaryDistance: .41 });
  assert.equal(result.moonPhase.id, 'full');
  assert.equal(result.moonSign.id, 'aries');
  assert.equal(result.personalAspect.id, 'none');
  assert.equal(result.solarCycle.id, 'development');
  assert.match(result.fixedReading, /月は満月/);
  assert.match(result.fixedReading, /牡羊座/);
  assert.match(result.fixedReading, /広げていく途中/);
  assert.doesNotMatch(result.fixedReading, /引っ掛かり|接点|反対側/);
  assert.match(result.methodNote, /出生日と対象日の12:00 JST/);
  assert.equal(result.moonPhase.action, 'まだ動かしていないことを、一度照らして確かめる');
  assert.equal('buildAction' in result.moonPhase, false, '計算結果は定義関数名ではなくactionを保持する');

  // Repeated execution and process timezone cannot change a civil-date calculation.
  assert.deepEqual(six.calculateAsteriaResult(input), result);
  const originalTz = process.env.TZ;
  process.env.TZ = 'UTC'; const utc = six.calculateAsteriaResult(input);
  process.env.TZ = 'Asia/Tokyo'; const tokyo = six.calculateAsteriaResult(input);
  if (originalTz === undefined) delete process.env.TZ; else process.env.TZ = originalTz;
  assert.deepEqual(utc, tokyo);

  // The daily lunar sweep reaches every phase and every zodiac sign without any random choice.
  const phases = new Set(); const signs = new Set(); const aspects = new Set(); const cycles = new Set();
  for (let year = 2026; year <= 2027; year += 1) for (let month = 1; month <= 12; month += 1) for (let day = 1; day <= 28; day += 1) {
    const targetDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const daily = six.calculateAsteriaResult({ birthDate: '2000-01-02', targetDate });
    phases.add(daily.moonPhase.id); signs.add(daily.moonSign.id); aspects.add(daily.personalAspect.id); cycles.add(daily.solarCycle.id);
  }
  assert.equal(phases.size, 8, '月相8段階');
  assert.equal(signs.size, 12, '月星座12種');
  for (const expected of ['conjunction', 'sextile', 'square', 'trine', 'opposition', 'none']) assert.ok(aspects.has(expected), `主要星相 ${expected}`);
  assert.equal(cycles.size, 8, '太陽年間巡8段階');

  const dateOnly = six.calculateAutomaticDivinations({ birthDate: '2000-01-02', targetDate: '2026-09-25' }).asteria;
  assert.equal(dateOnly.calculationVersion, 'asteria-lunar-solar-v1');

  // Regression fixture: a date-reference Scorpio result stays fixed while exposing boundary uncertainty only as metadata.
  const boundaryFixture = six.calculateAsteriaResult({ birthDate: '1991-10-24', targetDate: '2026-09-27' });
  assert.equal(boundaryFixture.birthSun.longitude, 210.21);
  assert.equal(boundaryFixture.birthSun.sign, 'scorpio');
  assert.equal(boundaryFixture.birthSun.nearSignBoundary, true);
  assert.equal(boundaryFixture.birthSun.boundaryDistance, .21);
  assert.equal(boundaryFixture.moonPhase.id, 'full');
  assert.equal(boundaryFixture.moonSign.id, 'aries');
  assert.equal(boundaryFixture.personalAspect.id, 'none');
  assert.equal(boundaryFixture.solarCycle.id, 'closure');

  // Old saved skeleton data remains intact and is not recalculated during record creation.
  const legacy = { type: 'astrology', calculationVersion: 'skeleton-v1', provisional: true, birthDate: '2000-01-02', birthplace: '東京都', sunSign: '山羊座', starMarker: '薄明の星図' };
  const automatic = six.calculateAutomaticDivinations({ birthDate: '2000-01-02', targetDate: '2026-09-25' });
  const saved = six.createSixDivinationRecord({ response: { type: 'SIX_DIVINATION_RESPONSE', master: 'asteria', integratedReading: '保存済み', potenoSummary: '保存済み', focus: [] }, currentDay: 1, consultation: '', results: { seimei: automatic.seimei, taikobo: six.generateIChingResult(), tamamo: six.revealTamamoResult('traveler'), saintGermain: { type: 'tarot', cards: six.shuffledTarotDeck().slice(0, 3).map((card, index) => six.revealTarotCard(card.id, ['表層', '深層', '鍵'][index])) }, asteria: legacy, davinci: automatic.davinci } });
  assert.deepEqual(saved.sixResults.asteria, legacy);
  console.log('PASS Asteria lunar-solar v1');
} finally {
  await vite.close();
}
