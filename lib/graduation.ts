import { getDoneItems, normalizeDoneItems, type DailyProgressRecord } from './dailyProgress';
import { STRATEGIST_PROFILES, type StrategistId, type StrategyRecord } from './potenoLink';
import type { SixDivinationRecord } from './potenoSixDivination';
import type { TwoDayReviewGoalType, TwoDayReviewRecord } from './twoDayReview';

export type GraduationFootprint = {
  previousGoal: string;
  progressed: string[];
  continued: string[];
  stopped: string[];
  strategyChanges: string[];
  importantCounsel: string[];
  recordedDays: number;
  reviewedItems: number;
};

export type GraduationHandoffAdvice = {
  strategist: StrategistId;
  assessment: string;
  reachability: 'REACHABLE' | 'MILESTONE_RECOMMENDED' | 'GOAL_CHANGE_RECOMMENDED' | 'INSUFFICIENT_DATA';
  reachabilityReason: string;
  worked: string[];
  didNotWork: string[];
  changeNext: string;
  nextDestination: string;
  suggestedGoal: string;
};

export type GraduationHandoffRequest = {
  version: 1;
  type: 'GRADUATION_HANDOFF_REQUEST';
  strategist: {
    id: StrategistId;
    name: string;
    focus: string;
  };
  cycle: number;
  goal: {
    text: string;
    type: TwoDayReviewGoalType | null;
  };
  footprint: GraduationFootprint;
  journal: Array<{
    date: string;
    done: string[];
    deferred?: true;
    hard?: true;
  }>;
  reviews: Array<{
    day: number;
    date: string;
    answers: TwoDayReviewRecord['answers'];
  }>;
  strategies: Array<{
    strategist: StrategistId;
    counsel: string;
    nextMoves: string[];
    checkpoints: string[];
  }>;
  instructions: string[];
  response: {
    format: 'POTENO-RETURN v1';
    type: 'GRADUATION_HANDOFF_RESPONSE';
    encoding: 'UTF-8 JSON encoded as Base64';
    fallback: 'The same JSON between JSON_FALLBACK_BEGIN and JSON_FALLBACK_END';
    shape: GraduationHandoffAdvice & { type: 'GRADUATION_HANDOFF_RESPONSE' };
  };
};

export type ThirtyDayCycleArchive = {
  id: string;
  cycleNumber: number;
  mochiId: string;
  startedAt: string;
  completedAt: string;
  goalText: string;
  goalType: TwoDayReviewGoalType | null;
  footprint: GraduationFootprint;
  handoffAdvice: GraduationHandoffAdvice;
  dailyProgressRecords: DailyProgressRecord[];
  journalNotes: Record<string, string[]>;
  twoDayReviews: TwoDayReviewRecord[];
  strategyRecords: StrategyRecord[];
  divinationRecords: SixDivinationRecord[];
  learnedWords: string[];
  farewellLetter: string | null;
};

export type NextGoalChoice = 'continue' | 'revise' | 'new';

type GraduationSource = {
  goalText: string;
  journalNotes: Record<string, string[]>;
  dailyProgressRecords: DailyProgressRecord[];
  twoDayReviews: TwoDayReviewRecord[];
  strategyRecords: StrategyRecord[];
};

const NEGATIVE_REVIEW = /厳しい|あまり|微妙|作り直|無反応|鈍い|元に戻|できない|進まな|止ま/;
const POSITIVE_REVIEW = /かなり|一部|完璧|良い|反応があった|改善|継続|できる/;

function unique(items: readonly string[], limit = 5) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))].slice(0, limit);
}

function allJournalItems(source: Pick<GraduationSource, 'journalNotes' | 'dailyProgressRecords'>) {
  const dates = new Set([
    ...Object.keys(source.journalNotes),
    ...source.dailyProgressRecords.map((record) => record.reviewedDate),
  ]);
  return [...dates].sort().map((date) => {
    const record = source.dailyProgressRecords.find((item) => item.reviewedDate === date);
    const items = Object.prototype.hasOwnProperty.call(source.journalNotes, date)
      ? normalizeDoneItems(source.journalNotes[date] ?? [])
      : getDoneItems(record);
    return { date, items, record };
  });
}

