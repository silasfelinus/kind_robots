<template>
  <div class="test-page">
    <h1>Show Mature Settings Test Page</h1>
    <p><strong>showMatureContent (from state):</strong> {{ showMature }}</p>
    <p><strong>showMature (from user object):</strong> {{ userShowMature }}</p>
    <button @click="refreshUserSettings">Refresh Settings</button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUserStore } from './../../../stores/userStore'

const userStore = useUserStore()

const showMature = computed(() => userStore.showMatureContent)
const userShowMature = computed(() => userStore.user?.showMature || false)

function refreshUserSettings() {
  userStore
    .fetchUserByApiKey()
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
