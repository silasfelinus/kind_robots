<!-- /components/content/weird/click-leaderboard.vue -->
<template>
  <div class="p-4">
    <h1 class="text-xl font-bold mb-4">Global Leaderboard</h1>
    <leaderboard-table
      :rows="leaderboard"
      score-label="Click Record"
      score-key="clickRecord"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAchievementStore } from '@/stores/achievementStore'

// Access the achievement store
const achievementStore = useAchievementStore()

// Fetch leaderboard data
const leaderboard = computed(() => achievementStore.highClickScores)

onMounted(async () => {
  if (!achievementStore.highClickScores.length) {
    await achievementStore.fetchHighClickScores()
  }
})
</script>
