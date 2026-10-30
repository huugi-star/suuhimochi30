import { sharedKnowledgeService } from '../../../../lib/sharedKnowledgeServer';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  if (request.headers.get('x-shared-knowledge-consent') !== '1') return Response.json({ status: 'CONSENT_REQUIRED' }, { status: 403 });
  const url = new URL(request.url); const offset = Number(url.searchParams.get('offset') ?? '0');
  if (!Number.isInteger(offset) || offset < 0 || offset > 50000) return Response.json({ status: 'INVALID_CURSOR' }, { status: 400 });
  try {
    const data = await sharedKnowledgeService.dictionary(); const keywords = data.keywords.slice(offset, offset + 200);
    return Response.json({ status: 'OK', keywords, nextOffset: offset + 200 < data.keywords.length ? offset + 200 : null, fetchedAt: data.fetchedAt }, { headers: { 'cache-control': 'no-store' } });
  } catch { return Response.json({ status: 'SHARED_UNAVAILABLE', keywords: [], nextOffset: null }, { status: 503, headers: { 'cache-control': 'no-store' } }); }
}
