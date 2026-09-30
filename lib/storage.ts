import type { MochiState } from './characterData';
import { splitDoneItems, type DailyProgressRecord } from './dailyProgress';
import type { StrategistId, StrategyRecord } from './potenoLink';
import type { SixDivinationRecord } from './potenoSixDivination';
import type { ThirtyDayCycleArchive } from './graduation';
import type { TwoDayReviewGoalType, TwoDayReviewRecord } from './twoDayReview';

export type GameSave = {
  birthday: string;
  /** 初回登録後に設定から生年月日を修正したか。修正は一度だけ許可する。 */
  birthdayCorrectionUsed: boolean;
  mochiType: number;
  introComplete: boolean;
  day: number;
  state: MochiState;
  userName: string;
  callName: string;
  dailyProgressRecords: DailyProgressRecord[];
  journalNotes: Record<string, string[]>;
  goalType: TwoDayReviewGoalType | null;
  twoDayReviews: TwoDayReviewRecord[];
  strategyRecords: StrategyRecord[];
  divinationRecords: SixDivinationRecord[];
  lastDailyProgressActivityDate: string;
  /** 1から始まる30日サイクル番号。 */
  cycleNumber: number;
  /** 同じ見た目でも、代替わりした子を履歴上で区別するID。 */
  currentMochiId: string;
  /** 完了済みの30日を、現行データとは分けて保存する。 */
  cycleArchives: ThirtyDayCycleArchive[];
};
const SAVE_KEY = 'suuhimochi-30days-save-v1';
export const EMPTY_SAVE: GameSave = {
  birthday: '',
  birthdayCorrectionUsed: false,
  mochiType: 1,
  introComplete: false,
  day: 0,
  state: 'idle',
  userName: '',
  callName: '',
  dailyProgressRecords: [],
  journalNotes: {},
  goalType: null,
  twoDayReviews: [],
  strategyRecords: [],
  divinationRecords: [],
  lastDailyProgressActivityDate: '',
  cycleNumber: 1,
  currentMochiId: 'suuhimochi-cycle-1',
  cycleArchives: [],
};

export function loadSave(): GameSave {
  if (typeof window === 'undefined') return EMPTY_SAVE;
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return EMPTY_SAVE;
    const parsed = JSON.parse(raw) as Partial<GameSave> & {
      /** 旧版の出生地は読み込み時に破棄する。 */
      birthplace?: string;
      journalNotes?: Record<string, string | string[]>;
      dailyProgressRecords?: Array<DailyProgressRecord & { doneItems?: string[]; note?: string }>;
    };
    const journalNotes = Object.fromEntries(
      Object.entries(parsed.journalNotes ?? {}).map(([date, value]) => [
        date,
        splitDoneItems(value),
      ]),
    );
    const dailyProgressRecords = Array.isArray(parsed.dailyProgressRecords)
      ? parsed.dailyProgressRecords.map((record) => ({
          ...record,
          doneItems: splitDoneItems(record.doneItems ?? record.note),
        }))
      : [];
    const strategyRecords = Array.isArray(parsed.strategyRecords)
      ? (parsed.strategyRecords as Array<Partial<StrategyRecord> & { strategy?: string }>).map((record, index) => {
          const strategist: StrategistId = record.strategist === 'komei'
            || record.strategist === 'sunzi'
            || record.strategist === 'hanbei'
            ? record.strategist
            : 'hanbei';
          const legacyDetails = [
            typeof record.summary === 'string' ? record.summary : '',
            ...(Array.isArray(record.goodSigns) ? record.goodSigns.filter((item): item is string => typeof item === 'string').map((item) => `良い兆候：${item}`) : []),
            ...(Array.isArray(record.concerns) ? record.concerns.filter((item): item is string => typeof item === 'string').map((item) => `気になる点：${item}`) : []),
            ...(Array.isArray(record.unknowns) ? record.unknowns.filter((item): item is string => typeof item === 'string').map((item) => `まだ分からないこと：${item}`) : []),
          ].filter(Boolean);
          return {
            id: typeof record.id === 'string' ? record.id : `legacy-strategy-${index}`,
            strategist,
            consultedDay: typeof record.consultedDay === 'number' ? record.consultedDay : 1,
            savedAt: typeof record.savedAt === 'string' ? record.savedAt : '',
            counsel: typeof record.counsel === 'string'
              ? record.counsel
              : typeof record.advice === 'string'
                ? record.advice
                : typeof record.strategy === 'string'
                  ? record.strategy
                  : typeof record.summary === 'string'
                    ? record.summary
                    : '',
            potenoSummary: typeof record.potenoSummary === 'string'
              ? record.potenoSummary
              : legacyDetails.join('\n'),
            nextMoves: Array.isArray(record.nextMoves)
              ? record.nextMoves.filter((item): item is string => typeof item === 'string')
              : Array.isArray(record.actions)
                ? record.actions.filter((item): item is string => typeof item === 'string')
                : [],
            checkpoints: Array.isArray(record.checkpoints)
              ? record.checkpoints.filter((item): item is string => typeof item === 'string')
              : Array.isArray(record.observe)
                ? record.observe.filter((item): item is string => typeof item === 'string')
                : [],
            ...(typeof record.summary === 'string' ? { summary: record.summary } : {}),
            ...(typeof record.advice === 'string'
              ? { advice: record.advice }
              : typeof record.strategy === 'string'
                ? { advice: record.strategy }
                : {}),
            ...(Array.isArray(record.actions) ? { actions: record.actions.filter((item): item is string => typeof item === 'string') } : {}),
            ...(Array.isArray(record.observe) ? { observe: record.observe.filter((item): item is string => typeof item === 'string') } : {}),
            ...(typeof record.strategy === 'string' ? { strategy: record.strategy } : {}),
          } satisfies StrategyRecord;
        })
      : [];
    const divinationRecords = Array.isArray(parsed.divinationRecords)
      ? parsed.divinationRecords.filter((record): record is SixDivinationRecord => (
          Boolean(record)
          && typeof record === 'object'
          && typeof (record as Partial<SixDivinationRecord>).id === 'string'
          && (record as Partial<SixDivinationRecord>).type === 'SIX_DIVINATION_RESPONSE'
        ))
      : [];
    const { birthplace: _legacyBirthplace, ...saveWithoutBirthplace } = parsed;
    const cycleArchives = Array.isArray(parsed.cycleArchives)
      ? parsed.cycleArchives.filter((archive): archive is ThirtyDayCycleArchive => (
          Boolean(archive)
          && typeof archive === 'object'
          && typeof (archive as Partial<ThirtyDayCycleArchive>).id === 'string'
          && typeof (archive as Partial<ThirtyDayCycleArchive>).cycleNumber === 'number'
        ))
      : [];
    return {
      ...EMPTY_SAVE,
      ...saveWithoutBirthplace,
      cycleNumber: Math.max(1, Number(parsed.cycleNumber) || 1),
      currentMochiId: typeof parsed.currentMochiId === 'string' && parsed.currentMochiId
        ? parsed.currentMochiId
        : 'suuhimochi-cycle-1',
      cycleArchives,
      journalNotes,
      dailyProgressRecords,
      strategyRecords,
      divinationRecords,
    };
  } catch {
    return EMPTY_SAVE;
  }
}

export function storeSave(save: GameSave) {
  const { birthplace: _legacyBirthplace, ...saveWithoutBirthplace } = save as GameSave & { birthplace?: string };
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(saveWithoutBirthplace));
}
export function clearSave() {
  window.localStorage.removeItem(SAVE_KEY);
}
