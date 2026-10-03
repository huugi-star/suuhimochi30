export interface SuuhimochiConversion {
  source: string;
  converted: string;
  lastUsedAt: number;
}

const CONVERSION_STORAGE_KEY = 'suuhimochi-keyboard-conversions-v1';
export const SUUHIMOCHI_KEYBOARD_GUIDE_KEY = 'suuhimochi-keyboard-guide-seen-v1';

function isConversion(value: unknown): value is SuuhimochiConversion {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<SuuhimochiConversion>;
  return typeof item.source === 'string'
    && typeof item.converted === 'string'
    && typeof item.lastUsedAt === 'number';
}

export function loadSuuhimochiConversions(): SuuhimochiConversion[] {
  if (typeof window === 'undefined') return [];
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(CONVERSION_STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isConversion) : [];
  } catch {
    return [];
  }
}

function storeSuuhimochiConversions(conversions: SuuhimochiConversion[]) {
  try {
    window.localStorage.setItem(CONVERSION_STORAGE_KEY, JSON.stringify(conversions));
  } catch {
    // Private browsing and storage limits must not prevent text entry.
  }
}

export function saveSuuhimochiConversion(source: string, converted: string): SuuhimochiConversion[] {
  if (!source || !converted || source === converted) return loadSuuhimochiConversions();
  const now = Date.now();
  const next = loadSuuhimochiConversions()
    .filter((item) => !(item.source === source && item.converted === converted));
  next.push({ source, converted, lastUsedAt: now });
  next.sort((left, right) => right.lastUsedAt - left.lastUsedAt);
  storeSuuhimochiConversions(next);
  return next;
}

export function markSuuhimochiConversionUsed(source: string, converted: string): SuuhimochiConversion[] {
  const current = loadSuuhimochiConversions();
  const now = Date.now();
  const next = current.map((item) => (
    item.source === source && item.converted === converted
      ? { ...item, lastUsedAt: now }
      : item
  )).sort((left, right) => right.lastUsedAt - left.lastUsedAt);
  storeSuuhimochiConversions(next);
  return next;
}

export function findSuuhimochiConversions(
  conversions: SuuhimochiConversion[],
  source: string,
): SuuhimochiConversion[] {
  const seen = new Set<string>();
  return conversions
    .filter((item) => item.source === source)
    .sort((left, right) => right.lastUsedAt - left.lastUsedAt)
    .filter((item) => {
      if (seen.has(item.converted)) return false;
      seen.add(item.converted);
      return true;
    });
}
