<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 rounded-2xl bg-base-200 p-4"
  >
    <header
      class="flex items-center justify-between gap-3 kr-panel-flat px-4 py-3"
    >
      <div class="flex min-w-0 items-center gap-3">
        <span
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary"
        >
          <Icon name="kind-icon:jellybean" class="kr-icon-6" />
        </span>
        <div class="min-w-0">
          <h1 class="kr-text-black-lg truncate text-base-content">
            {{ userStore.username }}'s Achievements
          </h1>
          <p class="kr-text-dim-xs">
            {{ earnedAchievements.length }} earned ·
            {{ unearnedAchievements.length }} remaining
          </p>
        </div>
      </div>

      <button
        class="btn btn-ghost btn-sm shrink-0 rounded-xl border border-error/30 text-error hover:border-error hover:bg-error hover:text-error-content"
        type="button"
        @click="resetAchievements"
      >
        <Icon name="kind-icon:refresh" class="kr-icon-4" />
        <span class="hidden sm:inline">Reset</span>
      </button>
    </header>

    <div class="kr-scroll flex min-h-0 flex-col gap-6 pr-1">
      <section class="space-y-3">
        <div class="flex items-center gap-2 px-1">
          <span
            class="flex h-7 w-7 items-center justify-center rounded-lg bg-success/15 text-success"
          >
            <Icon name="kind-icon:check" class="kr-icon-4" />
          </span>
          <h2 class="kr-text-black-sm text-base-content">Earned</h2>
          <span class="kr-badge-success-sm">{{ earnedAchievements.length }}</span>
        </div>

        <div class="achievement-grid-shell">
          <div class="achievement-card-grid">
            <div
              v-if="!earnedAchievements.length"
              class="kr-text-dim-xs-40 flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-base-300 bg-base-100/40 p-5 text-center"
            >
              <Icon name="kind-icon:trophy" class="kr-icon-8 mb-2 opacity-30" />
              No achievements earned yet.
            </div>

            <EarnedAchievementCard
              v-for="achievement in earnedAchievements"
              :key="achievement.id"
              :achievement="achievement"
              :acquired-at="achievement.acquiredAt"
            />

            <div
              class="achievement-leaderboard-cell min-w-0"
              :data-has-earned="earnedAchievements.length > 0"
              :data-earned-before="Math.min(earnedAchievements.length, 2)"
            >
              <achievement-leaderboard />
            </div>
          </div>
        </div>
      </section>

      <section class="space-y-3">
        <div class="flex items-center gap-2 px-1">
          <span
            class="flex h-7 w-7 items-center justify-center rounded-lg bg-base-300 text-base-content/50"
          >
            <Icon name="kind-icon:question" class="kr-icon-4" />
          </span>
          <h2 class="kr-text-black-sm text-base-content">Undiscovered</h2>
          <span class="kr-badge-ghost-sm">{{ unearnedAchievements.length }}</span>
        </div>

        <div class="achievement-grid-shell">
          <kr-gallery
            :items="unearnedItems"
            :modes="[]"
            empty-label="achievements"
          >
            <template #item="{ item }">
              <UnearnedAchievementCard
                v-if="unearnedById.get(Number(item.id))"
                :achievement="unearnedById.get(Number(item.id))!"
              />
            </template>

            <template #empty>
              <div
                class="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-success/30 bg-success/5 p-5 text-center text-xs text-success/70"
              >
                <Icon name="kind-icon:check" class="kr-icon-8 mb-2" />
                All achievements discovered!
              </div>
            </template>
          </kr-gallery>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GalleryItem } from '@/components/gallery/kr-gallery.vue'
import type { Achievement } from '~/prisma/generated/prisma/client'

const achievementStore = useAchievementStore()
const userStore = useUserStore()

type EarnedAchievement = Achievement & {
  acquiredAt: string | null
}

function toIsoOrNull(value: unknown): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }
  return null
}

const earnedAchievements = computed<EarnedAchievement[]>(() => {
  const userId = userStore.userId
  if (!userId) return []

  const achievementById = new Map(
    achievementStore.achievements.map((achievement) => [
      achievement.id,
      achievement,
    ]),
  )
  const earned: EarnedAchievement[] = []

  for (const record of achievementStore.achievementRecords) {
    if (record.userId !== userId || record.achievementId == null) continue
    const achievement = achievementById.get(record.achievementId)
    if (!achievement) continue

    earned.push({
      ...achievement,
      acquiredAt: toIsoOrNull(record.createdAt),
    })
  }

  return earned
})

const unearnedAchievements = computed(() => {
  const userId = userStore.userId
  if (!userId) return achievementStore.achievements

  const earnedIds = new Set(
    achievementStore.achievementRecords
      .filter(
        (record) => record.userId === userId && record.achievementId != null,
      )
      .map((record) => record.achievementId as number),
  )

  return achievementStore.achievements.filter(
    (achievement) => !earnedIds.has(achievement.id),
  )
})

const unearnedItems = computed<GalleryItem[]>(() =>
  unearnedAchievements.value.map((achievement) => ({
    id: achievement.id,
    title: achievement.label || `Achievement ${achievement.id}`,
  })),
)

const unearnedById = computed(
  () =>
    new Map(
      unearnedAchievements.value.map((achievement) => [
        achievement.id,
        achievement,
      ]),
    ),
)

const resetAchievements = () => {
  achievementStore.clearAllAchievementRecords()
}
</script>

<style scoped>
.achievement-grid-shell {
  container: achievement-grid / inline-size;
}

.achievement-card-grid,
.achievement-grid-shell :deep([data-kr-gallery-grid]) {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.75rem;
  align-items: stretch;
}

.achievement-leaderboard-cell[data-has-earned='true'] {
  grid-column: 1;
  grid-row: 2;
}

@container achievement-grid (min-width: 42rem) {
  .achievement-card-grid,
  .achievement-grid-shell :deep([data-kr-gallery-grid]) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .achievement-leaderboard-cell[data-has-earned='true'] {
    grid-column: 2;
    grid-row: 1;
  }
}

@container achievement-grid (min-width: 66rem) {
  .achievement-card-grid,
  .achievement-grid-shell :deep([data-kr-gallery-grid]) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .achievement-leaderboard-cell[data-has-earned='true'][data-earned-before='1'] {
    grid-column: 2;
  }

  .achievement-leaderboard-cell[data-has-earned='true'][data-earned-before='2'] {
    grid-column: 3;
  }
}
</style>
