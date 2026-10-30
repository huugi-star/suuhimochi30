'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { SuuhimochiConversation } from '@/lib/wordMemory';
import { getExternalInfoState, loadExternalTopics, subscribeExternalTopics } from '@/lib/externalInfoClient';
import { readExternalSnapshot } from '@/lib/externalTopics';
import { loadExternalBriefs, readBriefCache } from '@/lib/externalBriefClient';
import { loadSharedKnowledge } from '@/lib/sharedKnowledgeClient';
import { readSharedPreference, sharedCandidateSurfaces } from '@/lib/sharedKnowledge';
import { loadWeather } from '@/lib/weatherClient';
import { markWeatherSpoken, readWeatherSelection } from '@/lib/weather';
import { MonologueOpportunity, monologueCandidates, readMonologueHistory, recordMonologue, selectMonologue,
  writeMonologueStatus, type MonologueStatus, type MonologueEvent, type MonologueCandidate } from '@/lib/externalMonologues';

type Options = { managed?: boolean; ready: boolean; visible: boolean; individual: string; talk: SuuhimochiConversation | null; profileNames: string[];
  blocked: () => boolean; blockReason?: () => string; show: (text: string, card: MonologueCandidate, event: MonologueEvent) => boolean;
  committed?: (id: string, event: MonologueEvent) => void; startupPending?: (pending: boolean) => void; weatherChanged: () => void };
