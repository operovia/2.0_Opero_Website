ALTER TABLE "site_settings" ADD COLUMN "investor_hub_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
-- The Investor Hub tab in the site header, once: right after the partners link,
-- or last if that link is gone. Skipped where the header already links to the
-- Investor Hub or has as many links as it allows. Visitors see the tab only
-- after the Investor Hub is switched on in Settings.
WITH updated AS (
  UPDATE "content_sections" AS s
  SET "published" = jsonb_set(s."published", '{links}', (
        SELECT jsonb_agg(merged.link ORDER BY merged.position)
        FROM (
          SELECT t.link, t.position::numeric AS position
          FROM jsonb_array_elements(s."published" -> 'links') WITH ORDINALITY AS t(link, position)
          UNION ALL
          SELECT '{"label": "Investor Hub", "href": "/investors"}'::jsonb,
                 COALESCE(
                   (SELECT MIN(p.position) FROM jsonb_array_elements(s."published" -> 'links') WITH ORDINALITY AS p(link, position) WHERE p.link ->> 'href' = '/partners'),
                   jsonb_array_length(s."published" -> 'links')
                 ) + 0.5
        ) AS merged
      )),
      "version" = s."version" + 1,
      "published_at" = now(),
      "published_by" = NULL
  WHERE s."page" = 'site' AND s."section" = 'header'
    AND jsonb_typeof(s."published" -> 'links') = 'array'
    AND jsonb_array_length(s."published" -> 'links') < 5
    AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(s."published" -> 'links') AS l(link) WHERE l.link ->> 'href' LIKE '/investors%')
  RETURNING s."id", s."version", s."published"
)
INSERT INTO "content_versions" ("section_id", "version", "data", "note")
SELECT "id", "version", "published", 'Added the Investor Hub tab' FROM updated;--> statement-breakpoint
-- The same for an unpublished draft of the header, so publishing it keeps the tab.
UPDATE "content_sections" AS s
SET "draft" = jsonb_set(s."draft", '{links}', (
      SELECT jsonb_agg(merged.link ORDER BY merged.position)
      FROM (
        SELECT t.link, t.position::numeric AS position
        FROM jsonb_array_elements(s."draft" -> 'links') WITH ORDINALITY AS t(link, position)
        UNION ALL
        SELECT '{"label": "Investor Hub", "href": "/investors"}'::jsonb,
               COALESCE(
                 (SELECT MIN(p.position) FROM jsonb_array_elements(s."draft" -> 'links') WITH ORDINALITY AS p(link, position) WHERE p.link ->> 'href' = '/partners'),
                 jsonb_array_length(s."draft" -> 'links')
               ) + 0.5
      ) AS merged
    ))
WHERE s."page" = 'site' AND s."section" = 'header'
  AND jsonb_typeof(s."draft" -> 'links') = 'array'
  AND jsonb_array_length(s."draft" -> 'links') < 5
  AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements(s."draft" -> 'links') AS l(link) WHERE l.link ->> 'href' LIKE '/investors%');--> statement-breakpoint
-- Tells every running server to reload the public content.
UPDATE "site_state" SET "content_version" = "content_version" + 1;
