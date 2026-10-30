'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { loadWeather } from '@/lib/weatherClient';
import { readWeatherCache, readWeatherSelection, saveWeatherSelection, type WeatherSelection, type WeatherState } from '@/lib/weather';

export function useWeatherForecast(active: boolean) {
  const [selection, setSelection] = useState<WeatherSelection | null>(null);
  const [state, setState] = useState<WeatherState>({ forecast: null, fetchedAt: null, error: null });
  const [loading, setLoading] = useState(false);
  const [selectionError, setSelectionError] = useState('');
  const generation = useRef(0);
  useEffect(() => {
    let disposed = false;
    queueMicrotask(() => { if (disposed) return; const saved = readWeatherSelection(localStorage); setSelection(saved); if (saved) setState(readWeatherCache(localStorage, saved)); });
    return () => { disposed = true; };
  }, []);
  const refresh = useCallback(async (force = false) => {
    if (!active || !selection) return;
    const run = generation.current;
    setLoading(true);
    const next = await loadWeather(localStorage, selection, fetch, new Date(), force);
    if (run === generation.current) { setState(next); setLoading(false); }
  }, [active, selection]);
  useEffect(() => {
    let disposed = false; const run = generation.current;
    queueMicrotask(() => { if (!disposed) void refresh(); });
    return () => { disposed = true; generation.current = run + 1; };
  }, [refresh]);
  const choose = (next: WeatherSelection | null) => {
    if (!saveWeatherSelection(localStorage, next)) { setSelectionError('地域を保存できませんでした。端末の保存設定をご確認ください。'); return; }
    generation.current++;
    setSelectionError(''); setSelection(next); setLoading(false);
    setState(next ? readWeatherCache(localStorage, next) : { forecast: null, fetchedAt: null, error: null });
  };
  return { selection, state, loading, selectionError, choose, refresh };
}
