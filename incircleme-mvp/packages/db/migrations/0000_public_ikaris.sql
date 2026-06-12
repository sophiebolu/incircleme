CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"display_name" text,
	"handle" text,
	"avatar_url" text,
	"bio" text,
	"neighbourhood" text,
	"verified" boolean DEFAULT false NOT NULL,
	"language" text DEFAULT 'ca' NOT NULL,
	"trust_tier" text DEFAULT 'newcomer' NOT NULL,
	"trust_score" integer DEFAULT 0 NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_handle_unique" UNIQUE("handle")
);
