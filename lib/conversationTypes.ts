// 単語記憶・30日進行・画面連携で共有する型。
// 新しい通常会話の型は lib/conversation/ に分離している。

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
  | 'CATEGORY'
  | 'SUBCATEGORY'
  | 'WORD_FEELING'
  | 'OSHI_CONFIRM'
  | 'GOAL_STATUS'
  | 'GOAL_ACTION'
  | 'DAY_CONVERSATION_CHOICE'
  | 'DAY_CURIOUS_WORD'
  | 'DAY_CURIOUS_KNOWN_CHOICE'
  | 'DAY_CURIOUS_UNKNOWN_CHOICE'
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

export type StartType = 'GOAL' | 'WORD' | 'CHAT' | 'CYBERNETICS' | 'FAREWELL';

export type InputMode = 'text' | 'choice' | 'category' | 'none';

export type ConversationChoice = {
  id: string;
  label: string;
};

export type WordEntry = {
  id: string;
  surface: string;
  category: WordCategory;
  /** 意味記憶上の、分かりかけを含む理解段階。 */
  knowledgeLevel: import('./conversation/conversationTypes').KnowledgeLevel;
  subcategory?: string;
  firstSeenDay: number;
  lastSeenDay: number;
  lastUsedInConversationDay?: number;
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

export type MemoryRelation = {
  id: string;
  subjectId: 'human' | string;
  type: import('./conversation/conversationTypes').MemoryRelationType;
  objectId: string;
  source: 'USER_EXPLICIT' | 'CONTEXT_INFERRED' | 'USER_CORRECTION';
  status: 'ACTIVE' | 'REJECTED';
  qualifier?: string;
  firstSeenDay: number;
  lastSeenDay: number;
  mentionCount: number;
  lastUsedInConversationDay?: number;
};

export type OpenQuestion = {
  id: string;
  wordId: string;
  field: import('./conversation/conversationTypes').OpenQuestionField;
  questionHint: string;
  createdDay: number;
  lastAskedDay?: number;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
};

export type MemoryEpisode = {
  id: string;
  day: number;
  conversationId: string;
  topicWordIds: string[];
  learnedRelationIds: string[];
  createdOpenQuestionIds: string[];
  timestamp: string;
};

export type MemoryHypothesis = {
  id: string;
  statement: string;
  supportingRelationIds: string[];
  status: 'UNTESTED' | 'SUPPORTED' | 'REJECTED' | 'CORRECTED';
  createdDay: number;
  updatedDay: number;
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
  pages: import('./conversation/conversationTypes').DialoguePage[];
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
