import assert from 'node:assert/strict';
import { createServer } from 'vite';

const requests = new Map();
const behavior = new Map();

class FakeImage {
  onload = null;
  onerror = null;

  set src(value) {
    requests.set(value, (requests.get(value) ?? 0) + 1);
    const selected = behavior.get(value) ?? { result: 'load', delay: 0 };
    if (selected.result === 'hang') return;
    setTimeout(() => {
      if (selected.result === 'error') this.onerror?.(new Error('mock failure'));
      else this.onload?.();
    }, selected.delay);
  }

  async decode() {}
}

globalThis.Image = FakeImage;
globalThis.window = {
  setTimeout,
  clearTimeout,
};
globalThis.document = { visibilityState: 'visible' };
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: { connection: { downlink: 4.2, rtt: 4600, effectiveType: '4g', saveData: false } },
});

const vite = await createServer({
  configFile: false,
  root: process.cwd(),
  server: { middlewareMode: true },
  appType: 'custom',
});

try {
  const {
    getNetworkPreloadProfile,
    preloadCriticalImages,
    preloadImage,
  } = await vite.ssrLoadModule('/lib/imagePreload.ts');

  assert.equal(getNetworkPreloadProfile().constrained, true);
  assert.equal(getNetworkPreloadProfile().criticalConcurrency, 3);

  behavior.set('/cache-test.png', { result: 'load', delay: 2 });
  await preloadImage('/cache-test.png', { timeoutMs: 50 });
  await preloadImage('/cache-test.png', { timeoutMs: 50 });
  assert.equal(requests.get('/cache-test.png'), 1, 'loaded images should be reused');

  behavior.set('/slow-ok.png', { result: 'load', delay: 15 });
  behavior.set('/failed.png', { result: 'error', delay: 2 });
  behavior.set('/hung.png', { result: 'hang', delay: 0 });
  const progress = [];
  const result = await preloadCriticalImages(
    ['/slow-ok.png', '/failed.png', '/hung.png'],
    (loaded, total) => progress.push([loaded, total]),
    { concurrency: 2, timeoutMs: 30 },
  );
  assert.deepEqual(result.results.map((item) => item.status), ['fulfilled', 'rejected', 'rejected']);
  assert.deepEqual(progress.at(-1), [3, 3]);
  console.log('PASS image preload: constrained profile, cache reuse, failure isolation, timeout');
} finally {
  await vite.close();
}
