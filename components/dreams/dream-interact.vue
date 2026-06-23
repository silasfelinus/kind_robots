<!-- /components/dreams/dream-interact.vue -->
<template>
  <dream-gallery
    v-if="!dreamStore.selectedDream"
    class="h-full min-h-0"
    variant="dashboard"
    title="Choose a Dream"
    subtitle="Pick a Dream to open its organic workspace."
    :open-on-select="true"
  />

  <dream-workspace v-else class="h-full min-h-0" />
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'

const dreamStore = useDreamStore()
const workspaceStore = useWorkspaceStore()

watch(
  () => dreamStore.selectedDream?.id,
  (id) => {
    if (id) {
      workspaceStore.openDream(id, workspaceStore.dreamPanel)
    }
  },
)

onMounted(() => {
  workspaceStore.hydrate()

  if (dreamStore.selectedDream?.id) {
    workspaceStore.openDream(dreamStore.selectedDream.id, workspaceStore.dreamPanel)
  }
})
</script>
