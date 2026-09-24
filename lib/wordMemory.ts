import {
  CATEGORY_CHOICES,
  CATEGORY_LABELS,
  GOAL_ACTION_CHOICES,
  GOAL_STATUS_CHOICES,
  MOOD_CHOICES,
  NORMAL_CHAT_OPENINGS,
  MIDDLE_CATEGORY_DIALOGUE,
  SYSTEM_WORDS,
  SUBCATEGORY_CHOICES,
  WORD_FEELING_CHOICES,
  WORD_FEELING_PROMPTS,
  WORD_RECENCY_CHOICES,
} from './conversationData';
import { commonKnowledgeReaction, findCommonKnowledge } from './commonKnowledgeData';
import {
  buildPromptedLearningOpinion,
  buildPromptedLearningRecall,
  findPromptedLearningAxis,
  findPromptedLearningChoice,
  findPromptedLearningQuestion,
  getPromptedLearningChoices,
  getPromptedLearningSuggestions,
  isTooGenericPromptedAnswer,
  pickPromptedLearningAxis,
  pickPromptedLearningQuestion,
} from './promptedLearningData';
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
  MemoryEvent,
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
  MemoryEvent,
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

// Prompted Learning の最初の質問で「ない・知らない・わからない」を
// 単語として誤登録しない。UI の「わかんない」ボタンも同じ処理へ流す。
const PROMPTED_SKIP_ANSWERS = /^(?:ない|特にない|とくにない|思いつかない|おもいつかない|知らない|しらない|知らん|わからない|分からない|分かんない|わかんない|わからん|わからないな|知らないな)(?:です|よ|かな|かも)?[。！!？?]*$/;

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

const OSHI_RECALL_LINES = [
  (word: string) => `そういえば、${word}って人間さんの推しだったよね。`,
  (word: string) => `${word}のこと、ちゃんと覚えてるの。人間さんの推しだからね。`,
  (word: string) => `${word}の名前を見ると、人間さんのこと思い出すようになったの。`,
  (word: string) => `最近、推しの${word}の話してないね。`,
];