function encodeUtf8Base64(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/**
 * Some LLM clients occasionally place literal line breaks inside JSON string
 * values before Base64 encoding.  Only those illegal control characters are
 * escaped; whitespace outside strings and all ordinary JSON syntax stay
 * untouched.
 */
function escapeRawJsonStringControls(value: string) {
  let result = '';
  let inString = false;
  let escaped = false;

  for (const character of value) {
    if (!inString) {
      result += character;
      if (character === '"') inString = true;
      continue;
    }

    if (escaped) {
      if (character === '\n') result += 'n';
      else if (character === '\r') result += 'r';
      else if (character === '\t') result += 't';
      else if (character.charCodeAt(0) < 0x20) result += `u${character.charCodeAt(0).toString(16).padStart(4, '0')}`;
      else result += character;
      escaped = false;
      continue;
    }

    if (character === '\\') {
      result += character;
      escaped = true;
    } else if (character === '"') {
      result += character;
      inString = false;
    } else if (character === '\n') result += '\\n';
    else if (character === '\r') result += '\\r';
    else if (character === '\t') result += '\\t';
    else if (character.charCodeAt(0) < 0x20) result += `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`;
    else result += character;
  }
  return result;
}

function parseJsonText(json: string): unknown {
  try {
    return JSON.parse(json);
  } catch (originalError) {
    const repaired = escapeRawJsonStringControls(json);
    if (repaired === json) throw originalError;
    return JSON.parse(repaired);
  }
}

function decodeUtf8Base64(value: string): unknown {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const json = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  return parseJsonText(json);
}

function wrapBase64(value: string) {
  return value.match(/.{1,76}/g)?.join('\n') ?? value;
}

function asStringArray(value: unknown, field: string) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error(`${field}を読み取れません。`);
  }
  return value.map((item) => item.trim()).filter(Boolean);
}

export function getGraduationStrategist(strategies: StrategyRecord[]): StrategistId {
  return strategies.at(-1)?.strategist ?? 'hanbei';
}

