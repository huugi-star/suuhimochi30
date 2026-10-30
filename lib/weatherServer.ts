import { INFO_HUB_ORIGIN } from './externalTopics';
import { parseWeatherForecast, parseWeatherRegions, prefectureCodeValid, type WeatherSelection } from './weather';

export type WeatherRequest = { resource: 'regions' | 'forecast'; pref?: string; force?: boolean };
export function parseWeatherRequest(url: URL): WeatherRequest | null {
  const resource = url.searchParams.get('resource') ?? 'forecast';
  if (!['regions', 'forecast'].includes(resource)) return null;
  const pref = url.searchParams.get('pref') ?? undefined;
  if (resource === 'forecast' && !prefectureCodeValid(pref)) return null;
  return { resource: resource as WeatherRequest['resource'], pref, force: url.searchParams.get('refresh') === '1' };
}
/** Only public region codes are sent to the fixed information centre. */
export function createWeatherService(fetcher: typeof fetch = fetch, clock = () => new Date(), timeoutMs = 4500) {
  const cache = new Map<string, { until: number; payload: unknown }>();
  const pending = new Map<string, Promise<unknown>>();
  return async (request: WeatherRequest): Promise<unknown> => {
    const query = new URLSearchParams();
    if (request.resource === 'forecast') {
      if (!prefectureCodeValid(request.pref)) throw new Error('INVALID_REGION');
      query.set('pref', request.pref);
      // The current public Worker ignores pref on its own. The identical office
      // code selects its prefecture's representative area without any extra UI.
      query.set('office', request.pref);
    }
    const endpoint = request.resource === 'regions' ? 'weather-regions' : 'weather';
    const key = `${endpoint}?${query}`;
    const prior = cache.get(key);
    if (!request.force && prior && prior.until > clock().getTime()) return prior.payload;
    if (pending.has(key)) return pending.get(key)!;
    const task = (async () => {
      const controller = new AbortController(), timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetcher(`${INFO_HUB_ORIGIN}/${key}`, { signal: controller.signal, redirect: 'error', credentials: 'omit',
          cache: 'no-store', headers: { accept: 'application/json' } });
        if (!response.ok) throw new Error('WEATHER_UNAVAILABLE');
        const text = await response.text(); if (text.length > 200000) throw new Error('WEATHER_INVALID');
        const raw: unknown = JSON.parse(text);
        let payload: unknown;
        if (request.resource === 'regions') { const areas = parseWeatherRegions(raw); if (!areas) throw new Error('WEATHER_INVALID'); payload = { status: 'OK', areaLevel: 'prefectures', count: areas.length, areas }; }
        else {
          const selection: WeatherSelection = { pref: { code: request.pref!, name: '都道府県' } };
          payload = parseWeatherForecast(raw, selection); if (!payload) throw new Error('WEATHER_INVALID');
        }
        cache.set(key, { until: clock().getTime() + (request.resource === 'forecast' ? 10 * 60000 : 86400000), payload });
        if (cache.size > 128) cache.delete(cache.keys().next().value!);
        return payload;
      } finally { clearTimeout(timer); }
    })();
    pending.set(key, task);
    try { return await task; } finally { pending.delete(key); }
  };
}
export const getWeatherPublicData = createWeatherService();
