ALTER TABLE "notifications" ADD COLUMN "event_id" uuid;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "booking_id" uuid;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "amount_cents" integer;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "credit_cents" integer;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_user_created_idx" ON "notifications" USING btree ("user_id","sent_at" DESC);--> statement-breakpoint
CREATE INDEX "notifications_user_unread_idx" ON "notifications" USING btree ("user_id") WHERE "read_at" is null;
