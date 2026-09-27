import type { DailyProgressRecord } from './dailyProgress';
import type { TwoDayReviewRecord } from './twoDayReview';
import { revealTamamoCrossroadsResult, type TamamoPasser, type TamamoResultV1 } from './tamamoCrossroads';
export type { TamamoKotodamaTheme, TamamoPasser, TamamoPasserForm, TamamoResultV1, TamamoVoice } from './tamamoCrossroads';

export const POTENO_DIVINATION_LINK_VERSION = 1 as const;

export type DivinationMasterId =
  | 'seimei'
  | 'taikobo'
  | 'tamamo'
  | 'saint-germain'
  | 'asteria'
  | 'davinci';

export const DIVINATION_MASTER_PROFILES: Record<
  DivinationMasterId,
  { name: string; shortName: string; art: string; specialty: string; interpretation: string }
> = {
  seimei: {
    name: '安倍晴明',
    shortName: '晴明',
    art: '暦・方位占',
    specialty: '暦と方位から流れを整える',
    interpretation: '冷静で端正。凶兆は少し挑発的に示すが、必ず現実的な対処法を添える。',
  },
  taikobo: {
    name: '太公望',
    shortName: '太公望',
    art: '易占',
    specialty: '変化の兆しと大局を読む',
    interpretation: '飄々としているが易には鋭い。若者言葉と古風な言葉が自然に混ざる。',
  },
  tamamo: {
    name: '玉藻の前',
    shortName: '玉藻の前',
    art: '辻占・縁占',
    specialty: '本心・欲望・縁の動きを読む',
    interpretation: 'つんとした態度の奥で色恋や人の本心に強い関心を持ち、下心まで鋭く見抜く。',
  },
  'saint-germain': {
    name: 'サンジェルマン伯爵',
    shortName: '伯爵',
    art: 'タロット',
    specialty: '表層・深層・鍵を読む',
    interpretation: '優雅なおネエ口調。核心に近づくほど威圧感が増し、最後は軽やかに戻る。',
  },
  asteria: {
    name: 'アステリア',
    shortName: 'アステリア',
    art: '占星術',
    specialty: '星の配置と長い周期を見る',
    interpretation: '清廉で神秘的。星には詳しいが、地上の常識には少し疎い。',
  },
  davinci: {
    name: 'ダ・ヴィンチ',
    shortName: 'ダ・ヴィンチ',
    art: '数秘術',
    specialty: '数字の構造と反復を読む',
    interpretation: '好奇心旺盛な万能の天才。理知的な分析の中へ自然に自慢を挟む。',
  },
};

export type AutomaticCalculationInput = {
  birthDate: string;
  targetDate: string;
};

export type HeavenlyStem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸';
export type EarthlyBranch = '子' | '丑' | '寅' | '卯' | '辰' | '巳' | '午' | '未' | '申' | '酉' | '戌' | '亥';
export type FiveElement = 'wood' | 'fire' | 'earth' | 'metal' | 'water';
export type YinYang = 'yang' | 'yin';
export type CalendarMarkId = 'advance' | 'arrange' | 'receive' | 'store' | 'expand' | 'nurture' | 'defend' | 'observe' | 'decide' | 'small_move';
export type DirectionId = 'north' | 'northeast' | 'east' | 'southeast' | 'south' | 'southwest' | 'west' | 'northwest';
export type BranchRelation = 'same' | 'six-harmony' | 'three-harmony' | 'six-clash' | 'six-harm' | 'none';
export type DirectionCondition = 'overlap' | 'combine' | 'harmony' | 'flow' | 'clash' | 'gap';
export type FiveElementRelation = 'same-element' | 'day-generates-self' | 'self-generates-day' | 'day-controls-self' | 'self-controls-day';
export type SeimeiCalculationInput = { birthDate: string; targetDate: string };

/** Kept only for already-saved skeleton-v1 readings. New calculations never return this shape. */
export type SeimeiSkeletonResult = {
  type: 'calendar-direction';
  calculationVersion: 'skeleton-v1';
  provisional: true;
  targetDate: string;
  birthDate: string;
  direction: string;
  calendarMark: string;
};

export type SeimeiCalendarResult = {
  type: 'calendar-direction';
  calculationVersion: 'seimei-calendar-v1';
  provisional: false;
  targetDate: string;
  birthDate: string;
  birthKanshi: { index: number; label: string; stem: HeavenlyStem; branch: EarthlyBranch; element: FiveElement; yinYang: YinYang };
  targetKanshi: { index: number; label: string; stem: HeavenlyStem; branch: EarthlyBranch; element: FiveElement; yinYang: YinYang };
  calendar: {
    relation: FiveElementRelation;
    yinYangRelation: 'same' | 'different';
    id: CalendarMarkId;
    label: string;
    theme: string;
    tempo: 'slow' | 'normal' | 'fast';
    actionScale: 'small' | 'normal' | 'large';
    recommended: string[];
    caution: string[];
  };
  direction: {
    id: DirectionId;
    trigram: '坎' | '艮' | '震' | '巽' | '離' | '坤' | '兌' | '乾';
    label: string;
    theme: string;
    object: string;
    objectLong: string;
    relation: BranchRelation;
    condition: DirectionCondition;
    conditionLabel: '重' | '合' | '和' | '巡' | '冲' | '隔';
  };
  fixedReading: string;
  methodNote: '干支・陰陽五行・十二支方位を骨格にしたポテノ六占独自の暦方位';
};

export type SeimeiResult = SeimeiSkeletonResult | SeimeiCalendarResult;

export type MoonPhaseId = 'new' | 'waxing_crescent' | 'first_quarter' | 'waxing_gibbous' | 'full' | 'waning_gibbous' | 'last_quarter' | 'waning_crescent';
export type ZodiacSignId = 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo' | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces';
export type ZodiacElement = 'fire' | 'earth' | 'air' | 'water';
export type ZodiacModality = 'cardinal' | 'fixed' | 'mutable';
export type LunarNatalSunAspectId = 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition' | 'none';
export type SolarCycleId = 'return' | 'growth' | 'trial' | 'development' | 'reflection' | 'maturation' | 'reorganization' | 'closure';
export type AsteriaCalculationInput = { birthDate: string; targetDate: string };

/** Kept only for already-saved skeleton-v1 readings. New calculations never return this shape. */
export type AsteriaSkeletonResult = {
  type: 'astrology';
  calculationVersion: 'skeleton-v1';
  provisional: true;
  birthDate: string;
  birthplace: string;
  sunSign: string;
  starMarker: string;
};

export type AsteriaLunarSolarResult = {
  type: 'astrology';
  calculationVersion: 'asteria-lunar-solar-v1';
  provisional: false;
  targetDate: string;
  birthDate: string;
  birthSun: { longitude: number; sign: ZodiacSignId; label: string; calculationMode: 'date-reference'; assumedTime: '12:00 JST'; nearSignBoundary: boolean; boundaryDistance: number };
  moonPhase: { id: MoonPhaseId; label: string; theme: string; angle: number; action: string };
  moonSign: { id: ZodiacSignId; label: string; theme: string; object: string; longitude: number; element: ZodiacElement; modality: ZodiacModality };
  personalAspect: { id: LunarNatalSunAspectId; label: string; angle: number | null; exactDifference: number; theme: string };
  solarCycle: { id: SolarCycleId; label: string; theme: string; progressDegrees: number };
  fixedMeaning: { phase: string; domain: string; personalCondition: string; longTermBackground: string };
  fixedReading: string;
  methodNote: string;
};

export type AsteriaResult = AsteriaSkeletonResult | AsteriaLunarSolarResult;

export type BasicNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type CoreNumber = BasicNumber | 11 | 22 | 33;
export type StyleNumber = BasicNumber;
export type StructureLayer = 'generation' | 'formation' | 'integration';
export type DaVinciRelationId = 'overlap' | 'mirror' | 'same_layer' | 'development' | 'leap' | 'reduction' | 'compression';
export type GeometryId = 'point' | 'line' | 'triangle' | 'square' | 'pentagon' | 'hexagon' | 'heptagram' | 'octagon' | 'circle' | 'double-line' | 'double-square' | 'double-hexagon';

/** Kept only for already-saved skeleton-v1 readings. New calculations never return this shape. */
export type DaVinciSkeletonResult = {
  type: 'numerology';
  calculationVersion: 'skeleton-v1';
  provisional: true;
  birthDate: string;
  lifePathNumber: number;
  geometry: string;
};

export type DaVinciStructureResult = {
  type: 'numerology';
  calculationVersion: 'davinci-structure-v1';
  provisional: false;
  birthDate: string;
  core: { rawSum: number; reductionPath: number[]; number: CoreNumber; effectiveNumber: BasicNumber; isMaster: boolean; masterNumber?: 11 | 22 | 33; baseNumber: BasicNumber; keyword: string; geometry: GeometryId; geometryLabel: string; layer: StructureLayer };
  style: { rawValue: number; reductionPath: number[]; number: StyleNumber; keyword: string; geometry: GeometryId; geometryLabel: string; layer: StructureLayer };
  relation: { id: DaVinciRelationId; label: string; theme: string; meaning: string };
  masterModifier?: { number: 11 | 22 | 33; label: string; theme: string; meaning: string };
  geometry: { coreShape: GeometryId; styleShape: GeometryId; relationAnimation: DaVinciRelationId };
  fixedMeaning: { core: string; style: string; relation: string; master?: string };
  fixedReading: string;
  characterReading: string;
  methodNote: string;
};

export type DaVinciResult = DaVinciSkeletonResult | DaVinciStructureResult;

export type LegacyIChingResult = {
  type: 'iching';
  lines: number[];
  baseHexagram: string;
  movingLines: number[];
  resultingHexagram: string;
};
export type TrigramId = 'qian' | 'dui' | 'li' | 'zhen' | 'xun' | 'kan' | 'gen' | 'kun';
export type HexagramDefinition = { number: number; id: string; name: string; fullName: string; upperTrigram: TrigramId; lowerTrigram: TrigramId; theme: string; structure: string; movement: string; caution: string };
export type MovingLineResult = { position: 1 | 2 | 3 | 4 | 5 | 6; value: 6 | 9; positionId: 'beginning' | 'inner' | 'boundary' | 'contact' | 'center' | 'extreme'; positionLabel: string; positionMeaning: string; direction: 'yin-to-yang' | 'yang-to-yin'; directionLabel: string; directionMeaning: string };
export type TaikoboResult = { type: 'iching'; calculationVersion: 'taikobo-iching-v1'; provisional: false; lines: [6 | 7 | 8 | 9, 6 | 7 | 8 | 9, 6 | 7 | 8 | 9, 6 | 7 | 8 | 9, 6 | 7 | 8 | 9, 6 | 7 | 8 | 9]; baseHexagram: HexagramDefinition; movingLines: MovingLineResult[]; changeState: { count: number; id: 'still' | 'single' | 'linked' | 'transition' | 'change_dominant' | 'major_shift' | 'total_shift'; label: string; meaning: string }; stableAnchor?: { position: 1 | 2 | 3 | 4 | 5 | 6; label: string; meaning: string }; resultingHexagram: HexagramDefinition; fixedMeaning: { currentStructure: string; changeAmount: string; changePoints: string; resultingStructure: string }; fixedReading: string; characterReading: string; methodNote: string };
export type IChingResult = LegacyIChingResult | TaikoboResult;

