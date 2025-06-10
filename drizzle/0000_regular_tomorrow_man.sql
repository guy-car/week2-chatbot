CREATE TABLE "week2-chatbot_chat" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"title" varchar(512),
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE "week2-chatbot_messages" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"chat_id" varchar(256),
	"role" varchar(50),
	"content" text,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "week2-chatbot_messages" ADD CONSTRAINT "week2-chatbot_messages_chat_id_week2-chatbot_chat_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."week2-chatbot_chat"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chat_id_idx" ON "week2-chatbot_messages" USING btree ("chat_id");