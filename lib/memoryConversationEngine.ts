import { MEMORY_CONVERSATION_TEMPLATES, pickMemoryCallout } from './memoryConversationData';
import type { WordEntry } from './conversationTypes';
import type {
  MemoryCalloutKind,
  MemoryConversationBuildContext,
  MemoryConversationCandidate,
  MemoryConversationFamily,
  MemoryConversationRecord,
  MemoryConversationTemplate,
  MemoryEvidence,
} from './memoryConversationTypes';

const ATTRIBUTE_META_KEYS = new Set([
  'categoryLabel',
  'subCategoryId',
  'subCategoryLabel',
  'feeling',
  'recency',
  'learnedBy',
  'askedCategory',
  'promptedQuestionId',
  'promptedEntityKind',
  'promptedGroup',
  'promptedStarterIndex',
  'promptedStarterKey',
  'promptedStarterPrompt',
  'promptedLastAxisId',
  'promptedLastChoiceId',
  'promptedLastMemoryLabel',
]);

const VALUE_GROUPS: Record<string, string> = {
  story: 'story', world: 'story', setting: 'story', plot: 'story',
  writing: 'language', lyrics: 'language', words: 'language', language: 'language',
  reread: 'repeat', repeat: 'repeat', replay: 'repeat', rewatch: 'repeat', loop: 'repeat', current: 'repeat',
  character: 'character', people: 'character', relationship: 'character',
  play: 'active', create: 'active', practice: 'active', participate: 'active',
  watch: 'observe', listen: 'observe', view: 'observe', browse: 'observe',
  ideas: 'thought', knowledge: 'thought', learn: 'thought', think: 'thought',
  art: 'expression', visual: 'expression', sound: 'expression', music: 'expression', performance: 'expression',
};

export type MemoryConversationSelectionState = {
  recentTemplateIds: readonly string[];
  recentWordKeys: readonly string[];
  recentPairKeys: readonly string[];
  recentCalloutKinds: readonly MemoryCalloutKind[];
  records: readonly MemoryConversationRecord[];
};

function normalizedKey(value: string) {
  return value.normalize('NFKC').trim().toLowerCase();
}

export function memoryWordKey(word: WordEntry) {
  return normalizedKey(word.surface);
}

export function memoryPairKey(left: string, right: string) {
  return [normalizedKey(left), normalizedKey(right)].sort().join('::');
}

export function getStructuredMemoryEvidence(word: WordEntry): MemoryEvidence[] {
  const wordKey = memoryWordKey(word);
  return Object.entries(word.attributes)
    .filter(([key, value]) => (
      Boolean(value)
      && !key.endsWith('Label')
      && !ATTRIBUTE_META_KEYS.has(key)
      && Boolean(word.attributes[`${key}Label`])
    ))
    .map(([attributeKey, value]) => ({
      wordKey,
      wordSurface: word.surface,
      attributeKey,
      value,
      label: word.attributes[`${attributeKey}Label`] ?? value,
    }));
}

function axisFamily(key: string) {
  const lower = key.toLowerCase();
  const suffixes = ['hook', 'relation', 'style', 'reason', 'response', 'distance', 'stance', 'watch', 'fun', 'role', 'entry', 'depth', 'mood'];
  return suffixes.find((suffix) => lower.endsWith(suffix)) ?? lower;
}

function semanticGroup(evidence: MemoryEvidence) {
  const value = normalizedKey(evidence.value);
  return VALUE_GROUPS[value] ?? `${axisFamily(evidence.attributeKey)}:${value}`;
}

function randomItem<T>(items: readonly T[], random: () => number): T | undefined {
  if (!items.length) return undefined;
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))];
}

function chooseCalloutKind(template: MemoryConversationTemplate, state: MemoryConversationSelectionState, random: () => number) {
  const fresh = template.calloutKinds.filter((kind) => !state.recentCalloutKinds.slice(0, 3).includes(kind));
  return randomItem(fresh.length ? fresh : template.calloutKinds, random) ?? 'own-thought';
}

