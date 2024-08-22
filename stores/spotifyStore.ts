import { defineStore } from 'pinia'
import { useErrorStore } from '@/stores/errorStore' // Ensure this is correctly imported based on your project structure

interface Track {
  id: string
  name: string
  artist: string
  album: string
  release_date: string
  imageUrl: string
}

interface SpotifyTrack {
  id: string
  name: string
  artists: [{ name: string }]
  album: {
    name: string
    release_date: string
    images: [{ url: string }]
  }
}

interface SpotifyPlaylistResponse {
  tracks: {
    items: [{
      track: SpotifyTrack
    }]
  }
}

interface PlaybackStatus {
  isPlaying: boolean
  position: number
  duration: number
  volume: number
}

interface UserProfile {
  id: string
  display_name: string
  email: string
  images: [{ url: string }]
}

export const useSpotifyStore = defineStore('spotify', {
  state: () => ({
    token: null as string | null,
    track: null as Track | null,
    playbackStatus: null as PlaybackStatus | null,
    playlist: [] as Track[],
    history: [] as Track[],
    error: null as string | null,
    userProfile: null as UserProfile | null,
  }),
  getters: {
    isPlaying: (state) => state.playbackStatus?.isPlaying || false,
    currentTrack: (state) => state.track,
    currentPlaylist: (state) => state.playlist,
    trackHistory: (state) => state.history,
  },
  actions: {
    setToken(newToken: string | null) {
      this.token = newToken;
    },
    setError(ErrorType: ErrorType, errorMessage: string) {
      const errorStore = useErrorStore()
      errorStore.setError(ErrorType, errorMessage) // Utilize the centralized error store
    },
    clearError() {
      const errorStore = useErrorStore()
      errorStore.clearError() // Clear error using the centralized error store
    },
    async setVolume(volume: number) {
      try {
        const response = await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volume}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        })
        if (!response.ok) throw new Error('Failed to set volume')
      } catch (error) {
        this.handleError(error)
      }
    },
// Example method adjustments for spotifyStore
handleError(error: unknown, context: string = 'General Operation') {
  const errorStore = useErrorStore();
  let errorMessage: string;
  let errorType: ErrorType;

  if (error instanceof Error) {
    errorMessage = `${context} failed: ${error.message}`;
    if (error.name === 'NetworkError') {
      errorType = ErrorType.NETWORK_ERROR;
    } else if (error.name === 'AuthError') {
      errorType = ErrorType.AUTH_ERROR;
    } else {
      errorType = ErrorType.UNKNOWN_ERROR;
    }
  } else {
    errorMessage = `${context} failed with an unknown error.`;
    errorType = ErrorType.GENERAL_ERROR;
  }

  // Set error using the centralized error store with specific type and message
  errorStore.setError(errorType, errorMessage);
  console.error(`[${context} Error]: ${errorMessage}`);
},

