'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Clipboard, ExternalLink, Radio, RotateCcw } from 'lucide-react';
import { DivinationResultsAccordion } from '@/components/DivinationResultsAccordion';
import type { DailyProgressRecord } from '@/lib/dailyProgress';
import {
  DIVINATION_MASTER_PROFILES,
  buildSixDivinationRequestData,
  calculateAutomaticDivinations,
  calculateAsteriaResult,
  createSaintGermainResult,
  createSixDivinationLink,
  createSixDivinationRecord,
  generateIChingResult,
  parseSixDivinationResponse,
  revealTamamoResult,
  revealTarotCard,
  shuffledTarotDeck,
  type DivinationMasterId,
  type IChingResult,
  type SixDivinationRecord,
  type SixDivinationResponse,
  type SixDivinationResults,
  type TamamoResult,
  type TarotCardResult,
} from '@/lib/potenoSixDivination';
import { TAMAMO_PASSER_FORMS, type TamamoPasserForm } from '@/lib/tamamoCrossroads';
import type { TwoDayReviewRecord } from '@/lib/twoDayReview';

type SixStage = 'setup' | 'iching' | 'crossroads' | 'tarot' | 'converge' | 'send' | 'receive' | 'result';

type PotenoSixDivinationProps = {
  birthDate: string;
  currentDay: number;
  activityDate: string;
  goalText: string;
  dailyProgressRecords: DailyProgressRecord[];
  journalNotes: Record<string, string[]>;
  twoDayReviews: TwoDayReviewRecord[];
  onSave: (record: SixDivinationRecord) => void;
};

const MASTER_IDS = Object.keys(DIVINATION_MASTER_PROFILES) as DivinationMasterId[];
const MASTER_COPIES: Record<DivinationMasterId, string> = {
  seimei: '凶もまた、避け方を知れば兆しに過ぎません',
  taikobo: 'ふっふふ。まあ、大局を見ようではないか',
  tamamo: '恋だのなんだの、本当に人間は暇ねぇ',
  'saint-germain': 'あら、ずいぶん面白いカードを引きそうね',
  asteria: '星は静かに動いています',
  davinci: '万能の天才が少し見てあげよう',
};
type DivinerPose = 'neutral' | 'serious' | 'accent';
const DIVINER_ART: Record<DivinationMasterId, Record<DivinerPose, string>> = {
  seimei: {
    neutral: '/assets/strategists/diviners/seimei/seimei_neutral.png',
    serious: '/assets/strategists/diviners/seimei/seimei_serious.png',
    accent: '/assets/strategists/diviners/seimei/seimei_advice.png',
  },
  taikobo: {
    neutral: '/assets/strategists/diviners/taikobo/taikobo_neutral.png',
    serious: '/assets/strategists/diviners/taikobo/taikobo_serious.png',
    accent: '/assets/strategists/diviners/taikobo/taikobo_advice.png',
  },
  tamamo: {
    neutral: '/assets/strategists/diviners/tamamo/tamamo_neutral.png',
    serious: '/assets/strategists/diviners/tamamo/tamamo_serious.png',
    accent: '/assets/strategists/diviners/tamamo/tamamo_interested.png',
  },
  'saint-germain': {
    neutral: '/assets/strategists/diviners/saint_germain/saint_germain_neutral.png',
    serious: '/assets/strategists/diviners/saint_germain/saint_germain_serious.png',
    accent: '/assets/strategists/diviners/saint_germain/saint_germain_advice.png',
  },
  asteria: {
    neutral: '/assets/strategists/diviners/asteria/asteria_neutral.png',
    serious: '/assets/strategists/diviners/asteria/asteria_serious.png',
    accent: '/assets/strategists/diviners/asteria/asteria_shy.png',
  },
  davinci: {
    neutral: '/assets/strategists/diviners/davinci/davinci_neutral.png',
    serious: '/assets/strategists/diviners/davinci/davinci_serious.png',
    accent: '/assets/strategists/diviners/davinci/davinci_thinking.png',
  },
};
const QUICK_QUESTIONS = [
  { label: '今日の運勢', value: '今日の運勢を知りたい' },
  { label: '恋愛', value: '恋愛について占いたい' },
  { label: '人間関係', value: '人間関係について占いたい' },
  { label: '仕事・勉強', value: '仕事や勉強について占いたい' },
  { label: '迷いごと', value: '今抱えている迷いについて占いたい' },
  { label: 'なんとなく占う', value: '今の自分に必要な兆しを知りたい' },
] as const;
const DEFAULT_CONSULTATION = QUICK_QUESTIONS[0].value;
const TAROT_ROLES: TarotCardResult['role'][] = ['表層', '深層', '鍵'];
const ZODIAC_GLYPHS: Record<string, string> = { aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋', leo: '♌', virgo: '♍', libra: '♎', scorpio: '♏', sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓' };
type CrossroadsPhase = 'invocation' | 'passers' | 'reveal' | 'kotodama' | 'interpretation';
type TarotRitualPhase = 'entrance' | 'selection' | 'locked' | 'revealing' | 'complete';
const TAMAMO_INTROS = [
  '辻占はね、欲しい言葉を探すものじゃないの。',
  '通り過ぎる気配の中から、ひとつだけ縁を拾うのよ。',
] as const;
const TAMAMO_CROWD = [
  { key: 'far-monk', form: 'monk', depth: 'far', direction: 'ltr', y: 116, scale: .54, duration: 20, delay: -12.4 },
  { key: 'far-lady', form: 'lady', depth: 'far', direction: 'rtl', y: 122, scale: .58, duration: 22, delay: -3.2 },
  { key: 'far-child', form: 'child', depth: 'far', direction: 'ltr', y: 113, scale: .5, duration: 18, delay: -6.8 },
  { key: 'mid-traveler', form: 'traveler', depth: 'middle', direction: 'rtl', y: 76, scale: .78, duration: 15, delay: -10.1 },
  { key: 'mid-courtier-crossing', form: 'courtier', depth: 'middle', direction: 'ltr', y: 68, scale: .83, duration: 12, delay: -6 },
  { key: 'mid-lady-crossing', form: 'lady', depth: 'middle', direction: 'rtl', y: 65, scale: .82, duration: 12, delay: -6 },
  { key: 'mid-monk', form: 'monk', depth: 'middle', direction: 'ltr', y: 73, scale: .74, duration: 16, delay: -1.9 },
  { key: 'near-traveler', form: 'traveler', depth: 'near', direction: 'rtl', y: 8, scale: 1.18, duration: 13, delay: -4.1 },
  { key: 'near-lady', form: 'lady', depth: 'near', direction: 'ltr', y: 4, scale: 1.12, duration: 14, delay: -11.2 },
  { key: 'near-child', form: 'child', depth: 'near', direction: 'rtl', y: 13, scale: 1.04, duration: 11, delay: -8.7 },
] satisfies ReadonlyArray<{ key: string; form: TamamoPasserForm; depth: 'far' | 'middle' | 'near'; direction: 'ltr' | 'rtl'; y: number; scale: number; duration: number; delay: number }>;
const TAROT_INTROS = [
  'あら、いらっしゃい。三枚だけ選んでちょうだい。考えすぎると、札も退屈するわよ。',
  'ようこそ。今夜は三枚だけよ。目より先に、指が選んだ札を取りなさいな。',
] as const;
const RITUAL_STEPS = [
  { sigil: '暦', label: '方位' }, { sigil: '卦', label: '易' }, { sigil: '縁', label: '辻占' },
  { sigil: '札', label: 'タロット' }, { sigil: '星', label: '占星' }, { sigil: '数', label: '数秘' },
] as const;
const HEXAGRAM_NAMES: Record<string, string> = {
  乾乾: '乾為天', 乾兌: '天沢履', 乾離: '天火同人', 乾震: '天雷无妄', 乾巽: '天風姤', 乾坎: '天水訟', 乾艮: '天山遯', 乾坤: '天地否',
  兌乾: '沢天夬', 兌兌: '兌為沢', 兌離: '沢火革', 兌震: '沢雷随', 兌巽: '沢風大過', 兌坎: '沢水困', 兌艮: '沢山咸', 兌坤: '沢地萃',
  離乾: '火天大有', 離兌: '火沢睽', 離離: '離為火', 離震: '火雷噬嗑', 離巽: '火風鼎', 離坎: '火水未済', 離艮: '火山旅', 離坤: '火地晋',
  震乾: '雷天大壮', 震兌: '雷沢帰妹', 震離: '雷火豊', 震震: '震為雷', 震巽: '雷風恒', 震坎: '雷水解', 震艮: '雷山小過', 震坤: '雷地予',
  巽乾: '風天小畜', 巽兌: '風沢中孚', 巽離: '風火家人', 巽震: '風雷益', 巽巽: '巽為風', 巽坎: '風水渙', 巽艮: '風山漸', 巽坤: '風地観',
  坎乾: '水天需', 坎兌: '水沢節', 坎離: '水火既済', 坎震: '水雷屯', 坎巽: '水風井', 坎坎: '坎為水', 坎艮: '水山蹇', 坎坤: '水地比',
  艮乾: '山天大畜', 艮兌: '山沢損', 艮離: '山火賁', 艮震: '山雷頤', 艮巽: '山風蠱', 艮坎: '山水蒙', 艮艮: '艮為山', 艮坤: '山地剥',
  坤乾: '地天泰', 坤兌: '地沢臨', 坤離: '地火明夷', 坤震: '地雷復', 坤巽: '地風升', 坤坎: '地水師', 坤艮: '地山謙', 坤坤: '坤為地',
};

function trigramShortName(value: string) {
  return value.split('（')[0] || value;
}

function splitHexagram(value: string) {
  const [upper = '', lower = ''] = value.split('／');
  const upperName = trigramShortName(upper);
  const lowerName = trigramShortName(lower);
  return { upperName, lowerName, name: HEXAGRAM_NAMES[`${upperName}${lowerName}`] ?? `${upperName}${lowerName}` };
}

function movingLineLabel(line: number) {
  return ['初爻', '第二爻', '第三爻', '第四爻', '第五爻', '上爻'][line - 1] ?? `第${line}爻`;
}

function isTaikoboV1(result: IChingResult): result is Extract<IChingResult, { calculationVersion: 'taikobo-iching-v1' }> {
  return 'calculationVersion' in result && result.calculationVersion === 'taikobo-iching-v1';
}

function isTamamoV1(result: TamamoResult): result is Extract<TamamoResult, { calculationVersion: 'tamamo-crossroads-v1' }> {
  return 'calculationVersion' in result && result.calculationVersion === 'tamamo-crossroads-v1';
}

function ichingName(result: IChingResult, key: 'baseHexagram' | 'resultingHexagram') {
  return isTaikoboV1(result) ? result[key].fullName : splitHexagram(result[key]).name;
}

function ichingTrigrams(result: IChingResult, key: 'baseHexagram' | 'resultingHexagram') {
  if (!isTaikoboV1(result)) return splitHexagram(result[key]);
  const hexagram = result[key];
  const labels = { qian: '乾', dui: '兌', li: '離', zhen: '震', xun: '巽', kan: '坎', gen: '艮', kun: '坤' } as const;
  return { upperName: labels[hexagram.upperTrigram], lowerName: labels[hexagram.lowerTrigram] };
}

function taikoboReaction(result: IChingResult) {
  if (isTaikoboV1(result)) return result.characterReading;
  const labels = result.movingLines.map(movingLineLabel);
  if (labels.length === 0) return 'ほう、ひとつも動かぬか。静かな卦ほど、あとで効いてくるものよ。';
  if (labels.length === 1) return `ふっふふ。${labels[0]}が動いたであるか。この一筋、なかなか面白いぞ。`;
  if (labels.length === 2) return `ふっふふ。${labels.join('と')}が動いたであるか。さて、この変わり方は面白いぞ。`;
  if (result.movingLines.some((line) => line <= 2) && result.movingLines.some((line) => line >= 5)) return '下から上まで、ずいぶん賑やかに動いたのう。大きな流れが起きておる。';
  return `${labels.join('、')}が動いたか。ほっほう、卦も随分と話したがっておるな。`;
}

function saintGermainRevealLine(card: TarotCardResult | undefined, index: number) {
  if (!card) return 'あら、札がまだ姿を見せていないわね。';
  const orientation = card.orientation === 'upright' ? '正位置' : '逆位置';
  const role = TAROT_ROLES[index] ?? '札';
  const lead = index === 0 ? 'まずは' : index === 1 ? '次は' : '最後の鍵は';
  return `${lead}${role}……${card.name}、${orientation}。`;
}

function addCivilDays(value: string, offset: number) {
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offset));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function monthDayLabel(value: string) {
  const [, month = '', day = ''] = value.split('-');
  return `${Number(month)}/${Number(day)}`;
}

function regularPolygonPoints(sides: number, radius: number, rotation = -90, innerRadius?: number) {
  const count = innerRadius ? sides * 2 : sides;
  return Array.from({ length: count }, (_, index) => {
    const angle = (rotation + index * 360 / count) * Math.PI / 180;
    const distance = innerRadius && index % 2 ? innerRadius : radius;
    return `${100 + Math.cos(angle) * distance},${100 + Math.sin(angle) * distance}`;
  }).join(' ');
}

function DaVinciShape({ shape, className }: { shape: string; className: string }) {
  const polygon = (sides: number, radius: number, rotation?: number, innerRadius?: number) => <polygon points={regularPolygonPoints(sides, radius, rotation, innerRadius)} />;
  if (shape === 'point') return <circle className={className} cx="100" cy="100" r="7" />;
  if (shape === 'line') return <line className={className} x1="45" y1="100" x2="155" y2="100" />;
  if (shape === 'circle') return <circle className={className} cx="100" cy="100" r="72" />;
  if (shape === 'double-line') return <g className={className}><line x1="43" y1="91" x2="157" y2="91" /><line x1="43" y1="109" x2="157" y2="109" /></g>;
  if (shape === 'double-square') return <g className={className}>{polygon(4, 73, 45)}{polygon(4, 51, 45)}</g>;
  if (shape === 'double-hexagon') return <g className={className}>{polygon(6, 74, 30)}{polygon(6, 51, 30)}</g>;
  const sides = ({ triangle: 3, square: 4, pentagon: 5, hexagon: 6, heptagram: 7, octagon: 8 } as Record<string, number>)[shape] ?? 4;
  return <g className={className}>{polygon(sides, 73, sides === 4 ? 45 : -90, shape === 'heptagram' ? 31 : undefined)}</g>;
}
const CONVERGENCE = [
  ['晴明', '方位盤'], ['太公望', '卦'], ['玉藻の前', '辻占'], ['伯爵', '三枚のカード'],
  ['アステリア', '星図'], ['ダ・ヴィンチ', '数と図形'],
] as const;
const CONVERGENCE_SEQUENCE = [
  '方位盤が現れた……',
  '盤から縁へ、最初の光が届く……',
  '縁から星へ、兆しが渡る……',
  '星から盤へ戻り、第一の三角が閉じる……',
  '盤と縁のあわいに、卦が現れた……',
  '卦から札へ、第二の光が届く……',
  '札から数へ、兆しが渡る……',
  '数から卦へ戻り、六芒星が結ばれた。',
] as const;
const CONVERGENCE_MARK_REVEAL_STEP = [1, 5, 2, 6, 3, 7] as const;

function playOracleTone(tone: 'open' | 'cast' | 'select') {
  if (typeof window === 'undefined') return;
  const AudioContextClass = window.AudioContext
    ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const gain = context.createGain();
  const oscillator = context.createOscillator();
  const frequencies = tone === 'open' ? [174, 261.6] : tone === 'cast' ? [146.8, 220] : [293.7, 440];
  oscillator.type = tone === 'cast' ? 'triangle' : 'sine';
  oscillator.frequency.setValueAtTime(frequencies[0], context.currentTime);
  oscillator.frequency.exponentialRampToValueAtTime(frequencies[1], context.currentTime + .18);
  gain.gain.setValueAtTime(.0001, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(.055, context.currentTime + .025);
  gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + .32);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + .34);
  oscillator.addEventListener('ended', () => void context.close());
}

