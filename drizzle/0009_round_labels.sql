-- The round's cap table names its holders by role (Founder, Flagship operator,
-- Employee pool) rather than by name, as the owner asked, and its note says
-- "the flagship operator". Only a table still carrying the earlier labels
-- changes, once, as a new version so it can be rolled back. A site whose round
-- section is not seeded yet gets the new seed on its next start.
WITH relabeled AS (
  SELECT "id",
    jsonb_set(
      jsonb_set("published", '{capTable}', (
        SELECT COALESCE(jsonb_agg(
          CASE
            WHEN "row" ->> 'holder' = 'Joseph Mifsud' THEN "row" || jsonb_build_object('holder', 'Founder', 'class', CASE WHEN "row" ->> 'class' = 'Common, founder' THEN 'Common' ELSE "row" ->> 'class' END)
            WHEN "row" ->> 'holder' = 'Oxford Companies' THEN "row" || '{"holder": "Flagship operator"}'::jsonb
            WHEN "row" ->> 'holder' = 'Equity incentive plan' THEN "row" || '{"holder": "Employee pool"}'::jsonb
            ELSE "row"
          END ORDER BY "ord"), '[]'::jsonb)
        FROM jsonb_array_elements("published" -> 'capTable') WITH ORDINALITY AS t("row", "ord")
      )),
      '{capNote}',
      to_jsonb(replace(COALESCE("published" ->> 'capNote', ''), 'Oxford Companies'' position', 'The flagship operator''s position')),
      false
    ) AS "next"
  FROM "content_sections"
  WHERE "page" = 'investors' AND "section" = 'round'
    AND jsonb_typeof("published" -> 'capTable') = 'array'
    AND ("published" -> 'capTable' @> '[{"holder": "Joseph Mifsud"}]'
      OR "published" -> 'capTable' @> '[{"holder": "Oxford Companies"}]'
      OR "published" -> 'capTable' @> '[{"holder": "Equity incentive plan"}]'
      OR COALESCE("published" ->> 'capNote', '') LIKE 'Oxford Companies'' position%')
), updated AS (
  UPDATE "content_sections" AS s
  SET "published" = r."next",
      "version" = s."version" + 1,
      "published_at" = now(),
      "published_by" = NULL
  FROM relabeled AS r
  WHERE s."id" = r."id"
  RETURNING s."id", s."version", s."published"
)
INSERT INTO "content_versions" ("section_id", "version", "data", "note")
SELECT "id", "version", "published", 'Cap table holders named by role' FROM updated;--> statement-breakpoint
-- The same for an unpublished draft of the round.
UPDATE "content_sections"
SET "draft" = jsonb_set(
  jsonb_set("draft", '{capTable}', (
    SELECT COALESCE(jsonb_agg(
      CASE
        WHEN "row" ->> 'holder' = 'Joseph Mifsud' THEN "row" || jsonb_build_object('holder', 'Founder', 'class', CASE WHEN "row" ->> 'class' = 'Common, founder' THEN 'Common' ELSE "row" ->> 'class' END)
        WHEN "row" ->> 'holder' = 'Oxford Companies' THEN "row" || '{"holder": "Flagship operator"}'::jsonb
        WHEN "row" ->> 'holder' = 'Equity incentive plan' THEN "row" || '{"holder": "Employee pool"}'::jsonb
        ELSE "row"
      END ORDER BY "ord"), '[]'::jsonb)
    FROM jsonb_array_elements("draft" -> 'capTable') WITH ORDINALITY AS t("row", "ord")
  )),
  '{capNote}',
  to_jsonb(replace(COALESCE("draft" ->> 'capNote', ''), 'Oxford Companies'' position', 'The flagship operator''s position')),
  false
)
WHERE "page" = 'investors' AND "section" = 'round'
  AND jsonb_typeof("draft" -> 'capTable') = 'array'
  AND ("draft" -> 'capTable' @> '[{"holder": "Joseph Mifsud"}]'
    OR "draft" -> 'capTable' @> '[{"holder": "Oxford Companies"}]'
    OR "draft" -> 'capTable' @> '[{"holder": "Equity incentive plan"}]'
    OR COALESCE("draft" ->> 'capNote', '') LIKE 'Oxford Companies'' position%');--> statement-breakpoint
-- Tells every running server to reload the public content.
UPDATE "site_state" SET "content_version" = "content_version" + 1;
