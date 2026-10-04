-- Website review, Phase 1: the home page's title, description and headline.
-- The headline becomes "Integrated Intelligent Property Management", and the
-- search title and description with it, where they still carry the words the
-- site shipped with; copy the owner rewrote stays. The hero's paragraph gives
-- way to three points, which the seed supplies to saved content that has
-- none. A published section that changes gets a new version, so it can be
-- rolled back; an unpublished draft changes too. Safe to run again.
UPDATE "site_settings"
SET "home_meta_title" = 'Opero: Integrated Intelligent Property Management'
WHERE "home_meta_title" = 'Opero: The AI-driven operating platform for property management';--> statement-breakpoint
UPDATE "site_settings"
SET "home_meta_description" = 'One unified system to replace the patchwork of disconnected apps your teams run every day, anchored by a purpose-built property management core CRM, with Oppie, your AI assistant, built in.'
WHERE "home_meta_description" = 'One system, built around a core CRM, that replaces the patchwork of disconnected apps your teams run every day, with Oppie, your AI assistant, woven into every step.';--> statement-breakpoint
WITH updated AS (
  UPDATE "content_sections"
  SET "published" = "published" || '{"headline": "Integrated Intelligent Property Management"}'::jsonb,
      "version" = "version" + 1,
      "published_at" = now(),
      "published_by" = NULL
  WHERE "page" = 'home' AND "section" = 'hero'
    AND "published" ->> 'headline' IN ('*The* AI-driven operating platform for property management.', 'The AI-driven operating platform for property management.')
  RETURNING "id", "version", "published"
)
INSERT INTO "content_versions" ("section_id", "version", "data", "note")
SELECT "id", "version", "published", 'Website review: the headline' FROM updated;--> statement-breakpoint
UPDATE "content_sections"
SET "draft" = "draft" || '{"headline": "Integrated Intelligent Property Management"}'::jsonb
WHERE "page" = 'home' AND "section" = 'hero'
  AND "draft" ->> 'headline' IN ('*The* AI-driven operating platform for property management.', 'The AI-driven operating platform for property management.');--> statement-breakpoint
-- Tells every running server to reload the public content.
UPDATE "site_state" SET "content_version" = "content_version" + 1;
