CREATE TABLE "page_views" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "page_views_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"path" text NOT NULL,
	"referrer" text DEFAULT '' NOT NULL,
	"visitor" text NOT NULL,
	"kind" text DEFAULT 'public' NOT NULL,
	"invite_id" uuid,
	"email" text DEFAULT '' NOT NULL,
	"device" text DEFAULT 'desktop' NOT NULL,
	"country" text DEFAULT '' NOT NULL,
	"bot" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "page_views" ADD CONSTRAINT "page_views_invite_id_guest_invites_id_fk" FOREIGN KEY ("invite_id") REFERENCES "public"."guest_invites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "page_views_created_idx" ON "page_views" USING btree ("created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "page_views_path_idx" ON "page_views" USING btree ("path","created_at");