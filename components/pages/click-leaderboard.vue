<!-- /components/content/weird/click-leaderboard.vue -->
<template>
  <div class="kr-surface">
    <div class="kr-scroll p-4">
      <p class="text-xl font-bold mb-4">Global Leaderboard</p>
      <leaderboard-table
        :rows="leaderboard"
        score-label="Click Record"
        score-key="clickRecord"
      />
    </div>
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
