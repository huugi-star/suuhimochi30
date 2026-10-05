'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Apple, BookOpen, Gamepad2, Home, MessageCircle, NotebookTabs, PackageOpen, RotateCcw, Settings, Sparkles, UserRoundPlus, X } from 'lucide-react';
import { MiniGamePanel } from '@/components/minigames/MiniGamePanel';
import { PotenoPanel } from '@/components/PotenoPanel';
import { TwoDayReviewTalk } from '@/components/TwoDayReviewTalk';
import { DailyProgressCheck } from '@/components/DailyProgressCheck';
import { GraduationFlow } from '@/components/GraduationFlow';
import { JournalPanel } from '@/components/JournalPanel';
import { FoodPanel } from '@/components/FoodPanel';
import { MaskDisplay, type MaskGrowthStage } from '@/components/MaskDisplay';
import { RotateDeviceScreen } from '@/components/RotateDeviceScreen';
import { StartupLoadingScreen } from '@/components/StartupLoadingScreen';
import { SuuhimochiKeyboard } from '@/components/SuuhimochiKeyboard';
import { MOCHI_STATES, TYPE_ACCENTS, type MochiState } from '@/lib/characterData';
import { INTRO_LINES, pickRoomMonologue } from '@/lib/dialogueData';
import { pickSleepDialogue } from '@/lib/sleepDialogueData';
import { CATEGORY_LABELS } from '@/lib/conversationData';
import { clearSave, EMPTY_SAVE, loadSave, storeSave, type GameSave } from '@/lib/storage';
import { getActivityDateKey, getDoneItems, getPreviousActivityDateKey, isAfterActivityDayStart, normalizeDoneItems, type DailyProgressRecord } from '@/lib/dailyProgress';
import type { StrategyRecord } from '@/lib/potenoLink';
import type { SixDivinationRecord } from '@/lib/potenoSixDivination';
import { createThirtyDayCycleArchive, type GraduationFootprint, type GraduationHandoffAdvice, type NextGoalChoice } from '@/lib/graduation';
import { TWO_DAY_REVIEW_GOAL_TYPES, type TwoDayReviewGoalType, type TwoDayReviewRecord } from '@/lib/twoDayReview';
import { createExperienceFruitBatch, getExperienceMealStatus, getFoodActivityDate, getPersonaStage, isFruitSpoiled, type ExperienceFruitRecord } from '@/lib/food';
import { BACKGROUND_PRELOAD_ASSETS, preloadCriticalImages, preloadImagesInIdleBatches, STARTUP_CRITICAL_ASSETS, uniqueImageSources } from '@/lib/imagePreload';
import { advanceDialogue, createDialogueRuntime, getDialogueNode, resolveDialogueText, type DialogueRuntime } from '@/lib/miniDialogueRunner';
import { closetScare } from '@/lib/miniDialogueScripts';
import { PERSON_DIALOGUE_SCRIPTS } from '@/lib/miniDialogueAdditionalScripts';
import type { DialogueMotion } from '@/lib/miniDialogueTypes';
import {
  SuuhimochiConversation,
  type CategoryChoice,
  type ConversationChoice,
  type ConversationMemory,
  type ConversationResponse,
  type ConversationStage,
  type DebugSnapshot,
  type InputMode,
  type SubCategoryChoice,
  type StorageLike,
  type WordCategory,
  type WordEntry,
} from '@/lib/wordMemory';

type Phase = 'title' | 'birthday' | 'reveal' | 'intro' | 'permission' | 'welcome' | 'callName' | 'persona' | 'goalIntro' | 'goal' | 'goalType' | 'goalReply' | 'home';
type TimeMode = 'auto' | 'morning' | 'day' | 'evening' | 'night' | 'midnight';
type SpriteDirection = 'south' | 'south-east' | 'east' | 'north-east' | 'north' | 'north-west' | 'west' | 'south-west';
type ZoomFaceEmotion = 'neutral' | 'happy' | 'nervous' | 'sad' | 'surprised' | 'thinking' | 'angry';
type ZoomEyeFrame = 'open' | 'half' | 'closed';
type ZoomMouthFrame = 'closed' | 'small' | 'open';
type ZoomArmPose = 'down' | 'up' | 'open' | 'chest';

// The room objects keep using the original central coordinate space. The
// wider background only adds scenery outside this safe area on wide phones.
const ROOM_WORLD_WIDTH = 1672;
const ROOM_WORLD_HEIGHT = 941;
const ROOM_BACKGROUND_WIDTH = 2196;
const ROOM_BACKGROUND_HEIGHT = 941;
const ROOM_SAFE_AREA_LEFT = (ROOM_BACKGROUND_WIDTH - ROOM_WORLD_WIDTH) / 2;

function getDisplayedSpriteMetrics(room: DOMRect, mobileRoomMode: boolean) {
  const scale = mobileRoomMode ? room.width / ROOM_WORLD_WIDTH : 1;
  return { half: 64 * scale, foot: 122 * scale };
}

type InitialPreviewSnapshot = {
  save: GameSave;
  birthday: string;
  phase: Phase;
  revealBeat: number;
  introLine: number;
  permissionStep: number;
  goalIntroStep: number;
  initialGoalText: string;
  mochiState: MochiState;
  walkDirection: SpriteDirection;
  walkOffset: { x: number; y: number };
  walkDuration: number;
  lightsOut: boolean;
  timeMode: TimeMode;
  sleepingBedId: string | null;
  sleepPose: { left: number; top: number } | null;
  bedPromptId: string | null;
  wakePromptOpen: boolean;
  wakingUp: boolean;
  bedHandoff: boolean;
  conversation: SuuhimochiConversation | null;
  conversationDay: number;
  conversationPhase: string;
  learnedWords: string[];
  dictionaryEntries: WordEntry[];
  conversationMemories: ConversationMemory[];
  farewellLetter: string | null;
  talkDebug: DebugSnapshot | null;
  itemPositions: Record<string, RoomItemPosition>;
  storedItemIds: string[];
  clockPosition: { x: number; y: number };
  recentCategories: string[];
};

const ZOOM_ASSET_ROOT = '/assets/suuhimochi/characters/suuhimochi-01/zoom';
const SLEEP_ANIMATION_ROOT = '/assets/mochi-type-1-new/animations/Peacefully_sleeping_in_bed_with_subtle_breathing_t/south';
const MINI_DIALOGUE_SCRIPTS = [closetScare, ...PERSON_DIALOGUE_SCRIPTS];

function getMiniDialogueScript(scriptId: string) {
  return MINI_DIALOGUE_SCRIPTS.find((script) => script.id === scriptId) ?? null;
}

function zoomEyeAsset(emotion: ZoomFaceEmotion, frame: ZoomEyeFrame) {
  const assetFrame = emotion === 'angry' && frame === 'closed' ? 'close' : frame;
  return `${ZOOM_ASSET_ROOT}/eyes/${emotion}/eye_${emotion}_${assetFrame}.png`;
}

const MOUTH_EMOTIONS = new Set<ZoomFaceEmotion>(['neutral', 'nervous', 'sad', 'surprised', 'thinking']);

function zoomMouthAsset(frame: ZoomMouthFrame, emotion: ZoomFaceEmotion = 'neutral') {
  const assetFrame = frame === 'small' ? 'half' : frame;
  const mouthEmotion = MOUTH_EMOTIONS.has(emotion) ? emotion : 'neutral';
  return `${ZOOM_ASSET_ROOT}/mouth/${mouthEmotion}/mouth_${mouthEmotion}_${assetFrame}.png`;
}

function zoomArmAsset(side: 'left' | 'right', pose: ZoomArmPose) {
  if (pose === 'chest') return `${ZOOM_ASSET_ROOT}/arms/${side}/${side}-hand_chest.png`;
  return `${ZOOM_ASSET_ROOT}/arms/${side}/arm-${side}-${pose}.png`;
}

function dialogueMotionToEmotion(motion?: DialogueMotion): ZoomFaceEmotion {
  switch (motion) {
    case 'happy': return 'happy';
    case 'sad': return 'sad';
    case 'angry': return 'angry';
    case 'thinking': return 'thinking';
    case 'nervous': return 'nervous';
    case 'surprised': return 'surprised';
    default: return 'neutral';
  }
}

/**
 * Older additional scripts do not carry a motion on every line yet.  Keep a
 * gentle text fallback so those lines still get an expressive presentation;
 * an explicit `motion` always wins when a script provides one.
 */
function inferDialogueMotion(text: string): DialogueMotion {
  if (/(怖|こわ|恐|ゾッ|不安|心配|緊張|危な|逃げ|どうしよう|落ち着かない)/.test(text)) return 'nervous';
  if (/(怒|腹が立|嫌だ|いやだ|ムカ|イライラ|許せ|ずるい)/.test(text)) return 'angry';
  if (/(悲|さみ|寂|涙|泣|つら|苦し|かわいそう|落ち込|残念|会いたい)/.test(text)) return 'sad';
  if (/(嬉|うれ|楽し|やった|好き|大好き|ありがとう|よかった|笑|面白|幸せ|わくわく|すごい)/.test(text)) return 'happy';
  if (/(驚|びっくり|まさか|ほんとに|本当に|えっ|ええっ|あっ|！{2,}|!{2,})/.test(text)) return 'surprised';
  if (/(考|どうして|なぜ|なんで|どういう|どっち|不思議|わから|分から|知りたい|気になる|教えて|かな[？?]?|[？?])/.test(text)) return 'thinking';
  return 'idle';
}

function armFramesForDialogueMotion(motion?: DialogueMotion): ZoomArmPose[] {
  switch (motion) {
    case 'happy':
      return ['open', 'open', 'up', 'open', 'down'];
    case 'sad':
      return ['down', 'down', 'chest', 'down'];
    case 'angry':
      return ['chest', 'up', 'chest', 'down'];
    case 'thinking':
      return ['chest', 'down', 'chest', 'down'];
    case 'nervous':
      return ['chest', 'down', 'chest', 'down'];
    case 'surprised':
      return ['open', 'up', 'open', 'down'];
    default:
      return ['down', 'open', 'down', 'down', 'up', 'down'];
  }
}

const REVEAL_BEATS: { line: string; state: MochiState; delay: number }[] = [
  { line: '……', state: 'idle', delay: 1500 },
  { line: 'ここ、どこなの。', state: 'walk', delay: 2100 },
  { line: '……窓。', state: 'window', delay: 1900 },
  { line: 'あ。', state: 'idle', delay: 1500 },
  { line: '人間さん？', state: 'idle', delay: 0 },
];

const GOAL_INTRO_LINES = [
  'ぼくにもね、この30日でやってみたいことがあるの。',
  '人間の世界には、いろんな自分を使い分ける「仮面（ペルソナ）」っていうものがあるんだって。\nぼくには、まだよく分からないの。',
  'だから30日暮らしながら、ぼくなりの仮面を見つけてみたいの。',
  '30日って、長いようで短いんだって。\nせっかく一緒に暮らすなら……',
  '最後の日に、「最初の日とは、ちょっと景色が変わったね」って言えたらいいな。',
  'ぼくは、ぼくの景色を探してみる。\n人間さんにも、見てみたい景色ってある？',
  '大きな夢じゃなくていいの。\nずっとやってみたかったことでも、少しできるようになりたいことでもいいよ。',
];

function getAutoTime(): Exclude<TimeMode, 'auto'> {
  const hour = new Date().getHours();
  if (hour < 6 || hour >= 22) return 'midnight';
  if (hour < 11) return 'morning';
  if (hour < 17) return 'day';
  if (hour < 19) return 'evening';
  return 'night';
}

const ROOM_BACKGROUNDS: Record<Exclude<TimeMode, 'auto'>, { lit: string; unlit?: string }> = {
  morning: { lit: '/assets/backgrounds/room-morning.png' },
  day: { lit: '/assets/backgrounds/room-noon.png' },
  evening: { lit: '/assets/backgrounds/room-evening.png' },
  night: { lit: '/assets/backgrounds/room-night-lit.png', unlit: '/assets/backgrounds/room-night-unlit.png' },
  midnight: { lit: '/assets/backgrounds/room-midnight-lit.png', unlit: '/assets/backgrounds/room-midnight-unlit.png' },
};

function getRoomBackground(time: Exclude<TimeMode, 'auto'>, lightsOut: boolean) {
  const background = ROOM_BACKGROUNDS[time];
  return lightsOut && background.unlit ? background.unlit : background.lit;
}

function getLocalClockTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getBirthdaySuggestion() {
  const year = new Date().getFullYear() - 25;
  return `${year}-01-01`;
}

function isScheduledSleepTime(clockTime: string) {
  const hour = Number(clockTime.slice(0, 2));
  return Number.isInteger(hour) && hour >= 0 && hour < 7;
}

function replaceCallName(line: string, callName: string) {
  const value = callName.trim();
  return value ? line.replaceAll('人間さん', value) : line;
}

function getPreferredCallName(save: Pick<GameSave, 'userName' | 'callName'>) {
  return save.callName.trim() || save.userName.trim() || '人間さん';
}

function createPreviewStorage(): StorageLike {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => void values.set(key, value),
    removeItem: (key) => void values.delete(key),
  };
}

// The room clock is drawn from a tiny fixed pixel font so it reads as a
// friendly piece of furniture rather than a browser UI element.
const CLOCK_SEGMENTS: Record<string, string[]> = {
  '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  '1': ['b', 'c'],
  '2': ['a', 'b', 'g', 'e', 'd'],
  '3': ['a', 'b', 'c', 'd', 'g'],
  '4': ['f', 'g', 'b', 'c'],
  '5': ['a', 'f', 'g', 'c', 'd'],
  '6': ['a', 'f', 'g', 'e', 'c', 'd'],
  '7': ['a', 'b', 'c'],
  '8': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
  '9': ['a', 'b', 'c', 'd', 'f', 'g'],
};

function PixelClockDigits({ time }: { time: string }) {
  return (
    <span className="pixel-clock-digits" aria-hidden="true">
      {Array.from(time).map((character, index) => (
        character === ':' ? (
          <span className="room-clock-colon" key={`clock-colon-${index}`}>
            <i />
            <i />
          </span>
        ) : (
          <span className="room-clock-digit" key={`clock-digit-${index}`}>
            {(CLOCK_SEGMENTS[character] ?? []).map((segment) => (
              <i className={`room-clock-segment room-clock-segment-${segment}`} key={segment} />
            ))}
          </span>
        )
      ))}
    </span>
  );
}

function getWallClockHands(time: string) {
  const [rawHours = '0', rawMinutes = '0'] = time.split(':');
  const hours = Number(rawHours) % 12;
  const minutes = Number(rawMinutes);
  return { hour: hours * 30 + minutes * 0.5, minute: minutes * 6 };
}

function WallClockFace({ time }: { time: string }) {
  const hands = getWallClockHands(time);
  return (
    <span className="room-wall-clock" aria-hidden="true">
      <img
        className="room-wall-clock-art"
        src="/assets/items/wall-clock-analog-thin.png"
        alt=""
        draggable={false}
      />
      <span className="room-wall-clock-analog-face">
        <i className="room-wall-clock-hand room-wall-clock-hand-hour" style={{ transform: `translateX(-50%) rotate(${hands.hour + 180}deg)` }} />
        <i className="room-wall-clock-hand room-wall-clock-hand-minute" style={{ transform: `translateX(-50%) rotate(${hands.minute + 180}deg)` }} />
        <i className="room-wall-clock-pin" />
      </span>
    </span>
  );
}

function WallClockDigitalFace({ time }: { time: string }) {
  return (
    <span className="room-wall-clock-digital" aria-hidden="true">
      <img className="room-wall-clock-digital-art" src="/assets/items/wall-clock-pixel.png" alt="" draggable={false} />
      <span className="room-wall-clock-digital-display"><PixelClockDigits time={time} /></span>
    </span>
  );
}

const BUBBLE_PAGE_LENGTH = 42;
const TALK_PAGE_LENGTH = 54;
const TEXT_BREAKS = '。！？!?、，…';
// 文字送りは一文字ずつ続けつつ、口の切り替えは数文字に一度だけ行う。
// これで高速なパラパラ口パクにならず、ゆっくり考えながら話す印象になる。
const MOUTH_PULSE_CHARACTERS = 6;
const TALK_CHARACTER_DELAY = 125;
const TALK_COMMA_DELAY = 340;
const TALK_SENTENCE_DELAY = 750;
const INITIAL_DIALOGUE_CHARACTER_DELAY = 100;
const INITIAL_DIALOGUE_COMMA_DELAY = 290;
const INITIAL_DIALOGUE_SENTENCE_DELAY = 650;
const TALK_CAMERA_ZOOM = 2;
const TALK_CAMERA_TRANSITION_MS = 1100;
const MINI_FEAR_CHOICE_NODE_IDS = new Set(['ask', 'reaction']);
const CATEGORY_DISPLAY_ORDER = [
  'PERSON', 'FOOD', 'GAME_MEDIA', 'PLACE', 'OBJECT', 'ACTIVITY', 'AV_MEDIA',
  'WORK', 'EMOTION', 'TECH', 'SCHOOL', 'SPORTS', 'EVENT', 'KNOWLEDGE',
  'ANIMAL', 'CLOTHING', 'VEHICLE', 'MONEY', 'BODY', 'NATURE_TIME',
] as const;
const CATEGORY_DISPLAY_INDEX = new Map<string, number>(CATEGORY_DISPLAY_ORDER.map((category, index) => [category, index]));
const CATEGORY_KEYS = new Set<string>([...CATEGORY_DISPLAY_ORDER, 'OTHER']);

function dictionaryFeelingLabel(entry: WordEntry) {
  const feeling = entry.attributes['feeling'];
  if (feeling) return feeling;
  switch (entry.userSentiment) {
    case 'LOVE': return '大好き';
    case 'LIKE':
    case 'POSITIVE': return '好き';
    case 'DISLIKE':
    case 'NEGATIVE': return '苦手';
    default: return '';
  }
}

function dictionaryEntryNote(entry: WordEntry) {
  return entry.attributes['subCategoryLabel']
    ?? entry.attributes['promptedLastMemoryLabel']
    ?? 'すうひもちが覚えたことば';
}

