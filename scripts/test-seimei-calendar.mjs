import assert from 'node:assert/strict';
import { createServer } from 'vite';

const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true }, appType: 'custom' });

try {
  const six = await vite.ssrLoadModule('/lib/potenoSixDivination.ts');

  // 1. Fixed reference case from the calendar specification.
  const result = six.calculateSeimeiResult({ birthDate: '1991-05-21', targetDate: '2026-09-27' });
  assert.equal(six.gregorianToJdn(1991, 5, 21), 2448398);
  assert.equal(six.gregorianToJdn(2026, 9, 27), 2461311);
  assert.deepEqual(result.birthKanshi, { index: 27, label: '辛卯', stem: '辛', branch: '卯', element: 'metal', yinYang: 'yin' });
  assert.deepEqual(result.targetKanshi, { index: 40, label: '甲辰', stem: '甲', branch: '辰', element: 'wood', yinYang: 'yang' });
  assert.equal(result.calendar.relation, 'self-controls-day');
  assert.equal(result.calendar.yinYangRelation, 'different');
  assert.equal(result.calendar.id, 'small_move');
  assert.equal(result.calendar.label, '小さく動かす日');
  assert.equal(result.direction.id, 'southeast');
  assert.equal(result.direction.trigram, '巽');
  assert.equal(result.direction.label, '南東');
  assert.equal(result.direction.relation, 'six-harm');
  assert.equal(result.direction.condition, 'gap');
  assert.equal(result.direction.conditionLabel, '隔');
  for (const phrase of ['巽', '人や情報とのつながり', '小さく動かす', '一度確かめる']) assert.match(result.fixedReading, new RegExp(phrase));
  assert.equal(result.calculationVersion, 'seimei-calendar-v1');
  assert.equal(result.provisional, false);

  // 2–3. Repeated or differently-zoned execution cannot affect date-only arithmetic.
  const repeat = six.calculateSeimeiResult({ birthDate: '1991-05-21', targetDate: '2026-09-27' });
  assert.deepEqual(repeat, result);
  const originalTz = process.env.TZ;
  process.env.TZ = 'UTC'; const utc = six.calculateSeimeiResult({ birthDate: '1991-05-21', targetDate: '2026-09-27' });
  process.env.TZ = 'Asia/Tokyo'; const tokyo = six.calculateSeimeiResult({ birthDate: '1991-05-21', targetDate: '2026-09-27' });
  if (originalTz === undefined) delete process.env.TZ; else process.env.TZ = originalTz;
  assert.deepEqual(utc, tokyo);

  // 4. Every earthly branch maps into the eight-direction model.
  const expectedDirections = { 子: 'north', 丑: 'northeast', 寅: 'northeast', 卯: 'east', 辰: 'southeast', 巳: 'southeast', 午: 'south', 未: 'southwest', 申: 'southwest', 酉: 'west', 戌: 'northwest', 亥: 'northwest' };
  for (const [branch, direction] of Object.entries(expectedDirections)) assert.equal(six.getDirectionForBranch(branch).id, direction);

  // 5. The full five-element × yin-yang table reaches all ten calendar marks.
  const calendarCases = [
    ['same-element', 'same', 'advance'], ['same-element', 'different', 'arrange'],
    ['day-generates-self', 'same', 'receive'], ['day-generates-self', 'different', 'store'],
    ['self-generates-day', 'same', 'expand'], ['self-generates-day', 'different', 'nurture'],
    ['day-controls-self', 'same', 'defend'], ['day-controls-self', 'different', 'observe'],
    ['self-controls-day', 'same', 'decide'], ['self-controls-day', 'different', 'small_move'],
  ];
  for (const [relation, yinYang, mark] of calendarCases) assert.equal(six.getCalendarMarkId(relation, yinYang), mark);

  // 6–11. Branch relationships use the specified precedence and pair tables.
  assert.equal(six.classifyBranchRelation('子', '子'), 'same');
  for (const [left, right] of [['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未']]) assert.equal(six.classifyBranchRelation(left, right), 'six-harmony');
  for (const [left, right] of [['申', '子'], ['亥', '卯'], ['寅', '午'], ['巳', '酉']]) assert.equal(six.classifyBranchRelation(left, right), 'three-harmony');
  for (const [left, right] of [['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥']]) assert.equal(six.classifyBranchRelation(left, right), 'six-clash');
  for (const [left, right] of [['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌']]) assert.equal(six.classifyBranchRelation(left, right), 'six-harm');
  assert.equal(six.classifyBranchRelation('子', '卯'), 'none');

  // 12. A saved skeleton-v1 object remains data; no conversion or recalculation occurs.
  const legacy = { type: 'calendar-direction', calculationVersion: 'skeleton-v1', provisional: true, birthDate: '2000-01-01', targetDate: '2026-09-27', direction: '北', calendarMark: '静かに整える日' };
  const automatic = six.calculateAutomaticDivinations({ birthDate: '2000-01-01', targetDate: '2026-09-27' });
  const saved = six.createSixDivinationRecord({ response: { type: 'SIX_DIVINATION_RESPONSE', master: 'seimei', integratedReading: '保存済み', potenoSummary: '保存済み', focus: [] }, currentDay: 1, consultation: '', results: { seimei: legacy, taikobo: six.generateIChingResult(), tamamo: six.revealTamamoResult('traveler'), saintGermain: { type: 'tarot', cards: six.shuffledTarotDeck().slice(0, 3).map((card, index) => six.revealTarotCard(card.id, ['表層', '深層', '鍵'][index])) }, asteria: automatic.asteria, davinci: automatic.davinci } });
  assert.deepEqual(saved.sixResults.seimei, legacy);
  console.log('PASS Seimei calendar-direction v1');
} finally {
  await vite.close();
}
