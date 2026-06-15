CREATE TABLE "program_questions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"program_id" uuid NOT NULL,
	"asker_user_id" uuid,
	"asker_name" text NOT NULL,
	"question" text NOT NULL,
	"answer" text,
	"answered_at" timestamp with time zone,
	"is_public" boolean DEFAULT true NOT NULL,
	"asked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program_voices" (
	"id" uuid PRIMARY KEY NOT NULL,
	"program_id" uuid NOT NULL,
	"quote" text NOT NULL,
	"attribution" text NOT NULL,
	"cohort_label" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "verified_tier" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "governing_body_url" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "review_notes" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "role" text DEFAULT 'member' NOT NULL;--> statement-breakpoint
ALTER TABLE "program_questions" ADD CONSTRAINT "program_questions_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_questions" ADD CONSTRAINT "program_questions_asker_user_id_users_id_fk" FOREIGN KEY ("asker_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_voices" ADD CONSTRAINT "program_voices_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;