<!-- /components/content/layout/test-page-mature.vue -->
<template>
  <div class="test-page">
    <h1>Show Mature Settings Test Page</h1>
    <p>
      <strong>showMatureContent (from state):</strong> {{ showMature || false }}
    </p>
    <p>
      <strong>showMature (from user object):</strong>
      {{ user?.showMature || false }}
    </p>
    <p><strong>show user object:</strong> {{ user }}</p>
    <button @click="refreshUserSettings">Refresh Settings</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '../../stores/userStore'

const userStore = useUserStore()
const user = computed(() => userStore.user || null)

const showMature = computed(() => userStore.showMature || false)

function refreshUserSettings() {
  userStore
    .validateAndFetchUserData()
    .then(() => {
      console.log('User data refreshed')
    })
    .catch((error) => {
      console.error('Failed to refresh user data:', error)
    })
}
</script>

<style scoped>
.test-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

button {
  margin-top: 20px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}
</style>
