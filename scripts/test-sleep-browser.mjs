import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';

const require = createRequire(import.meta.url);
const { chromium } = require(require.resolve('playwright', {
  paths: [process.env.SUUHIMOCHI_BROWSER_MODULES || process.cwd()],
}));
// Mount the real game in isolation from the development server's SSR overlay.
const vite = await createServer({ configFile: false, root: process.cwd(), plugins: [react()], resolve: { alias: { '@': process.cwd() } }, server: { host: '127.0.0.1', port: 3002, hmr: false, ws: false }, appType: 'custom' });
await vite.listen();
const harness = await vite.transformIndexHtml('/__sleep-test', '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app/globals.css"></head><body><div id="root"></div><script type="module">import React from "react";import {createRoot} from "react-dom/client";import {SuuhimochiGame} from "/components/SuuhimochiGame.tsx";createRoot(document.getElementById("root")).render(React.createElement(React.StrictMode,null,React.createElement(SuuhimochiGame)));</script></body></html>');
const browser = await chromium.launch({ headless: true, ...(process.env.SUUHIMOCHI_BROWSER_EXECUTABLE ? { executablePath: process.env.SUUHIMOCHI_BROWSER_EXECUTABLE } : {}) });
const errors = [];
const daytime = process.env.SUUHIMOCHI_SLEEP_DAYTIME === '1';
try {
  const conversationKey = 'suuhimochi_conversation_v6_choices';
  // An older partial save also exercises the application's normal migration.
  const conversation = { version: 16, dayOverride: 16, startDate: '2026-10-15', goalText: '作品を作る' };
  const game = { birthday: '2000-01-01', introComplete: true, day: 16, state: 'sleep', mochiType: 1 };
  await mkdir('outputs/verification', { recursive: true });
  for (const mobile of process.env.SUUHIMOCHI_SLEEP_VIEWPORT ? [process.env.SUUHIMOCHI_SLEEP_VIEWPORT === 'mobile'] : [false, true]) {
    const context = await browser.newContext({ viewport: mobile ? { width: 680, height: 370 } : { width: 1365, height: 900 }, timezoneId: 'Asia/Tokyo', isMobile: mobile, hasTouch: mobile });
    const page = await context.newPage();
    page.on('pageerror', error => {
      // The isolated harness intentionally disables Vite's websocket/HMR. Its
      // own client emits this when it tries to send an HMR message; app errors
      // still fail the browser check below.
      if (error.stack?.includes('/@vite/client')) return;
      if (!errors.some(entry => entry.startsWith(error.message))) errors.push(`${error.message}\n${error.stack ?? ''}`);
    });
    const testDate = process.env.SUUHIMOCHI_SLEEP_TIME || (daytime ? '2026-10-30T14:00:00+09:00' : '2026-10-30T02:00:00+09:00');
    await page.clock.install({ time: new Date(testDate) });
    await page.addInitScript(({ game, conversation, conversationKey }) => {
      // Keep this focused test from warming unrelated game/animation assets.
      window.requestIdleCallback = () => 0;
      window.cancelIdleCallback = () => {};
      if (localStorage.getItem('__sleep_test')) return;
      localStorage.setItem('__sleep_test', '1');
      localStorage.setItem('suuhimochi-30days-save-v1', JSON.stringify(game));
      localStorage.setItem(conversationKey, JSON.stringify(conversation));
      localStorage.setItem('suuhimochi-shared-knowledge-consent-v1', JSON.stringify({ version: 1, enabled: false, decided: true }));
      localStorage.setItem('suuhimochi_room_layout_v1', JSON.stringify({ positions: { 'bed-check-yellow': { x: 14, y: 38 } }, stored: ['bed-flower-red', 'bed-leaf-green'] }));
    }, { game, conversation, conversationKey });
    await page.route('**/api/**', route => route.fulfill({ status: 503, json: { error: 'TEST_UNAVAILABLE' } }));
    await page.route('**/__sleep-test', route => route.fulfill({ contentType: 'text/html', body: harness }));
    // Deliberately load the bed after the room to exercise the restored pose.
    await page.route('**/assets/items/bed_check_yellow.png', async route => {
      await new Promise(resolve => setTimeout(resolve, 800));
      await route.continue();
    });
    const verify = async () => {
      if (daytime) {
        await page.waitForFunction(() => {
          const mochi = document.querySelector('.mochi');
          return mochi && !mochi.classList.contains('mochi-sleep');
        }, { timeout: 30000 }).catch(async error => {
          console.log('Daytime wake diagnostics', errors, await page.locator('body').innerText());
          await page.screenshot({ path: 'outputs/verification/daytime-sleep-failure.png' });
          throw error;
        });
        assert.equal(await page.locator('.world-layer-lights-out').count(), 0, 'daytime must remain lit');
        assert.equal(await page.locator('.sleep-thought-bubble').count(), 0, 'sleep talk must not appear outside the sleep window');
        const lightButton = page.locator('.room-light-toggle').filter({ hasText: '消灯' });
        assert.equal(await lightButton.isDisabled(), true, 'daytime lighting cannot be switched off');
        await page.waitForTimeout(5_500);
        assert.equal(await page.locator('.mochi-sleep').count(), 0, 'a saved daytime sleep state must not return');
        assert.equal(await page.locator('.sleep-thought-bubble').count(), 0, 'no daytime sleep dialogue');
        return;
      }
      await page.locator('.mochi-sleep').waitFor({ timeout: 30000 }).catch(async error => {
        console.log('Startup diagnostics', errors, await page.locator('body').innerText());
        await page.screenshot({ path: 'outputs/verification/sleep-startup-failure.png' });
        throw error;
      });
      await page.waitForFunction(() => {
        const bed = document.querySelector('[data-room-item-id="bed-check-yellow"]');
        const mochi = document.querySelector('.mochi-sleep');
        if (!bed || !mochi || !bed.complete || !bed.naturalWidth) return false;
        const b = bed.getBoundingClientRect(), m = mochi.getBoundingClientRect();
        // The existing 10-degree sleep rotation around the foot shifts the
        // bounding-box centre by about 9px from the mattress anchor.
        return Math.abs(m.x + m.width / 2 - (b.x + b.width * .55)) < 12 && Math.abs(m.y + m.height / 2 - (b.y + b.height * .4)) < 12;
      }).catch(async error => {
        await page.screenshot({ path: 'outputs/verification/sleep-failure.png' });
        console.log(await page.evaluate(() => [...document.querySelectorAll('.mochi-sleep, [data-room-item-id="bed-check-yellow"], .world-layer')].map(el => ({ className: el.className, style: el.getAttribute('style'), rect: el.getBoundingClientRect().toJSON() }))));
        throw error;
      });
      assert.equal(await page.locator('.world-layer-lights-out').count(), 1, 'scheduled sleep room remains unlit');
      for (const selector of ['.mochi-sleep', '.world-layer', '.mobile-room-background']) {
        assert.equal(await page.locator(selector).evaluate(el => getComputedStyle(el).transitionProperty), 'none', `${selector}: restoring a saved position must not animate`);
      }
      await page.locator('.sleep-thought-bubble').waitFor({ timeout: 15000 });
      const placement = await page.locator('.sleep-thought-bubble').evaluate(el => {
        const b = el.getBoundingClientRect(), m = document.querySelector('.mochi-sleep').getBoundingClientRect();
        return { visible: b.width > 0 && b.height > 0 && b.left >= 0 && b.right <= innerWidth + 1 && b.top >= 0 && b.bottom <= innerHeight + 1, gap: Math.max(0, b.left - m.right, m.left - b.right) };
      });
      assert.ok(placement.visible && placement.gap < 150, JSON.stringify(placement));
      assert.equal(await page.locator('.face-talk').count(), 0, 'no autonomous zoom interrupts sleep');
    };
    await page.goto(`http://127.0.0.1:${vite.config.server.port}/__sleep-test`);
    await verify();
    await page.reload();
    await verify();
    await page.waitForTimeout(500);
    await page.screenshot({ path: `outputs/verification/sleep-${mobile ? 'mobile' : 'pc'}.png` });
    console.log('PASS', mobile ? '680x370' : '1365x900', daytime ? 'saved sleep wakes in daytime; lights remain on; no sleep dialogue' : 'scheduled sleep restored on bed; lights off; sleep dialogue visible after reload');
    await context.close();
  }
  assert.deepEqual(errors, [], errors.join('\n'));
} finally {
  await browser.close();
  vite.httpServer?.closeAllConnections();
  await vite.close();
}
