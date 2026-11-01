import type {
  ConversationEngineRequest,
  ConversationEngineResult,
  ConversationScript,
} from './conversationTypes';
import { DAY01_SELF_CONVERSATIONS } from './day01/selfConversations';
import { DAY01_CURIOUS_CONVERSATIONS } from './day01/curiousConversations';
import { DAY02_SELF_CONVERSATIONS } from './day02/selfConversations';
import { DAY02_CURIOUS_CONVERSATIONS } from './day02/curiousConversations';
import { DAY03_SELF_CONVERSATIONS } from './day03/selfConversations';
import { DAY03_CURIOUS_CONVERSATIONS } from './day03/curiousConversations';
import { DAY04_SELF_CONVERSATIONS } from './day04/selfConversations';
import { DAY04_CURIOUS_CONVERSATIONS } from './day04/curiousConversations';
import { DAY05_SELF_CONVERSATIONS } from './day05/selfConversations';
import { DAY05_CURIOUS_CONVERSATIONS } from './day05/curiousConversations';
import { DAY06_SELF_CONVERSATIONS } from './day06/selfConversations';
import { DAY06_CURIOUS_CONVERSATIONS } from './day06/curiousConversations';
import { DAY07_SELF_CONVERSATIONS } from './day07/selfConversations';
import { DAY07_CURIOUS_CONVERSATIONS } from './day07/curiousConversations';
import { DAY08_SELF_CONVERSATIONS } from './day08/selfConversations';
import { DAY08_CURIOUS_CONVERSATIONS } from './day08/curiousConversations';
import { DAY09_SELF_CONVERSATIONS } from './day09/selfConversations';
import { DAY09_CURIOUS_CONVERSATIONS } from './day09/curiousConversations';
import { DAY10_SELF_CONVERSATIONS } from './day10/selfConversations';
import { DAY10_CURIOUS_CONVERSATIONS } from './day10/curiousConversations';
import { DAY11_SELF_CONVERSATIONS } from './day11/selfConversations';
import { DAY11_CURIOUS_CONVERSATIONS } from './day11/curiousConversations';
import { DAY12_SELF_CONVERSATIONS } from './day12/selfConversations';
import { DAY12_CURIOUS_CONVERSATIONS } from './day12/curiousConversations';
import { DAY13_SELF_CONVERSATIONS } from './day13/selfConversations';
import { DAY13_CURIOUS_CONVERSATIONS } from './day13/curiousConversations';
import { DAY14_SELF_CONVERSATIONS } from './day14/selfConversations';
import { DAY14_CURIOUS_CONVERSATIONS } from './day14/curiousConversations';
import { DAY15_SELF_CONVERSATIONS } from './day15/selfConversations';
import { DAY16_SELF_CONVERSATIONS } from './day16/selfConversations';
import { DAY16_CURIOUS_CONVERSATIONS } from './day16/curiousConversations';
import { DAY17_SELF_CONVERSATIONS } from './day17/selfConversations';
import { DAY17_CURIOUS_CONVERSATIONS } from './day17/curiousConversations';
import { DAY18_SELF_CONVERSATIONS } from './day18/selfConversations';
import { DAY18_CURIOUS_CONVERSATIONS } from './day18/curiousConversations';
import { DAY19_SELF_CONVERSATIONS } from './day19/selfConversations';
import { DAY19_CURIOUS_CONVERSATIONS } from './day19/curiousConversations';
import { DAY20_SELF_CONVERSATIONS } from './day20/selfConversations';
import { DAY20_CURIOUS_CONVERSATIONS } from './day20/curiousConversations';
import { DAY21_SELF_CONVERSATIONS } from './day21/selfConversations';
import { DAY21_CURIOUS_CONVERSATIONS } from './day21/curiousConversations';
import { DAY22_SELF_CONVERSATIONS } from './day22/selfConversations';
import { DAY22_CURIOUS_CONVERSATIONS } from './day22/curiousConversations';
import { DAY23_SELF_CONVERSATIONS } from './day23/selfConversations';
import { DAY23_CURIOUS_CONVERSATIONS } from './day23/curiousConversations';
import { DAY24_SELF_CONVERSATIONS } from './day24/selfConversations';
import { DAY24_CURIOUS_CONVERSATIONS } from './day24/curiousConversations';
import { DAY25_SELF_CONVERSATIONS } from './day25/selfConversations';
import { DAY25_CURIOUS_CONVERSATIONS } from './day25/curiousConversations';
import { DAY26_SELF_CONVERSATIONS } from './day26/selfConversations';
import { DAY26_CURIOUS_CONVERSATIONS } from './day26/curiousConversations';
import { DAY27_SELF_CONVERSATIONS } from './day27/selfConversations';
import { DAY27_CURIOUS_CONVERSATIONS } from './day27/curiousConversations';
import { DAY28_SELF_CONVERSATIONS } from './day28/selfConversations';
import { DAY28_CURIOUS_CONVERSATIONS } from './day28/curiousConversations';
import { DAY29_SELF_CONVERSATIONS } from './day29/selfConversations';
import { DAY29_CURIOUS_CONVERSATIONS } from './day29/curiousConversations';
import { DAY30_SELF_CONVERSATIONS } from './day30/selfConversations';
import { DAY30_CURIOUS_CONVERSATIONS } from './day30/curiousConversations';
import { DAY15_CURIOUS_CONVERSATIONS } from './day15/curiousConversations';

