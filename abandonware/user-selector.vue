<!-- /components/content/user/user-selector.vue -->
<template>
  <div class="user-selector">
    <label class="block text-lg font-semibold mb-2">Select User:</label>
    <select
      v-model="selectedUserId"
      class="w-full p-3 rounded-lg border bg-base-200"
      @change="updateRecipient"
    >
      <option value="">-- No Recipient --</option>
      <option v-for="user in users" :key="user.id" :value="String(user.id)">
        {{ user.username }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'

const userStore = useUserStore()

const selectedUserId = ref<string | null>(
  userStore.recipient?.id?.toString() || null,
)

const users = computed(() => userStore.users)

async function syncRecipient(userId: string | null) {
  if (!userId) {
    userStore.recipient = null
    return
  }

  const selectedUser = await userStore.getUserById(Number(userId))
  userStore.recipient = selectedUser || null
}

watch(
  selectedUserId,
  async (newUserId) => {
    await syncRecipient(newUserId)
  },
  { immediate: true },
)

async function updateRecipient() {
  await syncRecipient(selectedUserId.value)
}
</script>

<style scoped>
.user-selector {
  max-width: 400px;
  margin: 0 auto;
}
</style>
