<template>
  <div class="user-selector">
    <label class="block text-lg font-semibold mb-2">Select User:</label>
    <select
      v-model="selectedUserId"
      class="w-full p-3 rounded-lg border bg-base-200"
      @change="updateRecipient"
    >
      <option value="">-- No Recipient --</option>
      <option
        v-for="user in users"
        :key="user.id"
        :value="user.id"
      >
        {{ user.username }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()

// State for the selected user ID
const selectedUserId = ref<number | null>(userStore.recipient?.id || null)

// Fetch the list of users
const users = computed(() => userStore.users)

// Watch for changes to `selectedUserId` and update the recipient in the store
watch(
  selectedUserId,
  (newUserId) => {
    if (newUserId === null || newUserId === '') {
      userStore.recipient = null // Set to no recipient
    } else {
      const selectedUser = userStore.getUserById(Number(newUserId))
      userStore.recipient = selectedUser || null
    }
  },
  { immediate: true }
)

// Method to handle selection updates
function updateRecipient() {
  if (!selectedUserId.value) {
    userStore.recipient = null // Set to no recipient
  } else {
    const selectedUser = userStore.getUserById(Number(selectedUserId.value))
    userStore.recipient = selectedUser || null
  }
}
</script>

<style scoped>
.user-selector {
  max-width: 400px;
  margin: 0 auto;
}
</style>
