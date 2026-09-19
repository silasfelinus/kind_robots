<template>
  <article
    class="card h-full min-h-48 rounded-2xl border border-secondary/25 bg-base-300 p-4"
  >
    <div class="flex items-center gap-3">
      <span
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary"
      >
        <Icon name="kind-icon:trophy" class="kr-icon-5" />
      </span>
      <div class="min-w-0">
        <p class="kr-text-dim-xs">Leaderboard</p>
        <h2 class="kr-text-black-base truncate text-base-content">
          Jellybean Collectors
        </h2>
      </div>
    </div>

    <ol v-if="leaderboardData.length" class="mt-4 space-y-2">
      <li
        v-for="(entry, index) in leaderboardData"
        :key="entry.username"
        class="flex min-w-0 items-center gap-2"
      >
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary/15 text-xs font-black text-secondary"
        >
          {{ index + 1 }}
        </span>
        <span class="min-w-0 flex-1 truncate font-semibold">
          {{ entry.username }}
        </span>
        <span class="kr-text-dim-xs shrink-0">
          {{ entry.count }} {{ entry.count === 1 ? 'jellybean' : 'jellybeans' }}
        </span>
      </li>
    </ol>

    <div
      v-else
      class="kr-text-dim-xs-40 flex flex-1 items-center justify-center py-5 text-center"
    >
      No collectors yet.
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const achievementStore = useAchievementStore()

const leaderboardData = computed(() => {
  const leaderboard = new Map<string, number>()

  for (const record of achievementStore.achievementRecords) {
    const username = record.username?.trim() || 'Unknown'
    leaderboard.set(username, (leaderboard.get(username) ?? 0) + 1)
  }

  return [...leaderboard.entries()]
    .map(([username, count]) => ({ username, count }))
    .sort(
      (a, b) => b.count - a.count || a.username.localeCompare(b.username),
    )
})
</script>
