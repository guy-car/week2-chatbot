import type { Database } from "~/server/db";

export const tasteProfileServerService = {
  async getProfileForChat(userId: string, db: Database) {
    const { userPreferences } = await import("~/server/db/schema");
    const { eq } = await import("drizzle-orm");

    const profile = await db.query.userPreferences.findFirst({
      where: eq(userPreferences.userId, userId),
    });

    return profile ?? {
      favoriteGenres: '',
      likedMovies: '',
      dislikedMovies: '',
      preferences: ''
    };
  },

  generateSummary(profile: {
    favoriteGenres: string | null;
    likedMovies: string | null;
    dislikedMovies: string | null;
    preferences: string | null;
  }): string {
    const parts: string[] = [];
    if (profile.favoriteGenres) parts.push(`Favorite genres: ${profile.favoriteGenres}`);
    if (profile.likedMovies) parts.push(`Liked movies: ${profile.likedMovies}`);
    if (profile.dislikedMovies) parts.push(`Disliked movies: ${profile.dislikedMovies}`);
    if (profile.preferences) parts.push(`Preferences: ${profile.preferences}`);
    return parts.length > 0 ? `User taste profile: ${parts.join('. ')}` : '';
  }
};


