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
  const assertResult = (lines, base, resulting, state, movingCount) => {
    const result = six.calculateTaikoboResult(lines);
    assert.equal(result.calculationVersion, 'taikobo-iching-v1');
    assert.equal(result.provisional, false);
    assert.deepEqual(result.lines, lines);
    assert.equal(result.baseHexagram.fullName, base);
    assert.equal(result.resultingHexagram.fullName, resulting);
    assert.equal(result.changeState.id, state);
    assert.equal(result.movingLines.length, movingCount);
    return result;
  };

  const regression = assertResult([7, 6, 8, 8, 8, 8], '地雷復', '地沢臨', 'single', 1);
  assert.equal(regression.baseHexagram.number, 24);
  assert.equal(regression.movingLines[0].position, 2);
  assert.equal(regression.movingLines[0].value, 6);
  assert.equal(regression.movingLines[0].direction, 'yin-to-yang');
  assert.equal(regression.resultingHexagram.number, 19);

  assertResult([6, 6, 6, 6, 6, 6], '坤為地', '乾為天', 'total_shift', 6);
  assertResult([9, 9, 9, 9, 9, 9], '乾為天', '坤為地', 'total_shift', 6);
  assertResult([7, 7, 7, 7, 7, 7], '乾為天', '乾為天', 'still', 0);
  assertResult([8, 8, 8, 8, 8, 8], '坤為地', '坤為地', 'still', 0);

  const fiveMoving = six.calculateTaikoboResult([6, 6, 6, 6, 8, 6]);
  assert.equal(fiveMoving.changeState.id, 'major_shift');
  assert.deepEqual(fiveMoving.stableAnchor, { position: 5, label: '中心', meaning: '判断・優先順位・局面の中心' });
  assert.equal(six.HEXAGRAM_DEFINITIONS.length, 64);
  console.log('PASS TAIKOBO iching v1');
} finally {
  await vite.close();
}
