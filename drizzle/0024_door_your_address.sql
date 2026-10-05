-- The door asks for the visitor's own address: someone at a company on the
-- guest list may have been forwarded the invitation, and the address it was
-- sent to is not theirs. The introduction and the empty-field message become
-- "Enter your email address." Only copy still in the words the door shipped
-- with changes, so copy the owner has rewritten stays as it is. A published
-- section that changes gets a new version, so it can be rolled back; an
-- unpublished draft changes too, so publishing it does not bring the old
-- words back. Safe to run again: the second run finds nothing to change.
WITH updated AS (
  UPDATE "content_sections"
  SET "published" = "published"
        || CASE WHEN "published" ->> 'intro' = 'Enter the email address it was sent to.' THEN '{"intro": "Enter your email address."}'::jsonb ELSE '{}'::jsonb END
        || CASE WHEN "published" ->> 'emptyMessage' = 'Enter the email address your invitation was sent to.' THEN '{"emptyMessage": "Enter your email address."}'::jsonb ELSE '{}'::jsonb END,
      "version" = "version" + 1,
      "published_at" = now(),
      "published_by" = NULL
  WHERE "page" = 'welcome' AND "section" = 'door'
    AND ("published" ->> 'intro' = 'Enter the email address it was sent to.' OR "published" ->> 'emptyMessage' = 'Enter the email address your invitation was sent to.')
  RETURNING "id", "version", "published"
)
INSERT INTO "content_versions" ("section_id", "version", "data", "note")
SELECT "id", "version", "published", 'Door: enter your email address' FROM updated;--> statement-breakpoint
-- The same for an unpublished draft of the section.
UPDATE "content_sections"
SET "draft" = "draft"
      || CASE WHEN "draft" ->> 'intro' = 'Enter the email address it was sent to.' THEN '{"intro": "Enter your email address."}'::jsonb ELSE '{}'::jsonb END
      || CASE WHEN "draft" ->> 'emptyMessage' = 'Enter the email address your invitation was sent to.' THEN '{"emptyMessage": "Enter your email address."}'::jsonb ELSE '{}'::jsonb END
WHERE "page" = 'welcome' AND "section" = 'door'
  AND ("draft" ->> 'intro' = 'Enter the email address it was sent to.' OR "draft" ->> 'emptyMessage' = 'Enter the email address your invitation was sent to.');--> statement-breakpoint
-- Tells every running server to reload the public content.
UPDATE "site_state" SET "content_version" = "content_version" + 1;
