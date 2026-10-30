import type { StorageLike } from './conversationTypes';
import { WEATHER_CACHE_KEY, WEATHER_REFRESH_MS, WEATHER_RETRY_MS, parseWeatherForecast, readWeatherCache, readWeatherSelection,
  weatherDate, weatherSelectionId, weatherUsable, type WeatherSelection, type WeatherState } from './weather';

export async function fetchWeatherJson(path: string, fetcher: typeof fetch = fetch, signal?: AbortSignal, timeoutMs = 6000): Promise<unknown> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, timeoutMs);
  try {
    const response = await fetcher(path, { signal: controller.signal, credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', headers: { accept: 'application/json' } });
    if (!response.ok) throw new Error('WEATHER_UNAVAILABLE');
    return await response.json();
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
}
const requests = new WeakMap<StorageLike, Map<string, Promise<WeatherState>>>();
const attempts = new WeakMap<StorageLike, Map<string, number>>();
export function loadWeather(storage: StorageLike, selection: WeatherSelection, fetcher: typeof fetch = fetch, now = new Date(), force = false): Promise<WeatherState> {
  const key = weatherSelectionId(selection), prior = readWeatherCache(storage, selection, now);
  const active = requests.get(storage) ?? new Map(); requests.set(storage, active);
  const checked = attempts.get(storage) ?? new Map(); attempts.set(storage, checked);
  if (active.has(key)) return active.get(key)!;
  if (!force && (prior.fetchedAt && weatherDate(new Date(prior.fetchedAt)) === weatherDate(now) && now.getTime() - Date.parse(prior.fetchedAt) < WEATHER_REFRESH_MS
    || now.getTime() - (checked.get(key) ?? -Infinity) < WEATHER_RETRY_MS)) return Promise.resolve(prior);
  checked.set(key, now.getTime());
  const task = (async (): Promise<WeatherState> => {
    try {
      const query = new URLSearchParams({ resource: 'forecast', pref: selection.pref.code });
      if (force) query.set('refresh', '1');
      const raw = await fetchWeatherJson(`/api/weather?${query}`, fetcher);
      const forecast = parseWeatherForecast(raw, selection);
      if (!forecast || !weatherUsable(forecast, now)) throw new Error('WEATHER_INVALID');
      const saved = readWeatherSelection(storage);
      // A slow response from the previous region must never overwrite the newly selected region's cache.
      if (saved && weatherSelectionId(saved) === key) {
        try { storage.setItem(WEATHER_CACHE_KEY, JSON.stringify({ selectionId: key, fetchedAt: now.toISOString(), forecast })); } catch { /* Cache is optional. */ }
      }
      return { forecast, fetchedAt: now.toISOString(), error: null };
    } catch { return { ...prior, error: '天気予報を取得できませんでした。時間をおいてもう一度お試しください。' }; }
  })();
  active.set(key, task);
  void task.finally(() => active.delete(key));
  return task;
}
