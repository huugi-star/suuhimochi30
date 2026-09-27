import assert from 'node:assert/strict';
import { createServer } from 'vite';

const vite = await createServer({
  configFile: false,
  root: process.cwd(),
  server: { middlewareMode: true },
  appType: 'custom',
});

try {
  const poteno = await vite.ssrLoadModule('/lib/potenoLink.ts');
  const data = poteno.buildStrategyRequestData({
    strategist: 'hanbei',
    goalText: '30日で「星の絵本」📖を完成させる',
    goalType: 'MAKE',
    currentDay: 8,
    activityDate: '2026-09-25',
    dailyProgressRecords: [],
    journalNotes: {
      '2026-09-23': ['主人公の表情を描いた😊', '日本語の台詞を直した'],
    },
    twoDayReviews: [],
    strategyRecords: [],
    consultation: '次は背景と文章、どちらを優先する？🤔',
  });
  const aside = '少ない手数で流れを変えてみよう。🍠';
  const link = poteno.createStrategyRequestLink(data, aside);
  const decoded = poteno.parseStrategyRequestLink(link);
  const compact = poteno.compactStrategyRequestData(data);

  assert.deepEqual(decoded, compact, '短縮POTENO-LINKが完全に往復する');
  assert.ok(
    decoded.rules.some((rule) => rule.includes('入力にない書籍名・数字・出来事') && rule.includes('固有名詞')),
    '入力にない固有名詞や事実を推測しない指示が含まれる',
  );
  assert.equal(decoded.goal.text, '30日で「星の絵本」📖を完成させる');
  assert.equal(decoded.journal[0].done[0], '主人公の表情を描いた😊');
  assert.equal(decoded.question, '次は背景と文章、どちらを優先する？🤔');

  const response = {
    strategist: 'hanbei',
    counsel: '問題は背景の量じゃないよ。読者が進める一本の道が、まだ決まっていないんだ。📖',
    potenoSummary: 'DAY6は表情😊と台詞を進めた一方で、背景は未着手。まず文章の順番を固定するという意味だよ。',
    nextMoves: ['台詞を3つ直す', 'ページ順を一度通して読む', '背景は1場面だけ試す'],
    checkpoints: ['読みやすさ👀', 'どのページで止まったか', '予想より時間がかかった作業'],
  };
  const returned = poteno.createPotenoReturn(response);
  assert.deepEqual(
    poteno.parseStrategyResponse(returned, 'hanbei'),
    response,
    '日本語・絵文字を含むPOTENO-RETURNが完全に往復する',
  );

  const legacyResponse = {
    strategist: 'hanbei',
    summary: '旧形式の見立て',
    goodSigns: ['進捗あり'],
    concerns: ['作業が分散'],
    unknowns: ['反応待ち'],
    advice: '一つに絞る',
    actions: ['台詞を直す'],
    observe: ['作業時間'],
  };
  const migratedLegacy = poteno.parseStrategyResponse(
    poteno.createPotenoReturn(legacyResponse),
    'hanbei',
  );
  assert.equal(migratedLegacy.counsel, '一つに絞る');
  assert.match(migratedLegacy.potenoSummary, /旧形式の見立て.*良い兆候：進捗あり/s);
  assert.deepEqual(migratedLegacy.nextMoves, ['台詞を直す']);
  assert.deepEqual(migratedLegacy.checkpoints, ['作業時間']);

  const legacyBase64 = Buffer.from(JSON.stringify(data), 'utf8').toString('base64');
  const legacyLink = `📡 POTENO-LINK v1\nDATA[\n${legacyBase64}\n]`;
  assert.deepEqual(
    poteno.parseStrategyRequestLink(legacyLink),
    data,
    '従来の冗長なv1 payloadも読み込める',
  );

  const comparison = poteno.compareStrategyRequestLinkLength(data, aside);
  assert.ok(comparison.after < comparison.before, '短縮後の文字数が短い');
  console.log('PASS POTENO-LINK v1 compact round-trip');
  console.log(`before=${comparison.before} after=${comparison.after} saved=${comparison.saved} reduction=${comparison.reductionPercent}%`);
} finally {
  await vite.close();
}
