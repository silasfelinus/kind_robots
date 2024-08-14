<template>
  <div class="bg-base-200 rounded-2xl border p-4 m-2">
    <h2 class="text-lg font-bold text-center">Jellybean Collectors</h2>
    <ul class="list-decimal list-inside">
      <li v-for="(entry, index) in leaderboardData" :key="index">
        {{ entry.username }}: {{ entry.count }} jellybeans
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  useMilestoneStore,
  type MilestoneRecord,
} from '@/stores/milestoneStore'

const milestoneStore = useMilestoneStore()

const leaderboardData = computed(() => {
  const records: MilestoneRecord[] = milestoneStore.milestoneRecords // Removed .value
  const leaderboard: { [username: string]: number } = {}

  records.forEach((record) => {
    const username = record.username ?? 'Unknown' // Handle null or undefined username
    if (leaderboard[username]) {
      leaderboard[username]++
    } else {
      leaderboard[username] = 1
    }
  })

  return Object.entries(leaderboard)
    .map(([username, count]) => ({ username, count }))
    .sort((a, b) => b.count - a.count)
})
</script>
