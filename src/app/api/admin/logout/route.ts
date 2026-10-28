import { POST as accountLogout } from '../../account/logout/route';
// One shared opaque session. Logging out here also revokes account access.
export const runtime = 'nodejs';
export async function POST(request: Request) {
  return accountLogout(request);
}
