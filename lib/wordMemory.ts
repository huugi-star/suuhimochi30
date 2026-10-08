import {
  CATEGORY_CHOICES,
  CATEGORY_LABELS,
  GOAL_ACTION_CHOICES,
  GOAL_STATUS_CHOICES,
  MIDDLE_CATEGORY_DIALOGUE,
  SYSTEM_WORDS,
  SUBCATEGORY_CHOICES,
  WORD_FEELING_CHOICES,
  WORD_FEELING_PROMPTS,
} from './conversationData';
import { findCommonKnowledge } from './commonKnowledgeData';
import { runConversationEngine } from './conversation/conversationEngine';
import type {
  ConversationChoiceRecord,
  ConversationScript,
  CuriousConversation,
  CuriousConversationChoice,
  DialogueBeat,
  DialoguePage,
  KnowledgeLevel,
  MemoryRelationType,
  OpenQuestionField,
} from './conversation/conversationTypes';
import type {
  CategoryChoice,
  ConversationChoice,
  ConversationLog,
  ConversationMemory,
  ConversationPhase,
  ConversationResponse,
  ConversationStage,
  DebugSnapshot,
  ExpectedAnswer,
  GoalAction,
  GoalCheck,
  GoalStatus,
  InputMode,
  LearnedWord,
  MemoryEpisode,
  MemoryEvent,
  MemoryHypothesis,
  MemoryRelation,
  OpenQuestion,
  OshiStatus,
  Relation,
  RelationType,
  Sentiment,
  StartType,
  StorageLike,
  SubCategoryChoice,
  WordCategory,
  WordEntry,
} from './conversationTypes';

export type { DialoguePage } from './conversation/conversationTypes';

export type {
  CategoryChoice,
  ConversationChoice,
  ConversationMemory,
  ConversationResponse,
  ConversationStage,
  DebugSnapshot,
  ExpectedAnswer,
  GoalAction,
  GoalCheck,
  GoalStatus,
  InputMode,
  LearnedWord,
  MemoryEpisode,
  MemoryEvent,
  MemoryHypothesis,
  MemoryRelation,
  OpenQuestion,
  OshiStatus,
  Relation,
  RelationType,
  Sentiment,
  StartType,
  StorageLike,
  SubCategoryChoice,
  WordCategory,
  WordEntry,
} from './conversationTypes';
const STORAGE_KEY = 'suuhimochi_conversation_v6_choices';
const INTERNAL_TOPICS = new Set(['今日の調子', '30日の目標']);
const MAX_WORD_LENGTH = 30;
const MAX_GOAL_LENGTH = 100;
const GOAL_CHECK_INTERVAL = 20;
const GOAL_CHECK_MAX_DAYS = 5;
const UNDECIDED_GOAL = 'まだ決まっていない';

const OSHI_CONFIRM_CHOICES: ConversationChoice[] = [
  { id: 'OSHI_YES', label: '推し！' },
  { id: 'OSHI_NO', label: '大好きだけど推しではない' },
];

const OSHI_TARGET_SUBCATEGORIES = new Set([
  'GAME_MEDIA_1', // 漫画
  'GAME_MEDIA_2', // アニメ
  'GAME_MEDIA_3', // ゲーム
  'GAME_MEDIA_4', // キャラクター
  'GAME_MEDIA_5', // 作品・シリーズ
  'GAME_MEDIA_6', // 作中のもの・用語
]);
const OSHI_EVERY_TWO_SUBCATEGORIES = new Set(['GAME_MEDIA_1', 'GAME_MEDIA_2', 'GAME_MEDIA_3']);

const OSHI_PROMPTS = [
  (word: string) => `大好きなんだ！ じゃあ、${word}ってもしかして人間さんの推し？`,
  (word: string) => `そんなに好きなんだ。${word}って、人間さんの推しだったりするの？`,
  (word: string) => `${word}は大好きなんだね。もしかして、推しっていうやつ？`,
  (word: string) => `人間さん、${word}のことすごく好きなんだね。${word}は推しなの？`,
  (word: string) => `大好きなんだ！ ${word}って、人間さんにとって特別な推し？`,
];

const OSHI_YES_REACTIONS = [
  (word: string) => `推しなんだ！ ${word}、ちゃんと覚えておくの。`,
  (word: string) => `やっぱり推しなんだね。${word}は人間さんにとって特別なんだ。`,
  (word: string) => `推し、覚えたの！ ${word}のことは忘れないようにするね。`,
  (word: string) => `なるほど……${word}が推し。これは大事なことなの。`,
];

const OSHI_NO_REACTIONS = [
  () => 'そっか。大好きだけど、推しとはちょっと違うんだね。',
  () => 'なるほどなの。大好きと推しって、同じじゃないんだね。',
  (word: string) => `わかったの。${word}は大好き。でも推しではないんだね。`,
  () => '人間さんの「大好き」にも、いろんな種類があるんだね。',
];

type StoredState = {
  version: 9;
  words: Record<string, WordEntry>;
  memories: ConversationMemory[];
  relations: Relation[];
  events: MemoryEvent[];
  conversations: ConversationLog[];
  startDate: string | null;
  dayOverride: number | null;
  ended: boolean;
  conversationCount: number;
  goalText: string | null;
  goalSetAt: string | null;
  lastGoalCheckDate: string | null;
  goalChecks: GoalCheck[];
  lastWordSurface: string | null;
  oshiLoveCounts: Record<string, number>;
  /** この個体が見た新会話のID。次回は未閲覧の台本を優先する。 */
  seenConversationIds: string[];
  /** 選択肢の記録。単語記憶・性格診断へは今回接続しない。 */
  conversationChoiceRecords: ConversationChoiceRecord[];
  memoryRelations: MemoryRelation[];
  openQuestions: OpenQuestion[];
  memoryEpisodes: MemoryEpisode[];
  memoryHypotheses: MemoryHypothesis[];
};

type Session = {
  id: string;
  stage: ConversationStage;
  phase: ConversationPhase;
  startType: StartType;
  expected: ExpectedAnswer;
  inputMode: InputMode;
  topic: string | null;
  category: WordCategory;
  choices: ConversationChoice[];
  lastUserText: string;
  lastAssistantLines: string[];
  attributes: Record<string, string>;
  pendingGoalStatus: GoalStatus | null;
};

function emptyState(): StoredState {
  return {
    version: 9,
    words: Object.create(null),
    memories: [],
    relations: [],
    events: [],
    conversations: [],
    startDate: null,
    dayOverride: null,
    ended: false,
    conversationCount: 0,
    goalText: null,
    goalSetAt: null,
    lastGoalCheckDate: null,
    goalChecks: [],
    lastWordSurface: null,
    oshiLoveCounts: Object.create(null),
    seenConversationIds: [],
    conversationChoiceRecords: [],
    memoryRelations: [],
    openQuestions: [],
    memoryEpisodes: [],
    memoryHypotheses: [],
  };
}

function memoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
}

function cleanText(value: string) {
  return value.normalize('NFKC').trim();
}

function quote(value: string) {
  return `「${value}」`;
}

/** 演出指示を表示文へ混ぜず、台詞だけを既存UIへ渡す。 */
function dialogueLines(beats: readonly DialogueBeat[]) {
  return beats.flatMap((beat) => beat.text ? [beat.text] : []);
}

const DIALOGUE_PAGE_CHARACTER_LIMIT = 92;
const DIALOGUE_PAGE_LINE_LIMIT = 4;

