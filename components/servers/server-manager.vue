<!-- /components/server/server-manager.vue -->
<template>
  <section class="flex h-full min-h-0 flex-col overflow-hidden">
    <div
      v-if="isLoadingManager || managerError"
      class="mb-4 shrink-0 rounded-2xl border border-base-300 bg-base-100 p-4"
    >
      <div v-if="isLoadingManager" class="flex items-center gap-2 text-sm">
        <span class="loading loading-spinner loading-sm text-primary" />
        <span>Loading servers...</span>
      </div>

      <div v-if="managerError" class="mt-2 text-sm text-error">
        {{ managerError }}
      </div>

      <button
        v-if="managerError"
        type="button"
        class="btn btn-sm btn-outline mt-3 rounded-2xl"
        @click="refreshManagerData"
      >
        Try Again
      </button>
    </div>

    <section
      v-if="activeTab === 'overview'"
      class="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-12"
    >
      <div class="flex min-h-0 flex-col gap-4 overflow-y-auto xl:col-span-5">
        <server-gallery
          mode="art"
          variant="dropdown"
          :show-header="false"
          :show-controls="false"
          :show-card-actions="false"
          :show-descriptions="true"
          :show-meta="true"
          :show-capabilities="false"
          :show-use-buttons="false"
          :show-workflow="false"
          :show-defaults="false"
          :show-status="false"
        />

        <server-gallery
          mode="text"
          variant="dropdown"
          :show-header="false"
          :show-controls="false"
          :show-card-actions="false"
          :show-descriptions="true"
          :show-meta="true"
          :show-capabilities="false"
          :show-use-buttons="false"
          :show-workflow="false"
          :show-defaults="false"
          :show-status="false"
        />

        <checkpoint-gallery
          variant="compact"
          :show-header="false"
          :show-controls="false"
          :show-status="false"
        />
      </div>

      <div class="min-h-0 overflow-y-auto xl:col-span-7">
        <server-interact />
      </div>
    </section>

    <server-gallery
      v-else-if="activeTab === 'art'"
      class="min-h-0 flex-1 overflow-y-auto"
      mode="art"
      variant="dashboard"
      :show-header="false"
    />

    <server-gallery
      v-else-if="activeTab === 'text'"
      class="min-h-0 flex-1 overflow-y-auto"
      mode="text"
      variant="dashboard"
      :show-header="false"
    />

    <checkpoint-gallery
      v-else-if="activeTab === 'checkpoints'"
      class="min-h-0 flex-1 overflow-y-auto"
      variant="dashboard"
      :show-header="false"
    />

    <server-gallery
      v-else-if="activeTab === 'all'"
      class="min-h-0 flex-1 overflow-y-auto"
      mode="all"
      variant="dashboard"
      :show-header="false"
    />

    <server-interact
      v-else-if="activeTab === 'interact'"
      class="min-h-0 flex-1 overflow-y-auto"
    />

    <div
      v-else
      class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
    >
      Unknown server tab: {{ activeTab }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useNavStore } from '@/stores/navStore'
import { useServerStore } from '@/stores/serverStore'

type ServerTab =
  | 'overview'
  | 'art'
  | 'text'
  | 'checkpoints'
  | 'all'
  | 'interact'

const serverTabs: ServerTab[] = [
  'overview',
  'art',
  'text',
  'checkpoints',
  'all',
  'interact',
]

const defaultDashboardKey = 'server'
const defaultTab: ServerTab = 'overview'

const serverStore = useServerStore()
const checkpointStore = useCheckpointStore()
const navStore = useNavStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const dashboardKey = computed(() => {
  return navStore.dashboardShell.dashboardKey || defaultDashboardKey
})

const activeTab = computed<ServerTab>(() => {
  const selectedTab = navStore.getDashboardTab(dashboardKey.value)

  if (serverTabs.includes(selectedTab as ServerTab)) {
    return selectedTab as ServerTab
  }

  return defaultTab
})

async function refreshManagerData() {
  await loadManagerData(true)
}

async function loadManagerData(force = false) {
  isLoadingManager.value = true
  managerError.value = null

  try {
    if (force || !serverStore.hasLoaded) {
      await serverStore.initialize({ force, fetchRemote: true })
    }

    checkpointStore.initialize()
  } catch (error) {
    managerError.value =
      error instanceof Error ? error.message : 'Failed to load server data.'
  } finally {
    isLoadingManager.value = false
  }
}

onMounted(async () => {
  await loadManagerData()
})
</script>
