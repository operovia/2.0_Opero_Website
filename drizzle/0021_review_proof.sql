-- Website review, Phase 4: the proof stats. Three of the saved stats carried
-- the figure in the label and the label in the figure; each is put the right
-- way round and reworded as the review's deck gives it (C14), every stat
-- gets its short label for the strip under the hero, and the four stand in
-- the strip's order (C12): people, square feet, units, then the money. The
-- headline reads "100+ Current Users at Flagship Operator" where it still
-- read "105 ..." (C13). Only stats and headlines still in those words change,
-- so copy the owner rewrote stays. A published section that changes gets a new version,
-- so it can be rolled back; an unpublished draft changes too. Safe to run
-- again: a second run finds the stats already the right way round.
WITH fixed AS (
  SELECT s."id", s."col",
    (SELECT jsonb_agg(f."e" ORDER BY CASE f."e" ->> 'value' WHEN '100+' THEN 1 WHEN '2.5M+' THEN 2 WHEN '850+' THEN 3 WHEN '$100K+' THEN 4 ELSE 5 END, f."ord")
     FROM (SELECT
       CASE
         WHEN t."e" ->> 'value' = '100+' AND t."e" ->> 'label' = 'People work in it daily' AND NOT (t."e" ? 'short') THEN t."e" || '{"short": "daily users"}'::jsonb
         WHEN (t."e" ->> 'value' = 'Licensing Fees Saved' AND t."e" ->> 'label' = '$100k+') OR (t."e" ->> 'value' = '$100k+' AND t."e" ->> 'label' = 'Licensing Fees Saved')
           THEN '{"value": "$100K+", "label": "Licensing fees saved each year", "short": "a year in licensing fees replaced"}'::jsonb
         WHEN (t."e" ->> 'value' = 'Square Footage Live' AND t."e" ->> 'label' = '2.5M+') OR (t."e" ->> 'value' = '2.5M+' AND t."e" ->> 'label' = 'Square Footage Live')
           THEN '{"value": "2.5M+", "label": "Square feet live", "short": "sq ft live"}'::jsonb
         WHEN (t."e" ->> 'value' = 'Residential Units Live' AND t."e" ->> 'label' = '850+') OR (t."e" ->> 'value' = '850+' AND t."e" ->> 'label' = 'Residential Units Live')
           THEN '{"value": "850+", "label": "Residential units live", "short": "residential units"}'::jsonb
         ELSE t."e"
       END AS "e", t."ord"
       FROM jsonb_array_elements(s."data" -> 'stats') WITH ORDINALITY AS t("e", "ord")) AS f) AS "stats"
  FROM (
    SELECT "id", 'published' AS "col", "published" AS "data" FROM "content_sections" WHERE "page" = 'home' AND "section" = 'proof'
    UNION ALL
    SELECT "id", 'draft', "draft" FROM "content_sections" WHERE "page" = 'home' AND "section" = 'proof'
  ) AS s
  WHERE jsonb_typeof(s."data" -> 'stats') = 'array'
    AND (s."data" -> 'stats' @> '[{"label": "$100k+"}]' OR s."data" -> 'stats' @> '[{"label": "Licensing Fees Saved"}]'
      OR s."data" -> 'stats' @> '[{"label": "2.5M+"}]' OR s."data" -> 'stats' @> '[{"label": "Square Footage Live"}]'
      OR s."data" -> 'stats' @> '[{"label": "850+"}]' OR s."data" -> 'stats' @> '[{"label": "Residential Units Live"}]'
      OR s."data" -> 'stats' @> '[{"value": "100+", "label": "People work in it daily"}]')
), updated AS (
  UPDATE "content_sections" AS c
  SET "published" = jsonb_set(c."published", '{stats}', f."stats"),
      "version" = c."version" + 1,
      "published_at" = now(),
      "published_by" = NULL
  FROM fixed AS f
  WHERE c."id" = f."id" AND f."col" = 'published' AND c."published" -> 'stats' <> f."stats"
  RETURNING c."id", c."version", c."published"
)
INSERT INTO "content_versions" ("section_id", "version", "data", "note")
SELECT "id", "version", "published", 'Website review: the proof stats' FROM updated;--> statement-breakpoint
WITH fixed AS (
  SELECT s."id",
    (SELECT jsonb_agg(f."e" ORDER BY CASE f."e" ->> 'value' WHEN '100+' THEN 1 WHEN '2.5M+' THEN 2 WHEN '850+' THEN 3 WHEN '$100K+' THEN 4 ELSE 5 END, f."ord")
     FROM (SELECT
       CASE
         WHEN t."e" ->> 'value' = '100+' AND t."e" ->> 'label' = 'People work in it daily' AND NOT (t."e" ? 'short') THEN t."e" || '{"short": "daily users"}'::jsonb
         WHEN (t."e" ->> 'value' = 'Licensing Fees Saved' AND t."e" ->> 'label' = '$100k+') OR (t."e" ->> 'value' = '$100k+' AND t."e" ->> 'label' = 'Licensing Fees Saved')
           THEN '{"value": "$100K+", "label": "Licensing fees saved each year", "short": "a year in licensing fees replaced"}'::jsonb
         WHEN (t."e" ->> 'value' = 'Square Footage Live' AND t."e" ->> 'label' = '2.5M+') OR (t."e" ->> 'value' = '2.5M+' AND t."e" ->> 'label' = 'Square Footage Live')
           THEN '{"value": "2.5M+", "label": "Square feet live", "short": "sq ft live"}'::jsonb
         WHEN (t."e" ->> 'value' = 'Residential Units Live' AND t."e" ->> 'label' = '850+') OR (t."e" ->> 'value' = '850+' AND t."e" ->> 'label' = 'Residential Units Live')
           THEN '{"value": "850+", "label": "Residential units live", "short": "residential units"}'::jsonb
         ELSE t."e"
       END AS "e", t."ord"
       FROM jsonb_array_elements(s."draft" -> 'stats') WITH ORDINALITY AS t("e", "ord")) AS f) AS "stats"
  FROM "content_sections" AS s
  WHERE s."page" = 'home' AND s."section" = 'proof' AND jsonb_typeof(s."draft" -> 'stats') = 'array'
)
UPDATE "content_sections" AS c
SET "draft" = jsonb_set(c."draft", '{stats}', f."stats")
FROM fixed AS f
WHERE c."id" = f."id" AND c."draft" -> 'stats' <> f."stats";--> statement-breakpoint
-- The headline (C13).
WITH updated AS (
  UPDATE "content_sections"
  SET "published" = "published" || '{"headline": "100+ Current Users at Flagship Operator"}'::jsonb,
      "version" = "version" + 1,
      "published_at" = now(),
      "published_by" = NULL
  WHERE "page" = 'home' AND "section" = 'proof' AND "published" ->> 'headline' = '105 Current Users at Flagship Operator'
  RETURNING "id", "version", "published"
)
INSERT INTO "content_versions" ("section_id", "version", "data", "note")
SELECT "id", "version", "published", 'Website review: the proof headline' FROM updated;--> statement-breakpoint
UPDATE "content_sections"
SET "draft" = "draft" || '{"headline": "100+ Current Users at Flagship Operator"}'::jsonb
WHERE "page" = 'home' AND "section" = 'proof' AND "draft" ->> 'headline' = '105 Current Users at Flagship Operator';--> statement-breakpoint
-- Tells every running server to reload the public content.
UPDATE "site_state" SET "content_version" = "content_version" + 1;
