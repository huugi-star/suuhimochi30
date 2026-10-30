import { getPublicBriefs } from '../../../lib/infoHubBriefServer';
export const dynamic = 'force-dynamic';
/** No caller-controlled URLs, credentials, names or dictionaries are forwarded. */
export async function GET() {
  const headers = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
  const result = await getPublicBriefs();
  return result.feed ? Response.json(result.feed, { headers })
    : Response.json({ error: 'BRIEFS_UNAVAILABLE', diagnostic: result.diagnostic }, { status: 503, headers });
}