function buildCandidate(
  template: MemoryConversationTemplate,
  context: MemoryConversationBuildContext,
  state: MemoryConversationSelectionState,
  random: () => number,
): MemoryConversationCandidate {
  const built = template.build(context);
  const calloutKind = chooseCalloutKind(template, state, random);
  return {
    templateId: template.id,
    family: template.family,
    calloutKind,
    callout: pickMemoryCallout(calloutKind, random),
    wordKeys: [memoryWordKey(context.wordA), ...(context.wordB ? [memoryWordKey(context.wordB)] : [])],
    evidence: context.evidence.map((item) => ({ ...item })),
    hypothesis: built.hypothesis,
    lines: [...built.lines],
    choices: built.choices.map((choice) => ({ ...choice, reply: [...choice.reply] })),
    ...(context.previous ? { continuationOf: context.previous.id } : {}),
  };
}

function evidenceSignature(items: readonly MemoryEvidence[]) {
  return items
    .map((item) => `${item.wordKey}:${item.attributeKey}:${item.value}`)
    .sort()
    .join('|');
}

function wasCorrectedOrDenied(candidate: MemoryConversationCandidate, records: readonly MemoryConversationRecord[]) {
  const signature = evidenceSignature(candidate.evidence);
  return records.some((record) => (
    (record.reaction === 'deny' || record.reaction === 'correct')
    && record.templateId === candidate.templateId
    && evidenceSignature(record.evidence) === signature
  ));
}

function templateForFamily(family: MemoryConversationFamily, state: MemoryConversationSelectionState, random: () => number) {
  const all = MEMORY_CONVERSATION_TEMPLATES.filter((item) => item.family === family);
  const fresh = all.filter((item) => !state.recentTemplateIds.includes(item.id));
  return randomItem(fresh.length ? fresh : all, random);
}

function continuationContext(words: readonly WordEntry[], state: MemoryConversationSelectionState, random: () => number): MemoryConversationBuildContext | null {
  const byKey = new Map(words.map((word) => [memoryWordKey(word), word]));
  const records = state.records.filter((record) => !record.usedAsContinuation && record.wordKeys.every((key) => byKey.has(key)));
  const previous = randomItem(records.slice(-12), random);
  if (!previous) return null;
  const wordA = byKey.get(previous.wordKeys[0] ?? '');
  if (!wordA) return null;
  const wordB = previous.wordKeys[1] ? byKey.get(previous.wordKeys[1]) : undefined;
  const evidence = previous.evidence.filter((item) => byKey.has(item.wordKey));
  return { wordA, ...(wordB ? { wordB } : {}), evidence, previous };
}

function pairContexts(words: readonly WordEntry[], state: MemoryConversationSelectionState) {
  const common: MemoryConversationBuildContext[] = [];
  const contrast: MemoryConversationBuildContext[] = [];
  for (let leftIndex = 0; leftIndex < words.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < words.length; rightIndex += 1) {
      const wordA = words[leftIndex];
      const wordB = words[rightIndex];
      if (!wordA || !wordB || memoryWordKey(wordA) === memoryWordKey(wordB)) continue;
      const pairKey = memoryPairKey(wordA.surface, wordB.surface);
      const factsA = getStructuredMemoryEvidence(wordA);
      const factsB = getStructuredMemoryEvidence(wordB);
      for (const factA of factsA) {
        for (const factB of factsB) {
          if (semanticGroup(factA) === semanticGroup(factB)) common.push({ wordA, wordB, evidence: [factA, factB] });
          else if (
            axisFamily(factA.attributeKey) === axisFamily(factB.attributeKey)
            && !semanticGroup(factA).includes(':')
            && !semanticGroup(factB).includes(':')
          ) contrast.push({ wordA, wordB, evidence: [factA, factB] });
        }
      }
      if (state.recentPairKeys.includes(pairKey)) {
        common.splice(0, common.length, ...common.filter((item) => memoryPairKey(item.wordA.surface, item.wordB?.surface ?? '') !== pairKey));
        contrast.splice(0, contrast.length, ...contrast.filter((item) => memoryPairKey(item.wordA.surface, item.wordB?.surface ?? '') !== pairKey));
      }
    }
  }
  return { common, contrast };
}

