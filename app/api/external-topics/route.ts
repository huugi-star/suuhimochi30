import { getPublicTopics, isPublicTopicsRefresh } from '../../../lib/infoHubServer';

export const dynamic = 'force-dynamic';

export async function GET(request?: Request) {
  // Explicit refresh bypasses the app server cache only. Never forwards a URL or triggers a Worker Cron.
  const forceRefresh = isPublicTopicsRefresh(request);
  return Response.json(await getPublicTopics({ forceRefresh }), {
    headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
  });
}
