export type TwoDayReviewGoalType = 'LEARN' | 'MAKE' | 'REACH' | 'HABIT';
export type TwoDayReviewMode = 'INDIVIDUAL' | 'SUMMARY';

export const TWO_DAY_REVIEW_GOAL_TYPES: readonly {
  value: TwoDayReviewGoalType;
  icon: string;
  label: string;
}[] = [
  { value: 'LEARN', icon: '📚', label: '学ぶ・身につける' },
  { value: 'MAKE', icon: '🛠️', label: '作る・完成させる' },
  { value: 'REACH', icon: '📣', label: '認知を広げる・結果につなげる' },
  { value: 'HABIT', icon: '🔧', label: '習慣・環境を変える' },
];

export const TWO_DAY_REVIEW_GOAL_TYPE_LABELS: Record<
  TwoDayReviewGoalType,
  string
> = {
  LEARN: '📚 学ぶ・身につける',
  MAKE: '🛠️ 作る・完成させる',
  REACH: '📣 認知を広げる・結果につなげる',
  HABIT: '🔧 習慣・環境を変える',
};

export type TwoDayReviewAnswer = {
  item: string;
  answer: string;
};

export type TwoDayReviewRecord = {
  id: string;
  targetDay: number;
  targetDate: string;
  items: string[];
  goalType: TwoDayReviewGoalType;
  mode: TwoDayReviewMode;
  answers: TwoDayReviewAnswer[];
  completedAt: string;
};