export function buildGraduationHandoffRequest(options: {
  cycleNumber: number;
  goalText: string;
  goalType: TwoDayReviewGoalType | null;
  footprint: GraduationFootprint;
  dailyProgressRecords: DailyProgressRecord[];
  journalNotes: Record<string, string[]>;
  twoDayReviews: TwoDayReviewRecord[];
  strategyRecords: StrategyRecord[];
}): GraduationHandoffRequest {
  const strategist = getGraduationStrategist(options.strategyRecords);
  const journal = allJournalItems({
    journalNotes: options.journalNotes,
    dailyProgressRecords: options.dailyProgressRecords,
  }).filter((entry) => entry.items.length > 0 || entry.record?.noteDeferred || entry.record?.wasHard)
    .map((entry) => ({
      date: entry.date,
      done: entry.items,
      ...(entry.record?.noteDeferred ? { deferred: true as const } : {}),
      ...(entry.record?.wasHard ? { hard: true as const } : {}),
    }));

  return {
    version: 1,
    type: 'GRADUATION_HANDOFF_REQUEST',
    strategist: {
      id: strategist,
      name: STRATEGIST_PROFILES[strategist].name,
      focus: STRATEGIST_PROFILES[strategist].tendency,
    },
    cycle: options.cycleNumber,
    goal: { text: options.goalText, type: options.goalType },
    footprint: options.footprint,
    journal,
    reviews: options.twoDayReviews.map((review) => ({
      day: review.targetDay,
      date: review.targetDate,
      answers: review.answers,
    })),
    strategies: options.strategyRecords.map((record) => ({
      strategist: record.strategist,
      counsel: record.counsel,
      nextMoves: record.nextMoves,
      checkpoints: record.checkpoints,
    })),
    instructions: [
      'これは30日目の卒業に伴う、次の30日への引き継ぎ査定です。入力された目標・足跡・日誌・2日後の振り返り・過去の作戦だけを根拠にしてください。',
      '前回の作戦で機能したもの、機能しなかったもの、止まった原因、次に変えるべきことを分析してください。入力にない出来事・数字・固有名詞を作らないでください。',
      '現在地から見て、同じ最終目標へ次の30日で現実的に到達できるかを査定してください。断定できない場合はINSUFFICIENT_DATAにしてください。',
      '30日での到達が難しいが方向は妥当ならMILESTONE_RECOMMENDEDとし、次の30日で到達できる具体的な中継地点をsuggestedGoalへ書いてください。',
      '目標そのものの再設定が必要ならGOAL_CHANGE_RECOMMENDEDとし、理由と、現実的な次の目標案をsuggestedGoalへ書いてください。到達可能ならREACHABLEとしてください。',
      '同じ目標を続ける場合も、前月と同じ作戦をそのまま繰り返さず、次の30日で試す変更をchangeNextへ書いてください。',
      '軍師の思考傾向を反映しつつ、相談者が判断できる明確で穏当な日本語にしてください。成功や失敗を保証せず、記録不足も正直に示してください。',
      '返却JSONは必ずJSON.stringify相当の正しいJSONとして生成してください。文章中の改行は実改行ではなく\\nとしてエスケープし、タブやその他の制御文字もJSON規則どおりにエスケープしてください。',
      '指定されたJSONをUTF-8 Base64へ変換し、POTENO-RETURN v1のDATA欄へ入れてください。Base64へ圧縮・gzip・Brotli等をかけてはいけません。文字コードはUTF-8だけを使ってください。',
      'Base64の直後へ、同じJSONをJSON_FALLBACK_BEGINとJSON_FALLBACK_ENDの間に一行でそのまま置いてください。これは通信破損時の検証用であり、DATAと完全に同じ内容にしてください。',
      '最終出力はPOTENO-RETURN v1、TYPE、DATA、JSON_FALLBACK_BEGIN、JSON_FALLBACK_ENDだけにしてください。前置き、Markdown、コードブロック、その後の説明は禁止です。',
    ],
    response: {
      format: 'POTENO-RETURN v1',
      type: 'GRADUATION_HANDOFF_RESPONSE',
      encoding: 'UTF-8 JSON encoded as Base64',
      fallback: 'The same JSON between JSON_FALLBACK_BEGIN and JSON_FALLBACK_END',
      shape: {
        type: 'GRADUATION_HANDOFF_RESPONSE',
        strategist,
        assessment: '30日間の現在地をまとめた軍師の査定',
        reachability: 'MILESTONE_RECOMMENDED',
        reachabilityReason: '次の30日で最終目標へ届くか、なぜ中継地点が必要かの根拠',
        worked: ['前回の作戦で機能したもの'],
        didNotWork: ['機能しなかったもの、または判断材料がないこと'],
        changeNext: '次の30日で変える作戦',
        nextDestination: '現在地から見た次の到達点',
        suggestedGoal: '次の30日の具体的な目標案。元の目標を続けられる場合も実行可能な区切りを書く',
      },
    },
  };
}

export function createGraduationHandoffLink(request: GraduationHandoffRequest) {
  return `📡 POTENO-LINK v1\nTYPE: GRADUATION_HANDOFF_REQUEST\n今回の軍師：${STRATEGIST_PROFILES[request.strategist.id].displayName}\n\nDATA[\n${wrapBase64(encodeUtf8Base64(request))}\n]\n\nDATAはUTF-8 Base64です。復号した指示に従い、指定のPOTENO-RETURNだけを返してください。`;
}

