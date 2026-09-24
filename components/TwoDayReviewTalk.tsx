'use client';

import { X } from 'lucide-react';
import { PotenoStrategyReview } from '@/components/PotenoStrategyReview';
import type { DailyProgressRecord } from '@/lib/dailyProgress';
import type {
  TwoDayReviewGoalType,
  TwoDayReviewRecord,
} from '@/lib/twoDayReview';

type TwoDayReviewTalkProps = {
  onClose: () => void;
  currentDay: number;
  activityDate: string;
  goalType: TwoDayReviewGoalType | null;
  dailyProgressRecords: DailyProgressRecord[];
  journalNotes: Record<string, string[]>;
  existingReviews: TwoDayReviewRecord[];
  onSave: (record: TwoDayReviewRecord) => void;
};

/** A home-room conversation: Suuhimochi asks the same review before Poteno uses it for strategy. */
export function TwoDayReviewTalk({
  onClose,
  currentDay,
  activityDate,
  goalType,
  dailyProgressRecords,
  journalNotes,
  existingReviews,
  onSave,
}: TwoDayReviewTalkProps) {
  return (
    <section className="two-day-review-talk" aria-label="すうひもちの二日後の振り返り">
      <div className="two-day-review-talk-card">
        <button className="two-day-review-talk-close" type="button" aria-label="振り返りを閉じる" onClick={onClose}>
          <X size={18} />
        </button>
        <header className="two-day-review-talk-heading">
          <span>すうひもち</span>
          <h2>2日前のこと、聞かせてなの。</h2>
          <p>そのあと、どうなったか気になってるの。</p>
        </header>
        <PotenoStrategyReview
          currentDay={currentDay}
          activityDate={activityDate}
          goalType={goalType}
          records={dailyProgressRecords}
          journalNotes={journalNotes}
          existingReviews={existingReviews}
          onSave={onSave}
        />
      </div>
      <style>{`
        .two-day-review-talk { position: absolute; z-index: 26; inset: 0; display: grid; place-items: center; padding: 18px; background: rgba(41, 33, 27, .32); backdrop-filter: blur(2px); animation: two-day-review-talk-in .22s ease both; }
        .two-day-review-talk-card { position: relative; width: min(470px, calc(100vw - 34px)); max-height: min(78vh, 650px); overflow-y: auto; padding: 22px 20px 19px; border: 3px solid #866049; border-radius: 26px 23px 29px 22px; color: #563b2d; background: #fffdf3; box-shadow: 0 8px 0 rgba(82, 49, 32, .27), 0 25px 58px rgba(24, 15, 10, .32); }
        .two-day-review-talk-heading { padding: 0 37px 13px 3px; border-bottom: 1px dashed rgba(137, 89, 61, .42); }
        .two-day-review-talk-heading span { display: inline-block; padding: 4px 9px; border-radius: 999px; color: #fffaf1; background: #bd7957; font-size: .68rem; font-weight: 900; letter-spacing: .08em; }
        .two-day-review-talk-heading h2 { margin: 8px 0 2px; font-family: 'Yu Mincho', serif; font-size: clamp(1.08rem, 3.2vw, 1.38rem); font-weight: 900; line-height: 1.35; }
        .two-day-review-talk-heading p { margin: 0; color: #886c58; font-size: .78rem; font-weight: 750; }
        .two-day-review-talk-close { position: absolute; top: 13px; right: 13px; display: grid; width: 32px; height: 32px; place-items: center; border: 1px solid rgba(120, 78, 54, .42); border-radius: 50%; color: #805d49; background: #fff9e9; box-shadow: 0 2px 0 rgba(92, 57, 39, .14); }
        .two-day-review-talk-close:active { transform: translateY(2px); box-shadow: none; }
        @keyframes two-day-review-talk-in { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: none; } }
        @media (max-width: 700px) { .two-day-review-talk { align-items: end; padding: 12px; } .two-day-review-talk-card { width: 100%; max-height: 74svh; padding: 19px 15px 15px; border-width: 2px; } }
      `}</style>
    </section>
  );
}
