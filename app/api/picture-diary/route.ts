import { pictureDiaryService } from '../../../lib/pictureDiaryServer';
export const dynamic = 'force-dynamic';
export const maxDuration = 90;
export async function POST(request: Request) { return pictureDiaryService(request); }
