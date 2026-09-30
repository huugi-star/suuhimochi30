import { getDoneItems, normalizeDoneItems, type DailyProgressRecord } from './dailyProgress';
import {
  TWO_DAY_REVIEW_GOAL_TYPE_LABELS,
  type TwoDayReviewGoalType,
  type TwoDayReviewRecord,
} from './twoDayReview';

export const POTENO_LINK_VERSION = 1 as const;

export type StrategistId = 'komei' | 'sunzi' | 'hanbei';

export type StrategistProfile = {
  id: StrategistId;
  name: string;
  displayName: string;
  tendency: string;
};

export const STRATEGIST_PROFILES: Record<StrategistId, StrategistProfile> = {
  komei: {
    id: 'komei',
    name: '諸葛亮孔明',
    displayName: '孔明さん',
    tendency: '現在の兆候から未来を静かに見通し、残り日数と30日全体を未来から逆算して、優先順位と布石を整える。静かで清らかな洞察にする。',
  },
  sunzi: {
    id: 'sunzi',
    name: '孫子',
    displayName: '孫子さん',
    tendency: '少し痛いところにも踏み込み、戦場・配置・勝ち筋・消耗・戦わない選択から分析する。短く鋭く、的を射る忠言にする。',
  },
  hanbei: {
    id: 'hanbei',
    name: '竹中半兵衛',
    displayName: '竹中半兵衛さん',
    tendency: '子供っぽい親しみと柔らかさを残しながら、「問題はそこじゃないよ」と無駄・ボトルネック・最も効く一手の核心を鋭く突く。',
  },
};

export type StrategyAdvice = {
  strategist: StrategistId;
  counsel: string;
  potenoSummary: string;
  nextMoves: string[];
  checkpoints: string[];
};

export type StrategyRecord = StrategyAdvice & {
  id: string;
  consultedDay: number;
  savedAt: string;
  /** Legacy v1 fields remain optional so old local saves can be migrated. */
  summary?: string;
  goodSigns?: string[];
  concerns?: string[];
  unknowns?: string[];
  advice?: string;
  actions?: string[];
  observe?: string[];
  strategy?: string;
};

export type StrategyRequestData = {
  linkVersion: 1;
  requestType: 'STRATEGY_REQUEST';
  generatedAt: string;
  strategist: StrategistProfile;
  goal: {
    text: string;
    type: TwoDayReviewGoalType | null;
    typeLabel: string;
  };
  currentDay: number;
  journal: Array<{
    day: number;
    date: string;
    doneItems: string[];
    circumstance?: string[];
    wasHard?: boolean;
  }>;
  twoDayReviews: Array<{
    targetDay: number;
    targetDate: string;
    mode: TwoDayReviewRecord['mode'];
    answers: TwoDayReviewRecord['answers'];
  }>;
  pastStrategies: Array<{
    strategist: StrategistId;
    consultedDay: number;
    savedAt: string;
    counsel: string;
    potenoSummary: string;
    nextMoves: string[];
    checkpoints: string[];
  }>;
  consultation: string | null;
  analysisRules: string[];
  responseProtocol: {
    name: 'POTENO-RETURN';
    version: 1;
    encoding: 'UTF-8 JSON encoded as Base64';
    template: string;
  };
  requiredResponseShape: StrategyAdvice;
};

/**
 * Compact v1 payload used inside DATA[].  The outer POTENO-LINK version and
 * the response protocol stay unchanged; only redundant request JSON is
 * removed.  Keys remain descriptive so ChatGPT can decode it reliably.
 */
export type CompactStrategyRequestData = {
  v: 1;
  type: 'STRATEGY_REQUEST';
  strategist: {
    id: StrategistId;
    name: string;
    focus: string;
  };
  goal: {
    text: string;
    type: TwoDayReviewGoalType | null;
  };
  day: number;
  journal: Array<{
    day: number;
    date: string;
    done: string[];
    context?: string[];
    hard?: true;
  }>;
  reviews: Array<{
    day: number;
    date: string;
    mode: TwoDayReviewRecord['mode'];
    answers: TwoDayReviewRecord['answers'];
  }>;
  strategies: Array<{
    strategist: StrategistId;
    day: number;
    savedAt: string;
    counsel: string;
    potenoSummary: string;
    nextMoves: string[];
    checkpoints: string[];
  }>;
  question: string | null;
  rules: string[];
  response: {
    format: 'POTENO-RETURN v1';
    encoding: 'UTF-8 JSON → Base64';
    template: string;
    json: StrategyAdvice;
  };
};

