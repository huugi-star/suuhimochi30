export type HomeAction = 'invite' | 'self-invite' | 'curious-invite' | 'external' | 'interest' | 'monologue' | 'dance';
export const HOME_WAIT_MIN_MS = 5_000;
export const HOME_WAIT_MAX_MS = 15_000;
export const HOME_FIRST_WAIT_MIN_MS = 3_000;
export const HOME_FIRST_WAIT_MAX_MS = 5_000;
const ACTIONS: readonly HomeAction[] = ['invite', 'external', 'interest', 'monologue', 'dance'];
const ZOOMS: readonly HomeAction[] = ['external', 'invite', 'self-invite', 'curious-invite', 'interest'];
const FOLLOW_UPS: readonly HomeAction[] = ['self-invite', 'curious-invite'];
const FOLLOW_UP_WAIT_MIN_MS = 10_000;
const FOLLOW_UP_WAIT_MAX_MS = 15_000;
export const HOME_INTEREST_FALLBACKS = [
  '人間さん、知らないことって、どこから調べたらいいのかな。',
  '同じものを見ても、人によって気になるところが違うのかな。',
  'この部屋で、きょうはどんなことを見つけられるかな。',
  '人間さんの好きなもの、ぼくも少しずつ知りたいの。',
] as const;

/** One deadline, measured from the end of a performance. No missed-action queue. */
export class HomeAutonomy {
  private started = false;
  private due: number | null = null;
  private performing = false;
  private observedBusy = false;
  private history: Array<{ kind: HomeAction; content: string }> = [];
  private followUps: HomeAction[] = [];
  constructor(private random: () => number = Math.random) {}
  interrupt() { this.due = null; }

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
      const min = this.followUps.length
        ? FOLLOW_UP_WAIT_MIN_MS
        : this.started
          ? HOME_WAIT_MIN_MS
          : HOME_FIRST_WAIT_MIN_MS;
      const max = this.followUps.length
        ? FOLLOW_UP_WAIT_MAX_MS
        : this.started
          ? HOME_WAIT_MAX_MS
          : HOME_FIRST_WAIT_MAX_MS;
      const delay = min + Math.floor(this.random() * (max - min + 1));
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
    const unique = weighted.map(({kind})=>kind);
    let choices = [...unique.filter((kind) => kind !== last), ...unique.filter((kind) => kind === last)];
    if (!this.started) choices = ['external', 'invite', 'interest', 'monologue', 'dance'];
    // Keep a zoom invitation or question in the mix roughly every 2–3 events.
    else if (this.history.slice(-2).length === 2 && this.history.slice(-2).every(entry=>!ZOOMS.includes(entry.kind))) {
      choices = [...choices.filter(kind=>ZOOMS.includes(kind)), ...choices.filter(kind=>!ZOOMS.includes(kind))];
    }
    const followUp = this.followUps[0];
    if (followUp) choices = [followUp];
    for (const kind of choices) {
      const content = perform(kind, this.recentContents());
      if (!content) {
        if (followUp === kind) {
          this.followUps.shift();
          this.started = true;
          return null;
        }
        continue;
      }
      this.history = [...this.history, { kind, content }].slice(-8);
      if (followUp === kind) this.followUps.shift();
      if (kind === 'external') this.followUps = [...FOLLOW_UPS];
      this.started = true;
      this.performing = true;
      this.observedBusy = false;
      return kind;
    }
    this.started = true; // No eligible action: retry after a fresh random wait.
    return null;
  }
}
