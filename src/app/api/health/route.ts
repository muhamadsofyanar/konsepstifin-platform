export function GET() {
  return Response.json({ status: 'ok', service: 'konsepstifin-platform', version: '0.8.0' }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