type StoredState = {
  version: 6;
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
  lastNormalMode: 'WORD' | 'QUESTION' | 'MOOD' | 'RECALL' | null;
  lastWordSurface: string | null;
  lastPromptedQuestionId: string | null;
  promptedRecentQuestionIds: string[];
  promptedRecentGroups: string[];
  promptedRecentEntityKinds: string[];
  promptedRecentStarterKeys: string[];
  promptedQuestionCounts: Record<string, number>;
  promptedStarterCounts: Record<string, number>;
  oshiLoveCounts: Record<string, number>;
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
    version: 6,
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
    lastNormalMode: null,
    lastWordSurface: null,
    lastPromptedQuestionId: null,
    promptedRecentQuestionIds: [],
    promptedRecentGroups: [],
    promptedRecentEntityKinds: [],
    promptedRecentStarterKeys: [],
    promptedQuestionCounts: Object.create(null),
    promptedStarterCounts: Object.create(null),
    oshiLoveCounts: Object.create(null),
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

function pushRecent(items: string[], value: string, max: number) {
  const next = items.filter((item) => item !== value);
  next.unshift(value);
  return next.slice(0, max);
}

function quote(value: string) {
  return `「${value}」`;
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
  if (id === 'WORD_LIKE' || id === 'MOOD_GOOD') return 'LIKE';
  if (id === 'WORD_DISLIKE' || id === 'WORD_HATE') return 'DISLIKE';
  if (id === 'WORD_INTERESTED') return 'INTERESTED';
  if (id === 'MOOD_TIRED') return 'TIRED';
  return 'NEUTRAL';
}

export class SuuhimochiConversation {
  private state: StoredState;
  private session: Session;
  private storage: StorageLike;
  private random: () => number;
  private now: () => Date;
  private farewellQueue: string[] = [];
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
          { ...word, oshiStatus: word.oshiStatus ?? 'UNKNOWN' as OshiStatus },
        ]),
      ) as Record<string, WordEntry>;
      return {
        ...emptyState(),
        ...parsed,
        version: 6,
        words: Object.assign(Object.create(null), words),
        memories: parsed.memories ?? [],
        relations: parsed.relations ?? [],
        events: parsed.events ?? [],
        conversations: parsed.conversations ?? [],
        goalChecks: parsed.goalChecks ?? [],
        promptedRecentQuestionIds: parsed.promptedRecentQuestionIds ?? [],
        promptedRecentGroups: parsed.promptedRecentGroups ?? [],
        promptedRecentEntityKinds: parsed.promptedRecentEntityKinds ?? [],
        promptedRecentStarterKeys: parsed.promptedRecentStarterKeys ?? [],
        promptedQuestionCounts: Object.assign(Object.create(null), parsed.promptedQuestionCounts ?? {}),
        promptedStarterCounts: Object.assign(Object.create(null), parsed.promptedStarterCounts ?? {}),
        oshiLoveCounts: Object.assign(Object.create(null), parsed.oshiLoveCounts ?? {}),
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
    this.session = this.blankSession();
    this.state.conversationCount += 1;
    this.save();
    return this.openNewWord();
  }

  /** Start a question led by Suuhimochi rather than a player-led word lesson. */
  startPromptedLearning(): ConversationResponse {
    if (!this.state.goalText || this.state.ended || this.getCurrentDay() >= 30) {
      return this.startSession();
    }

    this.rememberSession();
    this.session = this.blankSession();
    this.state.conversationCount += 1;
    this.save();
    return this.openPromptedLearningQuestion();
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
    const userText = this.session.expected === 'NEW_WORD' || this.session.expected === 'PROMPTED_WORD' ? surface : value;
    this.session.lastUserText = userText;
    this.log('USER', userText);

    if (this.session.expected === 'GOAL_TEXT') return this.handleGoalText(value, false);
    if (this.session.expected === 'NEW_WORD') return this.handleNewWord(surface, false);
    if (this.session.expected === 'PROMPTED_WORD') return this.handlePromptedLearningText(surface, false);

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
      case 'MOOD':
        return MOOD_CHOICES;
      case 'WORD_FEELING':
        return WORD_FEELING_CHOICES;
      case 'PROMPTED_CORRECTION':
        return getPromptedLearningChoices(
          this.session.attributes['promptedQuestionId'],
          this.session.attributes['promptedAxisId'],
        );
      case 'OSHI_CONFIRM':
        return OSHI_CONFIRM_CHOICES;
      case 'WORD_RECENCY':
        return WORD_RECENCY_CHOICES;
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

  /**
   * Prompted Learning の最初の自由入力質問だけをスキップする。
   * 「わかんない」は辞書へ登録せず、別方向の質問へ切り替える。
   * 3回続けて分からなければ、その会話だけ自然に終了する。
   */
  skipPromptedQuestion(): ConversationResponse {
    if (this.session.expected !== 'PROMPTED_WORD') {
      return this.respond(['今は「わかんない」を使う質問じゃないの。'], this.session.stage, this.session.inputMode, 'PROMPTED_SKIP_UNAVAILABLE');
    }
    return this.handlePromptedLearningSkip('わかんない', true);
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
    this.ensureStartDate();
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
    const key = cleanText(surface);
    if (!key || !this.state.words[key]) return false;
    delete this.state.words[key];
    if (this.state.lastWordSurface === key) this.state.lastWordSurface = null;
    this.state.relations = this.state.relations.filter((relation) => relation.object !== key);
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

  getAmbientMemoryLine(): string | null {
    const words = Object.values(this.state.words)
      .filter((word) => !INTERNAL_TOPICS.has(word.surface) && !SYSTEM_WORDS.has(word.surface));
    if (!words.length) return null;
    const picked = words[Math.floor(this.random() * words.length)];
    if (!picked) return null;
    const promptedRecall = buildPromptedLearningRecall(
      picked.attributes['promptedQuestionId'],
      picked.attributes['promptedLastAxisId'],
      picked.attributes['promptedLastChoiceId'],
      picked.surface,
    );
    if (promptedRecall) return promptedRecall;

    const label = CATEGORY_LABELS[picked.category] ?? 'コトバ';
    return `${quote(picked.surface)}は${label}って教えてくれたよね。覚えてるの。`;
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
    const words = this.learnedWordEntries();
    const roll = this.random();

    if (!words.length || roll < 0.25) return this.openNewWord();
    if (roll < 0.43) return this.openPromptedLearningQuestion();
    if (roll < 0.62) return this.openMood();
    return this.openRecall(words);
  }

  private openPromptedLearningQuestion(preface: string[] = []): ConversationResponse {
    const question = pickPromptedLearningQuestion(this.random, {
      recentQuestionIds: this.state.promptedRecentQuestionIds,
      recentGroups: this.state.promptedRecentGroups,
      recentEntityKinds: this.state.promptedRecentEntityKinds,
      recentStarterKeys: this.state.promptedRecentStarterKeys,
      questionCounts: this.state.promptedQuestionCounts,
      starterCounts: this.state.promptedStarterCounts,
    });
    if (!question) return this.openNewWord();

    this.state.lastNormalMode = 'QUESTION';
    this.state.lastPromptedQuestionId = question.id;
    this.state.promptedRecentQuestionIds = pushRecent(this.state.promptedRecentQuestionIds, question.id, 18);
    this.state.promptedRecentGroups = pushRecent(this.state.promptedRecentGroups, question.group, 6);
    this.state.promptedRecentEntityKinds = pushRecent(this.state.promptedRecentEntityKinds, question.entityKind, 12);
    this.state.promptedRecentStarterKeys = pushRecent(
      this.state.promptedRecentStarterKeys,
      question.selectedStarterKey,
      120,
    );
    this.state.promptedQuestionCounts[question.id] = (this.state.promptedQuestionCounts[question.id] ?? 0) + 1;
    this.state.promptedStarterCounts[question.selectedStarterKey] =
      (this.state.promptedStarterCounts[question.selectedStarterKey] ?? 0) + 1;
    this.save();

    this.session.stage = 'topic';
    this.session.phase = 'LEARN';
    this.session.startType = 'QUESTION';
    this.session.expected = 'PROMPTED_WORD';
    this.session.inputMode = 'text';
    this.session.topic = null;
    this.session.category = question.category;
    this.session.attributes['promptedQuestionId'] = question.id;
    this.session.attributes['askedCategory'] = question.category;
    this.session.attributes['promptedEntityKind'] = question.entityKind;
    this.session.attributes['promptedGroup'] = question.group;
    this.session.attributes['promptedStarterPrompt'] = question.prompt;
    this.session.attributes['promptedStarterIndex'] = String(question.selectedStarterIndex);
    this.session.attributes['promptedStarterKey'] = question.selectedStarterKey;

    const suggestions = getPromptedLearningSuggestions(
      question.id,
      this.random,
      4,
      Object.keys(this.state.words),
    );
    for (let index = 0; index < 4; index += 1) {
      const key = `promptedSuggestion${index}`;
      const suggestion = suggestions[index];
      if (suggestion) this.session.attributes[key] = suggestion;
      else delete this.session.attributes[key];
    }

    return this.respond([...preface, question.prompt], 'topic', 'text', 'PROMPTED_QUESTION');
  }

  private openNewWord(): ConversationResponse {
    this.state.lastNormalMode = 'WORD';
    this.save();

    this.session.stage = 'topic';
    this.session.phase = 'LEARN';
    this.session.startType = 'WORD';
    this.session.expected = 'NEW_WORD';
    this.session.inputMode = 'text';
    this.session.topic = null;

    return this.respond([NORMAL_CHAT_OPENINGS.newWord], 'topic', 'text', 'NEW_WORD');
  }

  private openMood(): ConversationResponse {
    this.state.lastNormalMode = 'MOOD';
    this.save();

    this.session.stage = 'followup';
    this.session.phase = 'CHAT';
    this.session.startType = 'MOOD';
    this.session.expected = 'MOOD';
    this.session.inputMode = 'choice';
    this.session.topic = '今日の調子';
    this.session.choices = [...MOOD_CHOICES];

    return this.respond([NORMAL_CHAT_OPENINGS.mood], 'followup', 'choice', 'MOOD');
  }

  private pickRecallWord(pool: WordEntry[]) {
    if (!pool.length) return undefined;
    const now = this.now().getTime();
    const cooldownPool = pool.filter((word) => !word.lastReferencedAt || now - word.lastReferencedAt >= 10 * 60 * 1000);
    const eligible = cooldownPool.length ? cooldownPool : pool;
    const weights = eligible.map((word) => {
      if (word.oshiStatus === 'YES') return 2.5;
      if (word.userSentiment === 'LOVE') return 1.7;
      if (word.userSentiment === 'LIKE') return 1.3;
      return 1;
    });
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let cursor = this.random() * total;
    for (let index = 0; index < eligible.length; index += 1) {
      cursor -= weights[index] ?? 0;
      if (cursor < 0) return eligible[index];
    }
    return eligible.at(-1);
  }

  private pickOshiRecallLine(word: string) {
    const index = Math.min(OSHI_RECALL_LINES.length - 1, Math.floor(this.random() * OSHI_RECALL_LINES.length));
    return OSHI_RECALL_LINES[index]?.(word) ?? `そういえば、${word}って人間さんの推しだったよね。`;
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

  private openRecall(words: WordEntry[]): ConversationResponse {
    this.state.lastNormalMode = 'RECALL';
    const candidates = words.filter((word) => word.surface !== this.state.lastWordSurface);
    const pool = candidates.length ? candidates : words;
    const word = this.pickRecallWord(pool);
    if (!word) return this.openNewWord();

    this.state.lastWordSurface = word.surface;
    word.lastRecalled = this.dateKey();
    word.lastReferencedAt = this.now().getTime();
    this.save();

    this.session.stage = 'followup';
    this.session.phase = 'CHAT';
    this.session.startType = 'RECALL';
    this.session.topic = word.surface;
    this.session.category = word.category;

    const recallLines = word.oshiStatus === 'YES'
      ? [this.pickOshiRecallLine(word.surface)]
      : [];

    const promptedRecall = buildPromptedLearningRecall(
      word.attributes['promptedQuestionId'],
      word.attributes['promptedLastAxisId'],
      word.attributes['promptedLastChoiceId'],
      word.surface,
    );
    if (promptedRecall && this.random() < 0.45) recallLines.push(promptedRecall);

    if (this.random() < 0.5) {
      this.session.expected = 'WORD_FEELING';
      this.session.inputMode = 'choice';
      this.session.choices = [...WORD_FEELING_CHOICES];
      return this.respond([...recallLines, NORMAL_CHAT_OPENINGS.recallFeeling(word.surface)], 'followup', 'choice', 'RECALL_FEELING');
    }

    this.session.expected = 'WORD_RECENCY';
    this.session.inputMode = 'choice';
    this.session.choices = [...WORD_RECENCY_CHOICES];
    return this.respond([...recallLines, NORMAL_CHAT_OPENINGS.recallRecent(word.surface)], 'followup', 'choice', 'RECALL_RECENCY');
  }

  private handlePromptedLearningSkip(label: string, logUser: boolean): ConversationResponse {
    if (logUser) {
      this.session.lastUserText = label;
      this.log('USER', label);
    }

    const skipCount = Number(this.session.attributes['promptedSkipCount'] ?? '0') + 1;
    this.session.attributes['promptedSkipCount'] = String(skipCount);
    this.session.topic = null;

    if (skipCount >= 3) {
      return this.finishPromptedConversation([
        '今日はぼくの質問が空振りの日なの。',
        '知らないものを無理にひねり出すより、また別の日に聞くの。',
      ]);
    }

    const line = skipCount === 1
      ? 'そっか。じゃあ、別のところから聞いてみるの。'
      : 'むむ、これも外れたのね。じゃあ最後に、ぜんぜん違う方向から聞くの。';

    return this.openPromptedLearningQuestion([line]);
  }

  private handlePromptedLearningText(text: string, logUser = true): ConversationResponse {
    const surface = text.trim();
    const value = cleanText(surface);
    if (logUser) {
      this.session.lastUserText = surface;
      this.log('USER', surface);
    }
    if (PROMPTED_SKIP_ANSWERS.test(value)) {
      return this.handlePromptedLearningSkip(surface || 'わかんない', false);
    }
    if (!value) return this.respond(['コトバをひとつ、聞かせてほしいの。'], 'topic', 'text', 'PROMPTED_EMPTY');
    if (value.length > MAX_WORD_LENGTH || /[。！？!?\n\r]/.test(value)) {
      return this.respond(['文章じゃなくて、コトバをひとつだけ聞かせてほしいの。'], 'topic', 'text', 'PROMPTED_WORD_ONLY');
    }

    if (isTooGenericPromptedAnswer(value)) {
      return this.respond([
        `「${surface}」みたいな種類じゃなくて、作品名や人の名前みたいな固有の名前をひとつ知りたいの。`,
      ], 'topic', 'text', 'PROMPTED_NEEDS_NAME');
    }

    const question = findPromptedLearningQuestion(this.session.attributes['promptedQuestionId']);
    if (!question) return this.openPromptedLearningQuestion();

    // A prompted question asks for something new to talk about.  If the
    // player enters a word that is already in memory (or one of the built-in
    // common words), acknowledge it briefly but keep the text input open for a
    // different word.  Do not call ensureWord here: this path must not create
    // a duplicate entry or increment an existing word's mention count.
    const knownWord = Object.values(this.state.words)
      .find((entry) => cleanText(entry.surface) === value);
    if (knownWord) {
      this.session.topic = null;
      this.session.expected = 'PROMPTED_WORD';
      this.session.inputMode = 'text';
      this.session.choices = [];
      return this.respond([
        `「${knownWord.surface}」は、前に教えてくれたよね。${CATEGORY_LABELS[knownWord.category] ?? 'コトバ'}として覚えてるの。`,
        'それはもう知ってるから、別のコトバをひとつ教えてほしいの。',
      ], 'topic', 'text', 'PROMPTED_ALREADY_KNOWN');
    }

    const commonKnowledge = findCommonKnowledge(value);
    if (commonKnowledge) {
      this.session.topic = null;
      this.session.expected = 'PROMPTED_WORD';
      this.session.inputMode = 'text';
      this.session.choices = [];
      return this.respond([
        commonKnowledgeReaction(surface, commonKnowledge, this.random),
        'それは知ってるから、別のコトバをひとつ教えてほしいの。',
      ], 'topic', 'text', 'PROMPTED_COMMON_KNOWN');
    }

    // The category is known from Suuhimochi's question, so the word can be
    // registered immediately.  The next step is not a generic correctness
    // check: it asks one category-specific conversation axis and stores the
    // player's answer as a semantic attribute.
    const word = this.ensureWord(surface, question.category);
    if (word.category === 'UNKNOWN') word.category = question.category;
    word.attributes['learnedBy'] = 'prompted_conversation';
    word.attributes['askedCategory'] = question.category;
    word.attributes['promptedQuestionId'] = question.id;
    word.attributes['promptedEntityKind'] = question.entityKind;
    word.attributes['promptedGroup'] = question.group;
    word.attributes['promptedStarterIndex'] = this.session.attributes['promptedStarterIndex'] ?? '';
    word.attributes['promptedStarterKey'] = this.session.attributes['promptedStarterKey'] ?? '';
    word.attributes['promptedStarterPrompt'] = this.session.attributes['promptedStarterPrompt'] ?? '';
    word.lastSeen = this.now().toISOString();

    const axis = pickPromptedLearningAxis(question, word.attributes, this.random);
    if (!axis) {
      this.save();
      return this.finishPromptedConversation([`${word.surface}のこと、今日は名前を覚えておくの。`]);
    }

    this.session.topic = word.surface;
    this.session.category = word.category;
    this.session.stage = 'followup';
    this.session.phase = 'LEARN';
    // Keep the existing ExpectedAnswer name for compatibility with the UI and
    // conversationTypes.  It now means "answer the prompted conversation axis".
    this.session.expected = 'PROMPTED_CORRECTION';
    this.session.inputMode = 'choice';
    this.session.choices = axis.choices.map(({ id, label }) => ({ id, label }));
    this.session.attributes['promptedWord'] = word.surface;
    this.session.attributes['promptedAxisId'] = axis.id;
    this.session.attributes['promptedAttributeKey'] = axis.attributeKey;
    this.save();

    return this.respond([
      axis.prompt(word.surface),
    ], 'followup', 'choice', 'PROMPTED_AXIS');
  }

  private handlePromptedLearningCorrection(choice: ConversationChoice): ConversationResponse {
    const topic = this.session.topic;
    const word = topic ? this.state.words[topic] : undefined;
    if (!word || !topic) {
      return this.finishPromptedConversation(['あれ……うまくつながらなかったの。また今度聞かせて。']);
    }

    const questionId = this.session.attributes['promptedQuestionId'];
    const axisId = this.session.attributes['promptedAxisId'];
    const axis = findPromptedLearningAxis(questionId, axisId);
    const selected = findPromptedLearningChoice(questionId, axisId, choice.id);

    if (!axis || !selected) {
      return this.finishPromptedConversation(['むむ……今の答え、うまく受け取れなかったの。また今度聞かせて。']);
    }

    // Store the actual meaning of the selected answer instead of a generic
    // "correct / almost / wrong" flag.  The label is also kept so debug views
    // and future UI can show what Suuhimochi learned without decoding enums.
    word.attributes[axis.attributeKey] = selected.value;
    word.attributes[`${axis.attributeKey}Label`] = selected.memoryLabel;
    word.attributes['promptedQuestionId'] = questionId ?? '';
    word.attributes['promptedLastAxisId'] = axis.id;
    word.attributes['promptedLastChoiceId'] = selected.id;
    word.attributes['promptedLastMemoryLabel'] = selected.memoryLabel;
    word.attributes['learnedBy'] = 'prompted_conversation';
    word.lastSeen = this.now().toISOString();
    word.importance = this.calculateImportance(word);
    this.recordEvent('LEARN', topic, selected.memoryLabel, word.userSentiment);
    this.save();

    // Do not repeat the player's selected meaning before the conclusion.
    // The visible ending is only Suuhimochi's own slightly-off opinion.
    // selected.reply remains as a fallback for an axis that has no opinion.
    const opinion = buildPromptedLearningOpinion(questionId, axisId, selected.id, topic);
    const lines = opinion ? [opinion] : selected.reply(topic);
    return this.finishPromptedConversation(lines);
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
      return this.finishConversation([commonKnowledgeReaction(surface, commonKnowledge, this.random)]);
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
      case 'MOOD':
        return this.handleMoodChoice(choice);
      case 'WORD_FEELING':
        return this.handleWordFeelingChoice(choice);
      case 'PROMPTED_CORRECTION':
        return this.handlePromptedLearningCorrection(choice);
      case 'OSHI_CONFIRM':
        return this.handleOshiChoice(choice);
      case 'WORD_RECENCY':
        return this.handleWordRecencyChoice(choice);
      case 'GOAL_STATUS':
        return this.handleGoalStatusChoice(choice);
      case 'GOAL_ACTION':
        return this.handleGoalActionChoice(choice);
      default:
        return this.finishConversation(['うん、覚えておくの。']);
    }
  }

  private handleMoodChoice(choice: ConversationChoice): ConversationResponse {
    const sentiment = sentimentForChoice(choice.id);
    this.session.attributes['mood'] = choice.label;
    this.recordEvent('TALK', '今日の調子', choice.label, sentiment);

    if (choice.id === 'MOOD_GOOD') return this.finishConversation(['おお、元気なの。なんだかぼくも嬉しいの。']);
    if (choice.id === 'MOOD_TIRED') return this.finishConversation(['そっか。今日はちょっとゆっくりでもいいの。']);
    return this.finishConversation(['ふつうの日も、ちゃんと一日なの。']);
  }

  private handleWordFeelingChoice(choice: ConversationChoice): ConversationResponse {
    const topic = this.session.topic;
    const sentiment = sentimentForChoice(choice.id);
    let word: WordEntry | undefined;
    if (topic) {
      word = this.state.words[topic];
      if (word) {
        word.userSentiment = sentiment;
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

  private handleWordRecencyChoice(choice: ConversationChoice): ConversationResponse {
    const topic = this.session.topic;
    if (topic) {
      const word = this.state.words[topic];
      if (word) {
        word.attributes['recency'] = choice.label;
        word.lastSeen = this.now().toISOString();
        this.recordEvent('RECALL', topic, choice.label, word.userSentiment);
      }
    }

    if (choice.id === 'WORD_OFTEN') return this.finishConversation(['まだよく出会うコトバなんだね。']);
    if (choice.id === 'WORD_NOT_RECENT') return this.finishConversation(['最近はあんまり出てこないんだね。']);
    return this.finishConversation(['たまに出会うくらいなんだね。']);
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

  private learnedWordEntries() {
    return Object.values(this.state.words)
      .filter((word) => word.category !== 'UNKNOWN' && !SYSTEM_WORDS.has(word.surface) && !INTERNAL_TOPICS.has(word.surface))
      .sort((a, b) => b.importance - a.importance || b.mentionCount - a.mentionCount);
  }

  private ensureWord(surface: string, category: WordCategory): WordEntry {
    const existing = this.state.words[surface];
    if (existing) {
      existing.lastSeen = this.now().toISOString();
      existing.mentionCount += 1;
      if (existing.category === 'UNKNOWN' && category !== 'UNKNOWN') existing.category = category;
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

  private finishPromptedConversation(lines: string[]) {
    this.rememberSession();
    this.session.expected = 'NONE';
    this.session.inputMode = 'none';
    this.session.choices = [];
    this.session.phase = 'CLOSE';
    this.session.stage = 'complete';
    return this.respond(lines, 'complete', 'none', 'PROMPTED_CLOSE');
  }

  private finishConversation(preface: string[] = []) {
    this.rememberSession();
    this.session.expected = 'NONE';
    this.session.inputMode = 'none';
    this.session.choices = [];
    this.session.phase = 'CLOSE';
    this.session.stage = 'complete';
    return this.respond([...preface, 'また話そうね。'], 'complete', 'none', 'CLOSE');
  }

  private respond(
    lines: string[],
    stage: ConversationStage,
    inputMode: InputMode,
    template: string,
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
