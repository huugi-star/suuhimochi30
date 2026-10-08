export type SuuhimochiDiaryEntry = {
  date: string;
  day: number;
  text: string;
  createdAt: string;
  sources: {
    conversationTopics: string[];
    conversationQuotes: string[];
    learnedWords: string[];
    humanNotes: string[];
  };
};

type CreateSuuhimochiDiaryOptions = {
  date: string;
  day: number;
  conversationTopics?: readonly string[];
  conversationQuotes?: readonly string[];
  learnedWords?: readonly string[];
  humanNotes?: readonly string[];
  createdAt?: string;
};

function clean(items: readonly string[] | undefined, limit: number) {
  return [...new Set((items ?? []).map((item) => item.trim()).filter(Boolean))].slice(0, limit);
}

function shorten(value: string, length = 30) {
  return value.length > length ? `${value.slice(0, length)}…` : value;
}

/**
 * Keeps a small, deterministic first version of Suuhimochi's diary.  The
 * source snapshot is saved with the text so a richer writer can replace this
 * later without changing the journal or conversation data.
 */
export function createSuuhimochiDiary(options: CreateSuuhimochiDiaryOptions): SuuhimochiDiaryEntry {
  const conversationTopics = clean(options.conversationTopics, 4);
  const conversationQuotes = clean(options.conversationQuotes, 4);
  const learnedWords = clean(options.learnedWords, 6);
  const humanNotes = clean(options.humanNotes, 4);
  const lines: string[] = [];

  if (conversationTopics[0]) {
    lines.push(`きょう、人間さんと「${shorten(conversationTopics[0], 22)}」のことを話したの。`);
  } else if (humanNotes[0]) {
    lines.push(`人間さんは「${shorten(humanNotes[0], 24)}」を進めていたみたい。`);
  } else {
    lines.push('きょうも、人間さんと同じ部屋で過ごしたの。');
  }

  if (learnedWords[0]) {
    lines.push(`「${shorten(learnedWords[0], 18)}」ということばを覚えたよ。`);
  } else if (conversationQuotes[0]) {
    lines.push(`人間さんの「${shorten(conversationQuotes[0], 24)}」が、少し心に残っているの。`);
  }

  lines.push(
    conversationTopics.length > 0 || learnedWords.length > 0 || humanNotes.length > 0
      ? 'まだ分からないこともあるけど、人間さんのことを少し知れた気がするの。'
      : 'まだ分からないことも多いから、明日も少し見ていたいの。',
  );

  return {
    date: options.date,
    day: options.day,
    text: lines.join('\n'),
    createdAt: options.createdAt ?? new Date().toISOString(),
    sources: {
      conversationTopics,
      conversationQuotes,
      learnedWords,
      humanNotes,
    },
  };
}

export function sanitizeSuuhimochiDiaries(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {} as Record<string, SuuhimochiDiaryEntry>;
  const entries: Array<[string, SuuhimochiDiaryEntry]> = [];
  for (const [date, candidate] of Object.entries(value)) {
    if (!candidate || typeof candidate !== 'object') continue;
    const diary = candidate as Partial<SuuhimochiDiaryEntry>;
    if (typeof diary.text !== 'string' || !diary.text.trim()) continue;
    const sources = diary.sources && typeof diary.sources === 'object' ? diary.sources : undefined;
    entries.push([date, {
      date,
      day: Math.max(1, Math.min(30, Math.floor(Number(diary.day) || 1))),
      text: diary.text,
      createdAt: typeof diary.createdAt === 'string' ? diary.createdAt : '',
      sources: {
        conversationTopics: clean(sources?.conversationTopics, 4),
        conversationQuotes: clean(sources?.conversationQuotes, 4),
        learnedWords: clean(sources?.learnedWords, 6),
        humanNotes: clean(sources?.humanNotes, 4),
      },
    }]);
  }
  return Object.fromEntries(entries);
}
