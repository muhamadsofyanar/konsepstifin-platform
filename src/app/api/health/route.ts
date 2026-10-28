import packageInfo from '../../../../package.json';
export function GET() {
  return Response.json({ status: 'ok', service: 'konsepstifin-platform', version: packageInfo.version }, {
    headers: { 'Cache-Control': 'no-store' },
  });
}
