ALTER TABLE "programs" ADD COLUMN "reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "gate_checks" jsonb;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;