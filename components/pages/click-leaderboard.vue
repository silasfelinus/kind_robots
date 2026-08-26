<!-- /components/content/weird/click-leaderboard.vue -->
<template>
  <div class="kr-surface">
    <div class="kr-scroll p-4">
      <header class="flex items-center gap-3 mb-4">
        <span
          class="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary"
        >
          <Icon name="kind-icon:trophy" class="h-7 w-7" />
        </span>
        <div>
          <p class="text-2xl font-black tracking-tight">Global Leaderboard</p>
          <p class="text-sm text-base-content/60">
            The highest click records ever recorded, ranked best to worst.
          </p>
        </div>
      </header>
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
