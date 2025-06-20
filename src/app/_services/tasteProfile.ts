interface TasteProfile {
    favoriteGenres: string
    likedMovies: string
    dislikedMovies: string
    preferences: string
}

interface MovieInteraction {
    id: number
    title: string
    liked: boolean
    timestamp: string
}

export const tasteProfileService = {
    // Get the current profile
    getProfile(): TasteProfile {
        const saved = localStorage.getItem('tasteProfile')
        if (saved) {
            return JSON.parse(saved)
        }
        return {
            favoriteGenres: '',
            likedMovies: '',
            dislikedMovies: '',
            preferences: ''
        }
    },

    // Add a liked movie
    addLikedMovie(movie: { id: number; title: string }) {
        const profile = this.getProfile()
        const likedList = profile.likedMovies ? profile.likedMovies.split(', ') : []

        if (!likedList.includes(movie.title)) {
            likedList.push(movie.title)
            profile.likedMovies = likedList.join(', ')
            localStorage.setItem('tasteProfile', JSON.stringify(profile))
        }

        // Also track in interactions
        this.trackInteraction(movie.id, movie.title, true)
    },

    // Add a disliked movie
    addDislikedMovie(movie: { id: number; title: string }) {
        const profile = this.getProfile()
        const dislikedList = profile.dislikedMovies ? profile.dislikedMovies.split(', ') : []

        if (!dislikedList.includes(movie.title)) {
            dislikedList.push(movie.title)
            profile.dislikedMovies = dislikedList.join(', ')
            localStorage.setItem('tasteProfile', JSON.stringify(profile))
        }

        // Also track in interactions
        this.trackInteraction(movie.id, movie.title, false)
    },

    // Track individual interactions (for future analysis)
    trackInteraction(id: number, title: string, liked: boolean) {
        const interactions = JSON.parse(
            localStorage.getItem('movieInteractions') ?? '[]'
        ) as MovieInteraction[]

        // Remove any previous interaction with this movie
        const filtered = interactions.filter(i => i.id !== id)

        filtered.push({
            id,
            title,
            liked,
            timestamp: new Date().toISOString()
        })

        localStorage.setItem('movieInteractions', JSON.stringify(filtered))
    },

    // Generate a summary for the LLM
    generateSummary(): string {
        const profile = this.getProfile()
        const parts: string[] = []

        if (profile.favoriteGenres) {
            parts.push(`Favorite genres: ${profile.favoriteGenres}`)
        }
        if (profile.likedMovies) {
            parts.push(`Liked movies: ${profile.likedMovies}`)
        }
        if (profile.dislikedMovies) {
            parts.push(`Disliked movies: ${profile.dislikedMovies}`)
        }
        if (profile.preferences) {
            parts.push(`Preferences: ${profile.preferences}`)
        }

        return parts.length > 0
            ? `User taste profile: ${parts.join('. ')}`
            : ''
    }
}