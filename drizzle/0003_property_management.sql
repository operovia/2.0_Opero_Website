-- Say property management, never real estate: "real estate" reads as realtors,
-- which Opero is not. Rewords the copy already saved, once. Published sections
-- that change get a new version, so each can still be rolled back.
WITH updated AS (
  UPDATE "content_sections"
  SET "published" = replace(replace(replace("published"::text, 'real estate', 'property management'), 'Real estate', 'Property management'), 'Real Estate', 'Property Management')::jsonb,
      "version" = "version" + 1,
      "published_at" = now(),
      "published_by" = NULL
  WHERE "published"::text LIKE '%real estate%' OR "published"::text LIKE '%Real estate%' OR "published"::text LIKE '%Real Estate%'
  RETURNING "id", "version", "published"
)
INSERT INTO "content_versions" ("section_id", "version", "data", "note")
SELECT "id", "version", "published", 'Property management instead of real estate' FROM updated;--> statement-breakpoint
-- Unpublished drafts too, so publishing one does not bring the old wording back.
UPDATE "content_sections"
SET "draft" = replace(replace(replace("draft"::text, 'real estate', 'property management'), 'Real estate', 'Property management'), 'Real Estate', 'Property Management')::jsonb
WHERE "draft"::text LIKE '%real estate%' OR "draft"::text LIKE '%Real estate%' OR "draft"::text LIKE '%Real Estate%';--> statement-breakpoint
-- The home page's search title and description.
UPDATE "site_settings"
SET "home_meta_title" = replace(replace(replace("home_meta_title", 'real estate', 'property management'), 'Real estate', 'Property management'), 'Real Estate', 'Property Management'),
    "home_meta_description" = replace(replace(replace("home_meta_description", 'real estate', 'property management'), 'Real estate', 'Property management'), 'Real Estate', 'Property Management');--> statement-breakpoint
-- The Oppie console's questions and answers.
UPDATE "console_scenes"
SET "question" = replace(replace(replace("question", 'real estate', 'property management'), 'Real estate', 'Property management'), 'Real Estate', 'Property Management'),
    "answer_tag" = replace(replace(replace("answer_tag", 'real estate', 'property management'), 'Real estate', 'Property management'), 'Real Estate', 'Property Management'),
    "answer_main" = replace(replace(replace("answer_main", 'real estate', 'property management'), 'Real estate', 'Property management'), 'Real Estate', 'Property Management'),
    "answer_support" = replace(replace(replace("answer_support", 'real estate', 'property management'), 'Real estate', 'Property management'), 'Real Estate', 'Property Management'),
    "follow_up" = replace(replace(replace("follow_up", 'real estate', 'property management'), 'Real estate', 'Property management'), 'Real Estate', 'Property Management')
WHERE concat_ws(' ', "question", "answer_tag", "answer_main", "answer_support", "follow_up") ILIKE '%real estate%';--> statement-breakpoint
-- Tells every running server to reload the public content.
UPDATE "site_state" SET "content_version" = "content_version" + 1;
