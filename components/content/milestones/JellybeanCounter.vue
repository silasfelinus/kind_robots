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

    <milestone-reward :id="10" />

    <!-- Milestones Data -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      <!-- Earned Milestones -->
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

      <!-- Leaderboard -->
      <div
        class="flex flex-col items-center p-4 border bg-primary rounded-2xl m-2"
      >
        <milestone-leaderboard />
      </div>

      <!-- Unearned Milestones -->
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
import {
  useMilestoneStore,
  type Milestone,
  type MilestoneRecord,
} from './../../../stores/milestoneStore'
import { useUserStore } from './../../../stores/userStore'

const milestoneStore = useMilestoneStore()
const userStore = useUserStore()

const milestones = computed(() => milestoneStore.milestones)
const unlockedMilestones = computed(() => milestoneStore.milestoneRecords)

const earnedMilestones = computed(() => {
  const filteredMilestones = milestones.value.filter((milestone: Milestone) => {
    return unlockedMilestones.value.some((record: MilestoneRecord) => {
      return (
        record.milestoneId === milestone.id &&
        record.userId === userStore.userId
      )
    })
  })

  return filteredMilestones.map((milestone: Milestone) => {
    const record = unlockedMilestones.value.find(
      (r: MilestoneRecord) => r.milestoneId === milestone.id,
    )

    let acquiredAt: string | null = null

    if (record?.createdAt instanceof Date) {
      acquiredAt = record.createdAt.toISOString()
    } else if (typeof record?.createdAt === 'string') {
      const date = new Date(record.createdAt)
      acquiredAt = date.toISOString()
    }

    return { ...milestone, acquiredAt }
  })
})

const unearnedMilestones = computed(() => {
  return milestones.value.filter(
    (milestone) =>
      !unlockedMilestones.value.some(
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
