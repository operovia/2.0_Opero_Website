CREATE TABLE "guest_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"invited_by" uuid,
	"first_entered_at" timestamp with time zone,
	"last_entered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"invite_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip" text DEFAULT '' NOT NULL,
	"user_agent" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "guest_invites" ADD CONSTRAINT "guest_invites_invited_by_admin_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_sessions" ADD CONSTRAINT "guest_sessions_invite_id_guest_invites_id_fk" FOREIGN KEY ("invite_id") REFERENCES "public"."guest_invites"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "guest_invites_email_key" ON "guest_invites" USING btree ("email");--> statement-breakpoint
CREATE INDEX "guest_sessions_invite_idx" ON "guest_sessions" USING btree ("invite_id");--> statement-breakpoint
ALTER TABLE "site_settings" DROP COLUMN "investor_hub_enabled";