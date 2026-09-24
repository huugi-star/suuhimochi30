export type MochiState = 'idle' | 'walk' | 'sit' | 'window' | 'roll' | 'look' | 'sleep';

export const MOCHI_STATES: { id: MochiState; label: string }[] = [
  { id: 'idle', label: 'ぼんやり' }, { id: 'walk', label: '歩いている' },
  { id: 'sit', label: '座っている' }, { id: 'window', label: '窓を見ている' },
  { id: 'roll', label: 'ごろごろしている' }, { id: 'look', label: 'こちらを見ている' },
  { id: 'sleep', label: 'うとうとしている' },
];

export const TYPE_ACCENTS: Record<number, string> = {
  1: '#e66f51', 2: '#dea84f', 3: '#77b69c', 4: '#609dbe', 5: '#8778bc',
  6: '#d47391', 7: '#7190b6', 8: '#b47a4d', 9: '#728b65',
};
