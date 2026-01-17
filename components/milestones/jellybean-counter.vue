<!-- /components/content/milestones/jellybean-counter.vue -->
<template>
  <div class="bg-base-300 rounded-2xl border p-2 mx-auto max-w-screen-xl">
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

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:p-2">
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

      <div
        class="flex flex-col items-center p-4 border bg-primary rounded-2xl m-2"
      >
        <milestone-leaderboard />
      </div>

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

const milestoneStore = useMilestoneStore()
const userStore = useUserStore()

type EarnedMilestone = (typeof milestoneStore.milestones)[number] & {
  acquiredAt: string | null
}

function toIsoOrNull(value: unknown): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d.toISOString()
  }
  return null
}

const earnedMilestones = computed<EarnedMilestone[]>(() => {
  const uid = userStore.userId
  if (!uid) return []

  const milestoneById = new Map(milestoneStore.milestones.map((m) => [m.id, m]))

  const earned: EarnedMilestone[] = []

  for (const record of milestoneStore.milestoneRecords) {
    if (record.userId !== uid) continue

    const milestoneId = record.milestoneId
    if (milestoneId == null) continue

    const milestone = milestoneById.get(milestoneId)
    if (!milestone) continue

    earned.push({
      ...milestone,
      acquiredAt: toIsoOrNull((record as any).createdAt),
    })
  }

  return earned
})

const unearnedMilestones = computed(() => {
  const uid = userStore.userId
  if (!uid) return milestoneStore.milestones

  const earnedIds = new Set(
    milestoneStore.milestoneRecords
      .filter((r) => r.userId === uid && r.milestoneId != null)
      .map((r) => r.milestoneId as number),
  )

  return milestoneStore.milestones.filter((m) => !earnedIds.has(m.id))
})

const resetMilestones = () => {
  milestoneStore.clearAllMilestoneRecords()
}
</script>