/** Background acquisition and one idle-room opportunity; presentation uses the existing game UI. */
export function useExternalMonologues(options: Options) {
  const latest = useRef(options);
  useEffect(() => { latest.current = options; });
  const [preparedIndividual, setPreparedIndividual] = useState<string | null>(null);
  const opportunity = useRef(new MonologueOpportunity());
  const lastInput = useRef(-Infinity), lastCheck = useRef(0), running = useRef(false), sequence = useRef(0);
  const alive = useRef(false), boot = useRef(''), generation = useRef(0);
  const activeUse = useRef<{ talk: SuuhimochiConversation; id: string; shared: boolean } | null>(null);
  const request = useRef<(trigger: 'startup' | 'update', id: string) => void>(() => {});
  const present = useRef<(event: MonologueEvent) => string | null>(() => null);
  const scheduledBootTried = useRef(false);
  const playScheduled = useCallback(() => {
    const pending = opportunity.current.consume();
    const event: MonologueEvent = pending ?? { id: `idle:${Date.now()}:${++sequence.current}`, trigger: scheduledBootTried.current ? 'update' : 'startup', at: Date.now() };
    scheduledBootTried.current = true;
    return present.current(event);
  }, []);
  const status = (event: Pick<MonologueEvent, 'id' | 'trigger'>, state: MonologueStatus['state'], reason: string, candidates?: number) => {
    writeMonologueStatus(localStorage, { eventId: event.id, trigger: event.trigger, timestamp: new Date().toISOString(),
      day: latest.current.talk?.getCurrentDay() ?? 0, state, reason, ...(candidates === undefined ? {} : { candidates }) });
  };
  useEffect(() => { request.current = (trigger, id) => {
    if (!alive.current || running.current) return; // Simultaneous source responses are one event, never a queue of speeches.
    running.current = true; lastCheck.current = Date.now();
    if (trigger === 'startup' && !latest.current.managed) latest.current.startupPending?.(true);
    if (trigger === 'startup' && (readBriefCache(localStorage)?.items.length
      || readExternalSnapshot(getExternalInfoState(localStorage).snapshot, new Date())?.topics.length)) setPreparedIndividual(latest.current.individual);
    status({ id, trigger }, 'FETCHING', '外部話題をバックグラウンドで取得中');
    const run = generation.current, controller = new AbortController();
    let deadline: ReturnType<typeof setTimeout>;
    const expired = new Promise<void>((resolve) => { deadline = setTimeout(() => { controller.abort(); resolve(); }, 8000); });
    const finish = async () => {
      const { talk, profileNames } = latest.current;
      const selected = readWeatherSelection(localStorage);
      await Promise.race([expired, Promise.allSettled([
        loadExternalTopics(localStorage, fetch, new Date(), { force: true, origin: 'monologue' }).then((data) => {
          if (alive.current && generation.current === run) talk?.setExternalTopics(data);
        }),
        loadExternalBriefs(localStorage),
        selected ? loadWeather(localStorage, selected, fetch, new Date(), true).then(() => {
          if (alive.current && generation.current === run) latest.current.weatherChanged();
        }) : Promise.resolve(),
        talk ? loadSharedKnowledge(localStorage, sharedCandidateSurfaces(talk.getWordEntries(), profileNames), fetch, new Date(), controller.signal, { forceDialogues: true })
          .then((data) => { if (alive.current && generation.current === run) talk.setSharedKnowledge(data, readSharedPreference(localStorage).enabled, profileNames); }) : Promise.resolve(),
      ])]);
      if (alive.current && generation.current === run) {
        opportunity.current.offer(id, trigger, Date.now());
        if (latest.current.managed) status({ id, trigger }, 'WAITING', '取得完了。次の自発行動の抽選で利用できます');
      }
    };
    void finish().catch(() => {
      if (alive.current && generation.current === run) { status({ id, trigger }, 'ERROR', '外部話題の準備に失敗しました。通常の操作は利用できます。'); latest.current.startupPending?.(false); }
    }).finally(() => { clearTimeout(deadline); if (generation.current === run) {
      running.current = false;
      if (alive.current && trigger === 'startup') setPreparedIndividual(latest.current.individual);
    } });
  }; });
  present.current = (event) => {
    const current = latest.current, talk = current.talk;
    if (!current.ready || current.visible || !talk?.canOfferExternalMonologue() || current.blocked() || document.hidden) return null;
    const history = readMonologueHistory(localStorage).filter((use) => use.individual === current.individual);
    const now = new Date();
    const topics = readExternalSnapshot(getExternalInfoState(localStorage, now).snapshot, now)?.topics ?? [];
    const candidates = monologueCandidates(talk, localStorage, readBriefCache(localStorage, now), topics, now, event);
    const card = selectMonologue(candidates, history);
    if (!card) { status(event, 'NO_CANDIDATE', candidates.length ? '使用済みの話題・セリフによる重複制限中' : '鮮度・訂正・安全性を満たす話題がありません', candidates.length); current.startupPending?.(false); return null; }
    if (!current.show(card.text, card, event)) { status(event, 'DISPLAY_RETRY', '表示直前に別の操作が始まりました', candidates.length); return null; }
    // Only the mounted existing bubble reaches this commit. Acquisition/selection/preview remain read-only.
    if (card.match) { const id = talk.recordExternalMonologue(card.match, card.text, event.id, event.trigger); if (id) { activeUse.current = { talk, id, shared: false }; current.committed?.(id, event); } }
    if (card.shared) { const id = talk.markSharedKnowledgeTalkShown(card.shared); if (id) { activeUse.current = { talk, id, shared: true }; current.committed?.(id, event); } }
    if (card.weather) markWeatherSpoken(localStorage, card.weather, card.text);
    recordMonologue(localStorage, { individual: current.individual, eventId: event.id, trigger: event.trigger,
      id: card.id, source: card.source, text: card.text, timestamp: new Date().toISOString() });
    opportunity.current.shown(Date.now());
    current.startupPending?.(false); status(event, 'SHOWN', `${card.source}の話題を表示しました`, candidates.length);
    return card.text;
  };
  useEffect(() => {
    alive.current = true;
    const input = () => { lastInput.current = Date.now(); };
    const unsubscribe = subscribeExternalTopics(localStorage, (event) => {
      if (event.phase !== 'start' || event.origin !== 'manual' || !latest.current.ready) return;
      // Let the topic client's in-flight promise be installed before joining it.
      queueMicrotask(() => request.current('update', `manual:${Date.now()}:${++sequence.current}`));
    });
    const check = () => {
      if (latest.current.ready && !document.hidden && Date.now() - lastCheck.current >= 3600000)
        request.current('update', `update:${Date.now()}:${++sequence.current}`);
    };
    const tick = latest.current.managed ? null : window.setInterval(() => {
      const current = latest.current, talk = current.talk;
      const pending = opportunity.current.peek();
      if (!pending) return;
      const blocked = current.visible || !current.ready || !talk || !talk.canOfferExternalMonologue() || current.blocked() || document.hidden;
      const event = opportunity.current.take(Boolean(blocked), lastInput.current, Date.now());
      if (!event || !talk) {
        if (!opportunity.current.peek()) { status(pending, 'EXPIRED', '表示機会が期限切れになりました'); current.startupPending?.(false); }
        else status(pending, 'WAITING', !current.ready ? '部屋の描画・初回導線を待っています'
          : !talk?.canOfferExternalMonologue() ? talk?.getExternalAutoBlockReason(pending.trigger) ?? '会話エンジンの準備中'
          : blocked ? current.blockReason?.() ?? '別の画面や会話が閉じるまで待っています' : '操作後の待機時間・発話間隔を待っています');
        return;
      }
      if (!present.current(event)) opportunity.current.defer(event);
    }, 400);
    const hourly = window.setInterval(check, 60000); // Check cheaply; network remains limited to once per hour.
    window.addEventListener('pointerdown', input, true); window.addEventListener('keydown', input, true); window.addEventListener('wheel', input, { capture: true, passive: true });
    document.addEventListener('visibilitychange', check);
    return () => { alive.current = false; unsubscribe(); if (tick !== null) clearInterval(tick); clearInterval(hourly);
      window.removeEventListener('pointerdown', input, true); window.removeEventListener('keydown', input, true); window.removeEventListener('wheel', input, true); document.removeEventListener('visibilitychange', check); };
  }, []);
  useEffect(() => {
    if (options.visible || !activeUse.current) return;
    const use = activeUse.current; activeUse.current = null;
    if (use.shared) use.talk.finishSharedKnowledgeTalk(use.id, 'FINISHED');
    else use.talk.finishStartupExternalTalk(use.id, 'FINISHED');
  }, [options.visible]);
  useEffect(() => {
    if (!options.ready || boot.current === options.individual) return;
    generation.current++; opportunity.current = new MonologueOpportunity(); scheduledBootTried.current = false; running.current = false;
    boot.current = options.individual;
    request.current('startup', `boot:${Date.now()}:${Math.random().toString(36).slice(2)}`);
  }, [options.ready, options.individual]);
  return { play: playScheduled, prepared: preparedIndividual === options.individual };
}