/** 細かい原稿beatを、3〜5行を目安にした表示ページへまとめる。 */
function dialoguePages(beats: readonly DialogueBeat[]): DialoguePage[] {
  const pages: DialoguePage[] = [];
  let current: DialoguePage = { lines: [] };
  let characterCount = 0;
  let pendingEmotion: DialoguePage['emotion'];
  let pendingAction: string | undefined;
  let pendingPauseBeforeMs = 0;

  const flush = () => {
    if (current.lines.length === 0) return;
    const lastLineIndex = current.lines.length - 1;
    const trailingPause = current.linePauseAfterMs?.[lastLineIndex] ?? 0;
    if (trailingPause > 0) {
      current.pauseAfterMs = Math.min(1200, (current.pauseAfterMs ?? 0) + trailingPause);
      if (current.linePauseAfterMs) current.linePauseAfterMs[lastLineIndex] = 0;
    }
    if (current.linePauseAfterMs?.every((duration) => !duration)) delete current.linePauseAfterMs;
    pages.push(current);
    current = { lines: [] };
    characterCount = 0;
  };

  for (const beat of beats) {
    if (!beat.text) {
      if (beat.emotion) pendingEmotion = beat.emotion;
      if (beat.action) pendingAction = beat.action;
      if (beat.pauseMs) {
        if (current.lines.length > 0) {
          const lineIndex = current.lines.length - 1;
          current.linePauseAfterMs ??= [];
          current.linePauseAfterMs[lineIndex] = Math.min(
            1200,
            (current.linePauseAfterMs[lineIndex] ?? 0) + beat.pauseMs,
          );
        } else {
          pendingPauseBeforeMs = Math.min(1200, pendingPauseBeforeMs + beat.pauseMs);
        }
      }
      continue;
    }

    const textLength = Array.from(beat.text).length;
    const emotion = beat.emotion ?? pendingEmotion;
    const action = beat.action ?? pendingAction;
    const emotionChanged = Boolean(
      current.emotion
      && emotion
      && current.emotion !== emotion
      && current.lines.length > 0,
    );
    if (
      current.lines.length >= DIALOGUE_PAGE_LINE_LIMIT
      || (current.lines.length > 0 && characterCount + textLength > DIALOGUE_PAGE_CHARACTER_LIMIT)
      || emotionChanged
    ) {
      flush();
    }

    current.lines.push(beat.text);
    characterCount += textLength;
    if (current.lines.length === 1 && pendingPauseBeforeMs > 0) {
      current.pauseBeforeMs = pendingPauseBeforeMs;
      pendingPauseBeforeMs = 0;
    }
    current.emotion ??= emotion;
    current.action ??= action;
    pendingEmotion = undefined;
    pendingAction = undefined;
  }
  flush();
  return pages;
}

function dialoguePagesFromLines(lines: readonly string[]) {
  return dialoguePages(lines.map((text) => ({ text })));
}

function sayForRuntime(...texts: string[]): DialogueBeat[] {
  return texts.map((text) => ({ text }));
}

function pathIsKnownChoice(choiceId: string) {
  return choiceId.includes('_KNOWN_');
}

function phaseLabel(day: number) {
  if (day >= 30) return 'おわかれ';
  if (day <= 7) return 'であい';
  if (day <= 18) return 'なかよし';
  if (day <= 26) return 'しんみつ';
  return 'のこりわずか';
}

function sentimentForChoice(id: string): Sentiment {
  if (id === 'WORD_LOVE') return 'LOVE';
  if (id === 'WORD_LIKE') return 'LIKE';
  if (id === 'WORD_DISLIKE' || id === 'WORD_HATE') return 'DISLIKE';
  if (id === 'WORD_INTERESTED') return 'INTERESTED';
  return 'NEUTRAL';
}

export class SuuhimochiConversation {
  private state: StoredState;
  private session: Session;
  private storage: StorageLike;
  private random: () => number;
  private now: () => Date;
  private farewellQueue: string[] = [];
  private activeDayConversation: ConversationScript | null = null;
  private activeCuriousWord: WordEntry | null = null;
  private activeCuriousRelatedWord: WordEntry | null = null;
  private activeCuriousRelationIds: string[] = [];
  private activeCuriousOpenQuestionIds: string[] = [];
  private sessionSequence = 0;
  private debug: DebugSnapshot;

  constructor(options: { storage?: StorageLike; random?: () => number; now?: () => Date } = {}) {
    this.storage = options.storage ?? (typeof localStorage === 'undefined' ? memoryStorage() : localStorage);
    this.random = options.random ?? Math.random;
    this.now = options.now ?? (() => new Date());
    this.state = this.load();
    this.session = this.blankSession();
    this.debug = this.blankDebug();
    this.ensureStartDate();
  }

  private blankSession(): Session {
    return {
      id: `session_${this.now().getTime()}_${++this.sessionSequence}`,
      stage: 'topic',
      phase: 'IDLE',
      startType: 'WORD',
      expected: 'NONE',
      inputMode: 'none',
      topic: null,
      category: 'UNKNOWN',
      choices: [],
      lastUserText: '',
      lastAssistantLines: [],
      attributes: {},
      pendingGoalStatus: null,
    };
  }

  private blankDebug(): DebugSnapshot {
    return {
      input: '',
      tokens: [],
      topic: '',
      topicScore: 0,
      topicKnown: true,
      state: 'IDLE',
      attributes: {},
      memoryHit: null,
      selectedTemplate: '',
      depth: 0,
      startType: 'WORD',
      output: [],
    };
  }