export type StrategyRequestLinkLengthComparison = {
  before: number;
  after: number;
  saved: number;
  reductionPercent: number;
};

type BuildStrategyRequestOptions = {
  strategist: StrategistId;
  goalText: string;
  goalType: TwoDayReviewGoalType | null;
  currentDay: number;
  activityDate: string;
  dailyProgressRecords: DailyProgressRecord[];
  journalNotes: Record<string, string[]>;
  twoDayReviews: TwoDayReviewRecord[];
  strategyRecords: StrategyRecord[];
  consultation: string;
};

const ANALYSIS_RULES = [
  'このリクエストのtypeはSTRATEGY_REQUESTです。会話履歴に卒業査定や他のPOTENO-LINKが存在していても参照せず、今回のDATAだけを処理してください。STRATEGY_REQUESTに対してGRADUATION_HANDOFF_RESPONSEを返してはいけません。返答は必ずSTRATEGY_RESPONSEとし、JSONはstrategist、counsel、potenoSummary、nextMoves、checkpointsの5項目だけを使用してください。',
  '指定された軍師の思考傾向と個性を強く反映し、単なる要約ではなく、本人が気づいていない構造・原因・勘違いまで踏み込んだcounselを書く。',
  '軍師本人の口調を過剰に真似せず、軍師がポテノへ与えた洞察としてまとめる。',
  'potenoSummaryでは、counselが今回のどのDAY・行動・数字・未実行日を指すのか具体化する。',
  'nextMovesは次の7日間だけの実行可能な計略を3〜5項目にし、一度に多くを変えず最重要仮説を検証する。',
  'checkpointsは7日後に見る変化、止まった箇所、予想外の点を挙げ、次回の戦略修正に使える情報にする。',
  '4ブロック以外を増やさず、重複説明は削るが分析の深さと必要な文章量は維持する。',
  '短期間で結果が出ていないだけで失敗と断定しない。',
  '実際にやったことと2日後の振り返りを重視する。',
  'ホップ、ステップ、ジャンプ、ひと呼吸等の自己評価は分析に使用しない。',
  '判断材料不足なら無理に結論を出さず、不足している情報をpotenoSummaryかcheckpointsへ明記する。',
  '入力記録に存在しない書籍名・数字・出来事を推測で追加しない。固有名詞は必ず入力データの表記と内容に忠実に扱う。',
  '過去の作戦がある場合は、実行後にどう変化したかも確認する。',
  '日誌の時系列を短く潰しすぎず、変化が分かるように扱う。',
  'requiredResponseShapeと同じキーを持つJSONをUTF-8のBase64へ変換し、POTENO-RETURNのDATA欄へ入れる。',
  '返答の最後には必ずPOTENO-RETURNだけを、コードブロック等で一目でコピーできる形にして出力する。',
];

const COMPACT_ANALYSIS_RULES = [
  'このリクエストのtypeはSTRATEGY_REQUEST。会話履歴に卒業査定や他のPOTENO-LINKがあっても参照せず、今回のDATAだけを処理する。STRATEGY_REQUESTにGRADUATION_HANDOFF_RESPONSEを返してはいけない。返答は必ずSTRATEGY_RESPONSEとし、JSONはstrategist、counsel、potenoSummary、nextMoves、checkpointsの5項目だけを使う。',
  'strategist.focusの個性を強く反映する。軍師本人の口調を過剰に真似せず、ポテノへの洞察としてまとめる。',
  'counselは要約で終わらず、本人が気づかない構造・原因・勘違いまで一段深く分析する。',
  'potenoSummaryはcounselを、実際のDAY・行動・数字・未実行日を根拠に具体化する。軍師=洞察、ポテノ=具体化を分ける。',
  'nextMovesは次の7日間だけの実行可能な計略を3〜5件。一度に多く変えず、最重要仮説を検証する。',
  'checkpointsは7日後の変化・止まった箇所・予想外を確認し、次回の戦略修正に使える情報にする。',
  '4ブロック以外を増やさない。重複は削るが、文章量を減らしすぎず分析の深さを保つ。',
  'journalをDAY順に見て、実際にやった内容とreviewsを重視する。時系列の変化を短く潰しすぎない。',
  '短期間で結果が出ないだけで失敗と断定しない。不足情報はpotenoSummaryかcheckpointsへ書く。',
  '入力にない書籍名・数字・出来事は推測で追加しない。固有名詞は入力データに忠実に扱う。',
  'strategiesがあれば、作戦実行後に何が変化したかも確認する。',
  'ホップ・ステップ・ジャンプ・ひと呼吸等の自己評価は分析に使わない。',
  'response.jsonと同じキーのJSONをUTF-8→Base64にして、response.templateの<Base64>へ入れる。',
  '最後にPOTENO-RETURNだけを、コピーしやすいコードブロックで出力する。',
];

