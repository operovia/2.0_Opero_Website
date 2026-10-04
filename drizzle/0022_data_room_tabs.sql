-- The Data Room's tabs are Founder, The Raise, Cap Table and Documents, and
-- its contact form is gone: the small print that stood under the form now
-- stands at the foot of The Raise and the Cap Table, as the round's own. A
-- round without small print of its own takes the contact form's, so a note
-- the owner wrote there carries over; a round that already has one keeps it.
-- A published section that changes gets a new version, so it can be rolled
-- back; an unpublished draft changes too. Safe to run again: the second run
-- finds the round already carrying its small print.
WITH note AS (
  SELECT "published" ->> 'disclaimer' AS "text"
  FROM "content_sections"
  WHERE "page" = 'investors' AND "section" = 'contact' AND coalesce("published" ->> 'disclaimer', '') <> ''
), updated AS (
  UPDATE "content_sections" AS c
  SET "published" = c."published" || jsonb_build_object('disclaimer', note."text"),
      "version" = c."version" + 1,
      "published_at" = now(),
      "published_by" = NULL
  FROM note
  WHERE c."page" = 'investors' AND c."section" = 'round' AND coalesce(c."published" ->> 'disclaimer', '') = ''
  RETURNING c."id", c."version", c."published"
)
INSERT INTO "content_versions" ("section_id", "version", "data", "note")
SELECT "id", "version", "published", 'The small print, from the contact form' FROM updated;--> statement-breakpoint
-- The same for an unpublished draft of the round, from the draft of the form.
WITH note AS (
  SELECT "draft" ->> 'disclaimer' AS "text"
  FROM "content_sections"
  WHERE "page" = 'investors' AND "section" = 'contact' AND coalesce("draft" ->> 'disclaimer', '') <> ''
)
UPDATE "content_sections" AS c
SET "draft" = c."draft" || jsonb_build_object('disclaimer', note."text")
FROM note
WHERE c."page" = 'investors' AND c."section" = 'round' AND c."draft" IS NOT NULL AND coalesce(c."draft" ->> 'disclaimer', '') = '';--> statement-breakpoint
-- Tells every running server to reload the public content.
UPDATE "site_state" SET "content_version" = "content_version" + 1;