  private load(): StoredState {
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) return emptyState();
      const parsed = JSON.parse(raw) as Partial<StoredState>;
      const words = Object.fromEntries(
        Object.entries(parsed.words ?? {}).map(([surface, word]) => [
          surface,
          {
            ...word,
            oshiStatus: word.oshiStatus ?? 'UNKNOWN' as OshiStatus,
            knowledgeLevel: word.knowledgeLevel
              ?? (word.category && word.category !== 'UNKNOWN' ? 'KNOWN' : 'UNKNOWN'),
            subcategory: word.subcategory ?? word.attributes?.['subCategoryId'],
            firstSeenDay: word.firstSeenDay ?? 1,
            lastSeenDay: word.lastSeenDay ?? word.firstSeenDay ?? 1,
          },
        ]),
      ) as Record<string, WordEntry>;
      return {
        version: 9,
        words: Object.assign(Object.create(null), words),
        memories: parsed.memories ?? [],
        relations: parsed.relations ?? [],
        events: parsed.events ?? [],
        conversations: parsed.conversations ?? [],
        startDate: parsed.startDate ?? null,
        dayOverride: parsed.dayOverride ?? null,
        ended: parsed.ended ?? false,
        conversationCount: parsed.conversationCount ?? 0,
        goalText: parsed.goalText ?? null,
        goalSetAt: parsed.goalSetAt ?? null,
        lastGoalCheckDate: parsed.lastGoalCheckDate ?? null,
        goalChecks: parsed.goalChecks ?? [],
        lastWordSurface: parsed.lastWordSurface ?? null,
        oshiLoveCounts: Object.assign(Object.create(null), parsed.oshiLoveCounts ?? {}),
        seenConversationIds: Array.isArray(parsed.seenConversationIds) ? parsed.seenConversationIds.filter((id): id is string => typeof id === 'string') : [],
        conversationChoiceRecords: Array.isArray(parsed.conversationChoiceRecords)
          ? parsed.conversationChoiceRecords.filter((record): record is ConversationChoiceRecord => (
            Boolean(record)
            && typeof record.conversationId === 'string'
            && typeof record.choiceId === 'string'
            && typeof record.day === 'number'
            && typeof record.timestamp === 'string'
          ))
          : [],
        memoryRelations: Array.isArray(parsed.memoryRelations) ? parsed.memoryRelations : [],
        openQuestions: Array.isArray(parsed.openQuestions) ? parsed.openQuestions : [],
        memoryEpisodes: Array.isArray(parsed.memoryEpisodes) ? parsed.memoryEpisodes : [],
        memoryHypotheses: Array.isArray(parsed.memoryHypotheses) ? parsed.memoryHypotheses : [],
      };
    } catch {
      return emptyState();
    }
  }

  private save() {
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // 保存失敗で会話を止めない。
    }
  }

  private dateKey(date = this.now()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private ensureStartDate() {
    if (!this.state.startDate) {
      this.state.startDate = this.dateKey();
      this.save();
    }
  }

  private daysSince(dateKey: string) {
    const from = new Date(`${dateKey}T00:00:00`);
    const to = new Date(`${this.dateKey()}T00:00:00`);
    return Math.max(0, Math.round((to.getTime() - from.getTime()) / 86400000));
  }

  getCurrentDay() {
    this.ensureStartDate();
    const startDate = this.state.startDate ?? this.dateKey();
    const start = new Date(`${startDate}T00:00:00`);
    const today = new Date(`${this.dateKey()}T00:00:00`);
    const realDay = Math.round((today.getTime() - start.getTime()) / 86400000) + 1;
    return Math.min(30, Math.max(1, this.state.dayOverride ?? realDay));
  }

  getPhaseLabel() {
    return phaseLabel(this.getCurrentDay());
  }

  getGoal() {
    return this.state.goalText;
  }

  getGoalChecks() {
    return this.state.goalChecks.map((item) => ({ ...item }));
  }

  getSeenConversationIds() {
    return [...this.state.seenConversationIds];
  }

  getConversationChoiceRecords() {
    return this.state.conversationChoiceRecords.map((record) => ({ ...record }));
  }

  getMemoryRelations() {
    return this.state.memoryRelations.map((relation) => ({ ...relation }));
  }

  getOpenQuestions() {
    return this.state.openQuestions.map((question) => ({ ...question }));
  }

  getMemoryEpisodes() {
    return this.state.memoryEpisodes.map((episode) => ({
      ...episode,
      topicWordIds: [...episode.topicWordIds],
      learnedRelationIds: [...episode.learnedRelationIds],
      createdOpenQuestionIds: [...episode.createdOpenQuestionIds],
    }));
  }

  setGoal(goalText: string): ConversationResponse {
    return this.handleGoalText(goalText);
  }

  setGoalUndecided(): ConversationResponse {
    this.session.lastUserText = UNDECIDED_GOAL;
    this.log('USER', UNDECIDED_GOAL);
    this.state.goalText = UNDECIDED_GOAL;
    this.state.goalSetAt = this.dateKey();
    this.session.topic = '30日の目標';
    this.session.attributes['goal'] = UNDECIDED_GOAL;
    this.save();
    return this.finishConversation([
      'まだ決まっていないんだね。',
      '歩きながら、見たい景色を少しずつ探していこうね。',
    ]);
  }

  startSession(): ConversationResponse {
    this.rememberSession();
    this.clearActiveDayConversation();

    if (this.state.ended) {
      this.session = this.blankSession();
      this.session.stage = 'ended';
      return this.respond(['手紙を置いて、すうひもちは帰っていった。'], 'ended', 'none', 'ENDED');
    }

    if (this.getCurrentDay() >= 30) {
      this.session = this.blankSession();
      this.session.stage = 'farewell';
      this.session.phase = 'CLOSE';
      this.session.startType = 'FAREWELL';
      this.farewellQueue = this.buildFarewellLines();
      return this.respond([this.farewellQueue.shift() ?? 'きょうで30日目なの。'], 'farewell', 'none', 'FAREWELL');
    }

    this.session = this.blankSession();

    if (!this.state.goalText) {
      return this.openGoalSetup();
    }

    this.state.conversationCount += 1;
    this.save();

    if (this.shouldCheckGoal()) {
      return this.openGoalCheck();
    }

    return this.openNormalConversation();
  }

  startWordTeaching(): ConversationResponse {
    // 初回目標と30日目の進行は通常会話と同じルールを優先する。
    if (!this.state.goalText || this.state.ended || this.getCurrentDay() >= 30) {
      return this.startSession();
    }

    this.rememberSession();
    this.clearActiveDayConversation();
    this.session = this.blankSession();
    this.state.conversationCount += 1;
    this.save();
    return this.openNewWord();
  }

  submit(text: string): ConversationResponse {
    const surface = text.trim();
    const value = cleanText(text);
    if (!value) return this.respond(['何も書いてないの。'], this.session.stage, this.session.inputMode, 'EMPTY');

    if (this.session.inputMode === 'choice') {
      const choice = this.session.choices.find((item) => item.id === value || item.label === value);
      if (choice) return this.applyChoice(choice, true);
      return this.respond(['下の中から選んでほしいの。'], this.session.stage, 'choice', 'CHOICE_ONLY');
    }

    if (this.session.inputMode === 'category') {
      if (this.session.expected === 'SUBCATEGORY') {
        const selectedSubCategory = (SUBCATEGORY_CHOICES[this.session.category] ?? [])
          .find((item) => item.id === value || item.label === value);
        if (selectedSubCategory) {
          this.log('USER', selectedSubCategory.label);
          return this.applySubCategory(selectedSubCategory);
        }
        return this.respond(['もう少しくわしく、下から選んでほしいの。'], 'unknown', 'category', 'SUBCATEGORY_ONLY');
      }
      const selected = CATEGORY_CHOICES.find((item) => item.category === value || item.label === value);
      if (selected) {
        this.log('USER', selected.label);
        return this.applyCategory(selected.category);
      }
      return this.respond(['どの種類か、下から選んでほしいの。'], 'unknown', 'category', 'CATEGORY_ONLY');
    }

    // New words keep the player's spelling; the common-knowledge lookup does
    // its own NFKC / kana-normalised comparison without changing that surface.
    const userText = this.session.expected === 'NEW_WORD' || this.session.expected === 'DAY_CURIOUS_WORD'
      ? surface
      : value;
    this.session.lastUserText = userText;
    this.log('USER', userText);

    if (this.session.expected === 'GOAL_TEXT') return this.handleGoalText(value, false);
    if (this.session.expected === 'NEW_WORD') return this.handleNewWord(surface, false);
    if (this.session.expected === 'DAY_CURIOUS_WORD') return this.handleCuriousWord(surface);
    return this.respond(['今は下の選択肢から選んでほしいの。'], this.session.stage, this.session.inputMode, 'UNEXPECTED_TEXT');
  }

  choose(choiceId: string): ConversationResponse {
    const normalized = cleanText(choiceId);

    // まず画面に現在出している選択肢から探す。
    let choice = this.session.choices.find((item) => item.id === normalized || item.label === normalized);

    // 旧バージョンで保存された会話やテストからの入力は、
    // 現在は表示しない旧「気になる」を内部だけ受け付ける。
    if (!choice && normalized === 'WORD_INTERESTED') {
      choice = { id: 'WORD_INTERESTED', label: '気になる' };
    }

    // UIのstate更新と会話sessionが一瞬ずれた場合でも、
    // expected が分かっていれば正しい選択肢セットから復元する。
    if (!choice) {
      const expectedChoices = this.choicesForExpected(this.session.expected);
      choice = expectedChoices.find((item) => item.id === normalized || item.label === normalized);
      if (choice) {
        this.session.inputMode = 'choice';
        this.session.choices = [...expectedChoices];
      }
    }

    if (!choice) {
      // 会話を途切れさせず、現在の選択肢をそのまま再提示する。
      const currentChoices = this.choicesForExpected(this.session.expected);
      if (currentChoices.length) {
        this.session.inputMode = 'choice';
        this.session.choices = [...currentChoices];
        return this.respond(
          ['うまく受け取れなかったの。もう一回、下から選んでほしいの。'],
          this.session.stage,
          'choice',
          'CHOICE_RETRY',
        );
      }
      return this.finishConversation(['うん。いったんここまでにしておくの。']);
    }

    return this.applyChoice(choice, true);
  }

  private choicesForExpected(expected: ExpectedAnswer): ConversationChoice[] {
    switch (expected) {
      case 'DAY_CONVERSATION_CHOICE':
        return this.activeDayConversation?.category === 'SELF'
          ? this.activeDayConversation.choices.map(({ id, label }) => ({ id, label }))
          : [];
      case 'DAY_CURIOUS_KNOWN_CHOICE':
        return this.activeDayConversation?.category === 'CURIOUS'
          ? this.activeDayConversation.known.choices.map(({ id, label }) => ({ id, label }))
          : [];
      case 'DAY_CURIOUS_UNKNOWN_CHOICE':
        return this.activeDayConversation?.category === 'CURIOUS'
          ? this.activeDayConversation.unknown.choices.map(({ id, label }) => ({ id, label }))
          : [];
      case 'WORD_FEELING':
        return WORD_FEELING_CHOICES;
      case 'OSHI_CONFIRM':
        return OSHI_CONFIRM_CHOICES;
      case 'GOAL_STATUS':
        return GOAL_STATUS_CHOICES;
      case 'GOAL_ACTION':
        return GOAL_ACTION_CHOICES;
      default:
        return [];
    }
  }

  chooseCategory(category: WordCategory): ConversationResponse {
    // Accept the previous MEDIA value from an older local session, even though
    // the picker now exposes the expanded category set.
    const selected = CATEGORY_CHOICES.find((item) => item.category === category)
      ?? (category === 'MEDIA' ? { category: 'MEDIA' as WordCategory, label: '本・映画・ゲームなど' } : undefined);
    if (!selected) return this.respond(['その種類は、いまは選べないの。'], 'unknown', 'category', 'INVALID_CATEGORY');
    this.log('USER', selected.label);
    return this.applyCategory(category);
  }

  chooseSubCategory(id: string): ConversationResponse {
    const selected = (SUBCATEGORY_CHOICES[this.session.category] ?? [])
      .find((item) => item.id === id || item.label === id);
    if (!selected) return this.respond(['もう少しくわしく、下から選んでほしいの。'], 'unknown', 'category', 'INVALID_SUBCATEGORY');
    this.log('USER', selected.label);
    return this.applySubCategory(selected);
  }

  skipUnknown() {
    return this.finishConversation(['分からないままでも大丈夫なの。']);
  }

  finishEarly() {
    return this.finishConversation();
  }

  continueFarewell(): ConversationResponse {
    const next = this.farewellQueue.shift();
    if (next) return this.respond([next], 'farewell', 'none', 'FAREWELL');

    this.state.ended = true;
    this.save();
    this.session.stage = 'ended';
    return this.respond(['30日間、ありがとうなの。またね、人間さん。'], 'ended', 'none', 'FAREWELL_END');
  }

  advanceDay() {
    this.state.dayOverride = Math.min(30, this.getCurrentDay() + 1);
    this.save();
    return this.startSession();
  }

  jumpFarewell() {
    this.state.dayOverride = 30;
    this.save();
    return this.startSession();
  }

  clearOverride() {
    this.state.dayOverride = null;
    this.save();
    return this.startSession();
  }

  reopenToday() {
    return this.startSession();
  }

  reset() {
    this.storage.removeItem(STORAGE_KEY);
    this.state = emptyState();
    this.session = this.blankSession();
    this.debug = this.blankDebug();
    this.farewellQueue = [];
    this.clearActiveDayConversation();
    this.ensureStartDate();
  }

  /**
   * Starts a genuinely new 30-day companion cycle. The completed child's
   * memories are archived by GameSave before this is called, so the new child
   * receives the footprint but not a copy of the former conversation state.
   */
  beginNextCycle(goalText: string) {
    const goal = cleanText(goalText).slice(0, MAX_GOAL_LENGTH);
    this.state = emptyState();
    this.session = this.blankSession();
    this.debug = this.blankDebug();
    this.farewellQueue = [];
    this.clearActiveDayConversation();
    this.state.startDate = this.dateKey();
    this.state.goalText = goal || UNDECIDED_GOAL;
    this.state.goalSetAt = this.dateKey();
    this.save();
  }

  getLearnedWords(): LearnedWord[] {
    return Object.values(this.state.words)
      .filter((entry) => !INTERNAL_TOPICS.has(entry.surface) && !SYSTEM_WORDS.has(entry.surface))
      .sort((a, b) => b.lastSeen.localeCompare(a.lastSeen))
      .map((entry) => {
        const learned: LearnedWord = {
          word: entry.surface,
          category: entry.category,
          source: 'user_explained',
          learnedAt: entry.firstSeen,
        };
        const note = entry.attributes['feeling'] ?? entry.attributes['promptedLastMemoryLabel'];
        if (note) learned.note = note;
        return learned;
      });
  }

  getWordEntries() {
    return Object.values(this.state.words).map((word) => ({ ...word, attributes: { ...word.attributes } }));
  }

  /**
   * Remove one user-taught word from the active word memory.
   * Conversation logs are intentionally kept as history; only future recall,
   * dictionary display, and learned-word selection stop using this entry.
   */
  forgetWord(surface: string) {
    const normalized = cleanText(surface).toLowerCase();
    const storedKey = Object.keys(this.state.words).find((key) => cleanText(key).toLowerCase() === normalized);
    if (!normalized || !storedKey) return false;
    const wordId = this.state.words[storedKey]?.id;
    delete this.state.words[storedKey];
    if (this.state.lastWordSurface === storedKey) this.state.lastWordSurface = null;
    this.state.relations = this.state.relations.filter((relation) => cleanText(relation.object).toLowerCase() !== normalized);
    if (wordId) {
      this.state.memoryRelations = this.state.memoryRelations.filter((relation) => relation.subjectId !== wordId && relation.objectId !== wordId);
      this.state.openQuestions = this.state.openQuestions.filter((question) => question.wordId !== wordId);
    }
    this.save();
    return true;
  }

  getMemories() {
    return [...this.state.memories];
  }

  getRelations() {
    return [...this.state.relations];
  }

  getEvents() {
    return [...this.state.events];
  }

  getConversationLogs() {
    return [...this.state.conversations];
  }

  getDebugSnapshot() {
    return {
      ...this.debug,
      tokens: [...this.debug.tokens],
      attributes: { ...this.debug.attributes },
      output: [...this.debug.output],
    };
  }

  isEnded() {
    return this.state.ended;
  }

  getLetter() {
    if (!this.state.ended) return null;
    const goal = this.state.goalText && this.state.goalText !== UNDECIDED_GOAL ? `人間さんの目標は${quote(this.state.goalText)}だったね。\n` : '';
    const checks = this.state.goalChecks.length ? `途中で${this.state.goalChecks.length}回、いっしょに進み具合を見たの。\n` : '';
    return `人間さんへ\n\n30日間、いっしょにいてくれてありがとうなの。\n${goal}${checks}新しいコトバを${this.getLearnedWords().length}個覚えたの。\n\nまた会える日まで、元気でいてね。\n\nすうひもちより`;
  }

  private openGoalSetup(): ConversationResponse {
    this.session.stage = 'goal';
    this.session.phase = 'GOAL';
    this.session.startType = 'GOAL';
    this.session.expected = 'GOAL_TEXT';
    this.session.inputMode = 'text';
    this.session.topic = '30日の目標';
    return this.respond([
      '人間さん、30日後に見たい景色をひとつ教えてほしいの。',
      'ここだけは、人間さんの言葉で書いてほしいの。',
    ], 'goal', 'text', 'GOAL_SETUP');
  }

  private handleGoalText(text: string, logUser = true): ConversationResponse {
    const value = cleanText(text);
    if (logUser) {
      this.session.lastUserText = value;
      this.log('USER', value);
    }

    if (!value) return this.respond(['目標をひとつ書いてほしいの。'], 'goal', 'text', 'GOAL_EMPTY');
    if (value.length > MAX_GOAL_LENGTH) {
      return this.respond([`目標は${MAX_GOAL_LENGTH}文字くらいまでで、ひとつにしてほしいの。`], 'goal', 'text', 'GOAL_TOO_LONG');
    }

    this.state.goalText = value;
    this.state.goalSetAt = this.dateKey();
    this.session.topic = '30日の目標';
    this.session.attributes['goal'] = value;
    this.save();

    return this.finishConversation([
      `${quote(value)}だね。覚えたの。`,
      '30日間、ときどき一緒に進み具合を見ようね。',
    ]);
  }

  private shouldCheckGoal() {
    if (!this.state.goalText || this.state.goalText === UNDECIDED_GOAL) return false;
    if (this.state.conversationCount > 0 && this.state.conversationCount % GOAL_CHECK_INTERVAL === 0) return true;

    if (!this.state.lastGoalCheckDate) {
      return this.getCurrentDay() >= GOAL_CHECK_MAX_DAYS;
    }

    return this.daysSince(this.state.lastGoalCheckDate) >= GOAL_CHECK_MAX_DAYS;
  }

  private openGoalCheck(): ConversationResponse {
    const goal = this.state.goalText;
    if (!goal) return this.openNormalConversation();

    this.state.lastGoalCheckDate = this.dateKey();
    this.save();

    this.session.stage = 'followup';
    this.session.phase = 'CYBERNETICS';
    this.session.startType = 'CYBERNETICS';
    this.session.expected = 'GOAL_STATUS';
    this.session.inputMode = 'choice';
    this.session.topic = '30日の目標';
    this.session.choices = [...GOAL_STATUS_CHOICES];

    return this.respond([
      `人間さんの30日の目標は、${quote(goal)}だったよね。`,
      '順調かな？',
    ], 'followup', 'choice', 'GOAL_CHECK');
  }

  private openNormalConversation(): ConversationResponse {
    const turn = runConversationEngine({
      intent: 'CHAT',
      day: this.getCurrentDay(),
      seenConversationIds: this.state.seenConversationIds,
      random: this.random,
    });

    if (!turn.conversation) {
      this.session.stage = 'complete';
      this.session.phase = 'CHAT';
      this.session.startType = 'CHAT';
      this.session.expected = 'NONE';
      this.session.inputMode = 'none';
      this.session.topic = null;
      this.session.choices = [];
      return this.respond(['新しい会話システムは準備中なの。'], 'complete', 'none', `NEW_${turn.intent}`);
    }

    this.activeDayConversation = turn.conversation;
    if (!this.state.seenConversationIds.includes(turn.conversation.id)) {
      this.state.seenConversationIds.push(turn.conversation.id);
    }
    this.save();

    this.session.stage = 'followup';
    this.session.phase = 'CHAT';
    this.session.startType = 'CHAT';
    this.session.topic = turn.conversation.title;
    this.session.attributes['dayConversationId'] = turn.conversation.id;
    if (turn.conversation.category === 'CURIOUS') {
      this.session.expected = 'DAY_CURIOUS_WORD';
      this.session.inputMode = 'text';
      this.session.choices = [];
    } else {
      this.session.expected = 'DAY_CONVERSATION_CHOICE';
      this.session.inputMode = 'choice';
      this.session.choices = turn.conversation.choices.map(({ id, label }) => ({ id, label }));
    }
    return this.respond(
      dialogueLines(turn.conversation.opening),
      'followup',
      turn.conversation.category === 'CURIOUS' ? 'text' : 'choice',
      turn.conversation.id,
      dialoguePages(turn.conversation.opening),
    );
  }

  private openNewWord(): ConversationResponse {
    this.session.stage = 'topic';
    this.session.phase = 'LEARN';
    this.session.startType = 'WORD';
    this.session.expected = 'NEW_WORD';
    this.session.inputMode = 'text';
    this.session.topic = null;

    return this.respond(['人間さん、新しいコトバをひとつ教えてほしいの。'], 'topic', 'text', 'NEW_WORD');
  }

  private shouldAskOshi(word: WordEntry) {
    const subCategoryId = word.attributes['subCategoryId'];
    if (!subCategoryId || !OSHI_TARGET_SUBCATEGORIES.has(subCategoryId)) return false;
    if (word.oshiStatus === 'YES' || word.oshiStatus === 'NO') return false;

    const counterKey = OSHI_EVERY_TWO_SUBCATEGORIES.has(subCategoryId)
      ? 'GAME_MEDIA_PRIMARY'
      : subCategoryId;
    const nextCount = (this.state.oshiLoveCounts[counterKey] ?? 0) + 1;
    this.state.oshiLoveCounts[counterKey] = nextCount;
    this.save();

    // キャラクターと作品・シリーズは毎回、漫画・アニメ・ゲームは2回に1回、
    // 作中のもの・用語は3回に1回だけ確認する。
    const interval = subCategoryId === 'GAME_MEDIA_4' || subCategoryId === 'GAME_MEDIA_5'
      ? 1
      : subCategoryId === 'GAME_MEDIA_6'
        ? 3
        : 2;
    return nextCount % interval === 0;
  }

  private handleNewWord(text: string, logUser = true): ConversationResponse {
    const surface = text.trim();
    const value = cleanText(surface);
    if (logUser) {
      this.session.lastUserText = surface;
      this.log('USER', surface);
    }

    if (!value) return this.respond(['コトバをひとつ教えてほしいの。'], 'topic', 'text', 'WORD_EMPTY');
    if (value.length > MAX_WORD_LENGTH || /[。！？!?\n\r]/.test(value)) {
      return this.respond(['文章じゃなくて、コトバをひとつだけ教えてほしいの。'], 'topic', 'text', 'WORD_ONLY');
    }

    const commonKnowledge = findCommonKnowledge(value);
    if (commonKnowledge) {
      this.session.category = commonKnowledge.category;
      this.session.attributes['commonKnowledge'] = 'true';
      this.session.attributes['commonCategory'] = commonKnowledge.category;
      // Common words are not added to the player's taught-word memory. They
      // remain a built-in baseline, while the original spelling stays in logs.
      return this.finishConversation([`${quote(surface)}は知ってるの。`]);
    }

    if (SYSTEM_WORDS.has(value)) {
      return this.finishConversation([`${quote(surface)}は知ってるの。えへへ。`]);
    }

    const word = this.ensureWord(surface, 'UNKNOWN');
    this.session.topic = word.surface;
    this.session.category = 'UNKNOWN';
    this.session.stage = 'unknown';
    this.session.phase = 'LEARN';
    this.session.expected = 'CATEGORY';
    this.session.inputMode = 'category';
    this.recordEvent('LEARN', word.surface, value, 'NEUTRAL');

    return this.respond([
      `${quote(surface)}、覚えたの。`,
      'それって、どんなコトバ？',
    ], 'unknown', 'category', 'WORD_CATEGORY');
  }

  private applyCategory(category: WordCategory): ConversationResponse {
    const topic = this.session.topic;
    if (!topic) return this.respond(['先にコトバを教えてほしいの。'], 'topic', 'text', 'NO_WORD');

    const word = this.ensureWord(topic, category);
    word.category = category;
    if (word.knowledgeLevel === 'UNKNOWN') word.knowledgeLevel = 'PARTIAL';
    word.attributes['categoryLabel'] = CATEGORY_LABELS[category] ?? 'その他';
    this.save();

    this.session.category = category;
    this.session.phase = 'LEARN';

    // Ask for a more specific type for the expanded new-word categories.
    // Legacy MEDIA entries keep the original one-step behavior.
    const subCategories = category === 'MEDIA' ? [] : (SUBCATEGORY_CHOICES[category] ?? []);
    if (subCategories.length > 0) {
      this.session.stage = 'unknown';
      this.session.expected = 'SUBCATEGORY';
      this.session.inputMode = 'category';
      this.session.choices = [];
      return this.respond([
        `${quote(topic)}は${CATEGORY_LABELS[category] ?? 'そういうもの'}なんだね。`,
        'もう少しくわしく教えてほしいの。',
      ], 'unknown', 'category', 'WORD_SUBCATEGORY');
    }

    this.session.stage = 'followup';
    this.session.expected = 'WORD_FEELING';
    this.session.inputMode = 'choice';
    this.session.choices = [...WORD_FEELING_CHOICES];

    return this.respond([
      `${quote(topic)}は${CATEGORY_LABELS[category] ?? 'そういうもの'}なんだね。覚えたの。`,
      `人間さんは${quote(topic)}のこと、どんな感じ？`,
    ], 'followup', 'choice', 'WORD_FEELING');
  }

  private applySubCategory(selected: SubCategoryChoice): ConversationResponse {
    const topic = this.session.topic;
    if (!topic) return this.respond(['先にコトバを教えてほしいの。'], 'topic', 'text', 'NO_WORD');

    const word = this.ensureWord(topic, this.session.category);
    word.attributes['subCategoryId'] = selected.id;
    word.attributes['subCategoryLabel'] = selected.label;
    word.subcategory = selected.id;
    if (word.knowledgeLevel === 'UNKNOWN') word.knowledgeLevel = 'PARTIAL';
    this.save();

    this.session.stage = 'followup';
    this.session.phase = 'LEARN';
    this.session.expected = 'WORD_FEELING';
    this.session.inputMode = 'choice';
    this.session.choices = [...WORD_FEELING_CHOICES];

    const dialogue = MIDDLE_CATEGORY_DIALOGUE[selected.id]?.(topic) ?? [
      `${topic}って、${selected.label}なんだね。`,
      `${selected.label}のこと、もう少し知りたいの。`,
      `${topic}のこと、好き？`,
      `${topic}は……`,
    ];
    // 中カテゴリーの説明3行から1行だけを選び、
    // そのあとに共通の気持ち確認を表示する。
    const explanationLines = dialogue.slice(0, -1);
    const explanation = explanationLines.length
      ? explanationLines[Math.min(explanationLines.length - 1, Math.floor(this.random() * explanationLines.length))]
      : `${topic}って、${selected.label}なんだね。`;
    const prompt = WORD_FEELING_PROMPTS[
      Math.min(WORD_FEELING_PROMPTS.length - 1, Math.floor(this.random() * WORD_FEELING_PROMPTS.length))
    ]?.(topic) ?? `人間さんは、${topic}のことどう思う？`;
    return this.respond([explanation, prompt], 'followup', 'choice', 'WORD_FEELING');
  }

  private applyChoice(choice: ConversationChoice, logUser: boolean): ConversationResponse {
    if (logUser) {
      this.session.lastUserText = choice.label;
      this.log('USER', choice.label);
    }

    switch (this.session.expected) {
      case 'DAY_CONVERSATION_CHOICE':
        return this.handleDayConversationChoice(choice);
      case 'DAY_CURIOUS_KNOWN_CHOICE':
        return this.handleCuriousChoice(choice, 'known');
      case 'DAY_CURIOUS_UNKNOWN_CHOICE':
        return this.handleCuriousChoice(choice, 'unknown');
      case 'WORD_FEELING':
        return this.handleWordFeelingChoice(choice);
      case 'OSHI_CONFIRM':
        return this.handleOshiChoice(choice);
      case 'GOAL_STATUS':
        return this.handleGoalStatusChoice(choice);
      case 'GOAL_ACTION':
        return this.handleGoalActionChoice(choice);
      default:
        return this.finishConversation(['うん、覚えておくの。']);
    }
  }

  private handleCuriousWord(text: string): ConversationResponse {
    const conversation = this.activeDayConversation?.category === 'CURIOUS'
      ? this.activeDayConversation
      : null;
    const surface = text.trim();
    const value = cleanText(surface);
    if (!conversation) return this.finishConversation();
    if (!value) return this.respond(['一個だけ教えてほしいの。'], 'followup', 'text', 'CURIOUS_WORD_EMPTY');
    if (value.length > MAX_WORD_LENGTH || /[。！？!?\n\r]/.test(value)) {
      return this.respond(['長いお話じゃなくて、今は名前を一個だけ教えてほしいの。'], 'followup', 'text', 'CURIOUS_WORD_ONLY');
    }

    const existing = this.findWordBySurface(surface);
    const common = findCommonKnowledge(value);
    const known = Boolean(
      common
      || SYSTEM_WORDS.has(value)
      || existing?.knowledgeLevel === 'KNOWN',
    );
    const category = common?.category
      ?? (existing?.category !== 'UNKNOWN' ? existing?.category : undefined)
      ?? conversation.context.category
      ?? 'UNKNOWN';
    const word = this.ensureWord(
      surface,
      category,
      known ? 'KNOWN' : (category === 'UNKNOWN' ? 'UNKNOWN' : 'PARTIAL'),
    );
    word.lastUsedInConversationDay = this.getCurrentDay();
    this.session.topic = word.surface;
    this.session.category = word.category;
    this.activeCuriousWord = word;
    this.activeCuriousRelationIds = [];
    this.activeCuriousOpenQuestionIds = [];

    if (category !== 'UNKNOWN') {
      this.activeCuriousRelationIds.push(this.rememberMeaningRelation(
        word.id,
        'IS_A',
        `concept:${category.toLowerCase()}`,
        'CONTEXT_INFERRED',
      ));
    }
    for (const relationType of conversation.context.humanRelations) {
      this.activeCuriousRelationIds.push(this.rememberMeaningRelation(
        'human',
        relationType,
        word.id,
        'USER_EXPLICIT',
      ));
    }

    this.activeCuriousRelatedWord = conversation.id === 'DAY01_CURIOUS_05'
      ? this.findRelatedWordCandidate(word)
      : null;
    this.save();

    if (known && conversation.id === 'DAY01_CURIOUS_05' && !this.activeCuriousRelatedWord) {
      this.session.expected = 'DAY_CURIOUS_UNKNOWN_CHOICE';
      this.session.inputMode = 'choice';
      this.session.choices = conversation.unknown.choices.map(({ id, label }) => ({ id, label }));
      return this.respond(
        this.fillCuriousLines(sayForRuntime(
          '{word}。', 'そこは知ってるの。', '人間さん、そこによくいるんだ。',
          'そこで、人間さんは何をすることが多い？',
        )),
        'followup',
        'choice',
        `${conversation.id}_KNOWN_PURPOSE`,
      );
    }

    const path = known ? conversation.known : conversation.unknown;
    this.session.expected = known ? 'DAY_CURIOUS_KNOWN_CHOICE' : 'DAY_CURIOUS_UNKNOWN_CHOICE';
    this.session.inputMode = 'choice';
    this.session.choices = path.choices.map(({ id, label }) => ({ id, label }));
    const responseBeats = this.fillCuriousBeats(path.response);
    return this.respond(
      dialogueLines(responseBeats),
      'followup',
      'choice',
      `${conversation.id}_${known ? 'KNOWN' : 'UNKNOWN'}`,
      dialoguePages(responseBeats),
    );
  }

  private handleCuriousChoice(choice: ConversationChoice, path: 'known' | 'unknown'): ConversationResponse {
    const conversation = this.activeDayConversation?.category === 'CURIOUS'
      ? this.activeDayConversation
      : null;
    const word = this.activeCuriousWord;
    const branch = conversation?.[path].choices.find((item) => item.id === choice.id);
    if (!conversation || !word || !branch) return this.finishConversation();

    this.state.conversationChoiceRecords.push({
      conversationId: conversation.id,
      choiceId: branch.id,
      choiceLabel: branch.label,
      day: this.getCurrentDay(),
      timestamp: this.now().toISOString(),
    });
    this.applyCuriousMemoryEffect(conversation, word, branch);
    this.state.memoryEpisodes.push({
      id: `episode_${this.session.id}_${this.state.memoryEpisodes.length + 1}`,
      day: this.getCurrentDay(),
      conversationId: conversation.id,
      topicWordIds: [word.id],
      learnedRelationIds: [...new Set(this.activeCuriousRelationIds)],
      createdOpenQuestionIds: [...new Set(this.activeCuriousOpenQuestionIds)],
      timestamp: this.now().toISOString(),
    });
    this.save();

    const responseBeats = this.fillCuriousBeats(branch.response);
    const response = dialogueLines(responseBeats);
    this.session.topic = null;
    this.clearActiveDayConversation();
    return this.finishConversation(response, dialoguePages(responseBeats));
  }

  private applyCuriousMemoryEffect(
    conversation: CuriousConversation,
    word: WordEntry,
    branch: CuriousConversationChoice,
  ) {
    const effect = branch.memory;
    if (effect.category && word.category === 'UNKNOWN') {
      word.category = effect.category;
    }
    if (effect.subcategory) {
      word.subcategory = effect.subcategory;
      word.attributes['semanticSubcategory'] = effect.subcategory;
      this.resolveOpenQuestions(word.id, 'SUBCATEGORY');
    }
    if (effect.category) this.resolveOpenQuestions(word.id, 'CATEGORY');
    if (effect.knowledgeLevel && word.knowledgeLevel !== 'KNOWN') word.knowledgeLevel = effect.knowledgeLevel;
    word.lastSeenDay = this.getCurrentDay();
    word.lastSeen = this.now().toISOString();

    if (effect.relationQualifier) {
      for (const relationType of conversation.context.humanRelations) {
        const id = this.rememberMeaningRelation(
          'human', relationType, word.id, 'USER_EXPLICIT',
          effect.relationQualifier,
        );
        this.activeCuriousRelationIds.push(id);
      }
    }
    for (const relationType of effect.humanRelations ?? []) {
      this.activeCuriousRelationIds.push(this.rememberMeaningRelation(
        'human', relationType, word.id, 'USER_EXPLICIT', effect.relationQualifier,
      ));
    }

    if (conversation.id === 'DAY01_CURIOUS_05' && pathIsKnownChoice(branch.id) && this.activeCuriousRelatedWord) {
      const status = effect.relationStatus ?? 'ACTIVE';
      this.activeCuriousRelationIds.push(this.rememberMeaningRelation(
        word.id,
        'RELATED_TO',
        this.activeCuriousRelatedWord.id,
        status === 'REJECTED' ? 'USER_CORRECTION' : 'USER_EXPLICIT',
        effect.relationQualifier,
        status,
      ));
    } else if (effect.relatedConcept) {
      const type: MemoryRelationType = conversation.id === 'DAY01_CURIOUS_05' ? 'RELATED_TO' : 'IS_A';
      this.activeCuriousRelationIds.push(this.rememberMeaningRelation(
        word.id,
        type,
        `concept:${effect.relatedConcept}`,
        'USER_EXPLICIT',
        effect.relatedConceptLabel,
        effect.relationStatus ?? 'ACTIVE',
      ));
    }

    for (const question of effect.openQuestions ?? []) {
      this.activeCuriousOpenQuestionIds.push(this.rememberOpenQuestion(
        word.id,
        question.field,
        question.questionHint,
      ));
    }
  }

  private findWordBySurface(surface: string) {
    const normalized = cleanText(surface).toLocaleLowerCase('ja');
    return Object.values(this.state.words).find(
      (word) => cleanText(word.surface).toLocaleLowerCase('ja') === normalized,
    );
  }

  private findRelatedWordCandidate(current: WordEntry) {
    return Object.values(this.state.words)
      .filter((word) => (
        word.id !== current.id
        && !INTERNAL_TOPICS.has(word.surface)
        && !this.state.memoryRelations.some((relation) => (
          relation.subjectId === current.id
          && relation.type === 'RELATED_TO'
          && relation.objectId === word.id
        ))
      ))
      .sort((a, b) => b.lastSeenDay - a.lastSeenDay || b.lastSeen.localeCompare(a.lastSeen))[0] ?? null;
  }

  private fillCuriousLines(beats: readonly DialogueBeat[]) {
    return dialogueLines(this.fillCuriousBeats(beats));
  }

  private fillCuriousBeats(beats: readonly DialogueBeat[]) {
    const word = this.activeCuriousWord?.surface ?? '';
    const relatedWord = this.activeCuriousRelatedWord?.surface ?? '';
    return beats.map((beat) => ({
      ...beat,
      text: beat.text
        ?.replaceAll('{word}', word)
        .replaceAll('{relatedWord}', relatedWord),
    }));
  }

  private rememberMeaningRelation(
    subjectId: string,
    type: MemoryRelationType,
    objectId: string,
    source: MemoryRelation['source'],
    qualifier?: string,
    status: MemoryRelation['status'] = 'ACTIVE',
  ) {
    const existing = this.state.memoryRelations.find((relation) => (
      relation.subjectId === subjectId
      && relation.type === type
      && relation.objectId === objectId
    ));
    if (existing) {
      existing.source = source;
      existing.status = status;
      existing.qualifier = qualifier ?? existing.qualifier;
      existing.lastSeenDay = this.getCurrentDay();
      existing.mentionCount += 1;
      return existing.id;
    }
    const relation: MemoryRelation = {
      id: `meaning_relation_${this.state.memoryRelations.length + 1}_${this.now().getTime()}`,
      subjectId,
      type,
      objectId,
      source,
      status,
      firstSeenDay: this.getCurrentDay(),
      lastSeenDay: this.getCurrentDay(),
      mentionCount: 1,
    };
    if (qualifier) relation.qualifier = qualifier;
    this.state.memoryRelations.push(relation);
    return relation.id;
  }

  private rememberOpenQuestion(wordId: string, field: OpenQuestionField, questionHint: string) {
    const existing = this.state.openQuestions.find((question) => (
      question.wordId === wordId
      && question.field === field
      && question.questionHint === questionHint
      && question.status === 'OPEN'
    ));
    if (existing) return existing.id;
    const question: OpenQuestion = {
      id: `open_question_${this.state.openQuestions.length + 1}_${this.now().getTime()}`,
      wordId,
      field,
      questionHint,
      createdDay: this.getCurrentDay(),
      status: 'OPEN',
    };
    this.state.openQuestions.push(question);
    return question.id;
  }

  private resolveOpenQuestions(wordId: string, field: OpenQuestionField) {
    for (const question of this.state.openQuestions) {
      if (question.wordId === wordId && question.field === field && question.status === 'OPEN') {
        question.status = 'RESOLVED';
      }
    }
  }

  private clearActiveDayConversation() {
    this.activeDayConversation = null;
    this.activeCuriousWord = null;
    this.activeCuriousRelatedWord = null;
    this.activeCuriousRelationIds = [];
    this.activeCuriousOpenQuestionIds = [];
  }

  private handleDayConversationChoice(choice: ConversationChoice): ConversationResponse {
    const conversation = this.activeDayConversation?.category === 'SELF' ? this.activeDayConversation : null;
    const branch = conversation?.choices.find((item) => item.id === choice.id);
    if (!conversation || !branch) {
      this.session.expected = 'NONE';
      this.session.inputMode = 'none';
      this.session.choices = [];
      return this.finishConversation();
    }

    this.state.conversationChoiceRecords.push({
      conversationId: conversation.id,
      choiceId: branch.id,
      choiceLabel: branch.label,
      day: this.getCurrentDay(),
      timestamp: this.now().toISOString(),
    });
    this.save();

    this.session.expected = 'NONE';
    this.session.inputMode = 'none';
    this.session.choices = [];
    // この選択は人間さんの単語記憶ではないため、旧 memories には混ぜない。
    this.session.topic = null;
    this.clearActiveDayConversation();
    return this.finishConversation(dialogueLines(branch.response), dialoguePages(branch.response));
  }

  private handleWordFeelingChoice(choice: ConversationChoice): ConversationResponse {
    const topic = this.session.topic;
    const sentiment = sentimentForChoice(choice.id);
    let word: WordEntry | undefined;
    if (topic) {
      word = this.state.words[topic];
      if (word) {
        word.userSentiment = sentiment;
        word.knowledgeLevel = 'KNOWN';
        word.attributes['feeling'] = choice.label;
        word.lastSeen = this.now().toISOString();
        this.recordEvent('RECALL', topic, choice.label, sentiment);
      }
    }

    if (choice.id === 'WORD_LOVE') {
      if (word && this.shouldAskOshi(word)) {
        this.session.expected = 'OSHI_CONFIRM';
        this.session.inputMode = 'choice';
        this.session.choices = [...OSHI_CONFIRM_CHOICES];
        const prompt = OSHI_PROMPTS[Math.min(OSHI_PROMPTS.length - 1, Math.floor(this.random() * OSHI_PROMPTS.length))];
        return this.respond([prompt?.(topic ?? 'そのコトバ') ?? '大好きなんだね。もしかして、推しなの？'], 'followup', 'choice', 'OSHI_CONFIRM');
      }
      return this.finishConversation([`大好きなんだね。${topic ? quote(topic) : 'そのコトバ'}、覚えておくの。`]);
    }
    if (choice.id === 'WORD_LIKE') return this.finishConversation([`好きなんだね。${topic ? quote(topic) : 'そのコトバ'}、覚えておくの。`]);
    if (choice.id === 'WORD_DISLIKE') return this.finishConversation(['苦手なコトバなんだね。無理しなくていいの。']);
    if (choice.id === 'WORD_HATE') return this.finishConversation(['嫌いなコトバなんだね。そういう気持ちも覚えておくの。']);
    if (choice.id === 'WORD_INTERESTED') return this.finishConversation(['気になるコトバなんだね。覚えておくの。']);
    return this.finishConversation(['ふつうなんだね。そういうのも覚えておくの。']);
  }

  private handleOshiChoice(choice: ConversationChoice): ConversationResponse {
    const topic = this.session.topic;
    const word = topic ? this.state.words[topic] : undefined;
    if (!word || !topic) return this.finishConversation(['うん、覚えておくの。']);

    const isOshi = choice.id === 'OSHI_YES';
    const status: OshiStatus = isOshi ? 'YES' : 'NO';
    word.oshiStatus = status;
    word.oshiConfirmedAt = this.now().getTime();
    word.lastSeen = this.now().toISOString();
    this.save();

    if (isOshi) {
      const reaction = OSHI_YES_REACTIONS[Math.min(OSHI_YES_REACTIONS.length - 1, Math.floor(this.random() * OSHI_YES_REACTIONS.length))];
      return this.finishConversation([reaction?.(topic) ?? `推しなんだ！ ${topic}、ちゃんと覚えておくの。`]);
    }
    const reaction = OSHI_NO_REACTIONS[Math.min(OSHI_NO_REACTIONS.length - 1, Math.floor(this.random() * OSHI_NO_REACTIONS.length))];
    return this.finishConversation([reaction?.(topic) ?? 'そっか。大好きだけど、推しとはちょっと違うんだね。']);
  }

  private handleGoalStatusChoice(choice: ConversationChoice): ConversationResponse {
    const status: GoalStatus = choice.id === 'GOAL_ON_TRACK'
      ? 'ON_TRACK'
      : choice.id === 'GOAL_BEHIND'
        ? 'BEHIND'
        : 'HARD';

    const check: GoalCheck = {
      day: this.getCurrentDay(),
      date: this.dateKey(),
      status,
    };
    this.state.goalChecks.push(check);
    this.session.pendingGoalStatus = status;
    this.recordEvent('GOAL_CHECK', '30日の目標', choice.label, status === 'ON_TRACK' ? 'POSITIVE' : 'NEGATIVE');
    this.save();

    if (status === 'ON_TRACK') {
      return this.finishConversation(['おお、いい感じなの。今のやり方で、そのまま進んでみようね。']);
    }

    this.session.expected = 'GOAL_ACTION';
    this.session.inputMode = 'choice';
    this.session.choices = [...GOAL_ACTION_CHOICES];
    const line = status === 'BEHIND'
      ? 'そっか。少しずれてきたんだね。次はどうする？'
      : 'むむ……。今のやり方では厳しそうなんだね。次はどうする？';
    return this.respond([line], 'followup', 'choice', 'GOAL_ADJUST');
  }

  private handleGoalActionChoice(choice: ConversationChoice): ConversationResponse {
    const action: GoalAction = choice.id === 'GOAL_CHANGE_STRATEGY'
      ? 'CHANGE_STRATEGY'
      : choice.id === 'GOAL_REVIEW'
        ? 'REVIEW_GOAL'
        : 'RETRY';

    const latest = this.state.goalChecks.at(-1);
    if (latest && !latest.action) latest.action = action;
    this.session.attributes['goalAction'] = choice.label;
    this.save();

    if (action === 'CHANGE_STRATEGY') return this.finishConversation(['うん。目標はそのままで、戦法を変えてみるの。']);
    if (action === 'REVIEW_GOAL') return this.finishConversation(['そっか。目標そのものも、いまの自分に合わせて見直していいの。']);
    return this.finishConversation(['うん。もう一度試して、また結果を見ようね。']);
  }

  private ensureWord(
    surface: string,
    category: WordCategory,
    knowledgeLevel?: KnowledgeLevel,
  ): WordEntry {
    const existing = this.findWordBySurface(surface);
    if (existing) {
      existing.lastSeen = this.now().toISOString();
      existing.lastSeenDay = this.getCurrentDay();
      existing.mentionCount += 1;
      if (existing.category === 'UNKNOWN' && category !== 'UNKNOWN') existing.category = category;
      if (knowledgeLevel === 'KNOWN' || (knowledgeLevel === 'PARTIAL' && existing.knowledgeLevel === 'UNKNOWN')) {
        existing.knowledgeLevel = knowledgeLevel;
      }
      existing.oshiStatus ??= 'UNKNOWN';
      existing.importance = this.calculateImportance(existing);
      this.save();
      return existing;
    }

    const now = this.now().toISOString();
    const word: WordEntry = {
      id: `word_${now.replace(/\D/g, '').slice(0, 14)}_${Object.keys(this.state.words).length + 1}`,
      surface,
      category,
      knowledgeLevel: knowledgeLevel ?? (category === 'UNKNOWN' ? 'UNKNOWN' : 'KNOWN'),
      firstSeenDay: this.getCurrentDay(),
      lastSeenDay: this.getCurrentDay(),
      firstSeen: now,
      lastSeen: now,
      mentionCount: 1,
      attributes: {},
      userSentiment: 'NEUTRAL',
      oshiStatus: 'UNKNOWN',
      importance: 0.45,
    };
    this.state.words[surface] = word;
    this.save();
    return word;
  }

  private calculateImportance(word: WordEntry) {
    let score = 0.25 + Math.min(0.35, word.mentionCount * 0.06);
    if (word.userSentiment === 'LOVE') score += 0.2;
    else if (word.userSentiment === 'LIKE' || word.userSentiment === 'INTERESTED') score += 0.15;
    if (word.category === 'PERSON') score += 0.1;
    return Math.min(1, score);
  }

  private recordEvent(type: RelationType, object: string, summary: string, sentiment: Sentiment) {
    const word = this.state.words[object];
    const event: MemoryEvent = {
      id: `event_${this.session.id}_${this.state.events.length}`,
      day: this.getCurrentDay(),
      date: this.dateKey(),
      type,
      objects: [object],
      sentiment,
      summary,
      importance: word?.importance ?? (type === 'GOAL_CHECK' ? 1 : 0.45),
    };
    this.state.events.push(event);

    const relation = this.state.relations.find((item) => item.relation === type && item.object === object);
    if (relation) {
      relation.date = this.dateKey();
      relation.strength = Math.min(1, relation.strength + 0.1);
    } else {
      this.state.relations.push({ subject: 'USER', relation: type, object, date: this.dateKey(), strength: 0.6 });
    }
    this.save();
  }

  private rememberSession() {
    const topic = this.session.topic;
    if (!topic || INTERNAL_TOPICS.has(topic) || !this.session.lastUserText) return;

    const last = this.state.memories.at(-1);
    if (last?.topic === topic && last.quote === this.session.lastUserText) return;

    this.state.memories.push({
      day: this.getCurrentDay(),
      topic,
      actionType: this.session.startType,
      quote: this.session.lastUserText.slice(0, 100),
    });
    this.save();
  }

  private finishConversation(preface: string[] = [], pages?: DialoguePage[]) {
    this.rememberSession();
    this.session.expected = 'NONE';
    this.session.inputMode = 'none';
    this.session.choices = [];
    this.session.phase = 'CLOSE';
    this.session.stage = 'complete';
    return this.respond(preface, 'complete', 'none', 'CLOSE', pages);
  }

  private respond(
    lines: string[],
    stage: ConversationStage,
    inputMode: InputMode,
    template: string,
    pages?: DialoguePage[],
  ): ConversationResponse {
    this.session.stage = stage;
    this.session.inputMode = inputMode;
    this.session.lastAssistantLines = [...lines];

    const topic = this.session.topic;
    this.debug = {
      input: this.session.lastUserText,
      tokens: topic ? [{ surface: topic, known: Boolean(this.state.words[topic] || SYSTEM_WORDS.has(topic)), score: 10 }] : [],
      topic: topic ?? '',
      topicScore: topic ? 10 : 0,
      topicKnown: Boolean(topic && (this.state.words[topic] || SYSTEM_WORDS.has(topic))),
      state: this.session.phase,
      attributes: { ...this.session.attributes, expected: this.session.expected },
      memoryHit: topic && (this.state.words[topic]?.mentionCount ?? 0) > 1 ? topic : null,
      selectedTemplate: template,
      depth: 0,
      startType: this.session.startType,
      output: [...lines],
    };

    for (const line of lines) this.log('SUUHIMOCHI', line, template);

    return {
      lines,
      pages: pages?.length ? pages : dialoguePagesFromLines(lines),
      stage,
      day: this.getCurrentDay(),
      phaseLabel: this.getPhaseLabel(),
      // 旧UI互換: choice/category でも入力欄を消さない。
      // 新UIでは inputMode/choices/categoryChoices を見てボタン表示に切り替えられる。
      inputEnabled: inputMode !== 'none',
      inputMode,
      choices: inputMode === 'choice' ? [...this.session.choices] : [],
      categoryChoices: inputMode === 'category' && this.session.expected === 'CATEGORY'
        ? CATEGORY_CHOICES.map((item): CategoryChoice => ({ ...item }))
        : [],
      subCategoryChoices: inputMode === 'category' && this.session.expected === 'SUBCATEGORY'
        ? (SUBCATEGORY_CHOICES[this.session.category] ?? []).map((item): SubCategoryChoice => ({ ...item }))
        : [],
      debug: this.getDebugSnapshot(),
    };
  }

  private log(speaker: ConversationLog['speaker'], text: string, questionType?: string) {
    const entry: ConversationLog = {
      timestamp: this.now().toISOString(),
      speaker,
      text,
      sessionId: this.session.id,
      topic: this.session.topic ?? 'それ',
    };
    if (questionType) entry.questionType = questionType;
    this.state.conversations.push(entry);
    this.save();
  }

  private buildFarewellLines() {
    const lines = ['きょうで、人間さんと過ごした30日目なの。'];
    if (this.state.goalText && this.state.goalText !== UNDECIDED_GOAL) lines.push(`最初に${quote(this.state.goalText)}を目標にしたよね。`);
    if (this.state.goalChecks.length) lines.push(`途中で${this.state.goalChecks.length}回、いっしょに進み具合を見たの。`);
    lines.push(`新しいコトバを${this.getLearnedWords().length}個覚えたの。`);
    lines.push('うまくいった日も、ずれた日も、ちゃんと30日の中にあるの。');
    lines.push('そろそろ、お別れの時間みたい。');
    return lines;
  }
}
