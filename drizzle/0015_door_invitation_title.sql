-- The door says the invitation once, as the owner asked: "This is *your*
-- invitation." with no "By invitation" above it, and the line under it no
-- longer repeats the word. Only copy still in the words the door shipped with
-- changes, and the eyebrow and the line only beside the shipped title (or the
-- new one), so copy the owner has rewritten stays as it is. A published section
-- that changes gets a new version, so it can be rolled back; an unpublished
-- draft changes too, so publishing it does not bring the old words back. Safe
-- to run again: the second run finds nothing to change.
WITH updated AS (
  UPDATE "content_sections"
  SET "published" = "published"
        || CASE WHEN "published" ->> 'title' = 'You were *invited* here.' THEN '{"title": "This is *your* invitation."}'::jsonb ELSE '{}'::jsonb END
        || CASE WHEN "published" ->> 'eyebrow' = 'By invitation' THEN '{"eyebrow": ""}'::jsonb ELSE '{}'::jsonb END
        || CASE WHEN "published" ->> 'intro' = 'Enter the email address your invitation was sent to.' THEN '{"intro": "Enter the email address it was sent to."}'::jsonb ELSE '{}'::jsonb END,
      "version" = "version" + 1,
      "published_at" = now(),
      "published_by" = NULL
  WHERE "page" = 'welcome' AND "section" = 'door'
    AND "published" ->> 'title' IN ('You were *invited* here.', 'This is *your* invitation.')
    AND ("published" ->> 'title' = 'You were *invited* here.' OR "published" ->> 'eyebrow' = 'By invitation' OR "published" ->> 'intro' = 'Enter the email address your invitation was sent to.')
  RETURNING "id", "version", "published"
)
INSERT INTO "content_versions" ("section_id", "version", "data", "note")
SELECT "id", "version", "published", 'Door title: This is your invitation.' FROM updated;--> statement-breakpoint
-- The same for an unpublished draft of the section.
UPDATE "content_sections"
SET "draft" = "draft"
      || CASE WHEN "draft" ->> 'title' = 'You were *invited* here.' THEN '{"title": "This is *your* invitation."}'::jsonb ELSE '{}'::jsonb END
      || CASE WHEN "draft" ->> 'eyebrow' = 'By invitation' THEN '{"eyebrow": ""}'::jsonb ELSE '{}'::jsonb END
      || CASE WHEN "draft" ->> 'intro' = 'Enter the email address your invitation was sent to.' THEN '{"intro": "Enter the email address it was sent to."}'::jsonb ELSE '{}'::jsonb END
WHERE "page" = 'welcome' AND "section" = 'door'
  AND "draft" ->> 'title' IN ('You were *invited* here.', 'This is *your* invitation.')
  AND ("draft" ->> 'title' = 'You were *invited* here.' OR "draft" ->> 'eyebrow' = 'By invitation' OR "draft" ->> 'intro' = 'Enter the email address your invitation was sent to.');--> statement-breakpoint
-- Tells every running server to reload the public content.
UPDATE "site_state" SET "content_version" = "content_version" + 1;
