<!-- /components/content/milestones/milestone-gallery.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 rounded-2xl bg-base-200 p-4"
  >
    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <header
      class="flex items-center justify-between gap-3 rounded-2xl border border-base-300 bg-base-100 px-4 py-3"
    >
      <div class="flex items-center gap-3">
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary"
        >
          <Icon name="kind-icon:jellybean" class="h-6 w-6" />
        </span>
        <div>
          <h1 class="text-lg font-black text-base-content">
            {{ userStore.username }}'s Milestones
          </h1>
          <p class="text-xs text-base-content/50">
            {{ earnedMilestones.length }} earned ·
            {{ unearnedMilestones.length }} remaining
          </p>
        </div>
      </div>

      <button
        class="btn btn-ghost btn-sm rounded-xl border border-error/30 text-error hover:border-error hover:bg-error hover:text-error-content"
        type="button"
        @click="resetMilestones"
      >
        <Icon name="kind-icon:refresh" class="h-4 w-4" />
        Reset
      </button>
    </header>

    <!-- ── Three-column grid ────────────────────────────────────────────── -->
    <div class="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
      <!-- Earned -->
      <div
        class="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100"
      >
        <div class="flex items-center gap-2 border-b border-base-300 px-4 py-3">
          <span
            class="flex h-7 w-7 items-center justify-center rounded-lg bg-success/15 text-success"
          >
            <Icon name="kind-icon:check" class="h-4 w-4" />
          </span>
          <h2 class="text-sm font-black text-base-content">Earned</h2>
          <span class="ml-auto badge badge-success badge-sm">{{
            earnedMilestones.length
          }}</span>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto p-3">
          <div v-if="earnedMilestones.length" class="grid grid-cols-1 gap-2">
            <EarnedMilestoneCard
              v-for="earnedMilestone in earnedMilestones"
              :key="earnedMilestone.id"
              :milestone="earnedMilestone"
              :acquired-at="earnedMilestone.acquiredAt"
            />
          </div>
          <div
            v-else
            class="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-base-300 p-4 text-center text-xs text-base-content/40"
          >
            <Icon name="kind-icon:trophy" class="mb-2 h-8 w-8 opacity-30" />
            No milestones earned yet.
          </div>
        </div>
      </div>

      <!-- Leaderboard -->
      <div
        class="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100"
      >
        <div class="flex items-center gap-2 border-b border-base-300 px-4 py-3">
          <span
            class="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/15 text-secondary"
          >
            <Icon name="kind-icon:trophy" class="h-4 w-4" />
          </span>
          <h2 class="text-sm font-black text-base-content">Leaderboard</h2>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto p-3">
          <milestone-leaderboard />
        </div>
      </div>

      <!-- Undiscovered -->
      <div
        class="flex min-h-0 flex-col rounded-2xl border border-base-300 bg-base-100"
      >
        <div class="flex items-center gap-2 border-b border-base-300 px-4 py-3">
          <span
            class="flex h-7 w-7 items-center justify-center rounded-lg bg-base-300 text-base-content/50"
          >
            <Icon name="kind-icon:question" class="h-4 w-4" />
          </span>
          <h2 class="text-sm font-black text-base-content">Undiscovered</h2>
          <span class="ml-auto badge badge-ghost badge-sm">{{
            unearnedMilestones.length
          }}</span>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto p-3">
          <div
            v-if="unearnedMilestones.length"
            class="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
          >
            <UnearnedMilestoneCard
              v-for="milestone in unearnedMilestones"
              :key="milestone.id"
              :milestone="milestone"
            />
          </div>
          <div
            v-else
            class="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-success/30 bg-success/5 p-4 text-center text-xs text-success/70"
          >
            <Icon name="kind-icon:check" class="mb-2 h-8 w-8" />
            All milestones discovered!
          </div>
        </div>
      </div>
    </div>
  </section>
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
