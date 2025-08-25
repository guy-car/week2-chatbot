import { sql } from "drizzle-orm";
import {
  index,
  pgTableCreator,
  text,
  timestamp,
  boolean,
  jsonb,
  varchar,
  pgEnum,
  uniqueIndex,
  real,  // For rating as float
  integer
} from "drizzle-orm/pg-core";

import { type MovieData } from "~/app/types/index"

// Enums for type safety
export const interactionTypeEnum = pgEnum('interaction_type', ['like', 'dislike', 'watchlist', 'watched']);
export const collectionTypeEnum = pgEnum('collection_type', ['watchlist', 'history']);
export const mediaTypeEnum = pgEnum('media_type', ['movie', 'tv']);

export const createTable = pgTableCreator((name) => name);

// Updated chats table - fix the consistency issue
export const chats = createTable("chats", {  // Changed from "chat" to "chats" for consistency
  id: text('id').primaryKey(),
  title: varchar('title', { length: 512 }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  lastResponseId: text('last_response_id'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}, (t) => [
  index("chats_user_id_idx").on(t.userId)
]);

// Messages with tool results
export const messages = createTable("messages", {
  id: text('id').primaryKey(),
  chatId: text('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  role: varchar('role', { length: 50 }).notNull(),
  content: text('content').notNull(),
  toolResults: jsonb('tool_results').$type<MovieData[]>(),  // Type hint for Drizzle
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}, (t) => [
  index("messages_chat_id_idx").on(t.chatId)
]);

// User preferences
export const userPreferences = createTable("user_preferences", {
  userId: text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  favoriteGenres: text('favorite_genres'),
  likedMovies: text('liked_movies'),
  dislikedMovies: text('disliked_movies'),
  preferences: text('preferences'),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
});

// User movies - now includes overview and rating
export const userMovies = createTable("user_movies", {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  movieId: varchar('movie_id', { length: 50 }).notNull(),
  title: text('title').notNull(),
  posterUrl: text('poster_url'),
  mediaType: mediaTypeEnum('media_type').notNull(),
  releaseDate: text('release_date'),
  rating: real('rating'),  // Added rating
  overview: text('overview'),  // Added overview
  collectionType: collectionTypeEnum('collection_type').notNull(),
  addedAt: timestamp('added_at', { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}, (t) => [
  index("user_movies_user_id_idx").on(t.userId),
  index("user_movies_movie_id_idx").on(t.movieId),
  // Prevent duplicate entries
  uniqueIndex("user_movies_unique").on(t.userId, t.movieId, t.collectionType)
]);

// Movie interactions
export const movieInteractions = createTable("movie_interactions", {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  movieId: varchar('movie_id', { length: 50 }).notNull(),
  movieTitle: text('movie_title').notNull(),
  interactionType: interactionTypeEnum('interaction_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}, (t) => [
  index("movie_interactions_user_id_idx").on(t.userId)
]);

// Chat-level recommendations (persisted excludes for dedupe)
export const chatRecommendations = createTable("chat_recommendations", {
  chatId: text('chat_id').notNull().references(() => chats.id, { onDelete: 'cascade' }),
  idTmdb: integer('id_tmdb').notNull(),
  mediaType: mediaTypeEnum('media_type').notNull(),
  title: text('title').notNull(),
  year: integer('year').notNull(),
  addedAt: timestamp('added_at', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (t) => [
  index('chat_recommendations_chat_id_idx').on(t.chatId),
  uniqueIndex('chat_recommendations_unique').on(t.chatId, t.idTmdb, t.mediaType)
]);

// Better-Auth schema

export const user = createTable("user", {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').$defaultFn(() => false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()).notNull(),
  updatedAt: timestamp('updated_at').$defaultFn(() => /* @__PURE__ */ new Date()).notNull()
});

export const session = createTable("session", {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' })
});

export const account = createTable("account", {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull()
});

export const verification = createTable("verification", {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').$defaultFn(() => /* @__PURE__ */ new Date()),
  updatedAt: timestamp('updated_at').$defaultFn(() => /* @__PURE__ */ new Date())
});

export const schema = {
  user: user,
  session: session,
  account: account,
  verification: verification
}