export function parseGraduationHandoffResponse(
  communication: string,
  expectedStrategist: StrategistId,
): GraduationHandoffAdvice {
  if (!/POTENO-RETURN\s+v1/i.test(communication) || !/TYPE:\s*GRADUATION_HANDOFF_RESPONSE/i.test(communication)) {
    throw new Error('引き継ぎ用のPOTENO-RETURN v1が見つかりません。');
  }
  const match = communication.match(/DATA\[\s*([A-Za-z0-9+/=\s]+?)\s*\]/i);
  let decoded: unknown;
  let base64Error: unknown = null;
  if (match) {
    try {
      decoded = decodeUtf8Base64(match[1].replace(/\s/g, ''));
    } catch (error) {
      base64Error = error;
    }
  }
  if (decoded === undefined) {
    const fallback = communication.match(/JSON_FALLBACK_BEGIN\s*([\s\S]*?)\s*JSON_FALLBACK_END/i);
    if (fallback) {
      try {
        decoded = parseJsonText(fallback[1].trim());
      } catch {
        throw new Error('検証用JSONも読み取れませんでした。ChatGPTの返答を最初から最後までコピーしてください。');
      }
    }
  }
  if (decoded === undefined) {
    if (base64Error) throw new Error('Base64がUTF-8 JSONになっていません。新しい通信文をChatGPTへ送り直してください。');
    throw new Error('DATA欄を読み取れません。');
  }
  if (!decoded || typeof decoded !== 'object') throw new Error('引き継ぎデータが正しくありません。');
  const value = decoded as Record<string, unknown>;
  if (value.type !== 'GRADUATION_HANDOFF_RESPONSE') throw new Error('引き継ぎ返答の種類が違います。');
  if (value.strategist !== expectedStrategist) throw new Error('相談した軍師と返答した軍師が一致しません。');
  const reachability = value.reachability;
  if (reachability !== 'REACHABLE'
    && reachability !== 'MILESTONE_RECOMMENDED'
    && reachability !== 'GOAL_CHANGE_RECOMMENDED'
    && reachability !== 'INSUFFICIENT_DATA') {
    throw new Error('到達可能性の査定を読み取れません。');
  }
  const requiredStrings = ['assessment', 'reachabilityReason', 'changeNext', 'nextDestination', 'suggestedGoal'] as const;
  for (const field of requiredStrings) {
    if (typeof value[field] !== 'string' || !(value[field] as string).trim()) {
      throw new Error(`${field}を読み取れません。`);
    }
  }
  return {
    strategist: expectedStrategist,
    assessment: (value.assessment as string).trim(),
    reachability,
    reachabilityReason: (value.reachabilityReason as string).trim(),
    worked: asStringArray(value.worked, '機能したもの'),
    didNotWork: asStringArray(value.didNotWork, '機能しなかったもの'),
    changeNext: (value.changeNext as string).trim(),
    nextDestination: (value.nextDestination as string).trim(),
    suggestedGoal: (value.suggestedGoal as string).trim(),
  };
}

