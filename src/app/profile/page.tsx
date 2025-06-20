'use client'

import { useState, useEffect } from 'react'
import { Save, Edit2, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface TasteProfile {
    favoriteGenres: string
    likedMovies: string
    dislikedMovies: string
    preferences: string
}

export default function ProfilePage() {
    const [profile, setProfile] = useState<TasteProfile>({
        favoriteGenres: '',
        likedMovies: '',
        dislikedMovies: '',
        preferences: ''
    })
    const [isEditing, setIsEditing] = useState(false)
    const [charCount, setCharCount] = useState(0)
    const MAX_CHARS = 500

    useEffect(() => {
        const saved = localStorage.getItem('tasteProfile')
        if (saved) {
            setProfile(JSON.parse(saved))
        }
    }, [])

    useEffect(() => {
        const total = Object.values(profile).join('').length
        setCharCount(total)
    }, [profile])

    const handleSave = () => {
        localStorage.setItem('tasteProfile', JSON.stringify(profile))
        toast.success('Taste profile saved!')
        setIsEditing(false)
    }

    const handleCancel = () => {
        // Reload saved data
        const saved = localStorage.getItem('tasteProfile')
        if (saved) {
            setProfile(JSON.parse(saved))
        }
        setIsEditing(false)
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Your Taste Profile</h1>
                    <p className="text-gray-600">
                        {isEditing ? 'Customize your preferences' : 'Based on your movie interactions'}
                        {isEditing && (
                            <span className={`ml-2 ${charCount > MAX_CHARS ? 'text-red-500' : 'text-gray-500'}`}>
                                {charCount}/{MAX_CHARS} characters
                            </span>
                        )}
                    </p>
                </div>

                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                        Edit
                    </button>
                )}
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                        Favorite Genres
                    </label>
                    <input
                        type="text"
                        placeholder={isEditing ? "Sci-fi, thriller, comedy..." : "No genres detected yet"}
                        className={`w-full px-4 py-2 border rounded-lg ${isEditing
                            ? 'bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                            : 'bg-gray-50 text-gray-600 cursor-not-allowed'
                            }`}
                        value={profile.favoriteGenres}
                        onChange={(e) => setProfile({ ...profile, favoriteGenres: e.target.value })}
                        disabled={!isEditing}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                        Movies You Love
                    </label>
                    <textarea
                        placeholder={isEditing ? "Inception, The Matrix, Spirited Away..." : "Like some movies to build your profile"}
                        className={`w-full px-4 py-2 border rounded-lg h-20 ${isEditing
                            ? 'bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                            : 'bg-gray-50 text-gray-600 cursor-not-allowed'
                            }`}
                        value={profile.likedMovies}
                        onChange={(e) => setProfile({ ...profile, likedMovies: e.target.value })}
                        disabled={!isEditing}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                        Movies You Dislike
                    </label>
                    <textarea
                        placeholder={isEditing ? "Horror movies, overly violent films..." : "No dislikes recorded yet"}
                        className={`w-full px-4 py-2 border rounded-lg h-20 ${isEditing
                            ? 'bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                            : 'bg-gray-50 text-gray-600 cursor-not-allowed'
                            }`}
                        value={profile.dislikedMovies}
                        onChange={(e) => setProfile({ ...profile, dislikedMovies: e.target.value })}
                        disabled={!isEditing}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                        Other Preferences
                    </label>
                    <textarea
                        placeholder={isEditing ? "I prefer newer movies, love plot twists..." : "Chat more to discover your preferences"}
                        className={`w-full px-4 py-2 border rounded-lg h-24 ${isEditing
                            ? 'bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                            : 'bg-gray-50 text-gray-600 cursor-not-allowed'
                            }`}
                        value={profile.preferences}
                        onChange={(e) => setProfile({ ...profile, preferences: e.target.value })}
                        disabled={!isEditing}
                    />
                </div>

                {isEditing && (
                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            disabled={charCount > MAX_CHARS}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            Save Profile
                        </button>
                        <button
                            onClick={handleCancel}
                            className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}