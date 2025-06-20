Step 1: Create new tables (in your schema file)
typescript// user_preferences table
export const userPreferences = pgTable('user_preferences', {
  userId: text('user_id').primaryKey().references(() => user.id),
  favoriteGenres: text('favorite_genres'),
  likedMovies: text('liked_movies'),
  dislikedMovies: text('disliked_movies'),
  preferences: text('preferences'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// movie_interactions table  
export const movieInteractions = pgTable('movie_interactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => user.id),
  movieId: integer('movie_id').notNull(),
  movieTitle: text('movie_title').notNull(),
  interactionType: text('interaction_type').notNull(), // 'like', 'dislike', 'watchlist', 'watched'
  createdAt: timestamp('created_at').defaultNow(),
});

// Update messages table to include tool results
// Add column: toolResults: json('tool_results')
Step 2: Update tasteProfileService to use DB instead of localStorage

Replace localStorage calls with DB queries
Add userId parameter to all methods
Use transactions for consistency

Step 3: Update API routes to pass userId

Get user from session in chat route
Pass userId to tasteProfileService

Step 4: Update Chat.tsx to handle auth

Check if user is logged in
Pass user context to API calls

Step 5: Migration script for existing localStorage data

Read localStorage data
Insert into DB with current user's ID

Step 6: Fix poster persistence

Save tool_results in messages table
Load and parse when retrieving messages