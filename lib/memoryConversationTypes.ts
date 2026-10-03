import type { ConversationChoice, WordEntry } from './conversationTypes';

export type MemoryConversationFamily =
  | 'deepen-one'
  | 'connect-one'
  | 'common-two'
  | 'contrast-two'
  | 'relationship-hypothesis'
  | 'continue-previous';

export type MemoryCalloutKind =
  | 'know-human'
  | 'continue-previous'
  | 'check-misunderstanding'
  | 'silly-question'
  | 'own-thought'
  | 'intimate-question'
  | 'report';

export type MemoryReaction = 'agree' | 'correct' | 'deny' | 'unresolved';

export type MemoryEvidence = {
  wordKey: string;
  wordSurface: string;
  attributeKey: string;
  value: string;
  label: string;
};

export type MemoryConversationChoice = ConversationChoice & {
  reaction: MemoryReaction;
  meaning: string;
  reply: string[];
  afterthought: string;
};

export type MemoryConversationCandidate = {
  templateId: string;
  family: MemoryConversationFamily;
  calloutKind: MemoryCalloutKind;
  callout: string;
  wordKeys: string[];
  evidence: MemoryEvidence[];
  hypothesis: string;
  lines: string[];
  choices: MemoryConversationChoice[];
  continuationOf?: string;
};

export type MemoryConversationRecord = {
  id: string;
  templateId: string;
  family: MemoryConversationFamily;
  calloutKind: MemoryCalloutKind;
  wordKeys: string[];
  evidence: MemoryEvidence[];
  hypothesis: string;
  choiceId: string;
  choiceLabel: string;
  responseMeaning: string;
  reaction: MemoryReaction;
  date: string;
  day: number;
  usedAsContinuation: boolean;
};

export type MemoryAfterthought = {
  id: string;
  recordId: string;
  wordKeys: string[];
  line: string;
  createdAt: string;
};

export type MemoryConversationBuildContext = {
  wordA: WordEntry;
  wordB?: WordEntry;
  evidence: MemoryEvidence[];
  previous?: MemoryConversationRecord;
};

export type MemoryConversationTemplate = {
  id: string;
  family: MemoryConversationFamily;
  calloutKinds: readonly MemoryCalloutKind[];
  build: (context: MemoryConversationBuildContext) => Pick<MemoryConversationCandidate, 'lines' | 'hypothesis' | 'choices'>;
};