export type LegacyTamamoResult = {
  type: 'crossroads';
  silhouetteId: string;
  phrase: string;
};
export type TamamoResult = LegacyTamamoResult | TamamoResultV1;

export type TarotArcana = 'major' | 'wands' | 'cups' | 'swords' | 'pentacles';
export type TarotDefinition = { id: string; name: string; arcana: TarotArcana; coreTheme: string; uprightMeaning: string; reversedMeaning: string };
export type TarotCardResult = {
  id: string;
  name: string;
  orientation: 'upright' | 'reversed';
  role: '表層' | '深層' | '鍵';
  coreTheme: string;
  orientationMeaning: string;
};

export type LegacySaintGermainResult = {
  type: 'tarot';
  cards: [TarotCardResult, TarotCardResult, TarotCardResult];
};
export type SaintGermainResultV1 = { type: 'tarot'; calculationVersion: 'saint-germain-three-card-v1'; provisional: false; cards: [TarotCardResult, TarotCardResult, TarotCardResult]; fixedMeaning: { surface: string; depth: string; key: string }; characterReading: string; methodNote: string };
export type SaintGermainResult = LegacySaintGermainResult | SaintGermainResultV1;

export type SixDivinationResults = {
  seimei: SeimeiResult;
  taikobo: IChingResult;
  tamamo: TamamoResult;
  saintGermain: SaintGermainResult;
  asteria: AsteriaResult;
  davinci: DaVinciResult;
};

export type DivinationJournalEntry = {
  day: number;
  date: string;
  doneItems: string[];
  wasHard: boolean;
  twoDayReview?: { items: string[]; answers: { item: string; answer: string }[] };
};

export type SixDivinationRequestData = {
  protocol: 'POTENO-LINK';
  version: 1;
  type: 'SIX_DIVINATION_REQUEST';
  createdAt: string;
  selectedMaster: DivinationMasterId;
  masterProfile: (typeof DIVINATION_MASTER_PROFILES)[DivinationMasterId];
  consultation: string;
  user: { birthDate: string };
  goal: { text: string; currentDay: number; activityDate: string };
  sixResults: SixDivinationResults;
  journal: DivinationJournalEntry[];
  rules: string[];
  requiredResponse: SixDivinationResponse;
};

export type SixDivinationResponse = {
  type: 'SIX_DIVINATION_RESPONSE';
  master: DivinationMasterId;
  integratedReading: string;
  potenoSummary: string;
  focus: string[];
};

export type SixDivinationRecord = SixDivinationResponse & {
  id: string;
  savedAt: string;
  consultedDay: number;
  consultation: string;
  sixResults: SixDivinationResults;
};

const STEMS: HeavenlyStem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const BRANCHES: EarthlyBranch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

function stableHash(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

const STEM_META: Record<HeavenlyStem, { element: FiveElement; yinYang: YinYang }> = {
  甲: { element: 'wood', yinYang: 'yang' }, 乙: { element: 'wood', yinYang: 'yin' },
  丙: { element: 'fire', yinYang: 'yang' }, 丁: { element: 'fire', yinYang: 'yin' },
  戊: { element: 'earth', yinYang: 'yang' }, 己: { element: 'earth', yinYang: 'yin' },
  庚: { element: 'metal', yinYang: 'yang' }, 辛: { element: 'metal', yinYang: 'yin' },
  壬: { element: 'water', yinYang: 'yang' }, 癸: { element: 'water', yinYang: 'yin' },
};

const GENERATES: Record<FiveElement, FiveElement> = { wood: 'fire', fire: 'earth', earth: 'metal', metal: 'water', water: 'wood' };
const CONTROLS: Record<FiveElement, FiveElement> = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };

type CalendarDefinition = Omit<SeimeiCalendarResult['calendar'], 'relation' | 'yinYangRelation'> & { buildAction: (object: string) => string };
const CALENDAR_DEFINITIONS: Record<CalendarMarkId, CalendarDefinition> = {
  advance: { id: 'advance', label: '押し進める日', theme: '継続しているものを前へ進める', tempo: 'fast', actionScale: 'normal', recommended: ['続けていることを前へ進める', '決めたことを実行する', '停滞している部分へ手を入れる'], caution: ['新しいものを増やしすぎない', '勢いだけで広げない'], buildAction: (object) => `${object}を、迷いすぎず前へ進める` },
  arrange: { id: 'arrange', label: '整える日', theme: '順序と形を整える', tempo: 'normal', actionScale: 'small', recommended: ['整理する', '順番を見直す', 'やり方を微調整する'], caution: ['全面刷新しない', '一度に多く変えない'], buildAction: (object) => `${object}を、一度整えてから先へ進める` },
  receive: { id: 'receive', label: '受け取る日', theme: '外から入ってくるものを受け取る', tempo: 'normal', actionScale: 'normal', recommended: ['人の意見を聞く', '情報を集める', '助けを受け取る'], caution: ['一人だけで結論を急がない', '入ってきた情報を反射的に拒まない'], buildAction: (object) => `${object}から得られるものを、素直に受け取る` },
  store: { id: 'store', label: '蓄える日', theme: '入ってきたものを内側へ残す', tempo: 'slow', actionScale: 'small', recommended: ['読む', '覚える', '記録する', '準備する'], caution: ['すぐ成果へ変えようとしない', '急いで外へ出さない'], buildAction: (object) => `${object}について、すぐ使おうとせず材料を蓄える` },
  expand: { id: 'expand', label: '広げる日', theme: '自分の力を外へ広げる', tempo: 'fast', actionScale: 'large', recommended: ['発信する', '試す', '人へ見せる', '活動範囲を広げる'], caution: ['準備だけで終えない', '広げすぎて焦点を失わない'], buildAction: (object) => `${object}を、いつもより少し外へ広げる` },
  nurture: { id: 'nurture', label: '育てる日', theme: '途中にあるものを少しずつ育てる', tempo: 'slow', actionScale: 'small', recommended: ['小さく継続する', '習慣を手入れする', '未完成のものを育てる'], caution: ['完成を急がない', '即効性だけで判断しない'], buildAction: (object) => `${object}を、結果を急がず少しずつ育てる` },
  defend: { id: 'defend', label: '守る日', theme: '今あるものを崩さない', tempo: 'slow', actionScale: 'small', recommended: ['予定を絞る', '既存のものを守る', 'ミスや漏れを防ぐ'], caution: ['無理な勝負をしない', '背負うものを増やさない'], buildAction: (object) => `${object}を崩さず、今あるものを守る` },
  observe: { id: 'observe', label: '様子を見る日', theme: '動かす前に状況を観察する', tempo: 'slow', actionScale: 'small', recommended: ['確認する', '観察する', '一度保留する'], caution: ['焦って結論を出さない', '反射的に動かない'], buildAction: (object) => `${object}をすぐ動かさず、まず様子を見る` },
  decide: { id: 'decide', label: '決める日', theme: '優先順位を定める', tempo: 'normal', actionScale: 'normal', recommended: ['一つ選ぶ', '優先順位を決める', '不要なものを切る'], caution: ['全部を残そうとしない', '決断を先延ばししない'], buildAction: (object) => `${object}について、一つだけはっきり決める` },
  small_move: { id: 'small_move', label: '小さく動かす日', theme: '部分的な変更と試行', tempo: 'normal', actionScale: 'small', recommended: ['一部分だけ変える', '小さく試す', '結果を見てから次へ進む'], caution: ['一気に全部変えない', '同時に複数の変更をしない'], buildAction: (object) => `${object}を、一か所だけ小さく動かす` },
};

const DIRECTION_DEFINITIONS: Record<DirectionId, Omit<SeimeiCalendarResult['direction'], 'relation' | 'condition' | 'conditionLabel'>> = {
  north: { id: 'north', trigram: '坎', label: '北', theme: '深める', object: '考えや情報', objectLong: '考えや情報、まだ見えていない部分' },
  northeast: { id: 'northeast', trigram: '艮', label: '北東', theme: '切り替える', object: 'やり方や区切り', objectLong: '止まっているやり方や、次へ進むための区切り' },
  east: { id: 'east', trigram: '震', label: '東', theme: '始める', object: 'まだ始めていないこと', objectLong: '気になっていながら、まだ手を付けていないこと' },
  southeast: { id: 'southeast', trigram: '巽', label: '南東', theme: 'つなぐ', object: '人や情報とのつながり', objectLong: '人、情報、ものごとの間にあるつながり' },
  south: { id: 'south', trigram: '離', label: '南', theme: '表に出す', object: '考えや成果', objectLong: '自分の考え、成果、外へ伝えたいもの' },
  southwest: { id: 'southwest', trigram: '坤', label: '南西', theme: '支える', object: '足元や基礎', objectLong: '生活、習慣、基礎となっている部分' },
  west: { id: 'west', trigram: '兌', label: '西', theme: '回収する', object: 'すでに得たもの', objectLong: 'ここまでに得た成果、手応え、楽しみ' },
  northwest: { id: 'northwest', trigram: '乾', label: '北西', theme: '決める', object: '方針や優先順位', objectLong: '今後の方針、責任、優先順位' },
};

const BRANCH_TO_DIRECTION: Record<EarthlyBranch, DirectionId> = { 子: 'north', 丑: 'northeast', 寅: 'northeast', 卯: 'east', 辰: 'southeast', 巳: 'southeast', 午: 'south', 未: 'southwest', 申: 'southwest', 酉: 'west', 戌: 'northwest', 亥: 'northwest' };
const CONDITION_META: Record<DirectionCondition, { label: SeimeiCalendarResult['direction']['conditionLabel']; suffix: string }> = {
  overlap: { label: '重', suffix: 'その兆しは今日は強く出ています。強めすぎない程度に意識するとよいでしょう。' },
  combine: { label: '合', suffix: '無理に押さなくても、流れは比較的かみ合いやすいようです。' },
  harmony: { label: '和', suffix: '一人で完結させるより、別の人や要素を交えるとまとまりやすいでしょう。' },
  flow: { label: '巡', suffix: '' },
  clash: { label: '冲', suffix: 'ただ、勢いのまま押すとぶつかりやすい気配があります。まず小さく確かめてください。' },
  gap: { label: '隔', suffix: 'ただ、思っていることと実際の動きに小さなズレが入りやすいようです。一度確かめるとよいでしょう。' },
};

function mod(value: number, divisor: number) { return ((value % divisor) + divisor) % divisor; }
function parseGregorianDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new Error('日付はYYYY-MM-DD形式で入力してください。');
  const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth[month - 1]) throw new Error('存在しない日付です。');
  return { year, month, day };
}

