<template>
  <div
    class="container mx-auto flex flex-col h-screen overflow-hidden bg-base-200"
  >
    <!-- Header Section -->
    <div
      class="w-full flex flex-wrap md:flex-nowrap items-center justify-between gap-4 px-4 pt-6 pb-4"
    >
      <div>
        <h1 class="text-3xl font-bold leading-tight">
          🧠 Kind Robots Memory Game
        </h1>
        <p class="text-gray-500 hidden sm:block">
          Match images, beat your score, challenge the board.
        </p>
      </div>
      <div class="flex flex-col md:flex-row gap-2 items-center">
        <label class="text-sm font-medium">Difficulty:</label>
        <select
          v-model="memoryStore.selectedDifficulty"
          class="p-2 border rounded"
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
          @click="memoryStore.resetGame()"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Start
        </button>
      </div>
    </div>

    <!-- Game Board Section: Takes up remaining space -->
    <div class="flex-1 overflow-y-auto px-4 pb-4">
      <div class="game-board flex flex-wrap justify-center gap-4">
        <div v-if="memoryStore.isLoading" class="loader"></div>
        <div
          v-for="galleryImage in memoryStore.galleryImages"
          :key="galleryImage.id"
          class="gallery-display hover:scale-105 transform transition-transform duration-300 relative rounded-xl overflow-hidden cursor-pointer"
          :style="{
            flexBasis: memoryStore.cardSize + 'px',
            height: memoryStore.cardSize + 'px',
          }"
          @click="memoryStore.handleGalleryClick(galleryImage)"
        >
          <div
            :class="{ flipped: galleryImage.flipped || galleryImage.matched }"
          >
            <!-- Card Back -->
            <img
              class="card-back absolute inset-0 w-full h-full object-cover"
              src="/images/kindtitle.webp"
              alt="Memory Card"
            />
            <!-- Card Front -->
            <img
              class="card-front absolute inset-0 w-full h-full object-cover"
              :src="galleryImage.imagePath"
              :alt="galleryImage.galleryName"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Footer / Score / Leaderboard Toggle -->
    <div class="bg-base-300 px-4 py-3 text-center">
      <div class="text-lg font-semibold">Score: {{ memoryStore.score }}</div>
      <div class="text-sm text-gray-500">
        High Score: {{ memoryStore.highScore }}
      </div>
      <div v-if="memoryStore.gameWon" class="mt-2">
        <p class="font-medium">🎉 Congratulations! You've won!</p>
        <button
          @click="memoryStore.resetGame()"
          class="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Play Again?
        </button>
      </div>

      <button
        class="mt-4 text-blue-500 underline text-sm"
        @click="isOpen = !isOpen"
      >
        {{ isOpen ? 'Hide Leaderboard' : 'Show Leaderboard' }}
      </button>

      <transition name="fade-slide">
        <div
          v-if="isOpen"
          class="mt-4 border rounded-xl bg-base-100 p-4 max-w-2xl mx-auto"
        >
          <h2 class="text-xl font-bold mb-3">Global Match Leaderboard</h2>
          <table class="table-auto w-full text-sm">
            <thead>
              <tr class="bg-gray-100">
                <th class="px-4 py-2">Rank</th>
                <th class="px-4 py-2">Username</th>
                <th class="px-4 py-2">Match Record</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(user, index) in leaderboard"
                :key="user.id"
                class="hover:bg-gray-50"
              >
                <td class="px-4 py-2 text-center">{{ index + 1 }}</td>
                <td class="px-4 py-2">{{ user.username }}</td>
                <td class="px-4 py-2 text-center">
                  {{ user.matchRecord ?? 'N/A' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMemoryStore } from '@/stores/memoryStore'
import { computed, onMounted, ref } from 'vue'
import { useMilestoneStore } from '@/stores/milestoneStore'

const milestoneStore = useMilestoneStore()
const memoryStore = useMemoryStore()
const isOpen = ref(false)
const leaderboard = computed(() => milestoneStore.highMatchScores)

onMounted(async () => {
  if (!milestoneStore.highMatchScores.length) {
    await milestoneStore.fetchHighMatchScores()
  }
})
</script>

<style scoped>
.container {
  display: grid;
  gap: 20px;
  width: 100%;
}

.game-board {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
}

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