/**
 * Builds a structured-memory conversation without reading free-form logs.
 * UNKNOWN words and words without an answered semantic axis are deliberately
 * excluded because Suuhimochi does not yet know enough to reason from them.
 */
export function buildMemoryConversationCandidate(
  sourceWords: readonly WordEntry[],
  state: MemoryConversationSelectionState,
  random: () => number = Math.random,
): MemoryConversationCandidate | null {
  const words = sourceWords.filter((word) => word.category !== 'UNKNOWN' && getStructuredMemoryEvidence(word).length > 0);
  if (!words.length) return null;

  const contextsByFamily = new Map<MemoryConversationFamily, MemoryConversationBuildContext[]>();
  const continuation = continuationContext(words, state, random);
  if (continuation) contextsByFamily.set('continue-previous', [continuation]);

  const oneFactWords = words.map((wordA) => ({ wordA, evidence: getStructuredMemoryEvidence(wordA) }));
  contextsByFamily.set('deepen-one', oneFactWords.map((item) => ({ wordA: item.wordA, evidence: [randomItem(item.evidence, random) ?? item.evidence[0]!] })));
  contextsByFamily.set('relationship-hypothesis', [...(contextsByFamily.get('deepen-one') ?? [])]);
  contextsByFamily.set('connect-one', oneFactWords.filter((item) => item.evidence.length >= 2).map((item) => ({ wordA: item.wordA, evidence: item.evidence.slice(0, 2) })));

  const pair = pairContexts(words, state);
  if (pair.common.length) contextsByFamily.set('common-two', pair.common);
  if (pair.contrast.length) contextsByFamily.set('contrast-two', pair.contrast);

  const familyOrder: MemoryConversationFamily[] = [
    'deepen-one', 'connect-one', 'common-two', 'contrast-two', 'relationship-hypothesis', 'continue-previous',
  ];
  const recentFamilies = state.records.slice(-3).map((record) => record.family);
  const available = familyOrder.filter((family) => (contextsByFamily.get(family)?.length ?? 0) > 0);
  const freshFamilies = available.filter((family) => !recentFamilies.includes(family));
  const family = randomItem(freshFamilies.length ? freshFamilies : available, random);
  if (!family) return null;

  const contexts = contextsByFamily.get(family) ?? [];
  const preferredContexts = contexts.filter((context) => {
    const keys = [memoryWordKey(context.wordA), ...(context.wordB ? [memoryWordKey(context.wordB)] : [])];
    return keys.every((key) => !state.recentWordKeys.slice(0, 2).includes(key));
  });
  let context = randomItem(preferredContexts.length ? preferredContexts : contexts, random);
  if (!context) return null;
  if (family === 'deepen-one' || family === 'relationship-hypothesis') {
    const facts = getStructuredMemoryEvidence(context.wordA);
    const selected = randomItem(facts, random);
    if (selected) context = { ...context, evidence: [selected] };
  }
  if (family === 'connect-one') {
    const facts = getStructuredMemoryEvidence(context.wordA);
    const shuffled = [...facts].sort(() => random() - 0.5);
    context = { ...context, evidence: shuffled.slice(0, 2) };
  }
  const firstTemplate = templateForFamily(family, state, random);
  if (!firstTemplate) return null;
  const familyTemplates = MEMORY_CONVERSATION_TEMPLATES.filter((item) => item.family === family);
  const startIndex = Math.max(0, familyTemplates.findIndex((item) => item.id === firstTemplate.id));
  for (let offset = 0; offset < familyTemplates.length; offset += 1) {
    const selectedTemplate = familyTemplates[(startIndex + offset) % familyTemplates.length];
    if (!selectedTemplate) continue;
    const candidate = buildCandidate(selectedTemplate, context, state, random);
    if (!wasCorrectedOrDenied(candidate, state.records)) return candidate;
  }
  return null;
}
