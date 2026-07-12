<!-- /components/content/achievements/achievement-gallery.vue -->
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
            {{ userStore.username }}'s Achievements
          </h1>
          <p class="text-xs text-base-content/50">
            {{ earnedAchievements.length }} earned ·
            {{ unearnedAchievements.length }} remaining
          </p>
        </div>
      </div>

      <button
        class="btn btn-ghost btn-sm rounded-xl border border-error/30 text-error hover:border-error hover:bg-error hover:text-error-content"
        type="button"
        @click="resetAchievements"
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
            earnedAchievements.length
          }}</span>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto p-3">
          <div v-if="earnedAchievements.length" class="grid grid-cols-1 gap-2">
            <EarnedAchievementCard
              v-for="earnedAchievement in earnedAchievements"
              :key="earnedAchievement.id"
              :achievement="earnedAchievement"
              :acquired-at="earnedAchievement.acquiredAt"
            />
          </div>
          <div
            v-else
            class="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-base-300 p-4 text-center text-xs text-base-content/40"
          >
            <Icon name="kind-icon:trophy" class="mb-2 h-8 w-8 opacity-30" />
            No achievements earned yet.
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
          <achievement-leaderboard />
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
            unearnedAchievements.length
          }}</span>
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto p-3">
          <div
            v-if="unearnedAchievements.length"
            class="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2"
          >
            <UnearnedAchievementCard
              v-for="achievement in unearnedAchievements"
              :key="achievement.id"
              :achievement="achievement"
            />
          </div>
          <div
            v-else
            class="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-success/30 bg-success/5 p-4 text-center text-xs text-success/70"
          >
            <Icon name="kind-icon:check" class="mb-2 h-8 w-8" />
            All achievements discovered!
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const achievementStore = useAchievementStore()
const userStore = useUserStore()

type EarnedAchievement = (typeof achievementStore.achievements)[number] & {
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

const earnedAchievements = computed<EarnedAchievement[]>(() => {
  const uid = userStore.userId
  if (!uid) return []
  const achievementById = new Map(achievementStore.achievements.map((m) => [m.id, m]))
  const earned: EarnedAchievement[] = []
  for (const record of achievementStore.achievementRecords) {
    if (record.userId !== uid) continue
    const achievementId = record.achievementId
    if (achievementId == null) continue
    const achievement = achievementById.get(achievementId)
    if (!achievement) continue
    earned.push({
      ...achievement,
      acquiredAt: toIsoOrNull((record as any).createdAt),
    })
  }
  return earned
})

const unearnedAchievements = computed(() => {
  const uid = userStore.userId
  if (!uid) return achievementStore.achievements
  const earnedIds = new Set(
    achievementStore.achievementRecords
      .filter((r) => r.userId === uid && r.achievementId != null)
      .map((r) => r.achievementId as number),
  )
  return achievementStore.achievements.filter((m) => !earnedIds.has(m.id))
})

const resetAchievements = () => {
  achievementStore.clearAllAchievementRecords()
}
</script>
