export const PERSON_COMBO_SECONDS = 15;

export function sanitizeWordComboKanaInput(value: string, maxLength: number) {
  return Array.from(value.normalize('NFKC'))
    .filter((character) => /[\u3040-\u30ffー・、。！？\s]/u.test(character))
    .join('')
    .slice(0, maxLength);
}

export type PersonComboQuestion = {
  id: string;
  kind: 'deepDive' | 'derived';
  parentWordId: string;
  parentSurface: string;
  subcategory: string;
  lines: string[];
  maxLength: number;
};

export type PersonComboAnswerResult = {
  ok: boolean;
  questionId: string;
  kind: 'deepDive' | 'derived';
  /** 開発者モード用の一時コンボ。記憶・報酬には保存しない。 */
  preview?: boolean;
  createdWordId?: string;
  wordId?: string;
};

export type WordComboRewardState = {
  wordFragments: number;
  gachaCoins: number;
  wordComboRewardIds: string[];
};

export type WordComboRewardResult = WordComboRewardState & {
  fragmentAwarded: boolean;
  convertedCoins: number;
  perfectBonusCoins: number;
};

export function awardWordComboAnswer(
  current: WordComboRewardState,
  answerRewardId: string,
  perfectRewardId?: string,
): WordComboRewardResult {
  const rewardIds = new Set(current.wordComboRewardIds);
  let wordFragments = Math.max(0, Math.floor(current.wordFragments)) % 6;
  let gachaCoins = Math.max(0, Math.floor(current.gachaCoins));
  let fragmentAwarded = false;
  let convertedCoins = 0;
  let perfectBonusCoins = 0;

  if (!rewardIds.has(answerRewardId)) {
    rewardIds.add(answerRewardId);
    fragmentAwarded = true;
    wordFragments += 1;
    if (wordFragments >= 6) {
      wordFragments -= 6;
      gachaCoins += 1;
      convertedCoins = 1;
    }
  }

  if (perfectRewardId && !rewardIds.has(perfectRewardId)) {
    rewardIds.add(perfectRewardId);
    gachaCoins += 1;
    perfectBonusCoins = 1;
  }

  return {
    wordFragments,
    gachaCoins,
    wordComboRewardIds: [...rewardIds],
    fragmentAwarded,
    convertedCoins,
    perfectBonusCoins,
  };
}
