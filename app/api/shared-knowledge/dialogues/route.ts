import { sharedKnowledgeService } from '../../../../lib/sharedKnowledgeServer';
import { safeSharedKeyword } from '../../../../lib/sharedKnowledge';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  if (request.headers.get('x-shared-knowledge-consent') !== '1') return Response.json({ status: 'CONSENT_REQUIRED' }, { status: 403 });
  const keyword = new URL(request.url).searchParams.get('keyword');
  if (!safeSharedKeyword(keyword)) return Response.json({ status: 'INVALID_KEYWORD', items: [] }, { status: 400 });
  try { const items = await sharedKnowledgeService.dialogues(keyword);
    return Response.json({ status: 'OK', keyword, items }, { headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
  } catch { return Response.json({ status: 'SHARED_UNAVAILABLE', items: [] }, { status: 503, headers: { 'cache-control': 'no-store' } }); }
}
