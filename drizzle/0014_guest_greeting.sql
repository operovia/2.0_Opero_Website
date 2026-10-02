ALTER TABLE "guest_invites" ADD COLUMN "greeting" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "guest_invites" ADD COLUMN "link_token" text;--> statement-breakpoint
CREATE UNIQUE INDEX "guest_invites_link_token_key" ON "guest_invites" USING btree ("link_token");