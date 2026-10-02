-- OperoGo joins the header's navigation between Oppie and the partners link,
-- as the owner asked. Only a saved list that has the Oppie link and no OperoGo
-- link changes, once, as a new version so it can be rolled back; a site whose
-- header is not saved yet takes the new seed. Safe to run again: the second
-- run finds OperoGo already there.
WITH widened AS (
  SELECT s."id",
    (SELECT jsonb_agg(e."elem" ORDER BY e."ord")
     FROM (
       SELECT t."elem", t."ord" * 2 AS "ord" FROM jsonb_array_elements(s."published" -> 'links') WITH ORDINALITY AS t("elem", "ord")
       UNION ALL
       SELECT '{"label": "OperoGo", "href": "/#operogo"}'::jsonb, t."ord" * 2 + 1
       FROM jsonb_array_elements(s."published" -> 'links') WITH ORDINALITY AS t("elem", "ord")
       WHERE t."elem" ->> 'href' = '/#oppie'
     ) AS e) AS "next"
  FROM "content_sections" AS s
  WHERE s."page" = 'site' AND s."section" = 'header'
    AND jsonb_typeof(s."published" -> 'links') = 'array'
    AND s."published" -> 'links' @> '[{"href": "/#oppie"}]'
    AND NOT s."published" -> 'links' @> '[{"href": "/#operogo"}]'
), updated AS (
  UPDATE "content_sections" AS s
  SET "published" = jsonb_set(s."published", '{links}', w."next"),
      "version" = s."version" + 1,
      "published_at" = now(),
      "published_by" = NULL
  FROM widened AS w
  WHERE s."id" = w."id"
  RETURNING s."id", s."version", s."published"
)
INSERT INTO "content_versions" ("section_id", "version", "data", "note")
SELECT "id", "version", "published", 'OperoGo in the navigation' FROM updated;--> statement-breakpoint
-- The same for an unpublished draft of the header.
UPDATE "content_sections" AS s
SET "draft" = jsonb_set(s."draft", '{links}', (
  SELECT jsonb_agg(e."elem" ORDER BY e."ord")
  FROM (
    SELECT t."elem", t."ord" * 2 AS "ord" FROM jsonb_array_elements(s."draft" -> 'links') WITH ORDINALITY AS t("elem", "ord")
    UNION ALL
    SELECT '{"label": "OperoGo", "href": "/#operogo"}'::jsonb, t."ord" * 2 + 1
    FROM jsonb_array_elements(s."draft" -> 'links') WITH ORDINALITY AS t("elem", "ord")
    WHERE t."elem" ->> 'href' = '/#oppie'
  ) AS e))
WHERE s."page" = 'site' AND s."section" = 'header'
  AND jsonb_typeof(s."draft" -> 'links') = 'array'
  AND s."draft" -> 'links' @> '[{"href": "/#oppie"}]'
  AND NOT s."draft" -> 'links' @> '[{"href": "/#operogo"}]';--> statement-breakpoint
-- Tells every running server to reload the public content.
UPDATE "site_state" SET "content_version" = "content_version" + 1;
