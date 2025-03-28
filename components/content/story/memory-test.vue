<!-- /components/content/memory-test.vue -->
<template>
  <div
    class="container mx-auto flex flex-col h-full space-y-4 no-scrollbar px-2"
  >
    <!-- Top Row: Title and Controls -->
    <div class="w-full grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
      <div class="text-center md:text-left">
        <h1 class="text-2xl font-bold">Kind Robots Memory Game</h1>
        <p class="text-sm text-gray-500 md:hidden">
          Match the images and test your memory!
        </p>
      </div>

      <div class="text-center hidden md:block">
        <p class="text-gray-600">Match the images and test your memory!</p>
      </div>

      <div class="flex flex-col md:flex-row md:items-center justify-end gap-2">
        <label for="difficulty" class="text-sm md:mr-2">Difficulty:</label>
        <select
          id="difficulty"
          v-model="memoryStore.selectedDifficulty"
          class="p-2 border border-gray-300 rounded w-full md:w-auto"
        >
          <option
            v-for="difficulty in memoryStore.difficulties"
            :key="difficulty.label"
            :value="difficulty"
          >
            {{ difficulty.label }}
          </option>
        </select>
        <button
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all w-full md:w-auto"
          @click="memoryStore.resetGame()"
        >
          Start
        </button>
      </div>
    </div>

    <!-- Game Board -->
    <div class="flex-1 overflow-y-auto flex justify-center items-center">
      <div
        class="game-board grid gap-2 sm:gap-4"
        :class="{
          'grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9': true,
        }"
        :style="{ minHeight: memoryStore.cardSize * 3 + 'px' }"
      >
        <div v-if="memoryStore.isLoading" class="loader"></div>
        <div
          v-for="card in memoryStore.galleryImages"
          :key="card.id"
          class="gallery-display hover:scale-105 transform transition-transform duration-300 relative rounded-xl overflow-hidden cursor-pointer"
          :style="{
            width: memoryStore.cardSize + 'px',
            height: memoryStore.cardSize + 'px',
          }"
          @click="memoryStore.handleGalleryClick(card)"
        >
          <div :class="{ flipped: card.flipped || card.matched }">
            <img
              class="card-back absolute inset-0 w-full h-full object-cover"
              src="/images/kindtitle.webp"
              alt="Memory Card"
            />
            <img
              class="card-front absolute inset-0 w-full h-full object-cover"
              :src="card.imagePath"
              :alt="card.galleryName"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Score and Status -->
    <div class="game-controls text-center p-4">
      <div
        v-if="memoryStore.notification"
        :class="memoryStore.notificationClasses"
      >
        {{ memoryStore.notification.message }}
      </div>
      <div class="text-lg font-semibold">Score: {{ memoryStore.score }}</div>
      <div class="text-sm text-gray-500">
        High Score: {{ memoryStore.highScore }}
      </div>
      <div v-if="memoryStore.gameWon" class="mt-4">
        <p>Congratulations! You've won!</p>
        <button
          class="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          @click="memoryStore.resetGame()"
        >
          Play Again?
        </button>
      </div>
    </div>

    <!-- Leaderboard Moved to Bottom -->
    <div class="w-full px-2 pb-4">
      <h2 class="text-lg font-semibold mb-2">Leaderboard</h2>
      <match-leaderboard />
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/memory-game.vue
import { useMemoryStore } from '@/stores/memoryStore'
const memoryStore = useMemoryStore()
</script>

<style scoped>
.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  transition: transform 0.7s;
  border-radius: 12px;
}
.card-front {
  transform: rotateY(180deg);
}
.card-back {
  transform: rotateY(0deg);
}
.flipped .card-front {
  transform: rotateY(0deg);
}
.flipped .card-back {
  transform: rotateY(-180deg);
}
.gallery-display {
  transform-style: preserve-3d;
}

.loader {
  display: inline-block;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 4px solid #2563eb;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
