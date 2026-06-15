CREATE TABLE "program_credentials" (
	"id" uuid PRIMARY KEY NOT NULL,
	"program_id" uuid NOT NULL,
	"file_url" text NOT NULL,
	"file_kind" text NOT NULL,
	"notes" text,
	"verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"host_user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"language" text DEFAULT 'ca' NOT NULL,
	"curriculum" jsonb,
	"time_frame_sessions" integer,
	"time_frame_total_hours" numeric,
	"assessment_method" text,
	"accreditation_body" text,
	"accreditation_id" text,
	"references" jsonb,
	"status" text DEFAULT 'draft' NOT NULL,
	"submission_fee_cents" integer DEFAULT 15000 NOT NULL,
	"stripe_pi_id" text,
	"fee_refunded" boolean DEFAULT false NOT NULL,
	"submitted_at" timestamp with time zone,
	"verified_at" timestamp with time zone,
	"verified_by" uuid,
	"rejection_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "host_tier" text DEFAULT 'basic' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "free_program_credits" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "program_credentials" ADD CONSTRAINT "program_credentials_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_host_user_id_users_id_fk" FOREIGN KEY ("host_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_verified_by_users_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;