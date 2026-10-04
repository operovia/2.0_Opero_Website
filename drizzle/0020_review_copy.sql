-- Website review, Phase 3: the copy edits in the review's deck (C6 to C11,
-- C15 to C18) and the other mentions of EOS, reworded by function. Each
-- change applies only to the words still on the page as listed, so copy the
-- owner rewrote stays. A published section that changes gets a new version,
-- so it can be rolled back; an unpublished draft changes too. Safe to run
-- again: the second run finds nothing to change.
WITH updated AS (
  UPDATE "content_sections"
  SET "published" = (replace(replace("published"::text, 'An EOS tool.', 'A meetings and goals tool.'), '"label": "EOS tool"', '"label": "Meetings and goals tool"'))::jsonb,
      "version" = "version" + 1,
      "published_at" = now(),
      "published_by" = NULL
  WHERE "page" = 'home' AND "section" = 'problem'
    AND ("published"::text LIKE '%An EOS tool.%' OR "published"::text LIKE '%"label": "EOS tool"%')
  RETURNING "id", "version", "published"
)
INSERT INTO "content_versions" ("section_id", "version", "data", "note")
SELECT "id", "version", "published", 'Website review: copy edits' FROM updated;--> statement-breakpoint
UPDATE "content_sections"
SET "draft" = (replace(replace("draft"::text, 'An EOS tool.', 'A meetings and goals tool.'), '"label": "EOS tool"', '"label": "Meetings and goals tool"'))::jsonb
WHERE "page" = 'home' AND "section" = 'problem'
  AND ("draft"::text LIKE '%An EOS tool.%' OR "draft"::text LIKE '%"label": "EOS tool"%');--> statement-breakpoint
WITH updated AS (
  UPDATE "content_sections"
  SET "published" = (replace(replace(replace(replace(replace(replace(replace("published"::text, 'Studios for project boards and workflows.', 'Studios for project canvases and workflows.'), 'Compass for running on EOS.', 'Compass for your operating rhythm: priorities, scorecards and meetings.'), '"description": "Project boards and workflows."', '"description": "Project canvases and workflows."'), 'A project board for the turn season:', 'A project canvas for the turn season:'), '"description": "Running the business on EOS."', '"description": "Your operating rhythm: priorities, scorecards and meetings."'), '"oppieTitle": "Oppie knows all."', '"oppieTitle": "Oppie works across all of it."'), 'Tenant account mgmt', 'Tenant account management'))::jsonb,
      "version" = "version" + 1,
      "published_at" = now(),
      "published_by" = NULL
  WHERE "page" = 'home' AND "section" = 'platform'
    AND ("published"::text LIKE '%Studios for project boards and workflows.%' OR "published"::text LIKE '%Compass for running on EOS.%' OR "published"::text LIKE '%"description": "Project boards and workflows."%' OR "published"::text LIKE '%A project board for the turn season:%' OR "published"::text LIKE '%"description": "Running the business on EOS."%' OR "published"::text LIKE '%"oppieTitle": "Oppie knows all."%' OR "published"::text LIKE '%Tenant account mgmt%')
  RETURNING "id", "version", "published"
)
INSERT INTO "content_versions" ("section_id", "version", "data", "note")
SELECT "id", "version", "published", 'Website review: copy edits' FROM updated;--> statement-breakpoint
UPDATE "content_sections"
SET "draft" = (replace(replace(replace(replace(replace(replace(replace("draft"::text, 'Studios for project boards and workflows.', 'Studios for project canvases and workflows.'), 'Compass for running on EOS.', 'Compass for your operating rhythm: priorities, scorecards and meetings.'), '"description": "Project boards and workflows."', '"description": "Project canvases and workflows."'), 'A project board for the turn season:', 'A project canvas for the turn season:'), '"description": "Running the business on EOS."', '"description": "Your operating rhythm: priorities, scorecards and meetings."'), '"oppieTitle": "Oppie knows all."', '"oppieTitle": "Oppie works across all of it."'), 'Tenant account mgmt', 'Tenant account management'))::jsonb
WHERE "page" = 'home' AND "section" = 'platform'
  AND ("draft"::text LIKE '%Studios for project boards and workflows.%' OR "draft"::text LIKE '%Compass for running on EOS.%' OR "draft"::text LIKE '%"description": "Project boards and workflows."%' OR "draft"::text LIKE '%A project board for the turn season:%' OR "draft"::text LIKE '%"description": "Running the business on EOS."%' OR "draft"::text LIKE '%"oppieTitle": "Oppie knows all."%' OR "draft"::text LIKE '%Tenant account mgmt%');--> statement-breakpoint
WITH updated AS (
  UPDATE "content_sections"
  SET "published" = (replace(replace("published"::text, 'Finally an inspection tool built by a property manager.', 'Finally, an inspection tool built by a property manager.'), 'report a building issue on-the-spot.', 'report a building issue on the spot.'))::jsonb,
      "version" = "version" + 1,
      "published_at" = now(),
      "published_by" = NULL
  WHERE "page" = 'home' AND "section" = 'go'
    AND ("published"::text LIKE '%Finally an inspection tool built by a property manager.%' OR "published"::text LIKE '%report a building issue on-the-spot.%')
  RETURNING "id", "version", "published"
)
INSERT INTO "content_versions" ("section_id", "version", "data", "note")
SELECT "id", "version", "published", 'Website review: copy edits' FROM updated;--> statement-breakpoint
UPDATE "content_sections"
SET "draft" = (replace(replace("draft"::text, 'Finally an inspection tool built by a property manager.', 'Finally, an inspection tool built by a property manager.'), 'report a building issue on-the-spot.', 'report a building issue on the spot.'))::jsonb
WHERE "page" = 'home' AND "section" = 'go'
  AND ("draft"::text LIKE '%Finally an inspection tool built by a property manager.%' OR "draft"::text LIKE '%report a building issue on-the-spot.%');--> statement-breakpoint
WITH updated AS (
  UPDATE "content_sections"
  SET "published" = (replace("published"::text, 'It runs our flagship operator, a commercial and residential property management firm, every day', 'It runs the founder''s former company, a commercial and residential property management firm, every day'))::jsonb,
      "version" = "version" + 1,
      "published_at" = now(),
      "published_by" = NULL
  WHERE "page" = 'partners' AND "section" = 'intro'
    AND ("published"::text LIKE '%It runs our flagship operator, a commercial and residential property management firm, every day%')
  RETURNING "id", "version", "published"
)
INSERT INTO "content_versions" ("section_id", "version", "data", "note")
SELECT "id", "version", "published", 'Website review: copy edits' FROM updated;--> statement-breakpoint
UPDATE "content_sections"
SET "draft" = (replace("draft"::text, 'It runs our flagship operator, a commercial and residential property management firm, every day', 'It runs the founder''s former company, a commercial and residential property management firm, every day'))::jsonb
WHERE "page" = 'partners' AND "section" = 'intro'
  AND ("draft"::text LIKE '%It runs our flagship operator, a commercial and residential property management firm, every day%');--> statement-breakpoint
-- Tells every running server to reload the public content.
UPDATE "site_state" SET "content_version" = "content_version" + 1;
