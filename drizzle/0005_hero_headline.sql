-- The hero headline, as the owner asked: "The" in italics (between asterisks)
-- and ending at "property management". Only a headline still in its earlier
-- wording changes, once, as a new version so it can be rolled back.
WITH updated AS (
  UPDATE "content_sections"
  SET "published" = jsonb_set("published", '{headline}', '"*The* AI-driven operating platform for property management."'),
      "version" = "version" + 1,
      "published_at" = now(),
      "published_by" = NULL
  WHERE "page" = 'home' AND "section" = 'hero'
    AND "published" ->> 'headline' IN ('The AI-driven operating platform for property management companies.', 'The AI-driven operating platform for property management.')
  RETURNING "id", "version", "published"
)
INSERT INTO "content_versions" ("section_id", "version", "data", "note")
SELECT "id", "version", "published", 'Italic "The", ending at property management' FROM updated;--> statement-breakpoint
-- The same for an unpublished draft of the hero.
UPDATE "content_sections"
SET "draft" = jsonb_set("draft", '{headline}', '"*The* AI-driven operating platform for property management."')
WHERE "page" = 'home' AND "section" = 'hero'
  AND "draft" ->> 'headline' IN ('The AI-driven operating platform for property management companies.', 'The AI-driven operating platform for property management.');--> statement-breakpoint
-- Tells every running server to reload the public content.
UPDATE "site_state" SET "content_version" = "content_version" + 1;
