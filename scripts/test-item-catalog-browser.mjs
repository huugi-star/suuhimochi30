import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { build } from 'esbuild';
const root = process.cwd(),
  require = createRequire(import.meta.url);
const { chromium } = require(
  require.resolve('playwright', {
    paths: [process.env.SUUHIMOCHI_BROWSER_MODULES || root],
  }),
);
await build({
  entryPoints: ['scripts/fixtures/item-catalog.jsx'],
  bundle: true,
  outfile: 'outputs/verification/catalog-runtime.js',
  jsx: 'automatic',
  alias: { '@': root },
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'error',
});
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost').pathname;
    const target = path.join(
      root,
      url.startsWith('/assets/') ? 'public' + url : url,
    );
    const data = await readFile(target);
    res.setHeader(
      'Content-Type',
      url.endsWith('.js')
        ? 'text/javascript'
        : url.endsWith('.css')
          ? 'text/css'
          : url.endsWith('.png')
            ? 'image/png'
            : 'application/octet-stream',
    );
    res.end(data);
  } catch {
    res.statusCode = 404;
    res.end();
  }
});
await new Promise((r) => server.listen(3006, '127.0.0.1', r));
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.SUUHIMOCHI_BROWSER_EXECUTABLE,
});
try {
  for (const [width, height] of [
    [1365, 900],
    [390, 844],
    [680, 370],
    [650, 350],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      hasTouch: width < 1000,
      isMobile: width < 1000,
    });
    const errors = [];
    page.on('pageerror', (e) => {
      if (!errors.includes(e.message)) {
        errors.push(e.message);
        console.log('PAGE ERROR', e.stack);
      }
    });
    page.on('requestfailed', (r) =>
      console.log('REQUEST FAILED', r.url(), r.failure()?.errorText),
    );
    console.log('PAGE ready', width, height);
    await page.route('**/__catalog', async (r) =>
      r.fulfill({
        contentType: 'text/html',
        body: '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app/globals.css"><link rel="stylesheet" href="/outputs/verification/catalog-runtime.css"></head><body><div id="root"></div><script type="module" src="/outputs/verification/catalog-runtime.js"></script></body></html>',
      }),
    );
    await page.goto('http://127.0.0.1:3006/__catalog', {
      waitUntil: 'domcontentloaded',
    });
    const panel = page.locator('.furniture-catalog'),
      list = page.locator('.item-card-list');
    await panel.waitFor({ timeout: 20000 }).catch(async (e) => {
      console.log('BODY', await page.locator('body').innerText());
      await page.screenshot({
        path: 'outputs/verification/catalog-failure.png',
      });
      throw e;
    });
    assert.equal(await page.locator('.item-tile-special').count(), 1);
    assert.equal(
      await page.getByText('固定アイテム', { exact: true }).count(),
      1,
    );
    assert.equal(await page.getByText('移動のみ・収納不可').count(), 0);
    await page.getByRole('tab', { name: /収納中/ }).click();
    assert.equal(await page.locator('.item-tile').count(), 18);
    for (const tile of await page.locator('.item-tile').all()) {
      const image = tile.locator('img'),
        name = tile.locator('.item-tile-name');
      if (await image.count()) {
        const a = await image.boundingBox(),
          b = await name.boundingBox();
        assert.ok(a.y + a.height <= b.y + 1, 'image and name do not overlap');
      }
    }
    const header = await page.locator('.item-tabs').boundingBox(),
      bounds = await panel.boundingBox();
    assert.ok(
      bounds.x >= 0 &&
        bounds.y >= 0 &&
        bounds.x + bounds.width <= width + 1 &&
        bounds.y + bounds.height <= height + 1,
    );
    assert.ok(await list.evaluate((el) => el.scrollHeight > el.clientHeight));
    const b = await list.boundingBox();
    if (width === 1365) {
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(350);
    } else {
      const cdp = await page.context().newCDPSession(page);
      const x = b.x + b.width * 0.6;
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchStart',
        touchPoints: [{ x, y: b.y + b.height - 16 }],
      });
      for (let i = 1; i <= 8; i++)
        await cdp.send('Input.dispatchTouchEvent', {
          type: 'touchMove',
          touchPoints: [
            { x, y: b.y + b.height - 16 - ((b.height - 36) * i) / 8 },
          ],
        });
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchEnd',
        touchPoints: [],
      });
      await page.waitForTimeout(500);
    }
    assert.ok(
      await list.evaluate((el) => el.scrollTop > 0),
      'wheel/swipe scrolls',
    );
    assert.equal((await page.locator('.item-tabs').boundingBox()).y, header.y);
    assert.equal((await panel.boundingBox()).y, bounds.y);
    await list.evaluate((el) => (el.scrollTop = el.scrollHeight));
    await page.waitForTimeout(300);
    assert.ok(await page.locator('.item-tile').last().isVisible());
    await list.evaluate((el) => (el.scrollTop = 0));
    await page.getByRole('tab', { name: /配置中/ }).click();
    await page.screenshot({
      path: `outputs/verification/catalog-placed-${width}.png`,
    });
    await page.getByRole('tab', { name: /収納中/ }).click();
    await page.screenshot({
      path: `outputs/verification/catalog-stored-${width}.png`,
    });
    await page.locator('.item-tile-action').first().click();
    assert.equal(await page.locator('.furniture-catalog').count(), 0);
    assert.equal(await page.locator('.item-mini-toolbar').count(), 1);
    assert.equal(await page.getByText('配置位置を調整中').count(), 1);
    assert.equal(
      await page
        .locator('#result')
        .evaluate((el) => JSON.parse(el.textContent).selected),
      'f0',
    );
    assert.equal(
      await page
        .locator('#result')
        .evaluate((el) => JSON.parse(el.textContent).moved),
      true,
    );
    await page.getByRole('button', { name: '配置を終える' }).click();
    assert.equal(await page.locator('.item-mini-toolbar').count(), 0);
    assert.equal(
      await page
        .locator('#result')
        .evaluate((el) => JSON.parse(el.textContent).closed),
      true,
    );
    assert.deepEqual(errors, []);
    console.log(
      'PASS',
      width,
      height,
      '18 items, fixed tabs, wheel/touch scroll, placement enters room mode, finish placement, post tag, no clipping',
    );
    await page.close();
  }
} finally {
  await browser.close();
  server.closeAllConnections();
  await new Promise((r) => server.close(r));
}