function splitReadableText(text: string, maxLength: number, minimumRatio = 0.55): string[] {
  const chunks: string[] = [];
  let remaining = text.trim();

  while (Array.from(remaining).length > maxLength) {
    const characters = Array.from(remaining);
    const minimumBreak = Math.floor(maxLength * minimumRatio);
    let breakAt = maxLength;
    for (let index = maxLength; index >= minimumBreak; index -= 1) {
      if (TEXT_BREAKS.includes(characters[index - 1])) {
        breakAt = index;
        break;
      }
    }
    chunks.push(characters.slice(0, breakAt).join('').trim());
    remaining = characters.slice(breakAt).join('').trim();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

function splitBubblePages(text: string): string[] {
  return splitReadableText(text, BUBBLE_PAGE_LENGTH);
}

// A room monologue can deliberately contain a line break for a small pause.
// Keep those beats as separate bubble pages, rather than squeezing them into
// one thought bubble.
function splitRoomMonologuePages(text: string): string[] {
  return text
    .trim()
    .split(/\n+/u)
    .flatMap((line) => splitReadableText(line, BUBBLE_PAGE_LENGTH))
    .filter(Boolean);
}

function splitTalkPages(text: string): string[] {
  // 台詞データ内の装飾的な改行や固定文字数では行を作らない。
  // ページだけを文末優先で分け、枠内の折り返しは実際の画面幅へ任せる。
  const normalized = text.trim().replace(/\s*\n+\s*/gu, '');
  const sentences = normalized.split(/(?<=[。！？!?])/u).filter(Boolean);
  const pages: string[] = [];
  let currentPage = '';

  for (const sentence of sentences) {
    const chunks = splitReadableText(sentence, TALK_PAGE_LENGTH, 0.6);
    for (const chunk of chunks) {
      const combined = `${currentPage}${chunk}`;
      if (currentPage && Array.from(combined).length > TALK_PAGE_LENGTH) {
        pages.push(currentPage);
        currentPage = chunk;
      } else {
        currentPage = combined;
      }
    }
  }
  if (currentPage) pages.push(currentPage);
  return pages.length ? pages : splitReadableText(normalized, TALK_PAGE_LENGTH);
}

const TIME_LABELS = { morning: '朝', day: '昼', evening: '夕暮れ', night: '夜', midnight: '深夜' };
const MASK_CASE_ITEM_ID = 'mask-case';
const ROOM_ITEMS = [
  { id: 'bookshelf', src: '/assets/items/wooden-bookshelf-with-plant-and-mushroom.png', alt: '本棚' },
  { id: 'bed-flower-red', src: '/assets/items/bed_flower_red.png', alt: 'ベッド（赤）' },
  { id: 'bed-leaf-green', src: '/assets/items/bed_leaf_green.png', alt: 'ベッド（緑）' },
  { id: 'bed-check-yellow', src: '/assets/items/bed_check_yellow.png', alt: 'ベッド（黄色）' },
  { id: 'cabinet', src: '/assets/items/green-yellow-wooden-cabinet.png', alt: '木のキャビネット' },
  { id: 'hanging-shelf', src: '/assets/items/hanging-plant-shelf.png', alt: '吊り下げ植物棚' },
  { id: 'wall-frame', src: '/assets/items/tulip-wall-frame.png', alt: 'チューリップの壁飾り' },
  { id: 'floor-lamp', src: '/assets/items/wooden-floor-lamp.png', alt: 'フロアランプ' },
  { id: 'rug', src: '/assets/items/leaf-rug.png', alt: '葉っぱのラグ' },
  { id: 'low-table', src: '/assets/items/round-wooden-low-table.png', alt: '丸いローテーブル' },
  { id: 'cushion', src: '/assets/items/flower-cushion.png', alt: '花形クッション' },
  { id: 'plant', src: '/assets/items/potted-plant.png', alt: '鉢植え' },
  { id: 'vase', src: '/assets/items/blue-ceramic-vase.png', alt: '青い花瓶' },
  { id: 'wall-clock', src: '/assets/items/wall-clock-analog-thin.png', alt: '壁掛け時計' },
  { id: 'wall-clock-digital', src: '/assets/items/wall-clock-pixel.png', alt: '壁掛けデジタル時計' },
  { id: MASK_CASE_ITEM_ID, src: '/assets/kamen/kamen-frame/kamen-frame.png', alt: '仮面展示フレーム' },
] as const;
type RoomItemPosition = { x: number; y: number };
const INITIAL_ITEM_POSITIONS: Record<string, RoomItemPosition> = {
  bookshelf: { x: 1, y: 36 },
  // Keep one bed in the room by default; the other two variants start in
  // storage so the three choices do not stack on top of each other.
  'bed-flower-red': { x: 24, y: 43 },
  'bed-leaf-green': { x: 24, y: 43 },
  'bed-check-yellow': { x: 24, y: 43 },
  cabinet: { x: 77, y: 43 },
  'hanging-shelf': { x: 5, y: 4 },
  'wall-frame': { x: 78, y: 10 },
  'floor-lamp': { x: 84, y: 42 },
  rug: { x: 21, y: 63 },
  'low-table': { x: 40, y: 61 },
  cushion: { x: 3, y: 72 },
  plant: { x: 69, y: 49 },
  vase: { x: 49, y: 53 },
  'wall-clock': { x: 62, y: 16 },
  'wall-clock-digital': { x: 74, y: 16 },
  [MASK_CASE_ITEM_ID]: { x: 45, y: 7 },
};
const ROOM_LAYOUT_STORAGE_KEY = 'suuhimochi_room_layout_v1';
const RECENT_CATEGORY_STORAGE_KEY = 'suuhimochi_recent_categories_v1';
// A brand-new room starts empty. Every furnishing, including the clocks,
// remains available from the item drawer until the player places it.
const INITIAL_STORED_ITEM_IDS = ['clock', ...ROOM_ITEMS.map((item) => item.id)];
// Preserve rooms saved before all three bed variants existed. This is kept
// separate from the blank-room defaults so existing layouts stay untouched.
const LEGACY_BED_STORED_ITEM_IDS = ['bed-flower-red', 'bed-leaf-green'];
const BED_ITEM_IDS = new Set(['bed-flower-red', 'bed-leaf-green', 'bed-check-yellow']);
// Only furniture that occupies floor space blocks the character. Wall decor
// and the leaf rug are intentionally omitted; the rug is a walkable floor.
type RoomItemCollider = { width: number; left: number; top: number; widthFactor: number; heightFactor: number; blocks?: boolean };
const ROOM_ITEM_COLLIDERS: Record<string, RoomItemCollider> = {
  bookshelf: { width: 24, left: 0.2, top: 0.15, widthFactor: 0.58, heightFactor: 0.72 },
  // Each bed collider covers only the lower floor footprint; the headboard
  // remains visually present but does not block characters walking behind it.
  'bed-flower-red': { width: 28, left: 0.12, top: 0.56, widthFactor: 0.76, heightFactor: 0.28 },
  'bed-leaf-green': { width: 28, left: 0.12, top: 0.56, widthFactor: 0.76, heightFactor: 0.28 },
  'bed-check-yellow': { width: 28, left: 0.12, top: 0.56, widthFactor: 0.76, heightFactor: 0.28 },
  cabinet: { width: 21, left: 0.15, top: 0.28, widthFactor: 0.7, heightFactor: 0.55 },
  'floor-lamp': { width: 16, left: 0.37, top: 0.15, widthFactor: 0.26, heightFactor: 0.72 },
  // Match the colored (clipped) table pixels: transparent padding around the
  // 1254px source image remains walkable, while the tabletop and legs block.
  'low-table': { width: 27, left: 0.05, top: 0.285, widthFactor: 0.9, heightFactor: 0.5 },
  cushion: { width: 18, left: 0.15, top: 0.4, widthFactor: 0.7, heightFactor: 0.3 },
  plant: { width: 15, left: 0.25, top: 0.12, widthFactor: 0.5, heightFactor: 0.72 },
  vase: { width: 8, left: 0.3, top: 0.25, widthFactor: 0.38, heightFactor: 0.55 },
  // Wall decor and the rug are shown in debug mode but intentionally do not
  // block walking (the rug is a walkable floor surface).
  'hanging-shelf': { width: 22, left: 0.2, top: 0.08, widthFactor: 0.6, heightFactor: 0.84, blocks: false },
  'wall-frame': { width: 11, left: 0.2, top: 0.14, widthFactor: 0.6, heightFactor: 0.74, blocks: false },
  rug: { width: 50, left: 0.02, top: 0.22, widthFactor: 0.96, heightFactor: 0.56, blocks: false },
  'wall-clock': { width: 13, left: 0, top: 0, widthFactor: 1, heightFactor: 1, blocks: false },
  'wall-clock-digital': { width: 11, left: 0, top: 0, widthFactor: 1, heightFactor: 1, blocks: false },
  [MASK_CASE_ITEM_ID]: { width: 14, left: 0, top: 0, widthFactor: 1, heightFactor: 1, blocks: false },
};

// Hand-authored floor footprint for the low table. This is deliberately
// independent from the PNG dimensions/alpha and follows only the occupied
// floor area under the tabletop and legs.
const LOW_TABLE_COLLIDER = { offsetX: 0.5, offsetY: 12.5, width: 26, height: 21 };
const WALK_DIRECTIONS: SpriteDirection[] = ['south', 'south-east', 'east', 'north-east', 'north', 'north-west', 'west', 'south-west'];
const WALK_VECTORS: Record<SpriteDirection, { x: number; y: number }> = {
  south: { x: 0, y: 1 }, 'south-east': { x: 0.707, y: 0.707 }, east: { x: 1, y: 0 }, 'north-east': { x: 0.707, y: -0.707 },
  north: { x: 0, y: -1 }, 'north-west': { x: -0.707, y: -0.707 }, west: { x: -1, y: 0 }, 'south-west': { x: -0.707, y: 0.707 },
};
// Coarse limits only keep pointer/autonomous targets sane. The actual walkable
// area is the trapezoidal floor painted into the background and is checked
// against Suuhimochi's feet in isWalkOffsetBlocked().
// Allow Suuhimochi to walk about 1.5x farther toward the back of the room.
const WALK_BOUNDS = { minX: -44, maxX: 54, minY: -18, maxY: 27 };
const ROOM_FLOOR_BOUNDS = {
  backY: 55,
  frontY: 94,
  backLeft: 5.5,
  backRight: 94.5,
  frontLeft: 1,
  frontRight: 99,
};
const WALK_STEP = { x: 6.2, y: 4.6 };
const WALK_DURATION_MS = 1700;
// Waiting behaviour is intentionally walk-heavy: the room should feel lived
// in, while the occasional idle beat keeps the movement from looking robotic.
const HOME_MOCHI_STATES: MochiState[] = ['walk', 'walk', 'walk', 'idle'];
const HUNGER_MONOLOGUES = [
  'なんかおなかすいたの。',
  'まだ実になってない日があるみたい。',
  'この前の経験、日誌に書いたら実になる？',
  'まだ味わってない日があるの。',
  '日誌に書いてくれたら、経験の実になるんだよ。',
] as const;
const MEAL_READY_MONOLOGUES = [
  'そろそろおなかすいてきたの。',
  'ごはん、まだある？',
  '経験の実、食べたいの。',
] as const;
const SPRITE_ROTATIONS: Record<MochiState, SpriteDirection> = {
  idle: 'south', walk: 'south', sit: 'south', window: 'east', roll: 'south-west', look: 'south', sleep: 'south-west',
};

export function SuuhimochiGame() {
  const [save, setSave] = useState<GameSave>(EMPTY_SAVE);
  const [phase, setPhase] = useState<Phase>('title');
  const [birthday, setBirthday] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [startupProgress, setStartupProgress] = useState(0);
  const [revealBeat, setRevealBeat] = useState(-1);
  const [introLine, setIntroLine] = useState(0);
  const [permissionStep, setPermissionStep] = useState(0);
  const [goalIntroStep, setGoalIntroStep] = useState(0);
  const [initialDialogueText, setInitialDialogueText] = useState('');
  const [isInitialDialogueTyping, setIsInitialDialogueTyping] = useState(false);
  const [initialCallName, setInitialCallName] = useState('');
  const [initialGoalText, setInitialGoalText] = useState('');
  const [isInitialPreview, setIsInitialPreview] = useState(false);
  const [mochiState, setMochiState] = useState<MochiState>('idle');
  const [walkDirection, setWalkDirection] = useState<SpriteDirection>('south');
  const [walkOffset, setWalkOffset] = useState({ x: 0, y: 0 });
  const [walkDuration, setWalkDuration] = useState(WALK_DURATION_MS);
  const [bubble, setBubble] = useState<string | null>(null);
  const [bubblePageIndex, setBubblePageIndex] = useState(0);
  const [promptedQuestionOffer, setPromptedQuestionOffer] = useState(false);
  const [twoDayReviewOffer, setTwoDayReviewOffer] = useState(false);
  const [twoDayReviewTalkOpen, setTwoDayReviewTalkOpen] = useState(false);
  const [timeMode, setTimeMode] = useState<TimeMode>('auto');
  const [clockTime, setClockTime] = useState(getLocalClockTime);
  const isScheduledSleepTimeNow = isScheduledSleepTime(clockTime);
  const [lightsOut, setLightsOut] = useState(false);
  const [memoryOpen, setMemoryOpen] = useState(false);
  const [dictionaryOpen, setDictionaryOpen] = useState(false);
  const [foodOpen, setFoodOpen] = useState(false);
  const [dictionaryEntries, setDictionaryEntries] = useState<WordEntry[]>([]);
  const [dictionaryCategory, setDictionaryCategory] = useState<WordCategory | 'ALL'>('ALL');
  const [itemOpen, setItemOpen] = useState(false);
  const [minigameOpen, setMinigameOpen] = useState(false);
  const [potenoOpen, setPotenoOpen] = useState(false);
  const [dailyProgressOpen, setDailyProgressOpen] = useState(false);
  const [dailyProgressActivityDate, setDailyProgressActivityDate] = useState('');
  const [graduationOpen, setGraduationOpen] = useState(false);
  const [graduationPreview, setGraduationPreview] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);
  const [mobileRoomMode, setMobileRoomMode] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [embeddedMobileKeyboardOpen, setEmbeddedMobileKeyboardOpen] = useState(false);
  const [mobileRoomFit, setMobileRoomFit] = useState({
    ready: false,
    scale: 0.3,
    offsetX: 0,
    offsetY: 0,
    canvasLeft: 0,
    canvasTop: 0,
    canvasBottom: 0,
    canvasWidth: 0,
    canvasHeight: 0,
    dialogueCenterX: 0,
    dialogueTop: 0,
    dialogueWidth: 0,
    keyboardDialogueCenterX: 0,
    keyboardDialogueWidth: 0,
  });
  const [roomPanX, setRoomPanX] = useState(0);
  const [roomOverview, setRoomOverview] = useState(false);
  const [roomViewport, setRoomViewport] = useState({ width: 0, height: 0 });
  const [isRoomPanning, setIsRoomPanning] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsUserName, setSettingsUserName] = useState('');
  const [settingsCallName, setSettingsCallName] = useState('');
  const [settingsBirthday, setSettingsBirthday] = useState('');
  const [clockPosition, setClockPosition] = useState({ x: 74, y: 49 });
  const [itemPositions, setItemPositions] = useState<Record<string, RoomItemPosition>>(INITIAL_ITEM_POSITIONS);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [storedItemIds, setStoredItemIds] = useState<string[]>(INITIAL_STORED_ITEM_IDS);
  const [sleepingBedId, setSleepingBedId] = useState<string | null>(null);
  const [sleepPose, setSleepPose] = useState<{ left: number; top: number } | null>(null);
  const [bedPromptId, setBedPromptId] = useState<string | null>(null);
  const [wakePromptOpen, setWakePromptOpen] = useState(false);
  const [wakingUp, setWakingUp] = useState(false);
  const [bedHandoff, setBedHandoff] = useState(false);
  const [itemTab, setItemTab] = useState<'placed' | 'stored'>('placed');
  const [itemPanelCollapsed, setItemPanelCollapsed] = useState(false);
  const [itemPanelX, setItemPanelX] = useState(3);
  const [showCollisionDebug, setShowCollisionDebug] = useState(false);
  const [maskGrowthAnimating, setMaskGrowthAnimating] = useState(false);
  const [talkOpen, setTalkOpen] = useState(false);
  const [talkCommandOpen, setTalkCommandOpen] = useState(false);
  const [talkReturning, setTalkReturning] = useState(false);
  const [talkPresentation, setTalkPresentation] = useState<{
    origin: { x: number; y: number };
    uiOnLeft: boolean;
  } | null>(null);
  const [talkStage, setTalkStage] = useState<ConversationStage>('topic');
  const [talkText, setTalkText] = useState('');
  const [talkInputPrompt, setTalkInputPrompt] = useState('');
  const [dismissedPromptedSuggestions, setDismissedPromptedSuggestions] = useState<string[]>([]);
  const [currentTalkLine, setCurrentTalkLine] = useState('');
  const [talkPageIndex, setTalkPageIndex] = useState(0);
  const [talkPageCount, setTalkPageCount] = useState(0);
  const [talkPageReady, setTalkPageReady] = useState(false);
  const [isMochiSpeaking, setIsMochiSpeaking] = useState(false);
  const [categoryPage, setCategoryPage] = useState(0);
  const [recentCategories, setRecentCategories] = useState<string[]>([]);
  const [categoryChoices, setCategoryChoices] = useState<CategoryChoice[]>([]);
  const [subCategoryChoices, setSubCategoryChoices] = useState<SubCategoryChoice[]>([]);
  const [talkChoices, setTalkChoices] = useState<ConversationChoice[]>([]);
  const [talkInputMode, setTalkInputMode] = useState<InputMode>('none');
  const [miniDialogue, setMiniDialogue] = useState<DialogueRuntime | null>(null);
  const [miniDialogueMotion, setMiniDialogueMotion] = useState<DialogueMotion | undefined>();
  const [talkLineMotion, setTalkLineMotion] = useState<DialogueMotion>('idle');
  const [talkDebug, setTalkDebug] = useState<DebugSnapshot | null>(null);
  const [zoomEyes, setZoomEyes] = useState<ZoomEyeFrame>('open');
  const [zoomMouth, setZoomMouth] = useState<ZoomMouthFrame>('closed');
  const [devPreviewEmotion, setDevPreviewEmotion] = useState<ZoomFaceEmotion>('neutral');
  const [devPreviewEyes, setDevPreviewEyes] = useState<ZoomEyeFrame>('open');
  const [devPreviewMouth, setDevPreviewMouth] = useState<ZoomMouthFrame>('closed');
  const [devPreviewLeftArm, setDevPreviewLeftArm] = useState<ZoomArmPose>('down');
  const [devPreviewRightArm, setDevPreviewRightArm] = useState<ZoomArmPose>('down');
  const [devPreviewPlaying, setDevPreviewPlaying] = useState(true);
  const [zoomArmPose, setZoomArmPose] = useState<ZoomArmPose>('down');
  const [learnedWords, setLearnedWords] = useState<string[]>([]);
  const [conversationDay, setConversationDay] = useState(1);
  const [conversationPhase, setConversationPhase] = useState('であい');
  const [conversationMemories, setConversationMemories] = useState<ConversationMemory[]>([]);
  const [farewellLetter, setFarewellLetter] = useState<string | null>(null);
  const lastLine = useRef('');
  const speechRun = useRef(0);
  const speechTimers = useRef<number[]>([]);
  const talkPagesRef = useRef<string[]>([]);
  const talkPageIndexRef = useRef(0);
  const talkPageReadyRef = useRef(false);
  const conversation = useRef<SuuhimochiConversation | null>(null);
  const initialPreviewSnapshotRef = useRef<InitialPreviewSnapshot | null>(null);
  const isInitialPreviewRef = useRef(false);
  const initialSequenceTimers = useRef<number[]>([]);
  const initialGoalReplyRef = useRef<ConversationResponse | null>(null);
  const initialGoalReplyLineRef = useRef('');
  const promptedSuggestionQuestionKeyRef = useRef('');
  const twoDayReviewOfferDateRef = useRef('');
  const roomRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const mobileNavRef = useRef<HTMLElement>(null);
  const mobileNavHandleRef = useRef<HTMLButtonElement>(null);
  const roomPanRef = useRef(0);
  const roomPanDragRef = useRef<{ pointerId: number; clientX: number; panX: number; moved: boolean } | null>(null);
  const walkOffsetRef = useRef({ x: 0, y: 0 });
  const walkStepTimer = useRef<number | null>(null);
  const walkRun = useRef(0);
  const bedSleepTargetRef = useRef<string | null>(null);
  const automaticSleepRef = useRef(false);
  const nightWakeOverrideRef = useRef(false);
  const manualWalkUntil = useRef(0);
  const talkReturnTimer = useRef<number | null>(null);
  const shouldAutoCloseTalk = useRef(false);
  const clockDragRef = useRef<{ pointerId: number; x: number; y: number; clientX: number; clientY: number } | null>(null);
  const itemDragRef = useRef<{ id: string; pointerId: number; x: number; y: number; clientX: number; clientY: number } | null>(null);
  const itemPanelDragRef = useRef<{ pointerId: number; x: number; clientX: number } | null>(null);
  const itemPositionsRef = useRef(itemPositions);
  const storedItemIdsRef = useRef(storedItemIds);
  const clockPositionRef = useRef(clockPosition);
  const bubbleRef = useRef<string | null>(null);
  const roomMonologueBubbleRef = useRef<string | null>(null);
  const sleepBubbleLineRef = useRef<string | null>(null);
  const miniDialogueRef = useRef<DialogueRuntime | null>(null);
  const previousMaskGrowthStageRef = useRef<MaskGrowthStage | null>(null);
  const maskGrowthTimerRef = useRef<number | null>(null);

  useEffect(() => { itemPositionsRef.current = itemPositions; }, [itemPositions]);
  useEffect(() => { storedItemIdsRef.current = storedItemIds; }, [storedItemIds]);
  useEffect(() => { isInitialPreviewRef.current = isInitialPreview; }, [isInitialPreview]);
  useEffect(() => { clockPositionRef.current = clockPosition; }, [clockPosition]);
  useEffect(() => { roomPanRef.current = roomPanX; }, [roomPanX]);

  const maskGrowthStage: MaskGrowthStage = save.personaStage ?? getPersonaStage(save.personaExp ?? 0);

  useEffect(() => {
    if (!hydrated || !appReady) return;
    const previousStage = previousMaskGrowthStageRef.current;
    previousMaskGrowthStageRef.current = maskGrowthStage;
    if (previousStage === null || maskGrowthStage <= previousStage) return;

    if (maskGrowthTimerRef.current !== null) window.clearTimeout(maskGrowthTimerRef.current);
    setMaskGrowthAnimating(false);
    const startTimer = window.setTimeout(() => {
      setMaskGrowthAnimating(true);
      maskGrowthTimerRef.current = window.setTimeout(() => {
        setMaskGrowthAnimating(false);
        maskGrowthTimerRef.current = null;
      }, 950);
    }, 20);
    maskGrowthTimerRef.current = startTimer;

    return () => {
      if (maskGrowthTimerRef.current !== null) window.clearTimeout(maskGrowthTimerRef.current);
      maskGrowthTimerRef.current = null;
    };
  }, [appReady, hydrated, maskGrowthStage]);

  useEffect(() => {
    const portraitQuery = window.matchMedia('(orientation: portrait)');
    const coarsePointerQuery = window.matchMedia('(pointer: coarse)');
    const syncDeviceOrientation = () => {
      const mobileUserAgent = /Android|iPhone|iPod|Mobile/i.test(navigator.userAgent);
      const phoneSizedScreen = Math.min(window.screen.width, window.screen.height) <= 900;
      const mobile = mobileUserAgent || (coarsePointerQuery.matches && phoneSizedScreen);
      const portrait = portraitQuery.matches || window.innerHeight > window.innerWidth;
      setIsMobileDevice(mobile);
      setIsMobilePortrait(mobile && portrait);
      setMobileRoomMode(mobile && !portrait);
      if (!mobile || !portrait) {
        roomPanRef.current = 0;
        setRoomPanX(0);
        setRoomOverview(false);
      }
      if (!mobile || portrait) setMobileNavOpen(false);
    };
    syncDeviceOrientation();
    portraitQuery.addEventListener?.('change', syncDeviceOrientation);
    coarsePointerQuery.addEventListener?.('change', syncDeviceOrientation);
    window.addEventListener('resize', syncDeviceOrientation);
    window.addEventListener('orientationchange', syncDeviceOrientation);
    return () => {
      portraitQuery.removeEventListener?.('change', syncDeviceOrientation);
      coarsePointerQuery.removeEventListener?.('change', syncDeviceOrientation);
      window.removeEventListener('resize', syncDeviceOrientation);
      window.removeEventListener('orientationchange', syncDeviceOrientation);
    };
  }, []);

  useEffect(() => {
    const viewport = window.visualViewport;
    const syncVisibleHeight = () => {
      const visibleHeight = viewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--app-visible-height', `${Math.round(visibleHeight)}px`);
    };
    syncVisibleHeight();
    viewport?.addEventListener('resize', syncVisibleHeight);
    window.addEventListener('resize', syncVisibleHeight);
    return () => {
      viewport?.removeEventListener('resize', syncVisibleHeight);
      window.removeEventListener('resize', syncVisibleHeight);
      document.documentElement.style.removeProperty('--app-visible-height');
    };
  }, []);

  useEffect(() => {
    const syncKeyboardVisibility = (event?: Event) => {
      const customEvent = event as CustomEvent<boolean> | undefined;
      setEmbeddedMobileKeyboardOpen(
        typeof customEvent?.detail === 'boolean'
          ? customEvent.detail
          : Boolean(document.querySelector('.suuhimochi-keyboard')),
      );
    };
    syncKeyboardVisibility();
    window.addEventListener('suuhimochi-keyboard-visibility', syncKeyboardVisibility);
    return () => window.removeEventListener('suuhimochi-keyboard-visibility', syncKeyboardVisibility);
  }, []);

  const clampRoomPan = useCallback((value: number) => {
    if (mobileRoomMode) return 0;
    const viewport = roomRef.current?.getBoundingClientRect();
    const world = worldRef.current?.getBoundingClientRect();
    if (!viewport || !world || roomOverview) return 0;
    const maxPan = Math.max(0, (world.width - viewport.width) / 2);
    return Math.max(-maxPan, Math.min(maxPan, value));
  }, [mobileRoomMode, roomOverview]);

  useEffect(() => {
    if (!appReady || isMobilePortrait) return;
    let frame = 0;
    const syncRoomViewport = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const viewport = roomRef.current?.getBoundingClientRect();
        setRoomViewport({ width: viewport?.width ?? window.innerWidth, height: viewport?.height ?? window.innerHeight });
        setRoomPanX((current) => {
          const next = clampRoomPan(current);
          roomPanRef.current = next;
          return next;
        });
      });
    };
    syncRoomViewport();
    window.addEventListener('resize', syncRoomViewport);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', syncRoomViewport);
    };
  }, [appReady, clampRoomPan, isMobilePortrait, mobileRoomMode]);

  const isWalkOffsetBlocked = useCallback((offset: { x: number; y: number }, room: DOMRect) => {
    const ratio = room.width / Math.max(1, room.height);
    const sprite = getDisplayedSpriteMetrics(room, mobileRoomMode);
    // Collision is based on the two feet, not the full sprite rectangle.
    const footX = 41 + offset.x + (sprite.half / room.width) * 100;
    const footY = 54 + offset.y + (sprite.foot / room.height) * 100;
    const footHalfX = (9 / room.width) * 100;
    const footHalfY = (6 / room.height) * 100;
    // Follow the visible joins between the floor and the three walls. The
    // available width widens gradually toward the foreground, matching the
    // perspective shared by the room backgrounds.
    if (footY - footHalfY < ROOM_FLOOR_BOUNDS.backY || footY + footHalfY > ROOM_FLOOR_BOUNDS.frontY) return true;
    const depth = Math.max(0, Math.min(1, (footY - ROOM_FLOOR_BOUNDS.backY) / (ROOM_FLOOR_BOUNDS.frontY - ROOM_FLOOR_BOUNDS.backY)));
    const floorLeft = ROOM_FLOOR_BOUNDS.backLeft + (ROOM_FLOOR_BOUNDS.frontLeft - ROOM_FLOOR_BOUNDS.backLeft) * depth;
    const floorRight = ROOM_FLOOR_BOUNDS.backRight + (ROOM_FLOOR_BOUNDS.frontRight - ROOM_FLOOR_BOUNDS.backRight) * depth;
    if (footX - footHalfX < floorLeft || footX + footHalfX > floorRight) return true;
    if (!storedItemIdsRef.current.includes('clock')) {
      const clock = clockPositionRef.current;
      if (footX + footHalfX > clock.x - 5 && footX - footHalfX < clock.x + 5 && footY + footHalfY > clock.y - 1.5 && footY - footHalfY < clock.y + 2.5) return true;
    }
    const tablePosition = itemPositionsRef.current['low-table'];
    if (tablePosition && !storedItemIdsRef.current.includes('low-table')) {
      const colliderCenterX = tablePosition.x + LOW_TABLE_COLLIDER.offsetX + LOW_TABLE_COLLIDER.width / 2;
      const colliderCenterY = tablePosition.y + LOW_TABLE_COLLIDER.offsetY + LOW_TABLE_COLLIDER.height / 2;
      const normalizedX = (footX - colliderCenterX) / (LOW_TABLE_COLLIDER.width / 2 + footHalfX);
      const normalizedY = (footY - colliderCenterY) / (LOW_TABLE_COLLIDER.height / 2 + footHalfY);
      if (normalizedX * normalizedX + normalizedY * normalizedY <= 1) return true;
    }
    for (const [id, collider] of Object.entries(ROOM_ITEM_COLLIDERS)) {
      if (id === 'low-table' || collider.blocks === false) continue;
      if (storedItemIdsRef.current.includes(id)) continue;
      const position = itemPositionsRef.current[id];
      if (!position) continue;
      const renderedHeight = collider.width * ratio;
      const left = position.x + collider.width * collider.left;
      const top = position.y + renderedHeight * collider.top;
      const width = collider.width * collider.widthFactor;
      const height = renderedHeight * collider.heightFactor;
      if (footX + footHalfX > left && footX - footHalfX < left + width && footY + footHalfY > top && footY - footHalfY < top + height) return true;
    }
    return false;
  }, [mobileRoomMode]);

  const walkInSteps = useCallback((target: { x: number; y: number }, direction: SpriteDirection, distance: number, isManual = false, onComplete?: () => void, stepDurationMs = 150, onBlocked?: () => void) => {
    const start = walkOffsetRef.current;
    // Small overlapping steps keep the body moving continuously while the
    // sprite frames provide the footwork, rather than hopping between points.
    const steps = Math.min(44, Math.max(1, Math.ceil(distance / 8)));
    const stepDuration = stepDurationMs;
    const finishDelay = 150;
    const run = walkRun.current + 1;

    walkRun.current = run;
    if (walkStepTimer.current !== null) window.clearTimeout(walkStepTimer.current);
    if (isManual) manualWalkUntil.current = Date.now() + steps * stepDuration + finishDelay;

    setWalkDirection(direction);
    setWalkDuration(145);
    setMochiState('walk');

    const takeStep = (index: number) => {
      if (walkRun.current !== run) return;
      const progress = index / steps;
      const next = {
        x: start.x + (target.x - start.x) * progress,
        y: start.y + (target.y - start.y) * progress,
      };
      const room = worldRef.current?.getBoundingClientRect();
      if (room && index > 0 && isWalkOffsetBlocked(next, room)) {
        bedSleepTargetRef.current = null;
        walkStepTimer.current = null;
        setMochiState('idle');
        onBlocked?.();
        return;
      }
      walkOffsetRef.current = next;
      setWalkOffset(next);

      if (index < steps) {
        walkStepTimer.current = window.setTimeout(() => takeStep(index + 1), stepDuration);
        return;
      }

      walkStepTimer.current = window.setTimeout(() => {
        if (walkRun.current === run) {
          setMochiState('idle');
          onComplete?.();
        }
        walkStepTimer.current = null;
      }, finishDelay);
    };

    walkStepTimer.current = window.setTimeout(() => takeStep(1), Math.round(stepDuration * 0.55));
  }, [isWalkOffsetBlocked]);

  const beginWalk = useCallback((preferredDirection?: SpriteDirection) => {
    const current = walkOffsetRef.current;
    const stepScale = 0.65 + Math.random() * 1.25;
    const availableDirections = WALK_DIRECTIONS.filter((candidate) => {
      const vector = WALK_VECTORS[candidate];
      const nextX = current.x + vector.x * WALK_STEP.x * stepScale;
      const nextY = current.y + vector.y * WALK_STEP.y * stepScale;
      if (!(nextX >= WALK_BOUNDS.minX && nextX <= WALK_BOUNDS.maxX && nextY >= WALK_BOUNDS.minY && nextY <= WALK_BOUNDS.maxY)) return false;
      const room = worldRef.current?.getBoundingClientRect();
      return !room || !isWalkOffsetBlocked({ x: nextX, y: nextY }, room);
    });
    const direction = preferredDirection && availableDirections.includes(preferredDirection)
      ? preferredDirection
      : availableDirections[Math.floor(Math.random() * availableDirections.length)] ?? preferredDirection ?? 'south';
    const vector = WALK_VECTORS[direction];
    const next = {
      x: Math.max(WALK_BOUNDS.minX, Math.min(WALK_BOUNDS.maxX, current.x + vector.x * WALK_STEP.x * stepScale)),
      y: Math.max(WALK_BOUNDS.minY, Math.min(WALK_BOUNDS.maxY, current.y + vector.y * WALK_STEP.y * stepScale)),
    };
    const distance = Math.hypot(
      (next.x - current.x) * (worldRef.current?.getBoundingClientRect().width ?? window.innerWidth) / 100,
      (next.y - current.y) * (worldRef.current?.getBoundingClientRect().height ?? window.innerHeight) / 100,
    );
    walkInSteps(next, direction, distance);
  }, [isWalkOffsetBlocked, walkInSteps]);

  const requestBedSleep = useCallback((bedId: string) => {
    if (phase !== 'home' || dailyProgressOpen || talkOpen || talkReturning || itemOpen || foodOpen || minigameOpen || potenoOpen || settingsOpen) return;
    if (sleepingBedId === bedId && mochiState === 'sleep') {
      setWakePromptOpen(true);
      return;
    }
    setBedPromptId((current) => current === bedId ? null : bedId);
  }, [dailyProgressOpen, foodOpen, itemOpen, minigameOpen, mochiState, phase, potenoOpen, settingsOpen, sleepingBedId, talkOpen, talkReturning]);

  const startBedSleep = useCallback((bedId: string) => {
    if (phase !== 'home' || dailyProgressOpen || talkOpen || talkReturning || itemOpen || foodOpen || minigameOpen || potenoOpen || settingsOpen) return;
    // Choosing to lie down again after a nighttime wake-up resumes sleep for
    // the rest of this night.
    if (isScheduledSleepTimeNow) nightWakeOverrideRef.current = false;
    const roomElement = worldRef.current;
    const room = roomElement?.getBoundingClientRect();
    const position = itemPositions[bedId] ?? INITIAL_ITEM_POSITIONS[bedId];
    const collider = ROOM_ITEM_COLLIDERS[bedId];
    const bedElement = roomElement?.querySelector<HTMLImageElement>(`[data-room-item-id="${bedId}"]`);
    const bedRect = bedElement?.getBoundingClientRect();
    if (!room || !position || !collider) return;
    const ratio = room.width / Math.max(1, room.height);
    const current = walkOffsetRef.current;
    const sprite = getDisplayedSpriteMetrics(room, mobileRoomMode);
    const baseFootX = room.width * 0.41 + sprite.half;
    const baseFootY = room.height * 0.54 + sprite.foot;
    const currentFootX = baseFootX + current.x * room.width / 100;
    const currentFootY = baseFootY + current.y * room.height / 100;

    // Walk only to the nearest safe edge of the bed. The character no longer
    // walks across the mattress before switching to the sleeping pose.
    let targetRoomX: number;
    let targetRoomY: number;
    if (bedRect) {
      const bedLeft = bedRect.left - room.left;
      const bedTop = bedRect.top - room.top;
      // Approach only from points clearly OUTSIDE the bed footprint.  The
      // previous top-centre candidate was visually on the mattress, and the
      // target bed was temporarily excluded from collision detection, so the
      // character could visibly walk over the bed before sleeping.
      const candidates = [
        { x: bedLeft + bedRect.width * 0.02, y: bedTop + bedRect.height * 0.73 },
        { x: bedLeft + bedRect.width * 0.98, y: bedTop + bedRect.height * 0.73 },
        { x: bedLeft + bedRect.width * 0.50, y: bedTop + bedRect.height * 0.94 },
      ];
      const approach = candidates.reduce((best, candidate) => {
        const bestDistance = Math.hypot(best.x - currentFootX, best.y - currentFootY);
        const candidateDistance = Math.hypot(candidate.x - currentFootX, candidate.y - currentFootY);
        return candidateDistance < bestDistance ? candidate : best;
      });
      targetRoomX = approach.x;
      targetRoomY = approach.y;
    } else {
      targetRoomX = room.width * (position.x - collider.width * 0.02) / 100;
      targetRoomY = room.height * (position.y + collider.width * ratio * 0.73) / 100;
    }

    // Anchor the sleeping pose on the mattress/pillow area rather than the
    // geometric center of the whole bed PNG. This keeps Suuhimochi from
    // looking buried in the frame or footboard.
    const finalSleepPose = bedRect
      ? {
          left: ((bedRect.left - room.left + bedRect.width * 0.55) / room.width) * 100,
          top: ((bedRect.top - room.top + bedRect.height * 0.40) / room.height) * 100,
        }
      : { left: position.x + collider.width * 0.55, top: position.y + collider.width * ratio * 0.40 };
    const target = {
      x: Math.max(WALK_BOUNDS.minX, Math.min(WALK_BOUNDS.maxX, current.x + (targetRoomX - (baseFootX + current.x * room.width / 100)) / room.width * 100)),
      y: Math.max(WALK_BOUNDS.minY, Math.min(WALK_BOUNDS.maxY, current.y + (targetRoomY - (baseFootY + current.y * room.height / 100)) / room.height * 100)),
    };
    const deltaX = target.x - current.x;
    const deltaY = target.y - current.y;
    const direction = WALK_DIRECTIONS.reduce((closest, candidate) => {
      const vector = WALK_VECTORS[candidate];
      return vector.x * deltaX + vector.y * deltaY > WALK_VECTORS[closest].x * deltaX + WALK_VECTORS[closest].y * deltaY ? candidate : closest;
    }, 'south' as SpriteDirection);
    bedSleepTargetRef.current = bedId;
    bubbleRef.current = null;
    setPromptedQuestionOffer(false);
    setBubblePageIndex(0);
    setBubble(null);
    setBedPromptId(null);
    setWakePromptOpen(false);
    setWakingUp(false);
    setSleepingBedId(null);
    setSleepPose(null);
    setMochiState('idle');
    walkInSteps(target, direction, Math.hypot(deltaX * room.width / 100, deltaY * room.height / 100), true, () => {
      // Switch from walking coordinates to the absolute bed pose in ONE paint
      // with outer movement transitions disabled.  Without this hand-off the
      // old walk translate eases back toward 0 while left/top jump to the bed,
      // producing the violent shake seen when climbing into bed.
      setBedHandoff(true);
      bedSleepTargetRef.current = null;
      walkOffsetRef.current = { x: 0, y: 0 };
      setWalkOffset({ x: 0, y: 0 });
      setSleepPose(finalSleepPose);
      setSleepingBedId(bedId);
      setMochiState('sleep');
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => setBedHandoff(false));
      });
    });
  }, [dailyProgressOpen, foodOpen, isScheduledSleepTimeNow, itemOpen, itemPositions, minigameOpen, mobileRoomMode, phase, potenoOpen, settingsOpen, talkOpen, talkReturning, walkInSteps]);

  const wakeFromBed = useCallback((manual = true) => {
    if (manual && isScheduledSleepTimeNow) {
      // A player may wake Suuhimochi during the sleep window. Do not put them
      // straight back into bed until they choose to lie down again or morning
      // arrives.
      nightWakeOverrideRef.current = true;
      automaticSleepRef.current = false;
    }
    if (mochiState !== 'sleep' || !sleepingBedId || wakingUp) {
      setWakePromptOpen(false);
      return;
    }

    const roomElement = worldRef.current;
    const room = roomElement?.getBoundingClientRect();
    const bedElement = roomElement?.querySelector<HTMLImageElement>(`[data-room-item-id="${sleepingBedId}"]`);
    const bedRect = bedElement?.getBoundingClientRect();
    let wakeOffset = { x: 0, y: 0 };
    let wakeDirection: SpriteDirection = 'south-east';

    if (room && bedRect) {
      // Get up on the side of the bed that faces the center of the room so a
      // moved bed still has a sensible exit point and does not wake into a wall.
      const bedCenterX = bedRect.left - room.left + bedRect.width * 0.5;
      const exitRight = bedCenterX < room.width * 0.5;
      // Place the feet fully outside the bed collider. The previous 0.86/0.14
      // point was still inside the bed footprint, which could trap movement.
      const wakeRoomX = bedRect.left - room.left + bedRect.width * (exitRight ? 1.04 : -0.04);
      const wakeRoomY = bedRect.top - room.top + bedRect.height * 0.76;
      const sprite = getDisplayedSpriteMetrics(room, mobileRoomMode);
      const baseFootX = room.width * 0.41 + sprite.half;
      const baseFootY = room.height * 0.54 + sprite.foot;
      wakeOffset = {
        x: Math.max(WALK_BOUNDS.minX, Math.min(WALK_BOUNDS.maxX, (wakeRoomX - baseFootX) / room.width * 100)),
        y: Math.max(WALK_BOUNDS.minY, Math.min(WALK_BOUNDS.maxY, (wakeRoomY - baseFootY) / room.height * 100)),
      };
      wakeDirection = exitRight ? 'south-east' : 'south-west';
    }

    setWakePromptOpen(false);
    setWakingUp(true);
    setBedPromptId(null);

    // First raise/straighten the sleeping pose, then swap to the normal upright
    // sprite beside the bed. This reads as getting out of bed instead of a jump.
    window.setTimeout(() => {
      // The wake-up transform above is allowed to animate for 430 ms.  Only
      // the coordinate-system swap itself is frozen: sleep uses absolute
      // left/top, while ordinary movement uses the room anchor + translate.
      // Keeping those systems from interpolating removes the centre-screen
      // flash that remained in v3.
      setBedHandoff(true);
      walkOffsetRef.current = wakeOffset;
      setWalkOffset(wakeOffset);
      setWalkDirection(wakeDirection);
      bedSleepTargetRef.current = null;
      manualWalkUntil.current = Date.now() + 350;
      setSleepingBedId(null);
      setSleepPose(null);
      setMochiState('idle');

      // Hold the bedside position for two painted frames, then restore the
      // normal transitions.  Removing transition suppression does not change
      // any coordinates, so there is nothing left to animate through centre.
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setWakingUp(false);
          setBedHandoff(false);
        });
      });
    }, 430);
  }, [isScheduledSleepTimeNow, mobileRoomMode, mochiState, sleepingBedId, wakingUp]);

  const walkToClickedPoint = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (bubbleRef.current) {
      if (twoDayReviewOffer) {
        // Like the existing word-question invitation, this prompt may be
        // accepted by clicking the room as well as the speech bubble itself.
        const target = event.target as HTMLElement;
        if (!target.closest('.thought-bubble')) openTwoDayReviewTalk();
        return;
      }
      if (promptedQuestionOffer) {
        // The invitation is a room-wide prompt: clicking anywhere in the room
        // starts the question, while the bubble's own click handler remains
        // available for keyboard and direct-pointer activation.
        const target = event.target as HTMLElement;
        if (!target.closest('.thought-bubble')) openPromptedTalk();
        return;
      }
      if (event.button === 0 || event.pointerType === 'touch') advanceBubblePage();
      return;
    }
    if (phase !== 'home' || dailyProgressOpen || twoDayReviewTalkOpen || talkOpen || talkReturning || itemOpen || foodOpen || minigameOpen || potenoOpen || settingsOpen || event.button !== 0) return;
    if (bedPromptId) setBedPromptId(null);
    bedSleepTargetRef.current = null;
    if (mochiState === 'sleep') {
      setWakePromptOpen(true);
      return;
    }

    // On phones the 1672px interaction world is centered inside the wider
    // 2196px background.  Use that world for the coordinate calculation even
    // when a tap begins on either extended background edge.
    const room = (mobileRoomMode ? worldRef.current?.getBoundingClientRect() : null)
      ?? event.currentTarget.getBoundingClientRect();
    const current = walkOffsetRef.current;
    const spriteHalf = getDisplayedSpriteMetrics(room, mobileRoomMode).half;
    const currentX = room.width * (0.41 + current.x / 100) + spriteHalf;
    const currentY = room.height * (0.54 + current.y / 100) + spriteHalf;
    const desiredX = event.clientX - room.left;
    const desiredY = event.clientY - room.top;
    const deltaX = desiredX - currentX;
    const deltaY = desiredY - currentY;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance < 10) return;

    const next = {
      x: Math.max(WALK_BOUNDS.minX, Math.min(WALK_BOUNDS.maxX, current.x + deltaX / room.width * 100)),
      y: Math.max(WALK_BOUNDS.minY, Math.min(WALK_BOUNDS.maxY, current.y + deltaY / room.height * 100)),
    };
    const direction = WALK_DIRECTIONS.reduce((closest, candidate) => {
      const vector = WALK_VECTORS[candidate];
      return vector.x * deltaX + vector.y * deltaY > WALK_VECTORS[closest].x * deltaX + WALK_VECTORS[closest].y * deltaY
        ? candidate
        : closest;
    }, 'south' as SpriteDirection);
    walkInSteps(next, direction, distance, true);
  }, [advanceBubblePage, bedPromptId, dailyProgressOpen, foodOpen, itemOpen, minigameOpen, mobileRoomMode, mochiState, openPromptedTalk, openTwoDayReviewTalk, phase, potenoOpen, promptedQuestionOffer, settingsOpen, talkOpen, talkReturning, twoDayReviewOffer, twoDayReviewTalkOpen, walkInSteps]);

  const updateClockPosition = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const drag = clockDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const room = event.currentTarget.getBoundingClientRect();
    const x = Math.max(8, Math.min(92, drag.x + (event.clientX - drag.clientX) / room.width * 100));
    const y = Math.max(9, Math.min(86, drag.y + (event.clientY - drag.clientY) / room.height * 100));
    setClockPosition({ x, y });
    event.preventDefault();
  }, []);

  const updateItemPosition = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const drag = itemDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const room = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(92, drag.x + (event.clientX - drag.clientX) / room.width * 100));
    const y = Math.max(0, Math.min(88, drag.y + (event.clientY - drag.clientY) / room.height * 100));
    setItemPositions((current) => ({ ...current, [drag.id]: { x, y } }));
    event.preventDefault();
  }, []);

  const handleWorldPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (dailyProgressOpen) return;
    if (roomOverview) return;
    walkToClickedPoint(event);
  }, [dailyProgressOpen, roomOverview, walkToClickedPoint]);

  const handleRoomEdgePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    // The transparent surface sits only behind the scaled gameplay world on
    // mobile. It makes the added left/right background usable without
    // duplicating events that originate inside the world itself.
    if (!mobileRoomMode || dailyProgressOpen || roomOverview) return;
    walkToClickedPoint(event);
  }, [dailyProgressOpen, mobileRoomMode, roomOverview, walkToClickedPoint]);

  const handleWorldPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    updateClockPosition(event);
    updateItemPosition(event);
    if (clockDragRef.current || itemDragRef.current) return;
    const drag = roomPanDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.clientX;
    if (Math.abs(deltaX) > 6) drag.moved = true;
    const nextPan = clampRoomPan(drag.panX + deltaX);
    roomPanRef.current = nextPan;
    setRoomPanX(nextPan);
    event.preventDefault();
  }, [clampRoomPan, updateClockPosition, updateItemPosition]);

  const handleWorldPointerEnd = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const drag = roomPanDragRef.current;
    const shouldTreatAsTap = Boolean(drag && drag.pointerId === event.pointerId && !drag.moved);
    if (drag?.pointerId === event.pointerId) {
      roomPanDragRef.current = null;
      setIsRoomPanning(false);
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
    clockDragRef.current = null;
    itemDragRef.current = null;
    if (shouldTreatAsTap) walkToClickedPoint(event);
  }, [walkToClickedPoint]);

  const handleWorldPointerCancel = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (roomPanDragRef.current?.pointerId === event.pointerId) {
      roomPanDragRef.current = null;
      setIsRoomPanning(false);
    }
    clockDragRef.current = null;
    itemDragRef.current = null;
  }, []);

  function storeRoomItem(id: string) {
    setStoredItemIds((current) => current.includes(id) ? current : [...current, id]);
    if (selectedItemId === id) setSelectedItemId(null);
    if (itemDragRef.current?.id === id) itemDragRef.current = null;
    if (id === 'clock') clockDragRef.current = null;
  }

  function placeRoomItem(id: string) {
    setStoredItemIds((current) => current.filter((itemId) => itemId !== id));
    setSelectedItemId(id);
    setItemTab('placed');
  }

  function beginItemPanelDrag(event: React.PointerEvent<HTMLElement>) {
    if ((event.target as HTMLElement).closest('button, input, textarea, select')) return;
    itemPanelDragRef.current = { pointerId: event.pointerId, x: itemPanelX, clientX: event.clientX };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function moveItemPanel(event: React.PointerEvent<HTMLElement>) {
    const drag = itemPanelDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const delta = (event.clientX - drag.clientX) / Math.max(1, window.innerWidth) * 100;
    const maxLeft = window.matchMedia('(max-width: 700px)').matches ? 20 : 68;
    setItemPanelX(Math.max(1, Math.min(maxLeft, drag.x + delta)));
    event.preventDefault();
  }

  useEffect(() => {
    const found = loadSave();
    const talk = new SuuhimochiConversation();
    conversation.current = talk;
    let savedLayout: { positions?: Record<string, RoomItemPosition>; clock?: RoomItemPosition; stored?: string[] } | null = null;
    let savedRecentCategories: string[] = [];
    try {
      const raw = localStorage.getItem(ROOM_LAYOUT_STORAGE_KEY);
      if (raw) savedLayout = JSON.parse(raw);
    } catch { /* Use the default room layout when browser storage is unavailable. */ }
    try {
      const raw = localStorage.getItem(RECENT_CATEGORY_STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        savedRecentCategories = [...new Set(parsed.filter((value): value is string => typeof value === 'string' && CATEGORY_KEYS.has(value)))].slice(0, 3);
      }
    } catch { /* Recent categories are optional; start with an empty history. */ }
    queueMicrotask(() => {
      setSave(found); setBirthday(found.birthday); setMochiState(found.state);
      setSettingsUserName(found.userName); setSettingsCallName(found.callName);
      setConversationDay(talk.getCurrentDay());
      setConversationPhase(talk.getPhaseLabel());
      setLearnedWords(talk.getLearnedWords().map((item) => item.word));
      setDictionaryEntries(talk.getWordEntries());
      setConversationMemories(talk.getMemories());
      setFarewellLetter(talk.getLetter());
      setTalkDebug(talk.getDebugSnapshot());
      setRecentCategories(savedRecentCategories);
      if (savedLayout) {
        const validPosition = (value: unknown): value is RoomItemPosition => {
          if (!value || typeof value !== 'object') return false;
          const point = value as RoomItemPosition;
          return Number.isFinite(point.x) && Number.isFinite(point.y);
        };
        const positions = { ...INITIAL_ITEM_POSITIONS };
        for (const item of ROOM_ITEMS) {
          const position = savedLayout.positions?.[item.id];
          if (validPosition(position)) positions[item.id] = {
            x: Math.max(0, Math.min(92, position.x)),
            y: Math.max(0, Math.min(88, position.y)),
          };
        }
        setItemPositions(positions);
        if (validPosition(savedLayout.clock)) setClockPosition({
          x: Math.max(8, Math.min(92, savedLayout.clock.x)),
          y: Math.max(9, Math.min(86, savedLayout.clock.y)),
        });
        if (Array.isArray(savedLayout.stored)) {
          const knownIds = new Set<string>(['clock', ...ROOM_ITEMS.map((item) => item.id)]);
          const stored = [...new Set(savedLayout.stored.filter((id): id is string => typeof id === 'string' && knownIds.has(id)))];
          // Migrate layouts saved before the three bed variants were added:
          // keep the yellow bed placed and offer the red/green variants in
          // storage instead of stacking all three in the room.
          if (!stored.some((id) => id.startsWith('bed-'))) stored.push(...LEGACY_BED_STORED_ITEM_IDS);
          // The mask case was added after room-layout v1 shipped. Keep it in
          // storage for existing rooms until the player explicitly places it.
          if (!Object.prototype.hasOwnProperty.call(savedLayout.positions ?? {}, MASK_CASE_ITEM_ID)
            && !stored.includes(MASK_CASE_ITEM_ID)) stored.push(MASK_CASE_ITEM_ID);
          setStoredItemIds(stored);
        }
      } else {
        // Existing saves from before room-layout persistence retain the
        // historical room. Only a genuinely new room begins with no items.
        setStoredItemIds(found.introComplete ? LEGACY_BED_STORED_ITEM_IDS : INITIAL_STORED_ITEM_IDS);
      }
      if (found.introComplete) setPhase('home');
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!isInitialPreview && hydrated && (save.birthday || save.introComplete)) storeSave({ ...save, state: mochiState });
  }, [isInitialPreview, save, mochiState, hydrated]);

  useEffect(() => {
    if (!hydrated || isInitialPreview || phase !== 'home' || !save.introComplete || dailyProgressOpen || graduationOpen) return;
    const now = new Date();
    if (!isAfterActivityDayStart(now)) return;
    const currentDay = conversation.current?.getCurrentDay() ?? conversationDay;
    if (currentDay < 2) return;
    const activityDate = getActivityDateKey(now);
    if (save.lastDailyProgressActivityDate === activityDate) return;
    setDailyProgressActivityDate(activityDate);
    setDailyProgressOpen(true);
    walkRun.current += 1;
    if (walkStepTimer.current !== null) window.clearTimeout(walkStepTimer.current);
    walkStepTimer.current = null;
    setMochiState((current) => current === 'sleep' ? current : 'idle');
  }, [conversationDay, dailyProgressOpen, graduationOpen, hydrated, isInitialPreview, phase, save.introComplete, save.lastDailyProgressActivityDate]);

  useEffect(() => {
    if (!hydrated || isInitialPreview) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(ROOM_LAYOUT_STORAGE_KEY, JSON.stringify({ positions: itemPositions, clock: clockPosition, stored: storedItemIds }));
      } catch { /* Room editing remains usable without persistent storage. */ }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [clockPosition, hydrated, isInitialPreview, itemPositions, storedItemIds]);

  useEffect(() => {
    if (!hydrated || isInitialPreview) return;
    try {
      localStorage.setItem(RECENT_CATEGORY_STORAGE_KEY, JSON.stringify(recentCategories.slice(0, 3)));
    } catch { /* Category history is optional; the selector remains usable. */ }
  }, [hydrated, isInitialPreview, recentCategories]);

  useEffect(() => {
    const refreshClock = () => setClockTime(getLocalClockTime());
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refreshClock();
    };
    refreshClock();
    const timer = window.setInterval(refreshClock, 60_000);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // From midnight through 06:59 Suuhimochi uses the same bed animation as
  // the manual "横になる" action.  The real local clock, not the background
  // preview selector, controls this routine.  At 07:00 the usual gentle
  // get-up motion returns them to the room.
  useEffect(() => {
    if (!hydrated || !appReady) return;

    if (!isScheduledSleepTimeNow) {
      if (automaticSleepRef.current || nightWakeOverrideRef.current) {
        automaticSleepRef.current = false;
        nightWakeOverrideRef.current = false;
        if (bubbleRef.current === sleepBubbleLineRef.current) {
          bubbleRef.current = null;
          setBubblePageIndex(0);
          setBubble(null);
        }
        sleepBubbleLineRef.current = null;
        if (mochiState === 'sleep' && sleepingBedId) wakeFromBed(false);
      }
      return;
    }

    if (nightWakeOverrideRef.current) return;
    automaticSleepRef.current = true;
    if (phase !== 'home' || talkOpen || talkReturning || itemOpen || foodOpen || minigameOpen || settingsOpen) return;
    const bedId = ROOM_ITEMS.find((item) => BED_ITEM_IDS.has(item.id) && !storedItemIds.includes(item.id))?.id;
    if (!bedId || (mochiState === 'sleep' && sleepingBedId) || bedSleepTargetRef.current) return;
    startBedSleep(bedId);
  }, [appReady, foodOpen, hydrated, isScheduledSleepTimeNow, itemOpen, minigameOpen, mochiState, phase, potenoOpen, settingsOpen, sleepingBedId, startBedSleep, storedItemIds, talkOpen, talkReturning, wakeFromBed]);

  useEffect(() => {
    bubbleRef.current = bubble;
  }, [bubble]);

  // Room monologues are meant to feel like something Suuhimochi mutters to
  // themself. When one needs a second line/page, let it continue on its own
  // after a short reading pause; clicking can still advance it sooner.
  useEffect(() => {
    if (!bubble || bubble !== roomMonologueBubbleRef.current) return;
    const pages = splitRoomMonologuePages(bubble);
    if (pages.length <= 1) return;
    const page = pages[bubblePageIndex] ?? '';
    const delay = Math.max(2_200, Math.min(4_700, Array.from(page).length * 95 + 1_100));
    const timer = window.setTimeout(() => {
      if (bubbleRef.current !== bubble || roomMonologueBubbleRef.current !== bubble) return;
      if (bubblePageIndex < pages.length - 1) {
        setBubblePageIndex((index) => index + 1);
        return;
      }
      roomMonologueBubbleRef.current = null;
      bubbleRef.current = null;
      setBubblePageIndex(0);
      setBubble(null);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [bubble, bubblePageIndex]);

  useEffect(() => {
    if (phase !== 'reveal') return;
    if (revealBeat === -1) {
      const start = window.setTimeout(() => setRevealBeat(0), 1200);
      return () => window.clearTimeout(start);
    }
    const beat = REVEAL_BEATS[revealBeat];
    if (!beat) return;
    if (beat.state === 'walk') beginWalk('east');
    else {
      queueMicrotask(() => setMochiState(beat.state));
      if (revealBeat === REVEAL_BEATS.length - 1) setWalkDirection('south');
    }
    if (!beat.delay || revealBeat === REVEAL_BEATS.length - 1) return;
    const next = window.setTimeout(() => setRevealBeat((value) => value + 1), beat.delay);
    return () => window.clearTimeout(next);
  }, [beginWalk, phase, revealBeat]);

  const pendingTwoDayReview = useMemo(() => {
    if (conversationDay < 3) return null;
    const activityDate = getActivityDateKey();
    const cutoff = new Date(`${activityDate}T12:00:00`);
    cutoff.setDate(cutoff.getDate() - 2);
    const cutoffDate = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
    const recordsByDate = new Map((save.dailyProgressRecords ?? []).map((record) => [record.reviewedDate, record]));
    const reviewedDates = new Set((save.twoDayReviews ?? []).map((record) => record.targetDate));
    const targetDate = [...new Set([...Object.keys(save.journalNotes ?? {}), ...recordsByDate.keys()])]
      .filter((date) => date <= cutoffDate && !reviewedDates.has(date))
      .filter((date) => {
        const doneItems = Object.prototype.hasOwnProperty.call(save.journalNotes ?? {}, date)
          ? save.journalNotes[date]
          : getDoneItems(recordsByDate.get(date));
        return doneItems.length > 0;
      })
      .sort((left, right) => right.localeCompare(left))[0];
    return targetDate ? { targetDate } : null;
  }, [conversationDay, save.dailyProgressRecords, save.journalNotes, save.twoDayReviews]);

  const hasDeferredExperienceDay = useMemo(() => {
    const generatedDates = new Set((save.experienceFruits ?? []).map((fruit) => fruit.sourceDate));
    return (save.dailyProgressRecords ?? []).some((record) => {
      if (!record.noteDeferred || generatedDates.has(record.reviewedDate)) return false;
      const items = Object.prototype.hasOwnProperty.call(save.journalNotes ?? {}, record.reviewedDate)
        ? normalizeDoneItems(save.journalNotes[record.reviewedDate])
        : getDoneItems(record);
      return items.length === 0;
    });
  }, [save.dailyProgressRecords, save.experienceFruits, save.journalNotes]);

  // 食べた時刻を基準にするため、日付が変わっても朝昼晩には紐付けない。
  // 06:00を越えた別の食事用活動日は food.ts 側で自動的に1食目へ戻す。
  const foodStatusNow = useMemo(() => {
    const [hours, minutes] = clockTime.split(':').map(Number);
    const now = new Date();
    if (Number.isFinite(hours) && Number.isFinite(minutes)) now.setHours(hours, minutes, 0, 0);
    return now;
  }, [clockTime]);
  const foodMealStatus = useMemo(() => getExperienceMealStatus({
    activityDate: save.foodActivityDate,
    mealsEaten: save.experienceMealsEaten,
    lastMealAt: save.lastExperienceMealAt,
  }, foodStatusNow), [foodStatusNow, save.experienceMealsEaten, save.foodActivityDate, save.lastExperienceMealAt]);
  const hasFreshExperienceFruit = useMemo(
    () => (save.experienceFruits ?? []).some((fruit) => !fruit.eatenAt && !isFruitSpoiled(fruit, foodStatusNow)),
    [foodStatusNow, save.experienceFruits],
  );

  const saySomething = useCallback(() => {
    if (dailyProgressOpen || twoDayReviewTalkOpen || foodOpen || (isScheduledSleepTimeNow && !nightWakeOverrideRef.current) || potenoOpen || bubbleRef.current || sleepingBedId || bedSleepTargetRef.current) return;
    const showBubble = (line: string, duration: number) => {
      setPromptedQuestionOffer(false);
      setTwoDayReviewOffer(false);
      walkRun.current += 1;
      if (walkStepTimer.current !== null) window.clearTimeout(walkStepTimer.current);
      walkStepTimer.current = null;
      roomMonologueBubbleRef.current = line;
      bubbleRef.current = line;
      setBubblePageIndex(0);
      setBubble(line);
      setMochiState('idle');
      if (splitRoomMonologuePages(line).length > 1) return;
      window.setTimeout(() => {
        if (bubbleRef.current !== line) return;
        roomMonologueBubbleRef.current = null;
        bubbleRef.current = null;
        setBubblePageIndex(0);
        setBubble(null);
      }, duration);
    };
    if (pendingTwoDayReview && twoDayReviewOfferDateRef.current !== pendingTwoDayReview.targetDate) {
      const invitation = replaceCallName(
        'ねえ、人間さん。2日前に書いてたこと、そのあとどうなったか聞いてもいい？',
        getPreferredCallName(save),
      );
      twoDayReviewOfferDateRef.current = pendingTwoDayReview.targetDate;
      walkRun.current += 1;
      if (walkStepTimer.current !== null) window.clearTimeout(walkStepTimer.current);
      walkStepTimer.current = null;
      setMochiState('idle');
      bubbleRef.current = invitation;
      setBubblePageIndex(0);
      setPromptedQuestionOffer(false);
      setTwoDayReviewOffer(true);
      setBubble(invitation);
      window.setTimeout(() => {
        if (bubbleRef.current !== invitation) return;
        bubbleRef.current = null;
        setTwoDayReviewOffer(false);
        setBubblePageIndex(0);
        setBubble(null);
      }, 15_000);
      return;
    }
    if (conversation.current?.getGoal() && Math.random() < 0.18) {
      const preparedMemoryCallout = conversation.current.prepareAmbientMemoryConversation();
      const invitation = replaceCallName(
        preparedMemoryCallout ?? 'ねえ、人間さん。聞きたいことがあるの。少しだけ、お話してくれる？',
        getPreferredCallName(save),
      );
      walkRun.current += 1;
      if (walkStepTimer.current !== null) window.clearTimeout(walkStepTimer.current);
      walkStepTimer.current = null;
      setMochiState('idle');
      bubbleRef.current = invitation;
      setBubblePageIndex(0);
      setPromptedQuestionOffer(true);
      setBubble(invitation);
      window.setTimeout(() => {
        if (bubbleRef.current !== invitation) return;
        bubbleRef.current = null;
        setPromptedQuestionOffer(false);
        setBubblePageIndex(0);
        setBubble(null);
      }, 13_000);
      return;
    }
    if (hasDeferredExperienceDay && Math.random() < 0.2) {
      const candidates = HUNGER_MONOLOGUES.filter((candidate) => candidate !== lastLine.current);
      const line = candidates[Math.floor(Math.random() * candidates.length)] ?? HUNGER_MONOLOGUES[0];
      lastLine.current = line;
      showBubble(line, Math.max(5_600, line.length * 110));
      return;
    }
    if (foodMealStatus.state === 'hungry' && foodMealStatus.mealsEaten > 0 && hasFreshExperienceFruit && Math.random() < 0.18) {
      const candidates = MEAL_READY_MONOLOGUES.filter((candidate) => candidate !== lastLine.current);
      const line = candidates[Math.floor(Math.random() * candidates.length)] ?? MEAL_READY_MONOLOGUES[0];
      lastLine.current = line;
      showBubble(line, Math.max(5_600, line.length * 110));
      return;
    }
    const memoryAfterthought = Math.random() < 0.36 ? conversation.current?.getAmbientMemoryLine() : null;
    const line = memoryAfterthought ?? pickRoomMonologue(
      save.mochiType,
      conversation.current?.getLearnedWords() ?? [],
      Math.random,
      lastLine.current,
      conversation.current?.getCurrentDay(),
    );
    lastLine.current = line;
    showBubble(
      replaceCallName(line, getPreferredCallName(save)),
      Math.max(5600, Math.min(9000, line.length * 105)),
    );
  }, [dailyProgressOpen, foodMealStatus.mealsEaten, foodMealStatus.state, foodOpen, hasDeferredExperienceDay, hasFreshExperienceFruit, isScheduledSleepTimeNow, pendingTwoDayReview, potenoOpen, save.callName, save.mochiType, save.userName, sleepingBedId, twoDayReviewTalkOpen]);

  useEffect(() => {
    if (!appReady || !isScheduledSleepTimeNow || phase !== 'home' || talkOpen || mochiState !== 'sleep' || !sleepingBedId) return;

    let nextLineTimer: number | null = null;
    let closeBubbleTimer: number | null = null;
    let cancelled = false;
    const scheduleNext = (firstLine = false) => {
      if (cancelled) return;
      // The first sleepy murmur comes soon after getting into bed.  Later
      // ones remain irregular so the room still feels quiet and natural.
      const delay = firstLine ? 5_000 : 30_000 + Math.floor(Math.random() * 45_001);
      nextLineTimer = window.setTimeout(sayInSleep, delay);
    };
    const sayInSleep = () => {
      if (cancelled) return;
      if (bubbleRef.current) {
        scheduleNext();
        return;
      }
      const knownWords = conversation.current?.getLearnedWords().map((entry) => entry.word) ?? [];
      const word = knownWords.length > 0 ? knownWords[Math.floor(Math.random() * knownWords.length)] ?? null : null;
      const line = replaceCallName(pickSleepDialogue(word), getPreferredCallName(save));
      sleepBubbleLineRef.current = line;
      bubbleRef.current = line;
      setPromptedQuestionOffer(false);
      setBubblePageIndex(0);
      setBubble(line);
      closeBubbleTimer = window.setTimeout(() => {
        if (bubbleRef.current !== line) return;
        bubbleRef.current = null;
        sleepBubbleLineRef.current = null;
        setBubblePageIndex(0);
        setBubble(null);
      }, Math.max(5_400, Math.min(8_500, line.length * 130)));
      scheduleNext();
    };
    scheduleNext(true);
    return () => {
      cancelled = true;
      if (nextLineTimer !== null) window.clearTimeout(nextLineTimer);
      if (closeBubbleTimer !== null) window.clearTimeout(closeBubbleTimer);
    };
  }, [appReady, isScheduledSleepTimeNow, mochiState, phase, save.callName, save.userName, sleepingBedId, talkOpen]);

  useEffect(() => {
    if (!appReady || phase !== 'home' || dailyProgressOpen || talkOpen || foodOpen || minigameOpen || potenoOpen || twoDayReviewTalkOpen || (isScheduledSleepTimeNow && !nightWakeOverrideRef.current)) return;
    const stateTimer = window.setInterval(() => {
      if (bubbleRef.current || sleepingBedId || bedSleepTargetRef.current || Date.now() < manualWalkUntil.current) return;
      const nextState = HOME_MOCHI_STATES[Math.floor(Math.random() * HOME_MOCHI_STATES.length)];
      if (nextState === 'walk') beginWalk();
      else setMochiState(nextState);
    }, 5800);
    const firstThought = window.setTimeout(saySomething, 4500);
    const thoughtTimer = window.setInterval(saySomething, 17500);
    return () => { window.clearInterval(stateTimer); window.clearTimeout(firstThought); window.clearInterval(thoughtTimer); };
  }, [appReady, beginWalk, dailyProgressOpen, foodOpen, isScheduledSleepTimeNow, minigameOpen, phase, potenoOpen, saySomething, sleepingBedId, talkOpen, twoDayReviewTalkOpen]);

  useEffect(() => () => {
    speechRun.current += 1;
    for (const timer of speechTimers.current) window.clearTimeout(timer);
    speechTimers.current = [];
    if (walkStepTimer.current !== null) window.clearTimeout(walkStepTimer.current);
    if (talkReturnTimer.current !== null) window.clearTimeout(talkReturnTimer.current);
    clockDragRef.current = null;
  }, []);

  const isMonologue = Boolean(bubble && phase === 'home' && !talkOpen);
  // A plain thought bubble stays in the room.  A question offered directly
  // to the user, or a monologue that has response choices, uses the
  // conversation camera treatment; regular talk remains zoomed through
  // `talkOpen` as before.
  const isMonologueZoom = isMonologue && (
    promptedQuestionOffer || talkChoices.length > 0 || categoryChoices.length > 0 || subCategoryChoices.length > 0
  );
  const activeMiniDialogueMotion = useMemo(() => {
    const script = miniDialogue ? getMiniDialogueScript(miniDialogue.scriptId) : null;
    const node = miniDialogue && script ? getDialogueNode(script, miniDialogue) : null;
    if (!node) return miniDialogueMotion;
    if (node.type !== 'character') return miniDialogueMotion;
    return node.motion ?? inferDialogueMotion(resolveDialogueText(node.text, miniDialogue?.slots ?? {}));
  }, [miniDialogue, miniDialogueMotion]);
  const activeMonologueMotion = useMemo<DialogueMotion>(() => {
    if (!isMonologueZoom || !bubble) return 'idle';
    const page = splitBubblePages(bubble)[bubblePageIndex] ?? bubble;
    return inferDialogueMotion(page);
  }, [bubble, bubblePageIndex, isMonologueZoom]);
  const activeZoomMotion = miniDialogue
    ? activeMiniDialogueMotion
    : isMonologueZoom
      ? activeMonologueMotion
      : talkLineMotion;
  const activeZoomEmotion = dialogueMotionToEmotion(activeZoomMotion);

  useEffect(() => {
    if ((!talkOpen && !isMonologueZoom) || save.mochiType !== 1) {
      setZoomEyes('open');
      return;
    }

    let closedTimer: number | null = null;
    let nextBlinkTimer: number | null = null;
    const restingFrame: ZoomEyeFrame = activeZoomEmotion === 'thinking' || activeZoomEmotion === 'sad'
      ? 'half'
      : 'open';
    const blinkTiming = activeZoomEmotion === 'happy'
      ? { delay: 1500, variation: 1000, closed: 520 }
      : activeZoomEmotion === 'surprised'
        ? { delay: 1800, variation: 1100, closed: 340 }
        : activeZoomEmotion === 'nervous'
          ? { delay: 2400, variation: 1300, closed: 210 }
          : activeZoomEmotion === 'sad'
            ? { delay: 3100, variation: 1500, closed: 420 }
            : activeZoomEmotion === 'thinking'
              ? { delay: 3300, variation: 1600, closed: 300 }
              : isMonologueZoom
                ? { delay: 2800, variation: 1500, closed: 200 }
                : { delay: 4200, variation: 1800, closed: 220 };

    setZoomEyes(restingFrame);

    const scheduleBlink = () => {
      nextBlinkTimer = window.setTimeout(() => {
        closedTimer = window.setTimeout(() => {
          setZoomEyes(restingFrame);
          scheduleBlink();
        }, blinkTiming.closed);
        setZoomEyes('closed');
      }, blinkTiming.delay + Math.round(Math.random() * blinkTiming.variation));
    };

    scheduleBlink();
    return () => {
      if (closedTimer !== null) window.clearTimeout(closedTimer);
      if (nextBlinkTimer !== null) window.clearTimeout(nextBlinkTimer);
    };
  }, [activeZoomEmotion, isMonologueZoom, save.mochiType, talkOpen]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production' || !devPreviewPlaying) return;
    const sequence: Array<{ eyes: ZoomEyeFrame; mouth: ZoomMouthFrame }> = [
      { eyes: 'open', mouth: 'closed' },
      { eyes: 'open', mouth: 'small' },
      { eyes: 'open', mouth: 'open' },
      { eyes: 'half', mouth: 'small' },
      { eyes: 'closed', mouth: 'closed' },
      { eyes: 'open', mouth: 'small' },
    ];
    let index = 0;
    const timer = window.setInterval(() => {
      const frame = sequence[index % sequence.length];
      setDevPreviewEyes(frame.eyes);
      setDevPreviewMouth(frame.mouth);
      index += 1;
    }, 480);
    return () => window.clearInterval(timer);
  }, [devPreviewPlaying]);

  useEffect(() => {
    if (!talkOpen || !isMochiSpeaking || save.mochiType !== 1) {
      setZoomMouth('closed');
      setZoomArmPose('down');
      return;
    }

    const armFrames = armFramesForDialogueMotion(activeZoomMotion);
    let armIndex = 0;
    setZoomArmPose(armFrames[armIndex]);

    const armTimer = window.setInterval(() => {
      armIndex = (armIndex + 1) % armFrames.length;
      setZoomArmPose(armFrames[armIndex]);
    }, 2300);

    return () => {
      window.clearInterval(armTimer);
    };
  }, [activeZoomMotion, isMochiSpeaking, save.mochiType, talkOpen]);

  useEffect(() => {
    if (!isMonologueZoom || save.mochiType !== 1) return;
    const monologueText = splitBubblePages(bubble ?? '')[bubblePageIndex] ?? '';
    const voicedCharacters = Array.from(monologueText).filter((character) => !/[\s、。！？!?…]/.test(character)).length;
    const mouthBeatCount = Math.max(1, Math.ceil(voicedCharacters / 4));
    let beatIndex = 0;
    let armIndex = 0;
    const armFrames = armFramesForDialogueMotion(activeMonologueMotion);
    setZoomArmPose('down');
    setZoomMouth('small');
    const mouthTimer = window.setInterval(() => {
      beatIndex += 1;
      if (beatIndex >= mouthBeatCount) {
        window.clearInterval(mouthTimer);
        setZoomMouth('closed');
        return;
      }
      setZoomMouth(beatIndex % 2 === 0 ? 'small' : 'open');
    }, 420);
    const armTimer = window.setInterval(() => {
      armIndex = (armIndex + 1) % armFrames.length;
      setZoomArmPose(armFrames[armIndex]);
    }, 2800);
    return () => {
      window.clearInterval(mouthTimer);
      window.clearInterval(armTimer);
      setZoomMouth('closed');
      setZoomArmPose('down');
    };
  }, [activeMonologueMotion, bubble, bubblePageIndex, isMonologueZoom, save.mochiType]);

  const currentTime = timeMode === 'auto' ? getAutoTime() : timeMode;
  const isDarkPeriod = currentTime === 'night' || currentTime === 'midnight';
  const roomBackground = getRoomBackground(currentTime, isDarkPeriod && lightsOut);
  const startupCriticalAssets = useMemo(() => {
    const visibleRoomItems = ROOM_ITEMS
      .filter((item) => !storedItemIds.includes(item.id))
      .map((item) => item.src);
    const maskArtwork = storedItemIds.includes(MASK_CASE_ITEM_ID)
      ? []
      : ['/assets/kamen/kamen-0.png'];
    return uniqueImageSources([
      roomBackground,
      // The title screen uses this softly blurred legacy room image.
      '/assets/room-evening.png',
      ...STARTUP_CRITICAL_ASSETS,
      ...visibleRoomItems,
      ...maskArtwork,
    ]);
  }, [roomBackground, storedItemIds]);

  useEffect(() => {
    if (!hydrated || appReady) return;
    let cancelled = false;
    void preloadCriticalImages(startupCriticalAssets, (loaded, total) => {
      if (!cancelled) setStartupProgress(total > 0 ? loaded / total * 100 : 100);
    }).then(({ results, sources }) => {
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.warn('[image-preload] Critical image failed:', sources[index], result.reason);
        }
      });
      if (!cancelled) setAppReady(true);
    });
    return () => { cancelled = true; };
  }, [appReady, hydrated, startupCriticalAssets]);

  useEffect(() => {
    if (!appReady) return;
    const critical = new Set(startupCriticalAssets);
    return preloadImagesInIdleBatches(
      BACKGROUND_PRELOAD_ASSETS.filter((src) => !critical.has(src)),
      { batchSize: 8, pauseMs: 160 },
    );
  }, [appReady, startupCriticalAssets]);
  const bedPromptPosition = bedPromptId ? (itemPositions[bedPromptId] ?? INITIAL_ITEM_POSITIONS[bedPromptId]) : null;
  const zoomRightArmPose: ZoomArmPose = zoomArmPose === 'down'
    ? 'down'
    : zoomArmPose === 'up'
      ? 'open'
      : zoomArmPose === 'chest'
        ? 'chest'
      : 'up';
  const revealFinished = revealBeat >= REVEAL_BEATS.length - 1;
  const accent = TYPE_ACCENTS[save.mochiType];
  const bubblePages = useMemo(() => {
    if (!bubble) return [];
    return bubble === roomMonologueBubbleRef.current
      ? splitRoomMonologuePages(bubble)
      : splitBubblePages(bubble);
  }, [bubble]);
  const currentBubblePage = bubblePages[bubblePageIndex] ?? '';
  const bubbleHasNextPage = bubblePageIndex < bubblePages.length - 1;
  const isSleepBubble = mochiState === 'sleep' && bubble === sleepBubbleLineRef.current;
  const isPotenoWelcomeBubble = bubble === 'ポテノが来たよ。';
  const sleepBubbleStyle = isSleepBubble && sleepPose ? {
    left: `${Math.max(2, Math.min(66, sleepPose.left - 16))}%`,
    top: `${Math.max(4, sleepPose.top - 40)}%`,
  } : undefined;
  const currentWorldBounds = worldRef.current?.getBoundingClientRect();
  const roomBounds = roomRef.current?.getBoundingClientRect();
  const displayedSprite = currentWorldBounds ? getDisplayedSpriteMetrics(currentWorldBounds, mobileRoomMode) : { half: 64, foot: 122 };
  const worldLeftInRoom = currentWorldBounds && roomBounds ? currentWorldBounds.left - roomBounds.left : 0;
  const worldTopInRoom = currentWorldBounds && roomBounds ? currentWorldBounds.top - roomBounds.top : 0;
  const potenoWelcomeBubbleStyle = isPotenoWelcomeBubble ? {
    left: `${worldLeftInRoom + (currentWorldBounds?.width ?? roomViewport.width) * (0.41 + walkOffset.x / 100) + displayedSprite.half}px`,
    top: `${worldTopInRoom + (currentWorldBounds?.height ?? roomViewport.height) * (0.54 + walkOffset.y / 100) + displayedSprite.half}px`,
  } : undefined;
  // Keep the last walking heading for idle/looking poses so the character
  // settles facing the direction it just walked toward.
  const spriteDirection = talkOpen || talkReturning || isMonologue
    ? 'south'
    : (mochiState === 'idle' || mochiState === 'look' || mochiState === 'sit')
      ? walkDirection
      : SPRITE_ROTATIONS[mochiState];

  const walkToPoteno = useCallback(() => {
    if (!potenoOpen || mochiState === 'sleep') return;
    const room = worldRef.current?.getBoundingClientRect();
    if (!room) return;
    const current = walkOffsetRef.current;
    const sprite = getDisplayedSpriteMetrics(room, mobileRoomMode);
    const baseFootX = room.width * 0.41 + sprite.half;
    const baseFootY = room.height * 0.54 + sprite.foot;
    // First move to the left of the table while staying above its collider,
    // then come forward. This keeps the pair side by side instead of stopping
    // diagonally behind the table.
    const targetFootX = room.width * 0.36;
    const targetFootY = room.height * 0.9;
    const toOffset = (footX: number, footY: number) => ({
      x: Math.max(WALK_BOUNDS.minX, Math.min(WALK_BOUNDS.maxX, (footX - baseFootX) / room.width * 100)),
      y: Math.max(WALK_BOUNDS.minY, Math.min(WALK_BOUNDS.maxY, (footY - baseFootY) / room.height * 100)),
    });
    const target = {
      ...toOffset(targetFootX, targetFootY),
      // The regular room walk bound stops at the table's rear floor line.
      // For this arrival only, move a little farther toward the camera so
      // Suuhimochi stands near Poteno's foreground line without overlapping.
      y: 25,
    };
    const waypoint = toOffset(targetFootX, room.height * 0.68);
    const directionFor = (from: { x: number; y: number }, to: { x: number; y: number }) => {
      const deltaX = to.x - from.x;
      const deltaY = to.y - from.y;
      return WALK_DIRECTIONS.reduce((closest, candidate) => {
        const vector = WALK_VECTORS[candidate];
        return vector.x * deltaX + vector.y * deltaY > WALK_VECTORS[closest].x * deltaX + WALK_VECTORS[closest].y * deltaY ? candidate : closest;
      }, 'south' as SpriteDirection);
    };
    const finish = () => {
      setWalkDirection('south');
      setMochiState('idle');
    };
    const forwardDeltaX = target.x - waypoint.x;
    const forwardDeltaY = target.y - waypoint.y;
    const forwardDistance = Math.hypot(forwardDeltaX * room.width / 100, forwardDeltaY * room.height / 100);
    const moveForward = () => {
      if (forwardDistance < 12) {
        finish();
        return;
      }
      walkInSteps(target, directionFor(waypoint, target), forwardDistance, false, finish, 230, finish);
    };
    const waypointDeltaX = waypoint.x - current.x;
    const waypointDeltaY = waypoint.y - current.y;
    const waypointDistance = Math.hypot(waypointDeltaX * room.width / 100, waypointDeltaY * room.height / 100);
    if (waypointDistance < 12) {
      moveForward();
      return;
    }
    walkInSteps(waypoint, directionFor(current, waypoint), waypointDistance, false, moveForward, 230, finish);
  }, [mobileRoomMode, mochiState, potenoOpen, walkInSteps]);

  useEffect(() => {
    if (!potenoOpen || bubble !== 'ポテノが来たよ。' || mochiState === 'sleep') return;
    const timer = window.setTimeout(() => {
      if (bubbleRef.current !== 'ポテノが来たよ。') return;
      bubbleRef.current = null;
      setPromptedQuestionOffer(false);
      setBubblePageIndex(0);
      setBubble(null);
      walkToPoteno();
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [bubble, mochiState, potenoOpen, walkToPoteno]);

  function advanceBubblePage() {
    if (!bubble) return;
    if (bubbleHasNextPage) {
      setBubblePageIndex((index) => index + 1);
      return;
    }
    const wasPotenoWelcome = potenoOpen && bubble === 'ポテノが来たよ。';
    if (bubble === roomMonologueBubbleRef.current) roomMonologueBubbleRef.current = null;
    bubbleRef.current = null;
    setPromptedQuestionOffer(false);
    setTwoDayReviewOffer(false);
    setBubblePageIndex(0);
    setBubble(null);
    if (wasPotenoWelcome) walkToPoteno();
  }
  const currentDialogue = useMemo(() => {
    if (phase === 'intro') return INTRO_LINES[introLine];
    if (phase === 'permission') return permissionStep === 0 ? '30日だけ、ここに住んでもいい？' : permissionStep === 1 ? '……30日だけなの。' : '家賃は……もち払いでどう？';
    if (phase === 'welcome') return 'やったの。\nぼくは、すうひもち。これから30日間、よろしくなの。';
    if (phase === 'callName') return 'あのね、にんげんさんのことは、なんと読んだらいいのかな？';
    if (phase === 'persona') return `${getPreferredCallName(save)}。\n……うん。覚えたの。`;
    if (phase === 'goalIntro') return GOAL_INTRO_LINES[goalIntroStep] ?? '';
    if (phase === 'goal') return `30日後、${getPreferredCallName(save)}はどんな景色を見てみたい？`;
    if (phase === 'goalType') return 'この目標は、どれに近い？';
    if (phase === 'goalReply') return initialGoalReplyLineRef.current;
    return '';
  }, [phase, introLine, permissionStep, goalIntroStep, save]);
  const isInitialDialoguePhase = ['intro', 'permission', 'welcome', 'callName', 'persona', 'goalIntro', 'goal', 'goalType', 'goalReply'].includes(phase);
  const initialDialogueReady = isInitialDialoguePhase && !isInitialDialogueTyping && initialDialogueText === currentDialogue;

  useEffect(() => {
    if (!isInitialDialoguePhase || !currentDialogue) {
      setInitialDialogueText('');
      setIsInitialDialogueTyping(false);
      return;
    }

    const characters = Array.from(currentDialogue);
    let cancelled = false;
    let timer: number | null = null;
    setInitialDialogueText('');
    setIsInitialDialogueTyping(true);

    const typeCharacter = (index: number) => {
      if (cancelled) return;
      setInitialDialogueText(characters.slice(0, index + 1).join(''));
      if (index >= characters.length - 1) {
        setIsInitialDialogueTyping(false);
        return;
      }
      const character = characters[index] ?? '';
      const delay = /[。！？!?]/.test(character)
        ? INITIAL_DIALOGUE_SENTENCE_DELAY
        : /[、，…\n]/.test(character)
          ? INITIAL_DIALOGUE_COMMA_DELAY
          : INITIAL_DIALOGUE_CHARACTER_DELAY;
      timer = window.setTimeout(() => typeCharacter(index + 1), delay);
    };

    timer = window.setTimeout(() => typeCharacter(0), 120);
    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
    };
  }, [currentDialogue, isInitialDialoguePhase]);

  useEffect(() => {
    type ToolDefinition = {
      name: string; title: string; description: string; inputSchema: object;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => unknown;
    };
    type ModelContext = { registerTool: (tool: ToolDefinition, options?: { signal?: AbortSignal }) => void | Promise<void> };
    const modelContext = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!modelContext?.registerTool) return;
    const lifecycle = new AbortController();
    const tool: ToolDefinition = {
      name: 'start_suuhimochi_stay',
      title: 'すうひもちとの暮らしを始める',
      description: '誕生日からすうひもちを決め、出会いの場面を始めます。',
      inputSchema: {
        type: 'object', properties: { birthday: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' } },
        required: ['birthday'], additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input) => {
        const candidate = typeof input === 'object' && input !== null ? (input as { birthday?: unknown }).birthday : null;
        if (typeof candidate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(candidate)) throw new Error('birthday must use YYYY-MM-DD');
        const next: GameSave = { ...EMPTY_SAVE, birthday: candidate, mochiType: 1 };
        setBirthday(candidate); setSave(next); if (!isInitialPreviewRef.current) storeSave(next); setRevealBeat(-1); setPhase('reveal');
        return { started: true, day: 0 };
      },
    };
    try { void Promise.resolve(modelContext.registerTool(tool, { signal: lifecycle.signal })).catch(() => undefined); } catch { /* Unsupported preview browser. */ }
    return () => lifecycle.abort();
  }, []);

  function decideBirthday(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!birthday) return;
    const next: GameSave = { ...EMPTY_SAVE, birthday, mochiType: 1 };
    setSave(next); if (!isInitialPreview) storeSave(next); setRevealBeat(-1); setPhase('reveal');
  }

  function openBirthdaySetup() {
    setBirthday((current) => current || getBirthdaySuggestion());
    setPhase('birthday');
  }

  function advanceIntro() {
    if (introLine < INTRO_LINES.length - 1) setIntroLine((line) => line + 1);
    else setPhase('permission');
  }

  function clearInitialSequenceTimers() {
    for (const timer of initialSequenceTimers.current) window.clearTimeout(timer);
    initialSequenceTimers.current = [];
  }

  function accept() {
    clearInitialSequenceTimers();
    setPermissionStep(9);
    setPhase('welcome');
    setMochiState('idle');
  }

  function advanceWelcome() {
    setInitialCallName('');
    setPhase('callName');
  }

  function commitInitialCallName() {
    const callName = initialCallName.trim().slice(0, 20);
    if (!callName) return;
    const next = { ...save, callName };
    setSave(next);
    if (!isInitialPreview) storeSave(next);
    setSettingsCallName(callName);
    setPhase('persona');
  }

  function submitInitialCallName(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    commitInitialCallName();
  }

  function advancePersona() {
    setInitialGoalText('');
    setGoalIntroStep(0);
    setPhase('goalIntro');
  }

  function advanceGoalIntro() {
    if (goalIntroStep < GOAL_INTRO_LINES.length - 1) {
      setGoalIntroStep((step) => step + 1);
      return;
    }
    setPhase('goal');
  }

  function advanceInitialDialogue() {
    if (!initialDialogueReady) return;
    if (phase === 'intro') advanceIntro();
    else if (phase === 'welcome') advanceWelcome();
    else if (phase === 'persona') advancePersona();
    else if (phase === 'goalIntro') advanceGoalIntro();
    else if (phase === 'goalReply') finishUndecidedGoal();
  }

  function finishInitialGoal(response: ConversationResponse) {
    setConversationDay(response.day);
    setConversationPhase(response.phaseLabel);
    const next = { ...save, introComplete: true, state: 'walk' as MochiState };
    setSave(next); if (!isInitialPreview) storeSave(next);
    setPhase('home');
    setMochiState('walk');
    beginWalk('east');
  }

  function commitInitialGoal() {
    const value = initialGoalText.trim();
    if (!value || !conversation.current) return;
    initialGoalReplyRef.current = conversation.current.setGoal(value);
    setPhase('goalType');
  }

  function submitInitialGoal(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    commitInitialGoal();
  }

  function chooseInitialGoalType(goalType: TwoDayReviewGoalType) {
    const response = initialGoalReplyRef.current;
    if (!response) return;
    saveGoalType(goalType);
    const value = initialGoalText.trim();
    initialGoalReplyLineRef.current = `「${value}」かぁ。\nうん。それが${getPreferredCallName(save)}の見たい景色なの。\nぼくも自分の景色を探すから、30日間いっしょに行ってみよう。`;
    setPhase('goalReply');
  }

  function chooseUndecidedGoal() {
    if (!conversation.current) return;
    initialGoalReplyRef.current = conversation.current.setGoalUndecided();
    initialGoalReplyLineRef.current = 'まだ決まっていなくても大丈夫なの。\nぼくも自分の景色を探しながら、一緒に見つけていくの。';
    setPhase('goalReply');
  }

  function finishUndecidedGoal() {
    const response = initialGoalReplyRef.current;
    if (!response) return;
    initialGoalReplyRef.current = null;
    initialGoalReplyLineRef.current = '';
    finishInitialGoal(response);
  }

  function startInitialPreview() {
    if (isInitialPreview || initialPreviewSnapshotRef.current) return;
    initialPreviewSnapshotRef.current = {
      save,
      birthday,
      phase,
      revealBeat,
      introLine,
      permissionStep,
      goalIntroStep,
      initialGoalText,
      mochiState,
      walkDirection,
      walkOffset: { ...walkOffsetRef.current },
      walkDuration,
      lightsOut,
      timeMode,
      sleepingBedId,
      sleepPose,
      bedPromptId,
      wakePromptOpen,
      wakingUp,
      bedHandoff,
      conversation: conversation.current,
      conversationDay,
      conversationPhase,
      learnedWords,
      dictionaryEntries,
      conversationMemories,
      farewellLetter,
      talkDebug,
      itemPositions,
      storedItemIds,
      clockPosition,
      recentCategories,
    };
    isInitialPreviewRef.current = true;
    setIsInitialPreview(true);
    clearInitialSequenceTimers();
    stopTalkSpeech();
    walkRun.current += 1;
    if (walkStepTimer.current !== null) window.clearTimeout(walkStepTimer.current);
    walkStepTimer.current = null;
    if (talkReturnTimer.current !== null) window.clearTimeout(talkReturnTimer.current);
    talkReturnTimer.current = null;
    conversation.current = new SuuhimochiConversation({ storage: createPreviewStorage() });
    walkOffsetRef.current = { x: 0, y: 0 };
    setSave(EMPTY_SAVE);
    setBirthday('');
    setPhase('title');
    setRevealBeat(-1);
    setIntroLine(0);
    setPermissionStep(0);
    setGoalIntroStep(0);
    setInitialCallName('');
    setInitialGoalText('');
    initialGoalReplyRef.current = null;
    initialGoalReplyLineRef.current = '';
    setMochiState('idle');
    setWalkDirection('south');
    setWalkOffset({ x: 0, y: 0 });
    setWalkDuration(WALK_DURATION_MS);
    setBubble(null);
    setBubblePageIndex(0);
    bubbleRef.current = null;
    setSleepingBedId(null);
    setSleepPose(null);
    setBedPromptId(null);
    setWakePromptOpen(false);
    setWakingUp(false);
    setBedHandoff(false);
    setTalkOpen(false);
    setTalkCommandOpen(false);
    setTalkReturning(false);
    setTalkPresentation(null);
    setMemoryOpen(false);
    setDictionaryOpen(false);
    setFoodOpen(false);
    setItemOpen(false);
    setMinigameOpen(false);
    setPotenoOpen(false);
    setSettingsOpen(false);
    setDailyProgressOpen(false);
    setDailyProgressActivityDate('');
    setConversationDay(1);
    setConversationPhase('であい');
    setLearnedWords([]);
    setDictionaryEntries([]);
    setConversationMemories([]);
    setFarewellLetter(null);
    setTalkDebug(null);
  }

  function returnFromInitialPreview() {
    const snapshot = initialPreviewSnapshotRef.current;
    if (!snapshot) return;
    clearInitialSequenceTimers();
    stopTalkSpeech();
    walkRun.current += 1;
    if (walkStepTimer.current !== null) window.clearTimeout(walkStepTimer.current);
    walkStepTimer.current = null;
    if (talkReturnTimer.current !== null) window.clearTimeout(talkReturnTimer.current);
    talkReturnTimer.current = null;
    conversation.current = snapshot.conversation;
    walkOffsetRef.current = { ...snapshot.walkOffset };
    setSave(snapshot.save);
    setBirthday(snapshot.birthday);
    setPhase(snapshot.phase);
    setRevealBeat(snapshot.revealBeat);
    setIntroLine(snapshot.introLine);
    setPermissionStep(snapshot.permissionStep);
    setGoalIntroStep(snapshot.goalIntroStep);
    setInitialCallName('');
    setInitialGoalText(snapshot.initialGoalText);
    initialGoalReplyRef.current = null;
    initialGoalReplyLineRef.current = '';
    setMochiState(snapshot.mochiState);
    setWalkDirection(snapshot.walkDirection);
    setWalkOffset(snapshot.walkOffset);
    setWalkDuration(snapshot.walkDuration);
    setLightsOut(snapshot.lightsOut);
    setTimeMode(snapshot.timeMode);
    setSleepingBedId(snapshot.sleepingBedId);
    setSleepPose(snapshot.sleepPose);
    setBedPromptId(snapshot.bedPromptId);
    setWakePromptOpen(snapshot.wakePromptOpen);
    setWakingUp(snapshot.wakingUp);
    setBedHandoff(snapshot.bedHandoff);
    setConversationDay(snapshot.conversationDay);
    setConversationPhase(snapshot.conversationPhase);
    setLearnedWords(snapshot.learnedWords);
    setDictionaryEntries(snapshot.dictionaryEntries);
    setConversationMemories(snapshot.conversationMemories);
    setFarewellLetter(snapshot.farewellLetter);
    setTalkDebug(snapshot.talkDebug);
    setItemPositions(snapshot.itemPositions);
    setStoredItemIds(snapshot.storedItemIds);
    setClockPosition(snapshot.clockPosition);
    setRecentCategories(snapshot.recentCategories);
    setBubble(null);
    setBubblePageIndex(0);
    bubbleRef.current = null;
    setTalkOpen(false);
    setTalkCommandOpen(false);
    setTalkReturning(false);
    setTalkPresentation(null);
    setMemoryOpen(false);
    setDictionaryOpen(false);
    setFoodOpen(false);
    setItemOpen(false);
    setMinigameOpen(false);
    setPotenoOpen(false);
    setSettingsOpen(false);
    setDailyProgressOpen(false);
    setDailyProgressActivityDate('');
    initialPreviewSnapshotRef.current = null;
    isInitialPreviewRef.current = false;
    setIsInitialPreview(false);
  }

  function clearSpeechTimers() {
    for (const timer of speechTimers.current) window.clearTimeout(timer);
    speechTimers.current = [];
  }

  function stopTalkSpeech() {
    speechRun.current += 1;
    clearSpeechTimers();
    talkPagesRef.current = [];
    talkPageIndexRef.current = 0;
    talkPageReadyRef.current = false;
    setCurrentTalkLine('');
    setTalkPageIndex(0);
    setTalkPageCount(0);
    setTalkPageReady(false);
    setIsMochiSpeaking(false);
    setTalkLineMotion('idle');
    setZoomMouth('closed');
    setZoomArmPose('down');
  }

  function scheduleSpeech(callback: () => void, delay: number) {
    const timer = window.setTimeout(callback, delay);
    speechTimers.current.push(timer);
  }

  function typeTalkPage(pageIndex: number, run: number, initialDelay = 140) {
    if (speechRun.current !== run) return;
    const fullText = talkPagesRef.current[pageIndex] ?? '';
    const characters = Array.from(fullText);
    talkPageIndexRef.current = pageIndex;
    talkPageReadyRef.current = false;
    setTalkPageIndex(pageIndex);
    setTalkPageReady(false);
    setCurrentTalkLine('');
    setTalkLineMotion(inferDialogueMotion(fullText));
    setZoomMouth('closed');
    let voicedCharacters = 0;
    let mouthPulse = 0;

    const typeCharacter = (characterIndex: number) => {
      if (speechRun.current !== run) return;
      const character = characters[characterIndex] ?? '';
      setCurrentTalkLine(characters.slice(0, characterIndex + 1).join(''));
      if (!/[\s、。！？!?…]/.test(character)) {
        // 口は3文字ぶん同じ形を保ち、次の拍で小さく／開くを切り替える。
        // 句読点でリズムをリセットするので、文頭では必ず自然に発声を始められる。
        if (voicedCharacters % MOUTH_PULSE_CHARACTERS === 0) {
          setZoomMouth(mouthPulse % 2 === 0 ? 'small' : 'open');
          mouthPulse += 1;
        }
        voicedCharacters += 1;
      } else {
        setZoomMouth('closed');
        if (/[\s、。！？!?…]/.test(character)) {
          voicedCharacters = 0;
          mouthPulse = 0;
        }
      }
      if (characterIndex < characters.length - 1) {
        const delay = /[。！？!?]/.test(character)
          ? TALK_SENTENCE_DELAY
          : /[、，…]/.test(character)
            ? TALK_COMMA_DELAY
            : TALK_CHARACTER_DELAY;
        scheduleSpeech(() => typeCharacter(characterIndex + 1), delay);
        return;
      }
      setZoomMouth('closed');
      talkPageReadyRef.current = true;
      setTalkPageReady(true);
      if (
        pageIndex === talkPagesRef.current.length - 1 &&
        shouldAutoCloseTalk.current
      ) {
        scheduleSpeech(() => {
          if (speechRun.current !== run || !shouldAutoCloseTalk.current) return;
          shouldAutoCloseTalk.current = false;
          closeTalk();
        }, 850);
      }
    };

    scheduleSpeech(() => typeCharacter(0), initialDelay);
  }

  function playTalkLines(lines: string[], replace: boolean) {
    stopTalkSpeech();
    const pages = lines.flatMap(splitTalkPages).filter(Boolean);
    if (pages.length === 0) return;

    talkPagesRef.current = pages;
    talkPageIndexRef.current = 0;
    setTalkPageCount(pages.length);
    setIsMochiSpeaking(true);
    typeTalkPage(0, speechRun.current, replace ? 240 : 360);
  }

  function showMiniDialogueNode(runtime: DialogueRuntime, replace = false) {
    const script = getMiniDialogueScript(runtime.scriptId);
    const node = script ? getDialogueNode(script, runtime) : null;
    if (!node) return;
    setMochiState('idle');
    if (node.type === 'character') {
      const line = resolveDialogueText(node.text, runtime.slots);
      setMiniDialogueMotion(node.motion ?? inferDialogueMotion(line));
      playTalkLines([replaceCallName(line, getPreferredCallName(save))], replace);
      return;
    }
    stopTalkSpeech();
    setCurrentTalkLine('');
    setTalkInputMode('none');
  }

  function startClosetScare() {
    const script = MINI_DIALOGUE_SCRIPTS[Math.floor(Math.random() * MINI_DIALOGUE_SCRIPTS.length)] ?? closetScare;
    const runtime = createDialogueRuntime(script, { person: getPreferredCallName(save) });
    miniDialogueRef.current = runtime;
    setMiniDialogueMotion(undefined);
    setMiniDialogue(runtime);
    setTalkCommandOpen(false);
    setTalkChoices([]);
    setCategoryChoices([]);
    setSubCategoryChoices([]);
    showMiniDialogueNode(runtime, true);
  }

  function chooseMiniDialogue(nextNodeId: string) {
    const runtime = miniDialogueRef.current;
    if (!runtime || isMochiSpeaking) return;
    const nextRuntime = advanceDialogue(runtime, nextNodeId);
    miniDialogueRef.current = nextRuntime;
    setMiniDialogue(nextRuntime);
    showMiniDialogueNode(nextRuntime);
  }

  function advanceTalkSpeech() {
    if (!isMochiSpeaking || talkPagesRef.current.length === 0) return;

    if (!talkPageReadyRef.current) {
      clearSpeechTimers();
      setCurrentTalkLine(talkPagesRef.current[talkPageIndexRef.current] ?? '');
      setZoomMouth('closed');
      talkPageReadyRef.current = true;
      setTalkPageReady(true);
      return;
    }

    const nextPage = talkPageIndexRef.current + 1;
    if (nextPage < talkPagesRef.current.length) {
      clearSpeechTimers();
      typeTalkPage(nextPage, speechRun.current, 120);
      return;
    }

    const miniRuntime = miniDialogueRef.current;
    const shouldReturnToRoom = shouldAutoCloseTalk.current && !miniRuntime;
    const miniScript = miniRuntime ? getMiniDialogueScript(miniRuntime.scriptId) : null;
    const miniNode = miniRuntime && miniScript ? getDialogueNode(miniScript, miniRuntime) : null;
    if (miniRuntime && miniNode?.type === 'character') {
      const nextRuntime = advanceDialogue(miniRuntime, miniNode.next);
      miniDialogueRef.current = nextRuntime;
      setMiniDialogue(nextRuntime);
    }
    stopTalkSpeech();
    if (shouldReturnToRoom) {
      shouldAutoCloseTalk.current = false;
      closeTalk();
    }
  }

  function applyTalkResponse(response: ConversationResponse, replace = false) {
    setTalkCommandOpen(false);
    setTalkStage(response.stage);
    shouldAutoCloseTalk.current = response.stage === 'complete';
    setTalkInputMode(response.inputMode);
    const responseLines = response.lines.map((line) => replaceCallName(line, getPreferredCallName(save)));
    setTalkInputPrompt(response.inputMode === 'text' ? responseLines.at(-1) ?? '' : '');
    if (response.inputMode === 'category' && response.categoryChoices.length > 0) setCategoryPage(0);
    setTalkChoices(response.choices);
    setCategoryChoices(response.categoryChoices);
    setSubCategoryChoices(response.subCategoryChoices);
    setTalkDebug(response.debug);
    const promptedSuggestionQuestionKey = response.debug?.attributes?.expected === 'PROMPTED_WORD'
      ? `${response.debug.attributes['promptedQuestionId'] ?? ''}:${response.debug.attributes['promptedStarterKey'] ?? ''}`
      : '';
    if (promptedSuggestionQuestionKey !== promptedSuggestionQuestionKeyRef.current) {
      promptedSuggestionQuestionKeyRef.current = promptedSuggestionQuestionKey;
      setDismissedPromptedSuggestions([]);
    }
    setConversationDay(response.day);
    setConversationPhase(response.phaseLabel);
    const talk = conversation.current;
    if (talk) {
      setLearnedWords(talk.getLearnedWords().map((item) => item.word));
      setDictionaryEntries(talk.getWordEntries());
      setConversationMemories(talk.getMemories());
      setFarewellLetter(talk.getLetter());
    }
    playTalkLines(responseLines, replace);
  }

  function captureTalkPresentation() {
    const world = worldRef.current?.getBoundingClientRect();
    const mochi = worldRef.current?.querySelector<HTMLElement>('.mochi')?.getBoundingClientRect();
    const current = walkOffsetRef.current;
    const fallbackX = 41 + current.x + (64 / ROOM_WORLD_WIDTH) * 100;
    const fallbackY = 54 + current.y + (64 / ROOM_WORLD_HEIGHT) * 100;
    const x = world && mochi && world.width > 0
      ? ((mochi.left + mochi.width / 2 - world.left) / world.width) * 100
      : fallbackX;
    const y = world && mochi && world.height > 0
      ? ((mochi.top + mochi.height / 2 - world.top) / world.height) * 100
      : fallbackY;

    setTalkPresentation({
      origin: {
        x: Math.max(2, Math.min(98, x)),
        y: Math.max(4, Math.min(96, y)),
      },
      uiOnLeft: x >= 50,
    });
  }

  function closeTalk() {
    shouldAutoCloseTalk.current = false;
    stopTalkSpeech();
    miniDialogueRef.current = null;
    setMiniDialogueMotion(undefined);
    setMiniDialogue(null);
    setTalkCommandOpen(false);
    if (talkReturnTimer.current !== null) window.clearTimeout(talkReturnTimer.current);
    setTalkOpen(false);
    setSleepingBedId(null);
    setSleepPose(null);
    setBedPromptId(null);
    setTalkReturning(true);
    setMochiState('idle');
    // Only release the camera zoom. Suuhimochi keeps the exact walkOffset it
    // had when the conversation began.
    talkReturnTimer.current = window.setTimeout(() => {
      setTalkPresentation(null);
      setTalkReturning(false);
      talkReturnTimer.current = null;
    }, TALK_CAMERA_TRANSITION_MS + 80);
  }

  function openTalk() {
    // The room can still be viewed and arranged at night, but Suuhimochi does
    // not leave the bed for a conversation during the scheduled sleep window.
    // A player who has explicitly chosen "起きる" may still talk normally.
    if (isScheduledSleepTimeNow && !nightWakeOverrideRef.current) return;
    shouldAutoCloseTalk.current = false;
    roomPanRef.current = 0;
    setRoomPanX(0);
    setRoomOverview(false);
    setMemoryOpen(false);
    setDictionaryOpen(false);
    setFoodOpen(false);
    setItemOpen(false);
    setMinigameOpen(false);
    setPotenoOpen(false);
    setSelectedItemId(null);
    setSettingsOpen(false);
    if (talkReturnTimer.current !== null) window.clearTimeout(talkReturnTimer.current);
    talkReturnTimer.current = null;
    setTalkReturning(false);
    captureTalkPresentation();
    walkRun.current += 1;
    if (walkStepTimer.current !== null) window.clearTimeout(walkStepTimer.current);
    walkStepTimer.current = null;
    bedSleepTargetRef.current = null;
    bubbleRef.current = null;
    setPromptedQuestionOffer(false);
    setTwoDayReviewOffer(false);
    setTwoDayReviewTalkOpen(false);
    setBubblePageIndex(0);
    setBubble(null);
    setSleepingBedId(null);
    setSleepPose(null);
    setBedPromptId(null);
    setTalkOpen(true);
    setMochiState('idle');
    miniDialogueRef.current = null;
    setMiniDialogueMotion(undefined);
    setMiniDialogue(null);
    if (!conversation.current) return;
    if (!conversation.current.getGoal()) {
      applyTalkResponse(conversation.current.startSession(), true);
      return;
    }
    stopTalkSpeech();
    setTalkCommandOpen(true);
    setTalkInputMode('none');
    setTalkChoices([]);
    setCategoryChoices([]);
    setSubCategoryChoices([]);
  }

  function openPromptedTalk() {
    if (isScheduledSleepTimeNow && !nightWakeOverrideRef.current) return;
    setPromptedQuestionOffer(false);
    if (!conversation.current || !conversation.current.getGoal()) {
      openTalk();
      return;
    }
    openTalk();
    applyTalkResponse(conversation.current.startPreparedAmbientConversation(), true);
  }

  function openTwoDayReviewTalk() {
    if (isScheduledSleepTimeNow && !nightWakeOverrideRef.current) return;
    bubbleRef.current = null;
    setBubblePageIndex(0);
    setBubble(null);
    setPromptedQuestionOffer(false);
    setTwoDayReviewOffer(false);
    walkRun.current += 1;
    if (walkStepTimer.current !== null) window.clearTimeout(walkStepTimer.current);
    walkStepTimer.current = null;
    setMochiState('idle');
    setTwoDayReviewTalkOpen(true);
  }

  function openDictionary() {
    setMemoryOpen(false);
    setFoodOpen(false);
    setItemOpen(false);
    setMinigameOpen(false);
    setPotenoOpen(false);
    setSettingsOpen(false);
    setSelectedItemId(null);
    setDictionaryCategory('ALL');
    setDictionaryEntries(conversation.current?.getWordEntries() ?? []);
    setDictionaryOpen(true);
  }

  function forgetDictionaryWord(entry: WordEntry) {
    if (!conversation.current) return;
    const confirmed = typeof window === 'undefined'
      ? true
      : window.confirm(`「${entry.surface}」を辞書から削除するの？`);
    if (!confirmed) return;
    if (!conversation.current.forgetWord(entry.surface)) return;
    const remainingEntries = conversation.current.getWordEntries();
    setDictionaryEntries(remainingEntries);
    setDictionaryCategory((current) => current !== entry.category || remainingEntries.some((item) => item.category === current) ? current : 'ALL');
    setLearnedWords(conversation.current.getLearnedWords().map((item) => item.word));
  }

  function chooseTalkCommand(command: 'chat' | 'teach' | 'question' | 'monologue' | 'skit') {
    if (!conversation.current) return;
    if (command === 'monologue') {
      const learned = conversation.current.getLearnedWords();
      const line = pickRoomMonologue(save.mochiType, learned, Math.random, lastLine.current, conversation.current.getCurrentDay());
      lastLine.current = line;
      setTalkCommandOpen(false);
      setTalkStage('complete');
      shouldAutoCloseTalk.current = true;
      setTalkInputMode('none');
      setTalkChoices([]);
      setCategoryChoices([]);
      setSubCategoryChoices([]);
      setCurrentTalkLine('');
      setMiniDialogueMotion(undefined);
      playTalkLines([replaceCallName(line, getPreferredCallName(save))], true);
      return;
    }
    if (command === 'skit') {
      startClosetScare();
      return;
    }
    miniDialogueRef.current = null;
    setMiniDialogueMotion(undefined);
    setMiniDialogue(null);
    setTalkText('');
    const response = command === 'teach'
      ? conversation.current.startWordTeaching()
      : command === 'question'
        ? conversation.current.startPromptedLearning()
        : conversation.current.startSession();
    applyTalkResponse(response, true);
  }

  function completeDailyProgress(record: DailyProgressRecord) {
    const previousRecords = Array.isArray(save.dailyProgressRecords) ? save.dailyProgressRecords : [];
    const recordItems = normalizeDoneItems(record.doneItems);
    const journalItems = normalizeDoneItems(save.journalNotes?.[record.reviewedDate] ?? []);
    const normalizedItems = recordItems.length > 0 ? recordItems : journalItems;
    const fruitBatch = createExperienceFruitBatch({
      existing: save.experienceFruits ?? [],
      sourceDate: record.reviewedDate,
      kind: 'experience',
      doneItems: normalizedItems,
    });
    const next: GameSave = {
      ...save,
      dailyProgressRecords: [...previousRecords.filter((item) => item.date !== record.date), record].slice(-30),
      lastDailyProgressActivityDate: record.date,
      experienceFruits: fruitBatch.fruits,
    };
    setSave(next);
    if (!isInitialPreview) storeSave(next);
    setDailyProgressOpen(false);
    setDailyProgressActivityDate('');
  }

  function saveJournalDoneItems(date: string, doneItems: string[]) {
    const normalizedItems = normalizeDoneItems(doneItems);
    const nextRecords = (Array.isArray(save.dailyProgressRecords) ? save.dailyProgressRecords : []).map((record) => (
      record.reviewedDate === date
        ? { ...record, doneItems: normalizedItems, note: undefined, noteDeferred: false }
        : record
    ));
    const fruitBatch = date < getActivityDateKey()
      ? createExperienceFruitBatch({
          existing: save.experienceFruits ?? [],
          sourceDate: date,
          kind: 'experience',
          doneItems: normalizedItems,
        })
      : { fruits: save.experienceFruits ?? [], created: [] as ExperienceFruitRecord[] };
    const next: GameSave = {
      ...save,
      dailyProgressRecords: nextRecords,
      journalNotes: { ...save.journalNotes, [date]: normalizedItems },
      experienceFruits: fruitBatch.fruits,
    };
    setSave(next);
    if (!isInitialPreview) storeSave(next);
  }

  function confirmNoExperience(date: string) {
    if (!date || date >= getActivityDateKey()) return;
    const fruitBatch = createExperienceFruitBatch({
      existing: save.experienceFruits ?? [],
      sourceDate: date,
      kind: 'white',
    });
    if (fruitBatch.created.length === 0) return;
    const nextRecords = (save.dailyProgressRecords ?? []).map((record) => (
      record.reviewedDate === date ? { ...record, noteDeferred: false } : record
    ));
    const next: GameSave = {
      ...save,
      dailyProgressRecords: nextRecords,
      journalNotes: { ...save.journalNotes, [date]: [] },
      experienceFruits: fruitBatch.fruits,
    };
    setSave(next);
    if (!isInitialPreview) storeSave(next);
  }

  function eatExperienceFruit(fruitId: string) {
    const fruit = (save.experienceFruits ?? []).find((candidate) => candidate.id === fruitId);
    const now = new Date();
    const mealStatus = getExperienceMealStatus({
      activityDate: save.foodActivityDate,
      mealsEaten: save.experienceMealsEaten,
      lastMealAt: save.lastExperienceMealAt,
    }, now);
    if (!fruit || fruit.eatenAt || isFruitSpoiled(fruit, now) || mealStatus.state !== 'hungry') return null;
    const eatenAt = now.toISOString();
    const experienceMealsEaten = mealStatus.mealsEaten + 1;
    const personaExp = Math.max(0, save.personaExp ?? 0) + (fruit.kind === 'experience' ? 1 : 0);
    const next: GameSave = {
      ...save,
      experienceFruits: (save.experienceFruits ?? []).map((candidate) => (
        candidate.id === fruitId ? { ...candidate, eatenAt } : candidate
      )),
      personaExp,
      personaStage: getPersonaStage(personaExp),
      foodActivityDate: getFoodActivityDate(now),
      experienceMealsEaten,
      lastExperienceMealAt: eatenAt,
    };
    setSave(next);
    if (!isInitialPreview) storeSave(next);

    if (fruit.kind === 'white') {
      const lines = ['今日は白い実なの。', 'もぐもぐ……まっしろな味なの。', 'こういう日もあるんだね。'];
      return lines[Math.floor(Math.random() * lines.length)];
    }
    if (fruit.experienceText) {
      const experience = fruit.experienceText.length > 24 ? `${fruit.experienceText.slice(0, 24)}…` : fruit.experienceText;
      return `「${experience}」の経験、ちょっと濃い味がするの。`;
    }
    return Math.random() < 0.5
      ? 'もぐもぐ……昨日の経験の味なの。'
      : '人間さんのこと、少し分かった気がするの。';
  }

  function saveTwoDayReview(record: TwoDayReviewRecord) {
    const next: GameSave = {
      ...save,
      twoDayReviews: [...(save.twoDayReviews ?? []), record].slice(-90),
    };
    setSave(next);
    if (!isInitialPreview) storeSave(next);
  }

  function saveStrategyRecord(record: StrategyRecord) {
    const next: GameSave = {
      ...save,
      strategyRecords: [...(save.strategyRecords ?? []), record].slice(-30),
    };
    setSave(next);
    if (!isInitialPreview) storeSave(next);
  }

  function saveDivinationRecord(record: SixDivinationRecord) {
    const next: GameSave = {
      ...save,
      divinationRecords: [...(save.divinationRecords ?? []), record].slice(-30),
    };
    setSave(next);
    if (!isInitialPreview) storeSave(next);
  }

  function saveGoalType(goalType: TwoDayReviewGoalType) {
    const next: GameSave = { ...save, goalType };
    setSave(next);
    if (!isInitialPreview) storeSave(next);
  }

  function showGraduationFlow(preview: boolean) {
    stopTalkSpeech();
    setPhase('home');
    setTalkOpen(false);
    setTalkCommandOpen(false);
    setTalkReturning(false);
    setTalkPresentation(null);
    setMemoryOpen(false);
    setDictionaryOpen(false);
    setFoodOpen(false);
    setItemOpen(false);
    setMinigameOpen(false);
    setPotenoOpen(false);
    setSettingsOpen(false);
    setDailyProgressOpen(false);
    setTwoDayReviewTalkOpen(false);
    setGraduationPreview(preview);
    setGraduationOpen(true);
    setMochiState('idle');
  }

  function openGraduationFlow() {
    showGraduationFlow(false);
  }

  function openGraduationPreview() {
    showGraduationFlow(true);
  }

  function closeGraduationPreview() {
    setGraduationOpen(false);
    setGraduationPreview(false);
  }

  function completeGraduation(result: {
    choice: NextGoalChoice;
    goalText: string;
    goalType: TwoDayReviewGoalType;
    footprint: GraduationFootprint;
    handoffAdvice: GraduationHandoffAdvice;
  }) {
    if (!conversation.current) return;
    if (graduationPreview) {
      closeGraduationPreview();
      return;
    }
    const previousGoal = conversation.current.getGoal() ?? 'まだ決まっていない';
    const archive = createThirtyDayCycleArchive({
      cycleNumber: save.cycleNumber,
      mochiId: save.currentMochiId,
      activityDate: getActivityDateKey(),
      goalText: previousGoal,
      goalType: save.goalType ?? null,
      footprint: result.footprint,
      handoffAdvice: result.handoffAdvice,
      dailyProgressRecords: save.dailyProgressRecords ?? [],
      journalNotes: save.journalNotes ?? {},
      twoDayReviews: save.twoDayReviews ?? [],
      strategyRecords: save.strategyRecords ?? [],
      divinationRecords: save.divinationRecords ?? [],
      learnedWords,
      farewellLetter,
    });
    conversation.current.beginNextCycle(result.goalText);
    const nextCycleNumber = save.cycleNumber + 1;
    const next: GameSave = {
      ...save,
      day: 1,
      state: 'idle',
      goalType: result.goalType,
      dailyProgressRecords: [],
      journalNotes: {},
      twoDayReviews: [],
      strategyRecords: [],
      divinationRecords: [],
      experienceFruits: [],
      personaExp: 0,
      personaStage: 0,
      foodActivityDate: '',
      experienceMealsEaten: 0,
      lastExperienceMealAt: '',
      lastDailyProgressActivityDate: getActivityDateKey(),
      cycleNumber: nextCycleNumber,
      currentMochiId: `suuhimochi-cycle-${nextCycleNumber}-${Date.now()}`,
      cycleArchives: [...(save.cycleArchives ?? []), archive],
    };
    setSave(next);
    if (!isInitialPreview) storeSave(next);
    setGraduationOpen(false);
    setGraduationPreview(false);
    setConversationDay(1);
    setConversationPhase('であい');
    setLearnedWords([]);
    setDictionaryEntries([]);
    setConversationMemories([]);
    setFarewellLetter(null);
    setTalkDebug(conversation.current.getDebugSnapshot());
    setRecentCategories([]);
    setDailyProgressActivityDate('');
    setTwoDayReviewOffer(false);
    twoDayReviewOfferDateRef.current = '';
    bubbleRef.current = null;
    setBubble(null);
    setBubblePageIndex(0);
    walkOffsetRef.current = { x: 0, y: 0 };
    setWalkOffset({ x: 0, y: 0 });
    setWalkDirection('south');
    setMochiState('idle');
    setPhase('home');
  }

  function openSettings() {
    setMemoryOpen(false);
    setDictionaryOpen(false);
    setFoodOpen(false);
    setItemOpen(false);
    setMinigameOpen(false);
    setPotenoOpen(false);
    setSelectedItemId(null);
    setSettingsUserName(save.userName);
    setSettingsCallName(save.callName);
    setSettingsBirthday(save.birthday);
    setSettingsOpen(true);
  }

  function openMinigames() {
    setMemoryOpen(false);
    setDictionaryOpen(false);
    setFoodOpen(false);
    setItemOpen(false);
    setPotenoOpen(false);
    setSettingsOpen(false);
    setSelectedItemId(null);
    setBedPromptId(null);
    bubbleRef.current = null;
    setBubblePageIndex(0);
    setBubble(null);
    walkRun.current += 1;
    if (walkStepTimer.current !== null) window.clearTimeout(walkStepTimer.current);
    walkStepTimer.current = null;
    if (mochiState === 'walk') setMochiState('idle');
    setMinigameOpen(true);
  }

  function openPoteno() {
    roomPanRef.current = 0;
    setRoomPanX(0);
    setRoomOverview(false);
    stopTalkSpeech();
    miniDialogueRef.current = null;
    setMiniDialogueMotion(undefined);
    setMiniDialogue(null);
    setTalkOpen(false);
    setTalkCommandOpen(false);
    setTalkReturning(false);
    setTalkPresentation(null);
    setMemoryOpen(false);
    setDictionaryOpen(false);
    setFoodOpen(false);
    setItemOpen(false);
    setMinigameOpen(false);
    setSettingsOpen(false);
    setSelectedItemId(null);
    setBedPromptId(null);
    setWakePromptOpen(false);
    bubbleRef.current = null;
    setBubblePageIndex(0);
    setBubble(null);
    walkRun.current += 1;
    if (walkStepTimer.current !== null) window.clearTimeout(walkStepTimer.current);
    walkStepTimer.current = null;
    if (mochiState === 'walk') setMochiState('idle');
    setWalkDirection('south');
    if (mochiState !== 'sleep') {
      const welcomeLine = 'ポテノが来たよ。';
      bubbleRef.current = welcomeLine;
      setBubblePageIndex(0);
      setPromptedQuestionOffer(false);
      setBubble(welcomeLine);
      setMochiState('idle');
    }
    setPotenoOpen(true);
  }

  function closePoteno() {
    if (bubbleRef.current === 'ポテノが来たよ。') {
      bubbleRef.current = null;
      setBubblePageIndex(0);
      setBubble(null);
    }
    setPotenoOpen(false);
  }

  function openFood() {
    setMemoryOpen(false);
    setDictionaryOpen(false);
    setItemOpen(false);
    setMinigameOpen(false);
    setPotenoOpen(false);
    setSettingsOpen(false);
    setSelectedItemId(null);
    setBedPromptId(null);
    bubbleRef.current = null;
    setPromptedQuestionOffer(false);
    setTwoDayReviewOffer(false);
    setBubblePageIndex(0);
    setBubble(null);
    walkRun.current += 1;
    if (walkStepTimer.current !== null) window.clearTimeout(walkStepTimer.current);
    walkStepTimer.current = null;
    if (mochiState === 'walk') setMochiState('idle');
    setFoodOpen(true);
  }

  function saveSettings(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const userName = settingsUserName.trim().slice(0, 30);
    const callName = settingsCallName.trim().slice(0, 20);
    const birthday = settingsBirthday.trim();
    const birthdayChanged = Boolean(save.birthday && birthday && birthday !== save.birthday);
    // 初回登録は修正回数に数えず、既存の生年月日を変更する時だけ一度の修正権を消費する。
    if (birthdayChanged && save.birthdayCorrectionUsed) return;
    const next: GameSave = {
      ...save,
      userName,
      callName,
      birthday: birthday || save.birthday,
      birthdayCorrectionUsed: save.birthdayCorrectionUsed || birthdayChanged,
    };
    setSave(next);
    if (!isInitialPreview) storeSave(next);
    setSettingsUserName(userName);
    setSettingsCallName(callName);
    setSettingsBirthday(next.birthday);
    setSettingsOpen(false);
  }

  function commitTalk() {
    const value = talkText.trim();
    if (!value || !conversation.current || isMochiSpeaking) return;
    setCurrentTalkLine('');
    setTalkText('');
    applyTalkResponse(conversation.current.submit(value));
  }

  function submitTalk(event: React.SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    commitTalk();
  }

  function choosePromptedSuggestion(suggestion: string) {
    setTalkText(suggestion);
    setDismissedPromptedSuggestions((current) => current.includes(suggestion) ? current : [...current, suggestion]);
  }

  function skipPromptedTalkQuestion() {
    if (!conversation.current || isMochiSpeaking) return;
    setCurrentTalkLine('');
    setTalkText('');
    applyTalkResponse(conversation.current.skipPromptedQuestion());
  }

  function chooseTalkChoice(choice: ConversationChoice) {
    if (!conversation.current || isMochiSpeaking) return;
    setCurrentTalkLine('');
    applyTalkResponse(conversation.current.choose(choice.id));
  }

  function chooseTalkCategory(choice: CategoryChoice) {
    if (!conversation.current || isMochiSpeaking) return;
    if (choice.category !== 'OTHER') {
      setRecentCategories((current) => [choice.category, ...current.filter((category) => category !== choice.category)].slice(0, 3));
    }
    setCurrentTalkLine('');
    applyTalkResponse(conversation.current.chooseCategory(choice.category));
  }

  function chooseTalkSubCategory(choice: SubCategoryChoice) {
    if (!conversation.current || isMochiSpeaking) return;
    setCurrentTalkLine('');
    applyTalkResponse(conversation.current.chooseSubCategory(choice.id));
  }

  function runDevConversation(response: ConversationResponse) {
    setMemoryOpen(false);
    setFoodOpen(false);
    setSelectedItemId(null);
    if (talkReturnTimer.current !== null) window.clearTimeout(talkReturnTimer.current);
    talkReturnTimer.current = null;
    setTalkReturning(false);
    captureTalkPresentation();
    walkRun.current += 1;
    if (walkStepTimer.current !== null) window.clearTimeout(walkStepTimer.current);
    walkStepTimer.current = null;
    bedSleepTargetRef.current = null;
    setTalkOpen(true);
    setSleepingBedId(null);
    setSleepPose(null);
    setBedPromptId(null);
    setTalkText('');
    setMochiState('idle');
    applyTalkResponse(response, true);
  }

  function resetAll() {
    stopTalkSpeech();
    walkRun.current += 1;
    if (walkStepTimer.current !== null) window.clearTimeout(walkStepTimer.current);
    walkStepTimer.current = null;
    bedSleepTargetRef.current = null;
    if (talkReturnTimer.current !== null) window.clearTimeout(talkReturnTimer.current);
    talkReturnTimer.current = null;
    conversation.current?.reset();
    clearSave(); setSave(EMPTY_SAVE); setBirthday(''); bubbleRef.current = null; setBubblePageIndex(0); setBubble(null); setRevealBeat(-1);
    setLearnedWords([]); setDictionaryEntries([]); setDictionaryCategory('ALL'); setDictionaryOpen(false); setConversationMemories([]); setFarewellLetter(null);
    setConversationDay(1); setConversationPhase('であい'); setCurrentTalkLine(''); setCategoryChoices([]); setSubCategoryChoices([]); setTalkChoices([]); setTalkInputMode('none'); setTalkDebug(null);
    setTalkStage('topic'); setTalkOpen(false); setTalkCommandOpen(false); setTalkReturning(false); setTalkPresentation(null); setTalkText(''); setIntroLine(0);
    setDismissedPromptedSuggestions([]); promptedSuggestionQuestionKeyRef.current = '';
    setDailyProgressOpen(false); setDailyProgressActivityDate(''); setGraduationOpen(false); setGraduationPreview(false); setTwoDayReviewOffer(false); setTwoDayReviewTalkOpen(false); twoDayReviewOfferDateRef.current = '';
    setSleepingBedId(null); setSleepPose(null); setBedPromptId(null); setFoodOpen(false); setItemOpen(false); setMinigameOpen(false); setPotenoOpen(false); setSettingsOpen(false); setSettingsUserName(''); setSettingsCallName(''); setClockPosition({ x: 74, y: 49 }); setLightsOut(false); setSelectedItemId(null); setItemPositions(INITIAL_ITEM_POSITIONS); setStoredItemIds(INITIAL_STORED_ITEM_IDS); setItemTab('placed'); setItemPanelCollapsed(false); setItemPanelX(3); setShowCollisionDebug(false);
    walkOffsetRef.current = { x: 0, y: 0 };
    setPermissionStep(0); setInitialCallName(''); setInitialGoalText(''); initialGoalReplyRef.current = null; initialGoalReplyLineRef.current = ''; setMochiState('idle'); setWalkDirection('south'); setWalkOffset({ x: 0, y: 0 }); setPhase('title');
  }

  const talkInputEnabled = talkInputMode === 'text';
  const promptedQuestionInput = talkInputEnabled
    && talkStage === 'topic'
    && talkDebug?.startType === 'QUESTION';
  const promptedSuggestions = promptedQuestionInput
    ? [0, 1, 2, 3]
      .map((index) => talkDebug?.attributes?.[`promptedSuggestion${index}`])
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .filter((value) => !dismissedPromptedSuggestions.includes(value))
    : [];
  const talkPlaceholder = talkStage === 'goal'
    ? '30日後に見たい景色をひとつ…'
    : talkStage === 'topic'
      ? '新しいコトバをひとつ…'
        : talkStage === 'farewell_final'
          ? 'さいごに伝えたいこと…'
          : '返事を書く…';
  const dictionaryCategoryOptions = useMemo(() => (
    [...new Set(dictionaryEntries.map((entry) => entry.category))]
      .sort((left, right) => (CATEGORY_DISPLAY_INDEX.get(left) ?? Number.MAX_SAFE_INTEGER) - (CATEGORY_DISPLAY_INDEX.get(right) ?? Number.MAX_SAFE_INTEGER))
  ), [dictionaryEntries]);
  const visibleDictionaryEntries = useMemo(() => (
    dictionaryEntries
      .filter((entry) => dictionaryCategory === 'ALL' || entry.category === dictionaryCategory)
      .sort((left, right) => Date.parse(right.lastSeen) - Date.parse(left.lastSeen))
  ), [dictionaryCategory, dictionaryEntries]);
  const lowTablePosition = itemPositions['low-table'] ?? INITIAL_ITEM_POSITIONS['low-table'];
  const measuredRoom = worldRef.current?.getBoundingClientRect();
  const measuredRoomHeight = measuredRoom?.height ?? (typeof window !== 'undefined' ? window.innerHeight : 1000);
  const roomRatio = measuredRoom ? measuredRoom.width / Math.max(1, measuredRoom.height) : 1.6;
  const measuredSprite = measuredRoom ? getDisplayedSpriteMetrics(measuredRoom, mobileRoomMode) : { half: 64, foot: 122 };
  const mochiFootY = 54 + walkOffset.y + (measuredSprite.foot / measuredRoomHeight) * 100;
  const lowTableFrontY = lowTablePosition.y + LOW_TABLE_COLLIDER.offsetY + LOW_TABLE_COLLIDER.height;
  const tableShouldOverlayMochi = mochiFootY < lowTableFrontY;
  const cameraOrigin = (() => {
    if (talkPresentation && (talkOpen || talkReturning)) return talkPresentation.origin;
    if (!isMonologueZoom || !measuredRoom) return { x: 48, y: 63 };
    if (mobileRoomMode) {
      const x = 41 + walkOffset.x + (64 / ROOM_WORLD_WIDTH) * 100;
      const y = 54 + walkOffset.y + (64 / ROOM_WORLD_HEIGHT) * 100;
      return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
    }
    const x = 41 + walkOffset.x + (measuredSprite.half / measuredRoom.width) * 100;
    const y = 54 + walkOffset.y + (measuredSprite.half / measuredRoom.height) * 100;
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  })();
  const cameraZoomActive = talkOpen || isMonologueZoom;
  const mobileWorldPosition = (() => {
    if (!mobileRoomMode || !mobileRoomFit.ready) return null;

    // Match the background camera exactly: both layers scale about the same
    // logical point, so furniture remains attached to the floor and walls.
    const originX = ROOM_WORLD_WIDTH * (cameraOrigin.x / 100);
    const originY = ROOM_WORLD_HEIGHT * (cameraOrigin.y / 100);
    const stageOriginX = mobileRoomFit.canvasLeft
      + mobileRoomFit.scale * (ROOM_SAFE_AREA_LEFT + originX);
    const stageOriginY = mobileRoomFit.canvasTop + mobileRoomFit.scale * originY;
    return {
      left: stageOriginX - originX,
      top: stageOriginY - originY,
    };
  })();
  const mobileBackgroundCameraX = ((ROOM_SAFE_AREA_LEFT + ROOM_WORLD_WIDTH * (cameraOrigin.x / 100)) / ROOM_BACKGROUND_WIDTH) * 100;
  const cameraShift = (() => {
    if (!talkOpen || !talkPresentation || !roomBounds) return { x: 0, y: 0 };

    const characterOnRight = talkPresentation.uiOnLeft;
    const minX = roomBounds.width * (characterOnRight ? 0.58 : 0.18);
    const maxX = roomBounds.width * (characterOnRight ? 0.82 : 0.42);
    const minY = roomBounds.height * 0.20;
    const maxY = roomBounds.height * 0.78;
    const baseX = mobileRoomMode && mobileRoomFit.ready
      ? mobileRoomFit.canvasLeft + mobileRoomFit.scale * (ROOM_SAFE_AREA_LEFT + ROOM_WORLD_WIDTH * cameraOrigin.x / 100)
      : roomBounds.width * cameraOrigin.x / 100;
    const baseY = mobileRoomMode && mobileRoomFit.ready
      ? mobileRoomFit.canvasTop + mobileRoomFit.scale * (ROOM_WORLD_HEIGHT * cameraOrigin.y / 100)
      : roomBounds.height * cameraOrigin.y / 100;

    return {
      x: Math.max(minX, Math.min(maxX, baseX)) - baseX,
      y: Math.max(minY, Math.min(maxY, baseY)) - baseY,
    };
  })();
  const mobileCameraShift = cameraShift;
  const mochiWorldX = measuredRoom
    ? 41 + walkOffset.x + (measuredSprite.half / measuredRoom.width) * 100
    : 48;
  const mobileWorldWidth = Math.max(roomViewport.width, roomViewport.height * 1.6);
  const roomOverviewScale = mobileRoomMode && roomOverview && roomViewport.width > 0 && roomViewport.height > 0
    ? Math.min(1, roomViewport.width / mobileWorldWidth)
    : 1;
  // The world is scaled around cameraOrigin during a talk. Project the
  // character's center into screen space and put the UI on the opposite side.
  const mochiTalkScreenX = talkOpen || isMonologueZoom
    ? cameraOrigin.x + (mochiWorldX - cameraOrigin.x) * TALK_CAMERA_ZOOM
    : mochiWorldX;
  const talkUiOnLeft = talkPresentation?.uiOnLeft
    ?? (cameraZoomActive && (mobileRoomMode ? cameraOrigin.x >= 50 : mochiTalkScreenX > 54));
  const miniDialogueScript = miniDialogue ? getMiniDialogueScript(miniDialogue.scriptId) : null;
  const miniDialogueNode = miniDialogue && miniDialogueScript ? getDialogueNode(miniDialogueScript, miniDialogue) : null;
  const otherCategoryChoice = categoryChoices.find((choice) => choice.category === 'OTHER');
  const orderedCategoryChoices = [
    ...recentCategories
      .map((category) => categoryChoices.find((choice) => choice.category === category))
      .filter((choice): choice is CategoryChoice => choice !== undefined && choice.category !== 'OTHER'),
    ...categoryChoices
      .filter((choice) => choice.category !== 'OTHER' && !recentCategories.includes(choice.category))
      .sort((left, right) => (CATEGORY_DISPLAY_INDEX.get(left.category) ?? Number.MAX_SAFE_INTEGER) - (CATEGORY_DISPLAY_INDEX.get(right.category) ?? Number.MAX_SAFE_INTEGER)),
  ];
  const categoryPageCount = Math.max(1, Math.ceil(orderedCategoryChoices.length / 7));
  const safeCategoryPage = Math.max(0, Math.min(categoryPage, categoryPageCount - 1));
  const visibleCategoryChoices = orderedCategoryChoices.slice(safeCategoryPage * 7, safeCategoryPage * 7 + 7);
  const miniFearFaceActive = Boolean(
    miniDialogueNode && (
      (miniDialogueNode.type === 'character' && (miniDialogueNode.motion === 'nervous' || miniDialogueNode.motion === 'surprised'))
      || (miniDialogueNode.type === 'choice' && MINI_FEAR_CHOICE_NODE_IDS.has(miniDialogueNode.id))
    ),
  );
  const mobileInitialKeyboardOpen = mobileRoomMode
    && initialDialogueReady
    && (phase === 'callName' || phase === 'goal');
  const mobileTalkKeyboardOpen = mobileRoomMode
    && talkOpen
    && !isMochiSpeaking
    && !talkCommandOpen
    && talkStage !== 'complete'
    && talkStage !== 'ended'
    && talkInputEnabled;
  const mobileKeyboardOpen = mobileInitialKeyboardOpen || mobileTalkKeyboardOpen;
  const mobileKeyboardVisible = mobileKeyboardOpen || embeddedMobileKeyboardOpen;

  useLayoutEffect(() => {
    if (!mobileRoomMode || !appReady || isMobilePortrait) return;

    let frame = 0;
    let resizeObserver: ResizeObserver | null = null;
    const syncRoomFit = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const room = roomRef.current?.getBoundingClientRect();
        if (!room) return;

        const visualViewport = window.visualViewport;
        const viewportLeft = visualViewport?.offsetLeft ?? 0;
        const viewportTop = visualViewport?.offsetTop ?? 0;
        const viewportRight = viewportLeft + (visualViewport?.width ?? window.innerWidth);
        const viewportBottom = viewportTop + (visualViewport?.height ?? window.innerHeight);
        const visibleLeft = Math.max(room.left, viewportLeft);
        const visibleTop = Math.max(room.top, viewportTop);
        const visibleRight = Math.min(room.right, viewportRight);
        const visibleBottom = Math.min(room.bottom, viewportBottom);
        const visibleWidth = Math.max(1, visibleRight - visibleLeft);
        const visibleHeight = Math.max(1, visibleBottom - visibleTop);

        // Keep the complete 2196 x 941 stage visible during the opening so its
        // dialogue cannot be cropped. Once the user reaches the room, fill the
        // viewport instead: the original 1672 x 941 gameplay area remains
        // centered and shares the same scale, while only the extended side
        // scenery may be cropped on narrower phones.
        const widthScale = visibleWidth / ROOM_BACKGROUND_WIDTH;
        const heightScale = visibleHeight / ROOM_BACKGROUND_HEIGHT;
        const scale = phase === 'home'
          ? Math.max(widthScale, heightScale)
          : Math.min(widthScale, heightScale);
        const canvasWidth = ROOM_BACKGROUND_WIDTH * scale;
        const canvasHeight = ROOM_BACKGROUND_HEIGHT * scale;
        const canvasLeft = visibleLeft + (visibleWidth - canvasWidth) / 2;
        const canvasTop = visibleTop + (visibleHeight - canvasHeight) / 2;
        const canvasBottom = room.bottom - (canvasTop + canvasHeight);
        const availableCenterX = canvasLeft + canvasWidth / 2;
        const availableCenterY = canvasTop + canvasHeight / 2;
        const roomCenterX = room.left + room.width / 2;
        const roomCenterY = room.top + room.height / 2;
        const dialogueWidth = Math.min(canvasWidth * 0.68, visibleWidth - 32);
        const keyboardDialogueWidth = Math.min(canvasWidth * 0.54, visibleWidth * 0.53);

        setMobileRoomFit((current) => {
          const next = {
            ready: true,
            scale,
            offsetX: availableCenterX - roomCenterX,
            offsetY: availableCenterY - roomCenterY,
            canvasLeft: canvasLeft - room.left,
            canvasTop: canvasTop - room.top,
            canvasBottom,
            canvasWidth,
            canvasHeight,
            dialogueCenterX: availableCenterX - room.left,
            dialogueTop: canvasTop - room.top + Math.max(16, canvasHeight * 0.075),
            dialogueWidth,
            keyboardDialogueCenterX: canvasLeft - room.left + canvasWidth * 0.31,
            keyboardDialogueWidth,
          };
          return current.ready === next.ready
            && Math.abs(current.scale - next.scale) < 0.0005
            && Math.abs(current.offsetX - next.offsetX) < 0.5
            && Math.abs(current.offsetY - next.offsetY) < 0.5
            && Math.abs(current.canvasTop - next.canvasTop) < 0.5
            && Math.abs(current.canvasBottom - next.canvasBottom) < 0.5
            && Math.abs(current.canvasHeight - next.canvasHeight) < 0.5
            && Math.abs(current.dialogueTop - next.dialogueTop) < 0.5
            && Math.abs(current.dialogueWidth - next.dialogueWidth) < 0.5
            ? current
            : next;
        });
      });
    };

    syncRoomFit();
    resizeObserver = new ResizeObserver(syncRoomFit);
    if (roomRef.current) resizeObserver.observe(roomRef.current);
    window.visualViewport?.addEventListener('resize', syncRoomFit);
    window.visualViewport?.addEventListener('scroll', syncRoomFit);
    window.addEventListener('resize', syncRoomFit);
    window.addEventListener('orientationchange', syncRoomFit);
    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      window.visualViewport?.removeEventListener('resize', syncRoomFit);
      window.visualViewport?.removeEventListener('scroll', syncRoomFit);
      window.removeEventListener('resize', syncRoomFit);
      window.removeEventListener('orientationchange', syncRoomFit);
    };
  // The room does not exist yet on the title and birthday screens. Re-run
  // when the opening phase mounts it so the first character and speech bubble
  // are never left waiting for a resize event.
  }, [appReady, isMobilePortrait, mobileRoomMode, phase]);

  if (!hydrated || !appReady) return <StartupLoadingScreen progress={startupProgress} />;
  if (isMobileDevice && isMobilePortrait) return <RotateDeviceScreen />;

  const mobileLandscapeClass = isMobileDevice ? ' mobile-landscape' : '';

  if (phase === 'title') return (
    <main className={`title-screen startup-content-ready${mobileLandscapeClass}`}>
      <div className="title-dust" aria-hidden="true" />
      <section className="title-content">
        <span className="title-moon" aria-hidden="true">○</span>
        <h1>すうひもちと僕の30日</h1>
        <p>30日間、目標に向かって。<br />すうひもちと見たことのない景色へ。</p>
        <button className="primary-button" onClick={openBirthdaySetup}>はじめる</button>
      </section>
      {isInitialPreview && <button className="initial-preview-return" type="button" onClick={returnFromInitialPreview}>現在のデータに戻る</button>}
    </main>
  );

  if (phase === 'birthday') return (
    <main className={`birthday-screen startup-content-ready${mobileLandscapeClass}`}>
      <section className="birthday-card">
        <div className="birthday-companion" aria-hidden="true">
          <span className="birthday-companion-speech">こんにちはなの</span>
          <div className="birthday-zoom-mochi">
            <img className="birthday-zoom-part birthday-zoom-arm birthday-zoom-arm-idle birthday-zoom-arm-left" src={`${ZOOM_ASSET_ROOT}/arms/left/arm-left-down.png`} alt="" draggable={false} />
            <img className="birthday-zoom-part birthday-zoom-arm birthday-zoom-arm-idle birthday-zoom-arm-right" src={`${ZOOM_ASSET_ROOT}/arms/right/arm-right-down.png`} alt="" draggable={false} />
            <img className="birthday-zoom-part birthday-zoom-body" src={`${ZOOM_ASSET_ROOT}/body/body-front.png`} alt="" draggable={false} />
            <img className="birthday-zoom-part birthday-zoom-face birthday-zoom-eye birthday-zoom-eye-open" src={zoomEyeAsset('neutral', 'open')} alt="" draggable={false} />
            <img className="birthday-zoom-part birthday-zoom-face birthday-zoom-eye birthday-zoom-eye-closed" src={zoomEyeAsset('neutral', 'closed')} alt="" draggable={false} />
            <img className="birthday-zoom-part birthday-zoom-face birthday-zoom-mouth birthday-zoom-mouth-closed" src={zoomMouthAsset('closed')} alt="" draggable={false} />
            <img className="birthday-zoom-part birthday-zoom-face birthday-zoom-mouth birthday-zoom-mouth-small" src={zoomMouthAsset('small')} alt="" draggable={false} />
            <img className="birthday-zoom-part birthday-zoom-face birthday-zoom-mouth birthday-zoom-mouth-open" src={zoomMouthAsset('open')} alt="" draggable={false} />
          </div>
        </div>
        <form className="birthday-form" onSubmit={decideBirthday}>
          <p className="eyebrow">すうひもちと暮らすために、最初にひとつだけ。</p>
          <h1>生年月日を<br />教えてください。</h1>
          <p className="birthday-guide">生まれた日を選んでね。<br />あなたに合ったすうひもちが、待っているの。</p>
          <label className="birthday-input-label" htmlFor="birthday-input"><span>生年月日</span><input id="birthday-input" type="date" value={birthday} onChange={(event) => setBirthday(event.target.value)} required max={new Date().toISOString().slice(0, 10)} /></label>
          <button className="primary-button" type="submit" disabled={!birthday}>この日にする</button>
          <button className="text-button" type="button" onClick={() => setPhase('title')}>もどる</button>
        </form>
      </section>
      {isInitialPreview && <button className="initial-preview-return" type="button" onClick={returnFromInitialPreview}>現在のデータに戻る</button>}
    </main>
  );

  return (
    <main className={`game-shell startup-content-ready${mobileLandscapeClass}${mobileKeyboardVisible ? ' mobile-keyboard-open' : ''}${talkOpen && talkUiOnLeft ? ' talk-input-ui-left' : ''} time-${currentTime} ${phase === 'reveal' && revealBeat < 0 ? 'blackout' : ''}`} onPointerDown={['intro', 'welcome', 'persona', 'goalIntro', 'goalReply'].includes(phase) ? (event) => { if (!(event.target as HTMLElement).closest('button, input, textarea, select')) advanceInitialDialogue(); } : undefined}>
      <style>{`
        .mochi.mochi-conversation {
          z-index: 4 !important;
          transform-origin: 50% 85% !important;
          animation: none !important;
          transition: none !important;
        }

        /* Once the zoom layer is removed, restore the 64×64/128px sprite
           container without changing its current world position. */
        .mochi-type-1.mochi-returning {
          width: 128px !important;
        }

        /* On hand-off, preserve the current world offset and let only the
           normal walking translate drive the return motion. */
        .mochi-type-1:not(.mochi-conversation):not(.mochi-returning) {
          transition: left var(--walk-duration, 145ms) cubic-bezier(.22,.75,.28,1), top var(--walk-duration, 145ms) cubic-bezier(.22,.75,.28,1), transform .9s cubic-bezier(.22,.72,.28,1) !important;
        }

        /* Atomic coordinate hand-off used only for the two frames where we
           switch between normal walking coordinates and the absolute bed pose.
           This selector intentionally comes AFTER the normal movement rule and
           is more specific, so !important cannot be overridden by it. */
        .mochi-type-1.mochi-bed-handoff:not(.mochi-conversation):not(.mochi-returning) {
          transition: none !important;
          animation: none !important;
        }

        .mochi.mochi-conversation .sprite,
        .mochi.mochi-conversation .sprite img {
          animation: none !important;
        }

        .zoom-mochi {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
          isolation: isolate;
          /* The zoom body is assembled from transparent layers. Keep a
             quiet, continuous outline around the finished silhouette so it
             stays readable against every room background. */
          filter:
            drop-shadow(1.25px 0 0 rgba(62, 43, 35, .92))
            drop-shadow(-1.25px 0 0 rgba(62, 43, 35, .92))
            drop-shadow(0 1.25px 0 rgba(62, 43, 35, .92))
            drop-shadow(0 -1.25px 0 rgba(62, 43, 35, .92));
          /* Conversation-only enlargement. The wrapper keeps its world
             anchor, while the assembled character grows around its feet. */
          transform: scale(1.28);
          transform-origin: 50% 85%;
          animation: zoom-gentle-breathe 4.6s ease-in-out infinite;
          will-change: transform;
        }

        @keyframes zoom-gentle-breathe {
          0%, 100% { transform: scale(1.28) translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: scale(1.28) translate3d(0, -1.5%, 0) rotate(-0.45deg); }
        }

        .zoom-mochi .zoom-part {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          opacity: 0;
          pointer-events: none;
          transition: opacity 540ms ease-in-out;
          image-rendering: auto;
        }

        .zoom-mochi .zoom-body {
          z-index: 1;
          opacity: 1;
        }

        .zoom-mochi .zoom-arm {
          z-index: 2;
        }

        .zoom-mochi .zoom-face {
          z-index: 3;
        }

        .zoom-mochi .zoom-part.is-active {
          opacity: 1;
        }

        .world-layer {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 50%;
          width: 100%;
          height: 100%;
          z-index: 1;
          overflow: visible;
          background: #17130f url('/assets/room-evening.png') center / cover no-repeat;
          transform-origin: var(--camera-x, 48%) var(--camera-y, 63%);
          transform: scale(1);
          translate: calc(-50% + var(--room-pan-x, 0px) + var(--camera-shift-x, 0px)) var(--camera-shift-y, 0px);
          transition: transform ${TALK_CAMERA_TRANSITION_MS}ms cubic-bezier(.22,.75,.28,1), translate ${TALK_CAMERA_TRANSITION_MS}ms cubic-bezier(.22,.75,.28,1);
          will-change: transform;
        }

        .world-layer.world-layer-talk {
          transform: scale(${TALK_CAMERA_ZOOM});
        }

        .world-layer.room-world-overview {
          transform: scale(var(--room-overview-scale, 1));
          transform-origin: 50% 50%;
          translate: -50% 0;
        }

        .world-layer.room-world-panning {
          transition: transform ${TALK_CAMERA_TRANSITION_MS}ms cubic-bezier(.22,.75,.28,1), translate 0ms linear;
        }

        @media (max-width: 1024px) and (orientation: landscape) {
          .mobile-landscape .world-layer,
          .mobile-landscape .world-layer.world-layer-talk,
          .mobile-landscape .world-layer.room-world-overview {
            top: var(--mobile-world-top, 50%);
            bottom: auto;
            left: var(--mobile-world-left, 50%);
            width: ${ROOM_WORLD_WIDTH}px;
            height: ${ROOM_WORLD_HEIGHT}px;
            transform: translate(var(--mobile-camera-shift-x, 0px), var(--mobile-camera-shift-y, 0px)) scale(calc(var(--mobile-room-fit-scale, .3) * var(--mobile-camera-scale, 1)));
            transform-origin: var(--mobile-camera-x, 50%) var(--mobile-camera-y, 50%);
            translate: none;
            touch-action: manipulation;
            background-color: transparent !important;
            background-image: none !important;
            transition: transform var(--mobile-camera-transition, ${TALK_CAMERA_TRANSITION_MS}ms) cubic-bezier(.22,.75,.28,1);
          }

          .mobile-landscape .world-layer > .room-tint {
            display: none;
          }

          .mobile-landscape .world-layer .room-clock {
            width: 13%;
          }

        }

        /* The unlit night background is paired with a gentle dim on the
           foreground furniture so objects feel like they share the room's
           darkness instead of remaining brightly lit above the tint layer. */
        .world-layer.world-layer-lights-out .room-items,
        .world-layer.world-layer-lights-out .room-clock {
          filter: brightness(.46) saturate(.78);
          transition: filter 700ms ease;
        }

        /* The directional frames already contain the footwork. Keep the
           character anchored while walking so it reads as a step, not a slide. */
        .mochi-type-1.mochi-walk {
          animation: none !important;
        }

        /* Keep the original multi-frame sleeping animation. Position/rotation
           is handled by the outer .mochi element so the frame animation remains intact. */

        .face-talk {
          position: absolute;
          inset: 0;
          z-index: 18;
          display: grid;
          grid-template-columns: minmax(180px, 1fr) minmax(220px, 30%) minmax(200px, 1fr);
          align-items: center;
          column-gap: clamp(12px, 2vw, 40px);
          padding: 7% 3% 13%;
          pointer-events: none;
        }

        .face-talk.face-talk-speaking {
          pointer-events: auto;
          cursor: pointer;
        }

        .face-talk-close {
          position: absolute;
          top: clamp(58px, 9%, 76px);
          right: 4%;
          z-index: 3;
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          border: 1px solid rgba(73, 52, 37, .32);
          border-radius: 50%;
          color: #4e3b2d;
          background: rgba(255, 250, 235, .92);
          box-shadow: 0 4px 0 rgba(77, 52, 35, .18), 0 8px 20px rgba(39, 24, 15, .16);
          pointer-events: auto;
          transition: transform 120ms ease, box-shadow 120ms ease;
        }

        .face-talk-close:active {
          transform: translateY(3px);
          box-shadow: 0 1px 0 rgba(77, 52, 35, .2), 0 3px 8px rgba(39, 24, 15, .14);
        }

        .face-talk-bubble {
          appearance: none;
          -webkit-appearance: none;
          display: block;
          position: relative;
          grid-column: 3;
          justify-self: start;
          width: min(100%, 430px);
          min-height: clamp(168px, 25vh, 210px);
          max-height: none;
          margin: 0;
          padding: 27px 26px 48px;
          overflow: hidden;
          border: 1px solid rgba(91, 66, 47, .34);
          border-radius: 24px;
          color: #3d3026;
          background: linear-gradient(145deg, rgba(255, 253, 246, .98), rgba(250, 241, 216, .97));
          box-shadow: 0 8px 0 rgba(83, 57, 39, .14), 0 18px 38px rgba(45, 29, 18, .2), inset 0 1px 0 rgba(255, 255, 255, .9);
          font: inherit;
          text-align: left;
          cursor: pointer;
          pointer-events: auto;
        }

        .face-talk-bubble:focus-visible {
          outline: 3px solid rgba(99, 145, 183, .62);
          outline-offset: 4px;
        }

        .face-talk-bubble::before,
        .face-talk-bubble::after {
          content: "";
          position: absolute;
          top: 42%;
          width: 0;
          height: 0;
          border-top: 14px solid transparent;
          border-bottom: 14px solid transparent;
        }

        .face-talk-bubble::before {
          left: -19px;
          border-right: 19px solid rgba(91, 66, 47, .34);
        }

        .face-talk-bubble::after {
          left: -17px;
          border-right: 18px solid #fdf8e8;
        }

        /* Keep the conversation UI on the side opposite the character. */
        .face-talk-ui-left .face-talk-bubble,
        .face-talk-ui-left .face-talk-right {
          grid-column: 1;
          justify-self: end;
        }

        .face-talk-ui-left .face-talk-bubble::before {
          left: auto;
          right: -19px;
          border-right: 0;
          border-left: 19px solid rgba(91, 66, 47, .34);
        }

        .face-talk-ui-left .face-talk-bubble::after {
          left: auto;
          right: -17px;
          border-right: 0;
          border-left: 18px solid #fdf8e8;
        }

        .face-talk-speaker {
          display: block;
          margin-bottom: 8px;
          color: #9b5f3d;
          font-size: .8rem;
          font-weight: 800;
          letter-spacing: .13em;
        }

        .face-talk-line {
          display: block;
          margin: 0;
          white-space: normal;
          overflow-wrap: break-word;
          word-break: normal;
          line-break: strict;
          text-wrap: pretty;
          font-size: clamp(1.05rem, 1.7vw, 1.22rem);
          line-height: 1.75;
          letter-spacing: .025em;
        }

        .face-talk-page {
          position: absolute;
          top: 18px;
          right: 22px;
          color: #9a8878;
          font-size: .76rem;
          font-weight: 800;
          letter-spacing: .04em;
        }

        .face-talk-continue {
          position: absolute;
          right: 22px;
          bottom: 15px;
          color: #8b6c54;
          font-size: .78rem;
          font-weight: 700;
          letter-spacing: .06em;
        }

        .face-talk-continue b {
          display: inline-block;
          margin-left: 5px;
          color: #bc6746;
          animation: talk-next-pulse 900ms ease-in-out infinite alternate;
        }

        @keyframes talk-next-pulse {
          from { transform: translateY(-1px); }
          to { transform: translateY(3px); }
        }

        .face-talk-left,
        .face-talk-right {
          width: min(100%, 390px);
          max-height: 62vh;
          pointer-events: auto;
        }

        .face-talk-left {
          grid-column: 1;
          justify-self: end;
        }

        .face-talk-text-input:not(.face-talk-ui-left) .face-talk-left {
          grid-column: 3;
          justify-self: start;
        }

        .face-talk-text-input.face-talk-ui-left .face-talk-left {
          grid-column: 1;
          justify-self: end;
        }

        .face-talk-right {
          grid-column: 3;
          justify-self: start;
          overflow-y: auto;
          overscroll-behavior: contain;
          scrollbar-width: thin;
          scrollbar-color: rgba(112, 82, 57, .5) transparent;
        }

        .face-talk-input {
          padding: 16px;
          border: 1px solid rgba(78, 58, 42, .32);
          border-radius: 20px;
          background: rgba(255, 250, 237, .95);
          box-shadow: 0 7px 0 rgba(77, 52, 35, .14), 0 16px 34px rgba(42, 27, 17, .2);
        }

        .face-talk-input textarea {
          display: block;
          width: 100%;
          min-height: 108px;
          max-height: 180px;
          resize: vertical;
          border: 1px solid rgba(119, 87, 61, .35);
          border-radius: 13px;
          padding: 13px 14px;
          color: #3f342c;
          background: rgba(255, 255, 255, .86);
          font: inherit;
          font-size: 1rem;
          line-height: 1.65;
        }

        .face-talk-input-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 10px;
        }

        .face-talk-input-footer small {
          color: #877566;
          font-size: .75rem;
          line-height: 1.4;
        }

        .prompted-suggestion-box {
          width: 100%;
          margin-top: 8px;
          padding: 0 2px;
        }

        .prompted-suggestion-title {
          display: inline-flex;
          align-items: center;
          margin: 0 0 6px 1px;
          padding: 3px 8px;
          border: 1px solid rgba(91, 70, 53, .28);
          border-radius: 999px;
          color: #4f3928;
          background: #fff6dc;
          box-shadow: 0 1px 2px rgba(61, 43, 29, .14);
          font-size: .7rem;
          font-weight: 900;
          line-height: 1.2;
          letter-spacing: .05em;
        }

        .prompted-suggestion-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6px;
        }

        .prompted-suggestion-button {
          appearance: none;
          -webkit-appearance: none;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          min-height: 38px;
          margin: 0;
          padding: 6px 8px;
          border: 1px solid rgba(91, 70, 51, .28);
          border-radius: 10px;
          color: #514338;
          background: rgba(255, 251, 241, .76);
          box-shadow: 0 2px 0 rgba(94, 68, 43, .10);
          font: inherit;
          font-size: .78rem;
          font-weight: 700;
          line-height: 1.25;
          text-align: center;
          cursor: pointer;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          transition:
            transform 90ms ease,
            border-color 90ms ease,
            background 90ms ease,
            box-shadow 90ms ease;
        }

        .prompted-suggestion-button:hover,
        .prompted-suggestion-button:focus-visible {
          border-color: rgba(156, 104, 67, .52);
          background: rgba(255, 247, 226, .96);
          outline: none;
        }

        .prompted-suggestion-button:active {
          transform: translateY(1px);
          box-shadow: none;
        }

        .prompted-suggestion-text {
          min-width: 0;
          overflow-wrap: anywhere;
        }

        .prompted-skip-button {
          width: auto;
          min-height: 34px;
          margin: 8px 0 0 auto;
          padding: 5px 12px;
          border-style: dashed;
          border-radius: 999px;
          color: rgba(91, 75, 62, .76);
          background: rgba(247, 242, 230, .64);
          box-shadow: none;
          font-size: .75rem;
        }

        .face-talk-send,
        .face-talk-action {
          min-height: 46px;
          border: 1px solid rgba(82, 62, 45, .4);
          border-radius: 14px;
          padding: 9px 18px;
          color: #fffdf8;
          background: linear-gradient(180deg, #d97955, #c55f3f);
          box-shadow: 0 4px 0 rgba(91, 56, 37, .36), 0 9px 20px rgba(47, 31, 20, .14);
          font-weight: 800;
          pointer-events: auto;
          transition: transform 120ms ease, box-shadow 120ms ease;
        }

        .face-talk-send:active,
        .face-talk-action:active {
          transform: translateY(3px);
          box-shadow: 0 1px 0 rgba(91, 56, 37, .4), 0 4px 9px rgba(47, 31, 20, .12);
        }

        .face-talk-send:disabled {
          opacity: .42;
          cursor: default;
          transform: none;
        }

        .face-talk-secondary {
          width: 100%;
          margin-top: 12px;
          color: #4b3b30;
          background: rgba(255, 250, 238, .92);
        }

        .face-talk-complete {
          display: grid;
          gap: 12px;
          padding: 14px;
          border-radius: 20px;
          background: rgba(41, 34, 28, .38);
          backdrop-filter: blur(5px);
        }

        .face-talk-command-menu {
          padding: 16px 14px 18px;
          border: 1px solid rgba(78, 58, 42, .28);
          border-radius: 22px;
          background: rgba(255, 250, 237, .95);
          box-shadow: 0 7px 0 rgba(77, 52, 35, .14), 0 16px 34px rgba(42, 27, 17, .2);
        }

        .face-talk-command-menu > strong {
          display: block;
          padding: 2px 12px 4px;
          color: #5b4433;
          font-size: 1rem;
          letter-spacing: .06em;
        }

        .face-talk-complete .face-talk-secondary {
          margin-top: 0;
        }

        .tactile-choice-list {
          display: flex !important;
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 10px !important;
          width: min(100%, 560px) !important;
          margin: 12px auto 0 !important;
          padding: 12px !important;
          box-sizing: border-box !important;
        }

        .tactile-choice-list .tactile-choice-button {
          appearance: none !important;
          -webkit-appearance: none !important;
          display: grid !important;
          grid-template-columns: 34px minmax(0, 1fr) 24px !important;
          align-items: center !important;
          gap: 10px !important;
          width: 100% !important;
          min-height: 58px !important;
          margin: 0 !important;
          padding: 10px 14px !important;
          border: 2px solid rgba(82, 62, 45, 0.35) !important;
          border-radius: 16px !important;
          background: linear-gradient(180deg, #fffdf8 0%, #f5ead8 100%) !important;
          color: #3b2d24 !important;
          box-shadow:
            0 5px 0 rgba(92, 66, 43, 0.32),
            0 9px 20px rgba(47, 31, 20, 0.14) !important;
          font: inherit !important;
          font-size: 15px !important;
          font-weight: 700 !important;
          line-height: 1.35 !important;
          text-align: left !important;
          cursor: pointer !important;
          user-select: none !important;
          -webkit-tap-highlight-color: transparent !important;
          transition:
            transform 120ms ease,
            box-shadow 120ms ease,
            border-color 120ms ease,
            filter 120ms ease !important;
        }

        .tactile-choice-list .tactile-choice-button:hover {
          transform: translateY(-2px) scale(1.008) !important;
          border-color: rgba(82, 62, 45, 0.58) !important;
          filter: brightness(1.025) !important;
          box-shadow:
            0 7px 0 rgba(92, 66, 43, 0.30),
            0 12px 24px rgba(47, 31, 20, 0.18) !important;
        }

        .tactile-choice-list .tactile-choice-button:active {
          transform: translateY(4px) scale(0.992) !important;
          box-shadow:
            0 1px 0 rgba(92, 66, 43, 0.38),
            0 4px 8px rgba(47, 31, 20, 0.12) !important;
        }

        .tactile-choice-list .tactile-choice-button:focus-visible {
          outline: 3px solid rgba(99, 145, 183, 0.55) !important;
          outline-offset: 3px !important;
        }

        .tactile-choice-number {
          display: grid !important;
          place-items: center !important;
          width: 32px !important;
          height: 32px !important;
          border-radius: 999px !important;
          background: #59483a !important;
          color: #fffdf8 !important;
          font-size: 13px !important;
          font-weight: 800 !important;
          box-shadow: inset 0 -2px 0 rgba(0, 0, 0, 0.16) !important;
        }

        .tactile-choice-label {
          min-width: 0 !important;
          color: #3b2d24 !important;
          opacity: 1 !important;
          text-shadow: none !important;
          overflow-wrap: anywhere !important;
        }

        .tactile-choice-arrow {
          color: #7f6854 !important;
          font-size: 28px !important;
          font-weight: 500 !important;
          line-height: 1 !important;
          text-align: right !important;
          transition: transform 120ms ease !important;
        }

        .tactile-choice-button:hover .tactile-choice-arrow {
          transform: translateX(3px) !important;
        }

        .tactile-choice-list .tactile-choice-secondary {
          background: rgba(255, 255, 255, 0.82) !important;
          border-style: dashed !important;
          box-shadow: 0 3px 0 rgba(92, 66, 43, 0.20) !important;
          opacity: 0.9 !important;
        }

        .tactile-choice-secondary .tactile-choice-number {
          background: #8b8076 !important;
        }

        .face-talk-right .tactile-choice-list {
          width: 100% !important;
          margin: 0 !important;
          padding: 6px 5px 9px !important;
        }

        .category-pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          margin: 6px 5px 8px;
          color: #6d5847;
          font-size: 15px;
          font-weight: 800;
        }

        .category-pagination-button {
          appearance: none;
          min-width: 96px;
          min-height: 46px;
          border: 2px solid rgba(82, 62, 45, .34);
          border-radius: 999px;
          padding: 10px 20px;
          background: #fffdf8;
          color: #59483a;
          font: inherit;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 3px 0 rgba(92, 66, 43, .22);
          transition: opacity 120ms ease, transform 120ms ease, background 120ms ease, box-shadow 120ms ease;
        }

        .category-pagination-button:hover:not(:disabled) {
          transform: translateY(-1px);
          background: #fffdf8;
        }

        .category-pagination-button:active:not(:disabled) {
          transform: translateY(3px);
          box-shadow: 0 0 0 rgba(92, 66, 43, .22);
        }

        .category-pagination-button:disabled {
          cursor: default;
          opacity: .38;
        }

        @media (max-width: 700px) {
          .mochi.mochi-returning {
            top: 55% !important;
          }

          .face-talk {
            display: block;
            padding: 0;
          }

          .face-talk-close {
            top: max(58px, calc(env(safe-area-inset-top) + 12px));
            right: 14px;
          }

          .face-talk-bubble,
          .face-talk-left,
          .face-talk-right {
            position: absolute;
            left: 50%;
            bottom: max(76px, calc(env(safe-area-inset-bottom) + 70px));
            width: min(calc(100% - 28px), 470px);
            max-height: 38vh;
            transform: translateX(-50%);
          }

          .face-talk-left,
          .face-talk-right {
            overflow-y: auto;
            overscroll-behavior: contain;
          }

          .face-talk-bubble {
            min-height: 154px;
            max-height: none;
            padding: 22px 20px 43px;
          }

          .face-talk-bubble::before,
          .face-talk-bubble::after {
            top: auto;
            left: 50%;
            border-top: 0;
            border-bottom-style: solid;
            border-left-style: solid;
            border-right-style: solid;
            transform: translateX(-50%);
          }

          .face-talk-bubble::before {
            bottom: auto;
            top: -19px;
            border-right-width: 15px;
            border-right-color: transparent;
            border-left-width: 15px;
            border-left-color: transparent;
            border-bottom-width: 19px;
            border-bottom-color: rgba(91, 66, 47, .34);
          }

          .face-talk-bubble::after {
            bottom: auto;
            top: -17px;
            border-right-width: 14px;
            border-right-color: transparent;
            border-left-width: 14px;
            border-left-color: transparent;
            border-bottom-width: 18px;
            border-bottom-color: #fdf8e8;
          }

          .face-talk-ui-left .face-talk-bubble::before,
          .face-talk-ui-left .face-talk-bubble::after {
            left: 50%;
            right: auto;
            border-left-color: transparent;
            border-right-color: transparent;
          }

          .face-talk-line {
            font-size: 1rem;
            line-height: 1.72;
          }

          .face-talk-input {
            padding: 13px;
          }

          .face-talk-input textarea {
            min-height: 82px;
            max-height: 120px;
          }

          .prompted-suggestion-box {
            margin-top: 7px;
          }

          .prompted-suggestion-list {
            gap: 5px;
          }

          .prompted-suggestion-button {
            min-height: 36px;
            padding: 5px 6px;
            border-radius: 9px;
            font-size: .72rem;
          }
        }

        @media (max-width: 620px) {
          .tactile-choice-list {
            gap: 8px !important;
            padding: 10px !important;
          }

          .tactile-choice-list .tactile-choice-button {
            min-height: 54px !important;
            border-radius: 14px !important;
            padding: 9px 12px !important;
          }
        }

        @media (max-width: 1024px) and (orientation: landscape) {
          .mobile-landscape .face-talk {
            display: block;
            padding: 0;
          }

          .mobile-landscape .face-talk-close {
            top: max(42px, calc(env(safe-area-inset-top) + 8px));
            right: max(12px, env(safe-area-inset-right));
          }

          .mobile-landscape .face-talk-bubble,
          .mobile-landscape .face-talk-left,
          .mobile-landscape .face-talk-right {
            position: absolute;
            left: auto;
            right: max(14px, env(safe-area-inset-right));
            bottom: max(60px, calc(env(safe-area-inset-bottom) + 55px));
            width: min(47vw, 440px);
            max-height: calc(100dvh - 112px);
            overflow-y: auto;
            transform: none;
            overscroll-behavior: contain;
          }

          .mobile-landscape .face-talk-ui-left .face-talk-bubble,
          .mobile-landscape .face-talk-ui-left .face-talk-left,
          .mobile-landscape .face-talk-ui-left .face-talk-right {
            right: auto;
            left: max(14px, env(safe-area-inset-left));
          }

          .mobile-landscape .face-talk-bubble {
            min-height: 112px;
            padding: 17px 18px 35px;
          }

          .mobile-landscape .face-talk-input textarea {
            min-height: 68px;
            max-height: 22dvh;
          }

          /* Text replies use a fixed three-part composition on phones:
             question at upper left, Suuhimochi below it, keyboard at right. */
          .mobile-landscape .face-talk.face-talk-text-input .face-talk-input-prompt {
            position: absolute;
            z-index: 24;
            top: max(36px, calc(env(safe-area-inset-top) + 30px));
            left: max(10px, env(safe-area-inset-left));
            width: min(60vw, calc(100vw - min(32vw, 430px) - 26px));
            max-height: min(24dvh, 76px);
            overflow-y: auto;
            padding: 8px 10px;
            border: 1px solid rgba(91, 66, 47, .35);
            border-radius: 12px;
            color: #3d3026;
            background: rgba(255, 252, 242, .94);
            box-shadow: 0 3px 0 rgba(83, 57, 39, .14), 0 8px 18px rgba(45, 29, 18, .16);
            pointer-events: auto;
          }

          .mobile-landscape .face-talk.face-talk-text-input.face-talk-ui-left .face-talk-input-prompt {
            left: auto;
            right: max(10px, env(safe-area-inset-right));
          }

          .mobile-landscape.talk-input-ui-left .suuhimochi-keyboard {
            right: auto;
            left: max(5px, env(safe-area-inset-left));
          }

          .mobile-landscape .face-talk.face-talk-text-input .face-talk-input-prompt span {
            display: block;
            margin-bottom: 3px;
            color: #9b5f3d;
            font-size: .62rem;
            font-weight: 900;
            letter-spacing: .08em;
          }

          .mobile-landscape .face-talk.face-talk-text-input .face-talk-input-prompt p {
            margin: 0;
            font-size: clamp(.76rem, 1.7vw, .92rem);
            font-weight: 700;
            line-height: 1.4;
            overflow-wrap: anywhere;
          }

          .mobile-landscape .face-talk.face-talk-text-input .face-talk-left,
          .mobile-landscape .face-talk.face-talk-text-input.face-talk-ui-left .face-talk-left {
            top: max(118px, calc(env(safe-area-inset-top) + 108px));
            right: auto;
            bottom: auto;
            left: max(10px, env(safe-area-inset-left));
            width: min(60vw, calc(100vw - min(32vw, 430px) - 26px));
            max-height: calc(100dvh - 126px);
            overflow-y: auto;
          }

          .mobile-landscape .face-talk.face-talk-text-input .prompted-skip-button {
            position: fixed;
            z-index: 25;
            top: min(calc(100dvh - 42px), calc(70dvh + 16px));
            left: min(calc(100vw - min(32vw, 430px) - 112px), calc((100vw - min(32vw, 430px)) / 2 + 88px));
            width: auto;
            min-height: 30px;
            margin: 0;
            padding: 5px 11px;
            font-size: .7rem;
          }

          .mobile-landscape .face-talk.face-talk-text-input.face-talk-ui-left .prompted-skip-button {
            right: min(calc(100vw - min(32vw, 430px) - 112px), calc((100vw - min(32vw, 430px)) / 2 + 88px));
            left: auto;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .mochi.mochi-conversation,
          .zoom-mochi,
          .zoom-mochi .zoom-part,
          .tactile-choice-list .tactile-choice-button,
          .tactile-choice-arrow {
            transition: none !important;
          }

          .face-talk-continue b {
            animation: none !important;
          }

          .zoom-mochi {
            animation: none !important;
          }
        }
      `}</style>
      <div className="room-stage">
      <div
        ref={roomRef}
        className={`room${phase === 'home' ? ' room-home' : ''}${roomOverview ? ' room-overview-active' : ''}${mobileRoomFit.ready ? ' mobile-room-fit-ready' : ''}`}
        aria-label="夜の小さな部屋"
        style={{
          backgroundColor: '#17130f',
          backgroundImage: 'none',
          '--mobile-camera-scale': cameraZoomActive ? TALK_CAMERA_ZOOM : 1,
          '--mobile-camera-x': `${cameraOrigin.x}%`,
          '--mobile-camera-y': `${cameraOrigin.y}%`,
          '--mobile-background-camera-x': `${mobileBackgroundCameraX}%`,
          '--mobile-camera-transition': `${TALK_CAMERA_TRANSITION_MS}ms`,
          '--mobile-camera-shift-x': `${mobileCameraShift.x}px`,
          '--mobile-camera-shift-y': `${mobileCameraShift.y}px`,
          ...(mobileRoomFit.ready ? {
            '--mobile-room-canvas-left': `${mobileRoomFit.canvasLeft}px`,
            '--mobile-room-canvas-top': `${mobileRoomFit.canvasTop}px`,
            '--mobile-room-canvas-bottom': `${mobileRoomFit.canvasBottom}px`,
            '--mobile-room-canvas-width': `${mobileRoomFit.canvasWidth}px`,
            '--mobile-room-canvas-height': `${mobileRoomFit.canvasHeight}px`,
            '--mobile-room-dialogue-center-x': `${mobileRoomFit.dialogueCenterX}px`,
            '--mobile-room-dialogue-top': `${mobileRoomFit.dialogueTop}px`,
            '--mobile-room-dialogue-width': `${mobileRoomFit.dialogueWidth}px`,
            '--mobile-room-keyboard-dialogue-center-x': `${mobileRoomFit.keyboardDialogueCenterX}px`,
            '--mobile-room-keyboard-dialogue-width': `${mobileRoomFit.keyboardDialogueWidth}px`,
          } : {}),
        } as React.CSSProperties}
      >
        <div
          className="mobile-room-background"
          aria-hidden="true"
          style={{ backgroundImage: `url('${roomBackground}')` }}
        >
          <div className="room-tint" />
        </div>
        <div className="room-touch-surface" aria-hidden="true" onPointerDown={handleRoomEdgePointerDown} />
        <div
          ref={worldRef}
          className={`world-layer${talkOpen || isMonologueZoom ? ' world-layer-talk' : ''}${roomOverview ? ' room-world-overview' : ''}${isRoomPanning ? ' room-world-panning' : ''}${isDarkPeriod && lightsOut ? ' world-layer-lights-out' : ''}${phase === 'home' && !dailyProgressOpen && !bubble && !talkReturning && !foodOpen && !minigameOpen && !potenoOpen && !settingsOpen ? ' world-layer-walkable' : ''}`}
          style={{
            '--camera-x': `${cameraOrigin.x}%`,
            '--camera-y': `${cameraOrigin.y}%`,
            '--room-pan-x': `${roomPanX}px`,
            '--camera-shift-x': `${cameraShift.x}px`,
            '--camera-shift-y': `${cameraShift.y}px`,
            '--room-overview-scale': roomOverviewScale,
            '--mobile-room-fit-scale': mobileRoomFit.scale,
            ...(mobileWorldPosition ? {
              '--mobile-world-left': `${mobileWorldPosition.left}px`,
              '--mobile-world-top': `${mobileWorldPosition.top}px`,
            } : {}),
            backgroundImage: `url('${roomBackground}')`,
          } as React.CSSProperties}
          onPointerDown={handleWorldPointerDown}
          onPointerMove={handleWorldPointerMove}
          onPointerUp={handleWorldPointerEnd}
          onPointerCancel={handleWorldPointerCancel}
        >
          <div className="room-tint" aria-hidden="true" />
          {showCollisionDebug && (
            <svg
              className="room-floor-collider-debug"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-label="背景に沿った歩行可能範囲"
            >
              <polygon
                points={`${ROOM_FLOOR_BOUNDS.backLeft},${ROOM_FLOOR_BOUNDS.backY} ${ROOM_FLOOR_BOUNDS.backRight},${ROOM_FLOOR_BOUNDS.backY} ${ROOM_FLOOR_BOUNDS.frontRight},${ROOM_FLOOR_BOUNDS.frontY} ${ROOM_FLOOR_BOUNDS.frontLeft},${ROOM_FLOOR_BOUNDS.frontY}`}
              />
            </svg>
          )}
          <div className="room-items">
            {ROOM_ITEMS.filter((item) => !['wall-clock', 'wall-clock-digital'].includes(item.id) && !storedItemIds.includes(item.id)).map((item) => item.id === MASK_CASE_ITEM_ID ? (
              <div
                key={item.id}
                data-room-item-id={item.id}
                className={`room-item room-item-${item.id}${itemOpen ? ' room-item-editable' : ''}${selectedItemId === item.id ? ' room-item-selected' : ''}`}
                role="img"
                aria-label={`${item.alt}。仮面の成長段階${maskGrowthStage}`}
                title={itemOpen ? `${item.alt}：ドラッグで移動、ダブルクリックで収納` : undefined}
                style={{
                  left: `${itemPositions[item.id]?.x ?? 0}%`,
                  top: `${itemPositions[item.id]?.y ?? 0}%`,
                  pointerEvents: itemOpen ? 'auto' : 'none',
                }}
                onPointerDown={(event) => {
                  if (!itemOpen) return;
                  event.stopPropagation();
                  setSelectedItemId(item.id);
                  const position = itemPositions[item.id] ?? INITIAL_ITEM_POSITIONS[item.id];
                  itemDragRef.current = { id: item.id, pointerId: event.pointerId, x: position.x, y: position.y, clientX: event.clientX, clientY: event.clientY };
                  event.currentTarget.setPointerCapture?.(event.pointerId);
                }}
                onPointerUp={(event) => { if (itemDragRef.current?.pointerId === event.pointerId) itemDragRef.current = null; }}
                onPointerCancel={() => { itemDragRef.current = null; }}
                onDoubleClick={(event) => { if (itemOpen) { event.stopPropagation(); storeRoomItem(item.id); } }}
              >
                <MaskDisplay stage={maskGrowthStage} growing={maskGrowthAnimating} />
              </div>
            ) : (
              <img
                key={item.id}
                data-room-item-id={item.id}
                className={`room-item room-item-${item.id}${itemOpen ? ' room-item-editable' : ''}${selectedItemId === item.id ? ' room-item-selected' : ''}`}
                src={item.src}
                alt={item.alt}
                draggable={false}
                title={itemOpen ? `${item.alt}：ドラッグで移動、ダブルクリックで収納` : undefined}
                  style={{
                    left: `${itemPositions[item.id]?.x ?? 0}%`,
                    top: `${itemPositions[item.id]?.y ?? 0}%`,
                    pointerEvents: itemOpen || BED_ITEM_IDS.has(item.id) ? 'auto' : 'none',
                    zIndex: item.id === 'low-table' && tableShouldOverlayMochi ? 5 : undefined,
                }}
                onPointerDown={(event) => {
                  if (!itemOpen && BED_ITEM_IDS.has(item.id)) {
                    event.stopPropagation();
                    requestBedSleep(item.id);
                    return;
                  }
                  if (!itemOpen) return;
                  event.stopPropagation();
                  setSelectedItemId(item.id);
                  const position = itemPositions[item.id] ?? INITIAL_ITEM_POSITIONS[item.id];
                  itemDragRef.current = { id: item.id, pointerId: event.pointerId, x: position.x, y: position.y, clientX: event.clientX, clientY: event.clientY };
                  event.currentTarget.setPointerCapture?.(event.pointerId);
                }}
                onPointerUp={(event) => {
                  if (itemDragRef.current?.pointerId === event.pointerId) itemDragRef.current = null;
                }}
                onPointerCancel={() => { itemDragRef.current = null; }}
                onDoubleClick={(event) => { if (itemOpen) { event.stopPropagation(); storeRoomItem(item.id); } }}
              />
            ))}
            {showCollisionDebug && !storedItemIds.includes('low-table') && (
              <div
                className="room-collider-debug room-collider-debug-low-table"
                style={{ left: `${lowTablePosition.x + LOW_TABLE_COLLIDER.offsetX}%`, top: `${lowTablePosition.y + LOW_TABLE_COLLIDER.offsetY}%`, width: `${LOW_TABLE_COLLIDER.width}%`, height: `${LOW_TABLE_COLLIDER.height}%` }}
                aria-hidden="true"
              />
            )}
            {showCollisionDebug && Object.entries(ROOM_ITEM_COLLIDERS).map(([id, collider]) => {
              if (storedItemIds.includes(id)) return null;
              const position = itemPositions[id] ?? INITIAL_ITEM_POSITIONS[id];
              if (!position) return null;
              const renderedHeight = collider.width * roomRatio;
              return (
                <div
                  className={`room-collider-debug${collider.blocks === false ? ' room-collider-debug-nonblocking' : ''}`}
                  key={`collider-${id}`}
                  style={{ left: `${position.x + collider.width * collider.left}%`, top: `${position.y + renderedHeight * collider.top}%`, width: `${collider.width * collider.widthFactor}%`, height: `${renderedHeight * collider.heightFactor}%`, borderRadius: id === 'rug' ? '50%' : '10px' }}
                  aria-label={`${id}の当たり判定`}
                />
              );
            })}
            {showCollisionDebug && !storedItemIds.includes('clock') && (
              <div className="room-collider-debug room-collider-debug-clock" style={{ left: `${clockPosition.x - 5}%`, top: `${clockPosition.y - 1.5}%`, width: '10%', height: '4%' }} aria-label="時計の当たり判定" />
            )}
            {!storedItemIds.includes('wall-clock') && <div
              className={`room-item room-item-wall-clock${itemOpen ? ' room-item-editable' : ''}${selectedItemId === 'wall-clock' ? ' room-item-selected' : ''}`}
              role="img"
              aria-label={`壁掛け時計。現在 ${clockTime}`}
              title={itemOpen ? '壁掛け時計：ドラッグで移動、ダブルクリックで収納' : undefined}
              style={{ left: `${itemPositions['wall-clock']?.x ?? 0}%`, top: `${itemPositions['wall-clock']?.y ?? 0}%`, pointerEvents: itemOpen ? 'auto' : 'none' }}
              onPointerDown={(event) => {
                if (!itemOpen) return;
                event.stopPropagation();
                setSelectedItemId('wall-clock');
                const position = itemPositions['wall-clock'] ?? INITIAL_ITEM_POSITIONS['wall-clock'];
                itemDragRef.current = { id: 'wall-clock', pointerId: event.pointerId, x: position.x, y: position.y, clientX: event.clientX, clientY: event.clientY };
                event.currentTarget.setPointerCapture?.(event.pointerId);
              }}
              onPointerUp={(event) => { if (itemDragRef.current?.pointerId === event.pointerId) itemDragRef.current = null; }}
              onPointerCancel={() => { itemDragRef.current = null; }}
              onDoubleClick={(event) => { if (itemOpen) { event.stopPropagation(); storeRoomItem('wall-clock'); } }}
            >
              <WallClockFace time={clockTime} />
            </div>}
            {!storedItemIds.includes('wall-clock-digital') && <div
              className={`room-item room-item-wall-clock-digital${itemOpen ? ' room-item-editable' : ''}${selectedItemId === 'wall-clock-digital' ? ' room-item-selected' : ''}`}
              role="img"
              aria-label={`壁掛けデジタル時計。現在 ${clockTime}`}
              title={itemOpen ? '壁掛けデジタル時計：ドラッグで移動、ダブルクリックで収納' : undefined}
              style={{ left: `${itemPositions['wall-clock-digital']?.x ?? 0}%`, top: `${itemPositions['wall-clock-digital']?.y ?? 0}%`, pointerEvents: itemOpen ? 'auto' : 'none' }}
              onPointerDown={(event) => {
                if (!itemOpen) return;
                event.stopPropagation();
                setSelectedItemId('wall-clock-digital');
                const position = itemPositions['wall-clock-digital'] ?? INITIAL_ITEM_POSITIONS['wall-clock-digital'];
                itemDragRef.current = { id: 'wall-clock-digital', pointerId: event.pointerId, x: position.x, y: position.y, clientX: event.clientX, clientY: event.clientY };
                event.currentTarget.setPointerCapture?.(event.pointerId);
              }}
              onPointerUp={(event) => { if (itemDragRef.current?.pointerId === event.pointerId) itemDragRef.current = null; }}
              onPointerCancel={() => { itemDragRef.current = null; }}
              onDoubleClick={(event) => { if (itemOpen) { event.stopPropagation(); storeRoomItem('wall-clock-digital'); } }}
            >
              <WallClockDigitalFace time={clockTime} />
            </div>}
          </div>
          {bedPromptId && bedPromptPosition && !talkOpen && phase === 'home' && (
            <button
              className="bed-sleep-choice"
              type="button"
              style={{ left: `${bedPromptPosition.x + 8}%`, top: `${bedPromptPosition.y + 7}%` }}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => startBedSleep(bedPromptId)}
            >
              横になる
            </button>
          )}
          {wakePromptOpen && mochiState === 'sleep' && sleepPose && !talkOpen && phase === 'home' && (
            <button
              className="bed-sleep-choice bed-wake-choice"
              type="button"
              style={{ left: `${sleepPose.left + 5}%`, top: `${sleepPose.top - 8}%` }}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => { event.stopPropagation(); wakeFromBed(); }}
              disabled={wakingUp}
            >
              起きる
            </button>
          )}
          {!storedItemIds.includes('clock') && <output
            className={`room-clock${itemOpen ? ' room-clock-editing' : ''}`}
            style={{ left: `${clockPosition.x}%`, top: `${clockPosition.y}%` }}
            aria-label={`現在時刻 ${clockTime}`}
            title={itemOpen ? '卓上時計：ドラッグで移動、ダブルクリックで収納' : undefined}
            onPointerDown={(event) => {
              if (!itemOpen) return;
              event.stopPropagation();
              setSelectedItemId('clock');
              clockDragRef.current = { pointerId: event.pointerId, x: clockPosition.x, y: clockPosition.y, clientX: event.clientX, clientY: event.clientY };
              event.currentTarget.setPointerCapture?.(event.pointerId);
            }}
            onDoubleClick={(event) => { if (itemOpen) { event.stopPropagation(); storeRoomItem('clock'); } }}
          >
            <span className="room-clock-top-button" aria-hidden="true" />
            <span className="room-clock-screen"><PixelClockDigits time={clockTime} /></span>
            <span className="room-clock-feet" aria-hidden="true"><i /><i /></span>
          </output>}
          {(phase !== 'reveal' || revealBeat >= 0) && (
            <div
              className={`mochi mochi-type-${save.mochiType} mochi-${mochiState}${talkOpen ? ' mochi-conversation' : ''}${talkReturning ? ' mochi-returning' : ''}${wakingUp ? ' mochi-waking' : ''}${bedHandoff ? ' mochi-bed-handoff' : ''}`}
              style={{
                '--accent': accent,
                '--walk-duration': `${walkDuration}ms`,
                left: `${41 + walkOffset.x}%`,
                top: `${54 + walkOffset.y}%`,
                ...(mochiState === 'sleep' && sleepPose ? {
                  left: `${sleepPose.left}%`,
                  top: `${sleepPose.top}%`,
                  transform: wakingUp ? 'translate(-50%, -58%) rotate(0deg) scale(1.04)' : 'translate(-50%, -50%) rotate(10deg) scale(1.12)',
                  transition: wakingUp ? 'transform 430ms ease-out' : undefined,
                } : {}),
              } as React.CSSProperties}
              aria-label={`すうひもち。${MOCHI_STATES.find((item) => item.id === mochiState)?.label}`}
            >
              {save.mochiType === 1 && (talkOpen || isMonologueZoom) ? (
                <div className="zoom-mochi" aria-hidden="true">
                  <img className={`zoom-part zoom-arm zoom-arm-left${zoomArmPose === 'down' ? ' is-active' : ''}`} src={`${ZOOM_ASSET_ROOT}/arms/left/arm-left-down.png`} alt="" draggable={false} />
                  <img className={`zoom-part zoom-arm zoom-arm-left${zoomArmPose === 'up' ? ' is-active' : ''}`} src={`${ZOOM_ASSET_ROOT}/arms/left/arm-left-up.png`} alt="" draggable={false} />
                  <img className={`zoom-part zoom-arm zoom-arm-left${zoomArmPose === 'open' ? ' is-active' : ''}`} src={`${ZOOM_ASSET_ROOT}/arms/left/arm-left-open.png`} alt="" draggable={false} />
                  <img className={`zoom-part zoom-arm zoom-arm-left${zoomArmPose === 'chest' ? ' is-active' : ''}`} src={zoomArmAsset('left', 'chest')} alt="" draggable={false} />
                  <img className={`zoom-part zoom-arm zoom-arm-right${zoomRightArmPose === 'down' ? ' is-active' : ''}`} src={`${ZOOM_ASSET_ROOT}/arms/right/arm-right-down.png`} alt="" draggable={false} />
                  <img className={`zoom-part zoom-arm zoom-arm-right${zoomRightArmPose === 'up' ? ' is-active' : ''}`} src={`${ZOOM_ASSET_ROOT}/arms/right/arm-right-up.png`} alt="" draggable={false} />
                  <img className={`zoom-part zoom-arm zoom-arm-right${zoomRightArmPose === 'open' ? ' is-active' : ''}`} src={`${ZOOM_ASSET_ROOT}/arms/right/arm-right-open.png`} alt="" draggable={false} />
                  <img className={`zoom-part zoom-arm zoom-arm-right${zoomRightArmPose === 'chest' ? ' is-active' : ''}`} src={zoomArmAsset('right', 'chest')} alt="" draggable={false} />
                  <img className="zoom-part zoom-body" src={`${ZOOM_ASSET_ROOT}/body/body-front.png`} alt="" draggable={false} />
                  {miniFearFaceActive ? (
                    <img className="zoom-part zoom-face is-active" src={`${ZOOM_ASSET_ROOT}/scare/scare.png`} alt="" draggable={false} />
                  ) : (
                    <>
                      <img className={`zoom-part zoom-face${zoomEyes === 'open' ? ' is-active' : ''}`} src={zoomEyeAsset(activeZoomEmotion, 'open')} alt="" draggable={false} />
                      <img className={`zoom-part zoom-face${zoomEyes === 'half' ? ' is-active' : ''}`} src={zoomEyeAsset(activeZoomEmotion, 'half')} alt="" draggable={false} />
                      <img className={`zoom-part zoom-face${zoomEyes === 'closed' ? ' is-active' : ''}`} src={zoomEyeAsset(activeZoomEmotion, 'closed')} alt="" draggable={false} />
                      <img className={`zoom-part zoom-face${zoomMouth === 'closed' ? ' is-active' : ''}`} src={zoomMouthAsset('closed', activeZoomEmotion)} alt="" draggable={false} />
                      <img className={`zoom-part zoom-face${zoomMouth === 'small' ? ' is-active' : ''}`} src={zoomMouthAsset('small', activeZoomEmotion)} alt="" draggable={false} />
                      <img className={`zoom-part zoom-face${zoomMouth === 'open' ? ' is-active' : ''}`} src={zoomMouthAsset('open', activeZoomEmotion)} alt="" draggable={false} />
                    </>
                  )}
                </div>
              ) : save.mochiType === 1 ? (
                <div className={`sprite sprite-${mochiState}`} aria-hidden="true">
                  {mochiState === 'walk' ? [0, 1, 2, 3].map((frame) => (
                    <img className="suuhimochi" key={frame} src={`/assets/mochi-type-1-new/animations/Walking/${walkDirection}/frame_00${frame}.png`} alt="" draggable={false} />
                  )) : mochiState === 'sleep' ? [0, 1, 2, 3, 4, 5, 6].map((frame) => (
                    <img className="suuhimochi" key={frame} src={`${SLEEP_ANIMATION_ROOT}/frame_00${frame}.png`} alt="" draggable={false} />
                  )) : (
                    <img className="suuhimochi" src={`/assets/mochi-type-1-new/rotations/${spriteDirection}.png`} alt="" draggable={false} />
                  )}
                </div>
              ) : (
                <img src="/assets/suuhimochi.png" alt="" width={1330} height={1182} draggable={false} />
              )}
              <span className="type-charm" aria-hidden="true" />
            </div>
          )}
        </div>
        {bubble && phase === 'home' && !talkOpen && !twoDayReviewTalkOpen && (
          <button className={`thought-bubble${isSleepBubble ? ' sleep-thought-bubble' : ''}${isPotenoWelcomeBubble ? ' poteno-welcome-bubble' : ''}${promptedQuestionOffer || twoDayReviewOffer ? ' prompted-question-offer' : ''}`} style={isPotenoWelcomeBubble ? potenoWelcomeBubbleStyle : sleepBubbleStyle} type="button" onClick={twoDayReviewOffer ? openTwoDayReviewTalk : promptedQuestionOffer ? openPromptedTalk : advanceBubblePage} aria-live="polite" aria-label={twoDayReviewOffer || promptedQuestionOffer ? 'すうひもちの質問にこたえる' : undefined}>
            <span className="thought-bubble-text" key={bubblePageIndex}>{currentBubblePage}</span>
            <svg className="thought-bubble-tail" viewBox="0 0 64 48" aria-hidden="true">
              <path className="thought-bubble-tail-fill" d="M37 2 C30 15 16 32 3 45 C23 40 44 29 60 8 L37 2 Z" />
              <path className="thought-bubble-tail-stroke" d="M37 2 C30 15 16 32 3 45 C23 40 44 29 60 8" />
            </svg>
            {bubblePages.length > 1 && <span className="thought-bubble-page" aria-hidden="true">{bubblePageIndex + 1}/{bubblePages.length}</span>}
            <span className="thought-bubble-next" aria-hidden="true">{twoDayReviewOffer || promptedQuestionOffer ? 'クリックでお話する ▼' : '▼'}</span>
            <span className="sr-only">{bubbleHasNextPage ? '次の文へ' : '吹き出しを閉じる'}</span>
          </button>
        )}

        {phase === 'reveal' && revealBeat >= 0 && (
          <div className="encounter-caption" aria-live="polite">
            <p>{replaceCallName(REVEAL_BEATS[revealBeat]?.line ?? '', getPreferredCallName(save))}</p>
            {revealFinished && <button onClick={() => setPhase('intro')}>すうひもちを見る</button>}
          </div>
        )}

        {['intro', 'permission', 'welcome', 'callName', 'persona', 'goalIntro', 'goal', 'goalType', 'goalReply'].includes(phase) && (
          <section className="dialogue-box initial-dialogue-box" aria-live="polite">
            <p className={phase === 'permission' && permissionStep === 0 ? 'permission-line' : ''}>{replaceCallName(initialDialogueText, getPreferredCallName(save))}</p>
            {initialDialogueReady && ['intro', 'welcome', 'persona', 'goalIntro'].includes(phase) && <button className="dialogue-next" onClick={advanceInitialDialogue} aria-label="次の言葉へ">●</button>}
            {initialDialogueReady && phase === 'permission' && permissionStep === 0 && <div className="choices"><button onClick={accept}>いいよ</button><button onClick={() => setPermissionStep(1)}>どうしようかな</button></div>}
            {initialDialogueReady && phase === 'permission' && permissionStep > 0 && <button className="soft-accept" onClick={() => permissionStep === 1 ? setPermissionStep(2) : accept()}>{permissionStep === 1 ? '……' : 'それなら、いいよ'}</button>}
            {initialDialogueReady && phase === 'callName' && !mobileRoomMode && <form className="initial-goal-form" onSubmit={submitInitialCallName}>
              <input aria-label="呼ばれたい名前" value={initialCallName} onChange={(event) => setInitialCallName(event.target.value)} maxLength={20} placeholder="呼ばれたい名前" autoFocus />
              <div className="choices"><button type="submit" disabled={!initialCallName.trim()}>この呼ばれ方にする</button></div>
            </form>}
            {initialDialogueReady && phase === 'goal' && mobileRoomMode && <div className="initial-goal-form">
              <div className="choices"><button type="button" onClick={chooseUndecidedGoal}>まだ決まっていない</button></div>
            </div>}
            {initialDialogueReady && phase === 'goal' && !mobileRoomMode && <form className="initial-goal-form" onSubmit={submitInitialGoal}>
              <input aria-label="30日間の目標" value={initialGoalText} onChange={(event) => setInitialGoalText(event.target.value)} maxLength={100} placeholder="見たい景色や、やってみたいこと" autoFocus />
              <div className="choices"><button type="submit" disabled={!initialGoalText.trim()}>この景色を見にいく</button><button type="button" onClick={chooseUndecidedGoal}>まだ決まっていない</button></div>
            </form>}
            {initialDialogueReady && phase === 'goalType' && <div className="goal-type-choices" aria-label="30日の目標タイプ">
              {TWO_DAY_REVIEW_GOAL_TYPES.map((type) => <button type="button" key={type.value} onClick={() => chooseInitialGoalType(type.value)}><span aria-hidden="true">{type.icon}</span><span>{type.label}</span></button>)}
              <style>{`
                .goal-type-choices { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-top: 14px; }
                .goal-type-choices button { display: grid; grid-template-columns: 28px 1fr; align-items: center; min-height: 52px; gap: 7px; border: 1px solid #b49172; border-radius: 10px; padding: 9px 11px; color: #4e392d; background: #fffaf0; box-shadow: 0 3px 0 rgba(105,65,44,.16); text-align: left; font-size: .8rem; font-weight: 800; transition: transform .12s, background .12s; }
                .goal-type-choices button:hover { background: #fff0d7; transform: translateY(-1px); }
                .goal-type-choices button:active { transform: translateY(2px); box-shadow: 0 1px 0 rgba(105,65,44,.16); }
              `}</style>
            </div>}
            {initialDialogueReady && phase === 'goalReply' && <button className="dialogue-next" type="button" onClick={finishUndecidedGoal} aria-label="部屋へ進む">●</button>}
          </section>
        )}

        {initialDialogueReady && mobileRoomMode && phase === 'callName' && <SuuhimochiKeyboard
          value={initialCallName}
          onChange={setInitialCallName}
          onDecide={commitInitialCallName}
          maxLength={20}
          placeholder="呼ばれたい名前"
          ariaLabel="呼ばれたい名前"
        />}
        {initialDialogueReady && mobileRoomMode && phase === 'goal' && <SuuhimochiKeyboard
          value={initialGoalText}
          onChange={setInitialGoalText}
          onDecide={commitInitialGoal}
          maxLength={100}
          placeholder="見たい景色や、やってみたいこと"
          ariaLabel="30日間の目標"
        />}

        {phase === 'home' && <>
          <header className="game-status"><div><strong>DAY {conversationDay}</strong><span>{conversationPhase}</span></div><div className="game-status-actions"><button className="room-light-toggle" type="button" onClick={() => setLightsOut((value) => !value)} disabled={dailyProgressOpen || !isDarkPeriod} aria-pressed={isDarkPeriod && lightsOut}>{isDarkPeriod && lightsOut ? '点灯' : '消灯'}</button><span className="time-label">{TIME_LABELS[currentTime]}</span></div></header>
          {dailyProgressOpen && dailyProgressActivityDate && <DailyProgressCheck activityDate={dailyProgressActivityDate} reviewedDate={getPreviousActivityDateKey(dailyProgressActivityDate)} onComplete={completeDailyProgress} useSuuhimochiKeyboard={mobileRoomMode} />}
          {graduationOpen && <GraduationFlow
            preview={graduationPreview}
            callName={getPreferredCallName(save)}
            cycleNumber={save.cycleNumber}
            previousGoal={conversation.current?.getGoal() ?? 'まだ決まっていない'}
            previousGoalType={save.goalType ?? null}
            dailyProgressRecords={save.dailyProgressRecords ?? []}
            journalNotes={save.journalNotes ?? {}}
            twoDayReviews={save.twoDayReviews ?? []}
            strategyRecords={save.strategyRecords ?? []}
            onClose={graduationPreview ? closeGraduationPreview : undefined}
            onComplete={completeGraduation}
          />}
          {talkOpen && (
            <section
              className={`face-talk${isMochiSpeaking ? ' face-talk-speaking' : ''}${talkUiOnLeft ? ' face-talk-ui-left' : ''}${talkInputEnabled ? ' face-talk-text-input' : ''}`}
              aria-busy={isMochiSpeaking}
              onPointerDown={isMochiSpeaking ? (event) => {
                if ((event.target as HTMLElement).closest('button')) return;
                advanceTalkSpeech();
              } : undefined}
            >
              {!isMochiSpeaking && <button className="face-talk-close" aria-label="会話を閉じる" onClick={closeTalk}><X size={20} /></button>}

              {mobileRoomMode && !isMochiSpeaking && talkInputEnabled && talkInputPrompt && (
                <aside className="face-talk-input-prompt" aria-live="polite">
                  <span>すうひもちの質問</span>
                  <p>{talkInputPrompt}</p>
                </aside>
              )}

              {isMochiSpeaking && (
                <button
                  className="face-talk-bubble"
                  type="button"
                  onClick={(event) => { event.stopPropagation(); advanceTalkSpeech(); }}
                  aria-live="polite"
                  aria-label={talkPageReady ? (talkPageIndex < talkPageCount - 1 ? '次の言葉へ' : '返事へ進む') : '全文を表示'}
                >
                  <span className="face-talk-speaker">すうひもち</span>
                  <span className="face-talk-line">{currentTalkLine || '……'}{!talkPageReady && <span className="speech-caret" aria-hidden="true" />}</span>
                  {talkPageCount > 1 && <span className="face-talk-page" aria-hidden="true">{talkPageIndex + 1}/{talkPageCount}</span>}
                  {talkPageReady && <span className="face-talk-continue" aria-hidden="true">クリックでつづく <b>▼</b></span>}
                </button>
              )}

              {!isMochiSpeaking && talkCommandOpen && (
                <div className="face-talk-right face-talk-command-menu">
                  <strong>なにを話す？</strong>
                  <div className="tactile-choice-list" aria-label="会話を選ぶ">
                    <button className="tactile-choice-button" type="button" onClick={() => chooseTalkCommand('chat')}>
                      <span className="tactile-choice-number" aria-hidden="true">1</span>
                      <span className="tactile-choice-label">お話する</span>
                      <span className="tactile-choice-arrow" aria-hidden="true">›</span>
                    </button>
                    <button className="tactile-choice-button" type="button" onClick={() => chooseTalkCommand('teach')}>
                      <span className="tactile-choice-number" aria-hidden="true">2</span>
                      <span className="tactile-choice-label">ことばを教える</span>
                      <span className="tactile-choice-arrow" aria-hidden="true">›</span>
                    </button>
                    <button className="tactile-choice-button" type="button" onClick={() => chooseTalkCommand('question')}>
                      <span className="tactile-choice-number" aria-hidden="true">3</span>
                      <span className="tactile-choice-label">すうひもちの質問にこたえる</span>
                      <span className="tactile-choice-arrow" aria-hidden="true">›</span>
                    </button>
                    <button className="tactile-choice-button" type="button" onClick={() => chooseTalkCommand('monologue')}>
                      <span className="tactile-choice-number" aria-hidden="true">4</span>
                      <span className="tactile-choice-label">ひとりごとを聞く</span>
                      <span className="tactile-choice-arrow" aria-hidden="true">›</span>
                    </button>
                    <button className="tactile-choice-button" type="button" onClick={() => chooseTalkCommand('skit')}>
                      <span className="tactile-choice-number" aria-hidden="true">5</span>
                      <span className="tactile-choice-label">小さな寸劇をみる</span>
                      <span className="tactile-choice-arrow" aria-hidden="true">›</span>
                    </button>
                  </div>
                </div>
              )}

              {!isMochiSpeaking && miniDialogueNode?.type === 'choice' && (
                <div className="face-talk-right face-talk-mini-dialogue-choices">
                  <div className="tactile-choice-list" aria-label="寸劇の返事を選ぶ">
                    {miniDialogueNode.choices.map((choice, index) => (
                      <button className="tactile-choice-button" type="button" key={`${miniDialogueNode.id}-${choice.next}`} onClick={() => chooseMiniDialogue(choice.next)}>
                        <span className="tactile-choice-number" aria-hidden="true">{index + 1}</span>
                        <span className="tactile-choice-label">{replaceCallName(resolveDialogueText(choice.text, miniDialogue?.slots ?? {}), getPreferredCallName(save))}</span>
                        <span className="tactile-choice-arrow" aria-hidden="true">›</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!isMochiSpeaking && miniDialogueNode?.type === 'end' && (
                <div className="face-talk-right face-talk-command-menu face-talk-mini-dialogue-end">
                  <strong>寸劇はおしまいなの。</strong>
                  <button className="face-talk-action" type="button" onClick={startClosetScare}>もう一度みる</button>
                  <button className="face-talk-action face-talk-secondary" type="button" onClick={closeTalk}>部屋にもどる</button>
                </div>
              )}

              {!isMochiSpeaking && !talkCommandOpen && talkStage !== 'complete' && talkStage !== 'ended' && talkInputEnabled && (
                <div className="face-talk-left">
                  <form className="face-talk-input" onSubmit={submitTalk}>
                    <label htmlFor="talk-text" className="sr-only">返事を書く</label>
                    {mobileRoomMode ? <SuuhimochiKeyboard
                      value={talkText}
                      onChange={setTalkText}
                      onDecide={commitTalk}
                      maxLength={180}
                      placeholder={talkPlaceholder}
                      ariaLabel="返事を書く"
                    /> : <>
                      <textarea id="talk-text" value={talkText} onChange={(event) => setTalkText(event.target.value)} maxLength={180} placeholder={talkPlaceholder} />
                      <div className="face-talk-input-footer"><small>お話はこの端末に保存されます</small><button className="face-talk-send" type="submit" disabled={!talkText.trim()}>話す</button></div>
                    </>}
                  </form>
                  {promptedQuestionInput && <button className="face-talk-action face-talk-secondary prompted-skip-button" type="button" onClick={skipPromptedTalkQuestion}>わかんない</button>}
                  {talkStage === 'followup' && <button className="face-talk-action face-talk-secondary" type="button" onClick={() => conversation.current && applyTalkResponse(conversation.current.finishEarly())}>今日はここまで</button>}
                </div>
              )}

              {!isMochiSpeaking && !talkCommandOpen && talkStage !== 'complete' && talkStage !== 'ended' && talkInputMode === 'choice' && talkChoices.length > 0 && (
                <div className="face-talk-right">
                  <div className="tactile-choice-list" aria-label="返事を選ぶ">
                    {talkChoices.map((choice, index) => (
                      <button className="tactile-choice-button" key={choice.id} onClick={() => chooseTalkChoice(choice)}>
                        <span className="tactile-choice-number" aria-hidden="true">{index + 1}</span>
                        <span className="tactile-choice-label">{choice.label}</span>
                        <span className="tactile-choice-arrow" aria-hidden="true">›</span>
                      </button>
                    ))}
                  </div>
                  {talkStage === 'followup' && <button className="face-talk-action face-talk-secondary" type="button" onClick={() => conversation.current && applyTalkResponse(conversation.current.finishEarly())}>今日はここまで</button>}
                </div>
              )}

              {!isMochiSpeaking && !talkCommandOpen && talkStage !== 'complete' && talkStage !== 'ended' && talkInputMode === 'category' && categoryChoices.length > 0 && (
                <div className="face-talk-right">
                  <div className="tactile-choice-list" aria-label="言葉の種類を選ぶ">
                    {visibleCategoryChoices.map((choice, index) => (
                      <button className="tactile-choice-button" key={choice.category} onClick={() => chooseTalkCategory(choice)}>
                        <span className="tactile-choice-number" aria-hidden="true">{index + 1}</span>
                        <span className="tactile-choice-label">{choice.label}</span>
                        <span className="tactile-choice-arrow" aria-hidden="true">›</span>
                      </button>
                    ))}
                    {safeCategoryPage === categoryPageCount - 1 && otherCategoryChoice && (
                      <button className="tactile-choice-button" key={otherCategoryChoice.category} onClick={() => chooseTalkCategory(otherCategoryChoice)}>
                        <span className="tactile-choice-number" aria-hidden="true">{visibleCategoryChoices.length + 1}</span>
                        <span className="tactile-choice-label">{otherCategoryChoice.label}</span>
                        <span className="tactile-choice-arrow" aria-hidden="true">›</span>
                      </button>
                    )}
                  </div>
                  <div className="category-pagination" aria-label="カテゴリページ">
                    <button type="button" className="category-pagination-button" onClick={() => setCategoryPage((page) => Math.max(0, page - 1))} disabled={safeCategoryPage === 0}>前へ</button>
                    <span aria-live="polite">{safeCategoryPage + 1} / {categoryPageCount}</span>
                    <button type="button" className="category-pagination-button" onClick={() => setCategoryPage((page) => Math.min(categoryPageCount - 1, page + 1))} disabled={safeCategoryPage === categoryPageCount - 1}>次へ</button>
                  </div>
                  {talkStage === 'followup' && <button className="face-talk-action face-talk-secondary" type="button" onClick={() => conversation.current && applyTalkResponse(conversation.current.finishEarly())}>今日はここまで</button>}
                </div>
              )}

              {!isMochiSpeaking && !talkCommandOpen && talkStage !== 'complete' && talkStage !== 'ended' && talkInputMode === 'category' && subCategoryChoices.length > 0 && (
                <div className="face-talk-right">
                  <div className="tactile-choice-list" aria-label="言葉の中分類を選ぶ">
                    {subCategoryChoices.map((choice, index) => (
                      <button className="tactile-choice-button" key={choice.id} onClick={() => chooseTalkSubCategory(choice)}>
                        <span className="tactile-choice-number" aria-hidden="true">{index + 1}</span>
                        <span className="tactile-choice-label">{choice.label}</span>
                        <span className="tactile-choice-arrow" aria-hidden="true">›</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!isMochiSpeaking && !talkCommandOpen && talkStage === 'farewell' && <div className="face-talk-right"><button className="face-talk-action" onClick={() => conversation.current && applyTalkResponse(conversation.current.continueFarewell())}>……</button></div>}
              {!isMochiSpeaking && !talkCommandOpen && talkStage === 'ended' && <div className="face-talk-right face-talk-complete"><button className="face-talk-action" onClick={openGraduationFlow}>卒業と引き継ぎへ</button><button className="face-talk-action face-talk-secondary" onClick={() => { closeTalk(); setMemoryOpen(true); }}>手紙を読む</button></div>}
            </section>
          )}
          {foodOpen && <FoodPanel
            fruits={save.experienceFruits ?? []}
            personaStage={maskGrowthStage}
            mealState={{
              activityDate: save.foodActivityDate,
              mealsEaten: save.experienceMealsEaten,
              lastMealAt: save.lastExperienceMealAt,
            }}
            onEat={eatExperienceFruit}
            onClose={() => setFoodOpen(false)}
          />}
          {minigameOpen && <MiniGamePanel onClose={() => setMinigameOpen(false)} />}
          {potenoOpen && <PotenoPanel
            onClose={closePoteno}
            worldTarget={worldRef.current}
            currentDay={conversationDay}
            activityDate={getActivityDateKey()}
            birthDate={save.birthday}
            goalText={conversation.current?.getGoal() ?? ''}
            goalType={save.goalType ?? null}
            dailyProgressRecords={save.dailyProgressRecords ?? []}
            journalNotes={save.journalNotes ?? {}}
            twoDayReviews={save.twoDayReviews ?? []}
            strategyRecords={[...(save.cycleArchives ?? []).flatMap((archive) => archive.strategyRecords), ...(save.strategyRecords ?? [])]}
            divinationRecords={[...(save.cycleArchives ?? []).flatMap((archive) => archive.divinationRecords), ...(save.divinationRecords ?? [])]}
            cycleArchives={save.cycleArchives ?? []}
            onSaveTwoDayReview={saveTwoDayReview}
            onSaveStrategy={saveStrategyRecord}
            onSaveDivination={saveDivinationRecord}
          />}
          {twoDayReviewTalkOpen && <TwoDayReviewTalk
            onClose={() => setTwoDayReviewTalkOpen(false)}
            currentDay={conversationDay}
            activityDate={getActivityDateKey()}
            goalType={save.goalType ?? null}
            dailyProgressRecords={save.dailyProgressRecords ?? []}
            journalNotes={save.journalNotes ?? {}}
            existingReviews={save.twoDayReviews ?? []}
            onSave={saveTwoDayReview}
          />}
          {memoryOpen && <JournalPanel
            currentDay={conversationDay}
            currentPhase={conversationPhase}
            currentActivityDate={getActivityDateKey()}
            goalText={conversation.current?.getGoal() ?? ''}
            goalType={save.goalType ?? null}
            records={save.dailyProgressRecords ?? []}
            journalNotes={save.journalNotes ?? {}}
            strategyRecords={save.strategyRecords ?? []}
            divinationRecords={save.divinationRecords ?? []}
            memories={conversationMemories}
            words={dictionaryEntries}
            farewellLetter={farewellLetter ? replaceCallName(farewellLetter, getPreferredCallName(save)) : null}
            cycleArchives={save.cycleArchives ?? []}
            experienceFruitDates={[...new Set((save.experienceFruits ?? []).map((fruit) => fruit.sourceDate))]}
            onClose={() => setMemoryOpen(false)}
            onSaveDoneItems={saveJournalDoneItems}
            onConfirmNoExperience={confirmNoExperience}
            onChangeGoalType={saveGoalType}
            useSuuhimochiKeyboard={mobileRoomMode}
          />}
          {dictionaryOpen && <section className="dictionary-note" aria-label="すうひもちの辞書">
            <button className="dictionary-close" aria-label="辞書を閉じる" onClick={() => setDictionaryOpen(false)}><X size={18} /></button>
            <header className="dictionary-heading">
              <span className="dictionary-heading-mark" aria-hidden="true">ことば</span>
              <div><strong>すうひもちの辞書</strong><small>覚えたことば　{dictionaryEntries.length}こ</small></div>
            </header>
            {dictionaryEntries.length === 0 ? (
              <p className="dictionary-empty">まだ白いページなの。<br />ことばを教えてくれたら、ここに書いていくの。</p>
            ) : <>
              <div className="dictionary-filters" aria-label="カテゴリで絞り込む">
                <button type="button" className={dictionaryCategory === 'ALL' ? 'active' : ''} onClick={() => setDictionaryCategory('ALL')}>ぜんぶ</button>
                {dictionaryCategoryOptions.map((category) => <button type="button" key={category} className={dictionaryCategory === category ? 'active' : ''} onClick={() => setDictionaryCategory(category)}>{CATEGORY_LABELS[category]}</button>)}
              </div>
              <div className="dictionary-list">
                {visibleDictionaryEntries.map((entry) => {
                  const feeling = dictionaryFeelingLabel(entry);
                  return <article className="dictionary-word-card" key={entry.id}>
                    <div className="dictionary-word-title"><b>{entry.surface}</b>{entry.oshiStatus === 'YES' && <em>推し</em>}</div>
                    <span className="dictionary-category">{CATEGORY_LABELS[entry.category]}</span>
                    <p>{dictionaryEntryNote(entry)}</p>
                    {feeling && <small>{getPreferredCallName(save)}は「{feeling}」って言ってたの。</small>}
                    <button className="dictionary-word-delete" type="button" onClick={() => forgetDictionaryWord(entry)}>このことばを忘れる</button>
                  </article>;
                })}
                {visibleDictionaryEntries.length === 0 && <p className="dictionary-filter-empty">このカテゴリには、まだことばがないの。</p>}
              </div>
            </>}
          </section>}
          {itemOpen && itemPanelCollapsed && <div className="item-mini-toolbar"><span>アイテムを移動中</span><button type="button" onClick={() => setItemPanelCollapsed(false)}>一覧を開く</button></div>}
          {itemOpen && !itemPanelCollapsed && <section className="item-note" aria-label="アイテム" style={{ left: `${itemPanelX}%` }} onPointerDown={beginItemPanelDrag} onPointerMove={moveItemPanel} onPointerUp={() => { itemPanelDragRef.current = null; }} onPointerCancel={() => { itemPanelDragRef.current = null; }}>
            <button className="item-note-close" aria-label="アイテムを閉じる" onClick={() => { setItemOpen(false); setSelectedItemId(null); }}><X size={18} /></button>
            <button className="item-note-collapse" type="button" onClick={() => setItemPanelCollapsed(true)}>たたむ</button>
            <strong>アイテム</strong>
            <p className="item-note-guide">この一覧はドラッグして左右に移動できます。配置中のアイテムは部屋でドラッグ、ダブルクリックで収納。家具はすうひもちが通り抜けません。</p>
            <div className="item-tabs" role="tablist" aria-label="アイテムの状態">
              <button type="button" role="tab" aria-selected={itemTab === 'placed'} className={itemTab === 'placed' ? 'active' : ''} onClick={() => setItemTab('placed')}>配置中 <span>{ROOM_ITEMS.length + 1 - storedItemIds.length}</span></button>
              <button type="button" role="tab" aria-selected={itemTab === 'stored'} className={itemTab === 'stored' ? 'active' : ''} onClick={() => setItemTab('stored')}>収納中 <span>{storedItemIds.length}</span></button>
            </div>
            <div className="item-card-list" role="tabpanel" aria-label={itemTab === 'placed' ? '配置中のアイテム' : '収納中のアイテム'}>
              {([{ id: 'clock', src: '', alt: '卓上時計' }, ...ROOM_ITEMS] as { id: string; src: string; alt: string }[])
                .filter((item) => storedItemIds.includes(item.id) === (itemTab === 'stored'))
                .map((item) => (
                  <div className={`item-tile${selectedItemId === item.id ? ' selected' : ''}`} key={item.id}>
                    <button className="item-tile-main" type="button" onClick={() => itemTab === 'stored' ? placeRoomItem(item.id) : setSelectedItemId(item.id)} aria-label={`${item.alt}を${itemTab === 'stored' ? '部屋に置く' : '部屋で確認する'}`}>
                      <span className="item-tile-preview">{item.id === 'clock' ? <span className="item-card-mini-clock"><PixelClockDigits time={clockTime} /></span> : item.id === 'wall-clock' ? <span className="item-card-wall-clock"><WallClockFace time={clockTime} /></span> : item.id === 'wall-clock-digital' ? <span className="item-card-wall-clock"><WallClockDigitalFace time={clockTime} /></span> : item.id === MASK_CASE_ITEM_ID ? <MaskDisplay stage={maskGrowthStage} compact /> : <img src={item.src} alt="" draggable={false} />}</span>
                      <span className="item-tile-name">{item.alt}</span>
                    </button>
                    {itemTab === 'stored' ? (
                      <button className="item-tile-action" type="button" onClick={() => placeRoomItem(item.id)}>配置する</button>
                    ) : (
                      <button className="item-tile-action" type="button" onClick={() => storeRoomItem(item.id)}>しまう</button>
                    )}
                  </div>
                ))}
              {itemTab === 'stored' && storedItemIds.length === 0 && <p className="item-list-empty">収納中のアイテムはありません。</p>}
              {itemTab === 'placed' && storedItemIds.length === ROOM_ITEMS.length + 1 && <p className="item-list-empty">部屋にアイテムはありません。収納中から配置できます。</p>}
            </div>
          </section>}
          {settingsOpen && <section className="settings-note" aria-label="設定">
            <button className="item-note-close" aria-label="設定を閉じる" onClick={() => setSettingsOpen(false)}><X size={18} /></button>
            <strong>設定</strong>
            <form className="settings-form" onSubmit={saveSettings}>
              <label htmlFor="settings-user-name">ユーザー名</label>
              <input id="settings-user-name" value={settingsUserName} onChange={(event) => setSettingsUserName(event.target.value)} maxLength={30} placeholder="あなたの名前" />
              <label htmlFor="settings-call-name">呼ばれ方</label>
              <input id="settings-call-name" value={settingsCallName} onChange={(event) => setSettingsCallName(event.target.value)} maxLength={20} placeholder="呼び名を入力" />
              <small>呼ばれ方は、すうひもちのセリフに反映されます。</small>
              <section className="settings-divination-profile" aria-label="占いの参照情報">
                <div className="settings-profile-heading"><b>占いの参照情報</b><small>ポテノ六占で使います。</small></div>
                <label htmlFor="settings-birthday">生年月日 <em>{save.birthdayCorrectionUsed ? '修正済み' : save.birthday ? '修正 一度だけ' : '登録する'}</em></label>
                <input
                  id="settings-birthday"
                  type="date"
                  value={settingsBirthday}
                  onChange={(event) => setSettingsBirthday(event.target.value)}
                  max={new Date().toISOString().slice(0, 10)}
                  disabled={Boolean(save.birthday && save.birthdayCorrectionUsed)}
                  aria-describedby="settings-birthday-help"
                />
                <small id="settings-birthday-help">{save.birthdayCorrectionUsed ? '生年月日の修正は使用済みです。' : save.birthday ? '生年月日の修正は一度だけ行えます。' : '生年月日を登録すると六占で使えます。'}</small>
              </section>
              <section className="settings-pwa-guide" aria-label="スマホで広く遊ぶ方法">
                <b>スマホで広く遊ぶ</b>
                <p>ブラウザの「ホーム画面に追加」から開くと、アドレスバーのない広い画面で遊べます。</p>
              </section>
              <button className="settings-save" type="submit">保存する</button>
            </form>
          </section>}
        </>}

        {process.env.NODE_ENV !== 'production' && <details className="dev-panel">
          <summary>DEV</summary>
          <div>
            <strong>開発用（製作者のみ）</strong>
            <section className="dev-initial-preview">
              <b>初回起動テスト</b>
              {isInitialPreview ? <>
                <span>現在：初回起動プレビュー</span>
                <button type="button" onClick={returnFromInitialPreview}>現在のデータに戻る</button>
              </> : <>
                <button type="button" onClick={startInitialPreview}>初回起動画面を確認</button>
                <span>現在：通常データ</span>
              </>}
            </section>
            {!isInitialPreview && <>
            <section className="dev-initial-preview">
              <b>最終日テスト</b>
              <button type="button" onClick={openGraduationPreview}>最終日の卒業を確認</button>
              <span>現在の記録を使って卒業導線を開きます。プレビュー中は保存データを変更しません。</span>
            </section>
            <button onClick={resetAll}><RotateCcw size={14} /> 初期化</button>
            <button onClick={() => { setPhase('birthday'); setBirthday(save.birthday); }}>生年月日変更</button>
            <label>タイプ<select value={save.mochiType} onChange={(event) => setSave((current) => ({ ...current, mochiType: Number(event.target.value) }))}>{Array.from({ length: 9 }, (_, index) => index + 1).map((type) => <option key={type}>{type}</option>)}</select></label>
            <label>時間帯<select value={timeMode} onChange={(event) => setTimeMode(event.target.value as TimeMode)}><option value="auto">自動</option><option value="morning">朝</option><option value="day">昼</option><option value="evening">夕暮れ</option><option value="night">夜</option><option value="midnight">深夜</option></select></label>
            <button onClick={saySomething}><Sparkles size={14} /> 独り言</button>
            <button onClick={() => conversation.current && runDevConversation(conversation.current.advanceDay())}>+1日</button>
            <button onClick={() => conversation.current && runDevConversation(conversation.current.reopenToday())}>今日を再開</button>
            <button onClick={() => conversation.current && runDevConversation(conversation.current.jumpFarewell())}>DAY 30</button>
            <button onClick={() => conversation.current && runDevConversation(conversation.current.clearOverride())}>現実の日付</button>
            <button onClick={() => setShowCollisionDebug((visible) => !visible)}>当たり判定 {showCollisionDebug ? 'OFF' : 'ON'}</button>
            <div className="dev-expression-preview">
              <b>表情プレビュー</b>
              <div className="dev-expression-canvas" aria-label="すうひもち表情プレビュー">
                <img src={`${ZOOM_ASSET_ROOT}/body/body-front.png`} alt="" draggable={false} />
                <img src={zoomArmAsset('left', devPreviewLeftArm)} alt="" draggable={false} />
                <img src={zoomArmAsset('right', devPreviewRightArm)} alt="" draggable={false} />
                <img src={zoomEyeAsset(devPreviewEmotion, devPreviewEyes)} alt="" draggable={false} />
                <img src={zoomMouthAsset(devPreviewMouth, devPreviewEmotion)} alt="" draggable={false} />
              </div>
              <button type="button" onClick={() => setDevPreviewPlaying((playing) => !playing)}>{devPreviewPlaying ? 'アニメーション停止' : 'アニメーション再生'}</button>
              <label>表情<select value={devPreviewEmotion} onChange={(event) => setDevPreviewEmotion(event.target.value as ZoomFaceEmotion)}><option value="neutral">通常</option><option value="happy">うれしい</option><option value="nervous">緊張</option><option value="sad">悲しい</option><option value="surprised">驚き</option><option value="thinking">考え中</option><option value="angry">怒り</option></select></label>
              <label>目<select value={devPreviewEyes} onChange={(event) => setDevPreviewEyes(event.target.value as ZoomEyeFrame)}><option value="open">開き</option><option value="half">半開き</option><option value="closed">閉じ</option></select></label>
              <label>口<select value={devPreviewMouth} onChange={(event) => setDevPreviewMouth(event.target.value as ZoomMouthFrame)}><option value="closed">閉じ</option><option value="small">小さく開き</option><option value="open">開き</option></select></label>
              <label>左腕<select value={devPreviewLeftArm} onChange={(event) => setDevPreviewLeftArm(event.target.value as ZoomArmPose)}><option value="down">下げ</option><option value="up">上げ</option><option value="open">開き</option><option value="chest">胸元</option></select></label>
              <label>右腕<select value={devPreviewRightArm} onChange={(event) => setDevPreviewRightArm(event.target.value as ZoomArmPose)}><option value="down">下げ</option><option value="up">上げ</option><option value="open">開き</option><option value="chest">胸元</option></select></label>
            </div>
            {talkDebug && <div className="conversation-debug">
              <b>STATE</b><span>{talkDebug.state} / depth {talkDebug.depth}</span>
              <b>START</b><span>{talkDebug.startType}</span>
              <b>TOPIC</b><span>{talkDebug.topic || '—'} / {talkDebug.topicKnown ? 'KNOWN' : 'UNKNOWN'} / {talkDebug.topicScore}</span>
              <b>TEMPLATE</b><span>{talkDebug.selectedTemplate || '—'}</span>
              <b>MEMORY</b><span>{talkDebug.memoryHit ?? '—'}</span>
              <b>TOKENS</b><code>{talkDebug.tokens.length ? talkDebug.tokens.map((token) => `${token.surface}:${token.known ? 'K' : 'U'}:${token.score}`).join('\n') : '—'}</code>
              <b>ATTR</b><code>{Object.keys(talkDebug.attributes).length ? JSON.stringify(talkDebug.attributes, null, 2) : '—'}</code>
            </div>}
            </>}
          </div>
        </details>}
      </div>
      {!dailyProgressOpen && !talkOpen && !potenoOpen && !twoDayReviewTalkOpen && <>
      <button
        ref={mobileNavHandleRef}
        className={`mobile-room-menu-handle${mobileNavOpen ? ' is-open' : ''}`}
        type="button"
        aria-expanded={mobileNavOpen}
        aria-controls="room-mobile-navigation"
        onClick={() => setMobileNavOpen((open) => !open)}
      ><span aria-hidden="true">{mobileNavOpen ? '﹀' : '︿'}</span><b>メニュー</b></button>
      <nav
        ref={mobileNavRef}
        id="room-mobile-navigation"
        className={`room-nav${mobileNavOpen ? ' mobile-nav-open' : ''}`}
        aria-label="部屋のメニュー"
        onClick={() => { if (mobileRoomMode) setMobileNavOpen(false); }}
      >
        <button className={!memoryOpen && !dictionaryOpen && !foodOpen && !itemOpen && !minigameOpen && !settingsOpen ? 'active' : ''} onClick={() => { setMemoryOpen(false); setDictionaryOpen(false); setFoodOpen(false); setItemOpen(false); setMinigameOpen(false); setPotenoOpen(false); setSettingsOpen(false); setSelectedItemId(null); bubbleRef.current = null; setBubblePageIndex(0); setBubble(null); }}><Home size={19} /><span>部屋</span></button>
        <button onClick={openTalk}><MessageCircle size={19} /><span>はなす</span></button>
        <button className={memoryOpen ? 'active' : ''} onClick={() => { setMemoryOpen(true); setDictionaryOpen(false); setFoodOpen(false); setItemOpen(false); setMinigameOpen(false); setPotenoOpen(false); setSettingsOpen(false); setSelectedItemId(null); }}><NotebookTabs size={19} /><span>日誌</span></button>
        <button className={dictionaryOpen ? 'active' : ''} onClick={openDictionary}><BookOpen size={19} /><span>辞書</span></button>
        <button className={foodOpen ? 'active' : ''} onClick={openFood}><Apple size={19} /><span>食事</span></button>
        <button className={itemOpen ? 'active' : ''} onClick={() => { setMemoryOpen(false); setDictionaryOpen(false); setFoodOpen(false); setMinigameOpen(false); setPotenoOpen(false); setItemOpen((open) => { if (!open) setItemPanelX(window.matchMedia('(max-width: 700px)').matches ? 12 : 3); return !open; }); setSettingsOpen(false); setItemPanelCollapsed(false); if (itemOpen) setSelectedItemId(null); }}><PackageOpen size={19} /><span>アイテム</span></button>
        <button className={minigameOpen ? 'active' : ''} onClick={openMinigames}><Gamepad2 size={19} /><span className="room-nav-label-long">ミニゲーム</span><span className="room-nav-label-short">ゲーム</span></button>
        <button onClick={openPoteno}><UserRoundPlus size={19} /><span className="room-nav-label-long">ポテノを呼ぶ</span><span className="room-nav-label-short">ポテノ</span></button>
        <button className={settingsOpen ? 'active' : ''} onClick={openSettings}><Settings size={19} /><span>設定</span></button>
      </nav></>}
      </div>
    </main>
  );
}
