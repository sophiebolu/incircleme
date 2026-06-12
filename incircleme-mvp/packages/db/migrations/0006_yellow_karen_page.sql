ALTER TABLE "circle_messages" ADD COLUMN "language" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "language" text DEFAULT 'ca' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "title_ca" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "title_es" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "title_en" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "description_ca" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "description_es" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "description_en" text;