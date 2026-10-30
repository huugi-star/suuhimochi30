export type HomeAction = 'invite' | 'external' | 'interest' | 'monologue' | 'dance';
export const HOME_WAIT_MIN_MS = 15_000;
export const HOME_WAIT_MAX_MS = 30_000;
const ACTIONS: readonly HomeAction[] = ['invite', 'external', 'interest', 'monologue', 'dance'];
const STARTUP: readonly HomeAction[] = ['external', 'monologue', 'interest'];

/** One deadline, measured from the end of a performance. No missed-action queue. */
export class HomeAutonomy {
  private stage = 0;
  private due: number | null = null;
  private performing = false;
  private observedBusy = false;
  private history: Array<{ kind: HomeAction; content: string }> = [];
  constructor(private random: () => number = Math.random) {}
  interrupt() { this.stage = STARTUP.length; this.due = null; }

  wait(ready: boolean, busy: boolean, now: number): number | null {
    if (!ready || busy) {
      this.due = null;
      if (this.performing && busy) this.observedBusy = true;
      return null;
    }
    if (this.performing) {
      if (!this.observedBusy) return null;
      this.performing = false;
      this.observedBusy = false;
    }
    if (this.due === null) {
      const delay = this.stage === 0 ? 0 : this.stage < STARTUP.length ? HOME_WAIT_MIN_MS
        : HOME_WAIT_MIN_MS + Math.floor(this.random() * (HOME_WAIT_MAX_MS - HOME_WAIT_MIN_MS + 1));
      this.due = now + delay;
    }
    return Math.max(0, this.due - now);
  }
  recentContents() { return this.history.map((entry) => entry.content); }

  fire(now: number, perform: (kind: HomeAction, recent: readonly string[]) => string | null) {
    if (this.performing || this.due === null || now < this.due) return null;
    this.due = null;
    const last = this.history.at(-1)?.kind;
    const weighted = ACTIONS.map((kind) => ({ kind, weight: this.random()
      - this.history.slice(-5).filter((entry) => entry.kind === kind).length }));
    weighted.sort((a, b) => b.weight - a.weight);
    const preferred = STARTUP[this.stage];
    const unique = [...new Set([...(preferred ? [preferred] : []), ...weighted.map(({ kind }) => kind)])];
    const choices = preferred ? unique : [...unique.filter((kind) => kind !== last), ...unique.filter((kind) => kind === last)];
    for (const kind of choices) {
      const content = perform(kind, this.recentContents());
      if (!content) continue;
      this.history = [...this.history, { kind, content }].slice(-8);
      this.stage = Math.min(STARTUP.length, this.stage + 1);
      this.performing = true;
      this.observedBusy = false;
      return kind;
    }
    this.stage = STARTUP.length; // No eligible action: retry after a fresh random wait.
    return null;
  }
}
