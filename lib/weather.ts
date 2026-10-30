import type { StorageLike } from './conversationTypes';

export const WEATHER_SELECTION_KEY = 'suuhimochi-weather-region-v1';
export const WEATHER_CACHE_KEY = 'suuhimochi-weather-cache-v1';
export const WEATHER_SPOKEN_KEY = 'suuhimochi-weather-spoken-v1';
export const WEATHER_REFRESH_MS = 60 * 60000;
export const WEATHER_RETRY_MS = 5 * 60000;
export type WeatherRegion = { code: string; name: string };
export type WeatherSelection = { pref: WeatherRegion };
export type WeatherDay = { offset: number; date: string; weather: string; weatherCode: string | null;
  temperatureMinC: number | null; temperatureMaxC: number | null;
  precipitationPeriods: { from: string; to: string; probabilityPercent: number | null }[] };
export type WeatherForecast = { status: 'OK'; prefecture: string; representativeArea: true; office: WeatherRegion; area: WeatherRegion; reportAt: string; retrievedAt: string;
  freshness: 'fresh' | 'stale'; warning: string | null; source: string; sourceUrl: string; note: string | null;
  temperatureStation: WeatherRegion | null; temperaturePoints: { at: string; valueC: number }[];
  days: WeatherDay[]; dialogue: { text: string; isForecast: false } | null };
export type WeatherState = { forecast: WeatherForecast | null; fetchedAt: string | null; error: string | null };
const obj = (value: unknown): Record<string, unknown> | null => value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
export const weatherCodeValid = (value: unknown, station = false): value is string => typeof value === 'string' && (station ? /^\d{5}$/ : /^\d{6}$/).test(value);
export function prefectureCode(value: unknown): string | null {
  if (!weatherCodeValid(value)) return null;
  const prefix = value.slice(0, 2), number = Number(prefix);
  if (number < 1 || number > 47) return null;
  return prefix === '01' ? '016000' : prefix === '46' ? '460100' : prefix === '47' ? '471000' : `${prefix}0000`;
}
export const prefectureCodeValid = (value: unknown): value is string => typeof value === 'string' && prefectureCode(value) === value;
const textValid = (value: unknown, max = 400): value is string => typeof value === 'string' && Boolean(value.trim()) && value.length <= max
  && !/[<>]/u.test(value) && Array.from(value).every((char) => (char.charCodeAt(0) >= 32 || [9, 10, 13].includes(char.charCodeAt(0))) && char.charCodeAt(0) !== 127);
