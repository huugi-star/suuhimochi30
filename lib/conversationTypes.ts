// すうひもち会話システムの共有型。
// 会話本体は「文章解析」ではなく、単語記憶 + 選択肢会話 + 30日目標確認で動く。

export const WORD_CATEGORIES = [
  'PERSON',
  'ANIMAL',
  'FOOD',
  'OBJECT',
  'CLOTHING',
  'TECH',
  'PLACE',
  'VEHICLE',
  'ACTIVITY',
  'SPORTS',
  'WORK',
  'SCHOOL',
  'GAME_MEDIA',
  'AV_MEDIA',
  'KNOWLEDGE',
  'BODY',
  'EMOTION',
  'NATURE_TIME',
  'MONEY',
  'EVENT',
  'OTHER',
  'UNKNOWN',
] as const;

// MEDIA was used by older local saves. Keep it readable for migration while
// keeping the new-word picker limited to the expanded categories above.
export type WordCategory = (typeof WORD_CATEGORIES)[number] | 'MEDIA';

export type Sentiment =
  | 'LOVE'
  | 'LIKE'
  | 'INTERESTED'
  | 'NEUTRAL'
  | 'DISLIKE'
  | 'POSITIVE'
  | 'NEGATIVE'
  | 'TIRED';

export type OshiStatus = 'YES' | 'NO' | 'UNKNOWN';

export type RelationType = 'LEARN' | 'RECALL' | 'TALK' | 'GOAL_CHECK';

export type ExpectedAnswer =
  | 'GOAL_TEXT'
  | 'NEW_WORD'
  | 'PROMPTED_WORD'
  | 'PROMPTED_CORRECTION'
  | 'CATEGORY'
  | 'SUBCATEGORY'
  | 'WORD_FEELING'
  | 'OSHI_CONFIRM'
  | 'WORD_RECENCY'
  | 'MOOD'
  | 'GOAL_STATUS'
  | 'GOAL_ACTION'
  | 'NONE';

export type ConversationStage =
  | 'goal'
  | 'topic'
  | 'unknown'
  | 'followup'
  | 'complete'
  | 'farewell'
  | 'farewell_final'
  | 'ended';

export type ConversationPhase =
  | 'GOAL'
  | 'LEARN'
  | 'CHAT'
  | 'CYBERNETICS'
  | 'CLOSE'
  | 'IDLE';

export type StartType = 'GOAL' | 'WORD' | 'QUESTION' | 'RECALL' | 'MOOD' | 'CYBERNETICS' | 'FAREWELL';

export type InputMode = 'text' | 'choice' | 'category' | 'none';

export type ConversationChoice = {
  id: string;
  label: string;
};

export type WordEntry = {
  id: string;
  surface: string;
  category: WordCategory;
  firstSeen: string;
  lastSeen: string;
  mentionCount: number;
  attributes: Record<string, string>;
  userSentiment: Sentiment;
  /** 推しかどうか。旧保存データでは未設定の場合があるため読み込み時に UNKNOWN へ補完する。 */
  oshiStatus: OshiStatus;
  oshiConfirmedAt?: number;
  lastReferencedAt?: number;
  importance: number;
  lastRecalled?: string;
};

export type ConversationMemory = {
  day: number;
  topic: string;
  actionType: string;
  quote: string;
};

export type Relation = {
  subject: 'USER';
  relation: RelationType;
  object: string;
  date: string;
  strength: number;
};

export type MemoryEvent = {
  id: string;
  day: number;
  date: string;
  type: RelationType;
  objects: string[];
  sentiment: Sentiment;
  summary: string;
  importance: number;
};

export type ConversationLog = {
  timestamp: string;
  speaker: 'USER' | 'SUUHIMOCHI';
  text: string;
  sessionId: string;
  topic: string;
  questionType?: string;
};

export type GoalStatus = 'ON_TRACK' | 'BEHIND' | 'HARD';
export type GoalAction = 'RETRY' | 'CHANGE_STRATEGY' | 'REVIEW_GOAL';

export type GoalCheck = {
  day: number;
  date: string;
  status: GoalStatus;
  action?: GoalAction;
};

export type DebugToken = {
  surface: string;
  known: boolean;
  score: number;
};

export type DebugSnapshot = {
  input: string;
  tokens: DebugToken[];
  topic: string;
  topicScore: number;
  topicKnown: boolean;
  state: ConversationPhase;
  attributes: Record<string, string>;
  memoryHit: string | null;
  selectedTemplate: string;
  depth: number;
  startType: StartType;
  output: string[];
};

export type CategoryChoice = {
  category: WordCategory;
  label: string;
};

export type SubCategoryChoice = {
  id: string;
  label: string;
};

export type LearnedWord = {
  word: string;
  category: WordCategory;
  source: 'user_explained' | 'known_or_skip';
  learnedAt: string;
  note?: string;
};

export type ConversationResponse = {
  lines: string[];
  stage: ConversationStage;
  day: number;
  phaseLabel: string;
  inputEnabled: boolean;
  inputMode: InputMode;
  choices: ConversationChoice[];
  categoryChoices: CategoryChoice[];
  subCategoryChoices: SubCategoryChoice[];
  debug: DebugSnapshot;
};

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};
