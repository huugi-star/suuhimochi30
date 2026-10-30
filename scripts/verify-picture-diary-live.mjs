// Real Worker integration. Secret values, cookies, credentials and image URLs are never logged.
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { createServer } from 'vite';
for (const file of ['.env.development.local', '.env.local', '.env.development', '.env']) {
  if (fs.existsSync(file)) { try { process.loadEnvFile(file); } catch { console.log('BLOCKED: ENV_PARSE'); process.exit(2); } }
}
if (![process.env.DIARY_API_TOKEN, process.env.DIARY_SESSION_SECRET].every((value) => value && value.length >= 32)) {
  console.log('BLOCKED: SERVER_ENV_NOT_CONFIGURED'); process.exit(2);
}
const base = new URL(process.env.SUUHIMOCHI_TEST_URL ?? 'http://localhost:3000');
if (!['localhost', '127.0.0.1', '[::1]'].includes(base.hostname) && base.protocol !== 'https:') { console.log('BLOCKED: HTTPS_REQUIRED'); process.exit(2); }
const directory = path.resolve('node_modules/.cache/picture-diary-live'); fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
const lock = path.join(directory, '.lock'); let locked = false, vite;
const report = { checkedAt: new Date().toISOString(), checks: [] }; let browserStage = '';
const codes = new Set(['OK', 'NOT_GENERATED', 'GENERATING', 'GENERATED', 'FAILED', 'UNAVAILABLE', 'UNAUTHORIZED', 'UNAUTHENTICATED', 'FORBIDDEN', 'INVALID_REQUEST', 'AUTH_NOT_CONFIGURED', 'DIARY_API_NOT_CONFIGURED', 'DIARY_API_SECRET_TOO_SHORT', 'TWO_LEARNED_KEYWORDS_REQUIRED', 'ONLY_YESTERDAY_ALLOWED']);
const record = (stage, response, data) => { const row = { stage, http: response.status, status: codes.has(data?.status) ? data.status : 'UNKNOWN' }; report.checks.push(row); console.log(JSON.stringify(row)); };
class LiveFailure extends Error { constructor(code) { super(code); this.code = code; } }
try {
  fs.writeFileSync(lock, '', { flag: 'wx', mode: 0o600 }); locked = true;
  vite = await createServer({ configFile: false, root: process.cwd(), server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' });
  const { createDiaryAuth } = await vite.ssrLoadModule('/lib/pictureDiaryAuth.ts');
  const { missionDateKey, shiftMissionDate } = await vite.ssrLoadModule('/lib/dailyMissions.ts');
  const { INFO_HUB_ORIGIN } = await vite.ssrLoadModule('/lib/externalTopics.ts');
  const { diaryImageUrl } = await vite.ssrLoadModule('/lib/pictureDiary.ts');
  const stateFile = path.join(directory, 'private-session.json');
  // Explicit synthetic integration fixture, isolated from the player's save. No invented learning timestamps.
  const yesterday = shiftMissionDate(missionDateKey(), -1);
  const state = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : {
    localCompanionId: `live-test-${randomUUID()}`, startDate: yesterday, diaryDate: yesterday, attempted: false,
    learnedWords: [{ word: '野球', majorCategory: 'スポーツ・運動', subCategory: '競技・種目' }, { word: 'サッカー', majorCategory: 'スポーツ・運動', subCategory: '競技・種目' }],
  };
  const previousReportFile = path.join(directory, 'report.json');
  const previousReport = fs.existsSync(previousReportFile) ? JSON.parse(fs.readFileSync(previousReportFile, 'utf8')) : null;
  // A material rejection never called generate. The fixed fixture can safely proceed once after that result.
  const materialRejection = previousReport?.reason === 'MATERIALS_NOT_AVAILABLE';
  if (materialRejection) state.learnedWords = [{ word: '野球', majorCategory: 'スポーツ・運動', subCategory: '競技・種目' }, { word: 'サッカー', majorCategory: 'スポーツ・運動', subCategory: '競技・種目' }];
  const save = () => fs.writeFileSync(stateFile, JSON.stringify(state), { mode: 0o600 });
  if (state.diaryDate !== yesterday) throw new LiveFailure('TEST_FIXTURE_DATE_CHANGED');
  const app = async (pathname, body, useCookie = true) => {
    const response = await fetch(new URL(pathname, base), { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(100000),
      headers: { origin: base.origin, 'content-type': 'application/json', ...(useCookie && state.cookie ? { cookie: state.cookie } : {}) }, body: JSON.stringify(body) });
    let data; try { data = await response.json(); } catch { throw new LiveFailure('INVALID_APP_RESPONSE'); }
    return { response, data };
  };
  const session = await app('/api/picture-diary/session', { consent: true, localCompanionId: state.localCompanionId, startDate: state.startDate }); record('anonymous_session', session.response, session.data);
  if (!session.response.ok || typeof session.data.credential !== 'string') throw new LiveFailure('APP_SESSION_CONFIGURATION');
  const cookie = session.response.headers.get('set-cookie'); if (!cookie || !cookie.includes('HttpOnly') || !cookie.includes('Secure') || !cookie.includes('SameSite=Strict')) throw new LiveFailure('COOKIE_FLAGS');
  state.cookie = cookie.split(';')[0]; state.credential = session.data.credential; save();
  const request = new Request(new URL('/api/picture-diary', base), { method: 'POST', headers: { origin: base.origin, cookie: state.cookie } });
  const identity = createDiaryAuth(process.env.DIARY_SESSION_SECRET).verify(request, state.credential);
  const query = new URLSearchParams({ ownerId: identity.ownerId, companionId: identity.companionId, diaryDate: state.diaryDate });
  const lookupResponse = await fetch(`${INFO_HUB_ORIGIN}/diary/lookup?${query}`, { redirect: 'error', signal: AbortSignal.timeout(10000), headers: { authorization: `Bearer ${process.env.DIARY_API_TOKEN}`, accept: 'application/json' } });
  const lookup = await lookupResponse.json(); record('worker_authenticated_lookup', lookupResponse, lookup);
  if (![200, 202, 404].includes(lookupResponse.status)) throw new LiveFailure('WORKER_AUTH_OR_CONFIGURATION');
  const input = { consent: true, credential: state.credential, diaryDate: state.diaryDate, learnedWords: state.learnedWords };
  for (const [stage, payload, withCookie, expected] of [['consent_off', { ...input, consent: false }, true, 400], ['no_session', { ...input, lookupOnly: true }, false, 401], ['forged_owner', { ...input, ownerId: 'forged-owner' }, true, 400]]) {
    const result = await app('/api/picture-diary', payload, withCookie); record(stage, result.response, result.data);
    if (result.response.status !== expected) throw new LiveFailure('AUTHORIZATION_CHECK');
  }
  const mayGenerate = process.argv.includes('--generate') && (!state.attempted || materialRejection) && lookupResponse.status === 404 && lookup.status === 'NOT_GENERATED';
  if (mayGenerate) { state.attempted = true; save(); }
  const result = await app('/api/picture-diary', { ...input, lookupOnly: !mayGenerate }); record(mayGenerate ? 'app_plan_and_generate' : 'app_lookup_only', result.response, result.data);
  const imageUrl = diaryImageUrl(result.data.imageUrl);
  if (!imageUrl) {
    if (!process.argv.includes('--generate') && lookupResponse.status === 404) { report.result = 'READ_ONLY_OK'; console.log('READ_ONLY_OK: no image generation requested.'); }
    else throw new LiveFailure(result.data.status === 'TWO_LEARNED_KEYWORDS_REQUIRED' ? 'MATERIALS_NOT_AVAILABLE' : 'IMAGE_NOT_READY');
  } else {
    const image = await fetch(imageUrl, { redirect: 'error', signal: AbortSignal.timeout(15000), referrerPolicy: 'no-referrer' });
    const bytes = Buffer.from(await image.arrayBuffer());
    if (!image.ok || !image.headers.get('content-type')?.startsWith('image/') || bytes.length < 100 || bytes.length > 20000000) throw new LiveFailure('IMAGE_DOWNLOAD');
    fs.writeFileSync(path.join(directory, image.headers.get('content-type')?.includes('jpeg') ? 'generated-image.jpg' : 'generated-image.png'), bytes, { mode: 0o600 });
    const repeated = await app('/api/picture-diary', { ...input, lookupOnly: true }); record('repeat_lookup_only', repeated.response, repeated.data);
    if (!diaryImageUrl(repeated.data.imageUrl)) throw new LiveFailure('REPEAT_LOOKUP');
    const again = await fetch(diaryImageUrl(repeated.data.imageUrl), { redirect: 'error', signal: AbortSignal.timeout(15000), referrerPolicy: 'no-referrer' });
    const identical = createHash('sha256').update(bytes).digest('hex') === createHash('sha256').update(Buffer.from(await again.arrayBuffer())).digest('hex');
    if (!identical) throw new LiveFailure('IMAGE_CHANGED');
    report.imageVerified = true; report.repeatImageIdentical = true; report.result = 'PASS'; console.log('PASS: live image retrieved; repeat lookup returned the same image without generation.');
    if (process.argv.includes('--browser')) {
      const require = createRequire(import.meta.url), { chromium } = require(process.env.SUUHIMOCHI_BROWSER_PACKAGE || require.resolve('playwright', { paths: [process.env.SUUHIMOCHI_BROWSER_MODULES || process.cwd()] }));
      const { EMPTY_SAVE } = await vite.ssrLoadModule('/lib/storage.ts');
      const { SuuhimochiConversation } = await vite.ssrLoadModule('/lib/wordMemory.ts');
      const { PICTURE_DIARY_DATA_KEY, PICTURE_DIARY_CONSENT_KEY } = await vite.ssrLoadModule('/lib/pictureDiary.ts');
      const browser = await chromium.launch({ headless: true, ...(process.env.SUUHIMOCHI_BROWSER_EXECUTABLE ? { executablePath: process.env.SUUHIMOCHI_BROWSER_EXECUTABLE } : {}) });
      try {
        for (const mobile of [false, true]) {
          const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1365, height: 900 }, timezoneId: 'Asia/Tokyo', isMobile: mobile, hasTouch: mobile });
          const page = await context.newPage(), uiErrors = []; page.on('pageerror', () => uiErrors.push('PAGE_ERROR'));
          const saved = new Map(), local = { getItem: (key) => saved.get(key) ?? null, setItem: (key, value) => saved.set(key, value), removeItem: (key) => saved.delete(key) };
          const talk = new SuuhimochiConversation({ storage: local }); talk.setGoal('絵日記の結合テスト');
          const conversation = JSON.parse(local.getItem('suuhimochi_conversation_v6_choices'));
          const game = { ...structuredClone(EMPTY_SAVE), introComplete: true, birthday: '2000-01-01', currentMochiId: state.localCompanionId, day: 1 };
          await page.addInitScript(({ game, conversation, dataKey, consentKey, date, id, imageUrl, expiresAt }) => {
            localStorage.setItem('suuhimochi-30days-save-v1', JSON.stringify(game)); localStorage.setItem('suuhimochi_conversation_v6_choices', JSON.stringify(conversation));
            localStorage.setItem('suuhimochi-shared-knowledge-consent-v1', JSON.stringify({ enabled: false, decided: true, version: 1 }));
            // Display an already generated image in an isolated save; UI startup cannot generate another.
            localStorage.setItem(consentKey, JSON.stringify({ enabled: false, since: null }));
            localStorage.setItem(dataKey, JSON.stringify({ days: [], credentials: {}, records: [{ localCompanionId: id, diaryDate: date, attemptedOn: date, status: 'GENERATED', imageUrl, expiresAt }] }));
          }, { game, conversation, dataKey: PICTURE_DIARY_DATA_KEY, consentKey: PICTURE_DIARY_CONSENT_KEY, date: state.diaryDate, id: state.localCompanionId, imageUrl, expiresAt: result.data.expiresAt });
          await page.route('**/api/external-topics*', (route) => route.fulfill({ json: { schemaVersion: 2, fetchedAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600000).toISOString(), topics: [] } }));
          await page.route('**/api/external-briefs*', (route) => route.fulfill({ json: { schemaVersion: 1, updatedAt: new Date().toISOString(), items: [] } }));
          browserStage = mobile ? 'mobile_page_load' : 'desktop_page_load'; await page.goto(base.href); await (mobile ? page.getByRole('button', { name: '縦画面で日誌を開く', exact: true }) : page.locator('.game-status')).waitFor({ timeout: 40000 });
          browserStage = mobile ? 'mobile_journal_open' : 'desktop_journal_open'; if (mobile) await page.getByRole('button', { name: '縦画面で日誌を開く', exact: true }).click();
          else { const handle = page.locator('.mobile-room-menu-handle'); if (await handle.isVisible() && !(await page.locator('.room-nav').getAttribute('class')).includes('mobile-nav-open')) await handle.click(); }
          if (!mobile) await page.getByRole('button', { name: '日誌', exact: true }).click();
          browserStage = mobile ? 'mobile_image' : 'desktop_image'; const card = page.getByRole('region', { name: 'ことばの絵日記', exact: true }); await card.waitFor(); await page.waitForTimeout(400);
          await page.waitForFunction(() => { const image = document.querySelector('[aria-label="ことばの絵日記"] img'); return image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0; }, undefined, { timeout: 20000 });
          await page.locator('.journal-page').evaluate((node) => { node.scrollTop = 0; });
          const box = await card.boundingBox(); if (!box || box.x < 0 || box.x + box.width > page.viewportSize().width + 1 || uiErrors.length) throw new LiveFailure('BROWSER_DISPLAY');
          await page.screenshot({ path: path.join(directory, `live-${mobile ? 'mobile' : 'desktop'}.png`) });
          await context.close(); console.log(`PASS: real Worker image displayed in ${mobile ? 'mobile' : 'PC'} journal.`);
        }
        report.browserDisplays = ['PC', 'mobile'];
      } finally { await browser.close(); }
    }
  }
} catch (error) {
  report.result = 'BLOCKED'; report.reason = error instanceof LiveFailure ? error.code : 'LIVE_TEST_FAILED';
  console.log(JSON.stringify({ result: report.result, reason: report.reason, ...(browserStage ? { browserStage } : {}) })); process.exitCode = 2;
} finally {
  fs.writeFileSync(path.join(directory, 'report.json'), JSON.stringify(report, null, 2), { mode: 0o600 });
  if (vite) await vite.close(); if (locked) fs.unlinkSync(lock);
}