const ZODIAC_SIGNS: ReadonlyArray<{ id: ZodiacSignId; label: string; theme: string; object: string; element: ZodiacElement; modality: ZodiacModality }> = [
  { id: 'aries', label: '牡羊座', theme: '起動', object: 'まだ動かしていないこと', element: 'fire', modality: 'cardinal' },
  { id: 'taurus', label: '牡牛座', theme: '定着', object: 'すでに持っているものや習慣', element: 'earth', modality: 'fixed' },
  { id: 'gemini', label: '双子座', theme: '交換', object: '言葉や情報', element: 'air', modality: 'mutable' },
  { id: 'cancer', label: '蟹座', theme: '居場所', object: '身近な人や安心できる環境', element: 'water', modality: 'cardinal' },
  { id: 'leo', label: '獅子座', theme: '表現', object: '自分の表現や創作', element: 'fire', modality: 'fixed' },
  { id: 'virgo', label: '乙女座', theme: '整備', object: '細かな手順や改善点', element: 'earth', modality: 'mutable' },
  { id: 'libra', label: '天秤座', theme: '関係', object: '人との関係や釣り合い', element: 'air', modality: 'cardinal' },
  { id: 'scorpio', label: '蠍座', theme: '深化', object: '奥にある理由や本音', element: 'water', modality: 'fixed' },
  { id: 'sagittarius', label: '射手座', theme: '探索', object: 'まだ知らないことや遠くの可能性', element: 'fire', modality: 'mutable' },
  { id: 'capricorn', label: '山羊座', theme: '構築', object: '目標や形にしたいもの', element: 'earth', modality: 'cardinal' },
  { id: 'aquarius', label: '水瓶座', theme: '更新', object: 'いつもの方法や仕組み', element: 'air', modality: 'fixed' },
  { id: 'pisces', label: '魚座', theme: '受容', object: 'まだ形になっていない感覚や発想', element: 'water', modality: 'mutable' },
];

const LUNAR_PHASES: ReadonlyArray<{ id: MoonPhaseId; label: string; theme: string; buildAction: (object: string) => string }> = [
  { id: 'new', label: '新月', theme: '種を置く', buildAction: (object) => `${object}に、小さな種を置く` },
  { id: 'waxing_crescent', label: '満ちゆく三日月', theme: '動かし始める', buildAction: (object) => `${object}を、小さく動かし始める` },
  { id: 'first_quarter', label: '上弦', theme: '選び取る', buildAction: (object) => `${object}の中から、進む方を選ぶ` },
  { id: 'waxing_gibbous', label: '満ちゆく月', theme: '育て仕上げる', buildAction: (object) => `${object}を、足りない部分を補いながら育てる` },
  { id: 'full', label: '満月', theme: '照らして確かめる', buildAction: (object) => `${object}を、一度照らして確かめる` },
  { id: 'waning_gibbous', label: '欠けゆく月', theme: '受け取り整理する', buildAction: (object) => `${object}から得たものを整理する` },
  { id: 'last_quarter', label: '下弦', theme: '削って選ぶ', buildAction: (object) => `${object}から、残すものを選ぶ` },
  { id: 'waning_crescent', label: '晦へ向かう月', theme: '閉じて備える', buildAction: (object) => `${object}を閉じ、次へ持っていくものを決める` },
];

const ASPECTS: ReadonlyArray<{ id: Exclude<LunarNatalSunAspectId, 'none'>; label: string; angle: number; orb: number; theme: string; suffix: string }> = [
  { id: 'conjunction', label: '合', angle: 0, orb: 8, theme: '共鳴', suffix: '今日は、自分の感覚や意志がいつもより表へ出やすいようです。' },
  { id: 'sextile', label: '六分', angle: 60, orb: 5, theme: '接点', suffix: '小さな接点やきっかけが、今の流れとつながりやすいようです。' },
  { id: 'square', label: '矩', angle: 90, orb: 6, theme: '調整', suffix: '少し引っ掛かりが出やすい星相です。違和感は、調整する場所を教えているのかもしれません。' },
  { id: 'trine', label: '三分', angle: 120, orb: 6, theme: '流れ', suffix: '今の流れと自分の持っている力が、比較的なめらかにつながっています。' },
  { id: 'opposition', label: '対', angle: 180, orb: 8, theme: '向き合う', suffix: '今日は、自分の側からだけでなく、反対側から眺めることで見えるものがありそうです。' },
];

const SOLAR_CYCLES: ReadonlyArray<{ id: SolarCycleId; label: string; theme: string; sentence: string }> = [
  { id: 'return', label: '帰還', theme: '一年の基準点へ戻る', sentence: '一年の大きな巡りでは、出生時の太陽へ戻る節目にいます。' },
  { id: 'growth', label: '伸長', theme: '新しい一年を外へ伸ばす', sentence: '一年の大きな巡りでは、新しい流れを外へ伸ばしている途中です。' },
  { id: 'trial', label: '試行', theme: '意図と現実をすり合わせる', sentence: '一年の大きな巡りでは、思い描いたものと現実をすり合わせる時期にいます。' },
  { id: 'development', label: '展開', theme: 'できてきた流れを広げる', sentence: '一年の大きな巡りでは、ここまで作ってきた流れを広げていく途中です。' },
  { id: 'reflection', label: '対照', theme: '外側から自分を見る', sentence: '一年の大きな巡りでは、外側から自分を見直す折り返しにいます。' },
  { id: 'maturation', label: '熟成', theme: '経験を自分の力へ変える', sentence: '一年の大きな巡りでは、ここまで得た経験を自分の力へ変えている途中です。' },
  { id: 'reorganization', label: '再編', theme: '残すものを選び直す', sentence: '一年の大きな巡りでは、残すものと変えるものを選び直す時期です。' },
  { id: 'closure', label: '収束', theme: '一巡を閉じる', sentence: '一年の大きな巡りでは、一巡を閉じて次へ余白を作る時期にいます。' },
];

function degreesToRadians(value: number) { return value * Math.PI / 180; }
function radiansToDegrees(value: number) { return value * 180 / Math.PI; }
function normalizeDegrees(value: number) { return ((value % 360) + 360) % 360; }
function roundDegrees(value: number) { return Math.round(value * 100) / 100; }

/** A civil date is always evaluated at 12:00 JST (03:00 UTC), never in the browser timezone. */
function fixedJstNoonJulianDate(value: string) {
  const { year, month, day } = parseGregorianDate(value);
  return gregorianToJdn(year, month, day) - .375;
}

/** Low-precision apparent solar ecliptic longitude; suitable for a date-reference daily reading. */
export function solarLongitudeForDate(value: string) {
  const julianDate = fixedJstNoonJulianDate(value);
  const t = (julianDate - 2451545.0) / 36525;
  const meanLongitude = normalizeDegrees(280.46646 + t * (36000.76983 + .0003032 * t));
  const meanAnomaly = normalizeDegrees(357.52911 + t * (35999.05029 - .0001537 * t));
  const m = degreesToRadians(meanAnomaly);
  const equationOfCenter = Math.sin(m) * (1.914602 - t * (.004817 + .000014 * t))
    + Math.sin(2 * m) * (.019993 - .000101 * t) + Math.sin(3 * m) * .000289;
  return normalizeDegrees(meanLongitude + equationOfCenter);
}

/** Low-precision lunar ecliptic longitude using a fixed astronomical epoch; deterministic by civil date. */
export function lunarLongitudeForDate(value: string) {
  const days = fixedJstNoonJulianDate(value) - 2451543.5;
  const ascendingNode = normalizeDegrees(125.1228 - .0529538083 * days);
  const inclination = 5.1454;
  const perihelion = normalizeDegrees(318.0634 + .1643573223 * days);
  const meanAnomaly = normalizeDegrees(115.3654 + 13.0649929509 * days);
  const eccentricity = .0549;
  const anomaly = degreesToRadians(meanAnomaly);
  const eccentricAnomaly = anomaly + eccentricity * Math.sin(anomaly) * (1 + eccentricity * Math.cos(anomaly));
  const x = 60.2666 * (Math.cos(eccentricAnomaly) - eccentricity);
  const y = 60.2666 * Math.sqrt(1 - eccentricity ** 2) * Math.sin(eccentricAnomaly);
  const trueAnomaly = radiansToDegrees(Math.atan2(y, x));
  const orbitalLongitude = degreesToRadians(normalizeDegrees(trueAnomaly + perihelion));
  const node = degreesToRadians(ascendingNode);
  const tilt = degreesToRadians(inclination);
  const eclipticX = Math.cos(node) * Math.cos(orbitalLongitude) - Math.sin(node) * Math.sin(orbitalLongitude) * Math.cos(tilt);
  const eclipticY = Math.sin(node) * Math.cos(orbitalLongitude) + Math.cos(node) * Math.sin(orbitalLongitude) * Math.cos(tilt);
  const unperturbedLongitude = normalizeDegrees(radiansToDegrees(Math.atan2(eclipticY, eclipticX)));
  // Main lunar perturbations keep sign boundaries and phase edges much steadier than a bare Kepler orbit.
  const meanSunLongitude = normalizeDegrees(280.460 + .9856474 * days);
  const meanSunAnomaly = normalizeDegrees(356.0470 + .9856002585 * days);
  const meanMoonLongitude = normalizeDegrees(ascendingNode + perihelion + meanAnomaly);
  const elongation = normalizeDegrees(meanMoonLongitude - meanSunLongitude);
  const latitudeArgument = normalizeDegrees(meanMoonLongitude - ascendingNode);
  const sin = (degrees: number) => Math.sin(degreesToRadians(degrees));
  const correction = -1.274 * sin(meanAnomaly - 2 * elongation) + .658 * sin(2 * elongation) - .186 * sin(meanSunAnomaly)
    - .059 * sin(2 * meanAnomaly - 2 * elongation) - .057 * sin(meanAnomaly - 2 * elongation + meanSunAnomaly)
    + .053 * sin(meanAnomaly + 2 * elongation) + .046 * sin(2 * elongation - meanSunAnomaly) + .041 * sin(meanAnomaly - meanSunAnomaly)
    - .035 * sin(elongation) - .031 * sin(meanAnomaly + meanSunAnomaly) - .015 * sin(2 * latitudeArgument - 2 * elongation) + .011 * sin(meanAnomaly - 4 * elongation);
  return normalizeDegrees(unperturbedLongitude + correction);
}

function zodiacForLongitude(longitude: number) { return ZODIAC_SIGNS[Math.floor(normalizeDegrees(longitude) / 30)] ?? ZODIAC_SIGNS[0]; }
function angularDistance(left: number, right: number) { return Math.abs(((left - right + 540) % 360) - 180); }
function nearestZodiacBoundaryDistance(longitude: number) {
  const withinSign = normalizeDegrees(longitude) % 30;
  return Math.min(withinSign, 30 - withinSign);
}

