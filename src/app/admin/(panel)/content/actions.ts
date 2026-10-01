'use server';

import { revalidatePath } from 'next/cache';
import { withSeed } from '@/content/fields';
import { getPageDef, getSectionDef } from '@/content/registry';
import { audit } from '@/server/audit';
import { requireAdmin } from '@/server/auth/session';
import { discardDraft, publish, saveDraft, validateSection, versionData } from '@/server/content-admin';
import { clientIp } from '@/server/request';

export type EditorResult = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
  /** The section's values after the action, when they changed on the server. */
  values?: Record<string, unknown>;
  version?: number;
};

function label(page: string, section: string): string {
  return `${getPageDef(page)?.label ?? page}: ${getSectionDef(page, section)?.label ?? section}`;
}

function refresh(page: string, section: string) {
  revalidatePath('/admin/content');
  revalidatePath(`/admin/content/${page}`);
  revalidatePath(`/admin/content/${page}/${section}`);
}

const unknownSection: EditorResult = { ok: false, message: 'This section no longer exists. Reload the page.' };
const invalid = (errors: Record<string, string>): EditorResult => ({ ok: false, message: 'Some fields need attention before this can be saved.', errors });

export async function saveDraftAction(page: string, section: string, data: unknown): Promise<EditorResult> {
  const { user } = await requireAdmin();
  const def = getSectionDef(page, section);
  if (!def) return unknownSection;
  const result = validateSection(def, data);
  if (!result.ok) return invalid(result.errors);
  await saveDraft(page, section, result.data, user.id);
  refresh(page, section);
  return { ok: true, message: 'Draft saved. The live site is unchanged until you publish.', values: result.data };
}

export async function publishAction(page: string, section: string, data: unknown): Promise<EditorResult> {
  const { user } = await requireAdmin();
  const def = getSectionDef(page, section);
  if (!def) return unknownSection;
  const result = validateSection(def, data);
  if (!result.ok) return invalid(result.errors);
  const version = await publish(page, section, result.data, user.id);
  await audit({ id: user.id, email: user.email }, 'content.publish', {
    target: label(page, section),
    details: { version },
    ip: await clientIp(),
  });
  refresh(page, section);
  return { ok: true, message: 'Published. The live site is updated.', values: result.data, version };
}

export async function discardDraftAction(page: string, section: string): Promise<EditorResult> {
  await requireAdmin();
  if (!getSectionDef(page, section)) return unknownSection;
  const published = await discardDraft(page, section);
  refresh(page, section);
  return published ? { ok: true, message: 'Changes discarded. The draft matches the live site again.', values: published } : unknownSection;
}

export async function rollbackAction(page: string, section: string, versionId: string): Promise<EditorResult> {
  const { user } = await requireAdmin();
  const def = getSectionDef(page, section);
  if (!def) return unknownSection;
  const old = await versionData(page, section, versionId);
  if (!old) return { ok: false, message: 'That version is no longer available.' };
  // Older content is re-validated against today's fields before it goes live.
  const result = validateSection(def, withSeed(def.fields, def.seed as Record<string, unknown>, old.data));
  if (!result.ok) return { ok: false, message: `Version ${old.version} no longer fits this section's fields, so it cannot be restored.` };
  const version = await publish(page, section, result.data, user.id, `Restored version ${old.version}`);
  await audit({ id: user.id, email: user.email }, 'content.rollback', {
    target: label(page, section),
    details: { version, note: `Restored version ${old.version}` },
    ip: await clientIp(),
  });
  refresh(page, section);
  return { ok: true, message: `Version ${old.version} is live again, published as version ${version}.`, values: result.data, version };
}
