import { isAdminAuthenticated } from '@/lib/admin-auth';
import {
  getKnowledgeSources,
  ingestKnowledgeFile,
  knowledgeMaxFileBytes,
} from '@/lib/knowledge-store';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

export async function GET() {
  if (!await isAdminAuthenticated()) return Response.json({ message: 'Sesi tidak valid.' }, { status: 401 });
  try {
    return Response.json({ sources: await getKnowledgeSources() }, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error(error);
    return Response.json({ message: 'Pustaka belum dapat dimuat.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!await isAdminAuthenticated()) return Response.json({ message: 'Sesi tidak valid.' }, { status: 401 });
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) throw new Error('Pilih satu file PDF atau PNG.');
    if (file.size > knowledgeMaxFileBytes()) {
      throw new Error(`Ukuran PDF melebihi batas ${Math.round(knowledgeMaxFileBytes() / 1024 / 1024)} MB.`);
    }
    const publicationYearValue = Number(formData.get('publicationYear'));
    const source = await ingestKnowledgeFile({
      bytes: new Uint8Array(await file.arrayBuffer()),
      filename: file.name,
      title: String(formData.get('title') ?? ''),
      category: String(formData.get('category') ?? ''),
      documentType: String(formData.get('documentType') ?? ''),
      accessLevel: String(formData.get('accessLevel') ?? ''),
      riskLevel: String(formData.get('riskLevel') ?? ''),
      publicationYear: Number.isInteger(publicationYearValue) ? publicationYearValue : null,
      notes: String(formData.get('notes') ?? ''),
    });
    return Response.json({ source }, { status: 201 });
  } catch (error) {
    console.error('Gagal mengimpor file pustaka.', error);
    const message = error instanceof Error ? error.message : 'File gagal diproses.';
    const status = message.includes('sudah ada') ? 409 : 400;
    return Response.json({ message }, { status });
  }
}
