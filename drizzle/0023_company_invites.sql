CREATE TABLE "guest_confirmations" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"domain_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guest_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"domain" text NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"role" text DEFAULT 'visitor' NOT NULL,
	"greeting" text DEFAULT '' NOT NULL,
	"invited_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "guest_invites" ADD COLUMN "domain_id" uuid;--> statement-breakpoint
ALTER TABLE "guest_confirmations" ADD CONSTRAINT "guest_confirmations_domain_id_guest_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."guest_domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guest_domains" ADD CONSTRAINT "guest_domains_invited_by_admin_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "guest_confirmations_domain_idx" ON "guest_confirmations" USING btree ("domain_id");--> statement-breakpoint
CREATE UNIQUE INDEX "guest_domains_domain_key" ON "guest_domains" USING btree ("domain");--> statement-breakpoint
ALTER TABLE "guest_invites" ADD CONSTRAINT "guest_invites_domain_id_guest_domains_id_fk" FOREIGN KEY ("domain_id") REFERENCES "public"."guest_domains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "guest_invites_domain_idx" ON "guest_invites" USING btree ("domain_id");