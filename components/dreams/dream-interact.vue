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

  <!--
    The narrator lives here rather than in app.vue's global chrome. It used to
    render on every page with a default voice, which was distracting, and it
    forced narratorStore (and through it dreamStore, chatStore, serverStore and
    sceneChoices) into the eager first-paint bundle for every visitor. Lazy so
    its chunk is fetched only when a dream is actually open.
  -->
  <LazyWorkspaceNarrator
    v-if="dreamStore.selectedDream"
    class="pointer-events-none absolute inset-y-0 right-0 z-40"
    :open="narratorOpen"
    :coexist="true"
    :dock-visible="true"
    @update:open="narratorOpen = $event"
  />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'

const dreamStore = useDreamStore()
const narratorOpen = ref(false)
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
