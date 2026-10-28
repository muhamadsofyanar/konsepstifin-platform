import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { getLearningService } from '@/lib/learning-store';
import { learningGuard, learningFailure, learningJson } from '@/lib/learning-http';
import { safePrivatePath, positive } from '@/lib/learning-service';
export const dynamic = 'force-dynamic';
export async function GET(request: Request, { params }: {
    params: Promise<{
        id: string;
    }>;
}) { try {
    const g = await learningGuard(request);
    if (g.response)
        return g.response;
    const id = positive((await params).id), s = getLearningService(), l = await s.material(g.principal!.userId, id);
    if (l.kind !== 'file' || !l.file_path)
        return learningJson({ message: 'File tidak ditemukan.' }, 404);
    const relative = safePrivatePath(l.file_path), root = await realpath(/* turbopackIgnore: true */ process.env.LEARNING_STORAGE_PATH || path.join(process.cwd(), 'storage/learning'));
    const file = await realpath(/* turbopackIgnore: true */ path.join(root, relative));
    if (!file.startsWith(root + path.sep))
        return learningJson({ message: 'File tidak tersedia.' }, 403);
    const bytes = await readFile(/* turbopackIgnore: true */ file);
    await s.logDownload(g.principal!.userId, id);
    return new Response(bytes, { headers: { 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="${path.basename(relative)}"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'" } });
}
catch (e) {
    return learningFailure(e);
} }