export function calculateAsteriaResult(input: AsteriaCalculationInput): AsteriaLunarSolarResult {
  // Validate both dates before any arithmetic so malformed saved values never create a silent, shifted result.
  parseGregorianDate(input.birthDate);
  parseGregorianDate(input.targetDate);
  const birthSunLongitude = solarLongitudeForDate(input.birthDate);
  const targetSunLongitude = solarLongitudeForDate(input.targetDate);
  const moonLongitude = lunarLongitudeForDate(input.targetDate);
  const phaseAngle = normalizeDegrees(moonLongitude - targetSunLongitude);
  const phase = LUNAR_PHASES[Math.floor(normalizeDegrees(phaseAngle + 22.5) / 45) % LUNAR_PHASES.length];
  const moonSignDefinition = zodiacForLongitude(moonLongitude);
  const exactDifference = angularDistance(moonLongitude, birthSunLongitude);
  const aspectDefinition = ASPECTS.find((aspect) => Math.abs(exactDifference - aspect.angle) <= aspect.orb);
  const personalAspect = aspectDefinition
    ? { id: aspectDefinition.id, label: aspectDefinition.label, angle: aspectDefinition.angle, exactDifference: roundDegrees(exactDifference), theme: aspectDefinition.theme }
    : { id: 'none' as const, label: '静', angle: null, exactDifference: roundDegrees(exactDifference), theme: '強い星相なし' };
  const annualProgress = normalizeDegrees(targetSunLongitude - birthSunLongitude);
  const solarCycle = SOLAR_CYCLES[Math.floor(normalizeDegrees(annualProgress + 22.5) / 45) % SOLAR_CYCLES.length];
  const action = phase.buildAction(moonSignDefinition.object);
  const phaseSentence = `月は${phase.label}、${moonSignDefinition.label}の星域を巡り、今は${action}頃です。`;
  const aspectSentence = aspectDefinition?.suffix ?? '';
  const fixedReading = [phaseSentence, aspectSentence, solarCycle.sentence].filter(Boolean).join('');
  const birthBoundaryDistance = roundDegrees(nearestZodiacBoundaryDistance(birthSunLongitude));
  return {
    type: 'astrology', calculationVersion: 'asteria-lunar-solar-v1', provisional: false,
    targetDate: input.targetDate, birthDate: input.birthDate,
    birthSun: { longitude: roundDegrees(birthSunLongitude), sign: zodiacForLongitude(birthSunLongitude).id, label: zodiacForLongitude(birthSunLongitude).label, calculationMode: 'date-reference', assumedTime: '12:00 JST', nearSignBoundary: birthBoundaryDistance <= 1, boundaryDistance: birthBoundaryDistance },
    moonPhase: { id: phase.id, label: phase.label, theme: phase.theme, angle: roundDegrees(phaseAngle), action },
    moonSign: { id: moonSignDefinition.id, label: moonSignDefinition.label, theme: moonSignDefinition.theme, object: moonSignDefinition.object, longitude: roundDegrees(moonLongitude), element: moonSignDefinition.element, modality: moonSignDefinition.modality },
    personalAspect,
    solarCycle: { id: solarCycle.id, label: solarCycle.label, theme: solarCycle.theme, progressDegrees: roundDegrees(annualProgress) },
    fixedMeaning: { phase: phase.theme, domain: moonSignDefinition.theme, personalCondition: personalAspect.theme, longTermBackground: solarCycle.theme },
    fixedReading,
    methodNote: '出生日と対象日の12:00 JSTを基準に太陽・月の黄経を求める日付基準の巡りです。出生図やハウスは計算していません。',
  };
}

export function gregorianToJdn(year: number, month: number, day: number) {
  const k = Math.floor((14 - month) / 12);
  return Math.floor((-k + year + 4800) * 1461 / 4) + Math.floor((k * 12 + month - 2) * 367 / 12) - Math.floor(Math.floor((-k + year + 4900) / 100) * 3 / 4) + day - 32075;
}

export function getDayKanshi(jdn: number) {
  const index = mod(jdn + 49, 60);
  const stem = STEMS[index % 10]; const branch = BRANCHES[index % 12]; const meta = STEM_META[stem];
  return { index, label: `${stem}${branch}`, stem, branch, element: meta.element, yinYang: meta.yinYang };
}

function getFiveElementRelation(self: FiveElement, day: FiveElement): FiveElementRelation {
  if (self === day) return 'same-element';
  if (GENERATES[day] === self) return 'day-generates-self';
  if (GENERATES[self] === day) return 'self-generates-day';
  if (CONTROLS[day] === self) return 'day-controls-self';
  return 'self-controls-day';
}

export function getCalendarMarkId(relation: FiveElementRelation, yinYangRelation: 'same' | 'different'): CalendarMarkId {
  const marks: Record<FiveElementRelation, Record<'same' | 'different', CalendarMarkId>> = {
    'same-element': { same: 'advance', different: 'arrange' }, 'day-generates-self': { same: 'receive', different: 'store' },
    'self-generates-day': { same: 'expand', different: 'nurture' }, 'day-controls-self': { same: 'defend', different: 'observe' },
    'self-controls-day': { same: 'decide', different: 'small_move' },
  };
  return marks[relation][yinYangRelation];
}

export function getDirectionForBranch(branch: EarthlyBranch) { return DIRECTION_DEFINITIONS[BRANCH_TO_DIRECTION[branch]]; }

export function classifyBranchRelation(birth: EarthlyBranch, target: EarthlyBranch): BranchRelation {
  if (birth === target) return 'same';
  const key = [birth, target].sort((left, right) => BRANCHES.indexOf(left) - BRANCHES.indexOf(right)).join('');
  if (new Set(['子丑', '寅亥', '卯戌', '辰酉', '巳申', '午未']).has(key)) return 'six-harmony';
  if ([['申', '子', '辰'], ['亥', '卯', '未'], ['寅', '午', '戌'], ['巳', '酉', '丑']].some((group) => group.includes(birth) && group.includes(target))) return 'three-harmony';
  if (new Set(['子午', '丑未', '寅申', '卯酉', '辰戌', '巳亥']).has(key)) return 'six-clash';
  if (new Set(['子未', '丑午', '寅巳', '卯辰', '申亥', '酉戌']).has(key)) return 'six-harm';
  return 'none';
}

function conditionForRelation(relation: BranchRelation): DirectionCondition {
  return ({ same: 'overlap', 'six-harmony': 'combine', 'three-harmony': 'harmony', 'six-clash': 'clash', 'six-harm': 'gap', none: 'flow' } satisfies Record<BranchRelation, DirectionCondition>)[relation];
}

export function calculateSeimeiResult(input: SeimeiCalculationInput): SeimeiCalendarResult {
  const birth = parseGregorianDate(input.birthDate); const target = parseGregorianDate(input.targetDate);
  const birthKanshi = getDayKanshi(gregorianToJdn(birth.year, birth.month, birth.day));
  const targetKanshi = getDayKanshi(gregorianToJdn(target.year, target.month, target.day));
  const relation = getFiveElementRelation(birthKanshi.element, targetKanshi.element);
  const yinYangRelation = birthKanshi.yinYang === targetKanshi.yinYang ? 'same' : 'different';
  const calendarDefinition = CALENDAR_DEFINITIONS[getCalendarMarkId(relation, yinYangRelation)];
  const branchRelation = classifyBranchRelation(birthKanshi.branch, targetKanshi.branch);
  const condition = conditionForRelation(branchRelation); const directionDefinition = getDirectionForBranch(targetKanshi.branch);
  const fixedReading = [`${directionDefinition.trigram}に気が寄っています。`, `今日は、${calendarDefinition.buildAction(directionDefinition.object)}日でしょう。`, CONDITION_META[condition].suffix].filter(Boolean).join('');
  return {
    type: 'calendar-direction', calculationVersion: 'seimei-calendar-v1', provisional: false, targetDate: input.targetDate, birthDate: input.birthDate,
    birthKanshi, targetKanshi,
    calendar: { relation, yinYangRelation, id: calendarDefinition.id, label: calendarDefinition.label, theme: calendarDefinition.theme, tempo: calendarDefinition.tempo, actionScale: calendarDefinition.actionScale, recommended: [...calendarDefinition.recommended], caution: [...calendarDefinition.caution] },
    direction: { ...directionDefinition, relation: branchRelation, condition, conditionLabel: CONDITION_META[condition].label },
    fixedReading, methodNote: '干支・陰陽五行・十二支方位を骨格にしたポテノ六占独自の暦方位',
  };
}

const NUMBER_DEFINITIONS: Record<BasicNumber, { geometry: Exclude<GeometryId, 'double-line' | 'double-square' | 'double-hexagon'>; geometryLabel: string; layer: StructureLayer; core: { keyword: string; meaning: string; caution: string }; style: { keyword: string; meaning: string; caution: string } }> = {
  1: { geometry: 'point', geometryLabel: '点', layer: 'generation', core: { keyword: '起点', meaning: '一つの起点を作り、そこから物事を組み立てる', caution: '一人で完結しすぎる' }, style: { keyword: '始動', meaning: '自分から最初の一手を置く', caution: '急いで周囲を置いていかない' } },
  2: { geometry: 'line', geometryLabel: '線', layer: 'generation', core: { keyword: '接続', meaning: '二つのものの間にある関係から考える', caution: '相手側へ合わせすぎる' }, style: { keyword: '調整', meaning: '結ぶ、合わせる、受け取ることで動かす', caution: '自分の感覚を後ろへ置きすぎない' } },
  3: { geometry: 'triangle', geometryLabel: '三角', layer: 'generation', core: { keyword: '展開', meaning: '第三の要素を加えて可能性やテーマを展開する', caution: '枝を増やしすぎる' }, style: { keyword: '発想', meaning: '話す、作る、組み合わせることで広げる', caution: '広げた後の置き場を忘れない' } },
  4: { geometry: 'square', geometryLabel: '四角', layer: 'formation', core: { keyword: '具体化', meaning: '曖昧なものへ枠組みを与える', caution: '構造を守ること自体が目的になる' }, style: { keyword: '整備', meaning: '分解し、順序を決め、形にして外へ出す', caution: '整え切る前に止めない' } },
  5: { geometry: 'pentagon', geometryLabel: '五角', layer: 'formation', core: { keyword: '拡張', meaning: '固定された構造から別の可能性を探す', caution: '可能性を増やしすぎて収束しない' }, style: { keyword: '試行', meaning: '試す、入れ替える、移動することで探る', caution: '試す軸を一度に増やしすぎない' } },
  6: { geometry: 'hexagon', geometryLabel: '六角', layer: 'formation', core: { keyword: '継続', meaning: '経験や関係をつないで一つのまとまりを作る', caution: '古いものまで抱え続ける' }, style: { keyword: '維持', meaning: '手入れし、維持し、育てる', caution: '抱える範囲を広げすぎない' } },
  7: { geometry: 'heptagram', geometryLabel: '七芒', layer: 'integration', core: { keyword: '探究', meaning: '表面より原理や理由を知ろうとする', caution: '理解すること自体が目的になる' }, style: { keyword: '分析', meaning: '距離を取り、考え、法則を探してから動く', caution: '考える時間だけで閉じない' } },
  8: { geometry: 'octagon', geometryLabel: '八角', layer: 'integration', core: { keyword: '構築', meaning: '複数要素を配置し、実現できる構造を考える', caution: '完成形を先に考えすぎ、途中工程を飛ばす' }, style: { keyword: '実現', meaning: '時間・道具・人・手順などを配置し、結果へ通す', caution: '工程の手触りを置き去りにしない' } },
  9: { geometry: 'circle', geometryLabel: '円環', layer: 'integration', core: { keyword: '全体', meaning: '個別要素より先に全体像や意味を捉える', caution: '全体像だけで具体化が遅れる' }, style: { keyword: '統合', meaning: '全体から必要な部分へ降り、意味をまとめて外へ出す', caution: '細部の手順も残しておく' } },
};

