<template>
  <div class="bg-base-300 rounded-2xl border m-2 p-2 mx-auto max-w-screen-xl">
    <!-- Header with Reset Button -->
    <div
      class="text-center bg-primary text-white border p-2 m-2 rounded-2xl flex justify-between items-center"
    >
      <h1 class="text-2xl">{{ userStore.username }}'s Milestones</h1>
      <button
        class="bg-accent text-white rounded-xl px-4 py-2 hover:bg-accent-focus transition"
        @click="resetMilestones"
      >
        Reset Milestones
      </button>
    </div>

    <!-- Displaying All Records for Debugging -->
    <div class="p-4 m-2 border bg-gray-100 rounded">
      <h3 class="font-bold text-center">All Milestone Records (Debug)</h3>
      <ul>
        <li
          v-for="record in unlockedMilestones"
          :key="record.id"
          class="text-sm text-gray-700"
        >
          Milestone ID: {{ record.milestoneId }}, User ID: {{ record.userId }},
          Confirmed: {{ record.isConfirmed }}
        </li>
      </ul>
    </div>

    <!-- Milestones Data -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      <!-- Earned Milestones Column -->
      <div
        class="flex flex-col items-center p-4 border bg-primary rounded-2xl m-2"
      >
        <h2 class="text-lg font-bold">Earned Milestones</h2>
        <div class="grid grid-cols-1 gap-4 w-full">
          <EarnedMilestoneCard
            v-for="earnedMilestone in earnedMilestones"
            :key="earnedMilestone.id"
            :milestone="earnedMilestone"
            :acquired-at="earnedMilestone.acquiredAt"
          />
        </div>
      </div>

      <!-- Leaderboard Column -->
      <div
        class="flex flex-col items-center p-4 border bg-primary rounded-2xl m-2"
      >
        <milestone-leaderboard />
      </div>

      <!-- Undiscovered Milestones Column -->
      <div
        class="flex flex-col items-center p-4 border bg-primary rounded-2xl m-2"
      >
        <h2 class="text-lg font-bold">Undiscovered Milestones</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <UnearnedMilestoneCard
            v-for="milestone in unearnedMilestones"
            :key="milestone.id"
            :milestone="milestone"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMilestoneStore } from './../../../stores/milestoneStore'
import { useUserStore } from './../../../stores/userStore'

const milestoneStore = useMilestoneStore()
const userStore = useUserStore()

// Directly access milestone records from the store
const unlockedMilestones = computed(() => milestoneStore.milestoneRecords)

// Compute earned milestones based on records with matching user ID
const earnedMilestones = computed(() => {
  return milestoneStore.milestoneRecords
    .filter((record) => record.userId === userStore.userId)
    .map((record) => {
      const milestone = milestoneStore.milestones.find(
        (milestone) => milestone.id === record.milestoneId,
      )
      if (milestone) {
        // Format acquiredAt if present
        const acquiredAt =
          record.createdAt instanceof Date
            ? record.createdAt.toISOString()
            : typeof record.createdAt === 'string'
              ? new Date(record.createdAt).toISOString()
              : null
        return { ...milestone, acquiredAt }
      }
      return null
    })
    .filter((milestone) => milestone !== null) // Remove nulls from the list
})

// Calculate unearned milestones based on the absence of records for the current user
const unearnedMilestones = computed(() => {
  return milestoneStore.milestones.filter(
    (milestone) =>
      !milestoneStore.milestoneRecords.some(
        (record) =>
          record.milestoneId === milestone.id &&
          record.userId === userStore.userId,
      ),
  )
})

// Reset milestones function
const resetMilestones = () => {
  milestoneStore.clearAllMilestoneRecords()
}
</script>
