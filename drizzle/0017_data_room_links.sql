-- The Investor Hub becomes the Data Room's Overview, at /data-room. Every
-- header or footer link still pointing at /investors now points at
-- /data-room, and reads "Data Room" if it still read "Investor Hub"; a label
-- the owner rewrote stays. The Overview's eyebrow changes the same way, only
-- while it still says "Investor Hub". Published sections that change get a
-- new version, so each can be rolled back; drafts change too, so publishing
-- one does not bring the old address back. Safe to run again: the second run
-- finds nothing left to change.
WITH changed AS (
  SELECT s."id",
    (SELECT jsonb_agg(
       CASE WHEN e."elem" ->> 'href' = '/investors'
            THEN jsonb_set(
                   jsonb_set(e."elem", '{href}', '"/data-room"'::jsonb),
                   '{label}',
                   CASE WHEN e."elem" ->> 'label' = 'Investor Hub' THEN '"Data Room"'::jsonb ELSE e."elem" -> 'label' END)
            ELSE e."elem" END
       ORDER BY e."ord")
     FROM jsonb_array_elements(s."published" -> 'links') WITH ORDINALITY AS e("elem", "ord")) AS "next"
  FROM "content_sections" AS s
  WHERE s."page" = 'site' AND s."section" IN ('header', 'footer')
    AND jsonb_typeof(s."published" -> 'links') = 'array'
    AND s."published" -> 'links' @> '[{"href": "/investors"}]'
), updated AS (
  UPDATE "content_sections" AS s
  SET "published" = jsonb_set(s."published", '{links}', c."next"),
      "version" = s."version" + 1,
      "published_at" = now(),
      "published_by" = NULL
  FROM changed AS c
  WHERE s."id" = c."id"
  RETURNING s."id", s."version", s."published"
)
INSERT INTO "content_versions" ("section_id", "version", "data", "note")
SELECT "id", "version", "published", 'The Data Room in place of the Investor Hub' FROM updated;--> statement-breakpoint
-- The same for unpublished drafts of the header and footer.
UPDATE "content_sections" AS s
SET "draft" = jsonb_set(s."draft", '{links}', (
  SELECT jsonb_agg(
    CASE WHEN e."elem" ->> 'href' = '/investors'
         THEN jsonb_set(
                jsonb_set(e."elem", '{href}', '"/data-room"'::jsonb),
                '{label}',
                CASE WHEN e."elem" ->> 'label' = 'Investor Hub' THEN '"Data Room"'::jsonb ELSE e."elem" -> 'label' END)
         ELSE e."elem" END
    ORDER BY e."ord")
  FROM jsonb_array_elements(s."draft" -> 'links') WITH ORDINALITY AS e("elem", "ord")))
WHERE s."page" = 'site' AND s."section" IN ('header', 'footer')
  AND jsonb_typeof(s."draft" -> 'links') = 'array'
  AND s."draft" -> 'links' @> '[{"href": "/investors"}]';--> statement-breakpoint
-- The Overview's eyebrow, above the founder's headline.
WITH updated AS (
  UPDATE "content_sections"
  SET "published" = "published" || '{"eyebrow": "Data Room"}'::jsonb,
      "version" = "version" + 1,
      "published_at" = now(),
      "published_by" = NULL
  WHERE "page" = 'investors' AND "section" = 'intro' AND "published" ->> 'eyebrow' = 'Investor Hub'
  RETURNING "id", "version", "published"
)
INSERT INTO "content_versions" ("section_id", "version", "data", "note")
SELECT "id", "version", "published", 'The Data Room in place of the Investor Hub' FROM updated;--> statement-breakpoint
UPDATE "content_sections"
SET "draft" = "draft" || '{"eyebrow": "Data Room"}'::jsonb
WHERE "page" = 'investors' AND "section" = 'intro' AND "draft" ->> 'eyebrow' = 'Investor Hub';--> statement-breakpoint
-- Tells every running server to reload the public content.
UPDATE "site_state" SET "content_version" = "content_version" + 1;
