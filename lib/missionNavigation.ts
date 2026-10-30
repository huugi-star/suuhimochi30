import { missionDateKey, shiftMissionDate, type DailyMissionId, type JournalTaskPlans } from './dailyMissions';
export type JournalMissionEntry = { date: string; action: 'plan' | 'report' | 'tomorrow' | 'actual' };
export function missionDestination(id: DailyMissionId, plans: JournalTaskPlans, now = new Date()):
  { kind: 'room' } | { kind: 'teach' } | { kind: 'journal'; entry: JournalMissionEntry } {
  if (id === 'login') return { kind: 'room' };
  if (id === 'teach') return { kind: 'teach' };
  const today = missionDateKey(now), yesterday = shiftMissionDate(today, -1);
  const date = id === 'report' && plans[yesterday]?.some(task => task.kind !== 'actual') ? yesterday : today;
  return { kind: 'journal', entry: { date, action: id } };
}
