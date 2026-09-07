<!-- /components/achievements/leaderboard-table.vue -->
<template>
  <table
    class="table-auto w-full border-collapse rounded-lg border border-base-300"
  >
    <thead>
      <tr class="bg-base-200">
        <th class="kr-table-cell">Rank</th>
        <th class="kr-table-cell">Username</th>
        <th class="kr-table-cell">{{ scoreLabel }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, index) in rows" :key="row.id" class="hover:bg-base-100">
        <td class="kr-table-cell text-center">
          {{ index + 1 }}
        </td>
        <td class="kr-table-cell">{{ row.username }}</td>
        <td class="kr-table-cell text-center">
          {{ row[scoreKey] ?? 'N/A' }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
// Shared presentational leaderboard table used by both click-leaderboard.vue
// and match-leaderboard.vue so the rank/username/record markup can't drift
// apart (global-ui/t-022, following the honeydo-card pattern from t-020).
interface LeaderboardRow {
  id: number
  username: string
  clickRecord?: number
  matchRecord?: number
}

defineProps<{
  rows: LeaderboardRow[]
  scoreLabel: string
  scoreKey: 'clickRecord' | 'matchRecord'
}>()
</script>
