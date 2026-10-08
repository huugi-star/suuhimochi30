/** 新しい会話システムで使う、台本そのものの構造。 */
export type ConversationIntent =
  | 'CHAT'
  | 'ASK'
  | 'IDEA'
  | 'RECALL'
  | 'CLOSE';

export type DialogueEmotion =
  | 'NORMAL'
  | 'HAPPY'
  | 'SURPRISED'
  | 'TROUBLED'
  | 'SAD'
  | 'ANGRY'
  | 'THINKING'
  | 'SMUG';

/**
 * 原稿の台詞・間・仕草を分離して残す。
 * text がない beat は表示せず、将来の演出用メタデータとして保持する。
 */
export type DialogueBeat = {
  text?: string;
  pauseMs?: number;
  emotion?: DialogueEmotion;
  action?: string;
};

/** 一度のページ送りで読む、複数の短い台詞のまとまり。 */
export type DialoguePage = {
  lines: string[];
  emotion?: DialogueEmotion;
  action?: string;
  /** 各行の直後に入れる自動の間。lines と同じ添字を使う。 */
  linePauseAfterMs?: number[];
  pauseBeforeMs?: number;
  pauseAfterMs?: number;
};

export type DayConversationChoice = {
  id: string;
  label: string;
  response: DialogueBeat[];
};

export type DayConversation = {
  id: string;
  day: number;
  category: 'SELF';
  title: string;
  opening: DialogueBeat[];
  choices: [DayConversationChoice, DayConversationChoice, DayConversationChoice];
};

export type KnowledgeLevel = 'UNKNOWN' | 'PARTIAL' | 'KNOWN';

export type MemoryRelationType =
  | 'LIKES'
  | 'DISLIKES'
  | 'MAKES_HAPPY'
  | 'FREQUENTLY_DOES'
  | 'FREQUENTS'
  | 'IS_A'
  | 'RELATED_TO'
  | 'USED_FOR'
  | 'THINKS_ABOUT'
  | 'AVOIDS';

export type OpenQuestionField =
  | 'CATEGORY'
  | 'SUBCATEGORY'
  | 'DETAIL'
  | 'PURPOSE'
  | 'REASON'
  | 'RELATION'
  | 'OTHER';

export type CuriousMemoryEffect = {
  category?: WordCategory;
  subcategory?: string;
  knowledgeLevel?: KnowledgeLevel;
  relationQualifier?: string;
  relatedConcept?: string;
  relatedConceptLabel?: string;
  relationStatus?: 'ACTIVE' | 'REJECTED';
  /** 選択で明示された時だけ追加する、人間さんとの事実関係。 */
  humanRelations?: MemoryRelationType[];
  openQuestions?: Array<{
    field: OpenQuestionField;
    questionHint: string;
  }>;
};

export type CuriousConversationChoice = DayConversationChoice & {
  memory: CuriousMemoryEffect;
};

export type CuriousConversation = {
  id: string;
  day: number;
  category: 'CURIOUS';
  title: string;
  opening: DialogueBeat[];
  context: {
    category?: WordCategory;
    humanRelations: MemoryRelationType[];
  };
  known: {
    response: DialogueBeat[];
    choices: CuriousConversationChoice[];
  };
  unknown: {
    response: DialogueBeat[];
    choices: CuriousConversationChoice[];
  };
};

export type ConversationScript = DayConversation | CuriousConversation;

export type ConversationChoiceRecord = {
  conversationId: string;
  choiceId: string;
  day: number;
  timestamp: string;
  choiceLabel?: string;
};

export type ConversationEngineRequest = {
  intent: ConversationIntent;
  day: number;
  seenConversationIds: readonly string[];
  random?: () => number;
};

export type ConversationEngineResult = {
  intent: ConversationIntent;
  conversation?: ConversationScript;
};
import type { WordCategory } from '../conversationTypes';

