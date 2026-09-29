-- Budgeting and reporting in the Investor Hub's "today and on deck" areas,
-- once: right after Tenancy, as in the investor room, or last if Tenancy is
-- gone. Only a site that has already saved that section needs this; others
-- get the area from the starting copy. Skipped where an area already has the
-- name, or the list is full.
WITH updated AS (
  UPDATE "content_sections" AS s
  SET "published" = jsonb_set(s."published", '{areas}', (
        SELECT jsonb_agg(merged.area ORDER BY merged.position)
        FROM (
          SELECT t.area, t.position::numeric AS position
          FROM jsonb_array_elements(s."published" -> 'areas') WITH ORDINALITY AS t(area, position)
          UNION ALL
          SELECT '{"name": "Budgeting and reporting", "today": "Budgeting and forecasting workflows", "extended": "Financial reporting and report builder\nActual vs. budget reporting", "next": ""}'::jsonb,
                 COALESCE(
                   (SELECT MIN(p.position) FROM jsonb_array_elements(s."published" -> 'areas') WITH ORDINALITY AS p(area, position) WHERE p.area ->> 'name' = 'Tenancy'),
                   jsonb_array_length(s."published" -> 'areas')
                 ) + 0.5
        ) AS merged
      )),
      "version" = s."version" + 1,
      "published_at" = now(),
      "published_by" = NULL
  WHERE s."page" = 'investors' AND s."section" = 'platform'
    AND jsonb_typeof(s."published" -> 'areas') = 'array'
    AND jsonb_array_length(s."published" -> 'areas') < 10
    AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(s."published" -> 'areas') AS a(area) WHERE a.area ->> 'name' = 'Budgeting and reporting')
  RETURNING s."id", s."version", s."published"
)
INSERT INTO "content_versions" ("section_id", "version", "data", "note")
SELECT "id", "version", "published", 'Added Budgeting and reporting' FROM updated;--> statement-breakpoint
-- The same for an unpublished draft of the section, so publishing it keeps the area.
UPDATE "content_sections" AS s
SET "draft" = jsonb_set(s."draft", '{areas}', (
      SELECT jsonb_agg(merged.area ORDER BY merged.position)
      FROM (
        SELECT t.area, t.position::numeric AS position
        FROM jsonb_array_elements(s."draft" -> 'areas') WITH ORDINALITY AS t(area, position)
        UNION ALL
        SELECT '{"name": "Budgeting and reporting", "today": "Budgeting and forecasting workflows", "extended": "Financial reporting and report builder\nActual vs. budget reporting", "next": ""}'::jsonb,
               COALESCE(
                 (SELECT MIN(p.position) FROM jsonb_array_elements(s."draft" -> 'areas') WITH ORDINALITY AS p(area, position) WHERE p.area ->> 'name' = 'Tenancy'),
                 jsonb_array_length(s."draft" -> 'areas')
               ) + 0.5
      ) AS merged
    ))
WHERE s."page" = 'investors' AND s."section" = 'platform'
  AND jsonb_typeof(s."draft" -> 'areas') = 'array'
  AND jsonb_array_length(s."draft" -> 'areas') < 10
  AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(s."draft" -> 'areas') AS a(area) WHERE a.area ->> 'name' = 'Budgeting and reporting');--> statement-breakpoint
-- Tells every running server to reload the public content.
UPDATE "site_state" SET "content_version" = "content_version" + 1;
