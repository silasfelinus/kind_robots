<template>
  <div class="rounded-2xl border p-3 m-3 bg-base-200">
    <h1>Global Match Leaderboard</h1>
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Username</th>
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(user, index) in leaderboard" :key="user.id">
          <td>{{ index + 1 }}</td>
          <td>{{ user.username }}</td>
          <td>{{ user.matchRecord }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Define the type for the leaderboard
interface LeaderboardUser {
  id: number
  username: string
  matchRecord: number
}

const leaderboard = ref<LeaderboardUser[]>([])

onMounted(async () => {
  const response = await fetch('/api/milestones/fetchHighMatchScores')
  const data = await response.json()
  if (data.success) {
    leaderboard.value = data.users
  }
})
</script>
