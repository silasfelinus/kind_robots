// /components/content/wonderlab/component-sync.vue
<template>
  <div class="flex flex-col items-center p-4 bg-base-200 rounded-lg shadow-md">
    <h2 class="text-lg font-bold mb-4">Component Sync</h2>
    <button class="btn btn-primary" :disabled="isSyncing" @click="handleSync">
      {{ isSyncing ? 'Syncing...' : 'Sync Components' }}
    </button>
    <p v-if="progressMessage" class="mt-4 text-info">{{ progressMessage }}</p>
    <p v-if="syncMessage" class="mt-4 text-success">{{ syncMessage }}</p>
    <p v-if="syncError" class="mt-4 text-error">{{ syncError }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useComponentStore } from '@/stores/componentStore'

const componentStore = useComponentStore()
const isSyncing = ref(false)
const progressMessage = ref('')
const syncMessage = ref('')
const syncError = ref('')

const handleSync = async () => {
  isSyncing.value = true
  syncMessage.value = ''
  syncError.value = ''
  progressMessage.value = 'Initializing sync...'

  try {
    await componentStore.syncComponents(
      (progress) => (progressMessage.value = progress),
    )
    syncMessage.value = 'Components synced successfully!'
  } catch (error) {
    console.error('Sync error:', error)
    syncError.value =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
          ? error
          : 'An unexpected error occurred during the sync process.'
  } finally {
    isSyncing.value = false
    progressMessage.value = ''
  }
}
</script>

<style scoped>
.text-info {
  color: var(--color-info);
}
.text-success {
  color: var(--color-success);
}
.text-error {
  color: var(--color-error);
}
</style>
