CREATE TABLE "card_learning_states" (
	"card_id" text NOT NULL,
	"studied_by" text NOT NULL,
	"ease_factor" real DEFAULT 2.5 NOT NULL,
	"interval" integer DEFAULT 0 NOT NULL,
	"next_study_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "card_learning_states_card_id_studied_by_pk" PRIMARY KEY("card_id","studied_by")
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" text PRIMARY KEY NOT NULL,
	"deck_id" text NOT NULL,
	"front_content" text NOT NULL,
	"back_content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_events" (
	"id" text PRIMARY KEY NOT NULL,
	"deck_id" text NOT NULL,
	"studied_by" text NOT NULL,
	"card_id" text NOT NULL,
	"grade" integer NOT NULL,
	"studied_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "card_learning_states" ADD CONSTRAINT "card_learning_states_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "card_learning_states" ADD CONSTRAINT "card_learning_states_studied_by_users_id_fk" FOREIGN KEY ("studied_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "study_events" ADD CONSTRAINT "study_events_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "study_events" ADD CONSTRAINT "study_events_studied_by_users_id_fk" FOREIGN KEY ("studied_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "study_events" ADD CONSTRAINT "study_events_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "card_learning_states_studied_by_idx" ON "card_learning_states" USING btree ("studied_by");--> statement-breakpoint
CREATE INDEX "card_learning_states_next_study_date_idx" ON "card_learning_states" USING btree ("next_study_date");--> statement-breakpoint
CREATE INDEX "cards_deck_id_idx" ON "cards" USING btree ("deck_id");--> statement-breakpoint
CREATE INDEX "study_events_deck_id_idx" ON "study_events" USING btree ("deck_id");--> statement-breakpoint
CREATE INDEX "study_events_card_id_idx" ON "study_events" USING btree ("card_id");--> statement-breakpoint
CREATE INDEX "study_events_studied_by_studied_at_idx" ON "study_events" USING btree ("studied_by","studied_at");