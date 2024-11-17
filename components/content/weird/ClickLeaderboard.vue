<template>
  <div>
    <h1>Global Leaderboard</h1>
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
          <td>{{ user.clickRecord }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {useMilestoneStore} from '@/stores/milestoneStore'

// Define the type for the leaderboard
interface LeaderboardUser {
  id: number
  username: string
  clickRecord: number
}

const leaderboard = computed(()=> milestoneStore.clickRecord as LeaderboardUser[])


</script>
