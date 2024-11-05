<template>
  <div class="p-8 rounded-lg bg-base-200 flex flex-col gap-6">
    <h1 class="text-2xl font-bold">User Store Debug Panel</h1>

    <div class="flex flex-col gap-4">
      <!-- API Key Display -->
      <div>
        <label class="font-semibold">API Key:</label>
        <p class="p-2 rounded bg-primary text-white">{{ userStore.apiKey }}</p>
      </div>

      <!-- User Information -->
      <div v-if="userStore.user">
        <label class="font-semibold">User Information:</label>
        <ul class="pl-4">
          <li><strong>Username:</strong> {{ userStore.username }}</li>
          <li><strong>Email:</strong> {{ userStore.email }}</li>
          <li><strong>Role:</strong> {{ userStore.role }}</li>
          <li><strong>Karma:</strong> {{ userStore.karma }}</li>
          <li><strong>Mana:</strong> {{ userStore.mana }}</li>
        </ul>
      </div>

      <!-- Login Status and Token -->
      <div>
        <label class="font-semibold">Login Status:</label>
        <p>{{ userStore.isLoggedIn ? 'Logged In' : 'Not Logged In' }}</p>
      </div>
      <div v-if="userStore.token">
        <label class="font-semibold">Token:</label>
        <p class="p-2 rounded bg-secondary text-white">{{ userStore.token }}</p>
      </div>

      <!-- High Scores -->
      <div>
        <label class="font-semibold">High Click Scores:</label>
        <p>{{ userStore.highClickScores.join(', ') || 'No records' }}</p>
      </div>
      <div>
        <label class="font-semibold">High Match Scores:</label>
        <p>{{ userStore.highMatchScores.join(', ') || 'No records' }}</p>
      </div>

      <!-- Error Display -->
      <div v-if="userStore.lastError">
        <label class="font-semibold text-error">Last Error:</label>
        <p class="text-error">{{ userStore.lastError }}</p>
      </div>

      <!-- Action Buttons for Testing -->
      <div class="flex gap-4">
        <button class="btn btn-primary" @click="initializeUser">
          Initialize User
        </button>
        <button class="btn btn-accent" @click="fetchUserByApiKey">
          Fetch User by API Key
        </button>
        <button class="btn btn-warning" @click="logout">Logout</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()

// Testing actions for user interaction
const initializeUser = () => userStore.initializeUser()
const fetchUserByApiKey = () => userStore.fetchUserByApiKey()
const logout = () => userStore.logout()
</script>
