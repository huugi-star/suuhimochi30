import assert from 'node:assert/strict';
import { createServer } from 'vite';

const vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true }, appType: 'custom' });
try {
  const data = await vite.ssrLoadModule('/lib/tamamoCrossroads.ts');
  const six = await vite.ssrLoadModule('/lib/potenoSixDivination.ts');
  assert.equal(data.TAMAMO_VOICES.length, 100, '日常語は100本');
  assert.equal(new Set(data.TAMAMO_VOICES.map((voice) => voice.id)).size, 100, 'voice idは一意');
  for (const theme of Object.keys(data.TAMAMO_KOTODAMA_LABELS)) {
    assert.equal(data.TAMAMO_VOICES.filter((voice) => voice.kotodama.theme === theme).length, 10, `${theme}は10本`);
  }
  for (const voice of data.TAMAMO_VOICES) assert.ok(voice.text.includes(voice.kotodama.word), `${voice.id}の言霊は日常語内にある`);
  const result = six.revealTamamoResult({ key: 'mid-traveler', form: 'traveler', label: '旅人の影' }, () => 0.605);
  assert.equal(result.calculationVersion, 'tamamo-crossroads-v1');
  assert.equal(result.passer.label, '旅人の影');
  assert.equal(result.overheardVoice.id, 'voice-061');
  assert.equal(result.kotodama.word, '追いつく');
  assert.equal(result.kotodama.theme, 'pursue');
  assert.equal(result.characterReading, `「${result.kotodama.word}」……${data.TAMAMO_KOTODAMA_READINGS.pursue[1]}`);
  assert.ok(result.characterReading.includes(result.kotodama.word), '玉藻の読みは拾った言霊を明示する');
  assert.ok(result.overheardVoice.text.includes(result.kotodama.word));
  assert.deepEqual({ ...result }, { ...result }, '保存済み結果は再表示しても変わらない');
  const legacy = { type: 'crossroads', silhouetteId: 'traveler', phrase: '保存済みの旧結果' };
  assert.equal(legacy.phrase, '保存済みの旧結果', '旧形式はそのまま扱える');
  console.log('PASS TAMAMO crossroads v1');
} finally { await vite.close(); }
