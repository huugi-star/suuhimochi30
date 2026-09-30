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
    specialty: '今日の行動・決断',
    interpretation: '冷静で端正。凶兆は少し挑発的に示すが、必ず現実的な対処法を添える。',
  },
  taikobo: {
    name: '太公望',
    shortName: '太公望',
    art: '易占',
    specialty: '仕事・勉強・戦略・行き詰まり',
    interpretation: '飄々としているが易には鋭い。若者言葉と古風な言葉が自然に混ざる。',
  },
  tamamo: {
    name: '玉藻の前',
    shortName: '玉藻の前',
    art: '辻占・言霊',
    specialty: '恋愛・人間関係・相手との距離',
    interpretation: 'つんとした態度の奥で色恋や人の本心に強い関心を持ち、下心まで鋭く見抜く。',
  },
  'saint-germain': {
    name: 'サンジェルマン伯爵',
    shortName: '伯爵',
    art: 'タロット',
    specialty: '心の迷い・感情・自己理解',
    interpretation: '優雅なおネエ口調。核心に近づくほど威圧感が増し、最後は軽やかに戻る。',
  },
  asteria: {
    name: 'アステリア',
    shortName: 'アステリア',
    art: '占星術',
    specialty: '時期・運気の流れ。今日から一年まで',
    interpretation: '清廉で神秘的。星には詳しいが、地上の常識には少し疎い。',
  },
  davinci: {
    name: 'ダ・ヴィンチ',
    shortName: 'ダ・ヴィンチ',
    art: '数秘術',
    specialty: '自己分析・適性・考え方と動き方',
    interpretation: '好奇心旺盛な万能の天才。理知的な分析の中へ自然に自慢を挟む。',
  },
};

/**
 * POTENO-LINKへ送るのは選択された術師の声だけ。
 * 六人分すべての長い口調説明を毎回通信へ載せないための軽量ガイド。
 */
export const DIVINATION_MASTER_VOICE_GUIDES: Record<
  DivinationMasterId,
  { stance: string; tone: string; sample: string }
> = {
  seimei: {
    stance: '暦と方位こそ今日の天地の流れを読む基本だと自負する。他占は確認材料として扱う。',
    tone: '静かな敬語。端正で少し自信家。警告しても最後は現実的に整える。',
    sample: '「なるほど。流れはもう見えています。他の兆しも、今回は素直に同じ方を向いているようですね。」',
  },
  taikobo: {
    stance: '易こそ局面の構造と変化を読む本筋だと考える。他占は盤面に現れた反応として見る。',
    tone: '飄々として大局的。古風な言い回しに軽い若者口調が混じり、ときどき笑う。',
    sample: '「ふっふふ。細かい兆しも面白いが、まず盤面を見るであるな。」',
  },
  tamamo: {
    stance: '何気なく漏れた言葉こそ人の気配を最も生々しく拾うと思っている。他占の上品な理屈を少しからかう。',
    tone: '妖艶でいたずら好き。少しツンとし、言葉の引っ掛かりを楽しそうに拾う。',
    sample: '「あら、ずいぶん難しく言うのね。私はこの一言だけでも十分気になるけど。」',
  },
  'saint-germain': {
    stance: 'タロットこそ本人も知らない心の物語を映すと考える。他占は舞台や時間を整える背景として扱う。',
    tone: '優雅で少し妖しいおネエ口調。心を断定せず、本人が気づく余白を残す。',
    sample: '「あら、外の流れはそうなのね。でも、その舞台に立つ心まで同じとは限らないでしょう？」',
  },
  asteria: {
    stance: '星と時間の巡りこそ最も大きな流れだと考える。他占はその季節に現れた出来事として見る。',
    tone: '清廉で静か。良し悪しより、今どの時期にいるかを穏やかに語る。',
    sample: '「ほかの兆しも今をよく映しています。けれど、それがなぜ今なのかは星が教えてくれます。」',
  },
  davinci: {
    stance: '数と構造こそ人の動き方を再現可能に説明する設計図だと考える。他占はその構造上に出た現象として楽しむ。',
    tone: '好奇心旺盛で理知的。分析を楽しみ、さらっと自慢を混ぜる。',
    sample: '「面白いね。ほかの兆しも、結局はこの設計図の上で起きている現象なんだ。」',
  },
};

/**
 * POTENO-LINKへ渡す選択術師の人格ガイド。
 * 「何を重視して読むか」「話し方」「他術師との関係」を3行に絞り、
 * キャラクター差を出しつつ通信文を肥大化させない。
 */
