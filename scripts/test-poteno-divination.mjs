import assert from 'node:assert/strict';
import { createServer } from 'vite';

const vite = await createServer({
  configFile: false,
  root: process.cwd(),
  server: { middlewareMode: true },
  appType: 'custom',
});

try {
  const six = await vite.ssrLoadModule('/lib/potenoSixDivination.ts');
  const automatic = six.calculateAutomaticDivinations({
    birthDate: '2000-01-02',
    targetDate: '2026-09-25',
  });
  const iching = six.generateIChingResult();
  const tamamo = six.revealTamamoResult('traveler');
  const cards = six.shuffledTarotDeck().slice(0, 3).map((card, index) =>
    six.revealTarotCard(card.id, ['表層', '深層', '鍵'][index]),
  );
  const results = {
    seimei: automatic.seimei,
    taikobo: iching,
    tamamo,
    saintGermain: six.createSaintGermainResult(cards),
    asteria: automatic.asteria,
    davinci: automatic.davinci,
  };
  const request = six.buildSixDivinationRequestData({
    master: 'tamamo',
    consultation: '「星の絵本」📖の見せ方を知りたい',
    birthDate: '2000-01-02',
    goalText: '30日で「星の絵本」📖を完成させる',
    currentDay: 9,
    activityDate: '2026-09-25',
    results,
    dailyProgressRecords: [],
    journalNotes: {},
    twoDayReviews: [],
  });
  const link = six.createSixDivinationLink(request);
  assert.deepEqual(six.parseSixDivinationRequest(link), request, '六占の元結果を変更せず往復する');
  assert.match(link, /TYPE: SIX_DIVINATION_REQUEST/);
  assert.ok(request.rules.some((rule) => rule.includes('変更、引き直し、補完をしない')));
  assert.ok(request.rules.some((rule) => rule.includes('固有名詞は入力データに忠実')));

  const response = {
    type: 'SIX_DIVINATION_RESPONSE',
    master: 'tamamo',
    integratedReading: '「星の絵本」📖は、見せたい相手を先に決めると流れが整うわ。',
    potenoSummary: '読んでほしい人を一人思い浮かべて、見せ方を選ぶとよさそうなの。',
    focus: ['最初に見せる相手を決める', '三日後に読みやすさを聞く'],
  };
  const returned = six.createSixDivinationReturn(response);
  assert.deepEqual(
    six.parseSixDivinationResponse(returned, 'tamamo'),
    response,
    '日本語・絵文字を含む六占POTENO-RETURNが往復する',
  );
  assert.throws(() => six.parseSixDivinationResponse(returned, 'seimei'), /一致しません/);
  assert.equal(six.TAROT_DECK.length, 78, 'タロットは78枚');
  assert.equal(iching.lines.length, 6, '易は六爻をアプリ側で生成する');
  console.log('PASS POTENO six-divination round-trip');
} finally {
  await vite.close();
}
