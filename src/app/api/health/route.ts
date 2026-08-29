export function GET() {
  return Response.json({ status: 'ok', service: 'konsepstifin-platform', version: '0.5.1' }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
