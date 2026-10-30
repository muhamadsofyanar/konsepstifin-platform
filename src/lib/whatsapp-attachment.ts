export const MAX_WHATSAPP_ATTACHMENT = 10 * 1024 * 1024;
export function attachmentMime(name: string, data: Uint8Array): string {
  const ext = name.split('.').pop()?.toLowerCase();
  const b = Buffer.from(data);
  if (ext === 'pdf' && b.subarray(0,5).toString() === '%PDF-') return 'application/pdf';
  if (['jpg','jpeg'].includes(ext || '') && b[0] === 255 && b[1] === 216 && b[2] === 255) return 'image/jpeg';
  if (ext === 'png' && b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if (ext === 'webp' && b.subarray(0,4).toString() === 'RIFF' && b.subarray(8,12).toString() === 'WEBP') return 'image/webp';
  if (ext === 'mp4' && b.subarray(4,8).toString() === 'ftyp') return 'video/mp4';
  if (ext === 'mp3' && (b.subarray(0,3).toString() === 'ID3' || b[0] === 255 && (b[1] & 224) === 224)) return 'audio/mpeg';
  if (['docx','xlsx','pptx'].includes(ext || '') && b.subarray(0,4).equals(Buffer.from([80,75,3,4]))) return ({ docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation' } as Record<string,string>)[ext!];
  throw new Error('Format file tidak didukung atau isi file tidak sesuai ekstensi.');
}
