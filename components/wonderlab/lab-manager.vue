<!-- /components/content/wonderlab/lab-manager.vue -->
<template>
  <dashboard-shell
    dashboard-key="wonder"
    title="WonderLab"
    :summary="managerSummary"
    :loading="isLoading"
    :error="managerError"
    loading-message="Warming up the lab goblins..."
    nav-grid-class="xl:grid-cols-4"
    @refresh="refreshLab"
  >
    <template #default="{ activeTab: currentTab, activeTabConfig }">
      <lab-interact v-if="currentTab === 'wonder-lab'" :show-header="false" />

      <memory-dungeon
        v-else-if="currentTab === 'memory-dungeon'"
        class="h-full w-full"
        :show-header="false"
      />

      <rebel-button
        v-else-if="currentTab === 'rebel-button'"
        class="h-full w-full"
        :show-header="false"
      />

      <screen-fx
        v-else-if="currentTab === 'screen-fx'"
        class="h-full w-full"
        :show-header="false"
      />
      <chat-test
        v-else-if="currentTab === 'chat-test'"
        class="h-full w-full"
        :show-header="false"
      />

      <div
        v-else
        class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
      >
        Unknown WonderLab tab: {{ currentTab }}
      </div>
    </template>
  </dashboard-shell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useComponentStore } from '@/stores/componentStore'

import LabInteract from '@/components/wonderlab/lab-interact.vue'
import MemoryDungeon from '@/components/pages/memory-dungeon.vue'
import RebelButton from '@/components/pages/rebel-button.vue'
import ScreenFx from '@/components/screenfx/screen-fx.vue'

const componentStore = useComponentStore()

const isLoading = ref(false)
const managerError = ref<string | null>(null)

const managerSummary = computed(() => {
  const total = componentStore.allComponents?.length ?? 0
  const selected = componentStore.selectedComponent?.componentName || 'none'

  return `${total} components indexed. Selected component: ${selected}.`
})

async function refreshLab() {
  isLoading.value = true
  managerError.value = null

  try {
    await componentStore.initialize()
  } catch (error) {
    managerError.value =
      error instanceof Error ? error.message : 'Failed to refresh WonderLab.'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await refreshLab()
})
</script>
