CREATE EXTENSION IF NOT EXISTS citext;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET DATA TYPE citext;