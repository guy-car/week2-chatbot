CREATE TABLE "chat_recommendations" (
	"chat_id" text NOT NULL,
	"id_tmdb" integer NOT NULL,
	"media_type" "media_type" NOT NULL,
	"title" text NOT NULL,
	"year" integer NOT NULL,
	"added_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chats" ADD COLUMN "last_response_id" text;--> statement-breakpoint
ALTER TABLE "chat_recommendations" ADD CONSTRAINT "chat_recommendations_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_recommendations_chat_id_idx" ON "chat_recommendations" USING btree ("chat_id");--> statement-breakpoint
CREATE UNIQUE INDEX "chat_recommendations_unique" ON "chat_recommendations" USING btree ("chat_id","id_tmdb","media_type");