export function PotenoSixDivination({
  birthDate,
  currentDay,
  activityDate,
  goalText,
  dailyProgressRecords,
  journalNotes,
  twoDayReviews,
  onSave,
}: PotenoSixDivinationProps) {
  const [stage, setStage] = useState<SixStage>('setup');
  const [openingRitual, setOpeningRitual] = useState(false);
  const [consultation, setConsultation] = useState('');
  const [master, setMaster] = useState<DivinationMasterId>('seimei');
  const [automatic, setAutomatic] = useState<ReturnType<typeof calculateAutomaticDivinations> | null>(null);
  const [iching, setIching] = useState<IChingResult | null>(null);
  const [ichingCasting, setIchingCasting] = useState(false);
  const [ichingSequenceDone, setIchingSequenceDone] = useState(false);
  const [tamamo, setTamamo] = useState<TamamoResult | null>(null);
  const [crossroadsPhase, setCrossroadsPhase] = useState<CrossroadsPhase>('invocation');
  const [tamamoIntro, setTamamoIntro] = useState<string>(TAMAMO_INTROS[0]);
  const [selectedPasserKey, setSelectedPasserKey] = useState('');
  const [tarot, setTarot] = useState<TarotCardResult[]>([]);
  const [tarotDeck, setTarotDeck] = useState(() => shuffledTarotDeck());
  const [tarotPhase, setTarotPhase] = useState<TarotRitualPhase>('entrance');
  const [tarotIntro, setTarotIntro] = useState<string>(TAROT_INTROS[0]);
  const [tarotRevealedCount, setTarotRevealedCount] = useState(0);
  const [convergenceIndex, setConvergenceIndex] = useState(0);
  const [returnText, setReturnText] = useState('');
  const [response, setResponse] = useState<SixDivinationResponse | null>(null);
  const [error, setError] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [saved, setSaved] = useState(false);
  const eventTimers = useRef(new Set<number>());

  const clearEventTimers = useCallback(() => {
    eventTimers.current.forEach((timer) => window.clearTimeout(timer));
    eventTimers.current.clear();
  }, []);

  const scheduleEvent = useCallback((callback: () => void, delay: number) => {
    let timer = 0;
    timer = window.setTimeout(() => {
      eventTimers.current.delete(timer);
      callback();
    }, delay);
    eventTimers.current.add(timer);
    return timer;
  }, []);

  useEffect(() => clearEventTimers, [clearEventTimers]);

  const results = useMemo<SixDivinationResults | null>(() => {
    if (!automatic || !iching || !tamamo || tarot.length !== 3) return null;
    return {
      seimei: automatic.seimei,
      taikobo: iching,
      tamamo,
      saintGermain: createSaintGermainResult(tarot),
      asteria: automatic.asteria,
      davinci: automatic.davinci,
    };
  }, [automatic, iching, tamamo, tarot]);

  const asteriaWeek = useMemo(() => {
    if (!automatic || automatic.asteria.calculationVersion !== 'asteria-lunar-solar-v1') return [];
    return Array.from({ length: 7 }, (_, offset) => {
      const targetDate = addCivilDays(activityDate, offset);
      return calculateAsteriaResult({ birthDate, targetDate });
    });
  }, [activityDate, automatic, birthDate]);

  const resolvedConsultation = consultation.trim() || DEFAULT_CONSULTATION;

  const requestData = useMemo(() => results ? buildSixDivinationRequestData({
    master,
    consultation: resolvedConsultation,
    birthDate,
    goalText,
    currentDay,
    activityDate,
    results,
    dailyProgressRecords,
    journalNotes,
    twoDayReviews,
  }) : null, [activityDate, birthDate, currentDay, dailyProgressRecords, goalText, journalNotes, master, resolvedConsultation, results, twoDayReviews]);
  const link = useMemo(() => requestData ? createSixDivinationLink(requestData) : '', [requestData]);

  useEffect(() => {
    if (stage !== 'converge') return;
    if (convergenceIndex >= CONVERGENCE_SEQUENCE.length) {
      const timer = window.setTimeout(() => setStage('send'), 2800);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setConvergenceIndex((value) => value + 1), 430);
    return () => window.clearTimeout(timer);
  }, [convergenceIndex, stage]);

  useEffect(() => {
    if (stage !== 'tarot') return;
    setTarotPhase('entrance');
    setTarotIntro(TAROT_INTROS[Math.floor(Math.random() * TAROT_INTROS.length)]);
    setTarotRevealedCount(0);
    const timer = window.setTimeout(() => setTarotPhase('selection'), 3100);
    return () => window.clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'tarot' || tarotPhase !== 'selection' || tarot.length !== 3) return;
    const timer = window.setTimeout(() => setTarotPhase('locked'), 520);
    return () => window.clearTimeout(timer);
  }, [stage, tarot.length, tarotPhase]);

  useEffect(() => {
    if (stage !== 'tarot' || tarotPhase !== 'locked') return;
    const timer = window.setTimeout(() => {
      setTarotPhase('revealing');
      setTarotRevealedCount(1);
      playOracleTone('select');
    }, 1700);
    return () => window.clearTimeout(timer);
  }, [stage, tarotPhase]);

  useEffect(() => {
    if (stage !== 'tarot' || tarotPhase !== 'revealing' || tarotRevealedCount === 0) return;
    if (tarotRevealedCount >= 3) {
      const finishTimer = window.setTimeout(() => setTarotPhase('complete'), 1250);
      return () => window.clearTimeout(finishTimer);
    }
    const timer = window.setTimeout(() => {
      setTarotRevealedCount((count) => Math.min(3, count + 1));
      playOracleTone('select');
    }, 1350);
    return () => window.clearTimeout(timer);
  }, [stage, tarotPhase, tarotRevealedCount]);

  useEffect(() => {
    if (!iching) return;
    const timer = window.setTimeout(() => setIchingSequenceDone(true), 3000);
    return () => window.clearTimeout(timer);
  }, [iching]);

  useEffect(() => {
    if (!openingRitual) return;
    const timer = window.setTimeout(() => {
      setStage('iching');
      setOpeningRitual(false);
    }, 2250);
    return () => window.clearTimeout(timer);
  }, [openingRitual]);

  useEffect(() => {
    if (stage !== 'crossroads') return;
    setCrossroadsPhase('invocation');
    setTamamoIntro(TAMAMO_INTROS[Math.floor(Math.random() * TAMAMO_INTROS.length)]);
    setSelectedPasserKey('');
    const timer = window.setTimeout(() => setCrossroadsPhase('passers'), 3200);
    return () => window.clearTimeout(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'crossroads' || crossroadsPhase !== 'reveal' || !tamamo) return;
    const timer = window.setTimeout(() => setCrossroadsPhase('kotodama'), 1200);
    return () => window.clearTimeout(timer);
  }, [crossroadsPhase, stage, tamamo]);

  useEffect(() => {
    if (stage !== 'crossroads' || crossroadsPhase !== 'kotodama' || !tamamo) return;
    const timer = window.setTimeout(() => setCrossroadsPhase('interpretation'), 1100);
    return () => window.clearTimeout(timer);
  }, [crossroadsPhase, stage, tamamo]);

  const chooseCrossroadsShadow = (passerKey: string, form: TamamoPasserForm) => {
    if (crossroadsPhase !== 'passers' || tamamo) return;
    playOracleTone('select');
    setSelectedPasserKey(passerKey);
    setTamamo(revealTamamoResult({ key: passerKey, form, label: TAMAMO_PASSER_FORMS[form].label }));
    setCrossroadsPhase('reveal');
  };

  const start = () => {
    if (!birthDate || openingRitual) return;
    setAutomatic(calculateAutomaticDivinations({ birthDate, targetDate: activityDate }));
    playOracleTone('open');
    setOpeningRitual(true);
  };

  const selectTarot = (id: string) => {
    if (tarotPhase !== 'selection' || tarot.length >= 3 || tarot.some((card) => card.id === id)) return;
    playOracleTone('select');
    setTarot((cards) => [...cards, revealTarotCard(id, TAROT_ROLES[cards.length])]);
  };

  const castIChing = () => {
    if (ichingCasting || iching) return;
    playOracleTone('cast');
    setIchingSequenceDone(false);
    setIchingCasting(true);
    scheduleEvent(() => {
      setIching(generateIChingResult());
      setIchingCasting(false);
    }, 780);
  };

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
    scheduleEvent(() => setCopyState('idle'), 1800);
  }, [link, scheduleEvent]);

  const receive = () => {
    try {
      if (!results) throw new Error('六占の元結果がありません。');
      const parsed = parseSixDivinationResponse(returnText, master);
      setResponse(parsed);
      setError('');
      if (!saved) {
        onSave(createSixDivinationRecord({ response: parsed, currentDay, consultation: resolvedConsultation, results }));
        setSaved(true);
      }
      setStage('result');
    } catch (receiveError) {
      setError(receiveError instanceof Error ? receiveError.message : '通信文を読み込めませんでした。');
    }
  };

  const reset = () => {
    clearEventTimers();
    setStage('setup');
    setOpeningRitual(false);
    setAutomatic(null);
    setIching(null);
    setIchingCasting(false);
    setIchingSequenceDone(false);
    setTamamo(null);
    setCrossroadsPhase('invocation');
    setTarot([]);
    setTarotDeck(shuffledTarotDeck());
    setTarotPhase('entrance');
    setTarotRevealedCount(0);
    setConvergenceIndex(0);
    setReturnText('');
    setResponse(null);
    setError('');
    setSaved(false);
  };

  return (
    <div className="poteno-six">
      <div className="six-cosmos" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => <i key={index} style={{ '--star': index, '--x': `${(index * 47) % 97}%`, '--y': `${(index * 71) % 89}%` } as React.CSSProperties} />)}
      </div>
      <header className={`six-brand${stage === 'setup' ? ' is-compact' : ''}`}>
        <span className="six-brand-seal" aria-hidden="true"><i />六</span>
        {stage === 'setup' ? <div><h2>ポテノ六占</h2></div> : <div><small>POTENO SIX ORACLES</small><h2>ポテノ六占</h2><p>六つの術式を重ね、ひとつの兆しを読む</p></div>}
        <em>第 {currentDay} 日</em>
      </header>
      <div className="six-progress" aria-label="六占の進行">
        {RITUAL_STEPS.map(({ sigil, label }, index) => {
          const stageIndex = ['setup', 'iching', 'crossroads', 'tarot', 'converge', 'send', 'receive', 'result'].indexOf(stage);
          const markerIndex = Math.min(5, stageIndex);
          return <span key={label} className={index <= markerIndex ? 'is-active' : ''}><i>{sigil}</i><b>{label}</b></span>;
        })}
      </div>

      {stage === 'setup' && <section className={`six-setup${openingRitual ? ' is-opening' : ''}`} aria-busy={openingRitual}>
        <div className="six-intro"><span className="entrance-mon" aria-hidden="true">六</span><div><strong>六つの兆しを、ひとつの問いへ</strong><p>六つの占いがそれぞれ異なる角度から問いを読み、選んだ術師が六つの結果を束ねて解釈します。</p></div></div>

        <div className="six-question-scroll">
          <div className="question-heading"><label htmlFor="six-divination-question">六占に問うこと</label><small>気になることを書くか、下の問いを選んでください。</small><strong>空欄のまま進むと、今日の運勢を占います。</strong></div>
          <textarea id="six-divination-question" disabled={openingRitual} value={consultation} onChange={(event) => setConsultation(event.target.value)} maxLength={800} placeholder="ここを押して、六つの術式へ預けたい問いを書く……" />
          <div className="quick-question-list" aria-label="すぐに占える問い">{QUICK_QUESTIONS.map((question) => <button key={question.label} type="button" disabled={openingRitual} className={consultation === question.value ? 'is-selected' : ''} onClick={() => setConsultation(question.value)}>{question.label}</button>)}</div>
        </div>

        <fieldset className="six-master-picker" disabled={openingRitual}><legend>六つの声を束ねる術師</legend>{MASTER_IDS.map((id) => {
          const profile = DIVINATION_MASTER_PROFILES[id];
          return <button key={id} type="button" data-diviner-id={id} className={master === id ? 'is-selected' : ''} onClick={() => { playOracleTone('select'); setMaster(id); }}><span className="diviner-card-art" aria-hidden="true"><img src={DIVINER_ART[id][master === id ? 'accent' : 'neutral']} alt="" /></span><span className="diviner-card-info"><span className="diviner-card-title"><b>{profile.name}</b><small>{profile.art}</small></span><em>「{MASTER_COPIES[id]}」</em></span>{master === id && <u>選定</u>}</button>;
        })}</fieldset>

        <div className={`setup-sigil-field${openingRitual ? ' is-opening' : ''}`} aria-live="polite">
          <svg className="setup-hexagram-lines" viewBox="0 0 320 240" aria-hidden="true">
            <polygon points="160,20 255,185 65,185" />
            <polygon points="160,220 255,55 65,55" />
            {[[160,20],[255,75],[255,185],[160,220],[65,185],[65,75]].map(([x, y], index) => <line key={index} x1="160" y1="120" x2={x} y2={y} style={{ '--ray-delay': `${index * 150}ms` } as React.CSSProperties} />)}
            <circle cx="160" cy="120" r="29" />
          </svg>
          <div className="setup-sigil-orbit" aria-hidden="true">{RITUAL_STEPS.map(({ sigil, label }, index) => <span key={label} style={{ '--sigil-angle': `${index * 60}deg`, '--sigil-delay': `${index * 150}ms` } as React.CSSProperties}><i>{sigil}</i><b>{label}</b></span>)}</div>
          <button className="setup-open-seal" type="button" disabled={!birthDate || openingRitual} onClick={start}><small>{openingRitual ? '六印を結ぶ' : '問いを託して'}</small><strong>{openingRitual ? '開式' : '六占を開く'}</strong></button>
        </div>

        {openingRitual && <p className="setup-opening-voice">暦、卦、縁、札、星、数――六つの印を開いています。</p>}
        {!birthDate && <p className="six-error">生年月日が未登録です。設定から登録してください。</p>}
      </section>}

      {stage === 'iching' && <section className={`six-scene six-iching${iching ? ' has-reading' : ''}${ichingSequenceDone ? ' is-complete' : ''}`}>
        <header><span>卦</span><div><small>太公望・筮竹の儀</small><h3>問いを鎮め、六爻を立てる</h3></div></header>
        <div className="iching-ritual">
          <div className="iching-diagram" aria-hidden="true"><i /><i /><i /><i /><b>☯</b></div>
          <div className="iching-vessel-zone">
            <div className="iching-vessel" aria-hidden="true">
              <div className={`iching-tube${ichingCasting ? ' is-casting' : ''}${iching ? ' is-cast' : ''}`}>
                <div className="bamboo-sticks">{Array.from({ length: 24 }, (_, index) => <i key={index} />)}</div>
                <div className="tube-carving"><span>☰</span><span>☵</span><span>☷</span><span>☲</span></div>
                <i className="tube-yinyang">☯</i>
              </div>
              <div className="vessel-shadow" />
            </div>
            {iching && <div className="cast-sticks" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <i key={index} style={{ '--cast-delay': `${index * 55}ms`, '--cast-x': `${42 + index * 8}px`, '--cast-y': `${-74 + index * 4}px`, '--cast-end-x': `${62 + index * 12}px`, '--cast-end-y': `${-36 + index * 7}px`, '--cast-rotate': `${42 + index * 5}deg`, '--cast-end-rotate': `${78 + index * 7}deg` } as React.CSSProperties} />)}</div>}
          </div>
          {iching && <div className="iching-transformation" aria-live="polite">
            <div className="process-title is-base"><small>本卦</small><strong>{ichingName(iching, 'baseHexagram')}</strong></div>
            <div className="process-title is-result"><small>之卦</small><strong>{ichingName(iching, 'resultingHexagram')}</strong></div>
            <div className="ritual-hexagram" aria-label="本卦から之卦へ変化する六爻">
              {iching.lines.map((line, index) => {
                const changedLine = line === 6 ? 7 : line === 9 ? 8 : line;
                const moving = line === 6 || line === 9;
                const lineClass = line === 7 || line === 9 ? 'is-yang' : 'is-yin';
                const changedClass = changedLine === 7 || changedLine === 9 ? 'is-yang' : 'is-yin';
                return <div key={index} className={`ritual-line ${lineClass}${moving ? ' is-moving' : ''}`} style={{ '--line-delay': `${100 + index * 220}ms` } as React.CSSProperties}>
                  <span className="line-original"><i /><i /></span>
                  <span className={`line-changed ${changedClass}`}><i /><i /></span>
                </div>;
              })}
            </div>
          </div>}
          {iching && <aside className="iching-result-detail" aria-label="易占の確定結果">
            <section><small>本卦</small><strong>{ichingName(iching, 'baseHexagram')}</strong><p><span>上卦</span>{ichingTrigrams(iching, 'baseHexagram').upperName}</p><p><span>下卦</span>{ichingTrigrams(iching, 'baseHexagram').lowerName}</p></section>
            <section className="is-moving"><small>動爻</small><strong>{iching.movingLines.length ? isTaikoboV1(iching) ? iching.movingLines.map((line) => `${movingLineLabel(line.position)} ${line.directionLabel}`).join('・') : iching.movingLines.map(movingLineLabel).join('・') : '動爻なし'}</strong></section>
            <section><small>之卦</small><strong>{ichingName(iching, 'resultingHexagram')}</strong><p><span>上卦</span>{ichingTrigrams(iching, 'resultingHexagram').upperName}</p><p><span>下卦</span>{ichingTrigrams(iching, 'resultingHexagram').lowerName}</p></section>
          </aside>}
        </div>
        {!iching && <button className="six-primary iching-cast-button" type="button" disabled={ichingCasting} onClick={castIChing}>{ichingCasting ? '筮竹の音に耳を澄ます……' : '筮竹を振り、卦を立てる'}</button>}
        {ichingSequenceDone && iching && <div className="iching-footer"><blockquote><small>太公望</small><p>「{taikoboReaction(iching)}」</p></blockquote><img className="taikobo-art" src={DIVINER_ART.taikobo.accent} alt="" /><button className="six-next" type="button" onClick={() => setStage('crossroads')}>卦を納め、辻へ進む</button></div>}
      </section>}

      {stage === 'crossroads' && <section className={`six-scene six-crossroads phase-${crossroadsPhase}`}>
        <header><span>縁</span><div><small>玉藻の前・辻占の儀</small><h3>逢魔が時、通りすがりの縁を拾う</h3></div></header>
        <div className="tamamo-ritual" aria-live="polite">
          <div className="crossroads-sky" aria-hidden="true"><i className="crossroads-moon" /><i className="crossroads-mist mist-one" /><i className="crossroads-mist mist-two" /><i className="crossroads-signpost" /><i className="crossroads-road road-one" /><i className="crossroads-road road-two" /><div className="crossroads-torii"><i /><b /></div><div className="crossroads-lights"><i /><i /><i /><i /></div><div className="crossroads-divination-map"><i className="map-compass">方</i><i className="map-star">✦</i><i className="map-hexagram">☷</i><i className="map-sixstar">✡</i><i className="map-number">Ⅵ</i><i className="map-card">札</i></div></div>

          <div className="tamamo-presence" aria-hidden="true">
            <div className="fox-fire fire-one" /><div className="fox-fire fire-two" /><div className="fox-fire fire-three" />
            <img className="tamamo-art" src={DIVINER_ART.tamamo[crossroadsPhase === 'interpretation' ? 'serious' : crossroadsPhase === 'reveal' ? 'accent' : 'neutral']} alt="" />
            <div className="tamamo-petals">{Array.from({ length: 8 }, (_, index) => <i key={index} style={{ '--petal': index } as React.CSSProperties} />)}</div>
          </div>

          {crossroadsPhase === 'invocation' && <div className="tamamo-invocation">
            <span>玉藻の前</span><blockquote>「{tamamoIntro}」</blockquote><small>狐火が辻の境をひらいている……</small>
          </div>}

          {crossroadsPhase !== 'invocation' && <>
            <div className="crossroads-passers" aria-label="行き交う人影から、ひとつの気配を選ぶ">
              {TAMAMO_CROWD.map((person, index) => {
                const form = TAMAMO_PASSER_FORMS[person.form];
                const selected = selectedPasserKey === person.key;
                return <button key={person.key} type="button" className={`${form.className} depth-${person.depth} direction-${person.direction}${person.key.includes('crossing') ? ' is-crossing' : ''}${selected ? ' is-selected' : ''}${tamamo && !selected ? ' is-faded' : ''}`} disabled={crossroadsPhase !== 'passers'} onClick={() => chooseCrossroadsShadow(person.key, person.form)} aria-label={`${form.label}の気配を選ぶ`} style={{ '--passer': index, '--passer-y': `${person.y}px`, '--passer-scale': person.scale, '--passer-duration': `${person.duration}s`, '--passer-delay': `${person.delay}s` } as React.CSSProperties}>
                  <i className="passer-shadow"><i className="passer-head" /><i className="passer-body" /><i className="passer-prop" /></i><span>{form.mark}</span>
                </button>;
              })}
            </div>
            <div className="crossroads-omen" aria-hidden="true"><i /><b /></div>
          </>}

          {crossroadsPhase === 'passers' && <div className="crossroads-guidance"><b>通りすがりの気配を、ひとつ</b><small>顔も、言葉もまだ見えない。なぜか気になる影に触れて。</small></div>}

          {crossroadsPhase === 'reveal' && tamamo && <div className="crossroads-word" role="status"><small>通りすがりの声</small><blockquote>「{isTamamoV1(tamamo) ? tamamo.overheardVoice.text : tamamo.phrase}」</blockquote></div>}

          {crossroadsPhase === 'kotodama' && tamamo && <div className="crossroads-word crossroads-kotodama" role="status"><small>玉藻が拾った言霊</small><blockquote>「{isTamamoV1(tamamo) ? tamamo.kotodama.word : tamamo.phrase}」</blockquote></div>}

          {crossroadsPhase === 'interpretation' && tamamo && <div className="tamamo-interpretation">
            <span>玉藻の前</span><blockquote>「{isTamamoV1(tamamo) ? tamamo.characterReading : tamamo.phrase}」</blockquote>
          </div>}
        </div>
        {crossroadsPhase === 'interpretation' && <button className="six-next" type="button" onClick={() => setStage('tarot')}>拾った言葉を納め、札の間へ進む</button>}
      </section>}

      {stage === 'tarot' && <section className={`six-scene six-tarot ritual-${tarotPhase}`}>
        <header><span>札</span><div><small>サンジェルマン伯爵・七十八枚の儀</small><h3>裏向きの札から三枚</h3></div></header>
        <div className="tarot-ritual" aria-live="polite">
          <div className="tarot-velvet" aria-hidden="true"><i /><i /><i /><div className="tarot-orbit-ring" /></div>
          <div className="germain-presence" aria-hidden="true"><img className="germain-art" src={DIVINER_ART['saint-germain'][tarotPhase === 'complete' ? 'accent' : tarotPhase === 'revealing' ? 'serious' : 'neutral']} alt="" /><div className="germain-particles">{Array.from({ length: 12 }, (_, index) => <i key={index} style={{ '--particle': index } as React.CSSProperties} />)}</div></div>

          {tarotPhase === 'entrance' && <div className="germain-introduction"><span>サンジェルマン伯爵</span><blockquote>「{tarotIntro}」</blockquote><small>七十八枚の札が、場へほどかれていく……</small></div>}

          {tarotPhase === 'selection' && <div className="tarot-selection-stage">
            <div className="tarot-fan-scroll" aria-label="78枚をシャッフルして展開した裏向きの札"><div className="tarot-fan">
              {tarotDeck.slice(0, 15).map((card, index) => {
                const selectedIndex = tarot.findIndex((item) => item.id === card.id);
                return <button key={card.id} type="button" className={selectedIndex >= 0 ? 'is-taken' : ''} disabled={selectedIndex >= 0} onClick={() => selectTarot(card.id)} aria-label={selectedIndex >= 0 ? `${TAROT_ROLES[selectedIndex]}として選択済み` : `扇に広げた${index + 1}枚目の裏向きカード`} style={{ '--fan-index': index, '--fan-angle': `${(index - 7) * 6.1}deg`, '--fan-x': `${(index - 7) * 29}px`, '--fan-y': `${Math.abs(index - 7) * 4.2}px` } as React.CSSProperties}><i className="tarot-card-back"><i>✦</i><b>SG</b></i></button>;
              })}
            </div></div>
            <p className="tarot-selection-guide"><b>{tarot.length === 0 ? '直感で、一枚目を' : tarot.length < 3 ? `あと${3 - tarot.length}枚` : '三枚の縁が結ばれた'}</b><small>七十八枚を混ぜ、場に開いた札の一部です。内容はまだ見えません。</small></p>
          </div>}

          {tarot.length > 0 && <div className={`tarot-ritual-spread count-${tarot.length} ${tarotPhase === 'selection' ? 'is-dock' : 'is-center'}`}>
            {tarot.map((card, index) => {
              const role = TAROT_ROLES[index];
              const revealed = tarotPhase === 'complete' || tarotPhase === 'revealing' && index < tarotRevealedCount;
              return <div key={role} className={`tarot-position has-card${revealed ? ' is-revealed' : ''}${card.orientation === 'reversed' ? ' is-reversed' : ''}`} style={{ '--reveal-order': index } as React.CSSProperties}>
                <small>{role}</small>
                <div className="tarot-flip-card">
                  <div className="tarot-card-back"><i>✦</i><b>SG</b></div>
                  <div className="tarot-card-front"><i className="tarot-front-mark">{card.id.startsWith('major-') ? '✦' : '◇'}</i><b>{card.name}</b><em>{card.orientation === 'upright' ? '正位置' : '逆位置'}</em></div>
                </div>
              </div>;
            })}
          </div>}

          {tarotPhase === 'locked' && <div className="germain-ritual-voice"><span>サンジェルマン伯爵</span><blockquote>「決まったわね。それじゃあ、順番に見ていきましょうか。」</blockquote></div>}
          {tarotPhase === 'revealing' && <div className="germain-ritual-voice is-serious"><span>サンジェルマン伯爵</span><blockquote>「{saintGermainRevealLine(tarot[tarotRevealedCount - 1], tarotRevealedCount - 1)}」</blockquote></div>}
          {tarotPhase === 'complete' && results && 'characterReading' in results.saintGermain && <div className="germain-ritual-voice is-final"><span>サンジェルマン伯爵</span><blockquote>「{results.saintGermain.characterReading}」</blockquote></div>}
        </div>
        {tarotPhase === 'complete' && <button className="six-primary tarot-complete-button" type="button" onClick={() => { setConvergenceIndex(0); setStage('converge'); }}>三枚を納め、六つのしるしを重ねる</button>}
      </section>}

      {stage === 'converge' && <section className="six-converge" aria-live="polite">
        <div className={`converge-orbit${convergenceIndex >= CONVERGENCE_SEQUENCE.length ? ' is-complete' : ''}`}>
          <svg className="converge-hexagram" viewBox="0 0 380 360" aria-hidden="true">
            {[[190,48,304,246],[304,246,76,246],[76,246,190,48],[304,114,190,312],[190,312,76,114],[76,114,304,114]].map(([x1,y1,x2,y2], index) => {
              const drawStep = index < 3 ? index + 2 : index + 3;
              return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} className={convergenceIndex >= drawStep ? 'is-drawn' : ''} />;
            })}
            <circle cx="190" cy="180" r="31" className="converge-core-ring" />
          </svg>
          {CONVERGENCE.map(([name, symbol], index) => {
            const revealStep = CONVERGENCE_MARK_REVEAL_STEP[index];
            const arrivesAfterLine = [2, 3, 6, 7].includes(revealStep);
            return <div key={name} className={convergenceIndex >= revealStep ? 'is-visible' : ''} style={{ '--i': index, '--mark-delay': arrivesAfterLine ? '260ms' : '0ms' } as React.CSSProperties}><span>{['盤', '卦', '縁', '札', '星', '数'][index]}</span><small>{name}<br />{symbol}</small></div>;
          })}
        </div>
        <p>{convergenceIndex === 0 ? '六つの兆しが、静かに待っている……' : convergenceIndex < CONVERGENCE_SEQUENCE.length ? CONVERGENCE_SEQUENCE[convergenceIndex - 1] : '六つのしるしが、ひとつになった。'}</p>
      </section>}

      {stage === 'send' && <section className="six-send">
        <div className="six-link-preview"><b>📡 POTENO-LINK v1</b><span>TYPE: SIX_DIVINATION_REQUEST</span><small>六つの結果と記録をまとめて、ChatGPTへ送信できます。</small></div>
        <div className="six-link-actions"><button type="button" onClick={() => void copyLink()}><Clipboard size={16} />全文をコピー</button><button type="button" onClick={() => window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer')}><ExternalLink size={16} />ChatGPTを開く</button></div>
        {copyState === 'copied' && <p className="six-success">通信文をコピーしました。</p>}{copyState === 'failed' && <p className="six-error">コピーできませんでした。</p>}
        {results && <DivinationResultsAccordion
          results={results}
          divinerArt={{
            seimei: DIVINER_ART.seimei.accent,
            taikobo: DIVINER_ART.taikobo.accent,
            tamamo: DIVINER_ART.tamamo.accent,
            'saint-germain': DIVINER_ART['saint-germain'].accent,
            asteria: DIVINER_ART.asteria.accent,
            davinci: DIVINER_ART.davinci.accent,
          }}
          davinciDetail={automatic?.davinci.calculationVersion === 'davinci-structure-v1' && <section className={`davinci-reading relation-${automatic.davinci.relation.id}`} aria-label="ダ・ヴィンチの数の設計図">
          <header><img src={DIVINER_ART.davinci.accent} alt="" /><div><small>レオナルド・ダ・ヴィンチ・数の設計図</small><h3>あなたの設計図</h3></div></header>
          <div className="davinci-main">
            <div className="davinci-number-card"><small>CORE</small><b>{automatic.davinci.core.isMaster ? `${automatic.davinci.core.number} / ${automatic.davinci.core.baseNumber}` : automatic.davinci.core.number}</b><strong>{automatic.davinci.core.geometryLabel}</strong><em>「{automatic.davinci.core.keyword}」</em>{automatic.davinci.core.isMaster && <i>複層構造・基礎数 {automatic.davinci.core.baseNumber}</i>}</div>
            <div className="davinci-blueprint" aria-hidden="true"><svg viewBox="0 0 200 200"><circle className="davinci-guide" cx="100" cy="100" r="84" /><DaVinciShape shape={automatic.davinci.style.geometry} className="davinci-shape is-style" /><DaVinciShape shape={automatic.davinci.core.geometry} className="davinci-shape is-core" /><circle className="davinci-center" cx="100" cy="100" r="3" /></svg><span>{automatic.davinci.relation.label}</span></div>
            <div className="davinci-number-card"><small>STYLE</small><b>{automatic.davinci.style.number}</b><strong>{automatic.davinci.style.geometryLabel}</strong><em>「{automatic.davinci.style.keyword}」</em><i>{automatic.davinci.style.layer === 'generation' ? '発生層' : automatic.davinci.style.layer === 'formation' ? '形成層' : '統合層'}</i></div>
          </div>
          <div className="davinci-relation"><small>RELATION</small><b>{automatic.davinci.relation.label}</b><span>「{automatic.davinci.relation.theme}」</span></div>
          <blockquote>「{automatic.davinci.characterReading}」</blockquote>
          <details><summary>設計図の計算</summary><p>CORE：{automatic.davinci.core.reductionPath.join(' → ')} ／ STYLE：{automatic.davinci.style.rawValue} → {automatic.davinci.style.reductionPath.slice(1).join(' → ') || automatic.davinci.style.number}</p><p>CORE：{automatic.davinci.core.layer === 'generation' ? '発生層' : automatic.davinci.core.layer === 'formation' ? '形成層' : '統合層'} ／ STYLE：{automatic.davinci.style.layer === 'generation' ? '発生層' : automatic.davinci.style.layer === 'formation' ? '形成層' : '統合層'}</p><p>{automatic.davinci.methodNote}</p></details>
          </section>}
          asteriaDetail={automatic?.asteria.calculationVersion === 'asteria-lunar-solar-v1' && <section className="asteria-reading" aria-label="アステリアの月と太陽の巡り">
          <header><img src={DIVINER_ART.asteria.accent} alt="" /><div><small>アステリア・月と太陽の巡り</small><h3>今日と一年、星の時計</h3></div></header>
          <section className="asteria-birth-sign"><small>あなたの星座</small><b>{ZODIAC_GLYPHS[automatic.asteria.birthSun.sign]} {automatic.asteria.birthSun.label}</b><em>出生太陽を、あなた自身の基準点として見ています。</em></section>
          <section className="asteria-today"><h4>今日の星運</h4><div className="asteria-pillars"><p><small>月</small><b>🌙 {automatic.asteria.moonSign.label}</b><em>{automatic.asteria.moonSign.theme}</em></p><p><small>月相</small><b>{automatic.asteria.moonPhase.label}</b><em>{automatic.asteria.moonPhase.theme}</em></p><p><small>星の響き</small><b>{automatic.asteria.personalAspect.id !== 'none' ? '✦ ' : ''}{automatic.asteria.personalAspect.label}</b><em>{automatic.asteria.personalAspect.theme}</em></p></div><p className="asteria-today-theme"><small>今日のテーマ</small><b>「{automatic.asteria.moonPhase.theme}」</b></p></section>
          <section className="asteria-week"><h4>7日間の星巡り</h4><div>{asteriaWeek.map((day) => <p key={day.targetDate}><time>{monthDayLabel(day.targetDate)}</time><b>{day.moonSign.label}</b><span>{day.moonPhase.label}</span><em>{day.moonPhase.theme}</em>{day.personalAspect.id !== 'none' && <i title={`出生太陽との星の響き：${day.personalAspect.label}`}>✦</i>}</p>)}</div></section>
          <section className="asteria-year"><small>☀ 一年の大きな巡り</small><b>{automatic.asteria.solarCycle.label}</b><em>{automatic.asteria.solarCycle.theme}</em><p>{automatic.asteria.fixedReading.split('。').filter(Boolean).at(-1)}。</p></section>
          <details><summary>計算の詳細</summary><p>現在月黄経：{automatic.asteria.moonSign.longitude}°／現在太陽黄経：{Math.round(((automatic.asteria.moonSign.longitude - automatic.asteria.moonPhase.angle + 360) % 360) * 100) / 100}°／出生太陽黄経：{automatic.asteria.birthSun.longitude}°／月と出生太陽の角度差：{automatic.asteria.personalAspect.exactDifference}°</p>{automatic.asteria.birthSun.nearSignBoundary && <p className="asteria-boundary-note">出生太陽が星座境界付近です。出生時刻を使用しない日付基準計算のため、実際の出生時刻によって隣接星座になる可能性があります。</p>}<p>{automatic.asteria.methodNote}</p></details>
          </section>}
        />}
        <div className="six-guide"><b>使い方</b><ol><li>全文をコピー。</li><li>ChatGPTで貼り付けて送信。</li><li>返ってきたPOTENO-RETURNを、この下の受信画面へ貼り付け。</li></ol></div>
        <button className="six-next" type="button" onClick={() => setStage('receive')}>術師の返事を受け取る</button>
      </section>}

      {stage === 'receive' && <section className="six-receive"><label><span>ChatGPTから返ってきた通信文</span><textarea value={returnText} onChange={(event) => { setReturnText(event.target.value); setError(''); }} placeholder={'📡 POTENO-RETURN v1\nTYPE: SIX_DIVINATION_RESPONSE\nDATA[ ... ]'} /></label>{error && <p className="six-error">{error}</p>}<button className="six-primary" type="button" disabled={!returnText.trim()} onClick={receive}><Radio size={16} />受信する</button><button className="six-subtle" type="button" onClick={() => setStage('send')}>通信画面へ戻る</button></section>}

      {stage === 'result' && response && <section className="six-reading">
        <header><img className="six-reading-portrait" src={DIVINER_ART[response.master].accent} alt="" /><Check size={21} /><div><small>今回の術師</small><h3>{DIVINATION_MASTER_PROFILES[response.master].name}</h3></div></header>
        <article><small>術師の統合解釈</small><p>{response.integratedReading}</p></article>
        <article className="is-poteno"><small>ポテノの要約</small><p>{response.potenoSummary}</p></article>
        <article className="is-focus"><small>今回意識すること</small><ul>{response.focus.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul></article>
        <p className="six-success">日誌に自動保存しました。</p>
        <button className="six-subtle" type="button" onClick={reset}><RotateCcw size={15} />もう一度占う</button>
      </section>}

      <style>{`
        .poteno-actions:has(.poteno-six) { width: min(720px, 62vw); max-height: min(650px, calc(100dvh - 116px)); bottom: clamp(88px, 13vh, 150px); }
        .poteno-six { display: grid; gap: 12px; color: #463a43; font-size: .78rem; }
        .six-progress { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; }
        .six-progress span { display: grid; min-height: 25px; place-items: center; border-radius: 999px; color: #9a8793; background: #eee5e7; font-size: .63rem; font-weight: 900; }
        .six-progress span.is-active { color: #fff; background: linear-gradient(135deg,#705481,#b56d72); box-shadow: inset 0 -2px rgba(49,28,54,.18); }
        .six-setup, .six-scene, .six-send, .six-receive, .six-reading { display: grid; gap: 11px; }
        .six-intro { display: flex; align-items: center; gap: 10px; padding: 11px; border: 1px solid #b998b5; border-radius: 13px; color: #674c68; background: linear-gradient(135deg,#fff3e0,#f4eafd); }
        .six-intro strong, .six-intro p { display: block; margin: 0; }
        .six-intro p { margin-top: 3px; color: #8b7185; font-size: .7rem; font-weight: 700; }
        .six-setup label, .six-receive label { display: grid; gap: 5px; font-weight: 900; }
        .six-setup label span, .six-receive label span { display: flex; justify-content: space-between; }
        .six-setup label small { color: #98828c; font-size: .62rem; }
        .six-setup input, .six-setup textarea, .six-receive textarea { width: 100%; border: 2px solid #bba2b3; border-radius: 10px; padding: 9px 10px; color: #4b3a45; background: rgba(255,255,255,.9); font: .75rem/1.5 'Yu Gothic', sans-serif; }
        .six-setup textarea { min-height: 60px; resize: vertical; }
        .six-receive textarea { min-height: 190px; resize: vertical; font-family: ui-monospace, monospace; }
        .six-master-picker { display: grid; grid-template-columns: repeat(3,1fr); gap: 7px; margin: 0; padding: 9px; border: 1px solid #c9b3bd; border-radius: 12px; }
        .six-master-picker legend { padding: 0 6px; color: #72566c; font-weight: 900; }
        .six-master-picker button { display: grid; gap: 2px; min-height: 49px; padding: 7px; border: 1px solid #bda8b3; border-radius: 10px; color: #5d4856; background: #fffaf6; box-shadow: 0 2px #dacbd0; }
        .six-master-picker button.is-selected { color: #fff; border-color: #71527a; background: linear-gradient(135deg,#745784,#a86472); box-shadow: 0 2px #513d5a; }
        .six-master-picker small { font-size: .58rem; }
        .six-primary, .six-next, .six-subtle { display: inline-flex; min-height: 40px; align-items: center; justify-content: center; gap: 6px; border-radius: 11px; padding: 8px 14px; font-weight: 900; }
        .six-primary { border: 2px solid #654771; color: #fff; background: linear-gradient(135deg,#795789,#b06776); box-shadow: 0 3px #50395a; }
        .six-primary:disabled { opacity: .45; }
        .six-next { justify-self: end; border: 1px solid #8a627c; color: #65475c; background: #fff1e2; box-shadow: 0 2px #d8bca9; }
        .six-subtle { justify-self: start; border: 1px solid #a48d99; color: #6c5662; background: rgba(255,255,255,.72); }
        .six-scene > header, .six-reading > header { display: flex; align-items: center; gap: 10px; }
        .six-scene > header > span { display: grid; width: 36px; height: 36px; place-items: center; border-radius: 50%; color: #fff; background: #6f526f; font: 900 1rem 'Yu Mincho',serif; }
        .six-scene header small, .six-scene header h3, .six-reading header small, .six-reading header h3 { display: block; margin: 0; }
        .six-scene header small, .six-reading header small { color: #9a7182; font-size: .62rem; font-weight: 900; letter-spacing: .12em; }
        .six-scene header h3, .six-reading header h3 { font: 900 1.05rem/1.35 'Yu Mincho',serif; }
        .iching-tube { position: relative; display: grid; width: 105px; height: 105px; margin: 4px auto; place-items: center; border: 4px solid #72532e; border-radius: 14px 14px 34px 34px; color: #8f5c2d; background: repeating-linear-gradient(90deg,#d9a04e 0 8px,#c48839 8px 12px); font-size: 3rem; box-shadow: 0 7px #5f452f; }
        .iching-tube i { position: absolute; top: -22px; color: #a26d34; font-size: 2rem; font-style: normal; }
        .iching-tube.is-cast { animation: six-cast .65s ease; }
        .six-result-card { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }
        .six-result-card p { display: grid; gap: 4px; margin: 0; padding: 10px; border: 1px solid #c4a878; border-radius: 11px; background: #fff5d8; text-align: center; }
        .six-result-card small { color: #a47643; font-weight: 900; }
        .six-result-card b { font-size: .7rem; line-height: 1.4; }
        .six-hint { margin: -4px 0 0; color: #8d7782; font-weight: 750; }
        .silhouette-street { position: relative; display: flex; min-height: 150px; align-items: end; justify-content: space-around; overflow: hidden; border-radius: 14px; padding: 16px 18px 11px; background: linear-gradient(#5d4968 0 38%,#c97c73 39% 65%,#4a3d4d 66%); box-shadow: inset 0 -18px rgba(24,23,29,.35); }
        .silhouette-street::before { content:'●'; position:absolute; top:17px; right:36px; color:#ffd6a0; font-size:2.2rem; opacity:.8; }
        .silhouette-street button { position: relative; width: 46px; height: 92px; border: 0; background: transparent; }
        .silhouette-street button i { position: absolute; inset: 12px 8px 0; border-radius: 44% 44% 25% 25%; background: #201f28; clip-path: polygon(35% 0,65% 0,75% 16%,89% 100%,11% 100%,25% 16%); transition: transform .18s,filter .18s; }
        .silhouette-street button:nth-child(2n) i { transform: scale(.88,1.08); }
        .silhouette-street button:hover i, .silhouette-street button.is-selected i { filter: drop-shadow(0 0 7px #ffe6ad); transform: translateY(-4px) scale(1.05); }
        .silhouette-street button span { position: absolute; right: 0; bottom: 0; display: grid; width: 18px; height: 18px; place-items:center; border-radius:50%; color:#fff; background:#8f5768; font-size:.6rem; }
        .six-crossroads blockquote { margin: 0; padding: 11px 13px; border-left: 4px solid #a65f7a; border-radius: 6px 12px 12px 6px; background: #fff1ea; font: 800 .84rem/1.65 'Yu Mincho',serif; }
        .tarot-deck { display: flex; gap: 9px; overflow-x: auto; padding: 5px 4px 12px; scroll-snap-type: x proximity; }
        .tarot-deck button { display: grid; flex: 0 0 74px; height: 116px; place-items: center; border: 3px double #d3ad64; border-radius: 8px; color: #f5dc9e; background: repeating-linear-gradient(45deg,#43334e 0 6px,#55405f 6px 12px); box-shadow: 0 4px #2d2534; scroll-snap-align: center; }
        .tarot-deck button span { font-size: 1.5rem; }.tarot-deck button small { font-size:.57rem; }
        .tarot-deck button.is-revealed { padding: 6px; color:#60475c; background:linear-gradient(#fff8de,#efd8aa); transform:translateY(-4px); }
        .tarot-deck button.is-revealed b { font-size:.68rem; line-height:1.25; }.tarot-deck button.is-revealed em { color:#a15d62;font-size:.56rem;font-style:normal;font-weight:900; }
        .six-converge { display:grid; min-height:310px; place-items:center; align-content:center; gap:13px; }
        .converge-orbit { position:relative; width:270px; height:230px; }
        .converge-orbit > div { --angle: calc(var(--i) * 60deg); position:absolute; top:85px; left:110px; display:grid; width:54px; opacity:0; place-items:center; color:#6a5068; transform:rotate(var(--angle)) translateY(-85px) rotate(calc(var(--angle) * -1)) scale(.3); transition:.3s cubic-bezier(.2,.9,.25,1); }
        .converge-orbit > div.is-visible { opacity:1; transform:rotate(var(--angle)) translateY(-85px) rotate(calc(var(--angle) * -1)) scale(1); }
        .converge-orbit > div span { display:grid;width:46px;height:46px;place-items:center;border:2px solid #8f6a8b;border-radius:50%;color:#fff;background:linear-gradient(135deg,#76598a,#d08379);font:900 1.1rem 'Yu Mincho',serif;box-shadow:0 0 18px rgba(137,91,133,.35); }
        .converge-orbit > div small { margin-top:4px;font-size:.55rem;font-weight:900;text-align:center;white-space:nowrap; }
        .converge-orbit::after { content:'六占'; position:absolute; top:86px; left:107px; display:grid;width:60px;height:60px;place-items:center;border-radius:50%;color:#fff;background:#4c3d55;opacity:0;transform:scale(.2);transition:.55s; }
        .converge-orbit.is-complete > div { transform:translate(0,0) scale(.3); top:90px; left:110px; opacity:.25; }.converge-orbit.is-complete::after{opacity:1;transform:scale(1);box-shadow:0 0 34px #edc98d;}
        .six-converge p { margin:0;color:#745a70;font:900 .9rem 'Yu Mincho',serif; }
        .six-link-preview { display:grid;gap:5px;padding:14px;border:2px solid #77608c;border-radius:12px;color:#604d70;background:#f3edfa;font-family:ui-monospace,monospace; }
        .davinci-reading{display:grid;gap:9px;padding:14px;border:1px solid #7896a4;border-radius:2px;color:#e5eff0;background:linear-gradient(135deg,rgba(20,45,56,.95),rgba(31,61,68,.94));box-shadow:inset 0 0 0 3px rgba(177,216,219,.05)}.davinci-reading header{display:flex;align-items:center;gap:9px}.davinci-reading header img{width:43px;height:52px;object-fit:cover;object-position:center 30%;border:1px solid #b9d2c5;border-radius:50%;background:#203d45}.davinci-reading header small{color:#b7d3c0;letter-spacing:.1em}.davinci-reading header h3{margin:2px 0 0;color:#f4f1dd;font:500 1rem/1.35 'Yu Mincho',serif}.davinci-main{display:grid;grid-template-columns:1fr 118px 1fr;align-items:center;gap:5px}.davinci-number-card{display:grid;min-height:112px;place-items:center;align-content:center;gap:2px;padding:7px;border:1px solid rgba(183,213,211,.24);text-align:center;background:rgba(255,255,255,.035)}.davinci-number-card small,.davinci-relation small{color:#9dc2c0;font-size:.57rem;letter-spacing:.12em}.davinci-number-card b{color:#f0d898;font:600 1.25rem 'Yu Mincho',serif}.davinci-number-card strong{color:#f7f0d7;font-size:.72rem}.davinci-number-card em{color:#c7d6d5;font-size:.58rem;font-style:normal}.davinci-number-card i{margin-top:2px;color:#a7c6bf;font-size:.52rem;font-style:normal}.davinci-blueprint{position:relative;display:grid;place-items:center;width:112px;height:112px}.davinci-blueprint svg{width:112px;height:112px;overflow:visible}.davinci-guide{fill:none;stroke:rgba(163,210,207,.16);stroke-dasharray:2 5}.davinci-shape{fill:none;stroke-linejoin:round;stroke-linecap:round}.davinci-shape.is-style{stroke:#8fced0;stroke-width:2;opacity:.72}.davinci-shape.is-core{stroke:#f2d58b;stroke-width:3;filter:drop-shadow(0 0 3px rgba(242,213,139,.35))}.davinci-center{fill:#f2d58b}.davinci-blueprint>span{position:absolute;bottom:-2px;padding:2px 6px;color:#d7eadf;background:#1b3b43;font:600 .52rem 'Yu Mincho',serif}.relation-overlap .davinci-shape{transform-origin:center;animation:davinci-overlap 1.8s ease-in-out infinite}.relation-mirror .is-style{transform:scaleX(-1)}.relation-development .is-style{animation:davinci-expand 1.8s ease-in-out infinite}.relation-leap .is-style{animation:davinci-leap 1.8s ease-in-out infinite}.relation-reduction .is-core{animation:davinci-reduce 1.8s ease-in-out infinite}.relation-compression .is-style{animation:davinci-compress 1.8s ease-in-out infinite}.davinci-relation{display:flex;align-items:baseline;justify-content:center;gap:6px;padding:6px;border-block:1px solid rgba(170,210,206,.18)}.davinci-relation b{color:#f1d797;font:600 .9rem 'Yu Mincho',serif}.davinci-relation span{color:#c9dbd7;font-size:.62rem}.davinci-reading blockquote{margin:0;padding:9px 11px;border-left:2px solid #e3c77d;color:#f4f2e8;background:rgba(5,24,29,.28);font:500 .78rem/1.7 'Yu Mincho',serif}.davinci-reading details{color:#c2d4d2;font-size:.62rem}.davinci-reading summary{cursor:pointer;color:#d8c17d}.davinci-reading details p{margin:5px 0;line-height:1.55}@keyframes davinci-overlap{50%{transform:scale(.87)}}@keyframes davinci-expand{50%{transform:scale(1.1)}}@keyframes davinci-leap{50%{transform:scale(1.16);opacity:.35}}@keyframes davinci-reduce{50%{transform:scale(.78)}}@keyframes davinci-compress{50%{transform:scale(.74);opacity:.4}}
        .asteria-reading{display:grid;gap:9px;padding:14px;border:1px solid rgba(133,112,168,.52);border-radius:2px;color:#ded8ed;background:radial-gradient(circle at 80% 12%,rgba(208,191,255,.15),transparent 31%),linear-gradient(135deg,rgba(36,34,62,.9),rgba(56,45,78,.9));box-shadow:inset 0 0 0 3px rgba(206,185,137,.06)}.asteria-reading header{display:flex;align-items:center;gap:9px}.asteria-reading header img{width:43px;height:52px;object-fit:cover;object-position:center 30%;border:1px solid #c7aa6e;border-radius:50%;background:#312740}.asteria-reading header small,.asteria-reading small{color:#d6bd83;letter-spacing:.1em}.asteria-reading header h3{margin:2px 0 0;color:#fbf4df;font:500 1rem/1.35 'Yu Mincho',serif}.asteria-birth-sign{display:grid;grid-template-columns:auto 1fr;align-items:baseline;gap:3px 10px;padding:9px 11px;border:1px solid rgba(225,204,152,.31);background:rgba(255,255,255,.045)}.asteria-birth-sign small{grid-column:1/-1;font-size:.56rem}.asteria-birth-sign b{color:#f4dc9e;font:600 1.1rem 'Yu Mincho',serif}.asteria-birth-sign em{color:#d9d2e1;font-size:.61rem;font-style:normal}.asteria-today,.asteria-week,.asteria-year{padding:9px 10px;border-top:1px solid rgba(222,207,239,.18)}.asteria-reading h4{margin:0 0 7px;color:#f5eddb;font:600 .8rem 'Yu Mincho',serif}.asteria-pillars{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.asteria-pillars p{display:grid;gap:2px;min-height:62px;margin:0;padding:7px;border:1px solid rgba(207,188,239,.22);background:rgba(255,255,255,.045)}.asteria-pillars small{font-size:.54rem}.asteria-pillars b{color:#f0db9c;font:600 .78rem 'Yu Mincho',serif}.asteria-pillars em{color:#d5ccdd;font-size:.56rem;font-style:normal;line-height:1.35}.asteria-today-theme{display:flex;align-items:baseline;gap:8px;margin:8px 0 0}.asteria-today-theme b{color:#fff0bc;font:.76rem 'Yu Mincho',serif}.asteria-week>div{display:grid;gap:2px}.asteria-week p{display:grid;grid-template-columns:38px 58px 1fr auto;align-items:baseline;gap:5px;margin:0;padding:3px 0;border-bottom:1px dashed rgba(220,207,239,.12);font-size:.62rem}.asteria-week p:last-child{border-bottom:0}.asteria-week time{color:#c7b5db}.asteria-week b{color:#f1dc9a;font-weight:700}.asteria-week span{color:#ddd4e5}.asteria-week em{color:#bfcbd7;font-style:normal}.asteria-week i{color:#f0d27c;font-style:normal}.asteria-year{display:grid;grid-template-columns:auto 1fr;align-items:baseline;gap:3px 8px;border:1px solid rgba(205,177,112,.28);background:rgba(209,181,111,.07)}.asteria-year small{grid-column:1/-1;font-size:.56rem}.asteria-year b{color:#f2d68f;font:600 .92rem 'Yu Mincho',serif}.asteria-year em{color:#ded5e1;font-size:.61rem;font-style:normal}.asteria-year p{grid-column:1/-1;margin:3px 0 0;color:#eee8ef;font:.64rem/1.55 'Yu Mincho',serif}.asteria-reading details{color:#c7bed3;font-size:.62rem}.asteria-reading summary{cursor:pointer;color:#e1c77f}.asteria-reading details p{margin:5px 0;line-height:1.55}.asteria-boundary-note{padding:6px 8px;border-left:2px solid #d5b36f;color:#eee0b8;background:rgba(212,179,111,.08)}
        .six-link-preview small { color:#887896; font-family:'Yu Gothic',sans-serif; }
        .six-link-actions { display:grid;grid-template-columns:1fr 1fr;gap:8px; }.six-link-actions button{display:inline-flex;min-height:40px;align-items:center;justify-content:center;gap:5px;border:1px solid #816578;border-radius:10px;color:#654e5e;background:#fff5e9;font-weight:900;}
        .six-results-accordion{overflow:hidden;border:1px solid #b79c82;border-radius:11px;background:rgba(255,250,239,.68)}.six-results-toggle{display:flex;width:100%;min-height:43px;align-items:center;gap:8px;padding:9px 12px;border:0;color:#624636;background:linear-gradient(90deg,rgba(204,174,126,.24),rgba(255,255,255,.23));font:800 .78rem 'Yu Mincho',serif;text-align:left}.six-results-toggle:hover{background:linear-gradient(90deg,rgba(204,174,126,.38),rgba(255,255,255,.42))}.six-results-toggle:focus-visible,.divination-summary-button:focus-visible{outline:3px solid rgba(173,105,72,.45);outline-offset:-3px}.divination-summary-list{display:grid;border-top:1px solid rgba(142,104,75,.28)}.divination-summary-row{border-bottom:1px solid rgba(142,104,75,.22)}.divination-summary-row:last-child{border-bottom:0}.divination-summary-button{display:grid;grid-template-columns:30px minmax(0,1fr) auto;width:100%;align-items:center;gap:8px;padding:9px 11px;border:0;color:#513e36;background:transparent;text-align:left}.divination-summary-button:hover,.divination-summary-row.is-open .divination-summary-button{background:rgba(214,188,142,.13)}.divination-summary-seal{display:grid;width:26px;height:26px;place-items:center;border:1px solid #9d7255;border-radius:50%;color:#815342;background:#fff8e9;font:800 .7rem 'Yu Mincho',serif}.divination-summary-heading{display:grid;min-width:0;gap:2px}.divination-summary-heading b{font:800 .74rem 'Yu Mincho',serif}.divination-summary-heading small{overflow:hidden;color:#866b59;font-size:.62rem;line-height:1.4;text-overflow:ellipsis;white-space:nowrap}.divination-summary-toggle{color:#9a6951;font-size:.59rem;font-weight:800;white-space:nowrap}.divination-summary-detail{display:grid;gap:9px;padding:10px 11px 12px;border-top:1px dashed rgba(142,104,75,.32);background:rgba(255,255,255,.3)}.diviner-result-detail{display:grid;gap:9px;padding:11px;border:1px solid rgba(150,106,76,.48);border-radius:5px;color:#523d32;background:linear-gradient(135deg,rgba(95,63,44,.08),rgba(255,253,245,.74))}.diviner-result-detail header{display:flex;align-items:center;gap:9px;padding-bottom:8px;border-bottom:1px solid rgba(143,98,67,.28)}.diviner-result-detail header img{width:48px;height:58px;object-fit:cover;object-position:center 30%;border:1px solid #ad7e58;border-radius:50%;background:#f0ddbd}.diviner-result-detail header small{display:block;color:#9a684b;font-size:.57rem;font-weight:800;letter-spacing:.08em}.diviner-result-detail header h3{margin:1px 0;color:#4b3529;font:700 .91rem 'Yu Mincho',serif}.diviner-result-detail header p{margin:2px 0 0;color:#896754;font-size:.62rem;font-weight:700}.divination-detail-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:0}.divination-detail-list>div{display:grid;gap:2px;padding:6px 7px;border-left:2px solid rgba(161,110,76,.52);background:rgba(255,252,245,.45)}.divination-detail-list dt{color:#98745d;font-size:.56rem;font-weight:800}.divination-detail-list dd{margin:0;color:#4a3931;font-size:.68rem;font-weight:800;overflow-wrap:anywhere}.divination-detail-copy{display:grid;gap:8px}.divination-detail-copy>p,.divination-detail-fallback{margin:0;padding:8px 10px;border-left:2px solid #bb815a;color:#644735;background:rgba(239,216,171,.18);font:.7rem/1.6 'Yu Mincho',serif}
        .diviner-result-detail{position:relative;overflow:hidden;isolation:isolate}.diviner-result-detail>*{position:relative;z-index:1}.diviner-result-detail::before,.diviner-result-detail::after{position:absolute;z-index:0;pointer-events:none;content:''}.diviner-result-detail::before{right:-20px;bottom:-44px;width:152px;height:152px;border:1px solid currentColor;border-radius:50%;opacity:.18}.diviner-result-detail::after{right:16px;top:10px;width:44px;height:44px;border:1px solid currentColor;opacity:.12;transform:rotate(45deg)}.diviner-result-detail.is-seimei{border-color:#7f9ebd;color:#d8e8ed;background:radial-gradient(circle at 82% 16%,rgba(206,227,221,.15),transparent 27%),radial-gradient(circle at 88% 80%,rgba(176,202,224,.17),transparent 34%),linear-gradient(135deg,#192a3a,#273f53)}.diviner-result-detail.is-seimei::before{width:126px;height:126px;border-width:11px;border-color:#d9c27d;border-left-color:transparent;border-radius:50%;opacity:.23}.diviner-result-detail.is-seimei::after{border-color:#e4cb82;box-shadow:0 0 0 9px transparent,0 0 0 10px rgba(228,203,130,.35);transform:rotate(45deg)}.diviner-result-detail.is-seimei header{border-color:rgba(205,225,226,.25)}.diviner-result-detail.is-seimei header img{border-color:#d9c27d;background:#243d51}.diviner-result-detail.is-seimei header small,.diviner-result-detail.is-seimei .divination-detail-list dt{color:#bad8d6}.diviner-result-detail.is-seimei header h3,.diviner-result-detail.is-seimei .divination-detail-list dd{color:#fff3c7}.diviner-result-detail.is-seimei header p{color:#c4d9e4}.diviner-result-detail.is-seimei .divination-detail-list>div{border-color:#d2b66d;background:rgba(255,255,255,.055)}.diviner-result-detail.is-seimei .divination-detail-copy>p{border-color:#d6bb72;color:#edf4e8;background:rgba(6,20,31,.32)}.diviner-result-detail.is-taikobo{border-color:#a77b42;color:#f0dfbb;background:radial-gradient(ellipse at 82% 22%,rgba(232,181,92,.14),transparent 28%),linear-gradient(135deg,#251b18,#4a301c 58%,#2e2118)}.diviner-result-detail.is-taikobo::before{width:142px;height:142px;border:9px double #c7944d;border-radius:0;opacity:.16;transform:rotate(45deg)}.diviner-result-detail.is-taikobo::after{width:72px;height:72px;border:2px solid #d2a45f;opacity:.17;box-shadow:0 0 0 7px rgba(210,164,95,.22),0 0 0 14px rgba(210,164,95,.12);transform:rotate(0)}.diviner-result-detail.is-taikobo header{border-color:rgba(239,213,159,.24)}.diviner-result-detail.is-taikobo header img{border-color:#d6a25d;background:#372515}.diviner-result-detail.is-taikobo header small,.diviner-result-detail.is-taikobo .divination-detail-list dt{color:#d9ad68}.diviner-result-detail.is-taikobo header h3,.diviner-result-detail.is-taikobo .divination-detail-list dd{color:#fff0c9}.diviner-result-detail.is-taikobo header p{color:#e2c89d}.diviner-result-detail.is-taikobo .divination-detail-list>div{border-color:#c78343;background:rgba(255,225,162,.055)}.diviner-result-detail.is-tamamo{border-color:#bd7695;color:#f3d7de;background:radial-gradient(circle at 82% 14%,rgba(255,172,99,.2),transparent 22%),radial-gradient(circle at 82% 78%,rgba(166,221,176,.14),transparent 27%),linear-gradient(135deg,#3a233b,#633548 55%,#2e263e)}.diviner-result-detail.is-tamamo::before{width:136px;height:136px;border:2px solid #f0b074;border-left-color:transparent;border-bottom-color:transparent;opacity:.26}.diviner-result-detail.is-tamamo::after{width:55px;height:55px;border-color:#d9f0bb;border-radius:50%;box-shadow:0 0 15px rgba(206,244,169,.35);transform:rotate(0)}.diviner-result-detail.is-tamamo header{border-color:rgba(249,202,212,.25)}.diviner-result-detail.is-tamamo header img{border-color:#f0b276;background:#593147}.diviner-result-detail.is-tamamo header small,.diviner-result-detail.is-tamamo .divination-detail-list dt{color:#efb5bd}.diviner-result-detail.is-tamamo header h3,.diviner-result-detail.is-tamamo .divination-detail-list dd{color:#fff0d1}.diviner-result-detail.is-tamamo header p{color:#f4d0d6}.diviner-result-detail.is-tamamo .divination-detail-list>div{border-color:#e3948b;background:rgba(255,227,212,.055)}.diviner-result-detail.is-tamamo .divination-detail-copy>p{border-color:#f1b076;color:#fff0dc;background:rgba(39,20,43,.32)}.diviner-result-detail.is-saint-germain{border-color:#a986b4;color:#e8dce9;background:radial-gradient(circle at 86% 17%,rgba(215,180,111,.18),transparent 24%),linear-gradient(135deg,#271d35,#542952 58%,#251b31)}.diviner-result-detail.is-saint-germain::before{width:133px;height:133px;border:2px double #e0ba68;border-radius:5px;opacity:.22;transform:rotate(18deg)}.diviner-result-detail.is-saint-germain::after{width:57px;height:57px;border:2px solid #e1ba70;border-radius:50%;box-shadow:0 0 0 7px rgba(225,186,112,.13);transform:rotate(0)}.diviner-result-detail.is-saint-germain header{border-color:rgba(229,210,234,.24)}.diviner-result-detail.is-saint-germain header img{border-color:#dfb46d;background:#3e2147}.diviner-result-detail.is-saint-germain header small,.diviner-result-detail.is-saint-germain .divination-detail-list dt{color:#d9bae0}.diviner-result-detail.is-saint-germain header h3,.diviner-result-detail.is-saint-germain .divination-detail-list dd{color:#ffe7b1}.diviner-result-detail.is-saint-germain header p{color:#dfcae2}.diviner-result-detail.is-saint-germain .divination-detail-list>div{border-color:#be8dad;background:rgba(249,230,255,.055)}
        .diviner-result-portrait{display:block;flex:0 0 54px;width:54px;height:62px;overflow:hidden;border:1px solid rgba(239,212,157,.88);border-radius:50%;background:#342b3b;box-shadow:0 2px 8px rgba(10,8,14,.32)}.diviner-result-detail header .diviner-result-portrait img{display:block;width:100%;height:100%;border:0;border-radius:0;object-fit:cover;object-position:center top;background:transparent;transform:scale(1.85) translateY(20%)}.diviner-result-detail.is-seimei .diviner-result-portrait{border-color:#d9c27d;background:#243d51}.diviner-result-detail.is-taikobo .diviner-result-portrait{border-color:#d6a25d;background:#372515}.diviner-result-detail.is-tamamo .diviner-result-portrait{border-color:#f0b276;background:#593147}.diviner-result-detail.is-saint-germain .diviner-result-portrait{border-color:#dfb46d;background:#3e2147}.diviner-result-detail.is-taikobo header .diviner-result-portrait img,.diviner-result-detail.is-tamamo header .diviner-result-portrait img,.diviner-result-detail.is-saint-germain header .diviner-result-portrait img{transform:scale(1.85) translateY(27%)}.davinci-reading header img,.asteria-reading header img{object-position:center top;transform:scale(1.28) translateY(12%)}
        .diviner-result-detail.is-taikobo .divination-detail-copy>p{position:relative;z-index:2;margin-top:2px;border:1px solid rgba(227,181,108,.62);border-left:3px solid #e0a652;color:#fff5dc;background:linear-gradient(135deg,rgba(23,12,7,.92),rgba(61,34,15,.88));box-shadow:0 4px 12px rgba(0,0,0,.27);font-weight:600;text-shadow:0 1px 0 rgba(0,0,0,.38)}
        .diviner-result-detail.is-saint-germain .divination-detail-copy>p{position:relative;z-index:2;margin-top:2px;border:1px solid rgba(225,186,112,.62);border-left:3px solid #dcb26a;color:#fff2d0;background:linear-gradient(135deg,rgba(22,12,32,.94),rgba(68,28,67,.9));box-shadow:0 4px 12px rgba(0,0,0,.3);font-weight:600;text-shadow:0 1px 0 rgba(0,0,0,.42)}
        .six-guide { padding:10px 12px;border:1px solid #b59cad;border-radius:11px;background:#fffaf5; }.six-guide b{color:#70556b}.six-guide ol{display:grid;gap:3px;margin:5px 0 0;padding-left:20px;line-height:1.45;}
        .six-error,.six-success{margin:0;padding:7px 9px;border-radius:8px;font-weight:850}.six-error{color:#934e55;background:#ffe1df}.six-success{color:#396d5e;background:#e3f2ea}
        .six-reading article { padding:12px 13px;border:2px solid #9b7baa;border-radius:12px;background:#f6effb; }.six-reading article.is-poteno{border-color:#d29362;background:#fff4df}.six-reading article.is-focus{border-color:#6f9f8f;background:#eaf7f1}
        .six-reading article small{display:block;margin-bottom:5px;color:#835d86;font-weight:900;letter-spacing:.08em}.six-reading article p,.six-reading article ul{margin:0;line-height:1.7;white-space:pre-wrap}.six-reading article ul{padding-left:20px}

        /* Premium divination theatre: the room recedes and the six rites become the stage. */
        .poteno-visit:has(.poteno-six)::before { content:''; position:fixed; z-index:1; inset:0; pointer-events:none; background:radial-gradient(circle at 50% 48%,rgba(50,52,91,.34),rgba(4,6,17,.89) 63%),linear-gradient(115deg,rgba(8,11,28,.96),rgba(19,13,31,.92)); backdrop-filter:blur(5px) saturate(.65); animation:six-curtain .8s ease both; }
        .poteno-visit:has(.poteno-six) .poteno-arrival { opacity:.17; filter:grayscale(.6) blur(1px); transition:opacity .6s,filter .6s; }
        .poteno-actions:has(.poteno-six) { position:fixed; z-index:4; top:50%; left:50%; right:auto; bottom:auto; width:min(980px,calc(100vw - 72px)); max-height:calc(100dvh - 64px); overflow:auto; padding:0; border:1px solid rgba(213,181,113,.65); border-radius:3px; color:#eee8d9; background:linear-gradient(145deg,rgba(13,17,35,.985),rgba(28,18,39,.98)); box-shadow:0 30px 90px rgba(0,0,0,.7),0 0 0 1px rgba(255,232,172,.09) inset,0 0 46px rgba(92,69,130,.24); transform:translate(-50%,-50%); scrollbar-color:#887047 #111522; }
        .poteno-actions:has(.poteno-six)::before,.poteno-actions:has(.poteno-six)::after { content:''; position:absolute; z-index:4; width:86px; height:86px; pointer-events:none; border-color:#b99656; opacity:.65; }
        .poteno-actions:has(.poteno-six)::before { top:10px; left:10px; border-top:1px solid;border-left:1px solid; }
        .poteno-actions:has(.poteno-six)::after { right:10px; bottom:10px; border-right:1px solid;border-bottom:1px solid; }
        .poteno-page:has(.poteno-six) { padding:0; }.poteno-page:has(.poteno-six)>header { display:none; }
        .poteno-page:has(.poteno-six)>.poteno-back { position:relative; z-index:3; margin:0 28px 22px; border:1px solid rgba(198,167,102,.45); color:#c9b889; background:rgba(255,255,255,.025); }
        .poteno-six { position:relative; isolation:isolate; display:grid; min-height:590px; gap:18px; overflow:hidden; padding:27px 34px 22px; color:#ebe5d6; font-family:'Yu Mincho','Hiragino Mincho ProN',serif; font-size:.82rem; }
        .six-cosmos { position:absolute; z-index:-2; inset:0; overflow:hidden; pointer-events:none; background:radial-gradient(circle at 18% 24%,rgba(75,74,130,.2),transparent 28%),radial-gradient(circle at 82% 72%,rgba(130,72,95,.15),transparent 31%),linear-gradient(rgba(255,255,255,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.015) 1px,transparent 1px); background-size:auto,auto,42px 42px,42px 42px; }
        .six-cosmos::before { content:''; position:absolute; width:580px; height:580px; top:50%; left:50%; border:1px solid rgba(207,180,115,.09); border-radius:50%; box-shadow:0 0 0 84px rgba(207,180,115,.025),0 0 0 168px rgba(207,180,115,.018); transform:translate(-50%,-50%); animation:six-celestial-turn 70s linear infinite; }
        .six-cosmos::after { content:''; position:absolute; inset:0; background:linear-gradient(115deg,transparent 22%,rgba(246,218,152,.045) 38%,transparent 54%); animation:six-aurora 9s ease-in-out infinite alternate; }
        .six-cosmos>i { position:absolute; top:var(--y); left:var(--x); width:2px; height:2px; border-radius:50%; background:#f6dfa6; box-shadow:0 0 8px #e8cb88; opacity:.45; animation:six-star 4s calc(var(--star) * -.31s) ease-in-out infinite; }
        .six-brand { position:relative; z-index:2; display:grid; grid-template-columns:64px minmax(0,1fr) auto; align-items:center; gap:16px; padding-bottom:16px; border-bottom:1px solid rgba(205,177,112,.25); }
        .six-brand-seal { position:relative; display:grid; width:58px; height:58px; place-items:center; border:1px solid #c4a463; border-radius:50%; color:#f5d99b; font-size:1.25rem; font-weight:900; box-shadow:0 0 24px rgba(198,162,93,.18),inset 0 0 18px rgba(198,162,93,.08); }
        .six-brand-seal i { position:absolute; inset:5px; border:1px dashed rgba(222,192,125,.48); border-radius:50%; animation:six-seal-spin 18s linear infinite; }
        .six-brand small { display:block; color:#ae9667; font:700 .58rem/1.2 Georgia,serif; letter-spacing:.3em; }
        .six-brand h2 { margin:3px 0 1px; color:#f4ecd9; font:500 clamp(1.35rem,3vw,2rem)/1.1 'Yu Mincho',serif; letter-spacing:.18em; text-shadow:0 2px 18px rgba(235,203,137,.18); }
        .six-brand p { margin:0;color:#9f99a8;font-size:.69rem;letter-spacing:.07em; }.six-brand>em{color:#bca56f;font:normal .66rem Georgia,serif;letter-spacing:.14em;}
        .six-progress { position:relative; z-index:2; display:grid; grid-template-columns:repeat(6,1fr); gap:0; padding:0 6%; }
        .six-progress::before { content:'';position:absolute;top:14px;left:11%;right:11%;height:1px;background:linear-gradient(90deg,transparent,#806f50 12%,#806f50 88%,transparent); }
        .six-progress span { position:relative; display:grid; min-height:45px; place-items:center; align-content:start; gap:4px; border-radius:0;color:#706c79;background:transparent;font-size:.58rem;letter-spacing:.12em; }
        .six-progress span i { position:relative;z-index:1;display:grid;width:28px;height:28px;place-items:center;border:1px solid #555162;border-radius:50%;color:#716b75;background:#171827;font:normal .61rem Georgia,serif;transition:.35s; }
        .six-progress span b { font-weight:800; }.six-progress span.is-active{color:#cbb67e;background:transparent;box-shadow:none}.six-progress span.is-active i{border-color:#c4a35f;color:#f5d994;background:#292137;box-shadow:0 0 15px rgba(213,177,99,.24)}
        .six-setup,.six-scene,.six-send,.six-receive,.six-reading { position:relative; z-index:2; display:grid; gap:14px; padding:20px 23px; border:1px solid rgba(188,160,101,.24); border-radius:2px; background:linear-gradient(135deg,rgba(255,255,255,.035),rgba(255,255,255,.008)); box-shadow:inset 0 0 38px rgba(0,0,0,.15); animation:six-stage-enter .55s cubic-bezier(.2,.85,.28,1) both; }
        .six-intro { display:flex;gap:14px;padding:13px 15px;border:0;border-left:2px solid #b79858;border-radius:0;color:#d8c592;background:linear-gradient(90deg,rgba(182,145,73,.1),transparent); }
        .six-intro svg{filter:drop-shadow(0 0 8px rgba(230,196,126,.55))}.six-intro small{display:block;margin-bottom:4px;color:#867756;font:700 .53rem Georgia,serif;letter-spacing:.22em}.six-intro strong{color:#eee5d1;font-size:1.02rem;font-weight:500;letter-spacing:.08em}.six-intro p{max-width:680px;color:#aaa3b0;font-size:.72rem;line-height:1.7;}
        .six-setup label,.six-receive label{color:#c9b984;font-weight:500;letter-spacing:.05em}.six-setup label small{color:#777381}.six-setup input,.six-setup textarea,.six-receive textarea{border:1px solid rgba(191,161,101,.4);border-radius:1px;color:#f2ebdd;background:rgba(2,5,15,.58);box-shadow:inset 0 1px 12px rgba(0,0,0,.38);font-family:'Yu Gothic',sans-serif;outline:none;transition:border-color .2s,box-shadow .2s}.six-setup input:focus,.six-setup textarea:focus,.six-receive textarea:focus{border-color:#d2b269;box-shadow:0 0 0 2px rgba(210,178,105,.1),inset 0 1px 12px rgba(0,0,0,.38)}
        .six-master-picker{grid-template-columns:repeat(6,1fr);gap:7px;padding:11px;border-color:rgba(190,161,104,.28);border-radius:1px;background:rgba(0,0,0,.12)}.six-master-picker legend{color:#c9b77f;font-weight:500;letter-spacing:.09em}
        .six-master-picker button{grid-template-columns:1fr;place-items:center;min-height:82px;gap:6px;padding:9px 5px;border:1px solid rgba(160,143,112,.26);border-radius:1px;color:#ada6b3;background:linear-gradient(160deg,rgba(255,255,255,.035),rgba(0,0,0,.12));box-shadow:none;transition:.24s}.six-master-picker button:hover{border-color:rgba(215,184,117,.65);color:#e5d7b5;transform:translateY(-2px);background:rgba(196,158,85,.07)}.six-master-picker button>i{display:grid;width:34px;height:34px;place-items:center;border:1px solid rgba(195,167,104,.35);border-radius:50%;color:#b9a36e;font:normal .67rem 'Yu Mincho',serif;transition:.3s}.six-master-picker button span{display:grid;gap:2px;text-align:center}.six-master-picker button b{font-size:.69rem;font-weight:600}.six-master-picker button small{color:#77727f;font-size:.5rem}.six-master-picker button.is-selected{border-color:#d0ad62;color:#f6e6bd;background:linear-gradient(145deg,rgba(171,130,59,.2),rgba(79,48,92,.22));box-shadow:inset 0 0 20px rgba(198,156,76,.08),0 0 15px rgba(191,147,69,.1)}.six-master-picker button.is-selected>i{border-color:#dfbd72;color:#ffe7aa;box-shadow:0 0 15px rgba(216,174,87,.25)}.six-master-picker button.is-selected small{color:#aa9670}
        .six-primary,.six-next,.six-subtle{min-height:43px;border-radius:1px;letter-spacing:.1em;font-family:'Yu Mincho',serif;transition:.2s}.six-primary{border:1px solid #c5a15b;color:#15131a;background:linear-gradient(105deg,#9e7a3f,#e1c27b 48%,#94703a);box-shadow:0 5px 22px rgba(0,0,0,.36),inset 0 1px rgba(255,255,255,.45);text-shadow:0 1px rgba(255,255,255,.28)}.six-primary:hover:not(:disabled){filter:brightness(1.12);box-shadow:0 5px 26px rgba(210,171,91,.22)}.six-next{border:1px solid #a88c55;color:#e7d3a2;background:rgba(180,143,71,.08);box-shadow:none}.six-next:hover{background:rgba(180,143,71,.16)}.six-subtle{border-color:#5d5769;color:#aaa4b1;background:transparent}.six-error{color:#e0a5a5;background:rgba(139,45,52,.2)}.six-success{color:#d9c486;background:rgba(166,132,63,.12);border:1px solid rgba(196,160,87,.25)}
        .six-scene>header>span{width:42px;height:42px;border:1px solid #c2a35f;border-radius:50%;color:#e5ca8d;background:rgba(177,137,61,.08);font-weight:500;box-shadow:0 0 18px rgba(190,151,72,.15)}.six-scene header small,.six-reading header small{color:#99835a;letter-spacing:.2em}.six-scene header h3,.six-reading header h3{color:#eee6d5;font-size:1.18rem;font-weight:500;letter-spacing:.09em}
        .iching-altar{position:relative;display:grid;grid-template-columns:1fr 132px 1fr;min-height:215px;place-items:center;overflow:hidden;margin:0 -23px;background:radial-gradient(circle,rgba(197,158,78,.1),transparent 42%)}.iching-rings{position:absolute;top:50%;left:50%;width:310px;height:310px;border:1px solid rgba(192,155,82,.16);border-radius:50%;transform:translate(-50%,-50%);animation:six-celestial-turn 30s linear infinite}.iching-rings i{position:absolute;inset:28px;border:1px dashed rgba(199,165,97,.15);border-radius:50%}.iching-rings i:nth-child(2){inset:64px}.iching-rings i:nth-child(3){inset:100px;background:radial-gradient(circle,rgba(212,178,105,.08),transparent 70%)}
        .iching-tube{grid-column:2;z-index:1;width:110px;height:138px;margin:0;border:1px solid #c39753;border-radius:5px 5px 29px 29px;color:#2d1d18;background:repeating-linear-gradient(90deg,#70451e 0 5px,#aa7535 6px 9px,#5f391a 10px 13px);box-shadow:inset 7px 0 12px rgba(255,211,123,.12),inset -8px 0 15px rgba(0,0,0,.4),0 17px 34px rgba(0,0,0,.48)}.iching-tube>b{display:grid;width:46px;height:46px;place-items:center;border:1px solid rgba(35,20,15,.5);border-radius:50%;color:#2e1b15;background:rgba(220,169,77,.44);font-size:1.25rem}.iching-tube>i{top:-27px;color:#bd8842;letter-spacing:-.28em;text-shadow:0 2px #311e12}.hexagram-lines{grid-column:3;z-index:1;display:grid;gap:9px;width:118px;padding:18px;border:1px solid rgba(202,169,99,.3);background:rgba(5,7,16,.58);box-shadow:0 0 28px rgba(199,160,80,.12)}.hexagram-lines>span{display:grid;grid-template-columns:1fr 1fr;gap:13px;position:relative}.hexagram-lines>span i{height:7px;background:#d9b86e;box-shadow:0 0 8px rgba(225,190,111,.27)}.hexagram-lines>span.is-yang{grid-template-columns:1fr;gap:0}.hexagram-lines>span.is-yang i:last-child{display:none}.hexagram-lines>span.is-moving::after{content:'✦';position:absolute;right:-15px;top:-6px;color:#d88068;font-size:.63rem;animation:six-star 1.4s infinite}.six-result-card p{border:1px solid rgba(190,157,91,.3);border-radius:1px;color:#e0d7c6;background:rgba(0,0,0,.25)}.six-result-card small{color:#a78951}.six-result-card b{font-size:.76rem;font-weight:500}
        .six-hint{color:#8f8997;font-weight:500;letter-spacing:.04em}.silhouette-street{min-height:250px;margin:0 -4px;border:1px solid rgba(222,155,112,.28);border-radius:1px;padding:32px 38px 22px;background:radial-gradient(circle at 78% 19%,#edb177 0 2.7%,rgba(218,114,84,.48) 3%,transparent 17%),linear-gradient(#1b1831 0,#4d2946 39%,#9d554e 62%,#1a1721 63%);box-shadow:inset 0 -48px 70px rgba(0,0,0,.7);perspective:500px}.silhouette-street::after{content:'';position:absolute;left:50%;bottom:-30px;width:58%;height:145px;background:linear-gradient(90deg,transparent,rgba(213,143,89,.13),transparent);clip-path:polygon(42% 0,58% 0,100% 100%,0 100%);transform:translateX(-50%)}.silhouette-street::before{content:'';top:44px;right:78px;width:1px;height:1px;color:transparent;background:#f5d19b;box-shadow:-310px 21px #efc896,-255px -5px #efc896,-184px 30px #efc896,-86px -18px #efc896,60px 16px #efc896,122px -12px #efc896;opacity:.55}.crossroad-torii{position:absolute;top:35px;left:50%;width:170px;height:145px;transform:translateX(-50%) scale(.86);opacity:.54}.crossroad-torii::before,.crossroad-torii::after{content:'';position:absolute;top:20px;width:15px;height:125px;background:#1b1620}.crossroad-torii::before{left:30px}.crossroad-torii::after{right:30px}.crossroad-torii i,.crossroad-torii b{position:absolute;left:0;width:100%;height:13px;background:#17131c}.crossroad-torii i{top:16px;clip-path:polygon(4% 0,96% 0,100% 60%,70% 65%,70% 100%,30% 100%,30% 65%,0 60%)}.crossroad-torii b{top:43px;left:18px;width:134px;height:9px}.crossroad-lanterns i{position:absolute;z-index:1;bottom:54px;width:9px;height:44px;background:#1c1820}.crossroad-lanterns i::after{content:'';position:absolute;top:-9px;left:-6px;width:21px;height:17px;background:#d68c55;box-shadow:0 0 17px #db8d58}.crossroad-lanterns i:first-child{left:18px}.crossroad-lanterns i:last-child{right:18px}.silhouette-street button{z-index:2;width:60px;height:130px;animation:six-wander 3.4s calc(var(--person,0)*-.4s) ease-in-out infinite alternate}.silhouette-street button:nth-of-type(1){--person:1}.silhouette-street button:nth-of-type(2){--person:2}.silhouette-street button:nth-of-type(3){--person:3}.silhouette-street button:nth-of-type(4){--person:4}.silhouette-street button:nth-of-type(5){--person:5}.silhouette-street button i{inset:8px 9px 0;background:linear-gradient(90deg,#0b0b10,#211921 50%,#08080c);filter:drop-shadow(0 12px 8px rgba(0,0,0,.75))}.silhouette-street button span{right:18px;bottom:-8px;border:1px solid #8c7049;color:#cbb37d;background:#17141e}.silhouette-street button:hover i,.silhouette-street button.is-selected i{filter:drop-shadow(0 0 13px rgba(249,206,137,.7));transform:translateY(-8px) scale(1.04)}.six-crossroads blockquote{position:relative;border:1px solid rgba(207,171,103,.4);border-left:3px solid #c39f5b;border-radius:1px;color:#eee3cc;background:linear-gradient(90deg,rgba(171,125,65,.14),rgba(255,255,255,.02));font-size:.9rem;font-weight:500;letter-spacing:.05em;animation:six-phrase-reveal .8s ease both}
        .tarot-spread{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;max-width:610px;margin:0 auto}.tarot-spread>div{position:relative;display:grid;min-height:132px;place-items:center;align-content:center;gap:5px;border:1px solid rgba(177,151,102,.25);color:#666271;background:radial-gradient(circle,rgba(174,143,81,.08),transparent 65%)}.tarot-spread>div::before,.tarot-spread>div::after{content:'';position:absolute;inset:7px;border:1px solid rgba(194,164,103,.1)}.tarot-spread>div::after{inset:13px}.tarot-spread>div>small{position:absolute;top:8px;color:#9b865b;letter-spacing:.18em}.tarot-spread>div>span{font-size:1.5rem}.tarot-spread>div.has-card{border-color:#c6a45d;color:#e8d9b6;background:linear-gradient(155deg,rgba(185,143,65,.16),rgba(76,46,86,.18));box-shadow:0 0 25px rgba(183,139,61,.12);animation:six-card-arrive .48s ease both}.tarot-spread b{max-width:90%;font-weight:500;text-align:center}.tarot-spread em{color:#ad8c56;font-size:.61rem;font-style:normal}.tarot-deck{gap:11px;padding:15px 8px 18px;border-block:1px solid rgba(189,157,94,.13);background:linear-gradient(90deg,transparent,rgba(90,45,74,.16),transparent)}.tarot-deck button{flex-basis:78px;height:125px;border:1px solid #a7874b;border-radius:2px;color:#d5b96f;background:radial-gradient(circle at 50% 42%,transparent 0 11%,rgba(205,167,87,.35) 12% 13%,transparent 14%),repeating-linear-gradient(45deg,#1b1729 0 5px,#272038 5px 10px);box-shadow:0 8px 16px rgba(0,0,0,.42),inset 0 0 0 4px #211b30,inset 0 0 0 5px rgba(199,163,87,.45);transition:.23s}.tarot-deck button:not(:disabled):hover{transform:translateY(-9px) rotate(-1deg);box-shadow:0 14px 24px rgba(0,0,0,.55),0 0 15px rgba(201,160,79,.18)}.tarot-deck button.is-revealed{opacity:.28;transform:translateY(3px);filter:grayscale(.6)}
        .six-converge{position:relative;z-index:2;min-height:480px;overflow:hidden}.six-converge::before{content:'';position:absolute;width:420px;height:420px;border:1px solid rgba(210,176,104,.2);border-radius:50%;background:repeating-conic-gradient(from 0deg,rgba(202,169,97,.14) 0 1deg,transparent 1deg 30deg);mask:radial-gradient(circle,transparent 0 45%,#000 46% 47%,transparent 48% 65%,#000 66% 66.5%,transparent 67%);animation:six-celestial-turn 32s linear infinite}.converge-orbit{width:380px;height:360px}.converge-orbit>div{top:137px;left:151px;width:76px;color:#c7b98f;transform:rotate(var(--angle)) translateY(-132px) rotate(calc(var(--angle)*-1)) scale(.3)}.converge-orbit>div.is-visible{transform:rotate(var(--angle)) translateY(-132px) rotate(calc(var(--angle)*-1)) scale(1)}.converge-orbit>div span{width:60px;height:60px;border:1px solid #c7a45d;color:#f1d99d;background:radial-gradient(circle,#43304e,#171522 70%);box-shadow:0 0 26px rgba(204,163,80,.25),inset 0 0 16px rgba(211,175,98,.08);font-weight:500}.converge-orbit>div small{font-weight:500;letter-spacing:.05em}.converge-orbit::after{top:135px;left:149px;width:74px;height:74px;border:1px solid #d1ae62;color:#f4dda4;background:radial-gradient(circle,#5c3f61,#15131e 74%);font-size:1.1rem;letter-spacing:.08em}.converge-orbit.is-complete>div{top:141px;left:156px;opacity:.12}.converge-orbit.is-complete::after{box-shadow:0 0 25px #b48a4d,0 0 80px rgba(164,116,84,.7);animation:six-final-seal 1.5s ease-in-out infinite alternate}.six-converge p{color:#d1bd87;font-size:.95rem;font-weight:500;letter-spacing:.14em}
        .six-link-preview{position:relative;gap:7px;padding:20px;border:1px solid #9e8250;border-radius:1px;color:#d7c18b;background:linear-gradient(135deg,rgba(176,138,65,.08),rgba(40,33,64,.22));box-shadow:inset 0 0 35px rgba(0,0,0,.3);font-family:ui-monospace,monospace}.six-link-preview::before{content:'TRANSMISSION READY';position:absolute;top:8px;right:10px;color:#625a69;font-size:.48rem;letter-spacing:.18em}.six-link-preview span{color:#9088a0}.six-link-preview small{color:#8d8793}.six-link-actions button{border:1px solid rgba(195,162,96,.44);border-radius:1px;color:#dcc58f;background:rgba(183,143,70,.07)}.six-link-actions button:hover{background:rgba(183,143,70,.15)}.six-guide{border-color:rgba(171,145,92,.28);border-radius:1px;color:#a8a1ad;background:rgba(255,255,255,.02)}.six-guide b{color:#c8b57f}
        .six-reading>header{padding-bottom:11px;border-bottom:1px solid rgba(197,163,96,.25)}.six-reading>header svg{color:#d3b56d;filter:drop-shadow(0 0 7px rgba(218,179,93,.35))}.six-reading article{border:1px solid rgba(190,155,91,.32);border-radius:1px;color:#ded7c8;background:rgba(176,139,71,.055)}.six-reading article.is-poteno{border-color:rgba(124,108,155,.4);background:rgba(87,64,117,.12)}.six-reading article.is-focus{border-color:rgba(96,143,128,.4);background:rgba(60,111,96,.1)}.six-reading article small{color:#c2a968;font-weight:600}.six-reading article p,.six-reading article ul{font-family:'Yu Gothic',sans-serif;color:#d1ccd3}

        /* Keep the familiar room visible and present the rites on a bright washi-like layer. */
        .poteno-visit:has(.poteno-six)::before{background:rgba(255,244,218,.08);backdrop-filter:none;animation:none}
        .poteno-visit:has(.poteno-six) .poteno-arrival{opacity:1;filter:none}
        .poteno-actions:has(.poteno-six){border:2px solid rgba(126,84,52,.68);border-radius:18px;color:#3e3029;background:linear-gradient(145deg,rgba(255,252,241,.98),rgba(250,232,199,.97));box-shadow:0 18px 52px rgba(54,35,23,.32),inset 0 0 0 4px rgba(255,255,255,.48);scrollbar-color:#b48358 #f5e6cf}
        .poteno-actions:has(.poteno-six)::before,.poteno-actions:has(.poteno-six)::after{border-color:#b98758;opacity:.42}
        .poteno-page:has(.poteno-six)>.poteno-back{border:1px solid #b88c68;border-radius:11px;color:#563e32;background:#fff8e9;box-shadow:0 2px 0 #d8b991}
        .poteno-six{color:#3d312b;background:radial-gradient(circle at 85% 15%,rgba(255,204,119,.24),transparent 25%),radial-gradient(circle at 12% 78%,rgba(167,199,152,.2),transparent 28%),linear-gradient(135deg,rgba(255,253,244,.96),rgba(248,231,198,.92));font-family:'Yu Gothic','Hiragino Kaku Gothic ProN',sans-serif}
        .six-cosmos{background:linear-gradient(rgba(139,99,64,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(139,99,64,.045) 1px,transparent 1px),radial-gradient(circle at 20% 28%,rgba(246,181,105,.2),transparent 24%),radial-gradient(circle at 82% 72%,rgba(126,170,134,.14),transparent 28%);background-size:34px 34px,34px 34px,auto,auto}
        .six-cosmos::before{border-color:rgba(153,111,68,.12);box-shadow:0 0 0 84px rgba(202,153,87,.035),0 0 0 168px rgba(202,153,87,.02)}
        .six-cosmos::after{background:linear-gradient(115deg,transparent 22%,rgba(255,255,255,.5) 39%,transparent 55%);opacity:.7}
        .six-cosmos>i{background:#c68e4d;box-shadow:0 0 7px #e8b971;opacity:.28}
        .six-brand{border-bottom-color:rgba(132,92,59,.25)}
        .six-brand-seal{border-color:#a86f43;color:#74432c;background:rgba(255,246,222,.8);box-shadow:0 4px 16px rgba(104,66,39,.13),inset 0 0 13px rgba(203,144,76,.12)}
        .six-brand-seal i{border-color:rgba(144,91,48,.42)}
        .six-brand small{color:#95623f}.six-brand h2{color:#443129;text-shadow:none;font-weight:800}.six-brand p{color:#735e51}.six-brand>em{color:#8a5d3e;font-weight:700}
        .six-progress::before{background:linear-gradient(90deg,transparent,#c9a780 12%,#c9a780 88%,transparent)}
        .six-progress span{color:#8d7669}.six-progress span i{border-color:#cbb092;color:#806858;background:#fff8e9}.six-progress span.is-active{color:#79523b}.six-progress span.is-active i{border-color:#a66b43;color:#fff;background:linear-gradient(145deg,#c98a58,#9e6040);box-shadow:0 3px 9px rgba(91,55,35,.22)}
        .six-setup,.six-scene,.six-send,.six-receive,.six-reading{border-color:rgba(154,109,71,.3);border-radius:14px;background:rgba(255,253,246,.83);box-shadow:0 7px 22px rgba(92,59,34,.1),inset 0 1px rgba(255,255,255,.8)}
        .six-intro{border-left-color:#c57e4e;color:#68452f;background:linear-gradient(90deg,rgba(242,190,112,.24),rgba(255,255,255,.18))}.six-intro small{color:#9d663f}.six-intro strong{color:#4b352b;font-weight:800}.six-intro p{color:#705e54}
        .six-setup label,.six-receive label{color:#604537;font-weight:800}.six-setup label small{color:#8c7568}.six-setup input,.six-setup textarea,.six-receive textarea{border-color:#c8a584;border-radius:10px;color:#3b302a;background:#fffdfa;box-shadow:inset 0 1px 5px rgba(95,62,40,.1)}.six-setup input:focus,.six-setup textarea:focus,.six-receive textarea:focus{border-color:#a86c44;box-shadow:0 0 0 3px rgba(190,126,77,.14)}
        .six-master-picker{border-color:#c9aa8a;border-radius:12px;background:rgba(255,247,231,.8)}.six-master-picker legend{color:#67483a;font-weight:800}.six-master-picker button{border-color:#cfb297;border-radius:10px;color:#5f493e;background:#fffdf7;box-shadow:0 2px 0 #e2cbb2}.six-master-picker button:hover{border-color:#b67b50;color:#4a3429;background:#fff4df}.six-master-picker button>i{border-color:#bb8b67;color:#8b5839;background:#fff5e1}.six-master-picker button small{color:#8a7468}.six-master-picker button.is-selected{border-color:#895a70;color:#fff;background:linear-gradient(145deg,#a87891,#78536c);box-shadow:0 3px 0 #563d4e}.six-master-picker button.is-selected>i{border-color:#f2d9e5;color:#fff;background:rgba(255,255,255,.12);box-shadow:none}.six-master-picker button.is-selected small{color:#f4e5ed}
        .six-primary{color:#fff;border-color:#8b5544;background:linear-gradient(105deg,#b86d4c,#df9c65 48%,#9d5945);box-shadow:0 4px 0 #744335,0 8px 18px rgba(92,52,38,.2);text-shadow:none}.six-next{border-color:#a56d4d;color:#714731;background:#fff1dc}.six-next:hover{background:#ffe5c2}.six-subtle{border-color:#b4947b;color:#634b3f;background:#fffaf0}.six-error{color:#8d4048;background:#ffe7e4}.six-success{color:#376950;background:#e8f4e9;border-color:#a9cbb4}
        .six-scene>header>span{border-color:#a86b45;color:#fff;background:linear-gradient(145deg,#c98254,#a75f42);box-shadow:0 3px 8px rgba(91,54,37,.2)}.six-scene header small,.six-reading header small{color:#9b613e}.six-scene header h3,.six-reading header h3{color:#44332b;font-weight:800}

        /* A layered bamboo cylinder with a raised rim, grain and individual fortune sticks. */
        .iching-altar{background:radial-gradient(ellipse at center,rgba(223,174,99,.2),transparent 55%)}
        .iching-rings{border-color:rgba(161,112,62,.18)}.iching-rings i{border-color:rgba(161,112,62,.17)}
        .iching-tube{position:relative;width:126px;height:154px;border:2px solid #70451f;border-radius:13px 13px 38px 38px;color:#4d2b17;background:linear-gradient(90deg,rgba(76,39,14,.3),transparent 13%,rgba(255,221,143,.28) 31%,transparent 52%,rgba(74,38,15,.34)),repeating-linear-gradient(92deg,#b97831 0 7px,#d39a4a 7px 14px,#c08237 14px 20px);box-shadow:inset 8px 0 14px rgba(255,223,149,.28),inset -12px 0 18px rgba(63,31,11,.32),0 4px 0 #5d381c,0 18px 25px rgba(69,40,20,.25)}
        .iching-tube::before{content:'';position:absolute;z-index:3;top:-11px;left:-5px;width:132px;height:24px;border:3px solid #6c411f;border-radius:50%;background:radial-gradient(ellipse,#5b3419 0 48%,#d59a49 50% 66%,#7b4b22 68%);box-shadow:0 3px 4px rgba(60,31,14,.35),inset 0 2px rgba(255,224,150,.42)}
        .iching-tube::after{content:'';position:absolute;left:-3px;right:-3px;bottom:25px;height:13px;border-block:2px solid rgba(102,57,24,.6);background:linear-gradient(#dda554,#a96528);box-shadow:0 3px 5px rgba(69,35,14,.25)}
        .iching-tube>b{position:relative;z-index:4;display:grid;width:51px;height:51px;place-items:center;border:2px solid rgba(93,48,20,.65);border-radius:50%;color:#4c2815;background:linear-gradient(145deg,#f0c477,#bd7a31);box-shadow:0 3px 6px rgba(71,35,15,.3),inset 0 2px rgba(255,238,184,.55);font-size:1.28rem}
        .bamboo-sticks{position:absolute;z-index:2;top:-49px;left:12px;display:flex;width:100px;height:65px;align-items:end;justify-content:center;gap:2px;filter:drop-shadow(0 3px 2px rgba(61,35,17,.28))}.bamboo-sticks i{display:block;width:7px;height:58px;border:1px solid #70431d;border-radius:5px 5px 2px 2px;background:linear-gradient(90deg,#93602a,#e2ad5b 47%,#875224);transform-origin:bottom}.bamboo-sticks i:nth-child(3n){height:63px;transform:rotate(3deg)}.bamboo-sticks i:nth-child(3n+1){height:54px;transform:rotate(-4deg)}.bamboo-sticks i:nth-child(5n){height:67px;transform:rotate(6deg)}
        .iching-tube:not(.is-cast) .bamboo-sticks{transform:translateY(28px)}
        .iching-tube.is-casting{animation:six-bamboo-shake 1.02s cubic-bezier(.36,.07,.19,.97) both}
        .iching-tube.is-casting .bamboo-sticks{animation:six-sticks-rattle .18s linear infinite}
        .iching-tube.is-cast .bamboo-sticks{animation:six-sticks-rise .52s cubic-bezier(.18,.78,.26,1.25) both}
        .cast-sticks{position:absolute;z-index:5;top:63px;left:calc(50% - 10px);width:20px;height:20px;pointer-events:none}.cast-sticks i{position:absolute;display:block;width:8px;height:70px;border:1px solid #6f421c;border-radius:5px;background:linear-gradient(90deg,#8d5725,#e4b464 47%,#855023);box-shadow:0 3px 5px rgba(64,35,15,.25);transform-origin:center;animation:six-stick-cast .72s cubic-bezier(.15,.8,.28,1) var(--cast-delay) both}
        .hexagram-lines{border-color:#cba976;border-radius:10px;background:#fff8df;box-shadow:0 7px 20px rgba(91,60,34,.12)}.hexagram-lines>span i{background:#9a6339;box-shadow:none}.six-result-card p{border-color:#cfad7f;border-radius:10px;color:#4d392e;background:#fff8e6}.six-result-card small{color:#9b633d}

        /* The crossroads is a warm little outing populated by walking Suuhimochi. */
        .six-hint{color:#715c50}.silhouette-street{min-height:245px;border-color:#dfad7d;border-radius:16px;padding:34px 30px 20px;background:radial-gradient(circle at 79% 20%,#fff9c9 0 6%,rgba(255,226,139,.7) 7%,transparent 19%),linear-gradient(#a9d7e5 0 25%,#f6c9a1 43%,#f8aa7d 59%,#9fc583 60% 69%,#ddc395 70% 100%);box-shadow:inset 0 -18px 25px rgba(115,78,43,.1),0 7px 18px rgba(111,73,42,.1);perspective:none}
        .silhouette-street::after{bottom:-24px;width:72%;height:154px;background:linear-gradient(90deg,transparent,rgba(255,245,205,.88),transparent);clip-path:polygon(37% 0,63% 0,100% 100%,0 100%)}
        .silhouette-street::before{top:34px;right:76px;background:#fff9d8;box-shadow:-310px 21px #fff9d8,-255px -5px #fff9d8,-184px 30px #fff9d8,-86px -18px #fff9d8,60px 16px #fff9d8,122px -12px #fff9d8;opacity:.78}
        .crossroad-torii{top:32px;opacity:.72}.crossroad-torii::before,.crossroad-torii::after,.crossroad-torii i,.crossroad-torii b{background:linear-gradient(90deg,#b94938,#de765b,#a43c32)}
        .crossroad-lanterns i{background:#8e5c35}.crossroad-lanterns i::after{background:#fff0a8;box-shadow:0 0 15px rgba(255,210,98,.8);border:2px solid #b87541}
        .silhouette-street button{z-index:2;width:82px;height:126px;animation:six-stroll 1.7s calc(var(--person,0)*-.21s) ease-in-out infinite alternate}
        .silhouette-street button .mochi-walker{position:absolute;inset:4px -1px 11px;border-radius:0;background:none;clip-path:none;filter:none;transform:none;transition:filter .2s,transform .2s}
        .mochi-walker img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;image-rendering:pixelated;opacity:0;animation:six-walk-frame .8s steps(1,end) infinite}.mochi-walker img:nth-child(2){animation-delay:-.2s}.mochi-walker img:nth-child(3){animation-delay:-.4s}.mochi-walker img:nth-child(4){animation-delay:-.6s}
        .silhouette-street button span{right:2px;bottom:2px;border:2px solid #fff;color:#fff;background:#a46078;box-shadow:0 2px 5px rgba(80,49,37,.2)}.silhouette-street button:hover .mochi-walker,.silhouette-street button.is-selected .mochi-walker{filter:drop-shadow(0 0 9px #fff7b4) drop-shadow(0 8px 5px rgba(78,54,33,.18));transform:translateY(-5px) scale(1.08)}
        .six-crossroads blockquote{border-color:#d7a77b;border-left-color:#b86778;border-radius:8px 14px 14px 8px;color:#4c342f;background:#fff8e8;box-shadow:0 4px 13px rgba(88,54,35,.1);font-weight:800}

        .tarot-spread>div{border-color:#cfb28f;color:#8b7568;background:rgba(255,250,235,.72)}.tarot-spread>div.has-card{border-color:#a97155;color:#4f382f;background:linear-gradient(155deg,#fff1ca,#f4d6c8);box-shadow:0 5px 18px rgba(88,54,35,.12)}.tarot-spread em{color:#9a5d4f}.tarot-deck-heading{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:-8px;padding:0 7px;color:#6a4937}.tarot-deck-heading span{font-weight:900}.tarot-deck-heading small{color:#8d7466;font-weight:700}.tarot-deck{border:1px solid rgba(151,106,72,.22);border-radius:12px;background:linear-gradient(90deg,rgba(239,206,165,.32),rgba(255,250,236,.86),rgba(239,206,165,.32));scrollbar-color:#ad7a58 #f6e7d1;scrollbar-width:auto;overscroll-behavior-x:contain}.tarot-deck::before,.tarot-deck::after{content:'';flex:0 0 calc(50% - 39px)}

        /* The entrance is a quiet ritual gate, not a settings form. */
        .poteno-actions:has(.six-setup){border:2px solid #493729;border-radius:5px;background:linear-gradient(145deg,rgba(225,204,163,.98),rgba(194,164,116,.98));box-shadow:0 22px 58px rgba(55,35,22,.4),inset 0 0 0 1px rgba(255,246,216,.52),inset 0 0 65px rgba(75,48,26,.15);scrollbar-color:#76543b #d4ba89}
        .poteno-actions:has(.six-setup)::before,.poteno-actions:has(.six-setup)::after{border-color:#5b402c;opacity:.68}
        .poteno-six:has(.six-setup){color:#342922;background:radial-gradient(circle at 50% 72%,rgba(140,52,38,.1),transparent 26%),repeating-linear-gradient(7deg,rgba(65,42,23,.025) 0 1px,transparent 1px 8px),linear-gradient(125deg,rgba(230,211,171,.98),rgba(200,174,126,.95));font-family:'Yu Mincho','Hiragino Mincho ProN',serif}
        .poteno-six:has(.six-setup) .six-cosmos{background:radial-gradient(circle at 50% 58%,rgba(118,74,34,.09),transparent 35%),repeating-linear-gradient(90deg,rgba(67,43,23,.025) 0 1px,transparent 1px 46px)}
        .poteno-six:has(.six-setup) .six-brand{border-bottom-color:rgba(67,42,24,.3)}.poteno-six:has(.six-setup) .six-brand-seal{border-color:#68452f;color:#f1ddb1;background:#34251b;box-shadow:inset 0 0 12px rgba(213,169,91,.16),0 4px 11px rgba(60,37,22,.22)}.poteno-six:has(.six-setup) .six-brand small{color:#795239}.poteno-six:has(.six-setup) .six-brand h2{color:#34251d;text-shadow:none}.poteno-six:has(.six-setup) .six-brand p{color:#735d4c}.poteno-six:has(.six-setup) .six-brand>em{color:#714a35}
        .poteno-six:has(.six-setup) .six-brand.is-compact{grid-template-columns:27px minmax(0,1fr) auto;gap:8px;min-height:28px;padding:0 2px 7px;border-bottom-color:rgba(67,42,24,.22)}.poteno-six:has(.six-setup) .six-brand.is-compact .six-brand-seal{width:25px;height:25px;border-radius:3px;font-size:.62rem;box-shadow:inset 0 0 7px rgba(213,169,91,.13)}.poteno-six:has(.six-setup) .six-brand.is-compact .six-brand-seal i{inset:3px;animation:none}.poteno-six:has(.six-setup) .six-brand.is-compact h2{font:700 .78rem/1.2 'Yu Mincho',serif;letter-spacing:.08em}.poteno-six:has(.six-setup) .six-brand.is-compact>em{font-size:.55rem}
        .poteno-six:has(.six-setup)>.six-progress{display:none}
        .six-setup{gap:17px;padding:19px 22px 17px;border:1px solid #674b34;border-radius:2px;color:#342820;background:linear-gradient(rgba(238,221,184,.84),rgba(218,192,143,.82)),repeating-linear-gradient(4deg,rgba(77,50,26,.04) 0 1px,transparent 1px 7px);box-shadow:inset 0 0 0 4px rgba(92,61,35,.07),inset 0 0 34px rgba(78,49,27,.13)}
        .six-setup.is-opening{pointer-events:none}.six-setup.is-opening::after{content:'';position:absolute;z-index:8;inset:0;border:1px solid rgba(171,124,53,.6);background:radial-gradient(circle at 50% 70%,rgba(255,231,165,.28),transparent 33%);animation:setup-veil 2.2s ease both;pointer-events:none}
        .six-intro{display:grid;grid-template-columns:54px 1fr;align-items:center;gap:14px;padding:2px 0 13px;border:0;border-bottom:1px solid rgba(90,58,33,.28);border-radius:0;color:#38291f;background:transparent}.entrance-mon{display:grid;width:48px;height:48px;place-items:center;border:1px solid #5d3f2b;color:#ead29e;background:linear-gradient(145deg,#4b3425,#241a14);clip-path:polygon(50% 0,92% 24%,92% 76%,50% 100%,8% 76%,8% 24%);font-size:1.05rem;font-weight:700}.six-intro small{display:block;margin-bottom:3px;color:#8b6040;font:700 .5rem Georgia,serif;letter-spacing:.25em}.six-intro strong{color:#322219;font:600 1.14rem/1.35 'Yu Mincho',serif;letter-spacing:.1em}.six-intro p{max-width:670px;margin-top:5px;color:#695546;font:500 .7rem/1.65 'Yu Gothic',sans-serif}
        .six-question-scroll{position:relative;display:grid;gap:9px;padding:12px 15px 15px;border-block:1px solid #8f6b49;color:#3e2b20;background:linear-gradient(90deg,rgba(99,63,34,.08),rgba(248,234,202,.8) 8%,rgba(248,234,202,.8) 92%,rgba(99,63,34,.08));box-shadow:inset 0 7px 12px rgba(77,49,27,.04),inset 0 -7px 12px rgba(77,49,27,.04)}.six-question-scroll::before,.six-question-scroll::after{content:'';position:absolute;top:-4px;bottom:-4px;width:5px;border:1px solid #725039;border-radius:50%;background:#b38b5f}.six-question-scroll::before{left:2px}.six-question-scroll::after{right:2px}.question-heading{display:flex;align-items:baseline;justify-content:space-between;gap:12px}.question-heading label{color:#482f22;font:700 .87rem 'Yu Mincho',serif;letter-spacing:.08em}.question-heading small{color:#725a49;font:600 .6rem 'Yu Gothic',sans-serif}.six-question-scroll textarea{min-height:82px;border:2px solid rgba(102,67,42,.58);border-radius:3px;padding:9px 10px;color:#34251d;background:repeating-linear-gradient(rgba(255,249,229,.6) 0 25px,rgba(105,74,48,.15) 25px 26px);box-shadow:inset 0 1px 7px rgba(72,45,25,.08),0 2px 5px rgba(77,48,27,.08);font:500 .76rem/26px 'Yu Mincho',serif;resize:vertical;transition:border-color .18s,box-shadow .18s,background-color .18s}.six-question-scroll textarea:hover{border-color:#7d4834;background-color:rgba(255,248,223,.82);box-shadow:inset 0 1px 7px rgba(72,45,25,.08),0 0 0 2px rgba(131,77,51,.08)}.six-question-scroll textarea:focus{border-color:#9b3f31;background-color:#fff5d7;box-shadow:0 0 0 3px rgba(155,63,49,.16),inset 0 1px 7px rgba(72,45,25,.07);outline:none}.six-question-scroll textarea::placeholder{color:#806854;opacity:.92}.quick-question-list{display:flex;flex-wrap:wrap;gap:6px}.quick-question-list button{min-height:28px;border:1px solid #94704f;border-radius:2px;padding:4px 10px;color:#533b2c;background:linear-gradient(#ead3a5,#d2ad76);box-shadow:0 2px 0 rgba(81,51,30,.2);font:600 .61rem 'Yu Gothic',sans-serif;transition:.16s}.quick-question-list button::before{content:'◇';margin-right:4px;color:#9b4938}.quick-question-list button:hover{border-color:#713c2e;background:#f0d9a9;transform:translateY(-1px)}.quick-question-list button.is-selected{border-color:#933c30;color:#713126;background:#efd098;box-shadow:inset 0 0 0 2px rgba(156,61,47,.12),0 2px 0 #8b5f3d}.quick-question-list button.is-selected::before{content:'◆';color:#a53d31}
        .six-master-picker{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin:0;padding:11px;border:1px solid rgba(81,54,33,.38);border-radius:2px;background:rgba(80,50,27,.055)}.six-master-picker legend{padding:0 9px;color:#422d21;font:700 .78rem 'Yu Mincho',serif;letter-spacing:.1em}.six-master-picker button{position:relative;display:grid;grid-template-columns:43px 1fr;min-height:100px;place-items:center start;gap:9px;padding:10px 9px;border:1px solid #9f7f5c;border-radius:2px;color:#3c2d25;background:linear-gradient(155deg,rgba(246,231,198,.78),rgba(205,176,126,.7));box-shadow:inset 0 0 0 3px rgba(255,248,224,.2),0 3px 7px rgba(64,41,25,.12);text-align:left;transition:.24s}.six-master-picker button:hover{border-color:#734b34;background:linear-gradient(155deg,#f0dbae,#cfaa70);transform:translateY(-2px)}.six-master-picker button>i{display:grid;width:39px;height:48px;place-items:center;border:1px solid #765238;border-radius:1px;color:#6b432d;background:rgba(247,224,181,.48);font:500 .78rem 'Yu Mincho',serif}.six-master-picker button span{display:grid;gap:3px;min-width:0}.six-master-picker button b{font:700 .73rem/1.25 'Yu Mincho',serif}.six-master-picker button small{color:#7b604d;font:600 .55rem 'Yu Gothic',sans-serif}.six-master-picker button em{color:#655044;font:500 .58rem/1.45 'Yu Mincho',serif}.six-master-picker button u{position:absolute;top:6px;right:6px;display:grid;width:28px;height:28px;place-items:center;border:1px solid #a84938;border-radius:50%;color:#a84938;background:rgba(242,211,158,.66);font:700 .48rem 'Yu Mincho',serif;text-decoration:none;transform:rotate(-9deg)}.six-master-picker button.is-selected{border:2px solid #8f352a;color:#2e211b;background:linear-gradient(145deg,#efd59d,#c89d5d);box-shadow:inset 0 0 0 3px rgba(255,242,205,.46),0 0 0 1px #c39b55,0 5px 13px rgba(93,50,31,.19)}.six-master-picker button.is-selected>i{border-color:#a64534;color:#7b2f26;background:#edcf91;box-shadow:0 0 13px rgba(170,81,47,.19)}.six-master-picker button.is-selected small{color:#704c36}
        .setup-sigil-field{position:relative;display:grid;height:260px;place-items:center;margin-top:-2px;overflow:hidden}.setup-sigil-field::before{content:'';position:absolute;width:250px;height:250px;border:1px solid rgba(104,70,40,.16);border-radius:50%;box-shadow:0 0 0 12px rgba(117,78,42,.02),inset 0 0 27px rgba(98,59,28,.045)}.setup-hexagram-lines{position:absolute;z-index:0;width:320px;height:240px;overflow:visible}.setup-hexagram-lines polygon{fill:none;stroke:rgba(100,66,38,.42);stroke-width:1.4}.setup-hexagram-lines line{stroke:rgba(125,81,42,.25);stroke-width:1;stroke-dasharray:4 4}.setup-hexagram-lines circle{fill:none;stroke:rgba(144,53,41,.35);stroke-width:1.2;stroke-dasharray:3 5}.setup-sigil-orbit{position:absolute;z-index:1;top:50%;left:50%;width:1px;height:1px}.setup-sigil-orbit>span{--orbit:104px;position:absolute;top:0;left:0;display:grid;width:54px;place-items:center;gap:3px;color:#624936;transform:translate(-50%,-50%) rotate(var(--sigil-angle)) translateY(calc(var(--orbit)*-1)) rotate(calc(var(--sigil-angle)*-1));transform-origin:center}.setup-sigil-orbit span i{display:grid;width:39px;height:39px;place-items:center;border:1px solid #715038;color:#6b442f;background:linear-gradient(145deg,#ead3a3,#c8a06b);clip-path:polygon(50% 0,92% 24%,92% 76%,50% 100%,8% 76%,8% 24%);font:700 .73rem 'Yu Mincho',serif}.setup-sigil-orbit span b{font-size:.5rem;white-space:nowrap}.setup-open-seal{position:relative;z-index:2;display:grid;width:112px;height:112px;place-items:center;align-content:center;gap:3px;border:2px solid #603927;border-radius:50%;color:#efdcaf;background:radial-gradient(circle,#824034 0 51%,#52291f 52% 61%,#b38745 62% 64%,#3d281d 65%);box-shadow:0 8px 16px rgba(68,39,23,.3),inset 0 0 0 5px rgba(231,192,116,.12);font-family:'Yu Mincho',serif;transition:.25s}.setup-open-seal::before{content:'';position:absolute;inset:9px;border:1px dashed rgba(248,219,154,.48);border-radius:50%;animation:six-seal-spin 20s linear infinite}.setup-open-seal small,.setup-open-seal strong{position:relative;z-index:1}.setup-open-seal small{font-size:.5rem;letter-spacing:.12em}.setup-open-seal strong{font-size:.95rem;letter-spacing:.07em}.setup-open-seal:not(:disabled):hover{transform:translateY(-3px) scale(1.025);box-shadow:0 12px 22px rgba(68,39,23,.34),0 0 22px rgba(166,90,57,.18)}.setup-open-seal:disabled{filter:saturate(.45);opacity:.62}.setup-sigil-field.is-opening .setup-sigil-orbit>span{animation:setup-sigil-converge 1.45s var(--sigil-delay) cubic-bezier(.5,.02,.5,1) forwards}.setup-sigil-field.is-opening .setup-hexagram-lines line{animation:setup-ray-light .52s var(--ray-delay) ease-out both}.setup-sigil-field.is-opening .setup-hexagram-lines{animation:setup-star-converge .75s 1.25s ease-in forwards}.setup-sigil-field.is-opening .setup-open-seal{animation:setup-center-awaken .8s 1.2s ease-in-out forwards}
        .setup-origin{justify-self:center;color:#6f5b4b;font-family:'Yu Gothic',sans-serif}.setup-origin p{display:flex;align-items:center;gap:9px;margin:0;padding:5px 10px;border-top:1px solid rgba(95,65,41,.25);font-size:.62rem}.setup-origin p b{color:#4a3528}.setup-origin button{border:0;border-bottom:1px solid #814d3b;padding:2px 3px;color:#814d3b;background:transparent;font-size:.6rem;font-weight:700}.setup-origin label{display:grid;gap:5px;min-width:min(390px,80vw);color:#604838;font-size:.65rem}.setup-origin label>span:first-child{display:flex;justify-content:space-between}.setup-origin label small{color:#8f7864}.origin-editor{display:grid;grid-template-columns:1fr auto;gap:6px}.setup-origin input{min-width:0;border:1px solid #9f8060;border-radius:2px;padding:7px 9px;color:#3a2b22;background:rgba(246,230,194,.72);box-shadow:inset 0 1px 5px rgba(72,45,25,.1)}.origin-editor button{border:1px solid #79533b;padding:5px 11px;color:#4f3426;background:#ddc18b}.setup-opening-voice{position:relative;z-index:9;margin:-7px 0 0;color:#794739;font:600 .68rem/1.5 'Yu Mincho',serif;letter-spacing:.08em;text-align:center;animation:setup-voice 2.1s ease both}

        /* I Ching rite: lacquer, brass and ink replace the former card-like presentation. */
        .poteno-actions:has(.six-iching){border-color:#4b3826;border-radius:4px;background:linear-gradient(135deg,#171410,#2b2119 48%,#151310);box-shadow:0 28px 72px rgba(35,22,13,.52),inset 0 0 0 1px #81633d,inset 0 0 60px rgba(0,0,0,.4);scrollbar-color:#8d6c3d #18130f}
        .poteno-actions:has(.six-iching)::before,.poteno-actions:has(.six-iching)::after{border-color:#a8864e;opacity:.72}
        .poteno-six:has(.six-iching){color:#e9ddc4;background:radial-gradient(circle at 50% 58%,rgba(142,100,49,.12),transparent 38%),linear-gradient(115deg,#181511,#2c2118 48%,#17130f)}
        .poteno-six:has(.six-iching) .six-cosmos{background:radial-gradient(circle at 50% 60%,rgba(153,111,55,.12),transparent 40%),repeating-linear-gradient(12deg,rgba(255,255,255,.012) 0 1px,transparent 1px 8px)}
        .poteno-six:has(.six-iching) .six-brand{border-bottom-color:#5f492e}.poteno-six:has(.six-iching) .six-brand h2{color:#eee2ca}.poteno-six:has(.six-iching) .six-brand p{color:#a99575}.poteno-six:has(.six-iching) .six-brand small,.poteno-six:has(.six-iching) .six-brand>em{color:#b59660}.poteno-six:has(.six-iching) .six-brand-seal{border-color:#ae8b4d;color:#d7b773;background:#191510;box-shadow:inset 0 0 16px rgba(177,137,70,.15),0 0 18px rgba(0,0,0,.3)}
        .six-progress{position:relative;gap:10px;padding:4px 8px 0}.six-progress::before{top:23px;height:1px;background:linear-gradient(90deg,transparent,#8d7044 13%,#8d7044 87%,transparent)}
        .six-progress span{position:relative;z-index:1;display:grid;min-height:55px;place-items:center;align-content:start;gap:5px;border:0;border-radius:0;color:#776955;background:transparent;box-shadow:none;font-family:'Yu Mincho',serif}
        .six-progress span i{display:grid;width:39px;height:39px;place-items:center;border:0;color:#78684f;background:linear-gradient(145deg,#342b22,#1d1915);clip-path:polygon(50% 0,92% 24%,92% 76%,50% 100%,8% 76%,8% 24%);box-shadow:none;font-size:.88rem;font-style:normal}
        .six-progress span b{font-size:.55rem;letter-spacing:.09em}.six-progress span.is-active{color:#cbb17a;background:transparent;box-shadow:none}.six-progress span.is-active i{color:#f0d895;background:linear-gradient(145deg,#9d773a,#3d2d1d 58%,#b08a4c);filter:drop-shadow(0 3px 5px rgba(0,0,0,.35));text-shadow:0 1px 2px #2b1a0c}
        .six-iching{position:relative;isolation:isolate;overflow:hidden;gap:15px;padding:18px 24px 20px;border:1px solid #493a28;border-radius:2px;color:#e8dcc3;background:radial-gradient(circle at 50% 55%,rgba(121,87,45,.12),transparent 38%),repeating-linear-gradient(4deg,rgba(255,255,255,.015) 0 1px,transparent 1px 7px),linear-gradient(135deg,#211b16,#30251b 52%,#171411);box-shadow:inset 0 0 0 4px #15120f,inset 0 0 0 5px #6d5432,inset 0 0 70px rgba(0,0,0,.5),0 10px 30px rgba(0,0,0,.25)}
        .six-iching::before{content:'☰　☱　☲　☳　☴　☵　☶　☷';position:absolute;z-index:-1;inset:auto 0 11px;color:rgba(202,169,100,.09);font:400 2rem/1 'Yu Mincho',serif;letter-spacing:.28em;text-align:center;white-space:nowrap}
        .six-iching::after{content:'';position:absolute;z-index:-1;top:50%;left:50%;width:430px;height:430px;border:1px solid rgba(185,145,76,.08);border-radius:50%;background:repeating-conic-gradient(from 0deg,rgba(183,145,78,.055) 0 1deg,transparent 1deg 45deg);transform:translate(-50%,-46%);mask:radial-gradient(circle,transparent 0 43%,#000 43.5% 44%,transparent 44.5% 63%,#000 63.5% 64%,transparent 64.5%)}
        .six-iching>header{position:relative;z-index:2;padding-bottom:10px;border-bottom:1px solid rgba(184,145,78,.27)}.six-iching>header>span{width:43px;height:43px;border:1px solid #ad8545;border-radius:3px;color:#e8ce91;background:linear-gradient(145deg,#4a3420,#1b1712);box-shadow:inset 0 0 12px rgba(199,157,78,.12),0 5px 12px rgba(0,0,0,.3);font-size:1.15rem}.six-iching header small{color:#b6955d;letter-spacing:.2em}.six-iching header h3{color:#eee1c8;font-size:1.08rem;font-weight:500;letter-spacing:.08em}
        .iching-ritual{position:relative;display:grid;min-height:352px;grid-template-columns:1fr;place-items:center;overflow:hidden;border-block:1px solid rgba(167,128,67,.18);background:radial-gradient(ellipse at 50% 78%,rgba(179,133,62,.13),transparent 41%),linear-gradient(90deg,transparent,rgba(255,255,255,.018),transparent)}
        .six-iching.has-reading .iching-ritual{grid-template-columns:minmax(180px,.72fr) minmax(350px,1.28fr)}
        .iching-diagram{position:absolute;top:50%;left:50%;width:325px;height:325px;border:1px solid rgba(190,151,81,.14);border-radius:50%;transform:translate(-50%,-50%);animation:six-iching-wheel 70s linear infinite}.iching-diagram>i{position:absolute;inset:22px;border:1px dashed rgba(189,148,75,.11);border-radius:50%}.iching-diagram>i:nth-child(2){inset:61px}.iching-diagram>i:nth-child(3){inset:100px}.iching-diagram>i:nth-child(4){inset:135px;background:rgba(160,113,49,.05)}.iching-diagram>b{position:absolute;inset:0;display:grid;place-items:center;color:rgba(205,171,105,.08);font-size:6rem;font-weight:400}
        .iching-vessel{position:relative;z-index:3;display:grid;width:190px;height:342px;place-items:end center;transition:transform .7s ease}.six-iching.has-reading .iching-vessel{transform:translateX(-10px) scale(.88)}
        .iching-tube{position:relative;display:block;width:116px;height:235px;margin:0 0 32px;border:2px solid #100d0a;border-radius:7px 7px 17px 17px;color:#b99350;background:linear-gradient(92deg,rgba(0,0,0,.58),transparent 17%,rgba(197,144,73,.13) 31%,rgba(255,230,173,.075) 38%,transparent 47%,rgba(0,0,0,.63) 88%),repeating-linear-gradient(96deg,transparent 0 9px,rgba(214,171,98,.035) 10px,transparent 12px),linear-gradient(#282017,#100e0b);box-shadow:inset 8px 0 15px rgba(0,0,0,.72),inset -9px 0 15px rgba(0,0,0,.74),inset 0 0 0 2px rgba(126,89,44,.2),0 7px 0 #0a0807,0 24px 28px rgba(0,0,0,.62)}
        .iching-tube::before{content:'';position:absolute;z-index:5;top:-9px;left:-7px;width:126px;height:22px;border:2px solid #2a1c0e;border-radius:50%;background:radial-gradient(ellipse,#080706 0 48%,#be914c 50% 57%,#3f2d16 59% 68%,#17110b 70%);box-shadow:0 4px 6px rgba(0,0,0,.7),inset 0 2px rgba(247,214,146,.35)}
        .iching-tube::after{content:'';position:absolute;left:-4px;right:-4px;bottom:28px;height:16px;border-block:1px solid #d0a45e;background:linear-gradient(#5b421e,#c39a55 35%,#5a401e 64%,#1e160d);box-shadow:0 3px 8px rgba(0,0,0,.5),inset 0 1px rgba(255,232,169,.42)}
        .bamboo-sticks{position:absolute;z-index:3;top:-72px;left:10px;display:flex;width:94px;height:87px;align-items:end;justify-content:center;gap:1px;filter:drop-shadow(0 5px 3px rgba(0,0,0,.55))}.bamboo-sticks i{position:static;top:auto;display:block;flex:0 0 3px;width:3px;height:82px;border:0;border-radius:2px 2px 0 0;color:inherit;background:linear-gradient(90deg,#382514,#b17b3c 45%,#3d2815);font-size:inherit;transform-origin:bottom}.bamboo-sticks i:nth-child(3n){height:87px;transform:rotate(1.5deg)}.bamboo-sticks i:nth-child(3n+1){height:77px;transform:rotate(-1.8deg)}.bamboo-sticks i:nth-child(5n){height:91px;transform:rotate(2.5deg)}.iching-tube:not(.is-cast) .bamboo-sticks{transform:translateY(22px)}
        .tube-carving{position:absolute;top:50px;left:13px;right:13px;display:grid;grid-template-columns:repeat(2,1fr);gap:25px 35px;color:rgba(201,159,88,.52);font-size:1.05rem;text-align:center;text-shadow:0 1px #000}.tube-carving::before{content:'';position:absolute;inset:-13px -4px;border:1px solid rgba(184,139,69,.22);background:repeating-linear-gradient(90deg,transparent 0 10px,rgba(192,148,76,.04) 10px 11px)}.tube-carving span{position:relative}.iching-tube>.tube-yinyang{position:absolute;top:auto;left:50%;bottom:55px;color:rgba(210,172,101,.68);font-size:1.45rem;font-style:normal;transform:translateX(-50%);text-shadow:0 1px #000,0 0 9px rgba(202,158,80,.12)}
        .iching-tube.is-cast{animation:none}
        .vessel-shadow{position:absolute;z-index:1;bottom:12px;width:170px;height:28px;border-radius:50%;background:radial-gradient(ellipse,rgba(0,0,0,.78),rgba(0,0,0,.12) 65%,transparent 72%);filter:blur(3px)}
        .iching-tube.is-casting{animation:six-ritual-shake .74s cubic-bezier(.36,.07,.19,.97) both}.iching-tube.is-casting .bamboo-sticks{animation:six-ritual-rattle .12s linear infinite}.iching-tube.is-cast .bamboo-sticks{animation:six-ritual-sticks-rise .4s cubic-bezier(.18,.78,.26,1.2) both}
        .cast-sticks{top:105px;left:27%;filter:drop-shadow(0 5px 4px rgba(0,0,0,.45))}.cast-sticks i{width:4px;height:87px;border:0;border-radius:2px;background:linear-gradient(90deg,#4b3119,#c18a45 48%,#493018);box-shadow:none}
        .iching-transformation{position:relative;z-index:3;display:grid;width:min(100%,500px);height:320px;place-items:center;grid-template-columns:1fr 168px 1fr;grid-template-rows:68px 1fr 55px;color:#e6d8bd}
        .ritual-hexagram{grid-column:2;grid-row:1/4;display:flex;width:158px;height:244px;flex-direction:column-reverse;justify-content:center;gap:15px;padding:24px 18px;border:1px solid rgba(189,146,73,.28);background:linear-gradient(90deg,transparent,rgba(203,160,87,.045),transparent);box-shadow:inset 0 0 28px rgba(0,0,0,.25)}
        .ritual-line{position:relative;height:17px;opacity:0;animation:six-line-rise .28s cubic-bezier(.16,.8,.28,1) var(--line-delay) forwards}.ritual-line>span{position:absolute;inset:0;display:flex;justify-content:space-between;gap:23px}.ritual-line i{display:block;flex:1;height:12px;background:#d9c49b;box-shadow:0 2px 0 #3b2c1d,0 0 8px rgba(218,192,141,.12)}.ritual-line.is-yang .line-original i:first-child,.ritual-line .line-changed.is-yang i:first-child{flex-basis:100%}.ritual-line.is-yang .line-original i:last-child,.ritual-line .line-changed.is-yang i:last-child{display:none}.ritual-line>b{position:absolute;right:-35px;top:-2px;color:transparent;font-size:.58rem}.ritual-line.is-moving>b{color:#d9a844}.ritual-line.is-moving>b::after{content:' 動';font-size:.5rem}.ritual-line.is-moving .line-original i{animation:six-moving-line .82s 1.32s ease-in-out infinite alternate}.line-original{animation:six-base-fade .38s 1.9s forwards}.line-changed{opacity:0;animation:six-result-show .42s 1.9s forwards}.ritual-line.is-moving .line-changed i{background:#b44736;box-shadow:0 2px #351812,0 0 12px rgba(194,72,48,.42)}
        .hexagram-name{display:grid;gap:5px;align-self:center;transition:.4s}.hexagram-name small,.moving-line-note small{color:#a98955;font-size:.57rem;letter-spacing:.2em}.hexagram-name strong{font:500 .88rem/1.5 'Yu Mincho',serif}.hexagram-name span{color:#93836c;font-size:.55rem;line-height:1.5}.hexagram-name.is-base{grid-column:1;grid-row:1/3;justify-self:end;text-align:right;animation:six-base-name 2.3s both}.hexagram-name.is-result{grid-column:3;grid-row:1/3;justify-self:start;opacity:0;animation:six-result-name .48s 2s forwards}.moving-line-note{grid-column:1;grid-row:3;display:grid;justify-self:end;gap:4px;color:#dfb65f;text-align:right;opacity:0;animation:six-note-arrive .32s 1.32s forwards}.moving-line-note strong{font-size:.66rem;font-weight:600}.transformation-mark{grid-column:3;grid-row:3;display:flex;align-items:center;justify-self:start;gap:6px;color:#b69864;opacity:0;animation:six-note-arrive .32s 1.75s forwards}.transformation-mark span{display:grid;width:29px;height:29px;place-items:center;border:1px solid #a94737;color:#d47760;background:rgba(99,31,23,.22);font-family:'Yu Mincho',serif}.transformation-mark i{font-style:normal}
        .iching-cast-button{justify-self:center;min-width:250px;border-color:#b28c4c;border-radius:2px;color:#f1dfb9;background:linear-gradient(#63461f,#322417);box-shadow:0 3px 0 #110e0a,0 9px 19px rgba(0,0,0,.35),inset 0 1px rgba(255,229,171,.22);font-family:'Yu Mincho',serif;font-weight:500;letter-spacing:.1em}.iching-cast-button:hover{background:linear-gradient(#79572a,#3b2a1a)}.iching-sequence-caption{min-height:24px;margin:0;color:#b9a37d;font:500 .72rem/1.6 'Yu Mincho',serif;letter-spacing:.12em;text-align:center;animation:six-note-arrive .5s ease}.six-iching>.six-next{border-color:#9e7c45;border-radius:2px;color:#dcc798;background:#292016;box-shadow:0 2px 0 #100d0a;font-family:'Yu Mincho',serif;font-weight:500;letter-spacing:.07em;animation:six-note-arrive .45s ease}

        /* Final I Ching information architecture: vessel → changing hexagram → fixed result. */
        .iching-diagram{opacity:.32}.iching-diagram>b{color:rgba(205,171,105,.035)}
        .iching-ritual{grid-template-columns:1fr;gap:24px;padding:0 12px;overflow:hidden}
        .six-iching.has-reading .iching-ritual{grid-template-columns:200px minmax(290px,1fr) 220px;gap:20px;place-items:stretch center}
        .iching-vessel-zone{position:relative;z-index:3;display:grid;grid-column:1/-1;place-items:center;align-self:stretch}
        .six-iching.has-reading .iching-vessel-zone{grid-column:1;place-self:stretch}
        .six-iching.has-reading .iching-vessel{transform:translateX(0) scale(.78);filter:saturate(.74) brightness(.82)}
        .six-iching.is-complete .iching-vessel{opacity:.62;transform:translateX(-4px) scale(.62);filter:saturate(.45) brightness(.62)}
        .six-iching.has-reading .vessel-shadow{opacity:.72}.six-iching.is-complete .vessel-shadow{opacity:.4;transform:scale(.75)}
        .cast-sticks{top:100px;left:48%;transform:translateX(-50%)}
        .iching-transformation{position:relative;z-index:4;display:grid;grid-column:2;width:100%;height:320px;grid-template-columns:1fr;grid-template-rows:64px 1fr;place-items:center;color:#f0e6d2}
        .process-title{grid-column:1;grid-row:1;display:grid;place-items:center;align-self:end;gap:2px;text-align:center}.process-title small{color:#c6aa73;font:600 .72rem/1.2 'Yu Mincho',serif;letter-spacing:.26em}.process-title strong{color:#f0e6d2;font:500 1.15rem/1.35 'Yu Mincho',serif;letter-spacing:.08em}.process-title.is-base{animation:six-process-base 2.3s both}.process-title.is-result{opacity:0;animation:six-process-result .48s 2s forwards}.process-title.is-result small{color:#c96752}
        .iching-transformation .ritual-hexagram{grid-column:1;grid-row:2;display:flex;width:210px;height:238px;flex-direction:column-reverse;justify-content:center;gap:15px;padding:24px 26px;border:0;border-inline:1px solid rgba(193,153,84,.17);background:linear-gradient(90deg,transparent,rgba(210,171,101,.035),transparent);box-shadow:none}
        .iching-transformation .ritual-line{height:17px}.iching-transformation .ritual-line>span{gap:27px}.iching-transformation .ritual-line i{height:13px;background:#eee2c8;box-shadow:0 2px 0 #39291b,0 0 10px rgba(229,209,169,.1)}.iching-transformation .ritual-line>b{right:-35px}.iching-transformation .ritual-line.is-moving .line-changed i{background:#c3503d;box-shadow:0 2px #351812,0 0 15px rgba(205,72,48,.5)}
        .iching-result-detail{position:relative;z-index:4;grid-column:3;display:grid;align-self:center;gap:0;width:100%;min-height:284px;border-block:1px solid rgba(185,144,75,.32);background:linear-gradient(90deg,rgba(0,0,0,.2),rgba(255,255,255,.018));opacity:0;animation:six-result-panel .45s 2.3s forwards}
        .iching-result-detail section{display:grid;grid-template-columns:1fr auto;gap:4px 10px;padding:13px 12px;border-bottom:1px solid rgba(174,137,75,.2)}.iching-result-detail section:last-child{border-bottom:0}.iching-result-detail small{grid-column:1/-1;color:#c1a56f;font:600 .7rem/1.2 'Yu Mincho',serif;letter-spacing:.2em}.iching-result-detail strong{grid-column:1/-1;color:#f1e5cc;font:500 1.15rem/1.35 'Yu Mincho',serif;letter-spacing:.08em}.iching-result-detail p{display:flex;gap:7px;margin:0;color:#e5dbc7;font-size:.7rem;line-height:1.5}.iching-result-detail p span{color:#8f836f;font-size:.6rem}.iching-result-detail .is-moving{background:linear-gradient(90deg,rgba(143,53,38,.13),transparent)}.iching-result-detail .is-moving small{color:#cc725d}.iching-result-detail .is-moving strong{color:#e6cfa8;font-size:.78rem;line-height:1.6}
        .iching-footer{display:grid;grid-template-columns:minmax(0,1fr) 88px auto;align-items:end;gap:12px;animation:six-note-arrive .45s ease}.iching-footer blockquote{position:relative;margin:0;padding:11px 16px;border:1px solid rgba(171,131,67,.34);border-radius:2px;color:#ece1cb;background:linear-gradient(90deg,rgba(139,99,45,.13),rgba(255,255,255,.015));font-family:'Yu Mincho',serif}.iching-footer blockquote small{display:block;margin-bottom:3px;color:#b6955d;font-size:.55rem;letter-spacing:.18em}.iching-footer blockquote p{margin:0;font-size:.73rem;line-height:1.65}.iching-footer .six-next{align-self:center;white-space:nowrap;border-color:#9e7c45;border-radius:2px;color:#dcc798;background:#292016;box-shadow:0 2px 0 #100d0a;font-family:'Yu Mincho',serif;font-weight:500;letter-spacing:.07em}

        .converge-orbit>div{color:#624b3f}.converge-orbit>div span{border-color:#a36b4c;color:#fff;background:radial-gradient(circle,#d59667,#9c5d49 72%);box-shadow:0 4px 14px rgba(94,56,38,.22)}.converge-orbit::after{border-color:#a1694c;color:#fff;background:radial-gradient(circle,#b9828f,#785469 74%)}.six-converge p{color:#6c4937;font-weight:800}
        .six-link-preview{border-color:#aa7957;border-radius:11px;color:#5f4334;background:#fff7e7;box-shadow:inset 0 0 24px rgba(186,129,76,.08)}.six-link-preview::before{color:#a18370}.six-link-preview span{color:#755c50}.six-link-preview small{color:#75665e}.six-link-actions button{border-color:#b88967;border-radius:10px;color:#624536;background:#fff9ed}.six-guide{border-color:#c9aa8c;border-radius:10px;color:#5f514a;background:#fffdf8}.six-guide b{color:#704938}
        .six-reading>header{border-bottom-color:#cfad8c}.six-reading article{border-color:#cba683;border-radius:11px;color:#47362e;background:#fff9e9}.six-reading article.is-poteno{border-color:#c99471;background:#fff1dd}.six-reading article.is-focus{border-color:#89ad92;background:#edf6e9}.six-reading article small{color:#8d5b3c}.six-reading article p,.six-reading article ul{color:#403631}
        @keyframes six-iching-wheel{to{transform:translate(-50%,-50%) rotate(360deg)}}
        @keyframes six-ritual-shake{0%,100%{transform:translate(0) rotate(0)}10%{transform:translate(-9px,-2px) rotate(-3deg)}22%{transform:translate(10px,-6px) rotate(4deg)}34%{transform:translate(-11px,-4px) rotate(-4deg)}46%{transform:translate(11px,-8px) rotate(4deg)}58%{transform:translate(-8px,-3px) rotate(-3deg)}72%{transform:translate(7px,-6px) rotate(2deg)}86%{transform:translate(-3px,-1px) rotate(-1deg)}}
        @keyframes six-ritual-rattle{0%,100%{transform:translate(0,22px) rotate(-.8deg)}50%{transform:translate(2px,15px) rotate(1.2deg)}}
        @keyframes six-ritual-sticks-rise{from{transform:translateY(22px)}66%{transform:translateY(-7px)}to{transform:translateY(0)}}
        @keyframes six-line-rise{from{opacity:0;transform:translateY(18px) scaleX(.62);filter:blur(3px)}to{opacity:1;transform:none;filter:none}}
        @keyframes six-moving-line{from{filter:none}to{filter:drop-shadow(0 0 7px #d7a546);transform:scaleX(1.035)}}
        @keyframes six-base-fade{from{opacity:1}to{opacity:0;transform:scaleX(.93)}}
        @keyframes six-result-show{from{opacity:0;transform:scaleX(.88)}to{opacity:1;transform:none}}
        @keyframes six-base-name{0%,84%{opacity:1}100%{opacity:.24}}
        @keyframes six-result-name{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:none}}
        @keyframes six-note-arrive{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
        @keyframes six-process-base{0%,84%{opacity:1}100%{opacity:0;transform:translateY(-4px)}}
        @keyframes six-process-result{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
        @keyframes six-result-panel{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:none}}
        @keyframes setup-sigil-converge{0%{opacity:1;filter:none;transform:translate(-50%,-50%) rotate(var(--sigil-angle)) translateY(calc(var(--orbit)*-1)) rotate(calc(var(--sigil-angle)*-1)) scale(1)}42%{opacity:1;filter:drop-shadow(0 0 9px #f2c765);transform:translate(-50%,-50%) rotate(var(--sigil-angle)) translateY(calc(var(--orbit)*-1)) rotate(calc(var(--sigil-angle)*-1)) scale(1.18)}100%{opacity:0;filter:drop-shadow(0 0 13px #f4cc74);transform:translate(-50%,-50%) scale(.18)}}
        @keyframes setup-center-awaken{0%{box-shadow:0 8px 16px rgba(68,39,23,.3);transform:scale(1)}60%{box-shadow:0 0 26px #e6b85d,0 0 62px rgba(183,72,47,.45);transform:scale(1.12)}100%{box-shadow:0 0 38px #f0ca78,0 0 85px rgba(176,67,44,.48);transform:scale(.92)}}
        @keyframes setup-ray-light{0%{stroke:#895135;stroke-dasharray:140;stroke-dashoffset:140;opacity:.16}65%{stroke:#e1aa4f;stroke-dashoffset:0;opacity:1;filter:drop-shadow(0 0 4px #d79536)}100%{stroke:#b85d3e;stroke-dashoffset:0;opacity:.72}}
        @keyframes setup-star-converge{0%{opacity:1;transform:scale(1)}60%{opacity:1;filter:drop-shadow(0 0 8px rgba(222,159,71,.65));transform:scale(.98)}100%{opacity:.08;filter:drop-shadow(0 0 16px #e5ad55);transform:scale(.35)}}
        @keyframes setup-veil{0%{opacity:0}35%,78%{opacity:1}100%{opacity:0}}
        @keyframes setup-voice{0%{opacity:0}20%,78%{opacity:1}100%{opacity:.25}}
        @keyframes six-cast { 0%,100%{transform:rotate(0)} 20%{transform:rotate(-8deg) translateY(-5px)} 45%{transform:rotate(9deg) translateY(-9px)} 70%{transform:rotate(-5deg) translateY(-3px)} }
        @keyframes six-bamboo-shake{0%,100%{transform:translate(0) rotate(0)}12%{transform:translate(-8px,-3px) rotate(-5deg)}24%{transform:translate(9px,-7px) rotate(6deg)}36%{transform:translate(-10px,-5px) rotate(-7deg)}48%{transform:translate(10px,-9px) rotate(7deg)}60%{transform:translate(-7px,-4px) rotate(-5deg)}72%{transform:translate(7px,-7px) rotate(4deg)}84%{transform:translate(-3px,-2px) rotate(-2deg)}}
        @keyframes six-sticks-rattle{0%,100%{transform:translate(0,27px) rotate(-1deg)}50%{transform:translate(2px,20px) rotate(2deg)}}
        @keyframes six-sticks-rise{from{transform:translateY(28px)}65%{transform:translateY(-9px)}to{transform:translateY(0)}}
        @keyframes six-stick-cast{0%{opacity:0;transform:translate(-3px,28px) rotate(-5deg) scale(.8)}18%{opacity:1}62%{opacity:1;transform:translate(var(--cast-x),var(--cast-y)) rotate(var(--cast-rotate))}100%{opacity:0;transform:translate(var(--cast-end-x),var(--cast-end-y)) rotate(var(--cast-end-rotate))}}
        @keyframes six-walk-frame{0%,24.9%{opacity:1}25%,100%{opacity:0}}@keyframes six-stroll{from{transform:translate(-3px,0) rotate(-1deg)}to{transform:translate(4px,-3px) rotate(1deg)}}
        @keyframes six-curtain{from{opacity:0}to{opacity:1}}@keyframes six-stage-enter{from{opacity:0;transform:translateY(13px) scale(.99)}to{opacity:1;transform:none}}@keyframes six-celestial-turn{to{transform:translate(-50%,-50%) rotate(360deg)}}@keyframes six-seal-spin{to{transform:rotate(-360deg)}}@keyframes six-aurora{from{transform:translateX(-20%)}to{transform:translateX(20%)}}@keyframes six-star{50%{opacity:1;transform:scale(1.7)}}@keyframes six-wander{from{transform:translateY(0)}to{transform:translateY(-5px)}}@keyframes six-phrase-reveal{from{opacity:0;filter:blur(7px);transform:translateY(6px)}to{opacity:1;filter:none;transform:none}}@keyframes six-card-arrive{from{opacity:0;transform:rotateY(90deg) translateY(-15px)}to{opacity:1;transform:none}}@keyframes six-final-seal{to{box-shadow:0 0 38px #ca9b50,0 0 110px rgba(164,116,84,.85);transform:scale(1.06)}}
        /* Tamamo's crossroads is a staged rite, not a character picker. */
        .six-crossroads{border-color:rgba(122,71,78,.45);background:linear-gradient(145deg,rgba(255,249,235,.98),rgba(239,220,202,.96));box-shadow:0 18px 45px rgba(45,25,35,.2),inset 0 0 0 1px rgba(255,255,255,.55)}
        .six-crossroads>header{position:relative;z-index:8}.six-crossroads>header>span{border-color:#ab6a61;color:#f7e5c7;background:linear-gradient(145deg,#572d42,#9b5057);box-shadow:0 0 0 3px rgba(146,78,82,.14),0 5px 12px rgba(58,30,41,.25)}
        .tamamo-ritual{position:relative;min-height:420px;overflow:hidden;border:1px solid #6f4450;border-radius:3px;background:#35263d;box-shadow:inset 0 0 0 1px rgba(233,193,143,.18),inset 0 -55px 85px rgba(27,17,29,.5),0 8px 22px rgba(61,39,47,.18);isolation:isolate}
        .crossroads-sky{position:absolute;inset:0;overflow:hidden;background:radial-gradient(circle at 72% 22%,rgba(255,210,145,.52) 0 3%,rgba(231,142,112,.26) 4% 16%,transparent 30%),linear-gradient(180deg,#332b4e 0%,#68405d 32%,#b86762 58%,#553640 59%,#241d2b 100%)}
        .crossroads-sky::before{content:'';position:absolute;inset:53% -8% 0;background:linear-gradient(165deg,transparent 0 33%,rgba(16,15,24,.78) 34% 47%,transparent 48%),linear-gradient(195deg,transparent 0 35%,rgba(21,18,26,.92) 36% 50%,transparent 51%),linear-gradient(180deg,#45323e,#1d1922);clip-path:polygon(0 23%,39% 0,51% 19%,68% 2%,100% 28%,100% 100%,0 100%)}
        .crossroads-sky::after{content:'';position:absolute;left:50%;bottom:-98px;width:74%;height:290px;border:1px solid rgba(236,183,128,.16);border-radius:50%;background:radial-gradient(ellipse,rgba(202,123,102,.2),rgba(37,28,37,.12) 50%,rgba(11,12,18,.72) 72%);transform:translateX(-50%) perspective(260px) rotateX(55deg);box-shadow:inset 0 0 45px rgba(238,180,126,.12)}
        .crossroads-divination-map{position:absolute;z-index:1;inset:16px 24px 72px;color:rgba(231,210,169,.13);font:500 1.05rem/1 'Yu Mincho',serif;pointer-events:none}.crossroads-divination-map::before{content:'';position:absolute;left:50%;top:48%;width:250px;height:250px;border:1px solid currentColor;border-radius:50%;box-shadow:0 0 0 19px rgba(231,210,169,.018),0 0 0 45px rgba(231,210,169,.025),inset 0 0 0 32px rgba(231,210,169,.018);transform:translate(-50%,-50%)}.crossroads-divination-map::after{content:'';position:absolute;left:50%;top:48%;width:210px;height:210px;background:linear-gradient(30deg,transparent 48.8%,currentColor 49.4% 50.6%,transparent 51.2%),linear-gradient(150deg,transparent 48.8%,currentColor 49.4% 50.6%,transparent 51.2%),linear-gradient(90deg,transparent 48.8%,currentColor 49.4% 50.6%,transparent 51.2%);clip-path:polygon(50% 0,63% 28%,94% 25%,74% 50%,94% 75%,63% 72%,50% 100%,37% 72%,6% 75%,26% 50%,6% 25%,37% 28%);opacity:.52;transform:translate(-50%,-50%) rotate(4deg)}.crossroads-divination-map i{position:absolute;display:grid;width:45px;height:45px;place-items:center;border:1px solid currentColor;border-radius:50%;font-style:normal}.map-compass{left:8%;top:18%}.map-star{right:12%;top:7%}.map-hexagram{left:29%;bottom:8%}.map-sixstar{right:29%;bottom:4%}.map-number{right:4%;top:49%}.map-card{left:3%;top:58%;border-radius:3px!important}
        .crossroads-moon{position:absolute;top:48px;right:12%;width:42px;height:42px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff7d6,#edc486 62%,#b56e68);box-shadow:0 0 30px rgba(255,211,150,.55);opacity:.88}
        .crossroads-mist{position:absolute;z-index:2;width:74%;height:42px;border-radius:50%;background:radial-gradient(ellipse,rgba(231,218,212,.22),transparent 68%);filter:blur(5px);animation:crossroads-mist 9s ease-in-out infinite alternate}
        .mist-one{left:-10%;top:43%}.mist-two{right:-20%;top:65%;animation-delay:-4s;animation-direction:alternate-reverse}
        .crossroads-signpost{position:absolute;z-index:3;right:8%;bottom:55px;width:8px;height:99px;background:linear-gradient(90deg,#241a20,#6b4034,#21191e);transform:rotate(2deg)}
        .crossroads-signpost::before,.crossroads-signpost::after{content:'';position:absolute;right:-22px;width:64px;height:22px;border:1px solid #1d161a;background:linear-gradient(#6d4539,#3d292a);box-shadow:0 5px 8px rgba(0,0,0,.3)}
        .crossroads-signpost::before{top:5px;transform:rotate(-4deg);clip-path:polygon(0 0,82% 0,100% 50%,82% 100%,0 100%)}.crossroads-signpost::after{top:33px;right:-33px;transform:scaleX(-1) rotate(-3deg);clip-path:polygon(0 0,82% 0,100% 50%,82% 100%,0 100%)}
        .crossroads-road{position:absolute;z-index:1;left:50%;bottom:-18%;width:32%;height:84%;background:linear-gradient(90deg,transparent,rgba(221,159,117,.12),transparent);clip-path:polygon(44% 0,56% 0,100% 100%,0 100%);transform-origin:50% 0}
        .road-one{transform:translateX(-50%)}.road-two{transform:translateX(-50%) rotate(63deg)}
        .crossroads-torii{position:absolute;z-index:3;left:50%;top:68px;width:126px;height:153px;transform:translateX(-50%) scale(.86);filter:drop-shadow(0 12px 9px rgba(8,7,12,.55));opacity:.24}
        .crossroads-torii::before,.crossroads-torii::after{content:'';position:absolute;top:35px;width:12px;height:119px;background:linear-gradient(90deg,#2b111a,#7b3034,#301218)}.crossroads-torii::before{left:20px;transform:skewX(-2deg)}.crossroads-torii::after{right:20px;transform:skewX(2deg)}
        .crossroads-torii>i,.crossroads-torii>b{position:absolute;left:0;right:0;height:11px;background:linear-gradient(#a34a45,#5e222a 67%,#24131b)}.crossroads-torii>i{top:21px;clip-path:polygon(0 5%,100% 5%,94% 70%,65% 74%,65% 100%,35% 100%,35% 74%,6% 70%)}.crossroads-torii>b{left:13px;right:13px;top:49px;height:8px}
        .crossroads-lights i{position:absolute;z-index:4;bottom:53px;width:7px;height:39px;background:#20161c;box-shadow:0 4px 6px rgba(0,0,0,.45)}.crossroads-lights i::before{content:'';position:absolute;left:-5px;top:-13px;width:17px;height:21px;border:1px solid #5e302c;background:linear-gradient(90deg,#b7604d,#ffcf83,#b75d49);box-shadow:0 0 17px rgba(255,166,89,.72);animation:lantern-breathe 2.4s ease-in-out infinite alternate}.crossroads-lights i:nth-child(1){left:8%}.crossroads-lights i:nth-child(2){left:29%;bottom:84px;transform:scale(.72)}.crossroads-lights i:nth-child(3){right:29%;bottom:84px;transform:scale(.72)}.crossroads-lights i:nth-child(4){right:8%}
        .tamamo-presence{position:absolute;z-index:7;left:35px;bottom:28px;width:136px;height:238px;pointer-events:none;filter:drop-shadow(0 15px 13px rgba(12,7,14,.5));transition:transform .75s ease,opacity .6s ease}.phase-invocation .tamamo-presence{z-index:12;animation:tamamo-stage-entrance 3.15s cubic-bezier(.18,.84,.24,1) both}.phase-invocation .tamamo-presence::before{content:'';position:absolute;z-index:-1;left:50%;top:43%;width:220px;height:220px;border:1px solid rgba(255,210,155,.7);border-radius:50%;background:radial-gradient(circle,rgba(255,242,194,.42),rgba(156,97,178,.2) 35%,transparent 68%);box-shadow:0 0 38px rgba(224,122,164,.42),inset 0 0 30px rgba(255,231,170,.36);transform:translate(-50%,-50%);animation:tamamo-stage-aura 2.2s ease-out both}
        .phase-passers .tamamo-presence,.phase-reveal .tamamo-presence,.phase-kotodama .tamamo-presence,.phase-interpretation .tamamo-presence{transform:translate(-18px,19px) scale(.76);opacity:.88}
        .tamamo-figure{position:absolute;left:25px;bottom:0;width:90px;height:191px;animation:tamamo-arrive 1.05s cubic-bezier(.16,.8,.2,1) both}
        .tamamo-face{position:absolute;z-index:4;left:22px;top:24px;display:grid;width:47px;height:55px;place-items:center;border:1px solid rgba(102,43,55,.6);border-radius:48% 48% 44% 44%;color:#8e3e4e;background:linear-gradient(145deg,#f9e8d7,#d8a990);font:700 .65rem/1 'Yu Mincho',serif;box-shadow:inset 0 -8px 12px rgba(158,83,81,.14)}
        .tamamo-face::before{content:'';position:absolute;left:8px;right:8px;top:20px;height:6px;border-top:2px solid #633244;border-radius:50%;box-shadow:0 -1px 0 rgba(255,255,255,.45)}.tamamo-face::after{content:'';position:absolute;left:18px;bottom:9px;width:11px;height:4px;border-bottom:1px solid #7a3448;border-radius:50%}
        .tamamo-ear{position:absolute;z-index:2;top:2px;width:28px;height:48px;background:linear-gradient(125deg,#2d1b2d,#7a4258);clip-path:polygon(50% 0,100% 100%,0 82%)}.tamamo-ear.left{left:15px;transform:rotate(-16deg)}.tamamo-ear.right{right:15px;transform:scaleX(-1) rotate(-16deg)}
        .tamamo-hair{position:absolute;z-index:3;left:12px;top:19px;width:67px;height:78px;border-radius:48% 48% 42% 42%;background:linear-gradient(110deg,#221725,#644054 50%,#241824);clip-path:polygon(0 0,100% 0,94% 100%,77% 72%,71% 100%,50% 74%,29% 100%,22% 72%,6% 100%)}
        .tamamo-robe{position:absolute;z-index:2;left:3px;top:72px;width:84px;height:119px;border-radius:45% 45% 11% 11%;background:linear-gradient(90deg,#53283f,#a95561 30%,#e2a476 49%,#9c4d5c 67%,#4a263c);clip-path:polygon(20% 0,80% 0,100% 100%,0 100%);box-shadow:inset 0 0 0 1px rgba(237,191,133,.24)}.tamamo-robe::before{content:'◇';position:absolute;left:50%;top:29px;color:#f0c889;font-size:1.3rem;transform:translateX(-50%);text-shadow:0 22px #d9987a,0 44px #e9bf89}
        .tamamo-fan{position:absolute;z-index:6;right:-7px;top:93px;width:42px;height:51px;border:1px solid #775443;border-radius:70% 70% 8% 8%;background:repeating-linear-gradient(82deg,#e7cda5 0 2px,#ab7e60 3px,#e8cda5 5px);transform:rotate(21deg);transform-origin:50% 100%}
        .fox-fire{position:absolute;z-index:8;width:22px;height:34px;border-radius:58% 42% 65% 35%;background:radial-gradient(circle at 50% 66%,#fffbd7 0 14%,#8de6dc 34%,#5e77c9 62%,transparent 65%);filter:blur(.2px) drop-shadow(0 0 9px #88dcd8);animation:fox-fire 1.8s ease-in-out infinite alternate}.fire-one{left:3px;top:73px}.fire-two{right:0;top:39px;animation-delay:-.7s}.fire-three{right:7px;bottom:15px;transform:scale(.7);animation-delay:-1.2s}
        .tamamo-petals i{position:absolute;z-index:9;left:50%;top:43%;width:8px;height:5px;border-radius:80% 0 80% 0;background:#e8a0a5;opacity:.8;animation:tamamo-petal 3.8s calc(var(--petal)*-.43s) linear infinite}
        .tamamo-invocation,.tamamo-interpretation{position:absolute;z-index:9;left:190px;right:28px;top:86px;padding:18px 21px;border:1px solid rgba(225,185,132,.48);border-left:3px solid #b86370;background:linear-gradient(105deg,rgba(35,23,39,.93),rgba(64,36,52,.88));box-shadow:0 13px 30px rgba(16,10,18,.35),inset 0 0 24px rgba(200,114,119,.06);animation:oracle-voice-in .65s ease both}.phase-invocation .tamamo-invocation{opacity:0;animation:oracle-voice-in .4s 1.85s ease both}
        .tamamo-invocation>span,.tamamo-interpretation>span{display:block;margin-bottom:8px;color:#d7ad7c;font:700 .67rem/1 'Yu Mincho',serif;letter-spacing:.18em}.tamamo-invocation blockquote,.tamamo-interpretation blockquote{margin:0;padding:0;border:0;border-radius:0;color:#fff3dd;background:none;box-shadow:none;font:600 1rem/1.85 'Yu Mincho',serif;letter-spacing:.065em;text-shadow:0 2px 8px rgba(0,0,0,.45)}.tamamo-invocation>small{display:block;margin-top:14px;color:#ae9ca8;font:.61rem/1.6 'Yu Mincho',serif;letter-spacing:.12em}
        .tamamo-interpretation{top:auto;bottom:28px;left:181px;right:25px;border-left-color:#d29c62;background:linear-gradient(105deg,rgba(48,25,39,.96),rgba(76,39,54,.91))}.tamamo-interpretation::before{content:'';position:absolute;left:-10px;bottom:23px;width:17px;height:17px;border-left:1px solid rgba(225,185,132,.48);border-bottom:1px solid rgba(225,185,132,.48);background:#3a2334;transform:rotate(45deg)}
        .crossroads-passers{position:absolute;z-index:5;inset:82px -11px 52px;overflow:hidden;perspective:620px}
        .crossroads-passers button{position:absolute;bottom:var(--passer-y);left:-17%;width:68px;height:180px;border:0;padding:0;background:transparent;cursor:pointer;filter:drop-shadow(0 12px 10px rgba(5,4,8,.68));transform:scale(var(--passer-scale));transform-origin:50% 100%;animation:crowd-left-to-right var(--passer-duration) var(--passer-delay) linear infinite;transition:opacity .55s,filter .35s}.crossroads-passers button.direction-rtl{left:108%;animation-name:crowd-right-to-left}.crossroads-passers button.depth-far{z-index:1;opacity:.38;filter:blur(.55px) drop-shadow(0 7px 6px rgba(5,4,8,.45))}.crossroads-passers button.depth-middle{z-index:3;opacity:.72}.crossroads-passers button.depth-near{z-index:5;opacity:.92}.crossroads-passers button:hover,.crossroads-passers button:focus-visible{outline:0;filter:drop-shadow(0 0 13px rgba(183,245,179,.66)) drop-shadow(0 13px 9px rgba(4,3,6,.7))}.crossroads-passers button.is-selected{z-index:7;animation-play-state:paused;opacity:1;filter:drop-shadow(0 0 19px #8be7a0) drop-shadow(0 14px 10px rgba(4,3,6,.72))}.crossroads-passers button.is-faded{opacity:.07;filter:blur(3px)}.phase-reveal .crossroads-passers button,.phase-interpretation .crossroads-passers button{animation-play-state:paused}.crossroads-passers button.direction-rtl .passer-shadow{transform:scaleX(-1)}
        .passer-shadow{position:absolute;inset:0;display:block}.passer-head{position:absolute;z-index:2;left:50%;top:16px;width:31px;height:36px;border-radius:48%;background:linear-gradient(90deg,#100d15,#2b1d2a 54%,#0d0b10);transform:translateX(-50%)}.passer-body{position:absolute;left:50%;top:46px;width:56px;height:131px;border-radius:44% 44% 10% 10%;background:linear-gradient(90deg,#0c0b10,#2a1b29 48%,#09090d);clip-path:polygon(27% 0,73% 0,94% 94%,73% 100%,50% 94%,27% 100%,6% 94%);transform:translateX(-50%);box-shadow:inset 9px 0 12px rgba(255,205,159,.035)}.passer-prop{position:absolute;z-index:3;background:#151019}
        .crossroads-passers button>span{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
        .crossroads-passers .is-monk .passer-head{top:7px;width:33px;height:43px;border-radius:50% 50% 44% 44%;box-shadow:0 -7px 0 -2px #171019}.crossroads-passers .is-monk .passer-body{width:61px;clip-path:polygon(25% 0,75% 0,84% 100%,16% 100%)}.crossroads-passers .is-monk .passer-prop{right:4px;top:40px;width:3px;height:130px;transform:rotate(2deg)}
        .crossroads-passers .is-lady .passer-head{top:12px;width:28px;height:39px}.crossroads-passers .is-lady .passer-body{width:67px;clip-path:polygon(31% 0,69% 0,100% 100%,0 100%)}.crossroads-passers .is-lady .passer-prop{left:8px;top:66px;width:48px;height:27px;border-radius:50% 50% 4px 4px;background:#211622;transform:rotate(-5deg)}
        .crossroads-passers .is-traveler .passer-head{top:13px}.crossroads-passers .is-traveler .passer-body{width:51px}.crossroads-passers .is-traveler .passer-prop{right:-3px;top:49px;width:24px;height:74px;border-radius:50% 50% 12% 12%;background:#1e151e;transform:rotate(-9deg)}
        .crossroads-passers .is-child{height:139px}.crossroads-passers .is-child .passer-head{top:24px;width:27px;height:31px}.crossroads-passers .is-child .passer-body{top:51px;width:45px;height:87px}.crossroads-passers .is-child .passer-prop{display:none}
        .crossroads-passers .is-courtier .passer-head{top:13px}.crossroads-passers .is-courtier .passer-head::before{content:'';position:absolute;left:10px;bottom:27px;width:11px;height:25px;background:#151019;clip-path:polygon(20% 0,80% 0,100% 100%,0 100%)}.crossroads-passers .is-courtier .passer-body{width:63px}.crossroads-passers .is-courtier .passer-prop{left:-5px;top:68px;width:58px;height:29px;border-radius:50%;background:#1c131d;transform:rotate(9deg)}
        .crossroads-omen{position:absolute;z-index:6;left:55%;top:55%;width:82px;height:58px;opacity:0;transform:translate(-50%,-50%);pointer-events:none;animation:crossroads-omen-glimpse 12s -6s ease-in-out infinite}.crossroads-omen i{position:absolute;left:50%;top:50%;width:8px;height:8px;border:1px solid rgba(193,255,188,.95);border-radius:50%;background:#b9f8af;box-shadow:0 0 7px #b9f8af,0 0 18px rgba(95,225,121,.88),0 0 34px rgba(95,225,121,.45);transform:translate(-50%,-50%)}.crossroads-omen b{position:absolute;left:4px;right:4px;top:50%;height:1px;background:linear-gradient(90deg,transparent,#8de79b 20% 80%,transparent);box-shadow:0 0 7px rgba(111,236,137,.8);transform:rotate(-12deg) scaleX(.2);animation:fate-thread 12s -6s ease-in-out infinite}.phase-reveal .crossroads-omen{animation:crossroads-omen-capture 1.25s ease-out both}.phase-reveal .crossroads-omen b{animation:fate-thread-capture 1.25s ease-out both}.phase-interpretation .crossroads-omen{display:none}
        .crossroads-guidance{position:absolute;z-index:8;left:50%;bottom:22px;display:flex;min-width:340px;flex-direction:column;align-items:center;padding:9px 18px;color:#f5dfc0;background:linear-gradient(90deg,transparent,rgba(26,18,28,.82) 15% 85%,transparent);transform:translateX(-50%);text-align:center;animation:crossroads-guidance-in .6s ease both}.crossroads-guidance b{font:700 .78rem/1.5 'Yu Mincho',serif;letter-spacing:.16em}.crossroads-guidance small{margin-top:2px;color:#c8b1ae;font:.59rem/1.5 sans-serif}
        .crossroads-word{position:absolute;z-index:10;left:50%;top:50%;width:min(440px,72%);padding:19px 28px 22px;border:1px solid #c49a63;color:#44312e;background:linear-gradient(96deg,#efe0bd,#fff8de 47%,#e8d4ad);box-shadow:0 15px 36px rgba(8,5,10,.55),inset 0 0 28px rgba(129,76,53,.09);transform:translate(-50%,-50%) rotate(-.7deg);animation:word-talisman-in .75s cubic-bezier(.2,.8,.2,1) both}.crossroads-word::before,.crossroads-word::after{content:'';position:absolute;top:8px;bottom:8px;width:1px;background:rgba(128,79,52,.25)}.crossroads-word::before{left:10px}.crossroads-word::after{right:10px}.crossroads-word small{display:block;margin-bottom:8px;color:#9a5c56;font:700 .58rem/1 'Yu Mincho',serif;letter-spacing:.2em}.crossroads-word blockquote{margin:0;border:0;color:#3c2a2c;background:none;box-shadow:none;font:700 1.05rem/1.8 'Yu Mincho',serif;letter-spacing:.07em;text-align:center}.phase-interpretation .crossroads-word{top:33%;width:min(390px,62%);padding:13px 20px 15px;transform:translate(-30%,-50%) rotate(-.4deg);animation:none}.phase-interpretation .crossroads-word blockquote{font-size:.83rem}
        .six-crossroads>.six-next{position:relative;z-index:10;isolation:isolate;justify-self:center;min-width:min(100%,330px);min-height:52px;margin-top:16px;padding:12px 26px;border:2px solid #e4bd78;outline:1px solid rgba(91,42,61,.82);outline-offset:3px;color:#fff7e2;background:linear-gradient(135deg,#8e5264,#4b283c 58%,#2d1b2c);box-shadow:0 5px 0 #21121e,0 11px 22px rgba(38,25,34,.42),inset 0 1px rgba(255,237,196,.38);font-size:.82rem;font-weight:700;line-height:1.5;text-align:center;text-shadow:0 2px 3px rgba(19,8,15,.85)}.six-crossroads>.six-next:hover{border-color:#ffe0a0;background:linear-gradient(135deg,#a96375,#5b304a 58%,#352032);filter:brightness(1.08)}
        /* Portrait assets supplied for the six diviners. */
        .six-master-picker button{grid-template-columns:96px minmax(0,1fr);min-height:148px;align-items:start;gap:12px;padding:12px}.diviner-card-art{position:relative;display:block!important;grid-column:1;grid-row:1;width:96px;height:96px;overflow:hidden;border:1px solid rgba(83,48,31,.55);border-radius:2px;background:#231a20;box-shadow:0 4px 9px rgba(50,30,20,.28)}.diviner-card-art img{display:block;width:100%;height:100%;object-fit:cover;object-position:50% 8%;transform:scale(2.8);transform-origin:50% 4%}.six-master-picker .diviner-card-info{grid-column:2;grid-row:1;align-content:start;gap:6px;text-align:left}.six-master-picker .diviner-card-title{gap:2px;text-align:left}.six-master-picker .diviner-card-info b{font-size:.84rem}.six-master-picker .diviner-card-info small{font-size:.6rem}.six-master-picker .diviner-card-info em{display:-webkit-box;overflow:hidden;color:inherit;font-size:.62rem;line-height:1.55;-webkit-box-orient:vertical;-webkit-line-clamp:2}.six-master-picker button[data-diviner-id="taikobo"] .diviner-card-art img{transform:translateY(9%) scale(2.72);transform-origin:50% 0}.six-master-picker button[data-diviner-id="saint-germain"] .diviner-card-art img{transform:translateY(3%) scale(2.35);transform-origin:50% 0}.six-master-picker button.is-selected{grid-template-columns:116px minmax(0,1fr);min-height:158px;padding:13px}.six-master-picker button.is-selected .diviner-card-art{width:116px;height:116px;border-color:#f1ca81;box-shadow:0 0 18px rgba(222,166,76,.48)}.six-master-picker button.is-selected .diviner-card-info{min-height:116px;gap:8px}.six-master-picker button.is-selected .diviner-card-info b{font-size:.92rem}
        .iching-footer .taikobo-art{position:relative;z-index:2;align-self:end;width:88px;height:132px;object-fit:contain;object-position:center bottom;mix-blend-mode:screen;filter:drop-shadow(0 9px 8px rgba(0,0,0,.48));pointer-events:none;animation:six-note-arrive .45s .08s both}
        .tamamo-art{position:absolute;z-index:5;inset:0;width:100%;height:100%;object-fit:contain;object-position:center bottom;mix-blend-mode:screen;filter:drop-shadow(0 11px 10px rgba(10,5,12,.5));animation:tamamo-arrive 1.05s cubic-bezier(.16,.8,.2,1) both}.germain-art{position:absolute;z-index:2;inset:0;width:100%;height:100%;object-fit:contain;object-position:center bottom;mix-blend-mode:screen;filter:drop-shadow(0 14px 12px rgba(8,5,15,.55));animation:germain-arrive 1.1s cubic-bezier(.17,.78,.22,1) both}
        .six-reading-portrait{width:52px;height:62px;border:1px solid #a47854;border-radius:2px;object-fit:cover;object-position:50% 16%;background:#251b20;box-shadow:0 3px 8px rgba(55,31,21,.22)}
        /* Saint-Germain spreads a full deck as a ritual rather than a catalogue. */
        .six-tarot{border-color:rgba(93,59,100,.46);background:linear-gradient(145deg,rgba(255,250,235,.98),rgba(231,215,218,.96));box-shadow:0 18px 44px rgba(45,25,48,.19),inset 0 0 0 1px rgba(255,255,255,.62)}
        .six-tarot>header{position:relative;z-index:8}.six-tarot>header>span{border-color:#8d6940;color:#f7e8ba;background:linear-gradient(145deg,#281b3e,#674064 62%,#8d3d50);box-shadow:0 0 0 3px rgba(111,74,112,.13),0 5px 12px rgba(45,27,51,.26)}
        .tarot-ritual{position:relative;min-height:500px;overflow:hidden;border:1px solid #60455f;border-radius:3px;background:linear-gradient(145deg,#2c203d,#4d2b48 52%,#2a1c34);box-shadow:inset 0 0 0 1px rgba(220,181,109,.2),inset 0 -70px 95px rgba(12,8,22,.38),0 9px 24px rgba(44,26,51,.2);isolation:isolate}
        .tarot-velvet{position:absolute;inset:0;overflow:hidden;background:radial-gradient(ellipse at 50% 38%,rgba(134,76,119,.42),transparent 43%),linear-gradient(120deg,rgba(16,12,28,.62),transparent 35% 63%,rgba(72,25,48,.33));pointer-events:none}
        .tarot-velvet::before{content:'';position:absolute;left:50%;top:47%;width:540px;height:540px;border:1px solid rgba(204,167,95,.14);border-radius:50%;box-shadow:0 0 0 24px rgba(204,167,95,.025),0 0 0 58px rgba(204,167,95,.035),inset 0 0 55px rgba(9,6,16,.26);transform:translate(-50%,-50%)}
        .tarot-velvet::after{content:'✦  ☾  ✧  ♄  ✦  ♀  ✧  ☉  ✦';position:absolute;left:50%;top:46%;width:430px;color:rgba(211,177,111,.18);font:500 1rem/1 serif;letter-spacing:1.55rem;transform:translate(-50%,-50%) rotate(-12deg);white-space:nowrap}
        .tarot-velvet>i{position:absolute;width:1px;height:1px;background:#e7c67e;box-shadow:42px 15px #b66b8b,91px 68px #e8cb8b,141px 19px #ab6e9b,202px 73px #efd79f,257px 25px #a85c80,318px 57px #d4a76f,388px 13px #d7b775,441px 89px #8e5f98,501px 35px #e9c47c;animation:tarot-stars 3s ease-in-out infinite alternate}.tarot-velvet>i:nth-child(1){left:7%;top:13%}.tarot-velvet>i:nth-child(2){left:16%;top:41%;transform:rotate(37deg);animation-delay:-1.1s}.tarot-velvet>i:nth-child(3){left:3%;top:75%;animation-delay:-2s}
        .tarot-orbit-ring{position:absolute;left:50%;top:46%;width:350px;height:205px;border:1px solid rgba(221,184,112,.13);border-radius:50%;transform:translate(-50%,-50%) rotate(-7deg)}.tarot-orbit-ring::before,.tarot-orbit-ring::after{content:'';position:absolute;inset:18px;border:1px solid rgba(221,184,112,.08);border-radius:50%;transform:rotate(23deg)}.tarot-orbit-ring::after{inset:47px;transform:rotate(-31deg)}
        .germain-presence{position:absolute;z-index:8;left:26px;bottom:20px;width:146px;height:270px;filter:drop-shadow(0 17px 15px rgba(8,5,15,.55));pointer-events:none;transition:opacity .7s ease,transform .8s ease;transform-origin:left bottom}.ritual-selection .germain-presence{opacity:.42;transform:translate(-27px,16px) scale(.68)}.ritual-locked .germain-presence,.ritual-revealing .germain-presence{opacity:.58;transform:translate(-19px,12px) scale(.76)}.ritual-complete .germain-presence{opacity:.9;transform:translate(-8px,4px) scale(.86)}
        .germain-silhouette{position:absolute;left:23px;bottom:0;width:104px;height:232px;animation:germain-arrive 1.1s cubic-bezier(.17,.78,.22,1) both}.germain-head{position:absolute;z-index:4;left:35px;top:29px;width:43px;height:53px;border:1px solid #9e754c;border-radius:50% 50% 44% 44%;background:linear-gradient(145deg,#f1dcc3,#cda98c);box-shadow:inset 0 -8px 13px rgba(88,48,63,.15)}.germain-head::before{content:'';position:absolute;left:8px;right:8px;top:22px;height:5px;border-top:2px solid #563947;border-radius:50%}.germain-head::after{content:'';position:absolute;left:16px;bottom:9px;width:12px;height:5px;border-bottom:2px solid #8b485d;border-radius:50%;transform:rotate(-4deg)}
        .germain-hair{position:absolute;z-index:3;left:19px;top:12px;width:78px;height:91px;border-radius:48% 52% 42% 47%;background:radial-gradient(circle at 25% 25%,#ede1d0 0 8%,#b99b9f 29%,#625064 65%,#2b2035);clip-path:polygon(17% 0,83% 0,100% 43%,84% 100%,68% 78%,55% 100%,43% 77%,29% 100%,11% 77%,0 39%)}
        .germain-body{position:absolute;z-index:2;left:7px;top:79px;width:94px;height:153px;border-radius:39% 39% 10% 10%;background:linear-gradient(90deg,#170f25,#40254c 25%,#7c3c59 49%,#3c2247 73%,#140e21);clip-path:polygon(21% 0,79% 0,100% 100%,0 100%);box-shadow:inset 0 0 0 1px rgba(218,178,104,.24)}.germain-body::before{content:'';position:absolute;left:50%;top:10px;width:44px;height:93px;border:1px solid rgba(224,184,105,.32);clip-path:polygon(0 0,100% 0,73% 100%,27% 100%);transform:translateX(-50%)}
        .germain-cane{position:absolute;z-index:5;right:-6px;top:94px;width:5px;height:135px;border-radius:5px;background:linear-gradient(90deg,#4e341e,#d1a358,#4d311d);transform:rotate(-4deg)}.germain-cane::before{content:'';position:absolute;left:-6px;top:-11px;width:16px;height:16px;border:3px solid #c89a53;border-bottom-color:transparent;border-radius:50%}
        .germain-brooch{position:absolute;z-index:6;left:47px;top:91px;display:grid;width:23px;height:23px;place-items:center;border:1px solid #f0cd7e;border-radius:50%;color:#f4d98e;background:#4c274b;font:700 .54rem/1 serif;box-shadow:0 0 12px rgba(232,190,102,.48)}
        .germain-particles i{position:absolute;z-index:8;left:50%;top:45%;width:4px;height:4px;border:1px solid #e5bd68;background:#8d527f;transform:rotate(45deg);animation:germain-particle 4.4s calc(var(--particle)*-.37s) ease-in-out infinite}
        .germain-introduction,.germain-ritual-voice{position:absolute;z-index:10;left:184px;right:27px;top:91px;padding:18px 21px;border:1px solid rgba(216,178,104,.49);border-left:3px solid #a95a79;background:linear-gradient(105deg,rgba(27,18,42,.95),rgba(75,37,69,.9));box-shadow:0 15px 34px rgba(9,6,17,.4),inset 0 0 27px rgba(206,129,168,.06);animation:oracle-voice-in .65s ease both}.germain-introduction>span,.germain-ritual-voice>span{display:block;margin-bottom:8px;color:#ddb875;font:700 .67rem/1 'Yu Mincho',serif;letter-spacing:.16em}.germain-introduction blockquote,.germain-ritual-voice blockquote{margin:0;padding:0;border:0;border-radius:0;color:#fff5df;background:none;box-shadow:none;font:600 .94rem/1.85 'Yu Mincho',serif;letter-spacing:.055em;text-shadow:0 2px 9px rgba(0,0,0,.55)}.germain-introduction>small{display:block;margin-top:13px;color:#b9a7bb;font:.6rem/1.5 'Yu Mincho',serif;letter-spacing:.11em}
        .tarot-selection-stage{position:absolute;z-index:5;inset:0;animation:tarot-table-in .8s ease both}.tarot-fan-scroll{position:absolute;inset:0}.tarot-fan{position:absolute;left:50%;top:38px;width:1px;height:280px;transform:translateX(-50%)}
        .tarot-fan button{--lift:0px;position:absolute;left:0;top:19px;width:76px;height:127px;padding:0;border:0;background:transparent;transform-origin:50% 185px;transform:translateX(calc(-50% + var(--fan-x))) translateY(calc(var(--fan-y) + var(--lift))) rotate(var(--fan-angle));filter:drop-shadow(0 9px 8px rgba(6,4,12,.52));transition:filter .25s,opacity .45s,transform .35s;cursor:pointer}.tarot-fan button:hover,.tarot-fan button:focus-visible{--lift:-18px;z-index:30;outline:0;filter:drop-shadow(0 0 12px rgba(230,189,104,.8)) drop-shadow(0 14px 10px rgba(5,3,9,.6))}.tarot-fan button.is-taken{--lift:-35px;opacity:0;pointer-events:none;filter:drop-shadow(0 0 16px #dcb35e)}
        .tarot-card-back{position:absolute;inset:0;display:grid;place-items:center;overflow:hidden;border:1px solid #b49150;border-radius:4px;color:#dfbd72;background:radial-gradient(circle at 50% 43%,#6b3e67 0 9%,#2c1c43 10% 23%,#8a3f57 24% 25%,#251a38 26% 52%,#141023 53%);box-shadow:inset 0 0 0 4px #1d152e,inset 0 0 0 5px rgba(217,178,97,.58),0 8px 16px rgba(0,0,0,.38);backface-visibility:hidden}.tarot-card-back::before{content:'';position:absolute;width:45px;height:45px;border:1px solid rgba(228,192,110,.7);transform:rotate(45deg);box-shadow:0 0 0 7px rgba(180,95,125,.11)}.tarot-card-back::after{content:'';position:absolute;inset:10px;border:1px solid rgba(215,174,91,.38);border-radius:50%}.tarot-card-back>i{z-index:2;color:#f1d58f;font:normal 1.3rem/1 serif;text-shadow:0 0 10px #dca956}.tarot-card-back>b{position:absolute;z-index:2;bottom:13px;font:600 .46rem/1 serif;letter-spacing:.16em}
        .tarot-selection-guide{position:absolute;left:50%;top:225px;display:flex;width:min(410px,80%);flex-direction:column;align-items:center;margin:0;padding:8px 22px;color:#f4dfb8;background:linear-gradient(90deg,transparent,rgba(24,16,36,.82) 15% 85%,transparent);transform:translateX(-50%);text-align:center}.tarot-selection-guide b{font:700 .78rem/1.5 'Yu Mincho',serif;letter-spacing:.15em}.tarot-selection-guide small{color:#baaebd;font:.58rem/1.55 sans-serif}
        .tarot-ritual-spread{position:absolute;z-index:12;left:50%;display:grid;grid-template-columns:repeat(3,1fr);gap:18px;width:min(410px,80%);transform:translateX(-50%);transition:top .75s ease,bottom .75s ease,width .75s ease}.tarot-ritual-spread.count-1{grid-template-columns:1fr}.tarot-ritual-spread.count-2{grid-template-columns:repeat(2,1fr)}.tarot-ritual-spread.is-dock{bottom:13px;width:min(304px,64%);gap:12px}.tarot-ritual-spread.is-dock.count-1{width:78px}.tarot-ritual-spread.is-dock.count-2{width:178px}.tarot-ritual-spread.is-center{top:105px;width:min(420px,82%)}
        .tarot-position{position:relative;display:grid;min-width:0;justify-items:center;gap:6px;perspective:850px}.tarot-position>small{color:#d8b974;font:700 .62rem/1 'Yu Mincho',serif;letter-spacing:.2em;text-shadow:0 2px 7px #000}.tarot-flip-card{position:relative;width:92px;height:149px;transform-style:preserve-3d;transition:transform .78s cubic-bezier(.2,.76,.22,1);filter:drop-shadow(0 11px 10px rgba(4,2,9,.45))}.is-dock .tarot-flip-card{width:65px;height:104px}.tarot-position:not(.has-card) .tarot-flip-card{border:1px dashed rgba(219,181,108,.27);border-radius:4px;background:rgba(255,255,255,.025)}.tarot-position.is-revealed .tarot-flip-card{transform:none;animation:tarot-card-flip .78s cubic-bezier(.2,.76,.22,1) both}.tarot-position .tarot-card-back{transition:opacity .12s .34s,transform .72s}.tarot-position .tarot-card-front{opacity:0;transform:rotateY(-180deg);transition:opacity .12s .34s,transform .72s}.tarot-position.is-revealed .tarot-card-back{opacity:0;transform:rotateY(180deg)}.tarot-position.is-revealed .tarot-card-front{opacity:1;transform:rotateY(0)}
        .tarot-card-front{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:12px 8px;border:1px solid #b18a4d;border-radius:4px;color:#37283e;background:radial-gradient(circle at 50% 40%,rgba(181,119,151,.17),transparent 35%),linear-gradient(150deg,#fff8dc,#e8d6b2);box-shadow:inset 0 0 0 4px #eee0bd,inset 0 0 0 5px #9f7b48;transform:rotateY(180deg);backface-visibility:hidden;text-align:center}.tarot-card-front::before,.tarot-card-front::after{content:'✦';position:absolute;color:#9a5d78;font-size:.55rem}.tarot-card-front::before{left:8px;top:8px}.tarot-card-front::after{right:8px;bottom:8px}.tarot-card-front .tarot-front-mark{display:grid;width:38px;height:38px;place-items:center;border:1px solid #a7834d;border-radius:50%;color:#8a4f6b;font:normal 1.1rem/1 serif;background:rgba(255,255,255,.35);box-shadow:0 0 12px rgba(145,84,105,.12)}.tarot-position.is-reversed .tarot-front-mark{transform:rotate(180deg)}.tarot-card-front b{font:700 .69rem/1.35 'Yu Mincho',serif}.tarot-card-front em{color:#9b5367;font:700 .56rem/1 sans-serif;font-style:normal;letter-spacing:.1em}.tarot-position.is-revealed::after{content:'';position:absolute;left:50%;top:52%;width:135px;height:135px;border-radius:50%;background:radial-gradient(circle,rgba(242,206,126,.3),transparent 65%);transform:translate(-50%,-50%);z-index:-1;animation:tarot-reveal-glow 1s ease-out both}
        .germain-ritual-voice{left:173px;right:24px;top:auto;bottom:20px;padding:13px 17px}.germain-ritual-voice::before{content:'';position:absolute;left:-9px;bottom:23px;width:16px;height:16px;border-left:1px solid rgba(216,178,104,.49);border-bottom:1px solid rgba(216,178,104,.49);background:#35213f;transform:rotate(45deg)}.germain-ritual-voice.is-serious{border-left-color:#c19a5b;background:linear-gradient(105deg,rgba(19,13,32,.97),rgba(66,31,57,.94))}.germain-ritual-voice.is-final{background:linear-gradient(105deg,rgba(35,20,48,.96),rgba(91,41,65,.91))}.ritual-revealing .tarot-ritual-spread,.ritual-complete .tarot-ritual-spread{top:67px}.ritual-revealing .germain-ritual-voice,.ritual-complete .germain-ritual-voice{bottom:17px}
        .tarot-complete-button{position:relative;z-index:10;margin-top:4px!important;align-self:center;background:linear-gradient(#704262,#3c294c)!important;box-shadow:0 5px 0 #241a31,0 9px 17px rgba(38,25,43,.25)!important}
        .converge-hexagram{position:absolute;z-index:1;inset:0;width:100%;height:100%;overflow:visible;filter:drop-shadow(0 0 7px rgba(205,155,77,.34));pointer-events:none}.converge-hexagram line{stroke:#c08b4d;stroke-width:1.6;stroke-linecap:round;stroke-dasharray:430;stroke-dashoffset:430;opacity:0}.converge-hexagram line.is-drawn{animation:converge-line-draw .33s cubic-bezier(.2,.75,.2,1) forwards}.converge-hexagram .converge-ray{stroke:#efd58e;stroke-width:1.2;stroke-dasharray:160;stroke-dashoffset:160}.converge-hexagram .converge-ray.is-drawn{animation:converge-ray-draw .36s calc(var(--ray)*.05s) ease-out forwards}.converge-core-ring{fill:rgba(106,68,94,.18);stroke:#efd48a;stroke-width:1.2;opacity:0;transform-origin:190px 180px}.converge-orbit.is-complete .converge-core-ring{animation:converge-core-open .8s .38s ease-out forwards}.converge-orbit>div{z-index:3}.converge-orbit.is-complete>div{top:137px;left:151px;opacity:1;transform:rotate(var(--angle)) translateY(-132px) rotate(calc(var(--angle)*-1)) scale(.92);filter:drop-shadow(0 0 9px rgba(234,197,120,.55));transition-delay:0ms}.converge-orbit.is-complete::after{z-index:4}.six-converge:has(.converge-orbit.is-complete) p{animation:converge-message-in .58s .48s ease both}
        .converge-orbit>div{transition-delay:var(--mark-delay,0ms)}.converge-orbit.is-complete::after{transition-delay:.46s}.converge-orbit.is-complete .converge-core-ring{animation-delay:.46s}
        @keyframes germain-arrive{0%{opacity:0;transform:translateY(67px) scale(.8);filter:blur(5px)}65%{opacity:1;transform:translateY(-5px) scale(1.02);filter:blur(0)}100%{transform:none}}
        @keyframes germain-particle{0%{opacity:0;transform:translate(-80px,90px) rotate(0) scale(.5)}22%{opacity:.85}65%{opacity:.6}100%{opacity:0;transform:translate(110px,-120px) rotate(320deg) scale(1.2)}}
        @keyframes tarot-stars{from{opacity:.28;filter:brightness(.75)}to{opacity:.95;filter:brightness(1.25)}}
        @keyframes tarot-table-in{from{opacity:0;transform:scale(.94);filter:blur(3px)}to{opacity:1;transform:none;filter:blur(0)}}
        @keyframes tarot-card-flip{0%{transform:scaleX(1)}48%{transform:scaleX(.06);filter:brightness(1.7)}100%{transform:scaleX(1);filter:none}}
        @keyframes tarot-reveal-glow{0%{opacity:0;transform:translate(-50%,-50%) scale(.45)}42%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(1.4)}}
        @keyframes converge-line-draw{0%{opacity:0;stroke-dashoffset:430}22%{opacity:1}100%{opacity:.86;stroke-dashoffset:0}}
        @keyframes converge-ray-draw{0%{opacity:0;stroke-dashoffset:160}100%{opacity:.8;stroke-dashoffset:0}}
        @keyframes converge-core-open{0%{opacity:0;transform:scale(.25)}55%{opacity:1;transform:scale(1.16)}100%{opacity:.9;transform:scale(1)}}
        @keyframes converge-message-in{from{opacity:0;transform:translateY(8px);letter-spacing:.22em}to{opacity:1;transform:none;letter-spacing:.14em}}
        @keyframes tamamo-arrive{0%{opacity:0;transform:translateY(58px) scale(.83);filter:blur(4px)}58%{opacity:1;transform:translateY(-6px) scale(1.02);filter:blur(0)}100%{transform:translateY(0) scale(1)}}
        @keyframes tamamo-stage-entrance{0%{opacity:0;transform:translate(205px,52px) scale(.38);filter:blur(6px)}18%{opacity:1;transform:translate(205px,-5px) scale(1.82);filter:blur(0)}48%{opacity:1;transform:translate(205px,-14px) scale(1.95)}72%{opacity:1;transform:translate(58px,-5px) scale(1.22)}100%{opacity:.88;transform:translate(-18px,19px) scale(.76)}}
        @keyframes tamamo-stage-entrance-mobile{0%{opacity:0;transform:translate(118px,48px) scale(.4);filter:blur(6px)}18%{opacity:1;transform:translate(118px,-4px) scale(1.58);filter:blur(0)}48%{opacity:1;transform:translate(118px,-12px) scale(1.68)}72%{opacity:1;transform:translate(34px,-4px) scale(1.14)}100%{opacity:.9;transform:translate(-15px,22px) scale(.64)}}
        @keyframes tamamo-stage-aura{0%{opacity:0;transform:translate(-50%,-50%) scale(.28)}18%{opacity:1;transform:translate(-50%,-50%) scale(1.15)}58%{opacity:.75;transform:translate(-50%,-50%) scale(1.42)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.8)}}
        @keyframes fox-fire{0%{transform:translateY(5px) rotate(-8deg) scale(.88);opacity:.58}100%{transform:translateY(-7px) rotate(7deg) scale(1.08);opacity:1}}
        @keyframes tamamo-petal{0%{transform:translate(-65px,-58px) rotate(0);opacity:0}18%{opacity:.85}100%{transform:translate(105px,105px) rotate(280deg);opacity:0}}
        @keyframes crossroads-mist{from{transform:translateX(-5%) scaleX(.9);opacity:.32}to{transform:translateX(20%) scaleX(1.13);opacity:.58}}
        @keyframes lantern-breathe{from{filter:brightness(.82);opacity:.8}to{filter:brightness(1.18);opacity:1}}
        @keyframes passer-drift{from{transform:translateX(-8px) translateY(2px)}to{transform:translateX(8px) translateY(-2px)}}
        @keyframes crowd-left-to-right{0%{left:-17%}100%{left:108%}}
        .phase-kotodama .crossroads-passers button{animation-play-state:paused}.crossroads-kotodama{border-color:#d5a95a;background:radial-gradient(circle at 50% 42%,#fff9de 0,#f2ddb0 53%,#d8b56d 100%);box-shadow:0 0 0 7px rgba(235,193,96,.14),0 14px 36px rgba(0,0,0,.35)}.crossroads-kotodama blockquote{color:#6c3e31;font-size:1.45rem;letter-spacing:.18em;text-shadow:0 1px #fff4cf}
        @keyframes crowd-right-to-left{0%{left:108%}100%{left:-17%}}
        @keyframes crossroads-omen-glimpse{0%,43%,57%,100%{opacity:0}47%{opacity:.2}50%{opacity:1}53%{opacity:.24}}
        @keyframes fate-thread{0%,43%,57%,100%{opacity:0;transform:rotate(-12deg) scaleX(.05)}48%{opacity:.75}52%{opacity:.38;transform:rotate(-12deg) scaleX(1)}}
        @keyframes crossroads-omen-capture{0%{opacity:.95;transform:translate(-50%,-50%) scale(.7)}35%{opacity:1;transform:translate(-50%,-50%) scale(1.14)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.7)}}
        @keyframes fate-thread-capture{0%{opacity:.7;transform:rotate(-12deg) scaleX(.35)}55%{opacity:1;transform:rotate(-12deg) scaleX(1.1)}100%{opacity:0;transform:rotate(-12deg) scaleX(1.35)}}
        @keyframes oracle-voice-in{from{opacity:0;transform:translateY(11px)}to{opacity:1;transform:none}}
        @keyframes crossroads-guidance-in{from{opacity:0;transform:translate(-50%,9px)}to{opacity:1;transform:translate(-50%,0)}}
        @keyframes word-talisman-in{0%{opacity:0;transform:translate(-50%,-43%) scale(.72) rotate(-4deg);filter:blur(4px)}72%{transform:translate(-50%,-52%) scale(1.02) rotate(.8deg);filter:blur(0)}100%{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(-.7deg)}}
        @media(max-width:700px){.poteno-actions:has(.poteno-six){top:50%;left:50%;right:auto;bottom:auto;width:calc(100vw - 12px);max-height:calc(100dvh - 28px);transform:translate(-50%,-50%)}.poteno-six{min-height:0;padding:18px 15px 15px;gap:13px}.six-brand{grid-template-columns:48px 1fr;gap:10px}.six-brand-seal{width:44px;height:44px;font-size:.95rem}.six-brand>em{display:none}.six-brand h2{font-size:1.28rem}.six-brand p{font-size:.59rem}.six-progress{padding:0}.six-progress span b{font-size:.5rem}.six-progress span i{width:24px;height:24px}.six-progress::before{top:12px}.six-setup,.six-scene,.six-send,.six-receive,.six-reading{padding:14px 12px}.six-master-picker{grid-template-columns:repeat(3,1fr)}.six-master-picker button{min-height:69px}.six-result-card{grid-template-columns:1fr}.iching-altar{grid-template-columns:1fr 104px 1fr;min-height:180px}.iching-tube{width:85px;height:112px}.hexagram-lines{width:88px;padding:11px}.silhouette-street{min-height:190px;padding:28px 4px 18px}.silhouette-street button{width:62px;height:108px}.tarot-spread{gap:7px}.tarot-spread>div{min-height:105px}.tarot-deck button{flex-basis:68px;height:108px}.six-converge{min-height:340px}.converge-orbit{transform:scale(.78)}.poteno-page:has(.poteno-six)>.poteno-back{margin:0 15px 14px}.tamamo-ritual{min-height:440px}.tamamo-presence{left:5px;bottom:24px;transform-origin:left bottom}.phase-passers .tamamo-presence,.phase-reveal .tamamo-presence,.phase-interpretation .tamamo-presence{transform:translate(-15px,22px) scale(.64);opacity:.9}.tamamo-invocation{left:112px;right:12px;top:77px;padding:14px}.tamamo-invocation blockquote,.tamamo-interpretation blockquote{font-size:.82rem;line-height:1.7}.crossroads-passers{inset:88px -10px 66px}.crossroads-passers button{width:49px;height:156px}.passer-body{width:46px!important;height:111px}.crossroads-passers .is-child{height:126px}.crossroads-passers .is-child .passer-body{height:73px}.crossroads-omen{left:54%;top:54%;transform:translate(-50%,-50%) scale(.8)}.crossroads-divination-map{inset:14px 8px 76px}.crossroads-divination-map::before{width:210px;height:210px}.crossroads-divination-map::after{width:176px;height:176px}.crossroads-guidance{bottom:30px;min-width:94%;padding:8px 12px}.crossroads-guidance small{max-width:280px}.crossroads-word{top:46%;width:82%;padding:17px 20px}.crossroads-word blockquote{font-size:.88rem}.phase-interpretation .crossroads-word{top:31%;width:77%;transform:translate(-42%,-50%)}.tamamo-interpretation{left:90px;right:10px;bottom:18px;padding:13px 13px 13px 17px}.tarot-ritual{min-height:485px}.germain-presence{left:-4px;bottom:14px;transform-origin:left bottom}.ritual-selection .germain-presence{transform:translate(-31px,24px) scale(.54)}.ritual-locked .germain-presence,.ritual-revealing .germain-presence{transform:translate(-25px,19px) scale(.62)}.ritual-complete .germain-presence{transform:translate(-20px,15px) scale(.66)}.germain-introduction{left:104px;right:11px;top:69px;padding:14px}.germain-introduction blockquote,.germain-ritual-voice blockquote{font-size:.79rem;line-height:1.68}.tarot-fan{top:28px;transform:translateX(-50%) scale(.78);transform-origin:top center}.tarot-selection-guide{top:192px;width:92%;padding:7px 10px}.tarot-ritual-spread.is-dock{bottom:16px;width:232px;gap:9px}.tarot-ritual-spread.is-center{top:94px;width:88%;gap:8px}.tarot-flip-card{width:76px;height:124px}.is-dock .tarot-flip-card{width:57px;height:90px}.tarot-card-front{gap:5px;padding:8px 5px}.tarot-card-front .tarot-front-mark{width:30px;height:30px}.tarot-card-front b{font-size:.58rem}.germain-ritual-voice{left:76px;right:9px;bottom:13px;padding:11px 12px 11px 15px}.ritual-revealing .tarot-ritual-spread,.ritual-complete .tarot-ritual-spread{top:58px}.ritual-revealing .germain-ritual-voice,.ritual-complete .germain-ritual-voice{bottom:10px}}
        @media(max-width:700px){.poteno-six:has(.six-setup){padding:14px 10px}.six-setup{gap:14px;padding:14px 10px}.six-intro{grid-template-columns:45px 1fr;gap:10px}.entrance-mon{width:40px;height:40px}.six-intro strong{font-size:.94rem}.six-intro p{font-size:.62rem}.six-question-scroll{padding:10px 12px 13px}.question-heading{display:grid;gap:3px}.quick-question-list{gap:5px}.quick-question-list button{padding-inline:8px}.six-master-picker{grid-template-columns:1fr;gap:7px;padding:8px}.six-master-picker button{grid-template-columns:40px 1fr;min-height:78px;padding:8px 10px}.six-master-picker button>i{width:35px;height:42px}.six-master-picker button em{font-size:.55rem}.setup-sigil-field{height:225px}.setup-sigil-field::before{width:210px;height:210px}.setup-hexagram-lines{width:270px;height:203px}.setup-sigil-orbit>span{--orbit:87px}.setup-open-seal{width:94px;height:94px}.setup-origin label{min-width:min(320px,88vw)}.setup-opening-voice{font-size:.6rem}.phase-invocation .tamamo-presence{animation-name:tamamo-stage-entrance-mobile}}
        @media(max-width:700px){.poteno-six:has(.six-iching){padding:14px 10px}.six-progress{gap:2px}.six-progress span{min-height:43px}.six-progress span i{width:30px;height:30px;font-size:.7rem}.six-progress::before{top:19px}.six-iching{padding:13px 10px 16px}.six-iching::before{font-size:1.25rem}.iching-ritual{min-height:350px;padding:0 4px}.six-iching.has-reading .iching-ritual{min-height:775px;grid-template-columns:1fr;grid-template-rows:180px 292px auto;gap:8px}.iching-vessel-zone,.six-iching.has-reading .iching-vessel-zone{grid-column:1;grid-row:1}.iching-vessel{width:150px;height:275px;transform:scale(.77)}.six-iching.has-reading .iching-vessel{transform:translateY(-18px) scale(.57)}.six-iching.is-complete .iching-vessel{opacity:.58;transform:translateY(-22px) scale(.49)}.iching-tube{width:116px;height:235px}.cast-sticks{top:24px;left:50%}.iching-transformation{grid-column:1;grid-row:2;width:100%;height:285px;grid-template-columns:1fr;grid-template-rows:56px 1fr}.iching-transformation .ritual-hexagram{width:174px;height:224px;gap:12px;padding:20px 22px}.iching-transformation .ritual-line>span{gap:21px}.iching-transformation .ritual-line>b{right:-28px}.process-title strong{font-size:.95rem}.iching-result-detail{grid-column:1;grid-row:3;width:min(100%,310px);min-height:0;justify-self:center}.iching-result-detail section{padding:10px 12px}.iching-result-detail strong{font-size:1rem}.iching-footer{grid-template-columns:minmax(0,1fr) 76px;gap:7px}.iching-footer blockquote{padding-left:16px}.iching-footer .taikobo-art{width:76px;height:112px}.iching-footer .six-next{grid-column:1/-1;justify-self:stretch}.iching-cast-button{min-width:220px}}
        @media(max-width:700px){.diviner-card-art{width:35px;height:48px}.six-reading-portrait{width:43px;height:52px}.divination-summary-button{grid-template-columns:30px minmax(0,1fr);align-items:start}.divination-summary-toggle{grid-column:2;justify-self:start}.divination-summary-heading small{overflow:visible;white-space:normal}.divination-detail-list{grid-template-columns:1fr}.davinci-main{grid-template-columns:1fr;gap:8px}.davinci-blueprint{grid-row:1;width:100%;height:116px}.asteria-pillars{grid-template-columns:repeat(3,minmax(0,1fr))}.asteria-week p{grid-template-columns:34px 52px minmax(0,1fr) auto;gap:3px;font-size:.58rem}.asteria-week span{display:none}.asteria-birth-sign em{font-size:.56rem}.six-master-picker button{grid-template-columns:76px minmax(0,1fr);min-height:96px;align-items:start;gap:11px;padding:11px}.six-master-picker .diviner-card-art{width:76px;height:76px;grid-column:1;grid-row:1;align-self:start;border-radius:2px}.six-master-picker .diviner-card-art img{width:100%;height:100%;object-fit:cover}.six-master-picker .diviner-card-info{display:grid!important;grid-column:2;grid-row:1;align-content:start;gap:7px;min-width:0;text-align:left}.six-master-picker .diviner-card-title{display:grid!important;gap:2px;text-align:left}.six-master-picker .diviner-card-info b{font-size:.84rem}.six-master-picker .diviner-card-info small{font-size:.61rem}.six-master-picker .diviner-card-info em{font-size:.63rem;line-height:1.55}.six-master-picker button.is-selected{grid-template-columns:94px minmax(0,1fr);min-height:118px;padding:12px;box-shadow:inset 0 0 0 3px rgba(255,242,205,.46),0 0 0 1px #c39b55,0 6px 16px rgba(93,50,31,.24)}.six-master-picker button.is-selected .diviner-card-art{width:94px;height:94px;box-shadow:0 0 18px rgba(222,166,76,.46)}.six-master-picker button.is-selected .diviner-card-info{min-height:94px;gap:9px}.six-master-picker button.is-selected .diviner-card-info b{font-size:.9rem}.six-master-picker button u{top:7px;right:7px;width:25px;height:25px;font-size:.45rem}}
        @media(max-width:700px){.tarot-fan-scroll{top:0;right:0;bottom:74px;left:0;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;scrollbar-width:none;touch-action:pan-x pan-y}.tarot-fan-scroll::-webkit-scrollbar{display:none}.tarot-fan{position:relative;left:0;top:20px;width:640px;min-width:640px;height:280px;transform:none}.tarot-fan button{left:50%;touch-action:manipulation}}
        @media(prefers-reduced-motion:reduce){.iching-tube.is-cast,.six-cosmos::before,.six-brand-seal i,.iching-rings,.iching-diagram,.silhouette-street button,.six-converge::before,.converge-orbit.is-complete::after{animation:none}.converge-orbit>div{transition:none}.ritual-line,.line-changed,.hexagram-name.is-result,.moving-line-note,.transformation-mark{animation-duration:.01ms;animation-delay:0s}}
      `}</style>
    </div>
  );
}