const DAY_CONVERSATIONS: readonly ConversationScript[] = [
  ...DAY01_SELF_CONVERSATIONS,
  ...DAY01_CURIOUS_CONVERSATIONS,
  ...DAY02_SELF_CONVERSATIONS,
  ...DAY02_CURIOUS_CONVERSATIONS,
  ...DAY03_SELF_CONVERSATIONS,
  ...DAY03_CURIOUS_CONVERSATIONS,
  ...DAY04_SELF_CONVERSATIONS,
  ...DAY04_CURIOUS_CONVERSATIONS,
  ...DAY05_SELF_CONVERSATIONS,
  ...DAY05_CURIOUS_CONVERSATIONS,
  ...DAY06_SELF_CONVERSATIONS,
  ...DAY06_CURIOUS_CONVERSATIONS,
  ...DAY07_SELF_CONVERSATIONS,
  ...DAY07_CURIOUS_CONVERSATIONS,
  ...DAY08_SELF_CONVERSATIONS,
  ...DAY08_CURIOUS_CONVERSATIONS,
  ...DAY09_SELF_CONVERSATIONS,
  ...DAY09_CURIOUS_CONVERSATIONS,
  ...DAY10_SELF_CONVERSATIONS,
  ...DAY10_CURIOUS_CONVERSATIONS,
  ...DAY11_SELF_CONVERSATIONS,
  ...DAY11_CURIOUS_CONVERSATIONS,
  ...DAY12_SELF_CONVERSATIONS,
  ...DAY12_CURIOUS_CONVERSATIONS,
  ...DAY13_SELF_CONVERSATIONS,
  ...DAY13_CURIOUS_CONVERSATIONS,
  ...DAY14_SELF_CONVERSATIONS,
  ...DAY14_CURIOUS_CONVERSATIONS,
  ...DAY15_SELF_CONVERSATIONS,
  ...DAY15_CURIOUS_CONVERSATIONS,
  ...DAY16_SELF_CONVERSATIONS,
  ...DAY16_CURIOUS_CONVERSATIONS,
  ...DAY17_SELF_CONVERSATIONS,
  ...DAY17_CURIOUS_CONVERSATIONS,
  ...DAY18_SELF_CONVERSATIONS,
  ...DAY18_CURIOUS_CONVERSATIONS,
  ...DAY19_SELF_CONVERSATIONS,
  ...DAY19_CURIOUS_CONVERSATIONS,
  ...DAY20_SELF_CONVERSATIONS,
  ...DAY20_CURIOUS_CONVERSATIONS,
  ...DAY21_SELF_CONVERSATIONS,
  ...DAY21_CURIOUS_CONVERSATIONS,
  ...DAY22_SELF_CONVERSATIONS,
  ...DAY22_CURIOUS_CONVERSATIONS,
  ...DAY23_SELF_CONVERSATIONS,
  ...DAY23_CURIOUS_CONVERSATIONS,
  ...DAY24_SELF_CONVERSATIONS,
  ...DAY24_CURIOUS_CONVERSATIONS,
  ...DAY25_SELF_CONVERSATIONS,
  ...DAY25_CURIOUS_CONVERSATIONS,
  ...DAY26_SELF_CONVERSATIONS,
  ...DAY26_CURIOUS_CONVERSATIONS,
  ...DAY27_SELF_CONVERSATIONS,
  ...DAY27_CURIOUS_CONVERSATIONS,
  ...DAY28_SELF_CONVERSATIONS,
  ...DAY28_CURIOUS_CONVERSATIONS,
  ...DAY29_SELF_CONVERSATIONS,
  ...DAY29_CURIOUS_CONVERSATIONS,
  ...DAY30_SELF_CONVERSATIONS,
  ...DAY30_CURIOUS_CONVERSATIONS,
];

/**
 * 指定日の未閲覧会話を優先して選ぶ。
 * 旧テンプレート・記憶分類には一切フォールバックしない。
 */
export function hasUnseenDayConversation(
  day: number,
  seenConversationIds: readonly string[],
  category?: 'SELF' | 'CURIOUS',
): boolean {
  return DAY_CONVERSATIONS.some((conversation) => (
    conversation.day === day
    && (!category || conversation.category === category)
    && !seenConversationIds.includes(conversation.id)
  ));
}
export function runConversationEngine(
  request: ConversationEngineRequest,
): ConversationEngineResult {
  const forDay = DAY_CONVERSATIONS.filter((conversation) => conversation.day === request.day);
  const unseen = forDay.filter((conversation) => !request.seenConversationIds.includes(conversation.id));
  const preferred = request.preferredCategory
    ? unseen.filter((conversation) => conversation.category === request.preferredCategory)
    : [];
  // 出会いのSELFを一つ残し、2会話目で興味を聞く。総数はSELF6 + CURIOUS6のまま。
  if (request.day === 1) {
    const first = unseen.find((conversation) => conversation.id === 'DAY01_SELF_01');
    const interest = unseen.find((conversation) => conversation.id === 'DAY01_CURIOUS_03');
    if (request.preferredCategory === 'SELF' && first) return { intent: request.intent, conversation: first };
    if (request.preferredCategory === 'CURIOUS' && interest) return { intent: request.intent, conversation: interest };
    if (!request.preferredCategory && (first || interest)) return { intent: request.intent, conversation: first ?? interest };
  }
  const unseenSelf = unseen.filter((conversation) => conversation.category === 'SELF');
  const candidates = preferred.length > 0
    ? preferred
    : request.preferredCategory
      ? []
      : unseenSelf.length > 0 ? unseenSelf : (unseen.length > 0 ? unseen : forDay);
  const random = request.random ?? Math.random;
  const index = candidates.length > 0
    ? Math.min(candidates.length - 1, Math.floor(random() * candidates.length))
    : -1;

  return {
    intent: request.intent,
    conversation: index >= 0 ? candidates[index] : undefined,
  };
}
