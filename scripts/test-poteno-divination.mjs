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

  // v8: buildSixDivinationRequestData の呼び出し互換引数は残っていても、
  // requestとして送るのは selectedMaster / consultation / voice / sixSignals だけ。
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

  const expectedSignals = six.buildSixDivinationSignals(results);
  assert.deepEqual(request, {
    selectedMaster: 'tamamo',
    consultation: '「星の絵本」📖の見せ方を知りたい',
    voice: six.DIVINATION_MASTER_VOICE_SUMMARIES.tamamo,
    sixSignals: expectedSignals,
  });
  assert.deepEqual(
    Object.keys(request).sort(),
    ['consultation', 'selectedMaster', 'sixSignals', 'voice'].sort(),
    'requestは4項目だけにする',
  );
  assert.equal('journal' in request, false, '日誌を送らない');
  assert.equal('goal' in request, false, '目標を送らない');
  assert.equal('currentDay' in request, false, 'DAYを送らない');
  assert.equal('activityDate' in request, false, '活動日を送らない');
  assert.equal('birthDate' in request, false, '出生情報を送らない');
  assert.equal('rules' in request, false, '長いrulesをDATAへ重複送信しない');
  assert.equal('responseFormat' in request, false, '返答形式はinstructionsへまとめる');

  const link = six.createSixDivinationLink(request);
  assert.deepEqual(
    six.parseSixDivinationRequest(link),
    request,
    '最小六占DATAを変更せず往復する',
  );
  assert.match(link, /TYPE: SIX_DIVINATION_REQUEST/);
  assert.match(link, /今回の術師：玉藻の前/);
  assert.match(link, /🍠 ポテノが玉藻の前に話を持っていきました。……なんだか楽しそうです。/);
  assert.match(link, /DATAはUTF-8 Base64です。/);
  assert.match(link, /復号した内容に従って処理してください。/);
  assert.doesNotMatch(link, /【最優先返答規則】/);
  assert.doesNotMatch(link, /最優先はconsultation/);

  const requestDataMatch = link.match(/DATA\[\s*([A-Za-z0-9+/=\s]+?)\s*\]/);
  assert.ok(requestDataMatch, 'POTENO-LINKのDATAを取得できる');
  const requestEnvelope = JSON.parse(Buffer.from(requestDataMatch[1].replace(/\s/g, ''), 'base64').toString('utf8'));
  assert.deepEqual(requestEnvelope.request, request, 'Base64内部のrequestは元データと一致する');
  assert.equal(typeof requestEnvelope.instructions, 'string');
  assert.match(requestEnvelope.instructions, /最優先はconsultation/);
  assert.match(requestEnvelope.instructions, /sixSignalsの役割を固定する/);
  assert.match(requestEnvelope.instructions, /fは太公望\+サンジェルマン伯爵の結果だけを材料にした「今日の一手」/);
  assert.match(requestEnvelope.instructions, /nは玉藻の前\+アステリアの結果だけを材料にした「今日の兆し」/);
  assert.match(requestEnvelope.instructions, /selectedMasterとvoiceは参照しない/);
  assert.match(requestEnvelope.instructions, /consultationに特に関係する2〜3個を中心に統合/);
  assert.match(requestEnvelope.instructions, /1文目は必ず次の固有の話し出し/);
  assert.match(requestEnvelope.instructions, /cの《\.\.\.》と同じ文章・同じ言い換えにせず/);
  assert.match(requestEnvelope.instructions, /\*\*\.\.\.\*\*.*必ず1回、最大2回/);
  assert.match(requestEnvelope.instructions, /《\.\.\.》.*必ず1回だけ/);
  assert.match(requestEnvelope.instructions, /JSON全体をBase64化しない/);
  assert.match(requestEnvelope.instructions, /\{"v":3,"m":<術師code>,"c":"<Base64>","f":"<Base64>","n":"<Base64>"\}/);
  assert.match(requestEnvelope.instructions, /今回の受信メッセージ：ポテノが玉藻の前のため息を受け取りました。/);

  // v3: ChatGPTが返す意味データは3本文だけ。
  // createSixDivinationReturn が c/f/n を個別Base64化して短縮ワイヤへ変換する。
  const aiResponse = {
    type: 'SIX_DIVINATION_RESPONSE',
    master: 'tamamo',
    mainComment: '今日は、急いで決めるより手元を整える日よ。📖',
    dailyMove: '一つだけ決める',
    dailyOmen: '余白',
  };

  const returned = six.createSixDivinationReturn(aiResponse);
  assert.match(returned, /^🍠 ポテノが玉藻の前のため息を受け取りました。\n\nPOTENO-RETURN v1\nTYPE: SIX_DIVINATION_RESPONSE\nDATA\[/);
  assert.doesNotMatch(returned, /今日は、急いで決めるより/);
  assert.doesNotMatch(returned, /一つだけ決める/);

  const wireMatch = returned.match(/DATA\[\s*([\s\S]*?)\s*\]$/);
  assert.ok(wireMatch, 'POTENO-RETURNのDATAを取得できる');
  const wire = JSON.parse(wireMatch[1]);
  assert.deepEqual(Object.keys(wire).sort(), ['c', 'f', 'm', 'n', 'v']);
  assert.equal(wire.v, 3);
  assert.equal(wire.m, 3, '玉藻の前の術師codeは3');
  assert.match(wire.c, /^[A-Za-z0-9+/]+={0,2}$/);
  assert.match(wire.f, /^[A-Za-z0-9+/]+={0,2}$/);
  assert.match(wire.n, /^[A-Za-z0-9+/]+={0,2}$/);

  const parsed = six.parseSixDivinationResponse(returned, 'tamamo', results);
  assert.equal(parsed.type, 'SIX_DIVINATION_RESPONSE');
  assert.equal(parsed.master, 'tamamo');
  assert.equal(parsed.integratedReading, aiResponse.mainComment);
  assert.equal(parsed.dailyMove, aiResponse.dailyMove);
  assert.equal(parsed.dailyOmen, aiResponse.dailyOmen);
  assert.equal(parsed.actionAdvice, aiResponse.dailyMove);
  assert.equal(parsed.potenoSummary, aiResponse.dailyOmen);
  assert.deepEqual(parsed.focus, [aiResponse.dailyMove], '旧UI互換のfocusには今日の一手だけを入れる');
  assert.equal(parsed.sixSigns.length, 6, '旧UI・保存互換としてsixSignsは6件を再構成する');

  const masterOrder = ['seimei', 'taikobo', 'tamamo', 'saint-germain', 'asteria', 'davinci'];
  for (const master of masterOrder) {
    const sign = parsed.sixSigns.find((item) => item.master === master);
    assert.ok(sign, `${master} の互換sixSignsがある`);
    assert.equal(sign.reading, expectedSignals[master].join('\n'));
    assert.equal(sign.action, '');
  }

  // 外側へ余計な文章が付いた返信は受け取らない。
  assert.throws(
    () => six.parseSixDivinationResponse(`受信しました\n${returned}`, 'tamamo', results),
    /POTENO-RETURN/,
  );
  assert.throws(
    () => six.parseSixDivinationResponse(`${returned}\n補足`, 'tamamo', results),
    /POTENO-RETURN/,
  );

  // 選択術師と返答側の術師codeが違えば拒否する。
  const wrongMasterReturn = six.createSixDivinationReturn({
    ...aiResponse,
    master: 'seimei',
  });
  assert.throws(
    () => six.parseSixDivinationResponse(wrongMasterReturn, 'tamamo', results),
    /一致しません/,
  );

  // v3以外の短縮ワイヤは拒否する。
  const wrongVersionReturn = returned.replace('{"v":3,', '{"v":1,');
  assert.throws(
    () => six.parseSixDivinationResponse(wrongVersionReturn, 'tamamo', results),
    /バージョン/,
  );

  // c/f/n はBase64本文でなければ拒否する。
  const invalidBase64Wire = { ...wire, c: 'これはBase64ではない' };
  const invalidBase64Return = `POTENO-RETURN v1\nTYPE: SIX_DIVINATION_RESPONSE\nDATA[\n${JSON.stringify(invalidBase64Wire)}\n]`;
  assert.throws(
    () => six.parseSixDivinationResponse(invalidBase64Return, 'tamamo', results),
    /Base64/,
  );

  assert.equal(six.TAROT_DECK.length, 78, 'タロットは78枚');
  assert.equal(iching.lines.length, 6, '易は六爻をアプリ側で生成する');

  console.log(`POTENO request JSON: ${JSON.stringify(request).length} characters`);
  console.log(`POTENO-LINK text: ${link.length} characters`);
  console.log('PASS POTENO six-divination v3 round-trip');
} finally {
  await vite.close();
}
