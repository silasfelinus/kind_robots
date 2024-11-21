// /components/component-sync.vue
<template>
  <div class="flex flex-col items-center p-4 bg-base-200 rounded-lg shadow-md">
    <h2 class="text-lg font-bold mb-4">Component Sync</h2>
    <button class="btn btn-primary" :disabled="isSyncing" @click="handleSync">
      {{ isSyncing ? 'Syncing...' : 'Sync Components' }}
    </button>
    <p v-if="syncMessage" class="mt-4 text-info">{{ syncMessage }}</p>
    <p v-if="syncError" class="mt-4 text-error">{{ syncError }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useComponentStore } from '@/stores/componentStore'

const componentStore = useComponentStore()
const isSyncing = ref(false)
const syncMessage = ref('')
const syncError = ref('')

const handleSync = async () => {
  isSyncing.value = true
  syncMessage.value = ''
  syncError.value = ''
  try {
    await componentStore.syncComponents()
    syncMessage.value = 'Components synced successfully!'
  } catch (error) {
    syncError.value = error.message || 'Failed to sync components.'
  } finally {
    isSyncing.value = false
  }
}
</script>

<style scoped>
.text-info {
  color: var(--color-info);
}
.text-error {
  color: var(--color-error);
}
</style>
