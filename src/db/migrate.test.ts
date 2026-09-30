import { describe, expect, it } from 'vitest';
import { intersect, missingFrom, planFrom, tolerated } from './migrate';

const migrations = ['0000', '0001', '0002', '0003'].map((tag) => ({ tag, hash: `hash-${tag}` }));
const tags = (plan: { todo: { tag: string }[] }) => plan.todo.map((m) => m.tag);
const all = new Set(migrations.map((m) => m.hash));
const complete = migrations.map(() => []);

describe('planFrom', () => {
  it('has nothing to do when every migration is recorded and every table is there', () => {
    expect(tags(planFrom(migrations, all, complete))).toEqual([]);
  });

  it('applies the migrations after the last one the record vouches for', () => {
    const recorded = new Set(['hash-0000', 'hash-0001', 'from-another-tool']);
    expect(tags(planFrom(migrations, recorded, complete))).toEqual(['0002', '0003']);
  });

  it('applies again from the first migration whose tables are missing, even when recorded', () => {
    const missing = [[], [], ['public.guest_invites'], []];
    const plan = planFrom(migrations, all, missing);
    expect(tags(plan)).toEqual(['0002', '0003']);
    expect(plan.missing).toEqual([]);
  });

  it('reports what the newest migration expects and the database lacks', () => {
    const missing = [[], [], ['public.guest_invites'], ['public.guest_invites', 'public.guest_sessions']];
    expect(planFrom(migrations, all, missing).missing).toEqual(['public.guest_invites', 'public.guest_sessions']);
  });

  it('leaves an early migration alone when a later one is recorded', () => {
    const recorded = new Set(['hash-0000', 'hash-0002', 'hash-0003']);
    expect(tags(planFrom(migrations, recorded, complete))).toEqual([]);
  });

  it('applies everything to a database with no record', () => {
    expect(tags(planFrom(migrations, new Set(), complete))).toEqual(['0000', '0001', '0002', '0003']);
  });
});

describe('missingFrom and intersect', () => {
  const tables = (spec: Record<string, string[]>) => new Map(Object.entries(spec).map(([table, columns]) => [table, new Set(columns)]));

  it('names missing tables and missing columns', () => {
    const expected = tables({ 'public.a': ['id', 'name'], 'public.b': ['id'] });
    const actual = tables({ 'public.a': ['id'] });
    expect(missingFrom(expected, actual)).toEqual(['public.a.name', 'public.b']);
  });

  it('does not expect what a later migration dropped', () => {
    const earlier = tables({ 'public.a': ['id', 'old'], 'public.gone': ['id'] });
    const final = tables({ 'public.a': ['id', 'new'] });
    expect(intersect(earlier, final)).toEqual(tables({ 'public.a': ['id'] }));
  });
});

describe('tolerated', () => {
  it('accepts a table, index or constraint that already exists', () => {
    expect(tolerated('CREATE TABLE "guest_invites" ("id" uuid)', '42P07')).toBe(true);
    expect(tolerated('-- a note\nCREATE UNIQUE INDEX "x" ON "t" ("a")', '42P07')).toBe(true);
    expect(tolerated('ALTER TABLE "t" ADD CONSTRAINT "c" FOREIGN KEY ("a") REFERENCES "u"("id")', '42710')).toBe(true);
    expect(tolerated('ALTER TABLE "t" ADD COLUMN "a" text', '42701')).toBe(true);
  });

  it('accepts a column or table that is already gone', () => {
    expect(tolerated('ALTER TABLE "site_settings" DROP COLUMN "investor_hub_enabled"', '42703')).toBe(true);
    expect(tolerated('DROP TABLE "old"', '42P01')).toBe(true);
  });

  it('refuses any other failure', () => {
    expect(tolerated('CREATE TABLE "t" ("id" uuid)', '42703')).toBe(false);
    expect(tolerated('ALTER TABLE "t" ADD COLUMN "a" text', '42P07')).toBe(false);
    expect(tolerated('UPDATE "site_state" SET "content_version" = "content_version" + 1', '42P01')).toBe(false);
    expect(tolerated('INSERT INTO "t" VALUES (1)', '23505')).toBe(false);
    expect(tolerated('CREATE TABLE "t" ("id" uuid)', null)).toBe(false);
  });
});