function responseShape(strategist: StrategistId): StrategyAdvice {
  return {
    strategist,
    counsel: '軍師の忠言。原因や本人が気づいていない構造まで分析する。',
    potenoSummary: '忠言が今回のどのDAY・行動・数字を指すのか、ポテノが具体化する。',
    nextMoves: ['次の7日間で実行する具体策を3〜5件'],
    checkpoints: ['7日後に確認する変化・停止箇所・予想外の点'],
  };
}

function dateDistance(from: string, to: string) {
  const fromDate = new Date(`${from}T12:00:00`);
  const toDate = new Date(`${to}T12:00:00`);
  return Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000);
}

export function buildStrategyRequestData({
  strategist,
  goalText,
  goalType,
  currentDay,
  activityDate,
  dailyProgressRecords,
  journalNotes,
  twoDayReviews,
  strategyRecords,
  consultation,
}: BuildStrategyRequestOptions): StrategyRequestData {
  const dates = new Set<string>(Object.keys(journalNotes));
  dailyProgressRecords.forEach((record) => dates.add(record.reviewedDate));

  const journal = [...dates]
    .map((date) => {
      const record = dailyProgressRecords.find((item) => item.reviewedDate === date);
      const doneItems = normalizeDoneItems(
        Object.prototype.hasOwnProperty.call(journalNotes, date)
          ? journalNotes[date]
          : getDoneItems(record),
      );
      const day = currentDay + dateDistance(activityDate, date);
      return {
        day,
        date,
        doneItems,
        ...(record?.yesterdayEvaluation === 'BREATH' && doneItems.length > 0
          ? { circumstance: doneItems }
          : {}),
        ...(record?.wasHard ? { wasHard: true } : {}),
      };
    })
    .filter((entry) => entry.day >= 1 && entry.day <= currentDay)
    .sort((left, right) => left.day - right.day);

  return {
    linkVersion: POTENO_LINK_VERSION,
    requestType: 'STRATEGY_REQUEST',
    generatedAt: new Date().toISOString(),
    strategist: STRATEGIST_PROFILES[strategist],
    goal: {
      text: goalText,
      type: goalType,
      typeLabel: goalType ? TWO_DAY_REVIEW_GOAL_TYPE_LABELS[goalType] : '未設定',
    },
    currentDay,
    journal,
    twoDayReviews: [...twoDayReviews]
      .sort((left, right) => left.targetDay - right.targetDay)
      .map((review) => ({
        targetDay: review.targetDay,
        targetDate: review.targetDate,
        mode: review.mode,
        answers: review.answers,
      })),
    pastStrategies: [...strategyRecords]
      .sort((left, right) => left.consultedDay - right.consultedDay)
      .map((record) => ({
        strategist: record.strategist ?? 'hanbei',
        consultedDay: record.consultedDay,
        savedAt: record.savedAt,
        counsel: record.counsel ?? record.advice ?? record.strategy ?? record.summary ?? '',
        potenoSummary: record.potenoSummary ?? record.summary ?? '',
        nextMoves: record.nextMoves ?? record.actions ?? [],
        checkpoints: record.checkpoints ?? record.observe ?? [],
      })),
    consultation: consultation.trim() || null,
    analysisRules: ANALYSIS_RULES,
    responseProtocol: {
      name: 'POTENO-RETURN',
      version: POTENO_LINK_VERSION,
      encoding: 'UTF-8 JSON encoded as Base64',
      template: `📡 POTENO-RETURN v1\nTYPE: STRATEGY_RESPONSE\n(｀・ω・´)ゞ ｸﾞﾝｼﾉﾃﾞﾝｺﾞﾝ ｼﾞｭｼﾝ……\n\n今回の軍師：${STRATEGIST_PROFILES[strategist].displayName}\n\nDATA[\n<Base64>\n]\n\n🍠 通信完了……`,
    },
    requiredResponseShape: responseShape(strategist),
  };
}

