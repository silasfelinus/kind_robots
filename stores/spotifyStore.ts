// src/stores/spotifyStore.ts
import { defineStore } from 'pinia';

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  release_date: string;
  imageUrl: string;
}

interface PlaybackStatus {
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
}

export const useSpotifyStore = defineStore('spotify', {
  state: () => ({
    token: null as string | null,
    track: null as Track | null,
    playbackStatus: null as PlaybackStatus | null,
    playlist: [] as Track[],
    history: [] as Track[],
    error: null as string | null,
  }),
  getters: {
    isPlaying(state): boolean {
      return state.playbackStatus?.isPlaying || false;
    },
    currentTrack(state): Track | null {
      return state.track;
    },
    currentPlaylist(state): Track[] {
      return state.playlist;
    },
    trackHistory(state): Track[] {
      return state.history;
    },
  },
  actions: {
    setToken(token: string | null) {
      this.token = token;
    },

    async setVolume(volume: number) {
      try {
        const response = await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${volume}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to set volume');
        }
      } catch (error: any) {
        this.error = error.message;
      }
    },
    async fetchSpotifyToken() {
      try {
        const res = await fetch('/api/utils/spotifyToken');
        if (!res.ok) {
          throw new Error(`Failed to fetch Spotify token: ${res.statusText}`);
        }
        const data = await res.json();
        if (data.token) {
          this.token = data.token;
        } else {
          throw new Error('Token not received from the server.');
        }
      } catch (error: any) {
        console.error('Error fetching Spotify token', error);
        this.error = error.message || 'Unknown error';
      }
    },
    generateCodeVerifier() {
      const array = new Uint32Array(56 / 2);
      window.crypto.getRandomValues(array);
      return Array.from(array, (dec) => ('0' + dec.toString(16)).substr(-2)).join('');
    },
    async authorizeSpotify() {
      const verifier = this.generateCodeVerifier();
      localStorage.setItem('spotify-code-verifier', verifier);

      const challenge = await this.generateCodeChallenge(verifier);

      const scope = encodeURIComponent('user-read-private user-read-email');
      const clientId = 'YOUR_SPOTIFY_CLIENT_ID';
      const redirectUri = encodeURIComponent('YOUR_REDIRECT_URI');

      window.location.href = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&code_challenge_method=S256&code_challenge=${challenge}&scope=${scope}`;
    },
    generateCodeChallenge(verifier: string) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)).then((buffer) => {
        return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(buffer))))
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=+$/, '');
      });
    },
    captureSpotifyTokenFromUrl() {
      const hash = window.location.hash
        .substring(1)
        .split('&')
        .reduce((initial: any, item) => {
          const parts = item.split('=');
          initial[parts[0]] = decodeURIComponent(parts[1]);
          return initial;
        }, {});
      window.location.hash = '';

      if (hash.access_token) {
        this.token = hash.access_token;
      }
    },
    updateTrackId(newTrackId: string) {
      if (this.track) {
        this.track.id = newTrackId;
      }
    },
    async fetchCurrentUserProfile() {
      if (!this.token) {
        this.error = 'Authentication required.';
        return;
      }

      try {
        const res = await fetch('https://api.spotify.com/v1/me', {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });
        if (!res.ok) {
          throw new Error('Failed to fetch user profile.');
        }
        const data = await res.json();
        // ... (store the user data in your Pinia store)
      } catch (error: any) {
        console.error('Error fetching user profile', error);
        this.error = error.message;
      }
    },
    togglePlay() {
      if (this.playbackStatus) {
        this.playbackStatus.isPlaying = !this.playbackStatus.isPlaying;
      }
    },
    updatePlaybackStatus(newStatus: PlaybackStatus) {
      this.playbackStatus = newStatus;
    },
    addToHistory(track: Track) {
      this.history.push(track);
    },
    async loadPlaylist(playlistId: string) {
      try {
        if (!this.token) {
          throw new Error('Token is not available.');
        }
        const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to load playlist: ${res.statusText}`);
        }

        const data = await res.json();
        this.playlist = data.tracks.items.map((item: any) => ({
          id: item.track.id,
          name: item.track.name,
          artist: item.track.artists[0]?.name || 'Unknown Artist',
          album: item.track.album?.name || 'Unknown Album',
          release_date: item.track.album?.release_date || 'Unknown Release Date',
          imageUrl: item.track.album.images[0]?.url || '',
        }));
      } catch (error: any) {
        console.error('Error loading Spotify playlist', error);
        this.error = error.message || 'Unknown error';
      }
    },

    async playTrack(trackId: string) {
      try {
        if (!this.token) {
          throw new Error('Token is not available.');
        }
        const res = await fetch(`https://api.spotify.com/v1/me/player/play`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uris: [`spotify:track:${trackId}`] }),
        });

        if (!res.ok) {
          throw new Error(`Failed to play the track: ${res.statusText}`);
        }

        // Fetch the current track details and update the state
      } catch (error: any) {
        console.error('Error playing track', error);
        this.error = error.message || 'Unknown error';
      }
    },
    async pauseTrack() {
      try {
        if (!this.token) {
          throw new Error('Token is not available.');
        }

        const res = await fetch(`https://api.spotify.com/v1/me/player/pause`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to pause the track: ${res.statusText}`);
        }

        if (this.playbackStatus) {
          this.playbackStatus.isPlaying = false;
        }
      } catch (error: any) {
        console.error('Error pausing track', error);
        this.error = error.message || 'Unknown error';
      }
    },
    async nextTrack() {
      try {
        if (!this.token) {
          throw new Error('Token is not available.');
        }

        const res = await fetch(`https://api.spotify.com/v1/me/player/next`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to skip to the next track: ${res.statusText}`);
        }

        // Fetch and update the state with the details of the next track
      } catch (error: any) {
        console.error('Error skipping to the next track', error);
        this.error = error.message || 'Unknown error';
      }
    },
    async previousTrack() {
      try {
        if (!this.token) {
          throw new Error('Token is not available.');
        }

        const res = await fetch(`https://api.spotify.com/v1/me/player/previous`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to play the previous track: ${res.statusText}`);
        }

        // Fetch and update the state with the details of the previous track
      } catch (error: any) {
        console.error('Error playing the previous track', error);
        this.error = error.message || 'Unknown error';
      }
    },
    setError(errorMessage: string) {
      this.error = errorMessage;
    },
    clearError() {
      this.error = null;
    },
  },
});
