<template>
  <div class="user-panel">
    <h2 class="text-xl font-semibold mb-4">Your Items</h2>
    <ul>
      <li v-for="item in userItems" :key="item.id" class="mb-2">
        {{ item.name }}
        <!-- Add more item details as needed -->
      </li>
    </ul>
    <h2 class="text-xl font-semibold mt-6 mb-4">User Settings</h2>
    <!-- Add user settings form or links here -->
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()
const userItems = ref([])

onMounted(async () => {
  try {
    // Fetch user items from the store or API
    userItems.value = await userStore.fetchUserItems()
  } catch (error) {
    console.error('Failed to fetch user items:', error)
  }
})
</script>

<style scoped>
.user-panel {
  padding: 1rem;
  background-color: var(--color-base-200);
  border-radius: 0.5rem;
}
</style>
