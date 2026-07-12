<!-- /components/content/weird/click-leaderboard.vue -->
<template>
  <div class="p-4">
    <h1 class="text-xl font-bold mb-4">Global Leaderboard</h1>
    <table
      class="table-auto w-full border-collapse border border-gray-300 rounded-lg"
    >
      <thead>
        <tr class="bg-gray-200">
          <th class="px-4 py-2 border border-gray-300">Rank</th>
          <th class="px-4 py-2 border border-gray-300">Username</th>
          <th class="px-4 py-2 border border-gray-300">Click Record</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(user, index) in leaderboard"
          :key="user.id"
          class="hover:bg-gray-100"
        >
          <td class="px-4 py-2 border border-gray-300 text-center">
            {{ index + 1 }}
          </td>
          <td class="px-4 py-2 border border-gray-300">{{ user.username }}</td>
          <td class="px-4 py-2 border border-gray-300 text-center">
            {{ user.clickRecord ?? 'N/A' }}
          </td>
        </tr>
      </tbody>
    </table>
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
