-- The cap table opens on a $300,000 investment, as the cap table handoff
-- sets out, rather than on the $50,000 minimum it shipped with. Only a
-- starting amount still at the shipped $50,000 changes, and only where the
-- slider reaches $300,000, so a starting amount the owner chose stays as it
-- is. A published section that changes gets a new version, so it can be
-- rolled back; an unpublished draft changes too, so publishing it does not
-- bring the old amount back. Safe to run again: the second run finds nothing
-- to change.
WITH updated AS (
  UPDATE "content_sections"
  SET "published" = "published" || '{"start": 300000}'::jsonb,
      "version" = "version" + 1,
      "published_at" = now(),
      "published_by" = NULL
  WHERE "page" = 'investors' AND "section" = 'round'
    AND "published" ->> 'start' = '50000'
    AND (CASE WHEN jsonb_typeof("published" -> 'minimum') = 'number' THEN ("published" ->> 'minimum')::numeric END) <= 300000
    AND (CASE WHEN jsonb_typeof("published" -> 'maximum') = 'number' THEN ("published" ->> 'maximum')::numeric END) >= 300000
    AND (CASE WHEN jsonb_typeof("published" -> 'raise') = 'number' THEN ("published" ->> 'raise')::numeric END) >= 300000
  RETURNING "id", "version", "published"
)
INSERT INTO "content_versions" ("section_id", "version", "data", "note")
SELECT "id", "version", "published", 'Cap table: opens on $300,000' FROM updated;--> statement-breakpoint
-- The same for an unpublished draft of the section.
UPDATE "content_sections"
SET "draft" = "draft" || '{"start": 300000}'::jsonb
WHERE "page" = 'investors' AND "section" = 'round'
  AND "draft" ->> 'start' = '50000'
  AND (CASE WHEN jsonb_typeof("draft" -> 'minimum') = 'number' THEN ("draft" ->> 'minimum')::numeric END) <= 300000
  AND (CASE WHEN jsonb_typeof("draft" -> 'maximum') = 'number' THEN ("draft" ->> 'maximum')::numeric END) >= 300000
  AND (CASE WHEN jsonb_typeof("draft" -> 'raise') = 'number' THEN ("draft" ->> 'raise')::numeric END) >= 300000;--> statement-breakpoint
-- Tells every running server to reload the public content.
UPDATE "site_state" SET "content_version" = "content_version" + 1;