// This method is then used within other actions where errors might occur
async fetchSpotifyToken() {
  try {
    const res = await fetch('/api/utils/spotifyToken');
    if (!res.ok) throw new Error('HTTP error status: ' + res.status);
    const data = await res.json();
    if (data.token) {
      this.token = data.token;
    } else {
      throw new Error('No token received from the server.');
    }
  } catch (error) {
    this.handleError(error, 'Fetching Spotify Token');
  }
},

    generateCodeVerifier() {
      const array = new Uint32Array(56 / 2)
      window.crypto.getRandomValues(array)
      return Array.from(array, (dec) =>
        ('0' + dec.toString(16)).substr(-2),
      ).join('')
    },
    async authorizeSpotify() {
      const verifier = this.generateCodeVerifier()
      localStorage.setItem('spotify-code-verifier', verifier)

      const challenge = await this.generateCodeChallenge(verifier)

      const scope = encodeURIComponent('user-read-private user-read-email')
      const clientId = 'YOUR_SPOTIFY_CLIENT_ID'
      const redirectUri = encodeURIComponent('YOUR_REDIRECT_URI')

      window.location.href = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&code_challenge_method=S256&code_challenge=${challenge}&scope=${scope}`
    },
    generateCodeChallenge(verifier: string) {
      return crypto.subtle
        .digest('SHA-256', new TextEncoder().encode(verifier))
        .then((buffer) => {
          return btoa(
            String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer))),
          )
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '')
        })
    },
    captureSpotifyTokenFromUrl() {
      const hash = window.location.hash
        .substring(1)
        .split('&')
        .reduce((initial: Record<string, string>, item) => {
          const parts = item.split('=')
          initial[parts[0]] = decodeURIComponent(parts[1])
          return initial
        }, {})
      window.location.hash = ''

      if (hash.access_token) {
        this.token = hash.access_token
      }
    },
    updateTrackId(newTrackId: string) {
      if (this.track) {
        this.track.id = newTrackId
      }
    },
    async fetchCurrentUserProfile() {
      if (!this.token) {
        const errorStore = useErrorStore();
        errorStore.setError(ErrorType.AUTH_ERROR, 'Authentication required to fetch user profile.');
        return;
      }
    
      try {
        const res = await fetch('https://api.spotify.com/v1/me', {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });
    
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error?.message || 'Failed to fetch user profile.');
        }
    
        const data = await res.json();
        this.userProfile = data;
        console.log('User profile fetched successfully:', data);
      } catch (error: unknown) {
        this.handleError(error, 'Fetching Current User Profile');
      }
    },
    
    togglePlay() {
      if (this.playbackStatus) {
        this.playbackStatus.isPlaying = !this.playbackStatus.isPlaying
      }
    },
    updatePlaybackStatus(newStatus: PlaybackStatus) {
      this.playbackStatus = newStatus
    },
    addToHistory(track: Track) {
      this.history.push(track)
    },
    async loadPlaylist(playlistId: string) {
      try {
        if (!this.token) {
          throw new Error('Token is not available.')
        }

        const res = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistId}`,
          {
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
          },
        )

        if (!res.ok) {
          throw new Error(`Failed to load playlist: ${res.statusText}`)
        }

        const data: SpotifyPlaylistResponse = await res.json()
        this.playlist = data.tracks.items.map((item) => ({
          id: item.track.id,
          name: item.track.name,
          artist: item.track.artists[0]?.name || 'Unknown Artist',
          album: item.track.album?.name || 'Unknown Album',
          release_date:
            item.track.album?.release_date || 'Unknown Release Date',
          imageUrl: item.track.album.images[0]?.url || '',
        }))
      } catch (error: unknown) {
        this.handleError(error)
      }
    },

    async playTrack(trackId: string) {
      try {
        if (!this.token) {
          throw new Error('Token is not available.')
        }
        const res = await fetch(`https://api.spotify.com/v1/me/player/play`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uris: [`spotify:track:${trackId}`] }),
        })

        if (!res.ok) {
          throw new Error(`Failed to play the track: ${res.statusText}`)
        }
      } catch (error: unknown) {
        this.handleError(error)
      }
    },
    async pauseTrack() {
      try {
        if (!this.token) {
          throw new Error('Token is not available.')
        }

        const res = await fetch(`https://api.spotify.com/v1/me/player/pause`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        })

        if (!res.ok) {
          throw new Error(`Failed to pause the track: ${res.statusText}`)
        }

        if (this.playbackStatus) {
          this.playbackStatus.isPlaying = false
        }
      } catch (error: unknown) {
        this.handleError(error)
      }
    },
    async nextTrack() {
      try {
        if (!this.token) {
          throw new Error('Token is not available.')
        }

        const res = await fetch(`https://api.spotify.com/v1/me/player/next`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        })

        if (!res.ok) {
          throw new Error(`Failed to skip to the next track: ${res.statusText}`)
        }
      } catch (error: unknown) {
        this.handleError(error)
      }
    },
    async previousTrack() {
      try {
        if (!this.token) {
          throw new Error('Token is not available.')
        }

        const res = await fetch(
          `https://api.spotify.com/v1/me/player/previous`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.token}`,
            },
          },
        )

        if (!res.ok) {
          throw new Error(
            `Failed to play the previous track: ${res.statusText}`,
          )
        }
      } catch (error: unknown) {
        this.handleError(error)
      }
    },
  },
})
