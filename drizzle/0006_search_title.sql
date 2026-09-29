-- The home page's search title matches the headline: it ends at "property
-- management". Only a title still in its earlier wording changes.
UPDATE "site_settings"
SET "home_meta_title" = 'Opero: The AI-driven operating platform for property management',
    "updated_at" = now()
WHERE "home_meta_title" = 'Opero: The AI-driven operating platform for property management companies';--> statement-breakpoint
-- Tells every running server to reload the public content, settings included.
UPDATE "site_state" SET "content_version" = "content_version" + 1;
