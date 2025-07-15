CREATE TYPE "public"."collection_type" AS ENUM('watchlist', 'history');--> statement-breakpoint
CREATE TYPE "public"."interaction_type" AS ENUM('like', 'dislike', 'watchlist', 'watched');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('movie', 'tv');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(512),
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"role" varchar(50) NOT NULL,
	"content" text NOT NULL,
	"tool_results" jsonb,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movie_interactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"movie_id" varchar(50) NOT NULL,
	"movie_title" text NOT NULL,
	"interaction_type" "interaction_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "user_movies" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"movie_id" varchar(50) NOT NULL,
	"title" text NOT NULL,
	"poster_url" text,
	"media_type" "media_type" NOT NULL,
	"release_date" text,
	"rating" real,
	"overview" text,
	"collection_type" "collection_type" NOT NULL,
	"added_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" text PRIMARY KEY NOT NULL,
	"favorite_genres" text,
	"liked_movies" text,
	"disliked_movies" text,
	"preferences" text,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movie_interactions" ADD CONSTRAINT "movie_interactions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_movies" ADD CONSTRAINT "user_movies_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chats_user_id_idx" ON "chats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "messages_chat_id_idx" ON "messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "movie_interactions_user_id_idx" ON "movie_interactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_movies_user_id_idx" ON "user_movies" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_movies_movie_id_idx" ON "user_movies" USING btree ("movie_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_movies_unique" ON "user_movies" USING btree ("user_id","movie_id","collection_type");

-- ROW-LEVEL SECURITY POLICIES
-- Enable RLS for all user-related tables
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movie_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session ENABLE ROW LEVEL SECURITY;

-- Recreate all policies with the performant syntax
CREATE POLICY "Allow full access to own chats"
ON public.chats FOR ALL
USING (user_id = (SELECT current_setting('rls.user_id', true)))
WITH CHECK (user_id = (SELECT current_setting('rls.user_id', true)));

CREATE POLICY "Allow full access to own messages"
ON public.messages FOR ALL
USING ((SELECT user_id FROM public.chats WHERE id = chat_id) = (SELECT current_setting('rls.user_id', true)))
WITH CHECK ((SELECT user_id FROM public.chats WHERE id = chat_id) = (SELECT current_setting('rls.user_id', true)));

CREATE POLICY "Allow full access to own user_preferences"
ON public.user_preferences FOR ALL
USING (user_id = (SELECT current_setting('rls.user_id', true)))
WITH CHECK (user_id = (SELECT current_setting('rls.user_id', true)));

CREATE POLICY "Allow full access to own user_movies"
ON public.user_movies FOR ALL
USING (user_id = (SELECT current_setting('rls.user_id', true)))
WITH CHECK (user_id = (SELECT current_setting('rls.user_id', true)));

CREATE POLICY "Allow full access to own movie_interactions"
ON public.movie_interactions FOR ALL
USING (user_id = (SELECT current_setting('rls.user_id', true)))
WITH CHECK (user_id = (SELECT current_setting('rls.user_id', true)));

CREATE POLICY "Allow full access to own user record"
ON public.user FOR ALL
USING (id = (SELECT current_setting('rls.user_id', true)))
WITH CHECK (id = (SELECT current_setting('rls.user_id', true)));

CREATE POLICY "Allow full access to own account"
ON public.account FOR ALL
USING (user_id = (SELECT current_setting('rls.user_id', true)))
WITH CHECK (user_id = (SELECT current_setting('rls.user_id', true)));

CREATE POLICY "Allow full access to own session"
ON public.session FOR ALL
USING (user_id = (SELECT current_setting('rls.user_id', true)))
WITH CHECK (user_id = (SELECT current_setting('rls.user_id', true)));