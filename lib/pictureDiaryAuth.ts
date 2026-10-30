import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { diaryDate } from './pictureDiary';
import { missionDateKey } from './dailyMissions';

const COOKIE = '__Host-suuhimochi-diary';
const YEAR = 365 * 86400;
type Session = { ownerId: string; nonce: string; expires: number };
export type DiaryIdentity = { ownerId: string; companionId: string; startDate: string };
export class DiaryAuthError extends Error { constructor(public code: 'AUTH_NOT_CONFIGURED' | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'INVALID_REQUEST') { super(code); } }
export function createDiaryAuth(secret: string | undefined, clock = () => new Date()) {
  const key = () => { if (!secret || secret.length < 32) throw new DiaryAuthError('AUTH_NOT_CONFIGURED'); return secret; };
  const mac = (purpose: string, body: string) => createHmac('sha256', key()).update(`${purpose}:${body}`).digest('base64url');
  const sign = (purpose: string, value: unknown) => { const body = Buffer.from(JSON.stringify(value)).toString('base64url'); return `${body}.${mac(purpose, body)}`; };
  function read(purpose: string, value: string | undefined): Record<string, unknown> | null {
    key(); if (!value || value.length > 4096) return null;
    const [body, signature, extra] = value.split('.'); if (extra || !body || !signature) return null;
    const expected = Buffer.from(mac(purpose, body)), actual = Buffer.from(signature);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    try { const row = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')); return row && typeof row === 'object' ? row : null; } catch { return null; }
  }
  function session(request: Request): Session | null {
    const raw = request.headers.get('cookie')?.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
    const value = read('session', raw);
    return value && typeof value.ownerId === 'string' && /^anon_[a-f\d-]{36}$/.test(value.ownerId)
      && typeof value.nonce === 'string' && typeof value.expires === 'number' && value.expires > clock().getTime() ? value as Session : null;
  }
  function checkOrigin(request: Request) {
    const origin = request.headers.get('origin');
    if (!origin || origin !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') throw new DiaryAuthError('FORBIDDEN');
  }
  function enroll(request: Request, localCompanionId: unknown, startDate: unknown) {
    checkOrigin(request); key();
    if (typeof localCompanionId !== 'string' || !/^[a-zA-Z\d_-]{1,160}$/.test(localCompanionId)
      || !diaryDate(startDate) || startDate > missionDateKey(clock())) throw new DiaryAuthError('INVALID_REQUEST');
    const current = session(request) ?? { ownerId: `anon_${randomUUID()}`, nonce: randomUUID(), expires: 0 };
    const renewed: Session = { ...current, expires: clock().getTime() + YEAR * 1000 };
    const companionId = `companion_${mac('companion-id', `${current.ownerId}:${localCompanionId}:${startDate}`).slice(0, 36)}`;
    const credential = sign('companion', { ownerId: current.ownerId, companionId, startDate, localCompanionId, expires: renewed.expires });
    return { credential, cookie: `${COOKIE}=${sign('session', renewed)}; Path=/; Max-Age=${YEAR}; HttpOnly; Secure; SameSite=Strict` };
  }
  function verify(request: Request, credential: unknown): DiaryIdentity {
    checkOrigin(request); const owner = session(request); if (!owner) throw new DiaryAuthError('UNAUTHENTICATED');
    const grant = typeof credential === 'string' ? read('companion', credential) : null;
    if (!grant || grant.ownerId !== owner.ownerId || typeof grant.companionId !== 'string' || !/^companion_[a-zA-Z\d_-]{36}$/.test(grant.companionId)
      || !diaryDate(grant.startDate) || typeof grant.expires !== 'number' || grant.expires <= clock().getTime()) throw new DiaryAuthError('FORBIDDEN');
    return { ownerId: owner.ownerId, companionId: grant.companionId, startDate: grant.startDate };
  }
  return { enroll, verify };
}
export function createDiarySessionHandler(secret: () => string | undefined, clock = () => new Date()) {
  return async (request: Request) => {
    const headers = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
    try {
      const text = await request.text(); if (text.length > 2048) return Response.json({ status: 'INVALID_REQUEST' }, { status: 400, headers });
      const body = JSON.parse(text);
      if (body?.consent !== true || Object.keys(body).some((key) => !['consent', 'localCompanionId', 'startDate'].includes(key))) return Response.json({ status: 'INVALID_REQUEST' }, { status: 400, headers });
      const result = createDiaryAuth(secret(), clock).enroll(request, body.localCompanionId, body.startDate);
      return Response.json({ status: 'OK', credential: result.credential }, { headers: { ...headers, 'set-cookie': result.cookie } });
    } catch (error) {
      const code = error instanceof DiaryAuthError ? error.code : 'INVALID_REQUEST';
      return Response.json({ status: code }, { status: code === 'AUTH_NOT_CONFIGURED' ? 503 : code === 'FORBIDDEN' ? 403 : 400, headers });
    }
  };
}
