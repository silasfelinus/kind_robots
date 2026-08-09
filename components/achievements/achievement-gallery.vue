<!-- /components/content/achievements/achievement-gallery.vue -->
<template>
  <section
    class="flex h-full min-h-0 w-full flex-col gap-4 rounded-2xl bg-base-200 p-4"
  >
    <!-- ── Header ──────────────────────────────────────────────────────── -->
    <header
      class="flex items-center justify-between gap-3 kr-panel-flat px-4 py-3"
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

    <!-- ── Three-column grid — one shared scroll owner for the whole grid,
         columns grow to content height instead of scrolling independently
         (interface-vision t-047: one-scroll) ─────────────────────────── -->
    <div class="kr-scroll grid grid-cols-1 gap-4 lg:grid-cols-3">
      <!-- Earned -->
      <div class="flex flex-col kr-panel-flat">
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
        <div class="p-3">
          <!-- `:modes="[]"` hides the bar. These are badge-sized items in a
               one-third-width column, not art with three variants, and three
               mode bars across three narrow columns would be noise. -->
          <kr-gallery
            :items="earnedItems"
            :modes="[]"
            empty-label="achievements"
          >
            <template #item="{ item }">
              <EarnedAchievementCard
                v-if="earnedById.get(Number(item.id))"
                :achievement="earnedById.get(Number(item.id))!"
                :acquired-at="earnedById.get(Number(item.id))!.acquiredAt"
              />
            </template>

            <template #empty>
              <div
                class="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-base-300 p-4 text-center text-xs text-base-content/40"
              >
                <Icon name="kind-icon:trophy" class="mb-2 h-8 w-8 opacity-30" />
                No achievements earned yet.
              </div>
            </template>
          </kr-gallery>
        </div>
      </div>

      <!-- Leaderboard -->
      <div class="flex flex-col kr-panel-flat">
        <div class="flex items-center gap-2 border-b border-base-300 px-4 py-3">
          <span
            class="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/15 text-secondary"
          >
            <Icon name="kind-icon:trophy" class="h-4 w-4" />
          </span>
          <h2 class="text-sm font-black text-base-content">Leaderboard</h2>
        </div>
        <div class="p-3">
          <achievement-leaderboard />
        </div>
      </div>

      <!-- Undiscovered -->
      <div class="flex flex-col kr-panel-flat">
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
        <div class="p-3">
          <!-- The old grid was `md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2`
               -- VIEWPORT-keyed, inside a column that is a third of the page.
               On a wide screen `xl:grid-cols-2` fired against a narrow column.
               MODE_GRID_CLASS measures the container instead. -->
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
                class="flex min-h-32 flex-col items-center justify-center rounded-xl border border-dashed border-success/30 bg-success/5 p-4 text-center text-xs text-success/70"
              >
                <Icon name="kind-icon:check" class="mb-2 h-8 w-8" />
                All achievements discovered!
              </div>
            </template>
          </kr-gallery>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GalleryItem } from '@/components/gallery/kr-gallery.vue'

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
  const achievementById = new Map(
    achievementStore.achievements.map((m) => [m.id, m]),
  )
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

/*
 * kr-gallery takes GalleryItems and hands one back to the #item slot, so each
 * column maps its id to the real record. Earned keeps its own map because the
 * card needs `acquiredAt`, which only the earned shape carries.
 */
const earnedItems = computed<GalleryItem[]>(() =>
  earnedAchievements.value.map((achievement) => ({
    id: achievement.id,
    title: achievement.label || `Achievement ${achievement.id}`,
  })),
)

const earnedById = computed(
  () => new Map(earnedAchievements.value.map((a) => [a.id, a])),
)

const unearnedItems = computed<GalleryItem[]>(() =>
  unearnedAchievements.value.map((achievement) => ({
    id: achievement.id,
    title: achievement.label || `Achievement ${achievement.id}`,
  })),
)

const unearnedById = computed(
  () => new Map(unearnedAchievements.value.map((a) => [a.id, a])),
)

const resetAchievements = () => {
  achievementStore.clearAllAchievementRecords()
}
</script>
