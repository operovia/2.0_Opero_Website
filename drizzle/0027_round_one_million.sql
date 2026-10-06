-- The round is $1,000,000, sized by the owner from the budget, up from the
-- $750,000 it shipped with; the cap stays at $10,000,000. Only a round still
-- at the shipped $750,000 changes, and only where the saved figures can take
-- $1,000,000 (a cap above it, and a slider step that fits into it), so a
-- round the owner chose stays as it is. The Raise and the cap table read the
-- round from this one number, so both follow it. A published section that
-- changes gets a new version, so it can be rolled back; an unpublished draft
-- changes too, so publishing it does not bring the old round back. Safe to
-- run again: the second run finds nothing to change. Each figure is read
-- through CASE, so a value that is not a number is skipped, never cast.
WITH "figures" AS (
  SELECT "id",
    CASE WHEN jsonb_typeof("published" -> 'raise') = 'number' THEN ("published" ->> 'raise')::numeric END AS "raise",
    CASE WHEN jsonb_typeof("published" -> 'cap') = 'number' THEN ("published" ->> 'cap')::numeric END AS "cap",
    CASE WHEN jsonb_typeof("published" -> 'step') = 'number' THEN ("published" ->> 'step')::numeric END AS "step"
  FROM "content_sections"
  WHERE "page" = 'investors' AND "section" = 'round'
),
"updated" AS (
  UPDATE "content_sections" s
  SET "published" = s."published" || '{"raise": 1000000}'::jsonb,
      "version" = s."version" + 1,
      "published_at" = now(),
      "published_by" = NULL
  FROM "figures" f
  WHERE s."id" = f."id" AND f."raise" = 750000 AND f."cap" > 1000000
    AND (CASE WHEN f."step" > 0 THEN 1000000 % f."step" END) = 0
  RETURNING s."id", s."version", s."published"
)
INSERT INTO "content_versions" ("section_id", "version", "data", "note")
SELECT "id", "version", "published", 'The round: $1,000,000' FROM "updated";--> statement-breakpoint
-- The same for an unpublished draft of the section.
WITH "figures" AS (
  SELECT "id",
    CASE WHEN jsonb_typeof("draft" -> 'raise') = 'number' THEN ("draft" ->> 'raise')::numeric END AS "raise",
    CASE WHEN jsonb_typeof("draft" -> 'cap') = 'number' THEN ("draft" ->> 'cap')::numeric END AS "cap",
    CASE WHEN jsonb_typeof("draft" -> 'step') = 'number' THEN ("draft" ->> 'step')::numeric END AS "step"
  FROM "content_sections"
  WHERE "page" = 'investors' AND "section" = 'round'
)
UPDATE "content_sections" s
SET "draft" = s."draft" || '{"raise": 1000000}'::jsonb
FROM "figures" f
WHERE s."id" = f."id" AND f."raise" = 750000 AND f."cap" > 1000000
  AND (CASE WHEN f."step" > 0 THEN 1000000 % f."step" END) = 0;--> statement-breakpoint
-- Tells every running server to reload the public content.
UPDATE "site_state" SET "content_version" = "content_version" + 1;
