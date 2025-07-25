// app/profile/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Save, Edit2, X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { api } from "~/trpc/react"

interface TasteProfile {
    favoriteGenres: string
    likedMovies: string
    dislikedMovies: string
    preferences: string
}

export default function ProfilePage() {
    const [isEditing, setIsEditing] = useState(false)
    const [editedProfile, setEditedProfile] = useState<TasteProfile>({
        favoriteGenres: '',
        likedMovies: '',
        dislikedMovies: '',
        preferences: ''
    })

    // Fetch profile data
    const { data: profile, isLoading, refetch } = api.preferences.get.useQuery()

    // Update mutation
    const updateProfile = api.preferences.update.useMutation({
        onSuccess: () => {
            toast.success('Taste profile saved!')
            setIsEditing(false)
            void refetch() // Refresh the data
        },
        onError: (error) => {
            toast.error('Failed to save profile')
            console.error('Profile update error:', error)
        }
    })

    // Initialize edited profile when data loads
    useEffect(() => {
        if (profile) {
            setEditedProfile({
                favoriteGenres: profile.favoriteGenres ?? '',
                likedMovies: profile.likedMovies ?? '',
                dislikedMovies: profile.dislikedMovies ?? '',
                preferences: profile.preferences ?? ''
            })
        }
    }, [profile])

    const charCount = Object.values(editedProfile).join('').length
    const MAX_CHARS = 500

    const handleSave = () => {
        updateProfile.mutate(editedProfile)
    }

    const handleCancel = () => {
        // Reset to original data
        if (profile) {
            setEditedProfile({
                favoriteGenres: profile.favoriteGenres ?? '',
                likedMovies: profile.likedMovies ?? '',
                dislikedMovies: profile.dislikedMovies ?? '',
                preferences: profile.preferences ?? ''
            })
        }
        setIsEditing(false)
    }

    if (isLoading) {
        return (
            <div className="max-w-2xl mx-auto p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-20 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    const displayProfile = isEditing ? editedProfile : (profile ?? editedProfile)

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
                        className="flex items-center gap-2 px-4 py-2 text-[#FD8E2C] hover:text-[#e07b1e] transition-colors"
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
                        placeholder="Sci-fi, thriller, comedy..."
                        className={`w-full px-4 py-2 rounded-lg border ${isEditing
                            ? 'bg-[#292929] border-[#FD8E2C] text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[rgba(250,250,250,0.5)]'
                            : 'bg-[#292929] border-[#FD8E2C] text-[#FAFAFA] cursor-not-allowed'
                            }`}
                        value={displayProfile.favoriteGenres ?? ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, favoriteGenres: e.target.value })}
                        disabled={!isEditing}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                        Movies You Love
                    </label>
                    <textarea
                        placeholder={isEditing ? "Inception, The Matrix, Spirited Away..." : "Like some movies to build your profile"}
                        className={`w-full px-4 py-2 rounded-lg border h-20 ${isEditing
                            ? 'bg-[#292929] border-[#FD8E2C] text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[rgba(250,250,250,0.5)]'
                            : 'bg-[#292929] border-[#FD8E2C] text-[#FAFAFA] cursor-not-allowed'
                            }`}
                        value={displayProfile.likedMovies ?? ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, likedMovies: e.target.value })}
                        disabled={!isEditing}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                        Movies You Dislike
                    </label>
                    <textarea
                        placeholder={isEditing ? "Horror movies, overly violent films..." : "No dislikes recorded yet"}
                        className={`w-full px-4 py-2 rounded-lg border h-20 ${isEditing
                            ? 'bg-[#292929] border-[#FD8E2C] text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[rgba(250,250,250,0.5)]'
                            : 'bg-[#292929] border-[#FD8E2C] text-[#FAFAFA] cursor-not-allowed'
                            }`}
                        value={displayProfile.dislikedMovies ?? ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, dislikedMovies: e.target.value })}
                        disabled={!isEditing}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                        Other Preferences
                    </label>
                    <textarea
                        placeholder="I prefer newer movies, love plot twists..."
                        className={`w-full px-4 py-2 rounded-lg border h-24 ${isEditing
                            ? 'bg-[#292929] border-[#FD8E2C] text-[#FAFAFA] focus:outline-none focus:ring-2 focus:ring-[rgba(250,250,250,0.5)]'
                            : 'bg-[#292929] border-[#FD8E2C] text-[#FAFAFA] cursor-not-allowed'
                            }`}
                        value={displayProfile.preferences ?? ''}
                        onChange={(e) => setEditedProfile({ ...editedProfile, preferences: e.target.value })}
                        disabled={!isEditing}
                    />
                </div>

                {isEditing && (
                    <div className="flex gap-3">
                        <button
                            onClick={handleSave}
                            disabled={charCount > MAX_CHARS || updateProfile.isPending}
                            className="flex items-center gap-2 px-6 py-3 bg-[#FD8E2C] text-white rounded-lg hover:bg-[#e07b1e] disabled:bg-gray-400 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            {updateProfile.isPending ? 'Saving...' : 'Save Profile'}
                        </button>
                        <button
                            onClick={handleCancel}
                            disabled={updateProfile.isPending}
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