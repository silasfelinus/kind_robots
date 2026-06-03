<!-- /components/content/wonderlab/lab-manager.vue -->
<template>
  <section class="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
    <div class="flex shrink-0 justify-end">
      <button
        class="btn btn-ghost btn-sm rounded-xl"
        type="button"
        :disabled="isLoading"
        @click="refreshLab"
      >
        <span v-if="isLoading" class="loading loading-spinner loading-xs" />
        <Icon v-else name="kind-icon:refresh" class="size-4" />
        Refresh
      </button>
    </div>

    <div
      v-if="managerError"
      class="shrink-0 rounded-2xl border border-error/40 bg-error/10 p-4 text-error"
    >
      {{ managerError }}
    </div>

    <div
      v-if="isLoading"
      class="shrink-0 rounded-2xl border border-base-300 bg-base-200 p-4"
    >
      <span class="loading loading-spinner loading-sm" />
      <span class="ml-2">Warming up the lab goblins...</span>
    </div>

    <lab-interact
      v-if="activeTab === 'wonder-lab'"
      class="min-h-0 flex-1"
      :show-header="false"
    />

    <memory-dungeon
      v-else-if="activeTab === 'memory-dungeon'"
      class="min-h-0 flex-1"
      :show-header="false"
    />

    <screen-fx
      v-else-if="activeTab === 'screen-fx'"
      class="min-h-0 flex-1"
      :show-header="false"
    />

    <chat-test
      v-else-if="activeTab === 'chat-test'"
      class="min-h-0 flex-1"
      :show-header="false"
    />

    <art-test
      v-else-if="activeTab === 'art-test'"
      class="min-h-0 flex-1"
      :show-header="false"
    />

    <div
      v-else
      class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
    >
      Unknown WonderLab tab: {{ activeTab }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useComponentStore } from '@/stores/componentStore'
import { useNavStore } from '@/stores/navStore'

import LabInteract from '@/components/wonderlab/lab-interact.vue'
import MemoryDungeon from '@/components/pages/memory-dungeon.vue'
import ScreenFx from '@/components/screenfx/screen-fx.vue'

type LabTab =
  | 'wonder-lab'
  | 'memory-dungeon'
  | 'screen-fx'
  | 'chat-test'
  | 'art-test'

const dashboardKey = 'wonder' as const
const fallbackTab: LabTab = 'wonder-lab'
const validTabs: LabTab[] = [
  'wonder-lab',
  'memory-dungeon',
  'screen-fx',
  'chat-test',
  'art-test',
]

const navStore = useNavStore()
const componentStore = useComponentStore()

const isLoading = ref(false)
const managerError = ref<string | null>(null)

const activeTab = computed<LabTab>(() => {
  const selectedTab = navStore.getDashboardTab(dashboardKey)

  return validTabs.includes(selectedTab as LabTab)
    ? (selectedTab as LabTab)
    : fallbackTab
})

async function refreshLab() {
  isLoading.value = true
  managerError.value = null

  try {
    await Promise.all([navStore.initialize(), componentStore.initialize()])
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
