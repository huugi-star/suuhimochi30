/** Bounded public error metadata only; never retain a response body or arbitrary exception text. */
export type InfoHubFailure = { error: string; upstreamStatus?: number; cloudflareCode?: number; rayId?: string; retryAt?: string };
export const INFO_HUB_RETRY_MS = 5 * 60000;
export const INFO_HUB_RESOURCE_RETRY_MS = 60 * 60000;
export function sanitizeInfoHubFailure(value: unknown): InfoHubFailure | null {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  if (typeof row.error !== 'string' || !/^(HTTP_\d{3}|NETWORK|TIMEOUT|INVALID_JSON|INVALID_FEED|INVALID_RESPONSE|TOO_LARGE)$/.test(row.error)) return null;
  return { error: row.error,
    ...(Number.isInteger(row.upstreamStatus) && Number(row.upstreamStatus) >= 400 && Number(row.upstreamStatus) <= 599 ? { upstreamStatus: Number(row.upstreamStatus) } : {}),
    ...(Number.isInteger(row.cloudflareCode) && Number(row.cloudflareCode) >= 1000 && Number(row.cloudflareCode) < 2000 ? { cloudflareCode: Number(row.cloudflareCode) } : {}),
    ...(typeof row.rayId === 'string' && /^[a-f\d-]{8,80}$/i.test(row.rayId) ? { rayId: row.rayId } : {}),
    ...(typeof row.retryAt === 'string' && Number.isFinite(Date.parse(row.retryAt)) ? { retryAt: row.retryAt } : {}) };
}
export async function publicResponseFailure(response: Response, now: Date): Promise<InfoHubFailure> {
  let body: Record<string, unknown> = {};
  try {
    // Cloudflare's resource-limit response is small. Stop reading oversized error responses.
    const reader = response.body?.getReader(); let text = '';
    if (reader) { const decoder = new TextDecoder(); while (text.length <= 16384) { const chunk = await reader.read(); if (chunk.done) break; text += decoder.decode(chunk.value, { stream: true }); }
      if (text.length > 16384) await reader.cancel(); else { const raw = JSON.parse(text); if (raw && typeof raw === 'object') body = raw; } }
  } catch { /* Error pages need not be JSON. */ }
  const proxied = sanitizeInfoHubFailure(body.diagnostic);
  const metadata = proxied ?? sanitizeInfoHubFailure({ error: `HTTP_${response.status}`, upstreamStatus: response.status,
    cloudflareCode: body.cloudflare_error === true ? body.error_code : undefined,
    rayId: body.cloudflare_error === true ? body.ray_id : undefined })!;
  const wait = metadata.cloudflareCode === 1102 ? INFO_HUB_RESOURCE_RETRY_MS : INFO_HUB_RETRY_MS;
  const upstreamRetry = Date.parse(metadata.retryAt ?? '');
  return { ...metadata, retryAt: new Date(Math.max(now.getTime() + wait, Math.min(Number.isFinite(upstreamRetry) ? upstreamRetry : 0, now.getTime() + INFO_HUB_RESOURCE_RETRY_MS))).toISOString() };
}
