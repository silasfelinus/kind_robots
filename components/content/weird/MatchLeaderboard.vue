<template>
  <div class="rounded-2xl border p-3 m-3 bg-base-300 text-center">
    <h1 class="text-xl font-bold mb-4">Global Match Leaderboard</h1>
    <table class="table-auto w-full border-collapse border border-gray-300 rounded-lg">
      <thead>
        <tr class="bg-gray-200">
          <th class="px-4 py-2 border border-gray-300">Rank</th>
          <th class="px-4 py-2 border border-gray-300">Username</th>
          <th class="px-4 py-2 border border-gray-300">Match Record</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(user, index) in leaderboard" :key="user.id" class="hover:bg-gray-100">
          <td class="px-4 py-2 border border-gray-300 text-center">{{ index + 1 }}</td>
          <td class="px-4 py-2 border border-gray-300">{{ user.username }}</td>
          <td class="px-4 py-2 border border-gray-300 text-center">{{ user.matchRecord ?? 'N/A' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useMilestoneStore } from '@/stores/milestoneStore'


// Access the milestone store
const milestoneStore = useMilestoneStore()

// Fetch match leaderboard data
const leaderboard = computed(() => milestoneStore.highMatchScores)

onMounted(async () => {
  if (!milestoneStore.highMatchScores.length) {
    await milestoneStore.fetchHighMatchScores()
  }
})
</script>
