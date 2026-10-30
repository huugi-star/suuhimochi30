import { getActivityDateKey, getDoneItems, normalizeDoneItems } from './dailyProgress';
import { createExperienceFruitBatch } from './food';
import { addFriendship } from './friendship';
import { createSuuhimochiDiary } from './suuhimochiDiary';
import type { GameSave } from './storage';
import type { ConversationMemory, WordEntry } from './conversationTypes';
import { journalChecklist, type JournalChecklistChange } from './journalChecklist';
import { reconcileDailyMissions } from './dailyMissions';
import { missionDateKey } from './dailyMissions';
import { shiftMissionDate } from './dailyMissions';

type JournalContext = { currentDay: number; memories: ConversationMemory[]; words: WordEntry[]; now?: Date };

/** Explicit removal from today's checklist or tomorrow's plans. Past records/rewards stay intact. */
export function removeJournalItem(save:GameSave,date:string,item:{taskId?:string;text:string},now=new Date()):GameSave {
  const today=missionDateKey(now);if(![today,shiftMissionDate(today,1)].includes(date))return save;
  const tasks=save.taskPlans?.[date]??[],task=item.taskId?tasks.find(t=>t.id===item.taskId):undefined;
  if(item.taskId&&!task)return save;
  const notes=save.journalNotes?.[date]??getDoneItems(save.dailyProgressRecords.find(r=>r.reviewedDate===date));
  if(!task&&(date!==today||!notes.some(note=>note.trim()===item.text.trim())))return save;
  const text=(task?.text??item.text).trim(),nextTasks=task?tasks.filter(t=>t.id!==task.id):tasks;
  return {...save,taskPlans:task?{...save.taskPlans,[date]:nextTasks}:save.taskPlans,
    journalNotes:date===today?{...save.journalNotes,[date]:notes.filter(note=>note.trim()!==text)}:save.journalNotes};
}

/** User-initiated writes share the original fruit and friendship deduplication boundaries. */
export function saveJournalFootprint(save: GameSave, date: string, items: string[], context: JournalContext) {
  const now = context.now ?? new Date();
  const activityDate = getActivityDateKey(now);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > missionDateKey(now)) return save;
  const doneItems = normalizeDoneItems(items);
  const fruits = date < activityDate
    ? createExperienceFruitBatch({ existing: save.experienceFruits ?? [], sourceDate: date, kind: 'experience', doneItems, now }).fruits
    : save.experienceFruits;
  const daysAgo = Math.round((Date.parse(`${activityDate}T12:00:00Z`) - Date.parse(`${date}T12:00:00Z`)) / 86400000);
  const day = Math.max(1, context.currentDay - daysAgo);
  const memories = context.memories.filter((memory) => memory.day === day);
  const diary = save.suuhimochiDiaries?.[date] ?? (date < activityDate ? createSuuhimochiDiary({ date, day,
    conversationTopics: memories.map((memory) => memory.topic), conversationQuotes: memories.map((memory) => memory.quote),
    learnedWords: context.words.filter((word) => word.firstSeenDay === day).map((word) => word.surface),
    humanNotes: doneItems, createdAt: now.toISOString() }) : undefined);
  const next: GameSave = { ...save, journalNotes: { ...save.journalNotes, [date]: doneItems }, experienceFruits: fruits,
    dailyProgressRecords: (save.dailyProgressRecords ?? []).map((record) => record.reviewedDate === date
      ? { ...record, doneItems, note: undefined, noteDeferred: false } : record),
    suuhimochiDiaries: diary ? { ...save.suuhimochiDiaries, [date]: diary } : save.suuhimochiDiaries };
  if (!doneItems.length) return next;
  const friendship = addFriendship({ score: next.friendship, dailyRecords: next.friendshipDailyRecords,
    eventIds: next.friendshipEventIds, reachedLevels: next.friendshipReachedLevels,
    activityDate, source: 'footprint', eventId: `footprint:${date}`, amount: 3 });
  return { ...next, friendship: friendship.score, friendshipDailyRecords: friendship.dailyRecords,
    friendshipEventIds: friendship.eventIds, friendshipReachedLevels: friendship.reachedLevels };
}

/** An inline checklist write preserves plan IDs and dates, and reuses footprint reward deduplication. */
export function saveJournalChecklistItem(save: GameSave, date: string, change: JournalChecklistChange, context: JournalContext) {
  const now = context.now ?? new Date(), text = change.text.trim();
  const result = change.result ?? (change.completed ? 'done' : 'not_done');
  if (!['done', 'in_progress', 'not_done'].includes(result)) return save;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T12:00:00Z`))
    || new Date(`${date}T12:00:00Z`).toISOString().slice(0,10) !== date || date > missionDateKey(now) || !text || text.length > 640) return save;
  const archive = change.archiveId ? save.cycleArchives.find(item => item.id === change.archiveId) : undefined;
  if (change.archiveId && !archive) return save;
  const notes = archive?.journalNotes ?? save.journalNotes;
  const records = archive?.dailyProgressRecords ?? save.dailyProgressRecords;
  const oldNotes = notes[date] ?? getDoneItems(records.find(record => record.reviewedDate === date));
  const tasks = [...(save.taskPlans[date] ?? [])];
  const previous = change.taskId ? tasks.find(task => task.id === change.taskId) : tasks.find(task => task.text.trim() === (change.originalText ?? text).trim());
  if (change.taskId && !previous) return save;
  if (tasks.some(task => task.id !== previous?.id && task.text.trim() === text)
    || (text !== change.originalText && oldNotes.some(note => note.trim() === text) && text !== previous?.text.trim())) return save;
  const original = (previous?.text ?? change.originalText ?? text).trim();
  const updated = previous ? { ...previous, text, result, reportedAt: now.toISOString() }
    : { id: `actual:${date}:${now.toISOString()}:${tasks.length}`, text, kind: 'actual' as const, createdAt: now.toISOString(), result, reportedAt: now.toISOString() };
  const nextTasks = previous ? tasks.map(task => task.id === previous.id ? updated : task) : [...tasks, updated];
  // Completed notes are the existing journal's source of truth; unchecked items remain in taskPlans.
  const completed = journalChecklist(nextTasks, oldNotes.filter(note => ![original, text].includes(note.trim())))
    .filter(item => item.completed).map(item => item.text);
  if (JSON.stringify(tasks) === JSON.stringify(nextTasks) && JSON.stringify(oldNotes) === JSON.stringify(completed)) return save;
  const next = { ...save, taskPlans: { ...save.taskPlans, [date]: nextTasks } };
  if (archive) return { ...next, cycleArchives: save.cycleArchives.map(item => item.id !== archive.id ? item : { ...item,
    journalNotes: { ...item.journalNotes, [date]: completed },
    dailyProgressRecords: item.dailyProgressRecords.map(record => record.reviewedDate === date ? { ...record, doneItems: completed, note: undefined, noteDeferred: false } : record) }) };
  return reconcileDailyMissions(saveJournalFootprint(next, date, completed, { ...context, now }), context.words, now);
}
