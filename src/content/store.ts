import 'server-only';
import { asc, eq } from 'drizzle-orm';
import { draftMode } from 'next/headers';
import { connection } from 'next/server';
import { cache } from 'react';
import { db } from '@/db/client';
import { consoleScenes, contentSections, media, siteState } from '@/db/schema';
import { getSession } from '@/server/auth/session';
import { onContentChange } from '@/server/content-version';
import { getSettings, type SiteSettings } from '@/server/settings';
import { schemaFor } from './fields';
import { getSectionDef, pages, type PageData, type PageKey, type SectionDef } from './registry';
import type { SceneTable } from './scene-table';
import { contentTokens, fillTokensDeep } from './tokens';

/**
 * Everything the public site shows, read from the database.
 *
 * Published content is kept in memory per server process and checked
 * against the content version number at most every couple of seconds
 * (without making visitors wait), so a publish on any instance reaches
 * every instance almost at once, and pages never wait on the database once
 * warm. Admins previewing drafts always read fresh from the database.
 */

export type ConsoleScene = {
  id: string;
  question: string;
  thinkingMs: number;
  answerTag: string;
  answerMain: string;
  answerSupport: string;
  chips: string[];
  answerTable: SceneTable | null;
  followUp: string;
};

export type SocialImage = { url: string; width: number | null; height: number | null } | null;

type Snapshot = {
  version: number;
  source: 'published' | 'draft';
  sections: Map<string, Record<string, unknown>>;
  scenes: ConsoleScene[];
  settings: SiteSettings;
  socialImage: SocialImage;
  /** Validated, token-filled page data, computed on first use. */
  pages: Map<PageKey, unknown>;
};

const CHECK_INTERVAL_MS = 2000;

async function loadSnapshot(source: Snapshot['source']): Promise<Snapshot> {
  const [[state], rows, scenes, settings] = await Promise.all([
    db.select({ version: siteState.contentVersion }).from(siteState).limit(1),
    db.select().from(contentSections),
    db
      .select({
        id: consoleScenes.id,
        question: consoleScenes.question,
        thinkingMs: consoleScenes.thinkingMs,
        answerTag: consoleScenes.answerTag,
        answerMain: consoleScenes.answerMain,
        answerSupport: consoleScenes.answerSupport,
        chips: consoleScenes.chips,
        answerTable: consoleScenes.answerTable,
        followUp: consoleScenes.followUp,
      })
      .from(consoleScenes)
      .where(eq(consoleScenes.enabled, true))
      .orderBy(asc(consoleScenes.position)),
    getSettings(),
  ]);

  let socialImage: SocialImage = null;
  if (settings.socialImageId) {
    const [image] = await db.select().from(media).where(eq(media.id, settings.socialImageId)).limit(1);
    if (image) socialImage = { url: `/media/${image.storageKey}`, width: image.width, height: image.height };
  }

  return {
    version: state?.version ?? 0,
    source,
    sections: new Map(rows.map((row) => [`${row.page}.${row.section}`, source === 'draft' ? row.draft : row.published])),
    scenes,
    settings,
    socialImage,
    pages: new Map(),
  };
}

/* ------------------------------------------------------------------------ */
/* Published snapshot cache                                                 */
/* ------------------------------------------------------------------------ */

let current: Snapshot | null = null;
let loading: Promise<Snapshot> | null = null;
let lastCheck = 0;
let checking = false;
/** Bumped whenever this instance changes content, so an in-flight load from before the change is discarded. */
let generation = 0;

onContentChange(() => {
  generation++;
  current = null;
  loading = null;
});

function loadPublished(): Promise<Snapshot> {
  if (loading) return loading;
  const startedAt = generation;
  const load = loadSnapshot('published')
    .then((snapshot) => {
      if (generation === startedAt) {
        current = snapshot;
        lastCheck = Date.now();
      }
      return snapshot;
    })
    .finally(() => {
      if (loading === load) loading = null;
    });
  loading = load;
  return load;
}

/** Refreshes the cache in the background if another instance published. */
function checkForUpdates(snapshot: Snapshot): void {
  if (checking || Date.now() - lastCheck < CHECK_INTERVAL_MS) return;
  checking = true;
  lastCheck = Date.now();
  db.select({ version: siteState.contentVersion })
    .from(siteState)
    .limit(1)
    .then(async ([state]) => {
      if (state && state.version !== snapshot.version) await loadPublished();
    })
    .catch((error) => console.error('[opero] Content version check failed', error))
    .finally(() => {
      checking = false;
    });
}

async function publishedSnapshot(): Promise<Snapshot> {
  if (!current) return loadPublished();
  checkForUpdates(current);
  return current;
}

/* ------------------------------------------------------------------------ */
/* Per-request access                                                       */
/* ------------------------------------------------------------------------ */

/** Whether this request is an admin previewing unpublished drafts. */
export const isPreview = cache(async (): Promise<boolean> => {
  const draft = await draftMode();
  return draft.isEnabled && (await getSession()) !== null;
});

const snapshotForRequest = cache(async (): Promise<Snapshot> => {
  // Public pages always render at request time, never at build time.
  await connection();
  return (await isPreview()) ? loadSnapshot('draft') : publishedSnapshot();
});

function resolveSection(snapshot: Snapshot, page: PageKey, key: string, def: SectionDef): unknown {
  const stored = snapshot.sections.get(`${page}.${key}`);
  const merged = { ...def.seed, ...(stored ?? {}) };
  const parsed = schemaFor(def.fields, def.check).safeParse(merged);
  if (!parsed.success) {
    console.error(`[opero] Stored content for ${page}.${key} is invalid; showing the default copy.`, parsed.error.issues);
    return def.seed;
  }
  return parsed.data;
}

/** A page's content: every section validated, with {partner} and {email} filled in. */
export async function getPage<P extends PageKey>(page: P): Promise<PageData<P>> {
  const snapshot = await snapshotForRequest();
  const cached = snapshot.pages.get(page);
  if (cached) return cached as PageData<P>;

  const tokens = contentTokens({ partnerLabel: snapshot.settings.partnerProgramLabel, contactEmail: snapshot.settings.contactEmail });
  const data = Object.fromEntries(
    Object.entries(pages[page].sections as Record<string, SectionDef>).map(([key, def]) => [
      key,
      fillTokensDeep(resolveSection(snapshot, page, key, def), tokens),
    ]),
  ) as PageData<P>;
  snapshot.pages.set(page, data);
  return data;
}

export async function getScenes(): Promise<ConsoleScene[]> {
  return (await snapshotForRequest()).scenes;
}

export async function getPublicSettings(): Promise<{ settings: SiteSettings; socialImage: SocialImage; version: number }> {
  const snapshot = await snapshotForRequest();
  return { settings: snapshot.settings, socialImage: snapshot.socialImage, version: snapshot.version };
}

/** Validates data for one section, for the admin editor. */
export function sectionSchema(page: string, key: string) {
  const def = getSectionDef(page, key);
  return def ? schemaFor(def.fields, def.check) : null;
}
