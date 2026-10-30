import { createDiarySessionHandler } from '../../../../lib/pictureDiaryAuth';
export const dynamic = 'force-dynamic';
const handle = createDiarySessionHandler(() => process.env.DIARY_SESSION_SECRET);
export async function POST(request: Request) { return handle(request); }