const stamp = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
const temp = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value >= -90 && value <= 70;
function region(value: unknown, station = false): WeatherRegion | null {
  const row = obj(value); return row && weatherCodeValid(row.code, station) && textValid(row.name, 60) ? { code: row.code, name: row.name } : null;
}
function regionList(value: unknown, station = false): WeatherRegion[] | null {
  if (!Array.isArray(value) || value.length > 100) return null;
  const rows = value.map((row) => region(row, station));
  return rows.every((row) => row !== null) ? [...new Map(rows.map((row) => [row.code, row])).values()] : null;
}
export function parseWeatherRegions(value: unknown): WeatherRegion[] | null {
  const data = obj(value), rows = data?.status === 'OK' && data.areaLevel === 'prefectures' ? regionList(data.areas) : null;
  return rows?.length === 47 && rows.every((row) => prefectureCodeValid(row.code)) ? rows : null;
}
export function parseWeatherSelection(value: unknown): WeatherSelection | null {
  const data = obj(value), pref = region(data?.pref);
  if (pref && prefectureCodeValid(pref.code)) return { pref };
  // Retain the prefecture from the former office/area/station preference only.
  const office = region(data?.office), code = prefectureCode(office?.code);
  if (!office || !code) return null;
  const name = code === '016000' ? '北海道' : code === '460100' ? '鹿児島県' : code === '471000' ? '沖縄県' : office.name;
  return { pref: { code, name } };
}
export function readWeatherSelection(storage: StorageLike) {
  try {
    const raw = JSON.parse(storage.getItem(WEATHER_SELECTION_KEY) ?? 'null'), selection = parseWeatherSelection(raw);
    if (selection && !obj(raw)?.pref) saveWeatherSelection(storage, selection);
    return selection;
  } catch { return null; }
}
export function saveWeatherSelection(storage: StorageLike, selection: WeatherSelection | null) {
  const normalized = selection && parseWeatherSelection(selection);
  if (selection && !normalized) return false;
  try { if (normalized) storage.setItem(WEATHER_SELECTION_KEY, JSON.stringify(normalized)); else storage.removeItem(WEATHER_SELECTION_KEY); return true; }
  catch { return false; }
}
export function weatherSelectionId(selection: WeatherSelection) { return `pref:${selection.pref.code}`; }
/** Forecasts use Japan's civil date, independently of the game's 07:00 activity-day boundary. */
export function weatherDate(now = new Date()) { return new Date(now.getTime() + 9 * 3600000).toISOString().slice(0, 10); }
export function weatherDateLabel(date: string, now = new Date()) {
  return date === weatherDate(now) ? '今日' : date === weatherDate(new Date(now.getTime() + 86400000)) ? '明日' : date;
}
export function weatherTime(at: string) { return new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(at)); }
export function parseWeatherForecast(value: unknown, selection: WeatherSelection): WeatherForecast | null {
  const data = obj(value), office = region(data?.office), area = region(data?.area);
  if (data?.status !== 'OK' || office?.code !== selection.pref.code || !area || !textValid(data.prefecture, 30) || data.representativeArea !== true
    || !stamp(data.reportAt) || !stamp(data.retrievedAt) || !['fresh', 'stale'].includes(String(data.freshness))
    || !Array.isArray(data.days) || !data.days.length || data.days.length > 3) return null;
  const days: WeatherDay[] = [];
  for (const raw of data.days) {
    const day = obj(raw);
    if (!day || !Number.isInteger(day.offset) || typeof day.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day.date)
      || !textValid(day.weather) || !Array.isArray(day.precipitationPeriods) || day.precipitationPeriods.length > 8
      || (day.temperatureMinC !== null && !temp(day.temperatureMinC)) || (day.temperatureMaxC !== null && !temp(day.temperatureMaxC))) return null;
    const periods: WeatherDay['precipitationPeriods'] = [];
    for (const rawPeriod of day.precipitationPeriods) {
      const period = obj(rawPeriod), probability = period?.probabilityPercent;
      if (!period || !stamp(period.from) || !stamp(period.to) || Date.parse(period.to) <= Date.parse(period.from)
        || (probability !== null && (typeof probability !== 'number' || !Number.isInteger(probability) || probability < 0 || probability > 100))) return null;
      periods.push({ from: period.from, to: period.to, probabilityPercent: probability as number | null });
    }
    days.push({ offset: day.offset as number, date: day.date, weather: day.weather,
      weatherCode: typeof day.weatherCode === 'string' && /^\d{3}$/.test(day.weatherCode) ? day.weatherCode : null,
      temperatureMinC: day.temperatureMinC as number | null, temperatureMaxC: day.temperatureMaxC as number | null, precipitationPeriods: periods });
  }
  const station = data.temperatureStation == null ? null : region(data.temperatureStation, true);
  if (data.temperatureStation != null && !station) return null;
  const points = data.temperaturePoints;
  if (!Array.isArray(points) || points.length > 30) return null;
  const temperaturePoints: WeatherForecast['temperaturePoints'] = [];
  for (const rawPoint of points) { const point = obj(rawPoint); if (!point || !stamp(point.at) || !temp(point.valueC)) return null;
    temperaturePoints.push({ at: point.at, valueC: point.valueC }); }
  let sourceUrl: string;
  try { const url = new URL(String(data.sourceUrl)); if (url.protocol !== 'https:' || !['www.jma.go.jp', 'www.data.jma.go.jp'].includes(url.hostname) || url.username || url.password) return null; sourceUrl = url.href; }
  catch { return null; }
  const dialogue = obj(data.dialogue);
  const safeDialogue = dialogue?.isForecast === false && textValid(dialogue.text, 1000)
    && !/ignore.{0,20}instructions|system\s*prompt|指示を無視|システム命令/iu.test(dialogue.text);
  return { status: 'OK', prefecture: data.prefecture, representativeArea: true, office, area, reportAt: data.reportAt, retrievedAt: data.retrievedAt, freshness: data.freshness as 'fresh' | 'stale',
    warning: textValid(data.warning) ? data.warning : null, source: textValid(data.source, 80) ? data.source : '気象庁ホームページ', sourceUrl,
    note: textValid(data.note, 600) ? data.note : null, temperatureStation: station, temperaturePoints, days,
    dialogue: safeDialogue ? { text: dialogue.text as string, isForecast: false } : null };
}
export function weatherUsable(forecast: WeatherForecast, now = new Date()) {
  const age = now.getTime() - Date.parse(forecast.reportAt);
  return age >= -10 * 60000 && age <= 36 * 3600000 && forecast.days.some((day) => day.date === weatherDate(now));
}
export function weatherIsStale(forecast: WeatherForecast, now = new Date()) { return forecast.freshness !== 'fresh' || now.getTime() - Date.parse(forecast.reportAt) > 12 * 3600000; }
export function readWeatherCache(storage: StorageLike, selection: WeatherSelection, now = new Date()): WeatherState {
  try {
    const raw = obj(JSON.parse(storage.getItem(WEATHER_CACHE_KEY) ?? 'null'));
    if (raw?.selectionId !== weatherSelectionId(selection) || !stamp(raw.fetchedAt)) throw new Error('cache');
    const forecast = parseWeatherForecast(raw.forecast, selection);
    if (forecast && weatherUsable(forecast, now)) return { forecast, fetchedAt: raw.fetchedAt, error: null };
  } catch { /* The forecast is optional. */ }
  return { forecast: null, fetchedAt: null, error: null };
}
type WeatherSpoken = { selectionId: string; date: string; text: string; spokenAt: string };
function readSpoken(storage: StorageLike): WeatherSpoken[] {
  try { const raw: unknown = JSON.parse(storage.getItem(WEATHER_SPOKEN_KEY) ?? '[]'); return Array.isArray(raw) ? raw.slice(-40).filter((row): row is WeatherSpoken => Boolean(row)
    && typeof row.selectionId === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.date) && textValid(row.text, 1000) && stamp(row.spokenAt)).map((row) => {
      const code = row.selectionId.startsWith('pref:') ? null : prefectureCode(row.selectionId.split(':')[0]);
      return code ? { ...row, selectionId: `pref:${code}` } : row;
    }) : []; }
  catch { return []; }
}
export function weatherMonologue(storage: StorageLike, selection: WeatherSelection, forecast: WeatherForecast, now = new Date()) {
  if (!weatherUsable(forecast, now) || weatherIsStale(forecast, now) || !forecast.dialogue
    || forecast.days.find((day) => day.offset === 0)?.date !== weatherDate(now)) return null;
  const spoken = readSpoken(storage), key = weatherSelectionId(selection), date = weatherDate(now);
  if (spoken.some((row) => row.selectionId === key && row.date === date && row.text === forecast.dialogue!.text)
    || spoken.some((row) => now.getTime() - Date.parse(row.spokenAt) < WEATHER_REFRESH_MS)) return null;
  return forecast.dialogue.text;
}
export function markWeatherSpoken(storage: StorageLike, selection: WeatherSelection, text: string, now = new Date()) {
  try { storage.setItem(WEATHER_SPOKEN_KEY, JSON.stringify([...readSpoken(storage), { selectionId: weatherSelectionId(selection), date: weatherDate(now), text, spokenAt: now.toISOString() }].slice(-40))); }
  catch { /* No gameplay state is touched. */ }
}
