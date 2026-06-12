CREATE TABLE "capsule_items" (
	"id" uuid PRIMARY KEY NOT NULL,
	"capsule_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"payload" jsonb NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "capsules" (
	"id" uuid PRIMARY KEY NOT NULL,
	"circle_id" uuid NOT NULL,
	"event_id" uuid NOT NULL,
	"hero_photo_url" text,
	"stats" jsonb NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "capsules_circle_id_unique" UNIQUE("circle_id")
);
--> statement-breakpoint
ALTER TABLE "capsule_items" ADD CONSTRAINT "capsule_items_capsule_id_capsules_id_fk" FOREIGN KEY ("capsule_id") REFERENCES "public"."capsules"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capsules" ADD CONSTRAINT "capsules_circle_id_circles_id_fk" FOREIGN KEY ("circle_id") REFERENCES "public"."circles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "capsules" ADD CONSTRAINT "capsules_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;