function encodeUtf8(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 16_384) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 16_384));
  }
  return btoa(binary);
}

function decodeUtf8(value: string) {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

function wrapBase64(value: string) {
  return value.match(/.{1,76}/g)?.join('\n') ?? value;
}

export function compactStrategyRequestData(
  data: StrategyRequestData,
): CompactStrategyRequestData {
  return {
    v: POTENO_LINK_VERSION,
    type: data.requestType,
    strategist: {
      id: data.strategist.id,
      name: data.strategist.name,
      focus: data.strategist.tendency,
    },
    goal: {
      text: data.goal.text,
      type: data.goal.type,
    },
    day: data.currentDay,
    journal: data.journal.map((entry) => ({
      day: entry.day,
      date: entry.date,
      done: entry.doneItems,
      ...(entry.circumstance ? { context: entry.circumstance } : {}),
      ...(entry.wasHard ? { hard: true as const } : {}),
    })),
    reviews: data.twoDayReviews.map((review) => ({
      day: review.targetDay,
      date: review.targetDate,
      mode: review.mode,
      answers: review.answers,
    })),
    strategies: data.pastStrategies.map((strategy) => ({
      strategist: strategy.strategist,
      day: strategy.consultedDay,
      savedAt: strategy.savedAt,
      counsel: strategy.counsel,
      potenoSummary: strategy.potenoSummary,
      nextMoves: strategy.nextMoves,
      checkpoints: strategy.checkpoints,
    })),
    question: data.consultation,
    rules: COMPACT_ANALYSIS_RULES,
    response: {
      format: 'POTENO-RETURN v1',
      encoding: 'UTF-8 JSON → Base64',
      template: data.responseProtocol.template,
      json: data.requiredResponseShape,
    },
  };
}

function createStrategyRequestEnvelope(
  data: StrategyRequestData,
  strategistAside: string,
  payload: unknown,
) {
  const strategist = data.strategist;
  return `📡 POTENO-LINK v${POTENO_LINK_VERSION}  ( •̀ω•́ )✧\nTYPE: STRATEGY_REQUEST\n🍠 ﾎﾟﾃﾎﾟﾃ……軍師のところへ通信準備中……\n(ง ˙ω˙)ว ～📶～\n\n今回の軍師：${strategist.displayName}\n\n軍師：${strategist.name}\n「${strategistAside}」\n\nDATA[\n${wrapBase64(encodeUtf8(payload))}\n]\n\n✨ﾋﾟｺｰﾝ！✨\n※このいもに特に意味はありません 🍠`;
}

export function createStrategyRequestLink(
  data: StrategyRequestData,
  strategistAside: string,
) {
  return createStrategyRequestEnvelope(
    data,
    strategistAside,
    compactStrategyRequestData(data),
  );
}

export function compareStrategyRequestLinkLength(
  data: StrategyRequestData,
  strategistAside: string,
): StrategyRequestLinkLengthComparison {
  const before = createStrategyRequestEnvelope(data, strategistAside, data).length;
  const after = createStrategyRequestLink(data, strategistAside).length;
  return {
    before,
    after,
    saved: before - after,
    reductionPercent: before === 0
      ? 0
      : Math.round(((before - after) / before) * 10_000) / 100,
  };
}

export function parseStrategyRequestLink(
  communication: string,
): StrategyRequestData | CompactStrategyRequestData {
  if (!/POTENO-LINK\s+v1/i.test(communication)) {
    throw new Error('POTENO-LINK v1が見つかりません。');
  }
  const match = communication.match(/DATA\[\s*([A-Za-z0-9+/=\s]+?)\s*\]/i);
  if (!match) throw new Error('DATA欄を読み取れません。');

  const decoded = decodeUtf8(match[1].replace(/\s/g, ''));
  if (!decoded || typeof decoded !== 'object') {
    throw new Error('JSONの内容が正しくありません。');
  }
  const value = decoded as Record<string, unknown>;
  const isVerboseV1 = value.linkVersion === 1 && value.requestType === 'STRATEGY_REQUEST';
  const isCompactV1 = value.v === 1 && value.type === 'STRATEGY_REQUEST';
  if (!isVerboseV1 && !isCompactV1) {
    throw new Error('POTENO-LINK v1のデータではありません。');
  }
  return decoded as StrategyRequestData | CompactStrategyRequestData;
}

/** Used for protocol tests and for showing ChatGPT the required return shell. */
export function createPotenoReturn(data: StrategyAdvice) {
  const strategist = STRATEGIST_PROFILES[data.strategist];
  return `📡 POTENO-RETURN v${POTENO_LINK_VERSION}\nTYPE: STRATEGY_RESPONSE\n(｀・ω・´)ゞ ｸﾞﾝｼﾉﾃﾞﾝｺﾞﾝ ｼﾞｭｼﾝ……\n\n今回の軍師：${strategist.displayName}\n\nDATA[\n${wrapBase64(encodeUtf8(data))}\n]\n\n🍠 通信完了……`;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new Error('配列の内容が正しくありません。');
  }
  return value.map((item) => item.trim()).filter(Boolean);
}

