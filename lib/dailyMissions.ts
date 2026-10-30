import type { GameSave } from './storage';
import type { WordEntry } from './conversationTypes';

export const DAILY_MISSION_IDS = ['login', 'plan', 'report', 'teach', 'tomorrow', 'actual'] as const;
export type DailyMissionId = typeof DAILY_MISSION_IDS[number];
export type DailyMissionRecord = { completedAt: Partial<Record<DailyMissionId, string>>; coinCompletedAt?: string; coinPresentedAt?: string; celebratedMissionIds?: DailyMissionId[] };
export type DailyMissionRecords = Record<string, DailyMissionRecord>;
export type TaskResult = 'done' | 'in_progress' | 'not_done';
export type JournalTask = { id: string; text: string; createdAt: string; result: TaskResult | null; reportedAt?: string; kind?: 'actual' };
export type JournalTaskPlans = Record<string, JournalTask[]>;
const labels: Record<DailyMissionId, string> = { login: 'ログイン', plan: '今日の予定を書く', report: '結果を記録', teach: 'ことばを教える', tomorrow: '明日の予定を書く', actual: 'やったことを追加' };
const dayFormat = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' });
/** Journal plans keep their JST civil target date. */
export const missionDateKey = (now = new Date()) => dayFormat.format(now);
/** Missions reset at 05:00 JST; journal target dates remain civil dates. */
export const dailyMissionDateKey = (now = new Date()) => missionDateKey(new Date(now.getTime() - 5 * 60 * 60 * 1000));
export function shiftMissionDate(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10);
}
const validDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00Z`))
  && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
const validTime = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value));
export function canPlanFor(date: string, now = new Date()) {
  const today = missionDateKey(now); return date === today || date === shiftMissionDate(today, 1);
}
export function sanitizeTaskPlans(raw: unknown): JournalTaskPlans {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return Object.fromEntries(Object.entries(raw).flatMap(([date, values]) => {
    if (!validDate(date) || !Array.isArray(values)) return [];
    const ids = new Set<string>();
    const tasks = values.flatMap((task): JournalTask[] => {
      if (!task || typeof task.id !== 'string' || !task.id || ids.has(task.id) || typeof task.text !== 'string'
        || !task.text.trim() || task.text.length > 640 || !validTime(task.createdAt)
        || (task.kind === 'actual' ? missionDateKey(new Date(task.createdAt)) < date : ![date, shiftMissionDate(date, -1)].includes(missionDateKey(new Date(task.createdAt))))) return [];
      ids.add(task.id);
      const reported = ['done', 'in_progress', 'not_done'].includes(task.result) && validTime(task.reportedAt)
        && missionDateKey(new Date(task.reportedAt)) >= date;
      return [{ id: task.id, text: task.text, createdAt: task.createdAt, result: reported ? task.result : null,
        ...(reported ? { reportedAt: task.reportedAt } : {}), ...(task.kind === 'actual' ? { kind: 'actual' as const } : {}) }];
    });
    return tasks.length ? [[date, tasks]] : [];
  }));
}
export function sanitizeDailyMissions(raw: unknown): DailyMissionRecords {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  return Object.fromEntries(Object.entries(raw).flatMap(([date, record]) => {
    if (!validDate(date) || !record || typeof record !== 'object' || !('completedAt' in record)) return [];
    const values = record.completedAt;
    if (!values || typeof values !== 'object') return [];
    const completedAt = Object.fromEntries(DAILY_MISSION_IDS.flatMap((id) => {
      const time = (values as Record<string, unknown>)[id];
      return validTime(time) && [missionDateKey(new Date(time)), dailyMissionDateKey(new Date(time))].includes(date) ? [[id, time]] : [];
    }));
    const saved = record as DailyMissionRecord;
    const coinCompletedAt = DAILY_MISSION_IDS.every(id => completedAt[id]) && validTime(saved.coinCompletedAt)
      && dailyMissionDateKey(new Date(saved.coinCompletedAt)) === date ? saved.coinCompletedAt : undefined;
    const coinPresentedAt = coinCompletedAt && validTime(saved.coinPresentedAt) && Date.parse(saved.coinPresentedAt) >= Date.parse(coinCompletedAt) ? saved.coinPresentedAt : undefined;
    const celebratedMissionIds = Array.isArray(saved.celebratedMissionIds) ? DAILY_MISSION_IDS.filter(id => completedAt[id] && saved.celebratedMissionIds!.includes(id)) : [];
    return [[date, { completedAt, ...(coinCompletedAt ? { coinCompletedAt } : {}), ...(coinPresentedAt ? { coinPresentedAt } : {}), ...(celebratedMissionIds.length ? { celebratedMissionIds } : {}) }]];
  }));
}
/** Idempotent observation of real operations. Only mission/coin records change here. */
export function reconcileDailyMissions(save: GameSave, words: readonly WordEntry[], now = new Date()): GameSave {
  const date = dailyMissionDateKey(now), journalDate = missionDateKey(now), yesterday = shiftMissionDate(journalDate, -1);
  const previous = save.dailyMissions?.[date]?.completedAt ?? {};
  const completedAt = { ...previous };
  const complete = (id: DailyMissionId, at = now.toISOString()) => { if (!completedAt[id]) completedAt[id] = at; };
  complete('login');
  if (save.taskPlans?.[journalDate]?.some((task) => task.kind !== 'actual' && [journalDate, yesterday].includes(missionDateKey(new Date(task.createdAt))))) complete('plan');
  const yesterdayTasks = (save.taskPlans?.[yesterday] ?? []).filter(task => task.kind !== 'actual');
  const resultTasks = yesterdayTasks.length ? yesterdayTasks : (save.taskPlans?.[journalDate] ?? []).filter(task => task.kind !== 'actual');
  if (resultTasks.length && resultTasks.every((task) => task.result && validTime(task.reportedAt)
    && dailyMissionDateKey(new Date(task.reportedAt)) === date)) complete('report');
  if (save.taskPlans?.[shiftMissionDate(journalDate, 1)]?.some(task => task.kind !== 'actual' && dailyMissionDateKey(new Date(task.createdAt)) === date)) complete('tomorrow');
  if (save.taskPlans?.[journalDate]?.some(task => task.kind === 'actual' && task.result === 'done' && dailyMissionDateKey(new Date(task.createdAt)) === date)) complete('actual');
  const learned = words.find((word) => validTime(word.learnedAt) && dailyMissionDateKey(new Date(word.learnedAt)) === date);
  if (learned?.learnedAt) complete('teach', learned.learnedAt);
  let records = save.dailyMissions;
  const oldRecord = records?.[date];
  const coinCompletedAt = oldRecord?.coinCompletedAt ?? (DAILY_MISSION_IDS.every(id => completedAt[id]) ? now.toISOString() : undefined);
  if (!DAILY_MISSION_IDS.every((id) => previous[id] === completedAt[id]) || coinCompletedAt !== oldRecord?.coinCompletedAt)
    records = { ...records, [date]: { ...oldRecord, completedAt, ...(coinCompletedAt ? { coinCompletedAt } : {}) } };
  // A word can be committed just before 05:00 and observed by React just after it.
  // Credit its actual registration day only if that day already has a login record.
  for (const word of words) {
    if (!validTime(word.learnedAt)) continue;
    const learnedDate = dailyMissionDateKey(new Date(word.learnedAt)), record = records?.[learnedDate];
    if (learnedDate >= date || !record?.completedAt.login || record.completedAt.teach) continue;
    const completedAt = { ...record.completedAt, teach: word.learnedAt };
    const coinCompletedAt = record.coinCompletedAt ?? (DAILY_MISSION_IDS.every(id => completedAt[id]) ? new Date(Math.max(...Object.values(completedAt).map(value => Date.parse(value)))).toISOString() : undefined);
    records = { ...records, [learnedDate]: { ...record, completedAt, ...(coinCompletedAt ? { coinCompletedAt } : {}) } };
  }
  return records === save.dailyMissions ? save : { ...save, dailyMissions: records };
}
export function getDailyMissionSummary(save: Pick<GameSave, 'dailyMissions' | 'taskPlans'>, date: string) {
  const completed = save.dailyMissions?.[date]?.completedAt ?? {};
  const missions = DAILY_MISSION_IDS.map((id) => ({ id, label: labels[id], completedAt: completed[id] ?? null,
    status: completed[id] ? 'completed' as const : 'pending' as const }));
  return { date, missions, completed: missions.filter((mission) => mission.status === 'completed').length,
    total: missions.length, coinCompletedAt: save.dailyMissions?.[date]?.coinCompletedAt ?? null,
    coinPresentedAt: save.dailyMissions?.[date]?.coinPresentedAt ?? null,
    celebratedMissionIds: save.dailyMissions?.[date]?.celebratedMissionIds ?? [] };
}
/** Presentation acknowledgement only; never completes a mission or grants a coin. */
export function markMissionsCelebrated(save: GameSave, date: string, ids: readonly DailyMissionId[]): GameSave {
  const record = save.dailyMissions?.[date]; if (!record) return save;
  const old = record.celebratedMissionIds ?? [];
  const next = DAILY_MISSION_IDS.filter(id => record.completedAt[id] && (old.includes(id) || ids.includes(id)));
  if (next.length === old.length) return save;
  return { ...save, dailyMissions: { ...save.dailyMissions, [date]: { ...record, celebratedMissionIds: next } } };
}
export function markMissionCoinPresented(save: GameSave, date: string, now = new Date()): GameSave {
  const record = save.dailyMissions?.[date];
  if (!record?.coinCompletedAt || record.coinPresentedAt) return save;
  return { ...save, dailyMissions: { ...save.dailyMissions, [date]: { ...record, coinPresentedAt: now.toISOString() } } };
}
export type DailyMissionSummary = ReturnType<typeof getDailyMissionSummary>;
export function addTaskPlans(save: GameSave, date: string, items: readonly string[], now = new Date()): GameSave {
  if (!canPlanFor(date, now)) return save;
  const tasks = [...(save.taskPlans?.[date] ?? [])];
  const texts = new Set(tasks.map((task) => task.text.trim()));
  for (const item of items) {
    const text = item.trim(); if (!text || text.length > 640 || texts.has(text)) continue;
    texts.add(text); tasks.push({ id: `task:${date}:${now.toISOString()}:${tasks.length}`, text, createdAt: now.toISOString(), result: null });
  }
  if (tasks.length === (save.taskPlans?.[date]?.length ?? 0)) return save;
  return reconcileDailyMissions({ ...save, taskPlans: { ...save.taskPlans, [date]: tasks } }, [], now);
}
export function reportTaskResult(save: GameSave, date: string, id: string, result: TaskResult, now = new Date()): GameSave {
  const today = missionDateKey(now);
  if (![today, shiftMissionDate(today, -1)].includes(date) || !['done', 'in_progress', 'not_done'].includes(result)) return save;
  const tasks = save.taskPlans?.[date];
  if (!tasks?.some((task) => task.id === id && (task.result !== result || !task.reportedAt || missionDateKey(new Date(task.reportedAt)) !== today))) return save;
  return reconcileDailyMissions({ ...save, taskPlans: { ...save.taskPlans,
    [date]: tasks.map((task) => task.id === id ? { ...task, result, reportedAt: now.toISOString() } : task) } }, [], now);
}
/** Edit only the text of tomorrow's existing plan; retain its identity and dates. */
export function updateTaskPlan(save: GameSave, date: string, id: string, value: string, now = new Date()): GameSave {
  if(date !== shiftMissionDate(missionDateKey(now),1))return save;
  const text=value.trim(), tasks=save.taskPlans?.[date];
  const task=tasks?.find(item=>item.id===id && item.kind!=='actual');
  if(!task||!text||text.length>640||task.text===text||tasks!.some(item=>item.id!==id&&item.text.trim()===text))return save;
  return { ...save, taskPlans:{...save.taskPlans,[date]:tasks!.map(item=>item.id===id?{...item,text}:item)} };
}
