ALTER TABLE "bookings" ADD COLUMN "deposit_payment_method_id" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "deposit_auth_intent_id" text;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "deposit_auth_status" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" text;