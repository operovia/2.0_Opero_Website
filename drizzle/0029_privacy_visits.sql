-- The privacy notice's Analytics section now says that the site keeps its
-- own count of visits (page_views, src/server/visits.ts): what each record
-- holds, that no address is kept, that guests are named, and that records go
-- after 180 days. Only a section still reading as it shipped changes, found
-- by its heading wherever it sits in the notice, so a notice the owner has
-- reworded stays as it is. A published notice that changes gets a new
-- version, so it can be rolled back; an unpublished draft changes too, so
-- publishing it does not bring the old wording back. Safe to run again: the
-- second run finds nothing to change.
WITH "target" AS (
  SELECT s."id", (e."ord" - 1)::text AS "idx"
  FROM "content_sections" s, jsonb_array_elements(s."published" -> 'sections') WITH ORDINALITY AS e("item", "ord")
  WHERE s."page" = 'privacy' AND s."section" = 'notice'
    AND e."item" ->> 'heading' = 'Analytics'
    AND jsonb_array_length(e."item" -> 'body' -> 'content') = 1
    AND e."item" -> 'body' -> 'content' -> 0 -> 'content' -> 0 ->> 'text' = 'We may use an analytics service to understand, in aggregate, how visitors use this website. Where we do, it may set cookies or collect the standard information your browser sends, such as the pages you visit, the site that referred you, and your type of device.'
),
"updated" AS (
  UPDATE "content_sections" s
  SET "published" = jsonb_set(
        s."published",
        ARRAY['sections', t."idx", 'body', 'content', '0', 'content', '0', 'text'],
        to_jsonb('This website keeps its own count of visits. For each page you view it records the page, the time, the site that referred you, your type of device, the country the request came from when the network reports it, and a code made from your network address and browser that changes every day, so it cannot identify you or follow you from one day to the next. If you came in through the front door as an invited guest, the record also notes which guest you are. These records are kept for 180 days and shared with nobody. We may also use an analytics service to understand, in aggregate, how visitors use this website. Where we do, it may set cookies or collect the standard information your browser sends, such as the pages you visit, the site that referred you, and your type of device.'::text)
      ),
      "version" = s."version" + 1,
      "published_at" = now(),
      "published_by" = NULL
  FROM "target" t
  WHERE s."id" = t."id"
  RETURNING s."id", s."version", s."published"
)
INSERT INTO "content_versions" ("section_id", "version", "data", "note")
SELECT "id", "version", "published", 'Privacy: the site counts its own visits' FROM "updated";--> statement-breakpoint
-- The same for an unpublished draft of the notice.
WITH "target" AS (
  SELECT s."id", (e."ord" - 1)::text AS "idx"
  FROM "content_sections" s, jsonb_array_elements(s."draft" -> 'sections') WITH ORDINALITY AS e("item", "ord")
  WHERE s."page" = 'privacy' AND s."section" = 'notice'
    AND e."item" ->> 'heading' = 'Analytics'
    AND jsonb_array_length(e."item" -> 'body' -> 'content') = 1
    AND e."item" -> 'body' -> 'content' -> 0 -> 'content' -> 0 ->> 'text' = 'We may use an analytics service to understand, in aggregate, how visitors use this website. Where we do, it may set cookies or collect the standard information your browser sends, such as the pages you visit, the site that referred you, and your type of device.'
)
UPDATE "content_sections" s
SET "draft" = jsonb_set(
      s."draft",
      ARRAY['sections', t."idx", 'body', 'content', '0', 'content', '0', 'text'],
      to_jsonb('This website keeps its own count of visits. For each page you view it records the page, the time, the site that referred you, your type of device, the country the request came from when the network reports it, and a code made from your network address and browser that changes every day, so it cannot identify you or follow you from one day to the next. If you came in through the front door as an invited guest, the record also notes which guest you are. These records are kept for 180 days and shared with nobody. We may also use an analytics service to understand, in aggregate, how visitors use this website. Where we do, it may set cookies or collect the standard information your browser sends, such as the pages you visit, the site that referred you, and your type of device.'::text)
    )
FROM "target" t
WHERE s."id" = t."id";--> statement-breakpoint
-- Tells every running server to reload the public content.
UPDATE "site_state" SET "content_version" = "content_version" + 1;
