-- Website review, Phase 2: the caption under the hero's Oppie card reads
-- "Illustrative data. You decide what Oppie can see and do." where it still
-- reads "Illustrative data"; a caption the owner rewrote stays. A published
-- section that changes gets a new version, so it can be rolled back; an
-- unpublished draft changes too. Safe to run again.
WITH updated AS (
  UPDATE "content_sections"
  SET "published" = "published" || '{"consoleNote": "Illustrative data. You decide what Oppie can see and do."}'::jsonb,
      "version" = "version" + 1,
      "published_at" = now(),
      "published_by" = NULL
  WHERE "page" = 'home' AND "section" = 'hero' AND "published" ->> 'consoleNote' = 'Illustrative data'
  RETURNING "id", "version", "published"
)
INSERT INTO "content_versions" ("section_id", "version", "data", "note")
SELECT "id", "version", "published", 'Website review: the console caption' FROM updated;--> statement-breakpoint
UPDATE "content_sections"
SET "draft" = "draft" || '{"consoleNote": "Illustrative data. You decide what Oppie can see and do."}'::jsonb
WHERE "page" = 'home' AND "section" = 'hero' AND "draft" ->> 'consoleNote' = 'Illustrative data';--> statement-breakpoint
-- Tells every running server to reload the public content.
UPDATE "site_state" SET "content_version" = "content_version" + 1;
