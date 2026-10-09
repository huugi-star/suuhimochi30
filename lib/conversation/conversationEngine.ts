import type {
  ConversationEngineRequest,
  ConversationEngineResult,
  ConversationScript,
} from './conversationTypes';
import { DAY01_SELF_CONVERSATIONS } from './day01/selfConversations';
import { DAY01_CURIOUS_CONVERSATIONS } from './day01/curiousConversations';
import { DAY02_SELF_CONVERSATIONS } from './day02/selfConversations';
import { DAY02_CURIOUS_CONVERSATIONS } from './day02/curiousConversations';

const DAY_CONVERSATIONS: readonly ConversationScript[] = [
  ...DAY01_SELF_CONVERSATIONS,
  ...DAY01_CURIOUS_CONVERSATIONS,
  ...DAY02_SELF_CONVERSATIONS,
  ...DAY02_CURIOUS_CONVERSATIONS,
];

/**
 * 指定日の未閲覧会話を優先して選ぶ。
 * 旧テンプレート・記憶分類には一切フォールバックしない。
 */
export function runConversationEngine(
  request: ConversationEngineRequest,
): ConversationEngineResult {
  const forDay = DAY_CONVERSATIONS.filter((conversation) => conversation.day === request.day);
  const unseen = forDay.filter((conversation) => !request.seenConversationIds.includes(conversation.id));
  // Day1は「自分を知ってもらう前半」から「人間さんを知る後半」へ進む。
  // random の値で後半が先に出ないよう、SELF会話を先に使い切る。
  const unseenSelf = unseen.filter((conversation) => conversation.category === 'SELF');
  const candidates = unseenSelf.length > 0 ? unseenSelf : (unseen.length > 0 ? unseen : forDay);
  const random = request.random ?? Math.random;
  const index = candidates.length > 0
    ? Math.min(candidates.length - 1, Math.floor(random() * candidates.length))
    : -1;

  return {
    intent: request.intent,
    conversation: index >= 0 ? candidates[index] : undefined,
  };
}
