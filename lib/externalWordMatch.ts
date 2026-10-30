/** Local lexical evidence only; never infers a user's interest, a homophone's meaning or new facts. */
export const externalWordKey = (value: string) => value.normalize('NFKC').toLowerCase()
  .replace(/[ァ-ヶ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60)).replace(/\s+/gu, ' ').trim();
const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('ja', { granularity: 'word' }) : null;
const titleWords = new Map<string, ReadonlySet<string>>();
const delimiter = (char: string) => !char || /[\s\p{P}\p{S}]/u.test(char);
const sameScriptEdge = (edge: string, neighbour: string) => Boolean(neighbour) && (
  /[\p{Script=Katakana}ー]/u.test(edge) && /[\p{Script=Katakana}ー]/u.test(neighbour)
  || /\p{Script=Han}/u.test(edge) && /\p{Script=Han}/u.test(neighbour)
  || /[a-z0-9]/i.test(edge) && /[a-z0-9]/i.test(neighbour));

/** Prepare each public title once, rather than resegmenting it for every word in a growing dictionary. */
function wordsInTitle(text: string): ReadonlySet<string> {
  const cached = titleWords.get(text); if (cached) return cached;
  const input = text.normalize('NFKC'), keys = new Set([externalWordKey(input)]);
  const segments = segmenter ? Array.from(segmenter.segment(input)) : [];
  if (!segmenter) for (const part of input.split(/[\s\p{P}\p{S}]+/u)) keys.add(externalWordKey(part));
  for (let start = 0; start < segments.length; start++) {
    if (!segments[start].isWordLike) continue;
    for (let end = start; end < segments.length; end++) {
      const from = segments[start].index, to = segments[end].index + segments[end].segment.length;
      const span = input.slice(from, to), key = externalWordKey(span);
      if (key.length > 64) break; // Learned words are at most 30 characters; leave room for readings/phrases.
      if (!segments[end].isWordLike) continue;
      const before = input[from - 1] ?? '', after = input[to] ?? '';
      if (sameScriptEdge(span[0], before) || sameScriptEdge(span.at(-1) ?? '', after)) continue;
      // ICU can split unknown words (e.g. まりも -> まり/も). A short kana token alone is not reliable context.
      if ((key.length === 1 || /^[ぁ-ゖー]{1,3}$/u.test(key)) && !(delimiter(before) && delimiter(after))) continue;
      keys.add(key);
    }
  }
  if (titleWords.size >= 512) titleWords.delete(titleWords.keys().next().value!);
  titleWords.set(text, keys); return keys;
}

/** Match complete segmented spans, never character substrings. Fail closed without Japanese segmentation. */
export function hasExternalWord(text: string, term: string): boolean {
  const needle = externalWordKey(term);
  return Boolean(needle) && wordsInTitle(text).has(needle);
}

export function externalTopicMentions(topic: { title: string; relatedTerms?: readonly string[] }, term: string): boolean {
  const key = externalWordKey(term);
  return key.length >= 2 && (hasExternalWord(topic.title, term)
    || (topic.relatedTerms ?? []).some((related) => externalWordKey(related) === key));
}
