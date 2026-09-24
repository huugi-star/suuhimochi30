import type { DialogueScript } from './miniDialogueTypes';

export const closetScare: DialogueScript = {
  id: 'closet-scare',
  startNodeId: 'start',
  slots: {
    person: { class: 'PERSON' },
  },
  nodes: [
    {
      id: 'start',
      type: 'character',
      text: 'ねえねえ……さっき怖いことがあったの。',
      motion: 'nervous',
      next: 'ask',
    },
    {
      id: 'ask',
      type: 'choice',
      choices: [{ text: 'どうしたの？', next: 'reveal' }],
    },
    {
      id: 'reveal',
      type: 'character',
      text: '押し入れのすき間から{person}がこっち見てたの！',
      motion: 'surprised',
      next: 'reaction',
    },
    {
      id: 'reaction',
      type: 'choice',
      choices: [
        { text: 'こわいね', next: 'scared' },
        { text: '気のせいだよ', next: 'relief' },
      ],
    },
    {
      id: 'scared',
      type: 'character',
      text: 'やっぱり怖いの……。今日は押し入れを見ないでおくの。',
      motion: 'nervous',
      next: 'finish',
    },
    {
      id: 'relief',
      type: 'character',
      text: 'そっか。気のせいなら、ちょっと安心なの。',
      motion: 'idle',
      next: 'finish',
    },
    { id: 'finish', type: 'end' },
  ],
};