function isStrategist(value: unknown): value is StrategistId {
  return value === 'komei' || value === 'sunzi' || value === 'hanbei';
}

export function parseStrategyResponse(
  communication: string,
  expectedStrategist?: StrategistId | null,
): StrategyAdvice {
  if (!/POTENO-RETURN\s+v1/i.test(communication)) {
    throw new Error('POTENO-RETURN v1が見つかりません。');
  }
  if (!/TYPE:\s*STRATEGY_RESPONSE\b/i.test(communication)) {
    throw new Error('TYPE: STRATEGY_RESPONSEが見つかりません。');
  }
  const match = communication.match(/DATA\[\s*([A-Za-z0-9+/=\s]+?)\s*\]/i);
  if (!match) throw new Error('DATA欄を読み取れません。');

  const decoded = decodeUtf8(match[1].replace(/\s/g, ''));
  if (!decoded || typeof decoded !== 'object') {
    throw new Error('JSONの内容が正しくありません。');
  }
  const value = decoded as Record<string, unknown>;
  if (!isStrategist(value.strategist)) throw new Error('軍師の情報が正しくありません。');
  if (expectedStrategist && value.strategist !== expectedStrategist) {
    throw new Error('相談した軍師と、返答した軍師が一致しません。');
  }
  const hasFourBlocks = typeof value.counsel === 'string'
    && typeof value.potenoSummary === 'string';
  const hasLegacyBlocks = typeof value.summary === 'string'
    && typeof value.advice === 'string';
  if (!hasFourBlocks && !hasLegacyBlocks) {
    throw new Error('軍師回答の4ブロックを読み取れません。');
  }

  if (hasFourBlocks) {
    return {
      strategist: value.strategist,
      counsel: (value.counsel as string).trim(),
      potenoSummary: (value.potenoSummary as string).trim(),
      nextMoves: asStringArray(value.nextMoves),
      checkpoints: asStringArray(value.checkpoints),
    };
  }

  const legacyDetails = [
    value.summary as string,
    ...asStringArray(value.goodSigns).map((item) => `良い兆候：${item}`),
    ...asStringArray(value.concerns).map((item) => `気になる点：${item}`),
    ...asStringArray(value.unknowns).map((item) => `まだ分からないこと：${item}`),
  ];
  return {
    strategist: value.strategist,
    counsel: (value.advice as string).trim(),
    potenoSummary: legacyDetails.filter(Boolean).join('\n'),
    nextMoves: asStringArray(value.actions),
    checkpoints: asStringArray(value.observe),
  };
}

export function createStrategyRecord(
  advice: StrategyAdvice,
  consultedDay: number,
): StrategyRecord {
  return {
    ...advice,
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `strategy-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    consultedDay,
    savedAt: new Date().toISOString(),
  };
}
