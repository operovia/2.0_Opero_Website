'use server';

import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { publicPath } from '@/content/paths';

export async function exitPreview(formData: FormData): Promise<void> {
  (await draftMode()).disable();
  redirect(publicPath(String(formData.get('path') ?? '/')));
}
