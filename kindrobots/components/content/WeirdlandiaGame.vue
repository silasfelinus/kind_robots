<template>
  <div class="flex justify-center items-center bg-gray-800 pattern-grid-lg">
    <div class="hero-image-container relative overflow-hidden">
      <img :src="bgImage" class="hero-image w-full object-cover" />

      <!-- Content Layer -->
      <div class="relative z-10">
        <!-- Introduction and About Content -->
        <p
          v-if="!gameStore.isGameStarted && !gameStore.showAbout"
          class="text-lg leading-relaxed text-white font-medium"
        >
          Welcome to "Weirdlandia", a realm where every choice brings a new, unexpected twist.
        </p>

        <p v-if="gameStore.showAbout" class="text-sm text-accent font-semibold">
          Challenges await at every corner. Carve your own journey in this unpredictable realm.
        </p>

        <!-- Game Content -->
        <div v-if="gameStore.isGameStarted" class="text-white font-light">
          <p>Game has started! Adventure awaits...</p>
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-center space-x-6 mt-6">
          <button
            class="py-2 px-6 text-xl bg-accent hover:bg-accent-darkened focus:ring focus:ring-accent focus:ring-opacity-50 rounded-full shadow-lg transition-transform transform hover:scale-105"
            @click="initiateGame"
          >
            Start New Game
          </button>
          <button
            class="py-2 px-6 text-xl bg-primary hover:bg-primary-darkened focus:ring focus:ring-primary focus:ring-opacity-50 rounded-full shadow-lg transition-transform transform hover:scale-105"
            @click="toggleGameAbout"
          >
            About Weirdlandia
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '../../stores/gameStore'
const gameStore = useGameStore()
const bgImage = ref('')

const initiateGame = () => {
  gameStore.initiateNewGame()
}

const fetchBackgroundImage = async () => {
  try {
    const response = await fetch('https://kindrobots.org/api/gallery/random/name/weirdlandia')

    if (!response.ok) {
      throw new Error('Failed to fetch the image.')
    }

    const data = await response.json()
    bgImage.value = data.image
  } catch (error) {
    console.error('There was an error fetching the background image:', error)
  }
}

const toggleGameAbout = () => {
  gameStore.toggleAbout()
}

onMounted(fetchBackgroundImage)
</script>

<style>
/* Custom colors if you want to introduce new shades */
.bg-accent-darkened {
  background-color: #004466; /* This is just an example color */
}
.bg-primary-darkened {
  background-color: #660044; /* This is just an example color */
}
.hero-image-container {
  width: 100%;
  height: 350px; /* or whatever height you prefer for the image */
  position: relative;
}

.hero-image {
  width: 100%;
  height: 100%;
}
.rounded-xl {
  padding: 0; /* Reset padding to eliminate spacing around the image */
}
.relative.z-10 {
  position: absolute; /* This will overlay the content on top of the image */
  top: 0; /* Start from the top edge */
  left: 0; /* Start from the left edge */
  width: 100%; /* Cover full width */
  height: 100%; /* Cover full height */
  padding: 20px;
  display: flex;
  flex-direction: column; /* Stack content vertically */
  justify-content: center; /* Center content vertically */
  background-color: rgba(0, 0, 0, 0.5); /* Black with 50% opacity for readability */
}
</style>