export function buildGraduationFootprint(source: GraduationSource): GraduationFootprint {
  const journal = allJournalItems(source);
  const progressed = unique(journal.flatMap((entry) => entry.items).reverse(), 6).reverse();
  const itemCounts = new Map<string, number>();
  for (const item of journal.flatMap((entry) => entry.items)) {
    itemCounts.set(item, (itemCounts.get(item) ?? 0) + 1);
  }
  const repeated = [...itemCounts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((left, right) => right[1] - left[1])
    .map(([item, count]) => `「${item}」を${count}回記帳した`);
  const recordedDays = journal.filter((entry) => entry.items.length > 0).length;
  const continued = unique([
    ...repeated,
    ...(recordedDays >= 3 ? [`やったことを${recordedDays}日分残した`] : []),
    ...(source.twoDayReviews.length >= 2 ? [`2日後の振り返りを${source.twoDayReviews.length}回行った`] : []),
  ], 5);

  const deferredCount = source.dailyProgressRecords.filter((record) => record.noteDeferred).length;
  const negativeItems = source.twoDayReviews.flatMap((review) => (
    review.answers.filter((answer) => NEGATIVE_REVIEW.test(answer.answer)).map((answer) => `「${answer.item}」は${answer.answer}`)
  ));
  const stopped = unique([
    ...negativeItems,
    ...(deferredCount > 0 ? [`「後で記帳する」が${deferredCount}日分残った`] : []),
    ...(recordedDays === 0 ? ['やったことの記帳がまだない'] : []),
  ], 5);

  const strategyChanges = unique(source.strategyRecords.flatMap((record) => (
    (record.nextMoves ?? record.actions ?? []).map((item) => `${STRATEGIST_PROFILES[record.strategist ?? 'hanbei'].displayName}：${item}`)
  )).reverse(), 5).reverse();
  const importantCounsel = unique(source.strategyRecords.map((record) => (
    record.counsel ?? record.advice ?? record.strategy ?? record.summary ?? ''
  )).reverse(), 3).reverse();

  return {
    previousGoal: source.goalText || 'まだ決まっていない',
    progressed,
    continued,
    stopped,
    strategyChanges,
    importantCounsel,
    recordedDays,
    reviewedItems: source.twoDayReviews.reduce((total, review) => total + review.answers.length, 0),
  };
}

export function buildGraduationHandoffAdvice(
  footprint: GraduationFootprint,
  reviews: TwoDayReviewRecord[],
  strategies: StrategyRecord[],
): GraduationHandoffAdvice {
  const strategist = strategies.at(-1)?.strategist ?? 'hanbei';
  const positiveReviews = unique(reviews.flatMap((review) => (
    review.answers.filter((answer) => POSITIVE_REVIEW.test(answer.answer)).map((answer) => `「${answer.item}」は${answer.answer}`)
  )), 3);
  const worked = unique([
    ...positiveReviews,
    ...footprint.continued,
    ...footprint.progressed.slice(-2),
  ], 4);
  const didNotWork = unique(footprint.stopped, 4);

  const changeByStrategist: Record<StrategistId, string> = {
    komei: didNotWork.length > 0
      ? '前回の未実行部分をそのまま積み増さず、残り日数から逆算して優先順位を一つ減らしましょう。'
      : '続いた行動を軸に据え、次の30日は中盤と終盤の到達点を先に置きましょう。',
    sunzi: didNotWork.length > 0
      ? '止まった場所で努力量を増やさず、戦う場所か方法を一つ変えてから再開しましょう。'
      : '機能した行動へ力を集め、成果につながらない消耗は次の30日から外しましょう。',
    hanbei: didNotWork.length > 0
      ? '止まったことを全部救おうとせず、一番邪魔しているものを一つだけ外してみよう。'
      : '続いたものを増やすより、一番効いた一手をもっと簡単に繰り返せる形にしよう。',
  };

  return {
    strategist,
    assessment: '30日間の記録をもとに、次の一歩へ引き継ぐための簡易査定です。',
    reachability: footprint.recordedDays === 0 ? 'INSUFFICIENT_DATA' : 'MILESTONE_RECOMMENDED',
    reachabilityReason: footprint.recordedDays === 0
      ? '記帳が少ないため、次の30日で最終目標へ届くかはまだ判断できません。'
      : '記録された現在地を次の中継地点として固めてから、最終目標への距離を再査定します。',
    worked: worked.length > 0 ? worked : ['記録された行動から、次に残す一手を選べる'],
    didNotWork: didNotWork.length > 0 ? didNotWork : ['まだ機能しなかったと断定できる材料は少ない'],
    changeNext: changeByStrategist[strategist],
    nextDestination: footprint.progressed.length > 0
      ? `前回の到達点「${footprint.progressed.at(-1)}」から、もう一段先を次の区切りにする。`
      : 'まず記帳できる小さな一歩を作り、次の査定に残せる現在地を作る。',
    suggestedGoal: footprint.progressed.length > 0
      ? `「${footprint.progressed.at(-1)}」から、もう一段先へ進んだと確認できる状態を作る`
      : '小さな一歩を実行し、日誌へ記帳できる状態を作る',
  };
}

export function createThirtyDayCycleArchive(options: {
  cycleNumber: number;
  mochiId: string;
  activityDate: string;
  goalText: string;
  goalType: TwoDayReviewGoalType | null;
  footprint: GraduationFootprint;
  handoffAdvice: GraduationHandoffAdvice;
  dailyProgressRecords: DailyProgressRecord[];
  journalNotes: Record<string, string[]>;
  twoDayReviews: TwoDayReviewRecord[];
  strategyRecords: StrategyRecord[];
  divinationRecords: SixDivinationRecord[];
  learnedWords: string[];
  farewellLetter: string | null;
}): ThirtyDayCycleArchive {
  const dates = [
    ...Object.keys(options.journalNotes),
    ...options.dailyProgressRecords.flatMap((record) => [record.reviewedDate, record.date]),
  ].filter(Boolean).sort();
  const completedAt = new Date().toISOString();
  return {
    id: `cycle-${options.cycleNumber}-${Date.now()}`,
    cycleNumber: options.cycleNumber,
    mochiId: options.mochiId,
    startedAt: dates[0] ?? options.activityDate,
    completedAt,
    goalText: options.goalText,
    goalType: options.goalType,
    footprint: options.footprint,
    handoffAdvice: options.handoffAdvice,
    dailyProgressRecords: [...options.dailyProgressRecords],
    journalNotes: Object.fromEntries(Object.entries(options.journalNotes).map(([date, items]) => [date, [...items]])),
    twoDayReviews: [...options.twoDayReviews],
    strategyRecords: [...options.strategyRecords],
    divinationRecords: [...options.divinationRecords],
    learnedWords: [...options.learnedWords],
    farewellLetter: options.farewellLetter,
  };
}
