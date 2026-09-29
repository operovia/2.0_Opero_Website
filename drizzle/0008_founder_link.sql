-- The Founder tab in the site header, once: right before the Investor Hub
-- link, or last if that link is gone. Skipped where the header already links
-- to the Founder page or has as many links as it allows. Visitors see the
-- Founder tab; guests and signed-in admins see the Investor Hub tab instead.
WITH updated AS (
  UPDATE "content_sections" AS s
  SET "published" = jsonb_set(s."published", '{links}', (
        SELECT jsonb_agg(merged.link ORDER BY merged.position)
        FROM (
          SELECT t.link, t.position::numeric AS position
          FROM jsonb_array_elements(s."published" -> 'links') WITH ORDINALITY AS t(link, position)
          UNION ALL
          SELECT '{"label": "Founder", "href": "/founder"}'::jsonb,
                 COALESCE(
                   (SELECT MIN(p.position) - 0.5 FROM jsonb_array_elements(s."published" -> 'links') WITH ORDINALITY AS p(link, position) WHERE p.link ->> 'href' LIKE '/investors%'),
                   jsonb_array_length(s."published" -> 'links') + 0.5
                 )
        ) AS merged
      )),
      "version" = s."version" + 1,
      "published_at" = now(),
      "published_by" = NULL
  WHERE s."page" = 'site' AND s."section" = 'header'
    AND jsonb_typeof(s."published" -> 'links') = 'array'
    AND jsonb_array_length(s."published" -> 'links') < 5
    AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(s."published" -> 'links') AS l(link) WHERE l.link ->> 'href' LIKE '/founder%')
  RETURNING s."id", s."version", s."published"
)
INSERT INTO "content_versions" ("section_id", "version", "data", "note")
SELECT "id", "version", "published", 'Added the Founder tab' FROM updated;--> statement-breakpoint
-- The same for an unpublished draft of the header, so publishing it keeps the tab.
UPDATE "content_sections" AS s
SET "draft" = jsonb_set(s."draft", '{links}', (
      SELECT jsonb_agg(merged.link ORDER BY merged.position)
      FROM (
        SELECT t.link, t.position::numeric AS position
        FROM jsonb_array_elements(s."draft" -> 'links') WITH ORDINALITY AS t(link, position)
        UNION ALL
        SELECT '{"label": "Founder", "href": "/founder"}'::jsonb,
               COALESCE(
                 (SELECT MIN(p.position) - 0.5 FROM jsonb_array_elements(s."draft" -> 'links') WITH ORDINALITY AS p(link, position) WHERE p.link ->> 'href' LIKE '/investors%'),
                 jsonb_array_length(s."draft" -> 'links') + 0.5
               )
      ) AS merged
    ))
WHERE s."page" = 'site' AND s."section" = 'header'
  AND jsonb_typeof(s."draft" -> 'links') = 'array'
  AND jsonb_array_length(s."draft" -> 'links') < 5
  AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(s."draft" -> 'links') AS l(link) WHERE l.link ->> 'href' LIKE '/founder%');--> statement-breakpoint
-- Tells every running server to reload the public content.
UPDATE "site_state" SET "content_version" = "content_version" + 1;
