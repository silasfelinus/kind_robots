<template>
  <div class="bg-base-200 min-h-screen flex flex-col items-center py-8">
    <!-- Spotify Login -->
    <div v-if="!token" class="mb-8">
      <button class="btn btn-primary" @click="fetchSpotifyToken">
        Login with Spotify <icon name="mdi:spotify" class="text-lg" />
      </button>
    </div>

    <!-- Player Interface -->
    <div v-if="token" class="bg-secondary p-8 rounded shadow-lg w-1/3">
      <p class="text-info mb-4">
        Enjoy our AI-curated playlist, designed to enhance your experience with
        eclectic and playful vibes.
      </p>
      <!-- Current Track Information -->
      <div v-if="currentTrack" class="flex items-center mb-4">
        <img
          :src="currentTrack.imageUrl"
          class="w-16 h-16 rounded mr-4"
          alt="Album Art"
        />
        <div>
          <div class="text-accent font-semibold text-xl mb-1">
            {{ currentTrack.name }}
          </div>
          <div class="text-base-100">
            {{ currentTrack.artist }} - {{ currentTrack.album }} (
            {{ formatDate(currentTrack.release_date) }})
          </div>
        </div>
      </div>

      <!-- Playback Controls -->
      <div class="flex justify-center space-x-4">
        <button class="btn btn-accent" @click="previousTrack">
          <icon name="mdi:skip-previous" class="icon-size" />
        </button>
        <button class="btn btn-accent" @click="togglePlay">
          <icon
            :name="isPlaying ? 'mdi:pause' : 'mdi:play'"
            class="icon-size"
          />
        </button>
        <button class="btn btn-accent" @click="nextTrack">
          <icon name="mdi:skip-next" class="icon-size" />
        </button>
      </div>

      <!-- Volume Control -->
      <div class="mt-4 flex items-center">
        <icon name="mdi:volume-high" class="text-lg mr-2" />
        <input v-model="volume" type="range" class="w-full" min="0" max="100" />
      </div>

      <!-- Error Handling -->
      <div v-if="error" class="mt-4">
        <div class="text-warning">
          {{ error }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useSpotifyStore } from './../../../stores/spotifyStore'
import { useErrorStore, ErrorType } from './../../../stores/errorStore'

const spotifyStore = useSpotifyStore()
const errorStore = useErrorStore()
const token = computed(() => spotifyStore.token)
const currentTrack = computed(() => spotifyStore.currentTrack)
const isPlaying = computed(() => spotifyStore.isPlaying)
const error = computed(() => errorStore.message) // Adjusted to access message correctly
const volume = ref(50)
const playlist = '4Y6iPSlNSUcaDG9sTOXyhJ'

const formatDate = (date: string) => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
  return new Date(date).toLocaleDateString(undefined, options)
}

const setVolume = async (newVolume: number) => {
  try {
    await spotifyStore.setVolume(newVolume)
  } catch (error) {
    console.error('Error setting volume:', error)
  }
}

watch(volume, (newVal) => {
  setVolume(newVal)
})

onMounted(async () => {
  const code = new URL(window.location.href).searchParams.get('code')
  const verifier = localStorage.getItem('spotify-code-verifier')
  if (code && verifier) {
    try {
      const response = await fetch(
        `/api/spotify-auth?code=${code}&verifier=${verifier}`,
      )
      const data = await response.json()
      spotifyStore.setToken(data.access_token)
      console.log('Token set:', data.access_token) // Debug: Log the token
      if (data.access_token) {
        await spotifyStore.shufflePlaylist(playlist)
      }
    } catch (error) {
      console.error('Error fetching Spotify token:', error)
      errorStore.setError(
        ErrorType.NETWORK_ERROR,
        'Failed to start playlist in shuffle mode',
      )
    }
  }
})

const { fetchSpotifyToken, togglePlay, nextTrack, previousTrack } = spotifyStore
</script>

<style>
.icon-size {
  font-size: 2rem;
}
</style>
