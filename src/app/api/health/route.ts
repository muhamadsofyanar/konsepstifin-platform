export function GET() {
  return Response.json({ status: 'ok', service: 'konsepstifin-platform', version: '0.9.1' }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
