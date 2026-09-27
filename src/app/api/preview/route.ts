import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import type { NextRequest } from 'next/server';
import { publicPath } from '@/content/paths';
import { getSession } from '@/server/auth/session';

/** Turns on draft preview for a signed-in admin and opens the requested page. */
export async function GET(request: NextRequest) {
  const path = publicPath(request.nextUrl.searchParams.get('path') ?? '/');
  if (!(await getSession())) redirect(`/admin/login?next=${encodeURIComponent('/admin/content')}`);
  (await draftMode()).enable();
  redirect(path);
}
