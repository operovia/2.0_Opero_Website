-- The Raise names the round's saved figures instead of typing them: a term
-- whose figure reads exactly as the saved round, cap or minimum would becomes
-- {round}, {cap} or {minimum}, and the cap in the "What the investor gets"
-- paragraph ("$10 million") becomes {cap in millions}. The page fills them
-- in from the same numbers the cap table's sums use, so every figure on The
-- Raise reads from one number and the visible wording does not change. A
-- figure that does not read as its saved number (the owner typed something
-- else) stays as it is. A published section that changes gets a new version,
-- so it can be rolled back; an unpublished draft changes too, so publishing
-- it does not bring the typed figures back. Safe to run again: the second run
-- finds nothing to change.
WITH "figures" AS (
  SELECT "id", "published" AS "data",
    '$' || to_char(("published" ->> 'raise')::numeric, 'FM999,999,999,999,999') AS "round_text",
    '$' || to_char(("published" ->> 'cap')::numeric, 'FM999,999,999,999,999') AS "cap_text",
    '$' || to_char(("published" ->> 'minimum')::numeric, 'FM999,999,999,999,999') AS "minimum_text",
    CASE
      WHEN ("published" ->> 'cap')::numeric >= 1000000 AND ("published" ->> 'cap')::numeric % 1000000 = 0
        THEN '$' || to_char(("published" ->> 'cap')::numeric / 1000000, 'FM999,999,999') || ' million'
      WHEN ("published" ->> 'cap')::numeric >= 1000000 AND ("published" ->> 'cap')::numeric % 100000 = 0
        THEN '$' || to_char(("published" ->> 'cap')::numeric / 1000000, 'FM999,999,990.0') || ' million'
    END AS "millions_text"
  FROM "content_sections"
  WHERE "page" = 'investors' AND "section" = 'round'
    AND jsonb_typeof("published" -> 'terms') = 'array' AND jsonb_typeof("published" -> 'getsBody') = 'string'
    AND jsonb_typeof("published" -> 'raise') = 'number' AND jsonb_typeof("published" -> 'cap') = 'number' AND jsonb_typeof("published" -> 'minimum') = 'number'
),
-- Each term whose figure reads exactly as a saved number would: the first such term for each number takes its token.
"items" AS (
  SELECT f."id", e."ord", e."item",
    CASE
      WHEN e."item" ->> 'value' = f."round_text" THEN '{round}'
      WHEN e."item" ->> 'value' = f."cap_text" THEN '{cap}'
      WHEN e."item" ->> 'value' = f."minimum_text" THEN '{minimum}'
    END AS "token"
  FROM "figures" f, jsonb_array_elements(f."data" -> 'terms') WITH ORDINALITY AS e("item", "ord")
),
"ranked" AS (
  SELECT "id", "ord", "item", "token", row_number() OVER (PARTITION BY "id", "token" ORDER BY "ord") AS "nth" FROM "items"
),
"terms" AS (
  SELECT "id",
    jsonb_agg(CASE WHEN "token" IS NOT NULL AND "nth" = 1 THEN "item" || jsonb_build_object('value', "token") ELSE "item" END ORDER BY "ord") AS "terms",
    bool_or("token" IS NOT NULL AND "nth" = 1) AS "changed"
  FROM "ranked" GROUP BY "id"
),
"changes" AS (
  SELECT f."id",
    f."data"
      || jsonb_build_object('terms', COALESCE(t."terms", f."data" -> 'terms'))
      || CASE WHEN f."millions_text" IS NOT NULL AND position(f."millions_text" in f."data" ->> 'getsBody') > 0
           THEN jsonb_build_object('getsBody', replace(f."data" ->> 'getsBody', f."millions_text", '{cap in millions}'))
           ELSE '{}'::jsonb END AS "data"
  FROM "figures" f LEFT JOIN "terms" t ON t."id" = f."id"
  WHERE COALESCE(t."changed", false)
     OR (f."millions_text" IS NOT NULL AND position(f."millions_text" in f."data" ->> 'getsBody') > 0)
),
"updated" AS (
  UPDATE "content_sections" s
  SET "published" = c."data", "version" = s."version" + 1, "published_at" = now(), "published_by" = NULL
  FROM "changes" c
  WHERE s."id" = c."id"
  RETURNING s."id", s."version", s."published"
)
INSERT INTO "content_versions" ("section_id", "version", "data", "note")
SELECT "id", "version", "published", 'The Raise: figures from the saved numbers' FROM "updated";--> statement-breakpoint
-- The same for an unpublished draft of the section.
WITH "figures" AS (
  SELECT "id", "draft" AS "data",
    '$' || to_char(("draft" ->> 'raise')::numeric, 'FM999,999,999,999,999') AS "round_text",
    '$' || to_char(("draft" ->> 'cap')::numeric, 'FM999,999,999,999,999') AS "cap_text",
    '$' || to_char(("draft" ->> 'minimum')::numeric, 'FM999,999,999,999,999') AS "minimum_text",
    CASE
      WHEN ("draft" ->> 'cap')::numeric >= 1000000 AND ("draft" ->> 'cap')::numeric % 1000000 = 0
        THEN '$' || to_char(("draft" ->> 'cap')::numeric / 1000000, 'FM999,999,999') || ' million'
      WHEN ("draft" ->> 'cap')::numeric >= 1000000 AND ("draft" ->> 'cap')::numeric % 100000 = 0
        THEN '$' || to_char(("draft" ->> 'cap')::numeric / 1000000, 'FM999,999,990.0') || ' million'
    END AS "millions_text"
  FROM "content_sections"
  WHERE "page" = 'investors' AND "section" = 'round'
    AND jsonb_typeof("draft" -> 'terms') = 'array' AND jsonb_typeof("draft" -> 'getsBody') = 'string'
    AND jsonb_typeof("draft" -> 'raise') = 'number' AND jsonb_typeof("draft" -> 'cap') = 'number' AND jsonb_typeof("draft" -> 'minimum') = 'number'
),
-- Each term whose figure reads exactly as a saved number would: the first such term for each number takes its token.
"items" AS (
  SELECT f."id", e."ord", e."item",
    CASE
      WHEN e."item" ->> 'value' = f."round_text" THEN '{round}'
      WHEN e."item" ->> 'value' = f."cap_text" THEN '{cap}'
      WHEN e."item" ->> 'value' = f."minimum_text" THEN '{minimum}'
    END AS "token"
  FROM "figures" f, jsonb_array_elements(f."data" -> 'terms') WITH ORDINALITY AS e("item", "ord")
),
"ranked" AS (
  SELECT "id", "ord", "item", "token", row_number() OVER (PARTITION BY "id", "token" ORDER BY "ord") AS "nth" FROM "items"
),
"terms" AS (
  SELECT "id",
    jsonb_agg(CASE WHEN "token" IS NOT NULL AND "nth" = 1 THEN "item" || jsonb_build_object('value', "token") ELSE "item" END ORDER BY "ord") AS "terms",
    bool_or("token" IS NOT NULL AND "nth" = 1) AS "changed"
  FROM "ranked" GROUP BY "id"
),
"changes" AS (
  SELECT f."id",
    f."data"
      || jsonb_build_object('terms', COALESCE(t."terms", f."data" -> 'terms'))
      || CASE WHEN f."millions_text" IS NOT NULL AND position(f."millions_text" in f."data" ->> 'getsBody') > 0
           THEN jsonb_build_object('getsBody', replace(f."data" ->> 'getsBody', f."millions_text", '{cap in millions}'))
           ELSE '{}'::jsonb END AS "data"
  FROM "figures" f LEFT JOIN "terms" t ON t."id" = f."id"
  WHERE COALESCE(t."changed", false)
     OR (f."millions_text" IS NOT NULL AND position(f."millions_text" in f."data" ->> 'getsBody') > 0)
)
UPDATE "content_sections" s
SET "draft" = c."data"
FROM "changes" c
WHERE s."id" = c."id";--> statement-breakpoint
-- Tells every running server to reload the public content.
UPDATE "site_state" SET "content_version" = "content_version" + 1;
