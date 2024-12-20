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
      <table
        class="table-auto w-full border-collapse border border-gray-300 rounded-lg"
      >
        <thead>
          <tr class="bg-gray-200">
            <th class="px-4 py-2 border border-gray-300">Rank</th>
            <th class="px-4 py-2 border border-gray-300">Username</th>
            <th class="px-4 py-2 border border-gray-300">Match Record</th>
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
            <td class="px-4 py-2 border border-gray-300">
              {{ user.username }}
            </td>
            <td class="px-4 py-2 border border-gray-300 text-center">
              {{ user.matchRecord ?? 'N/A' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useMilestoneStore } from '@/stores/milestoneStore'

// Access the milestone store
const milestoneStore = useMilestoneStore()

// State for toggle
const isOpen = ref(false)

// Fetch match leaderboard data
const leaderboard = computed(() => milestoneStore.highMatchScores)

onMounted(async () => {
  if (!milestoneStore.highMatchScores.length) {
    await milestoneStore.fetchHighMatchScores()
  }
})
</script>