const MASTER_DEFINITIONS: Record<11 | 22 | 33, { baseNumber: 2 | 4 | 6; label: string; theme: string; meaning: string; caution: string; geometry: Extract<GeometryId, 'double-line' | 'double-square' | 'double-hexagon'>; geometryLabel: string }> = {
  11: { baseNumber: 2, label: '11 / 2', theme: '複数視点', meaning: '二つ以上の視点を同時に持ち、その間にある関係から構造を捉えやすい。', caution: '両方を拾いすぎて判断が揺れやすい。', geometry: 'double-line', geometryLabel: '二重線' },
  22: { baseNumber: 4, label: '22 / 4', theme: '複層構築', meaning: '複数の枠組みを組み合わせ、より大きな仕組みとして構築しやすい。', caution: '設計を巨大化させ、構造を増やしすぎやすい。', geometry: 'double-square', geometryLabel: '二重四角' },
  33: { baseNumber: 6, label: '33 / 6', theme: '複層維持', meaning: '複数の関係や経験を結び、全体を長く維持する構造を作りやすい。', caution: '抱えるものを増やしすぎ、手放しにくくなりやすい。', geometry: 'double-hexagon', geometryLabel: '二重六角' },
};

const RELATION_DEFINITIONS: Record<DaVinciRelationId, { label: string; theme: string; meaning: string; reading: string; character: string }> = {
  overlap: { label: '重なり', theme: '性質の集中', meaning: '中心構造と外への出し方が、同じ方向へ向いている。', reading: '中心と外への出し方が同じ方向へ重なるため、性質をまっすぐ使いやすい構造です。', character: '中心と外側がぴたりと重なる。これは見取り図として、とても素直で面白いね。' },
  mirror: { label: '鏡', theme: '対称変換', meaning: '数列の反対側にある性質を、内側と外側で使い分ける。', reading: '内側と外側で対になる性質を使うので、考えたものを別の角度から見せやすい構造です。', character: '内と外が鏡みたいに向かい合っている。反対側を使うから、変換の仕方が面白い。' },
  same_layer: { label: '同系列', theme: '近い変換', meaning: '中心と外への出し方が同じ構造層にあり、大きく別の工程へ翻訳せずに外へ出しやすい。', reading: '中心で捉えたものを、大きく別の工程へ翻訳せず、近い思考段階のまま外へ出しやすい構造です。', character: '同じ作業台の上で形を変える感じだ。考え方を大きく別の段階へ変えなくても、そのまま外へ出しやすそうだね。' },
  development: { label: '展開', theme: '一段展開', meaning: '中心の構造を一段先の工程へ進めて外へ出す。', reading: '中心から表現へ一段展開するため、考えたものを次の工程へつなげやすい構造です。', character: 'ひとつ先の工程へ、きれいに展開している。部品が増える場所を見つけるのが上手そうだ。' },
  leap: { label: '飛躍', theme: '段階跳躍', meaning: '発生層から統合層へ直接移り、中間工程を頭の中で飛ばしやすい。', reading: '発生から統合へ一気に進みやすい組み合わせです。途中の工程を一度並べると、持っている構造を使いやすくなります。', character: '最初の点から、もう全体の設計図へ行こうとしている。途中の部品を並べると、ぐっと綺麗に動くね。' },
  reduction: { label: '還元', theme: '扱いやすい翻訳', meaning: '中心の構造を一段単純な工程へ戻して外へ出す。', reading: '内側の複雑な構造を、外では扱いやすい形へ翻訳して見せる構造です。', character: '内側で作ったものを、外では手触りのある部品にほどいている。これは立派な変換だよ。' },
  compression: { label: '圧縮', theme: '一点への収束', meaning: '統合層から発生層へ直接戻し、複雑なものを一点へ圧縮して外へ出す。', reading: '内側の大きな構造を、外では一つの決定や起点へ圧縮して見せる構造です。内部工程が周囲から見えにくいこともあります。', character: '大きな設計を、最後は一点へ圧縮している。見えない内部の図面は、なかなか壮観だね。' },
};

function sumDigits(value: number) { return String(Math.abs(value)).split('').reduce((sum, digit) => sum + Number(digit), 0); }
function reductionPath(value: number, keepMasters: boolean) {
  const path = [value]; let current = value;
  while (current > 9 && !(keepMasters && (current === 11 || current === 22 || current === 33))) {
    current = sumDigits(current); path.push(current);
  }
  return path;
}

export function reduceCore(value: number): CoreNumber { return reductionPath(value, true).at(-1) as CoreNumber; }
export function reduceStyle(value: number): StyleNumber { return reductionPath(value, false).at(-1) as StyleNumber; }
export function getStructureLayer(number: BasicNumber): StructureLayer { return NUMBER_DEFINITIONS[number].layer; }

export function getDaVinciRelation(effectiveCore: BasicNumber, style: StyleNumber): DaVinciRelationId {
  if (effectiveCore === style) return 'overlap';
  if (effectiveCore + style === 10) return 'mirror';
  const layerRank: Record<StructureLayer, number> = { generation: 0, formation: 1, integration: 2 };
  const difference = layerRank[getStructureLayer(style)] - layerRank[getStructureLayer(effectiveCore)];
  if (difference === 0) return 'same_layer';
  if (difference === 1) return 'development';
  if (difference === 2) return 'leap';
  if (difference === -1) return 'reduction';
  return 'compression';
}

