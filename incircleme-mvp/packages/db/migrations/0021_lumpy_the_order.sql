ALTER TABLE "reviews" ADD COLUMN "hidden_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "hidden_reason" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "hidden_by" uuid;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_hidden_by_users_id_fk" FOREIGN KEY ("hidden_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;