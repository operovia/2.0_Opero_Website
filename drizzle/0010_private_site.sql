-- Each guest has a role: a visitor sees the site, an investor the site and the
-- Investor Hub. Everyone on the list so far was invited for the Investor Hub,
-- so the column arrives with that as its default, and only then takes the
-- default new guests get. Safe to run twice: the column is added once, and
-- the default is simply set again.
ALTER TABLE "guest_invites" ADD COLUMN "role" text DEFAULT 'investor' NOT NULL;--> statement-breakpoint
ALTER TABLE "guest_invites" ALTER COLUMN "role" SET DEFAULT 'visitor';--> statement-breakpoint
-- The private site: everyone enters through the front door with an address on
-- the guest list. On from the start, as the owner asked; Settings turns it off.
ALTER TABLE "site_settings" ADD COLUMN "private_site" boolean DEFAULT true NOT NULL;
