'use client';
import { useEffect, useState } from 'react';
import { fetchWeatherJson } from '@/lib/weatherClient';
import { parseWeatherRegions, weatherDate, weatherDateLabel, weatherIsStale, weatherTime, weatherUsable,
  type WeatherRegion, type WeatherSelection, type WeatherState } from '@/lib/weather';
import styles from './WeatherForecast.module.css';

type ForecastProps = { state: WeatherState; loading: boolean; onRefresh: () => void };
export function WeatherForecastView({ state, loading, onRefresh }: ForecastProps) {
  const now = new Date(), forecast = state.forecast && weatherUsable(state.forecast, now) ? state.forecast : null;
  const dates = [weatherDate(now), weatherDate(new Date(now.getTime() + 86400000))];
  return <div className={styles.forecast}>
    <div className={styles.heading}><b>{forecast?.prefecture ?? '天気予報'}</b><button type="button" onClick={onRefresh} disabled={loading}>{loading ? '更新中…' : '予報を更新'}</button></div>
    {state.error && <output>{state.error}{forecast ? ' 保存済みの予報を表示しています。' : ''}</output>}
    {!forecast && <p>{loading ? '予報を取得しています。' : '現在の予報はまだありません。'}</p>}
    {forecast && <>
      <p>{forecast.prefecture}の代表区域「{forecast.area.name}」の予報です。都道府県全域の天気を表すものではありません。</p>
      <small>{new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(forecast.reportAt))} 発表</small>
      {weatherIsStale(forecast, now) && <p className={styles.warning}>古い予報が含まれます。最新の発表もご確認ください。</p>}
      {forecast.warning && <p className={styles.warning}>{forecast.warning}</p>}
      {dates.map((date) => {
        const day = forecast.days.find((day) => day.date === date);
        const points = forecast.temperaturePoints.filter((point) => weatherDate(new Date(point.at)) === date);
        return <section key={date} className={styles.day}>
          <h4>{weatherDateLabel(date, now)} <small>{date.slice(5).replace('-', '/')}</small></h4>
          {!day ? <p>予報は未提供です。</p> : <>
            <p className={styles.description}>{day.weather}</p>
            <p>最高 {day.temperatureMaxC === null ? '未提供' : `${day.temperatureMaxC}℃`} ／ 最低 {day.temperatureMinC === null ? '未提供' : `${day.temperatureMinC}℃`}</p>
            {forecast.temperatureStation && points.length > 0 && <p>気温（{forecast.temperatureStation.name}・時刻別）：{points.map((point) => `${weatherTime(point.at)} ${point.valueC}℃`).join(' ／ ')}</p>}
            {!forecast.temperatureStation && day.temperatureMinC === null && day.temperatureMaxC === null && <p>気温は現在未提供です。</p>}
            <b>降水確率</b>
            {day.precipitationPeriods.length ? <ul>{day.precipitationPeriods.map((period) => <li key={period.from}>
              {weatherTime(period.from)}〜{weatherTime(period.to) === '00:00' ? '24:00' : weatherTime(period.to)}：{period.probabilityPercent === null ? '未提供' : `${period.probabilityPercent}%`}
            </li>)}</ul> : <p>未提供です。</p>}
          </>}
        </section>;
      })}
      <small>出典：<a href={forecast.sourceUrl} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">気象庁</a> ／ すうひもち情報センター</small>
      {forecast.note && <small>{forecast.note}</small>}
    </>}
  </div>;
}

export function WeatherRoomPanel({ state, loading, onRefresh, onClose, onSettings }: ForecastProps & { onClose: () => void; onSettings: () => void }) {
  return <aside className={styles.panel} aria-label="天気予報">
    <button type="button" className={styles.close} onClick={onClose} aria-label="天気予報を閉じる">×</button>
    <WeatherForecastView state={state} loading={loading} onRefresh={onRefresh} />
    <button type="button" onClick={onSettings}>都道府県を変更する</button>
  </aside>;
}

export function WeatherSettings({ selection, state, loading, selectionError, onChoose, onRefresh }: ForecastProps & {
  selection: WeatherSelection | null; selectionError: string; onChoose: (value: WeatherSelection | null) => void;
}) {
  const [regions, setRegions] = useState<WeatherRegion[]>([]);
  const [catalogError, setCatalogError] = useState(''), [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void fetchWeatherJson('/api/weather?resource=regions', fetch, controller.signal).then((raw) => {
      if (controller.signal.aborted) return;
      const rows = parseWeatherRegions(raw); if (!rows) throw new Error('regions'); setRegions(rows); setCatalogError('');
    }).catch(() => { if (!controller.signal.aborted) setCatalogError('都道府県の一覧を取得できませんでした。'); });
    return () => controller.abort();
  }, [retry]);
  return <section className={styles.settings} aria-label="天気予報の設定">
    <h3>天気予報の都道府県</h3>
    <p>選んだ都道府県をこの端末に保存し、次回から自動で利用します。「選択しない」で天気予報を停止できます。</p>
    <label>都道府県<select aria-label="天気の都道府県" value={selection?.pref.code ?? ''} disabled={!regions.length} onChange={(event) => {
      if (!event.target.value) onChoose(null);
      else { const pref = regions.find((row) => row.code === event.target.value); if (pref) onChoose({ pref }); }
    }}>
      <option value="">選択しない</option>
      {selection && !regions.some((row) => row.code === selection.pref.code) && <option value={selection.pref.code}>{selection.pref.name}</option>}
      {regions.map((row) => <option key={row.code} value={row.code}>{row.name}</option>)}
    </select></label>
    <small>都道府県内の代表区域の予報を表示します。都道府県全域の天気ではありません。</small>
    {catalogError && <output>{catalogError} <button type="button" onClick={() => setRetry((value) => value + 1)}>一覧を再取得</button></output>}
    {selectionError && <output>{selectionError}</output>}
    {selection && <><p>使用中：{selection.pref.name}</p>
      <WeatherForecastView state={state} loading={loading} onRefresh={onRefresh} /></>}
  </section>;
}
