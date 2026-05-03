<!-- /components/content/wonderlab/lab-manager.vue -->
<template>
  <dashboard-shell
    title="WonderLab"
    :summary="managerSummary"
    :tabs="tabs"
    :active-tab="activeTab"
    :loading="isLoading"
    :error="managerError"
    loading-message="Warming up the lab goblins..."
    nav-grid-class="xl:grid-cols-4"
    @set-tab="setTab"
    @refresh="refreshLab"
  >
    <template #default="{ activeTab: currentTab }">
      <lab-interact v-if="currentTab === 'wonder-lab'" />

      <memory-dungeon
        v-else-if="currentTab === 'memory-dungeon'"
        class="h-full w-full"
      />

      <rebel-button
        v-else-if="currentTab === 'rebel-button'"
        class="h-full w-full"
      />

      <screen-fx v-else-if="currentTab === 'screen-fx'" class="h-full w-full" />

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
// /components/content/wonderlab/lab-manager.vue
import { computed, onMounted, ref } from 'vue'
import { useComponentStore } from '@/stores/componentStore'
import { useNavStore } from '@/stores/navStore'

import LabInteract from '@/components/wonderlab/lab-interact.vue'
import MemoryDungeon from '@/components/pages/memory-dungeon.vue'
import RebelButton from '@/components/pages/rebel-button.vue'
import ScreenFx from '@/components/screenfx/screen-fx.vue'

type WonderDashboardTab =
  | 'wonder-lab'
  | 'memory-dungeon'
  | 'rebel-button'
  | 'screen-fx'

const dashboardKey = 'wonder' as const

const componentStore = useComponentStore()
const navStore = useNavStore()

const isLoading = ref(false)
const managerError = ref<string | null>(null)

const tabs = computed(() => navStore.getDashboardTabs(dashboardKey))

const activeTab = computed(() => {
  const tab = navStore.getDashboardTab(dashboardKey)

  return isWonderDashboardTab(tab) ? tab : 'wonder-lab'
})

const managerSummary = computed(() => {
  const total = componentStore.allComponents?.length ?? 0
  const selected = componentStore.selectedComponent?.componentName || 'none'

  return `${total} components indexed. Selected component: ${selected}.`
})

function isWonderDashboardTab(value: string): value is WonderDashboardTab {
  return ['wonder-lab', 'memory-dungeon', 'rebel-button', 'screen-fx'].includes(
    value,
  )
}

function setTab(tab: string) {
  navStore.setDashboardTab(
    dashboardKey,
    isWonderDashboardTab(tab) ? tab : 'wonder-lab',
  )
}

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
  isLoading.value = true
  managerError.value = null

  try {
    await Promise.all([navStore.initialize(), componentStore.initialize()])

    if (!isWonderDashboardTab(navStore.getDashboardTab(dashboardKey))) {
      navStore.setDashboardTab(dashboardKey, 'wonder-lab')
    }
  } catch (error) {
    managerError.value =
      error instanceof Error ? error.message : 'Failed to load WonderLab.'
  } finally {
    isLoading.value = false
  }
})
</script>
