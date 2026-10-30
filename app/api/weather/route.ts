import { getWeatherPublicData, parseWeatherRequest } from '../../../lib/weatherServer';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const query = parseWeatherRequest(new URL(request.url));
  const headers = { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
  if (!query) return Response.json({ error: 'INVALID_REGION' }, { status: 400, headers });
  try { return Response.json(await getWeatherPublicData(query), { headers }); }
  catch { return Response.json({ error: 'WEATHER_UNAVAILABLE' }, { status: 503, headers }); }
}
