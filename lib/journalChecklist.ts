import type { JournalTask, TaskResult } from './dailyMissions';

export type JournalChecklistItem = { id: string; text: string; result: TaskResult; completed: boolean; taskId?: string; planned: boolean };
export type JournalChecklistChange = { taskId?: string; originalText?: string; text: string; archiveId?: string } &
  ({ result: TaskResult; completed?: never } | { completed: boolean; result?: never });
/** Read old notes and plans together without migrating or duplicating their contents. */
export function journalChecklist(tasks: readonly JournalTask[], notes: readonly string[]): JournalChecklistItem[] {
  const items: JournalChecklistItem[] = [], seen = new Set<string>();
  for (const task of tasks) {
    const text = task.text.trim(); if (!text || seen.has(text)) continue;
    seen.add(text); items.push({ id: task.id, taskId: task.id, text, result: task.result ?? 'not_done', completed: task.result === 'done', planned: task.kind !== 'actual' });
  }
  for (const note of notes) {
    const text = note.trim(); if (!text || seen.has(text)) continue;
    seen.add(text); items.push({ id: `note:${text}`, text, result: 'done', completed: true, planned: false });
  }
  return items;
}
