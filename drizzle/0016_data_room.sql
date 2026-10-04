CREATE TABLE "data_room_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"folder_id" uuid,
	"title" text NOT NULL,
	"filename" text NOT NULL,
	"storage_key" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "data_room_documents_storage_key_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "data_room_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"invite_id" uuid,
	"email" text DEFAULT '' NOT NULL,
	"action" text NOT NULL,
	"ip" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_room_folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "data_room_documents" ADD CONSTRAINT "data_room_documents_folder_id_data_room_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."data_room_folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_room_documents" ADD CONSTRAINT "data_room_documents_uploaded_by_admin_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_room_events" ADD CONSTRAINT "data_room_events_document_id_data_room_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."data_room_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_room_events" ADD CONSTRAINT "data_room_events_invite_id_guest_invites_id_fk" FOREIGN KEY ("invite_id") REFERENCES "public"."guest_invites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_room_folders" ADD CONSTRAINT "data_room_folders_parent_id_data_room_folders_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."data_room_folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_room_folders" ADD CONSTRAINT "data_room_folders_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "data_room_documents_folder_idx" ON "data_room_documents" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "data_room_events_document_idx" ON "data_room_events" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "data_room_events_invite_idx" ON "data_room_events" USING btree ("invite_id");--> statement-breakpoint
CREATE INDEX "data_room_folders_parent_idx" ON "data_room_folders" USING btree ("parent_id");