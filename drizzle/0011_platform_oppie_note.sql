-- The Oppie note in the middle of the platform section reads "Oppie knows all."
-- with no second line, as the owner asked. Only a note still carrying the
-- earlier words changes, once, as a new version so it can be rolled back;
-- content saved before the note existed has none and takes the new one from
-- the seed.
WITH updated AS (
  UPDATE "content_sections"
  SET "published" = "published"
        || CASE WHEN "published" ->> 'oppieTitle' = 'Oppie knows all of it.' THEN '{"oppieTitle": "Oppie knows all."}'::jsonb ELSE '{}'::jsonb END
        || CASE WHEN "published" ->> 'oppieDetail' = 'Ask anything in plain English.' THEN '{"oppieDetail": ""}'::jsonb ELSE '{}'::jsonb END,
      "version" = "version" + 1,
      "published_at" = now(),
      "published_by" = NULL
  WHERE "page" = 'home' AND "section" = 'platform'
    AND ("published" ->> 'oppieTitle' = 'Oppie knows all of it.' OR "published" ->> 'oppieDetail' = 'Ask anything in plain English.')
  RETURNING "id", "version", "published"
)
INSERT INTO "content_versions" ("section_id", "version", "data", "note")
SELECT "id", "version", "published", 'Oppie note: Oppie knows all.' FROM updated;--> statement-breakpoint
-- The same for an unpublished draft of the section.
UPDATE "content_sections"
SET "draft" = "draft"
      || CASE WHEN "draft" ->> 'oppieTitle' = 'Oppie knows all of it.' THEN '{"oppieTitle": "Oppie knows all."}'::jsonb ELSE '{}'::jsonb END
      || CASE WHEN "draft" ->> 'oppieDetail' = 'Ask anything in plain English.' THEN '{"oppieDetail": ""}'::jsonb ELSE '{}'::jsonb END
WHERE "page" = 'home' AND "section" = 'platform'
  AND ("draft" ->> 'oppieTitle' = 'Oppie knows all of it.' OR "draft" ->> 'oppieDetail' = 'Ask anything in plain English.');--> statement-breakpoint
-- Tells every running server to reload the public content.
UPDATE "site_state" SET "content_version" = "content_version" + 1;
