<!-- /components/content/weird/match-leaderboard.vue -->
<template>
  <div class="relative">
    <!-- Toggle Icon -->
    <button
      aria-label="Toggle Leaderboard"
      class="flex items-center justify-center w-12 h-12 rounded-full bg-accent text-info hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
      @click="isOpen = !isOpen"
    >
      <Icon name="kind-icon:leaderboard" class="w-6 h-6" />
    </button>

    <!-- Leaderboard (conditionally rendered) -->
    <div
      v-if="isOpen"
      class="rounded-2xl border p-3 m-3 mt-4 bg-base-300 text-center transition-all duration-300"
    >
      <h1 class="text-xl font-bold mb-4">Global Match Leaderboard</h1>
      <leaderboard-table
        :rows="leaderboard"
        score-label="Match Record"
        score-key="matchRecord"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAchievementStore } from '@/stores/achievementStore'

// Access the achievement store
const achievementStore = useAchievementStore()

// State for toggle
const isOpen = ref(false)

// Fetch match leaderboard data
const leaderboard = computed(() => achievementStore.highMatchScores)

onMounted(async () => {
  if (!achievementStore.highMatchScores.length) {
    await achievementStore.fetchHighMatchScores()
  }
})
</script>