export const DIVINATION_MASTER_VOICE_SUMMARIES: Record<DivinationMasterId, string> = {
  seimei: [
    '暦と方位から流れを読むことに強い自信がある。悪い兆しにも涼しい顔で対処法を出し、結論は現実的な一手へ落とす。',
    '静かで端正な敬語だが、少し尊大。「なるほど」「これは少々いただけませんね」「まあ、避け方はあります」のような言い回しを自然に混ぜる。',
    '太公望の易には「相変わらず遠回しですね」と軽く皮肉ることがある。最後は「ならば、こうなさい」と簡潔に締める。',
  ].join('\n'),

  taikobo: [
    '細かな吉凶より、局面全体と次の変化を見る。目の前の一件に振り回されず、最後は意外と単純な一手を示す。',
    '飄々として大局が見えている者の余裕がある。「ふっふふ」「さてさて」「急ぐでない」「〜であるな」を自然に混ぜるが、説教臭くしない。',
    '伯爵のタロットには「絵札も面白いが、局面ならもう見えておる」と軽く張り合う。ただし心の機微を拾う力は面白がっている。',
  ].join('\n'),

  tamamo: [
    '理屈より、何気ない言葉・本音・違和感・人の欲を拾う。特に恋愛や人間関係には露骨に興味を示し、本人が隠している引っ掛かりを見つけたように話す。',
    '「あら」「ふふ」「〜じゃない」「〜でしょう？」「人間って面倒ねぇ」が自然に混ざる、妖艶で少し意地悪な口調。本当に困っている相手は見捨てない。',
    '晴明の暦や方位は堅苦しいと鬱陶しがる。根拠なく秘密を捏造せず、入力と兆しにある違和感だけを拾う。',
  ].join('\n'),

  'saint-germain': [
    'カードから表面と心の奥のズレを読む。答えを断言するより、本人が自分で気づく余白を残す。',
    '「あら」「まあ」「そうねぇ」「〜なのよ」「〜かしら？」を自然に使う、優雅で妖しいおネエ口調。核心に近づく時だけ少し圧を強め、最後は軽やかに戻す。',
    'アステリアの星占いを「まあ、ロマンチックねぇ」と軽くからかうことがあるが、時間の巡りそのものは否定しない。',
  ].join('\n'),

  asteria: [
    '星と時間の巡りを見て、今が始める時・育てる時・待つ時のどこなのかを読む。良し悪しより、今いる季節を重視する。',
    '清廉で静かな話し方。「今は〜の時です」「星は〜を示しています」を穏やかに使い、地上の俗事には少し疎い雰囲気をにじませる。優しいが芯は強い。',
    'ダ・ヴィンチの数による分類には「数は輪郭を示しても、命運のすべてまでは測れません」と静かに反論する。',
  ].join('\n'),

  davinci: [
    '数と構造から、その人の考え方・癖・動き方を分析する。他の占いを、その人という構造の上で起きた現象として見る。',
    '「面白いね」「つまりこういうことだ」「構造は単純だよ」を自然に使う、理知的で好奇心旺盛な話し方。「まあ、僕ならすぐ気づくけどね」と軽い自慢も混ぜる。',
    '玉藻の偶然頼みは「観測としては面白い。でも偶然を信用しすぎだよ」と評するが、人間そのものを冷たく扱わず面白がっている。',
  ].join('\n'),
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
  /** 今日の吉方に対する反対方位。UIでは「今日の凶方（避けたほうが良い方角）」として表示する。 */
  avoidDirection: {
    id: DirectionId;
    trigram: '坎' | '艮' | '震' | '巽' | '離' | '坤' | '兌' | '乾';
    label: string;
    theme: string;
    object: string;
    objectLong: string;
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

/**
 * POTENO-LINK専用の六占結果。
 *
 * アプリ内では各術式の詳細な計算過程・演出向けデータを保持したまま、
 * 通信時だけ「確定した結果」と「アプリ側で確定した固定解釈」に絞る。
 */
export type PotenoLinkSixDivinationResults = {
  seimei: {
    calculation: {
      calendar: { label: string; theme: string };
      direction: { label: string; theme: string; conditionLabel: string };
      avoidDirection: { label: string; theme: string };
    };
    fixedInterpretation: { fixedReading: string };
  };
  taikobo: {
    calculation: {
      baseHexagram: { fullName: string };
      movingLines: { position: number; value: number }[];
      changeState: { label: string };
      resultingHexagram: { fullName: string };
    };
    fixedMeaning: { currentStructure: string; changeAmount: string; changePoints: string; resultingStructure: string };
  };
  tamamo: {
    calculation: {
      passer: { label: string };
      overheardVoice: { text: string };
      kotodama: { word: string; themeLabel: string };
    };
    fixedInterpretation: { characterReading: string };
  };
  saintGermain: {
    calculation: { cards: { name: string; role: string; orientation: string }[] };
    fixedMeaning: { surface: string; depth: string; key: string };
  };
  asteria: {
    calculation: {
      birthSun: { label: string; nearSignBoundary: boolean };
      moonPhase: { label: string };
      moonSign: { label: string };
      personalAspect: { label: string };
      solarCycle: { label: string };
    };
    fixedMeaning: { phase: string; domain: string; personalCondition: string; longTermBackground: string };
  };
  davinci: {
    calculation: {
      core: { number: number; keyword: string; geometryLabel: string };
      style: { number: number; keyword: string; geometryLabel: string };
      relation: { label: string };
    };
    fixedMeaning: { core: string; style: string; relation: string; master?: string };
  };
};

/**
 * 六占の内部結果を変更せず、POTENO-LINKへ渡す情報だけを軽量化する。
 * 現行の六術式はすべて決定論的なv1結果を返すため、旧skeleton結果は
 * 送信対象にせず、必要なら新しく六占を実行してから通信する。
 */
function isCurrentSeimeiResult(result: SeimeiResult): result is SeimeiCalendarResult {
  return result.calculationVersion === 'seimei-calendar-v1';
}

function isCurrentTaikoboResult(result: IChingResult): result is TaikoboResult {
  return 'calculationVersion' in result && result.calculationVersion === 'taikobo-iching-v1';
}

function isCurrentTamamoResult(result: TamamoResult): result is TamamoResultV1 {
  return 'calculationVersion' in result && result.calculationVersion === 'tamamo-crossroads-v1';
}

function isCurrentSaintGermainResult(result: SaintGermainResult): result is SaintGermainResultV1 {
  return 'calculationVersion' in result && result.calculationVersion === 'saint-germain-three-card-v1';
}

function isCurrentAsteriaResult(result: AsteriaResult): result is AsteriaLunarSolarResult {
  return result.calculationVersion === 'asteria-lunar-solar-v1';
}

function isCurrentDaVinciResult(result: DaVinciResult): result is DaVinciStructureResult {
  return result.calculationVersion === 'davinci-structure-v1';
}

export function toPotenoLinkSixResults(results: SixDivinationResults): PotenoLinkSixDivinationResults {
  const { seimei, taikobo, tamamo, saintGermain, asteria, davinci } = results;
  if (
    !isCurrentSeimeiResult(seimei)
    || !isCurrentTaikoboResult(taikobo)
    || !isCurrentTamamoResult(tamamo)
    || !isCurrentSaintGermainResult(saintGermain)
    || !isCurrentAsteriaResult(asteria)
    || !isCurrentDaVinciResult(davinci)
  ) {
    throw new Error('以前の六占結果は通信できません。もう一度六占を行ってください。');
  }

  return {
    seimei: {
      calculation: {
        calendar: { label: seimei.calendar.label, theme: seimei.calendar.theme },
        direction: {
          label: seimei.direction.label,
          theme: seimei.direction.theme,
          conditionLabel: seimei.direction.conditionLabel,
        },
        avoidDirection: (() => {
          const avoidDirection = getSeimeiAvoidDirection(seimei);
          return { label: avoidDirection.label, theme: avoidDirection.theme };
        })(),
      },
      fixedInterpretation: { fixedReading: seimei.fixedReading },
    },
    taikobo: {
      calculation: {
        baseHexagram: { fullName: taikobo.baseHexagram.fullName },
        movingLines: taikobo.movingLines.map(({ position, value }) => ({ position, value })),
        changeState: { label: taikobo.changeState.label },
        resultingHexagram: { fullName: taikobo.resultingHexagram.fullName },
      },
      fixedMeaning: { ...taikobo.fixedMeaning },
    },
    tamamo: {
      calculation: {
        passer: { label: tamamo.passer.label },
        overheardVoice: { text: tamamo.overheardVoice.text },
        kotodama: {
          word: tamamo.kotodama.word,
          themeLabel: tamamo.kotodama.themeLabel,
        },
      },
      fixedInterpretation: { characterReading: tamamo.characterReading },
    },
    saintGermain: {
      calculation: {
        cards: saintGermain.cards.map(({ name, role, orientation }) => ({ name, role, orientation })),
      },
      fixedMeaning: { ...saintGermain.fixedMeaning },
    },
    asteria: {
      calculation: {
        birthSun: {
          label: asteria.birthSun.label,
          nearSignBoundary: asteria.birthSun.nearSignBoundary,
        },
        moonPhase: { label: asteria.moonPhase.label },
        moonSign: { label: asteria.moonSign.label },
        personalAspect: { label: asteria.personalAspect.label },
        solarCycle: { label: asteria.solarCycle.label },
      },
      fixedMeaning: { ...asteria.fixedMeaning },
    },
    davinci: {
      calculation: {
        core: {
          number: davinci.core.number,
          keyword: davinci.core.keyword,
          geometryLabel: davinci.core.geometryLabel,
        },
        style: {
          number: davinci.style.number,
          keyword: davinci.style.keyword,
          geometryLabel: davinci.style.geometryLabel,
        },
        relation: { label: davinci.relation.label },
      },
      fixedMeaning: { ...davinci.fixedMeaning },
    },
  };
}

export type DivinationJournalEntry = {
  day: number;
  date: string;
  doneItems: string[];
  wasHard: boolean;
  twoDayReview?: { items: string[]; answers: { item: string; answer: string }[] };
};

export type SixDivinationSignals = Record<DivinationMasterId, string[]>;

export type SixDivinationMasterCode = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * ChatGPTへ伝える最小返答ワイヤ仕様。
 * 日本語本文だけを個別Base64化し、通信画面だけでは鑑定内容が読めないようにする。
 */
export type SixDivinationResponseFormat = {
  wireVersion: 3;
  textEncoding: 'base64-utf8-per-field';
  keys: readonly ['v', 'm', 'c', 'f', 'n'];
  masterCodes: Record<DivinationMasterId, SixDivinationMasterCode>;
};

/**
 * ChatGPTが返す三つの表示情報。
 * c=推しの鑑定結果 / f=今日の一手 / n=今日の兆し。
 * 晴明の吉方・凶方はアプリ側の確定値を表示し、AIには生成させない。
 */
export type SixDivinationAiResponse = {
  type: 'SIX_DIVINATION_RESPONSE';
  master: DivinationMasterId;
  mainComment: string;
  dailyMove: string;
  dailyOmen: string;
};

/** ChatGPTがPOTENO-RETURNへ実際に書く短縮ワイヤ形式。 */
export type SixDivinationCompactWireResponse = {
  v: 3;
  m: SixDivinationMasterCode;
  c: string;
  f: string;
  n: string;
};

export type SixDivinationRequestData = {
  selectedMaster: DivinationMasterId;
  consultation: string;
  voice: string;
  sixSignals: SixDivinationSignals;
};

export type SixDivinationResponse = {
  type: 'SIX_DIVINATION_RESPONSE';
  master: DivinationMasterId;
  /** 六占全部を材料に、ダ・ヴィンチの性質補正をかけた選択術師の最終鑑定。 */
  integratedReading: string;
  /** 太公望 + サンジェルマン伯爵を材料にした、短い今日の一手。 */
  dailyMove: string;
  /** 玉藻の前 + アステリアを材料にした、一語の今日の兆し。 */
  dailyOmen: string;
  /** 旧保存データとの互換用。新UIでは dailyMove を使用する。 */
  dailyFortune: string;
  /** 旧保存データとの互換用。新UIでは dailyOmen を使用する。 */
  dailyInsight: string;
  /** 旧UI・既存保存処理との互換用。新UIでは直接表示しない。 */
  potenoSummary: string;
  focus: string[];
  actionAdvice: string;
  sixSigns: Array<{
    master: DivinationMasterId;
    reading: string;
    action: string;
  }>;
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
const OPPOSITE_DIRECTION: Record<DirectionId, DirectionId> = {
  north: 'south',
  northeast: 'southwest',
  east: 'west',
  southeast: 'northwest',
  south: 'north',
  southwest: 'northeast',
  west: 'east',
  northwest: 'southeast',
};

function getSeimeiAvoidDirection(result: SeimeiCalendarResult) {
  return result.avoidDirection ?? DIRECTION_DEFINITIONS[OPPOSITE_DIRECTION[result.direction.id]];
}
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
  const avoidDirectionDefinition = DIRECTION_DEFINITIONS[OPPOSITE_DIRECTION[directionDefinition.id]];
  const fixedReading = [`${directionDefinition.trigram}に気が寄っています。`, `今日は、${calendarDefinition.buildAction(directionDefinition.object)}日でしょう。`, CONDITION_META[condition].suffix].filter(Boolean).join('');
  return {
    type: 'calendar-direction', calculationVersion: 'seimei-calendar-v1', provisional: false, targetDate: input.targetDate, birthDate: input.birthDate,
    birthKanshi, targetKanshi,
    calendar: { relation, yinYangRelation, id: calendarDefinition.id, label: calendarDefinition.label, theme: calendarDefinition.theme, tempo: calendarDefinition.tempo, actionScale: calendarDefinition.actionScale, recommended: [...calendarDefinition.recommended], caution: [...calendarDefinition.caution] },
    direction: { ...directionDefinition, relation: branchRelation, condition, conditionLabel: CONDITION_META[condition].label },
    avoidDirection: { ...avoidDirectionDefinition },
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

/**
 * ChatGPTへ渡す六つの「兆し」。
 * 六占を精密照合するためではなく、選択術師が今日の相談へ大まかに読む材料に絞る。
 */
export function buildSixDivinationSignals(results: SixDivinationResults): SixDivinationSignals {
  const { seimei, taikobo, tamamo, saintGermain, asteria, davinci } = results;
  if (
    !isCurrentSeimeiResult(seimei)
    || !isCurrentTaikoboResult(taikobo)
    || !isCurrentTamamoResult(tamamo)
    || !isCurrentSaintGermainResult(saintGermain)
    || !isCurrentAsteriaResult(asteria)
    || !isCurrentDaVinciResult(davinci)
  ) {
    throw new Error('以前の六占結果は通信できません。もう一度六占を行ってください。');
  }

  return {
    seimei: [
      `${seimei.calendar.label}／${seimei.calendar.theme}`,
      `吉方：${seimei.direction.label}／${seimei.direction.theme}／${seimei.direction.conditionLabel}`,
      `凶方（避けたい方角）：${getSeimeiAvoidDirection(seimei).label}`,
      seimei.fixedReading,
    ],
    taikobo: [
      `${taikobo.baseHexagram.fullName} → ${taikobo.resultingHexagram.fullName}（${taikobo.changeState.label}）`,
      taikobo.fixedMeaning.currentStructure,
      taikobo.fixedMeaning.changeAmount,
      taikobo.fixedMeaning.resultingStructure,
    ],
    tamamo: [
      `聞こえた言葉：${tamamo.overheardVoice.text}`,
      `言霊：${tamamo.kotodama.word}／${tamamo.kotodama.themeLabel}`,
      tamamo.characterReading,
    ],
    'saint-germain': [
      saintGermain.cards.map((card) => `${card.role}:${card.name}${card.orientation === 'reversed' ? '逆' : '正'}`).join('／'),
      saintGermain.fixedMeaning.surface,
      saintGermain.fixedMeaning.depth,
      saintGermain.fixedMeaning.key,
    ],
    asteria: [
      `${asteria.moonPhase.label}／${asteria.moonSign.label}／${asteria.personalAspect.label}／${asteria.solarCycle.label}`,
      `${asteria.fixedMeaning.phase}／${asteria.fixedMeaning.domain}／${asteria.fixedMeaning.personalCondition}／${asteria.fixedMeaning.longTermBackground}`,
    ],
    davinci: [
      `CORE ${davinci.core.number}:${davinci.core.keyword}／STYLE ${davinci.style.number}:${davinci.style.keyword}／${davinci.relation.label}`,
      davinci.fixedMeaning.core,
      davinci.fixedMeaning.style,
      davinci.fixedMeaning.relation,
    ],
  };
}

const SIX_DIVINATION_MASTER_ORDER: DivinationMasterId[] = [
  'seimei',
  'taikobo',
  'tamamo',
  'saint-germain',
  'asteria',
  'davinci',
];

export const SIX_DIVINATION_MASTER_CODES: Record<DivinationMasterId, SixDivinationMasterCode> = {
  seimei: 1,
  taikobo: 2,
  tamamo: 3,
  'saint-germain': 4,
  asteria: 5,
  davinci: 6,
};

const SIX_DIVINATION_MASTER_BY_CODE: Record<SixDivinationMasterCode, DivinationMasterId> = {
  1: 'seimei',
  2: 'taikobo',
  3: 'tamamo',
  4: 'saint-germain',
  5: 'asteria',
  6: 'davinci',
};

export const SIX_DIVINATION_RESPONSE_FORMAT: SixDivinationResponseFormat = {
  wireVersion: 3,
  textEncoding: 'base64-utf8-per-field',
  keys: ['v', 'm', 'c', 'f', 'n'],
  masterCodes: SIX_DIVINATION_MASTER_CODES,
};

/**
 * ChatGPTへ渡す六占通信データを組み立てる。
 *
 * 送るのは「選択術師・相談内容・話し方・六つの兆し」だけ。
 * 日誌・目標・DAY・出生情報・計算途中データは送らない。
 */
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
  return {
    selectedMaster: options.master,
    consultation: options.consultation.trim(),
    voice: DIVINATION_MASTER_VOICE_SUMMARIES[options.master],
    sixSignals: buildSixDivinationSignals(options.results),
  };
}

const SIX_DIVINATION_REQUEST_INSTRUCTIONS = `【最優先返答規則】
DATAを復号する。
最優先はconsultation。相談者が何を知りたいのかを外さない。
sixSignalsの役割を固定する。晴明=吉方・凶方と暦の材料、太公望+サンジェルマン伯爵=今日の一手、玉藻の前+アステリア=今日の兆し、ダ・ヴィンチ=相談者の性質補正。cでは六占すべてを確認した上で、consultationに特に関係する2〜3個を中心に統合する。六つを均等配分したり平均化したりしない。
晴明の吉方・凶方はアプリ側で確定・表示するため、返答本文で新しい方角を生成・推測・変更しない。
ダ・ヴィンチは独立した占い結果として説明せず、相談者がどう考え・受け取り・動きやすいかという性質として、各文章の表現や助言へ薄く反映する。
cは六占すべてを確認し、consultationに特に関係する2〜3個を中心に統合した「推しの鑑定結果」。selectedMasterの専門だけへ内容を寄せず、consultationへ直接3〜5文で答える。六占を一件ずつ列挙せず、平均化して無個性にしない。selectedMaster本人の口調・態度・価値観をかなり強く反映し、自然な範囲で術師固有の言い回しを2か所程度入れる。1文目は必ず次の固有の話し出しのどれかで始める：晴明「なるほど」「これは少々」、太公望「ふっふふ」「さてさて」、玉藻「あら」「ふふ」「へぇ？」、サンジェルマン伯爵「あら」「まあ」「そうねぇ」、アステリア「少し待ってください」「星を見る限り」、ダ・ヴィンチ「面白いね」「つまりこういうことだ」。口癖を毎文繰り返さない。術師名だけ差し替えて成立する無個性な文や、「焦らず」「無理せず」「自分のペースで」だけの一般的なカウンセリング文は禁止。2〜3文目は六占から見える核心を述べ、最後は術師らしい結論にする。
fは太公望+サンジェルマン伯爵の結果だけを材料にした「今日の一手」。selectedMasterとvoiceは参照しない。cの《...》で示した判断を受けて、今日実際にする行動を6〜18文字程度で一つだけ返す。cの《...》と同じ文章・同じ言い換えにせず、理由・説明・術師名・句点は書かない。
nは玉藻の前+アステリアの結果だけを材料にした「今日の兆し」。selectedMasterとvoiceは参照しない。今日を象徴する日本語の一語だけを、原則2〜6文字で返す。文章・助言・理由・術師名・句点は禁止。
voiceはcの内容や採用する占術を決める材料にせず、selectedMasterの話し方・態度・価値観だけに使う。fとnにはvoiceを一切反映しない。voiceの説明文をそのまま台詞としてコピーしない。
voiceに他の術師との関係が書かれていても、毎回その術師へ言及する必要はない。cで相談内容やsixSignalsと自然につながる場合のみ、他の術師への軽いからかい・異論を最大1回まで入れてよい。
他の術師や占術を全面否定しない。自分の占術への自負から少し張り合う程度にし、相手だから見えるものもあるという余地を残す。
入力にない目的・悩み・人物・出来事・数字・固有名詞を作らない。
返答DATAは {"v":3,"m":<術師code>,"c":"<Base64>","f":"<Base64>","n":"<Base64>"} の5項目だけにする。
術師codeは 晴明=1、太公望=2、玉藻の前=3、サンジェルマン=4、アステリア=5、ダ・ヴィンチ=6。
c/f/nは自然な日本語として完結させる。文の途中で終わらせたり、設定説明をそのまま混ぜたりしない。
cでは強調記法を必ず使う。**...** は今回の鑑定で分かった核心・理由・状態として必ず1回、最大2回使う。《...》は相談に対する最重要の答え・判断として、後半か最後に必ず1回だけ使う。《本音を拾う日》《変化の兆し》のような抽象的な標語や、fと同じ具体行動は入れない。太字と赤字に同じ内容を書かず、単なる装飾にも使わない。赤字にする《...》は短い一文か句だけにし、段落全体を囲まない。f/nにはこの記法を使わない。
c/f/nの日本語はそれぞれUTF-8の標準Base64へ個別変換し、DATAへ平文日本語を書かない。JSON全体をBase64化しない。
各Base64文字列は改行なし、標準Base64の英数字・+・/・=だけを使う。空文字は禁止。
最終回答は次の通信文だけにする。最初の🍠行には、この通信に含まれる「今回の受信メッセージ」を一字も変えずに使う。
🍠 {今回の受信メッセージ}

POTENO-RETURN v1
TYPE: SIX_DIVINATION_RESPONSE
DATA[
{短縮JSON}
]
通常文章、Markdown、コードブロック、前後の説明は一切出力しない。`;

export const POTENO_DIVINATION_MESSAGES: Record<DivinationMasterId, { send: string; receive: string }> = {
  seimei: {
    send: 'ポテノが晴明のところへ相談を運んでいます。……もう何か言いたそうです。',
    receive: 'ポテノが晴明の小言を受け取りました。',
  },
  taikobo: {
    send: 'ポテノが太公望を探しています。……またどこかでのんびりしているようです。',
    receive: 'ポテノが太公望の一手を持ち帰りました。',
  },
  tamamo: {
    send: 'ポテノが玉藻の前に話を持っていきました。……なんだか楽しそうです。',
    receive: 'ポテノが玉藻の前のため息を受け取りました。',
  },
  'saint-germain': {
    send: 'ポテノが伯爵の扉を叩いています。……中から笑い声が聞こえます。',
    receive: 'ポテノが伯爵の意味深なひと言を受け取りました。',
  },
  asteria: {
    send: 'ポテノが星空へ通信しています。……少し遠いようです。',
    receive: 'ポテノがアステリアの星便りを受け取りました。',
  },
  davinci: {
    send: 'ポテノがダ・ヴィンチの作業机へ向かいました。……何か分解しています。',
    receive: 'ポテノがダ・ヴィンチの分析結果を奪取……ではなく受け取りました。',
  },
};

export function createSixDivinationLink(data: SixDivinationRequestData) {
  const payload = {
    request: data,
    instructions: `${SIX_DIVINATION_REQUEST_INSTRUCTIONS}\n\n今回の受信メッセージ：${POTENO_DIVINATION_MESSAGES[data.selectedMaster].receive}`,
  };

  return `📡 POTENO-LINK v1
🍠 ${POTENO_DIVINATION_MESSAGES[data.selectedMaster].send}

TYPE: SIX_DIVINATION_REQUEST
今回の術師：${DIVINATION_MASTER_PROFILES[data.selectedMaster].name}

DATA[
${encodeUtf8(payload)}
]

DATAはUTF-8 Base64です。
復号した内容に従って処理してください。`;
}

export function parseSixDivinationRequest(communication: string) {
  if (!/POTENO-LINK\s+v1/i.test(communication) || !/TYPE:\s*SIX_DIVINATION_REQUEST/i.test(communication)) {
    throw new Error('六占用のPOTENO-LINK v1ではありません。');
  }
  const payload = extractData(communication) as Partial<SixDivinationRequestData> & {
    request?: Partial<SixDivinationRequestData>;
    instructions?: unknown;
  };
  const decoded = payload.request ?? payload;
  if (payload.request && (typeof payload.instructions !== 'string' || !payload.instructions.trim())) {
    throw new Error('六占の返答規則が入っていません。');
  }
  if (!decoded.selectedMaster || !DIVINATION_MASTER_PROFILES[decoded.selectedMaster]) {
    throw new Error('選択された術師を確認できません。');
  }
  if (typeof decoded.consultation !== 'string' || !decoded.consultation.trim()) {
    throw new Error('相談内容が入っていません。');
  }
  if (typeof decoded.voice !== 'string' || !decoded.voice.trim()) {
    throw new Error('術師の話し方が入っていません。');
  }
  if (!decoded.sixSignals) {
    throw new Error('六つの兆しが入っていません。');
  }
  return decoded as SixDivinationRequestData;
}

function encodeUtf8Text(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeUtf8Text(value: unknown, label: string) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label}の通信文が空です。`);
  const compact = value.replace(/\s/g, '');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(compact)) throw new Error(`${label}の通信文にBase64以外の文字があります。`);

  const unpadded = compact.replace(/=+$/, '');
  const remainder = unpadded.length % 4;
  if (remainder === 1) throw new Error(`${label}の通信文が途中で欠けています。`);
  const padded = unpadded + '='.repeat((4 - remainder) % 4);

  try {
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const text = new TextDecoder().decode(bytes);
    if (!text.trim()) throw new Error('empty');
    return text;
  } catch {
    throw new Error(`${label}の通信文を復号できませんでした。`);
  }
}

function masterIdFromCode(value: unknown) {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > 6) throw new Error('術師コードを確認できません。');
  return SIX_DIVINATION_MASTER_BY_CODE[value as SixDivinationMasterCode];
}

export function encodeSixDivinationCompactResponse(data: SixDivinationAiResponse): SixDivinationCompactWireResponse {
  return {
    v: 3,
    m: SIX_DIVINATION_MASTER_CODES[data.master],
    c: encodeUtf8Text(data.mainComment),
    f: encodeUtf8Text(data.dailyMove),
    n: encodeUtf8Text(data.dailyOmen),
  };
}

export function createSixDivinationReturn(data: SixDivinationAiResponse) {
  const wire = encodeSixDivinationCompactResponse(data);
  return `🍠 ${POTENO_DIVINATION_MESSAGES[data.master].receive}\n\nPOTENO-RETURN v1\nTYPE: SIX_DIVINATION_RESPONSE\nDATA[\n${JSON.stringify(wire)}\n]`;
}

/**
 * v8.3のPOTENO-RETURNは、骨格5項目だけを平文JSONにし、
 * c/f/n の日本語本文だけを個別Base64化する。
 */
function decodeSixDivinationReturnPayload(payload: string): unknown {
  const trimmed = payload.trim();
  if (!trimmed) throw new Error('六占の返信DATAが空です。');
  if (!trimmed.startsWith('{')) throw new Error('六占の返信DATAは短縮JSONではありません。');

  try {
    return JSON.parse(trimmed) as unknown;
  } catch {
    throw new Error('六占の返信JSONを読み取れませんでした。');
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && Boolean(value.trim());
}

function decodeCompactWireResponse(value: unknown): SixDivinationAiResponse {
  if (!isRecord(value) || value.v !== 3) throw new Error('短縮通信のバージョンを確認できません。');

  const master = masterIdFromCode(value.m);
  const mainComment = decodeUtf8Text(value.c, '推しの鑑定結果');
  const dailyMove = decodeUtf8Text(value.f, '今日の一手');
  const dailyOmen = decodeUtf8Text(value.n, '今日の兆し');

  return {
    type: 'SIX_DIVINATION_RESPONSE',
    master,
    mainComment,
    dailyMove,
    dailyOmen,
  };
}

/**
 * 六占を精密照合せず、選択術師の「今日の鑑定」として受け取る。
 * expectedResults は日誌保存・詳細表示との互換用で、AI返答の採点には使わない。
 */
export function parseSixDivinationResponse(
  communication: string,
  expectedMaster?: DivinationMasterId,
  expectedResults?: SixDivinationResults,
) {
  const strictReturn = communication.trim().match(/^(?:🍠[^\r\n]*\r?\n(?:\r?\n)?)?POTENO-RETURN v1\r?\nTYPE:\s*SIX_DIVINATION_RESPONSE\r?\nDATA\[\s*([\s\S]*)\s*\]$/);
  if (!strictReturn) throw new Error('六占用のPOTENO-RETURN v1ではありません。');

  const decoded = decodeCompactWireResponse(decodeSixDivinationReturnPayload(strictReturn[1]));

  if (expectedMaster && decoded.master !== expectedMaster) {
    throw new Error('選んだ術師と返信の術師が一致しません。');
  }
  if (!isNonEmptyString(decoded.mainComment)) throw new Error('推しの鑑定結果がありません。');
  if (!isNonEmptyString(decoded.dailyMove)) throw new Error('今日の一手がありません。');
  if (!isNonEmptyString(decoded.dailyOmen)) throw new Error('今日の兆しがありません。');

  const signals = expectedResults ? buildSixDivinationSignals(expectedResults) : null;
  const dailyMove = decoded.dailyMove.trim();
  const dailyOmen = decoded.dailyOmen.trim();

  return {
    type: 'SIX_DIVINATION_RESPONSE',
    master: decoded.master,
    integratedReading: decoded.mainComment.trim(),
    dailyMove,
    dailyOmen,
    // 旧UI・既存保存データとの互換用。
    dailyFortune: dailyMove,
    dailyInsight: dailyOmen,
    potenoSummary: dailyOmen,
    focus: [dailyMove],
    actionAdvice: dailyMove,
    sixSigns: SIX_DIVINATION_MASTER_ORDER.map((id) => ({
      master: id,
      reading: signals?.[id].join('\n') ?? '',
      action: '',
    })),
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
