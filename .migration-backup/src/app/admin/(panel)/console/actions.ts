'use server';

import { and, asc, eq, gt, lt, desc, max } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/db/client';
import { consoleScenes } from '@/db/schema';
import { failure, fieldErrors, formValues, success, type FormState } from '@/lib/forms';
import { audit } from '@/server/audit';
import { requireAdmin } from '@/server/auth/session';
import { changeContent } from '@/server/content-version';
import { clientIp } from '@/server/request';

const sceneSchema = z.object({
  question: z.string().trim().min(1, 'Enter the question Oppie is asked.').max(200),
  thinkingMs: z.coerce.number({ message: 'Enter a number of milliseconds.' }).int().min(200, 'Use at least 200 ms.').max(6000, 'Use at most 6000 ms.'),
  answerTag: z.string().trim().max(80),
  answerMain: z.string().trim().min(1, 'Enter the main answer.').max(120),
  answerSupport: z.string().trim().max(240),
  chip1: z.string().trim().max(60),
  chip2: z.string().trim().max(60),
  chip3: z.string().trim().max(60),
  chip4: z.string().trim().max(60),
});

const fields = ['question', 'thinkingMs', 'answerTag', 'answerMain', 'answerSupport', 'chip1', 'chip2', 'chip3', 'chip4'] as const;

async function record(summary: string) {
  const { user } = await requireAdmin();
  await audit({ id: user.id, email: user.email }, 'scenes.update', { details: { note: summary }, ip: await clientIp() });
  revalidatePath('/admin/console');
}

type Parsed =
  | { ok: false; state: FormState }
  | { ok: true; data: Omit<z.infer<typeof sceneSchema>, 'chip1' | 'chip2' | 'chip3' | 'chip4'> & { chips: string[] }; values: Record<string, string> };

function parse(formData: FormData): Parsed {
  const values = formValues(formData, fields);
  const parsed = sceneSchema.safeParse(values);
  if (!parsed.success) return { ok: false, state: failure('Check the highlighted fields.', { fieldErrors: fieldErrors(parsed.error), values }) };
  const { chip1, chip2, chip3, chip4, ...rest } = parsed.data;
  return { ok: true, data: { ...rest, chips: [chip1, chip2, chip3, chip4].filter(Boolean) }, values };
}

export async function saveScene(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const result = parse(formData);
  if (!result.ok) return result.state;
  const { data, values } = result;

  if (id) {
    await changeContent((tx) => tx.update(consoleScenes).set(data).where(eq(consoleScenes.id, id)));
    await record(`Edited "${data.question}"`);
    return success('Scene saved. The console is updated.', { values });
  }
  await changeContent(async (tx) => {
    const [last] = await tx.select({ position: max(consoleScenes.position) }).from(consoleScenes);
    await tx.insert(consoleScenes).values({ ...data, position: (last?.position ?? -1) + 1 });
  });
  await record(`Added "${data.question}"`);
  return success('Scene added to the console.', { values: {} });
}

export async function toggleScene(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const [scene] = await db.select().from(consoleScenes).where(eq(consoleScenes.id, id));
  if (!scene) return;
  await changeContent((tx) => tx.update(consoleScenes).set({ enabled: !scene.enabled }).where(eq(consoleScenes.id, id)));
  await record(`${scene.enabled ? 'Turned off' : 'Turned on'} "${scene.question}"`);
}

export async function moveScene(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const direction = formData.get('direction') === 'up' ? 'up' : 'down';
  const [scene] = await db.select().from(consoleScenes).where(eq(consoleScenes.id, id));
  if (!scene) return;
  const [neighbor] = await db
    .select()
    .from(consoleScenes)
    .where(direction === 'up' ? lt(consoleScenes.position, scene.position) : gt(consoleScenes.position, scene.position))
    .orderBy(direction === 'up' ? desc(consoleScenes.position) : asc(consoleScenes.position))
    .limit(1);
  if (!neighbor) return;
  await changeContent(async (tx) => {
    await tx.update(consoleScenes).set({ position: neighbor.position }).where(eq(consoleScenes.id, scene.id));
    await tx.update(consoleScenes).set({ position: scene.position }).where(and(eq(consoleScenes.id, neighbor.id)));
  });
  await record(`Moved "${scene.question}" ${direction}`);
}

export async function deleteScene(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const [scene] = await db.select().from(consoleScenes).where(eq(consoleScenes.id, id));
  if (!scene) return;
  await changeContent((tx) => tx.delete(consoleScenes).where(eq(consoleScenes.id, id)));
  await record(`Deleted "${scene.question}"`);
}
