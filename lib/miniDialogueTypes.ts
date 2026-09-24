export type SlotClass =
  | 'PERSON'
  | 'ANIMAL'
  | 'FOOD'
  | 'OBJECT'
  | 'CLOTHING'
  | 'TECH'
  | 'PLACE'
  | 'VEHICLE'
  | 'ACTIVITY'
  | 'SPORTS'
  | 'WORK'
  | 'SCHOOL'
  | 'GAME_MEDIA'
  | 'AV_MEDIA'
  | 'KNOWLEDGE'
  | 'BODY'
  | 'EMOTION'
  | 'NATURE_TIME'
  | 'MONEY'
  | 'EVENT'
  | 'OTHER';

/**
 * Character presentation for a mini-dialogue line.  The runner treats this
 * as display metadata only; the game view maps it to the zoom face/arm parts.
 */
export type DialogueMotion =
  | 'idle'
  | 'happy'
  | 'sad'
  | 'angry'
  | 'thinking'
  | 'nervous'
  | 'surprised';

export type DialogueChoice = {
  text: string;
  next: string;
};

export type DialogueNode =
  | { id: string; type: 'character'; text: string; motion?: DialogueMotion; next: string }
  | { id: string; type: 'choice'; choices: DialogueChoice[] }
  | { id: string; type: 'end' };

export type DialogueRuntime = {
  scriptId: string;
  nodeId: string;
  slots: Record<string, string>;
};

export interface DialogueScript {
  id: string;
  startNodeId: string;
  nodes: DialogueNode[];
  slots: Record<string, { class: SlotClass }>;
}