export function calculateDaVinciResult(birthDate: string): DaVinciStructureResult {
  // Date is intentionally parsed as plain text: neither time zone nor current date belongs to this system.
  const { year, month, day } = parseGregorianDate(birthDate);
  const digits = `${String(year).padStart(4, '0')}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
  const coreRawSum = digits.split('').reduce((sum, digit) => sum + Number(digit), 0);
  const corePath = reductionPath(coreRawSum, true); const coreNumber = corePath.at(-1) as CoreNumber;
  const masterNumber = coreNumber === 11 || coreNumber === 22 || coreNumber === 33 ? coreNumber : undefined;
  const master = masterNumber ? MASTER_DEFINITIONS[masterNumber] : undefined;
  const effectiveCore = master?.baseNumber ?? coreNumber as BasicNumber;
  const styleRawValue = month + day; const stylePath = reductionPath(styleRawValue, false); const styleNumber = stylePath.at(-1) as StyleNumber;
  const coreDefinition = NUMBER_DEFINITIONS[effectiveCore]; const styleDefinition = NUMBER_DEFINITIONS[styleNumber];
  const relationId = getDaVinciRelation(effectiveCore, styleNumber); const relation = RELATION_DEFINITIONS[relationId];
  const coreNumberLabel = master ? master.label : String(coreNumber);
  const coreMeaning = master ? master.meaning : `${coreDefinition.core.meaning}構造があります`;
  const styleMeaning = `外へ動かす時には${styleNumber}の「${styleDefinition.style.keyword}」を使い、${styleDefinition.style.meaning}。`;
  const masterSentence = master ? `CORE側は${master.label}の複層構造であり、${master.caution}` : '';
  const fixedReading = [
    `中心には${coreNumberLabel}の「${master ? master.theme : coreDefinition.core.keyword}」があり、${coreMeaning}。`,
    styleMeaning,
    relation.reading,
    masterSentence,
  ].filter(Boolean).join('');
  const characterReading = [
    `ふむふむ。中心は${coreNumberLabel}の${master ? master.geometryLabel : coreDefinition.geometryLabel}、外側は${styleNumber}の${styleDefinition.geometryLabel}なんだね。`,
    relation.character,
    master ? `しかも${master.theme}の複層構造だ。レアという話じゃなくて、図面が一層多いということさ。` : '',
  ].filter(Boolean).join('');
  return {
    type: 'numerology', calculationVersion: 'davinci-structure-v1', provisional: false, birthDate,
    core: { rawSum: coreRawSum, reductionPath: corePath, number: coreNumber, effectiveNumber: effectiveCore, isMaster: Boolean(master), ...(masterNumber ? { masterNumber } : {}), baseNumber: effectiveCore, keyword: master?.theme ?? coreDefinition.core.keyword, geometry: master?.geometry ?? coreDefinition.geometry, geometryLabel: master?.geometryLabel ?? coreDefinition.geometryLabel, layer: coreDefinition.layer },
    style: { rawValue: styleRawValue, reductionPath: stylePath, number: styleNumber, keyword: styleDefinition.style.keyword, geometry: styleDefinition.geometry, geometryLabel: styleDefinition.geometryLabel, layer: styleDefinition.layer },
    relation: { id: relationId, label: relation.label, theme: relation.theme, meaning: relation.meaning },
    ...(master && masterNumber ? { masterModifier: { number: masterNumber, label: master.label, theme: master.theme, meaning: master.meaning } } : {}),
    geometry: { coreShape: master?.geometry ?? coreDefinition.geometry, styleShape: styleDefinition.geometry, relationAnimation: relationId },
    fixedMeaning: { core: coreMeaning, style: styleMeaning, relation: relation.meaning, ...(master ? { master: master.meaning } : {}) },
    fixedReading, characterReading,
    methodNote: '複数の数を重ねて読む数秘術の考え方を参考に、CORE・STYLE・両者の関係を「数の設計図」として再構成したポテノ六占独自方式。',
  };
}

/** The remaining automatic calculators are deterministic; only interactive divinations draw lots in their own ritual. */
export const automaticDivinationCalculators = {
  seimei(input: SeimeiCalculationInput): SeimeiCalendarResult { return calculateSeimeiResult(input); },
  asteria(input: AsteriaCalculationInput): AsteriaLunarSolarResult { return calculateAsteriaResult(input); },
  davinci(input: Pick<AutomaticCalculationInput, 'birthDate'>): DaVinciStructureResult { return calculateDaVinciResult(input.birthDate); },
};

export function calculateAutomaticDivinations(input: AutomaticCalculationInput) {
  return {
    seimei: automaticDivinationCalculators.seimei({ birthDate: input.birthDate, targetDate: input.targetDate }),
    asteria: automaticDivinationCalculators.asteria({ birthDate: input.birthDate, targetDate: input.targetDate }),
    davinci: automaticDivinationCalculators.davinci({ birthDate: input.birthDate }),
  };
}

function secureRandomInt(max: number) {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const value = new Uint32Array(1);
    crypto.getRandomValues(value);
    return value[0] % max;
  }
  return Math.floor(Math.random() * max);
}

export const TRIGRAM_DEFINITIONS: Record<TrigramId, { bits: readonly [number, number, number]; name: string; element: string; theme: string; movement: string }> = {
  qian: { bits: [1, 1, 1], name: '乾', element: '天', theme: '健', movement: '押し進める' }, dui: { bits: [1, 1, 0], name: '兌', element: '沢', theme: '悦', movement: '交わす' }, li: { bits: [1, 0, 1], name: '離', element: '火', theme: '麗', movement: '照らして結ぶ' }, zhen: { bits: [1, 0, 0], name: '震', element: '雷', theme: '動', movement: '動き出す' }, xun: { bits: [0, 1, 1], name: '巽', element: '風', theme: '入', movement: '入り込む' }, kan: { bits: [0, 1, 0], name: '坎', element: '水', theme: '陥', movement: '難所を通る' }, gen: { bits: [0, 0, 1], name: '艮', element: '山', theme: '止', movement: '止める' }, kun: { bits: [0, 0, 0], name: '坤', element: '地', theme: '順', movement: '受け止める' },
};
const TRIGRAM_BY_BITS = Object.fromEntries(Object.entries(TRIGRAM_DEFINITIONS).map(([id, definition]) => [definition.bits.join(''), id])) as Record<string, TrigramId>;
const HEXAGRAM_ROWS = `1|乾|乾為天|qian|qian|創始
2|坤|坤為地|kun|kun|受容
3|屯|水雷屯|kan|zhen|初難
4|蒙|山水蒙|gen|kan|未熟
5|需|水天需|kan|qian|待機
6|訟|天水訟|qian|kan|対立
7|師|地水師|kun|kan|統率
8|比|水地比|kan|kun|結合
9|小畜|風天小畜|xun|qian|小蓄
10|履|天沢履|qian|dui|慎行
11|泰|地天泰|kun|qian|通達
12|否|天地否|qian|kun|閉塞
13|同人|天火同人|qian|li|同行
14|大有|火天大有|li|qian|保有
15|謙|地山謙|kun|gen|調整
16|豫|雷地豫|zhen|kun|奮起
17|随|沢雷随|dui|zhen|随行
18|蠱|山風蠱|gen|xun|修復
19|臨|地沢臨|kun|dui|接近
20|観|風地観|xun|kun|観察
21|噬嗑|火雷噬嗑|li|zhen|突破
22|賁|山火賁|gen|li|装い
23|剥|山地剥|gen|kun|剥落
24|復|地雷復|kun|zhen|回帰
25|无妄|天雷无妄|qian|zhen|自然
26|大畜|山天大畜|gen|qian|大蓄
27|頤|山雷頤|gen|zhen|養い
28|大過|沢風大過|dui|xun|過重
29|坎|坎為水|kan|kan|重難
30|離|離為火|li|li|明晰
31|咸|沢山咸|dui|gen|感応
32|恒|雷風恒|zhen|xun|持続
33|遯|天山遯|qian|gen|退避
34|大壮|雷天大壮|zhen|qian|壮勢
35|晋|火地晋|li|kun|進展
36|明夷|地火明夷|kun|li|蔵光
37|家人|風火家人|xun|li|内秩序
38|睽|火沢睽|li|dui|相違
39|蹇|水山蹇|kan|gen|阻難
40|解|雷水解|zhen|kan|解放
41|損|山沢損|gen|dui|減少
42|益|風雷益|xun|zhen|増益
43|夬|沢天夬|dui|qian|決断
44|姤|天風姤|qian|xun|遭遇
45|萃|沢地萃|dui|kun|集合
46|升|地風升|kun|xun|上昇
47|困|沢水困|dui|kan|困窮
48|井|水風井|kan|xun|井泉
49|革|沢火革|dui|li|変革
50|鼎|火風鼎|li|xun|錬成
51|震|震為雷|zhen|zhen|震動
52|艮|艮為山|gen|gen|静止
53|漸|風山漸|xun|gen|漸進
54|帰妹|雷沢帰妹|zhen|dui|不均衡
55|豊|雷火豊|zhen|li|充満
56|旅|火山旅|li|gen|旅居
57|巽|巽為風|xun|xun|浸透
58|兌|兌為沢|dui|dui|交流
59|渙|風水渙|xun|kan|離散
60|節|水沢節|kan|dui|節度
61|中孚|風沢中孚|xun|dui|内信
62|小過|雷山小過|zhen|gen|小過
63|既済|水火既済|kan|li|既成
64|未済|火水未済|li|kan|未完`;
const HEXAGRAM_DETAILS = `内外ともに推進力が強い|自ら動かし続ける|力だけで押し切らない
内外ともに受け止める場|支え、条件を整える|待つだけにならない
動き始めたものが難所に入る|小さく形を作る|最初から完成を求めない
分からないものの前で止まっている|学ぶ・問い直す|分かったふりをしない
進む力はあるが前方に難所がある|準備して時を待つ|焦って時機を作らない
内外の方向が食い違う|争点を整理する|勝つまで争わない
難しい状況を組織して扱う|力をまとめる|統制そのものを目的にしない
個々のものが集まり支え合う|信頼できる側と結ぶ|所属することだけを目的にしない
強い力を小さな制約が整える|少しずつ蓄える|一気に突破しない
外へ進めるが足場には注意が必要|手順を踏んで進む|慣れから雑にならない
内外の力が交流しやすい|流れを循環させる|順調さが続く前提にしない
内外の力が噛み合わない|無理に通さず構造を見る|押せば開くと思わない
共通の目的が人を結びつける|共通点を軸に協力する|身内だけで閉じない
力や資源が表へ集まっている|持っているものを活かす|所有そのものに執着しない
強さを前面に出さず均衡を取る|一段引いて整える|自分を下げすぎない
準備された場へ動きが入る|気運を実際の動きへ移す|勢いだけで先走らない
生じた動きへ柔軟についていく|流れを見て合わせる|盲目的についていかない
内部へ入り込んだ乱れが積み重なる|原因まで戻って直す|表面だけ取り繕わない
外との距離が縮まりつつある|自分から近づく|深入りしすぎない
周囲の状態が徐々に見えてくる|一度眺めて位置を知る|見るだけで終わらない
間にある障害が流れを止めている|問題点を明確に切り分ける|必要以上に強く処理しない
中身を外へ伝わる形へ整える|表現や見せ方を整える|見た目を中身より優先しない
支えを失った部分が少しずつ外れる|不要な層を落とす|急いで作り直さない
内側で再び小さな動きが生まれる|原点へ戻り再開する|一気に取り戻そうとしない
作為より自然な動きが前へ出る|余計な操作を減らす|思惑で流れをねじ曲げない
強い力を止め、内部へ蓄積する|力・知識・資源を貯める|蓄えるだけで使わなくならない
何を取り入れ何を出すかが重要になる|入力と出力を選ぶ|入れすぎ・言いすぎに注意する
構造に通常以上の負荷がかかる|支え方を変える|平常どおりに耐え続けない
内外とも難所が続く|一つずつ通れる道を探す|焦って脱出しようとしない
内外とも対象が見えやすくなる|何に結びついているか確認する|見えるものだけを真実と思わない
内側の静けさへ外から影響が届く|互いの反応を見る|相手を操作しようとしない
小さな浸透と動きが繰り返される|続けられる形を保つ|変えるべき時まで固定しない
前へ出る力を意図的に止める|距離を取って力を残す|退くことを敗北と考えない
内外とも動く力が非常に強い|力の使いどころを選ぶ|強さを証明するために使わない
支えられたものが明るい場所へ出る|一段ずつ前へ出す|評価だけを追わない
内側の明晰さを外へ出しにくい|大事なものを守る|不要な自己主張をしない
内部の役割と関係が全体を支える|身近な仕組みを整える|役割を固定しすぎない
同じ場にいても向きが違う|違いを利用する|無理に一致させない
前方が止まり、その先に難所がある|別ルートや助力を探す|正面突破に固執しない
難所に動きが入り、固まりがほどける|残った緊張を解く|解放後に新しい問題を増やさない
外へ出すものを意図的に減らす|余計なものを削る|必要なものまで削らない
動きが広がり周囲へ浸透する|効果のある部分へ加える|何でも増やさない
強い力が出口まで達している|はっきり区切る|決断を攻撃にしない
小さな影響が強い場へ突然入り込む|出会った影響を見極める|強い影響に飲まれない
人や資源が一か所へ集まる|中心を決めてまとめる|集めることだけを目的にしない
内部への小さな働きかけが積み上がる|足元から一段ずつ上がる|基礎を飛ばさない
外へ出す力が難所に制限される|核を守って耐える|無理に成果を出そうとしない
変わらない資源をどう使うかが問われる|基盤を整備し共有する|資源そのものを放置しない
内側で明確になったものが旧構造を変える|時機を見て切り替える|変化そのものを目的にしない
入った材料が別の価値へ組み替わる|仕組みの中で変換する|器だけ立派にしない
内外で刺激と変化が重なる|驚きの後に立て直す|反射だけで動き続けない
内外とも境界が立ち止まらせる|止まる位置を決める|固まったままにならない
止まった基礎へ少しずつ変化が入る|順序を守って進む|早い結果を求めない
外から動きが入り、立場がまだ安定しない|自分の位置を確認する|実力以上の立場を取りにいかない
明るさと活動が同時に高まる|今ある豊かさを活かす|ピークが続くと思わない
足元が仮の状態で、外へ意識が向く|軽く動き、状況へ適応する|仮の場所で根を張りすぎない
小さな影響が内外へ繰り返し入る|柔らかく働きかけ続ける|決断まで薄くしない
内外で言葉や交換が活発になる|話し、共有し、反応を見る|喜ばせるだけにならない
固まった難所へ風が入りほぐれていく|詰まりを散らす|必要なまとまりまで壊さない
交流や広がりへ限界線が必要になる|適切な枠を置く|制限しすぎない
外との交流へ内側の誠実さが浸透する|内外を一致させる|信じることと無警戒を混同しない
大きく動くより小さな調整が重要になる|細部を少し越えて補う|大仕事へ広げない
一応の形は完成しているが緊張を含む|完成状態を維持する|終わったと思って緩まない
要素は揃いつつあるがまだ噛み合わない|最後の接続を慎重に行う|終盤で急がない`.split('\n').map((row) => { const [structure, movement, caution] = row.split('|'); return { structure, movement, caution }; });
const HEXAGRAM_IDS = ['qian', 'kun', 'zhun', 'meng', 'xu', 'song', 'shi', 'bi', 'xiaochu', 'lu', 'tai', 'pi', 'tongren', 'dayou', 'qian-modesty', 'yu', 'sui', 'gu', 'lin', 'guan', 'shike', 'bi-adornment', 'bo', 'fu', 'wuwang', 'dachu', 'yi', 'daguo', 'kan', 'li', 'xian', 'heng', 'dun', 'dazhuang', 'jin', 'mingyi', 'jiaren', 'kui', 'jian', 'xie', 'sun', 'yi-gain', 'guai', 'gou', 'cui', 'sheng', 'kun-strain', 'jing', 'ge', 'ding', 'zhen', 'gen', 'jian-gradual', 'guimei', 'feng', 'lv', 'xun', 'dui', 'huan', 'jie', 'zhongfu', 'xiaoguo', 'jiji', 'weiji'];
export const HEXAGRAM_DEFINITIONS: readonly HexagramDefinition[] = HEXAGRAM_ROWS.split('\n').map((row, index) => { const [number, name, fullName, upperTrigram, lowerTrigram, theme] = row.split('|'); return { number: Number(number), id: HEXAGRAM_IDS[index], name, fullName, upperTrigram: upperTrigram as TrigramId, lowerTrigram: lowerTrigram as TrigramId, theme, ...HEXAGRAM_DETAILS[index] }; });
const HEXAGRAM_BY_TRIGRAMS = new Map(HEXAGRAM_DEFINITIONS.map((definition) => [`${definition.upperTrigram}/${definition.lowerTrigram}`, definition]));
const LINE_POSITIONS = [{ id: 'beginning', label: '発端', meaning: '始まり・足元・まだ表へ出ていない起点' }, { id: 'inner', label: '内側', meaning: '内部で形になり始めている部分' }, { id: 'boundary', label: '境目', meaning: '内側から外側へ出る直前の摩擦や迷い' }, { id: 'contact', label: '接点', meaning: '他者・環境・外部との接触点' }, { id: 'center', label: '中心', meaning: '判断・優先順位・局面の中心' }, { id: 'extreme', label: '極まり', meaning: '行き切った部分・区切り・次への転換点' }] as const;
const CHANGE_STATES = [{ id: 'still', label: '静止', meaning: '盤面の大きな切り替わりはまだ表れていない' }, { id: 'single', label: '一点変化', meaning: '一つの場所に変化が集中している' }, { id: 'linked', label: '連動', meaning: '二つの場所が連動して変化している' }, { id: 'transition', label: '転換中', meaning: '局所ではなく盤面そのものが切り替わる途中' }, { id: 'change_dominant', label: '変化優勢', meaning: '現在より変化後の構造が前に出始めている' }, { id: 'major_shift', label: '大転換', meaning: 'ほぼ全体が切り替わり、一部だけが残っている' }, { id: 'total_shift', label: '総転', meaning: '盤面全体が反転する大きな切り替わり' }] as const;
export function calculateTaikoboResult(lines: readonly number[]): TaikoboResult {
  if (lines.length !== 6 || lines.some((line) => ![6, 7, 8, 9].includes(line))) throw new Error('六爻は6〜9を下から上へ6本指定してください。');
  const normalized = lines as TaikoboResult['lines']; const bits = (values: readonly number[]) => values.map((line) => line === 7 || line === 9 ? 1 : 0).join(''); const changed = normalized.map((line) => line === 6 ? 7 : line === 9 ? 8 : line) as TaikoboResult['lines'];
  const hexagram = (values: readonly number[]) => HEXAGRAM_BY_TRIGRAMS.get(`${TRIGRAM_BY_BITS[bits(values.slice(3, 6))]}/${TRIGRAM_BY_BITS[bits(values.slice(0, 3))]}`)!;
  const baseHexagram = hexagram(normalized); const resultingHexagram = hexagram(changed);
  const movingLines: MovingLineResult[] = normalized.flatMap((value, index) => {
    if (value !== 6 && value !== 9) return [];
    const position = LINE_POSITIONS[index];
    return [{ position: (index + 1) as 1 | 2 | 3 | 4 | 5 | 6, value, positionId: position.id, positionLabel: position.label, positionMeaning: position.meaning, direction: value === 6 ? 'yin-to-yang' as const : 'yang-to-yin' as const, directionLabel: value === 6 ? '陰 → 陽' : '陽 → 陰', directionMeaning: value === 6 ? '受け止めていたものが、動く側へ切り替わろうとしている' : '押していたものが、収める・受ける側へ切り替わろうとしている' }];
  });
  const changeState = { count: movingLines.length, ...CHANGE_STATES[movingLines.length] }; const stableIndex = movingLines.length === 5 ? normalized.findIndex((value) => value === 7 || value === 8) : -1; const stableAnchor = stableIndex >= 0 ? { position: (stableIndex + 1) as 1 | 2 | 3 | 4 | 5 | 6, label: LINE_POSITIONS[stableIndex].label, meaning: LINE_POSITIONS[stableIndex].meaning } : undefined;
  const changeSentence = movingLines.length === 0 ? '大きな変化点はまだ表れていないため、まず現在の構造を見る段階です。' : movingLines.length >= 3 ? `${changeState.label}で、盤面そのものが切り替わる途中です。` : `動いているのは${movingLines.map((line) => `${line.position}爻「${line.positionLabel}」`).join('と')}で、${movingLines.map((line) => line.directionMeaning).join('、')}。`;
  const fixedReading = [`いまの盤面は「${baseHexagram.fullName}」。${baseHexagram.structure}。`, changeSentence, movingLines.length ? `この変化が続くなら、「${resultingHexagram.fullName}」の${resultingHexagram.structure}へ移ろうとしています。` : '之卦は本卦と同じで、いまは盤面を見定める段階です。'].join('');
  return { type: 'iching', calculationVersion: 'taikobo-iching-v1', provisional: false, lines: normalized, baseHexagram, movingLines, changeState, ...(stableAnchor ? { stableAnchor } : {}), resultingHexagram, fixedMeaning: { currentStructure: baseHexagram.structure, changeAmount: changeState.meaning, changePoints: movingLines.map((line) => line.positionLabel).join('・') || 'なし', resultingStructure: resultingHexagram.structure }, fixedReading, characterReading: `${baseHexagram.name}から${resultingHexagram.name}へ移るであるか。${changeState.meaning}。ふっふふ、急いで答えを決めず、動いておる場所を見ておくとよかろう。`, methodNote: '六爻から本卦・動爻・之卦を求め、六十四卦の状況構造と、共通の爻位置・陰陽変化を用いて「現在の盤面からどの構造へ移ろうとしているか」を読むポテノ六占独自の簡易易占。各卦固有の384爻辞は使用しない。' };
}
export function generateIChingResult(): TaikoboResult { return calculateTaikoboResult(Array.from({ length: 6 }, () => 6 + secureRandomInt(4))); }

export const TAMAMO_SILHOUETTES = [
  { id: 'traveler', label: '旅人', phrase: '急ぐ足ほど、置いてきた声を思い出す。' },
  { id: 'umbrella', label: '傘の人', phrase: '隠したつもりの想いほど、雨音の間から聞こえる。' },
  { id: 'merchant', label: '商い人', phrase: '欲しいものより、手放せないものを見なさい。' },
  { id: 'child', label: '小さな影', phrase: '最初にうれしいと思った方角へ、もう一度。' },
  { id: 'courtier', label: '装束の人', phrase: '遠回しな言葉の中にも、本音はひとつだけ。' },
] as const;

export function revealTamamoResult(passer: TamamoPasser | string, rng?: () => number): TamamoResultV1 {
  if (typeof passer !== 'string') return revealTamamoCrossroadsResult(passer, rng);
  const silhouette = TAMAMO_SILHOUETTES.find((item) => item.id === passer);
  if (!silhouette) throw new Error('選んだ人影を見つけられませんでした。');
  return revealTamamoCrossroadsResult({ key: `legacy-${silhouette.id}`, form: silhouette.id === 'child' ? 'child' : silhouette.id === 'courtier' ? 'courtier' : silhouette.id === 'traveler' ? 'traveler' : silhouette.id === 'umbrella' ? 'lady' : 'monk', label: silhouette.label }, rng);
}

const MAJOR_ARCANA_ROWS: ReadonlyArray<readonly [string, string, string, string]> = [
  ['愚者','可能性と身軽さ','まだ決めきらない自由が前に出ている','方向を定めにくいまま気持ちが散っている'],['魔術師','意志と手応え','自分から働きかけたい感覚が現れている','力を見せることへ気持ちが偏っている'],['女教皇','静かな理解','答えを急がず内側で見ている','考えすぎて気持ちを奥へしまっている'],['女帝','満たすこと','育てたい・受け取りたい感覚が現れている','満たされなさを埋めようとする気持ちがある'],['皇帝','枠組みと責任','形にして守りたい意識が現れている','固く管理しないと落ち着かない感覚がある'],['教皇','価値観と学び','信じられる基準を確かめたい気持ちがある','正しさに寄りかかりすぎている'],['恋人','選択と結びつき','心が向くものを選びたい感覚が現れている','選ぶことへのためらいが残っている'],['戦車','前進と制御','進めたい力を自分で握れている','急ぐ力が強く、気持ちを置き去りにしやすい'],['力','受け止める強さ','強く押すより穏やかに扱おうとしている','我慢だけで保とうとしている'],['隠者','距離と探求','一人で確かめたい問いがある','閉じこもり、答えを遠ざけている'],['運命の輪','巡りと変化','流れが変わる感覚を受け取っている','変化に振り回され、足場を見失いやすい'],['正義','釣り合いと判断','自分なりの基準で整理しようとしている','正しくあろうとして気持ちを切り捨てている'],['吊るされた男','見方の反転','すぐ動かず見方を変えようとしている','止まったまま意味づけだけを続けている'],['死神','終わりと切替','古い区切りを受け入れ始めている','終わらせることへの抵抗が残っている'],['節制','混ぜ合わせること','違うものを無理なく馴染ませようとしている','整えすぎて本音が薄くなっている'],['悪魔','執着と欲望','離れにくい欲求や誘惑を自覚している','欲しいものに縛られて視野が狭くなっている'],['塔','崩れと気づき','保っていた見方が揺らいでいる','崩れへの怖さが心を固くしている'],['星','希望と回復','小さくても信じたいものが残っている','希望を遠くに置きすぎて手元を見失っている'],['月','曖昧さと想像','はっきりしない感情を感じ取っている','不安や想像が輪郭を大きくしている'],['太陽','明るさと率直さ','素直に喜びたい・見せたい気持ちがある','明るく振る舞うことで陰りを隠している'],['審判','呼び戻しと応答','過去の声に応え直したい気持ちがある','昔の評価に縛られている'],['世界','統合と到達','ひとつのまとまりを感じ始めている','完成にこだわり次を見失っている'],
];
const MAJOR_ARCANA = MAJOR_ARCANA_ROWS.map(([name, coreTheme, uprightMeaning, reversedMeaning]) => ({ name, coreTheme, uprightMeaning, reversedMeaning }));
const SUITS: ReadonlyArray<{ name: string; arcana: Exclude<TarotArcana, 'major'>; theme: string }> = [{ name:'杖',arcana:'wands',theme:'意欲と動き' },{ name:'杯',arcana:'cups',theme:'感情と関係' },{ name:'剣',arcana:'swords',theme:'考えと言葉' },{ name:'金貨',arcana:'pentacles',theme:'現実と手触り' }];
const MINOR_RANKS = ['1','2','3','4','5','6','7','8','9','10','小姓','騎士','女王','王'] as const;
const RANK_MEANINGS: ReadonlyArray<{ theme: string; upright: string; reversed: string }> = [
  { theme:'始まり',upright:'新しい芽を受け取ろうとしている',reversed:'始める手前で気持ちが留まっている' },{ theme:'二つの間',upright:'二つのものの間で釣り合いを探している',reversed:'両方を抱えたまま決めにくくなっている' },{ theme:'広がり',upright:'誰かや何かと分かち合う気持ちがある',reversed:'広がりの中で自分の場所を見失いやすい' },{ theme:'土台',upright:'安心できる形を保とうとしている',reversed:'守ることが変化を止めている' },{ theme:'揺らぎ',upright:'足りなさや違いを意識している',reversed:'揺らぎを見ないふりして抱え込んでいる' },{ theme:'移り変わり',upright:'少し先へ進むための整理が始まっている',reversed:'移ることへの迷いが残っている' },{ theme:'見極め',upright:'何を信じるかを静かに測っている',reversed:'疑いが強くなりすぎている' },{ theme:'積み重ね',upright:'続けることで形にしたい感覚がある',reversed:'同じことの反復に疲れが出ている' },{ theme:'深まり',upright:'もう少し満たしたい気持ちが育っている',reversed:'満たされなさだけが前に出ている' },{ theme:'行き着く先',upright:'ひとつの区切りを感じ始めている',reversed:'終わりの重さを抱えすぎている' },{ theme:'好奇心',upright:'新しい感覚へ素直に目を向けている',reversed:'気持ちが定まらず散りやすい' },{ theme:'勢い',upright:'試しながら前へ出たい力がある',reversed:'勢いが先に立ち、落ち着きにくい' },{ theme:'受容',upright:'自分の感覚を丁寧に扱おうとしている',reversed:'受け止めすぎて自分を後回しにしている' },{ theme:'統率',upright:'自分の足場を持って整えようとしている',reversed:'握りしめることで硬くなっている' },
];
export const TAROT_DECK: readonly TarotDefinition[] = [
  ...MAJOR_ARCANA.map((card, index) => ({ ...card, id: `major-${index}`, arcana: 'major' as const })),
  ...SUITS.flatMap((suit) => MINOR_RANKS.map((rank, index) => { const meaning = RANK_MEANINGS[index]!; return { id: `${suit.name}-${index + 1}`, name: `${suit.name}の${rank}`, arcana: suit.arcana, coreTheme: `${suit.theme}における${meaning.theme}`, uprightMeaning: `${suit.theme}について、${meaning.upright}`, reversedMeaning: `${suit.theme}について、${meaning.reversed}` }; })),
];

export function shuffledTarotDeck() {
  const deck = [...TAROT_DECK];
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swap = secureRandomInt(index + 1);
    [deck[index], deck[swap]] = [deck[swap], deck[index]];
  }
  return deck;
}

export function revealTarotCard(id: string, role: TarotCardResult['role'], rng: () => number = () => secureRandomInt(2)): TarotCardResult {
  const card = TAROT_DECK.find((item) => item.id === id);
  if (!card) throw new Error('選んだカードを見つけられませんでした。');
  const orientation = rng() < .5 ? 'upright' as const : 'reversed' as const;
  return { id: card.id, name: card.name, role, orientation, coreTheme: card.coreTheme, orientationMeaning: orientation === 'upright' ? card.uprightMeaning : card.reversedMeaning };
}

export const SAINT_GERMAIN_METHOD_NOTE = '78枚のタロットから三枚を選び、「表層・深層・鍵」として現在の心理を読むポテノ六占の三枚引き。正位置を吉、逆位置を凶とはせず、カードのテーマが直接現れているか、偏りや停滞を伴って現れているかとして扱います。';
export function createSaintGermainResult(cards: readonly TarotCardResult[]): SaintGermainResultV1 {
  if (cards.length !== 3 || cards[0]?.role !== '表層' || cards[1]?.role !== '深層' || cards[2]?.role !== '鍵') throw new Error('表層・深層・鍵の順に三枚必要です。');
  const [surface, depth, key] = cards as [TarotCardResult, TarotCardResult, TarotCardResult];
  const fixedMeaning = { surface: `表に出ている心理には、${surface.orientationMeaning}という傾向が現れています。`, depth: `その下では、${depth.orientationMeaning}という感覚が動いている可能性があります。`, key: `二つを理解する鍵として、${key.orientationMeaning}という視点が示されています。` };
  return { type: 'tarot', calculationVersion: 'saint-germain-three-card-v1', provisional: false, cards: [surface, depth, key], fixedMeaning, characterReading: `表では${surface.coreTheme}、奥では${depth.coreTheme}。そして鍵の${key.coreTheme}――三枚はひとつの物語を映しているようね。`, methodNote: SAINT_GERMAIN_METHOD_NOTE };
}

function encodeUtf8(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeUtf8(value: string) {
  const binary = atob(value.replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

function extractData(communication: string) {
  const match = communication.match(/DATA\[\s*([A-Za-z0-9+/=\s]+?)\s*\]/);
  if (!match) throw new Error('通信文のDATAを見つけられませんでした。');
  return decodeUtf8(match[1]);
}

export function buildSixDivinationRequestData(options: {
  master: DivinationMasterId;
  consultation: string;
  birthDate: string;
  goalText: string;
  currentDay: number;
  activityDate: string;
  results: SixDivinationResults;
  dailyProgressRecords: DailyProgressRecord[];
  journalNotes: Record<string, string[]>;
  twoDayReviews: TwoDayReviewRecord[];
}): SixDivinationRequestData {
  const journal = options.dailyProgressRecords.map((record, index) => {
    const day = Math.max(1, options.currentDay - (options.dailyProgressRecords.length - 1 - index));
    const review = options.twoDayReviews.find((item) => item.targetDate === record.reviewedDate);
    return {
      day,
      date: record.reviewedDate,
      doneItems: options.journalNotes[record.reviewedDate] ?? record.doneItems ?? [],
      wasHard: Boolean(record.wasHard),
      ...(review ? { twoDayReview: { items: review.items, answers: review.answers } } : {}),
    };
  }).filter((entry) => entry.doneItems.length > 0 || entry.wasHard || entry.twoDayReview);
  return {
    protocol: 'POTENO-LINK',
    version: POTENO_DIVINATION_LINK_VERSION,
    type: 'SIX_DIVINATION_REQUEST',
    createdAt: new Date().toISOString(),
    selectedMaster: options.master,
    masterProfile: DIVINATION_MASTER_PROFILES[options.master],
    consultation: options.consultation.trim(),
    user: { birthDate: options.birthDate },
    goal: { text: options.goalText, currentDay: options.currentDay, activityDate: options.activityDate },
    sixResults: options.results,
    journal,
    rules: [
      '六占の乱数・カード・卦・言葉・自動計算結果はアプリ側で確定済み。変更、引き直し、補完をしない。',
      '選択された術師の人物像と思考傾向で、六つの結果を統合解釈する。',
      '入力記録に存在しない書籍名・数字・出来事を推測で追加しない。固有名詞は入力データに忠実に扱う。',
      '厳密計算未実装と示された結果を、厳密な天文学・暦学上の断定として扱わない。',
      '結果は助言として扱い、不安を過度に煽ったり重大な判断を強制したりしない。',
      '最後は必ずPOTENO-RETURN v1、TYPE: SIX_DIVINATION_RESPONSE、DATA[Base64]だけをコピーしやすい形で出力する。',
    ],
    requiredResponse: {
      type: 'SIX_DIVINATION_RESPONSE',
      master: options.master,
      integratedReading: '術師の統合解釈',
      potenoSummary: 'ポテノの分かりやすい要約',
      focus: ['今回意識すること'],
    },
  };
}

export function createSixDivinationLink(data: SixDivinationRequestData) {
  return `📡 POTENO-LINK v1\nTYPE: SIX_DIVINATION_REQUEST\n今回の術師：${DIVINATION_MASTER_PROFILES[data.selectedMaster].name}\n\nDATA[\n${encodeUtf8(data)}\n]`;
}

export function parseSixDivinationRequest(communication: string) {
  if (!/POTENO-LINK\s+v1/i.test(communication) || !/TYPE:\s*SIX_DIVINATION_REQUEST/i.test(communication)) {
    throw new Error('六占用のPOTENO-LINK v1ではありません。');
  }
  const decoded = extractData(communication) as Partial<SixDivinationRequestData>;
  if (decoded.type !== 'SIX_DIVINATION_REQUEST' || !decoded.sixResults) throw new Error('六占結果が入っていません。');
  return decoded as SixDivinationRequestData;
}

export function createSixDivinationReturn(data: SixDivinationResponse) {
  return `📡 POTENO-RETURN v1\nTYPE: SIX_DIVINATION_RESPONSE\n今回の術師：${DIVINATION_MASTER_PROFILES[data.master].name}\n\nDATA[\n${encodeUtf8(data)}\n]`;
}

export function parseSixDivinationResponse(communication: string, expectedMaster?: DivinationMasterId) {
  if (!/POTENO-RETURN\s+v1/i.test(communication) || !/TYPE:\s*SIX_DIVINATION_RESPONSE/i.test(communication)) {
    throw new Error('六占用のPOTENO-RETURN v1ではありません。');
  }
  const decoded = extractData(communication) as Partial<SixDivinationResponse>;
  if (decoded.type !== 'SIX_DIVINATION_RESPONSE') throw new Error('返信の種類が六占ではありません。');
  if (!decoded.master || !DIVINATION_MASTER_PROFILES[decoded.master]) throw new Error('術師を確認できません。');
  if (expectedMaster && decoded.master !== expectedMaster) throw new Error('選んだ術師と返信の術師が一致しません。');
  if (typeof decoded.integratedReading !== 'string' || !decoded.integratedReading.trim()) throw new Error('術師の統合解釈がありません。');
  if (typeof decoded.potenoSummary !== 'string' || !decoded.potenoSummary.trim()) throw new Error('ポテノの要約がありません。');
  if (!Array.isArray(decoded.focus) || decoded.focus.some((item) => typeof item !== 'string')) throw new Error('今回意識することを読み取れません。');
  return {
    type: 'SIX_DIVINATION_RESPONSE',
    master: decoded.master,
    integratedReading: decoded.integratedReading.trim(),
    potenoSummary: decoded.potenoSummary.trim(),
    focus: decoded.focus.map((item) => item.trim()).filter(Boolean),
  } satisfies SixDivinationResponse;
}

export function createSixDivinationRecord(options: {
  response: SixDivinationResponse;
  currentDay: number;
  consultation: string;
  results: SixDivinationResults;
}): SixDivinationRecord {
  const savedAt = new Date().toISOString();
  return {
    ...options.response,
    id: `six-divination-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    savedAt,
    consultedDay: options.currentDay,
    consultation: options.consultation.trim(),
    sixResults: options.results,
  };
}
