<!-- /components/server/server-manager.vue -->
<template>
  <dashboard-shell
    title="Server Manager"
    :summary="managerSummary"
    :tabs="tabs"
    :active-tab="activeTab"
    :loading="isLoadingManager"
    :error="managerError"
    loading-message="Loading servers..."
    nav-grid-class="xl:grid-cols-6"
    @set-tab="setTab"
    @refresh="refreshManagerData"
  >
    <template #default="{ activeTab: currentTab }">
      <section
        v-if="currentTab === 'overview'"
        class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12"
      >
        <div class="flex min-h-0 flex-col gap-4 xl:col-span-5">
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
            variant="dropdown"
            :show-header="false"
            :show-controls="false"
            :show-status="false"
          />
        </div>

        <div class="min-h-0 xl:col-span-7">
          <server-interact />
        </div>
      </section>

      <server-gallery
        v-else-if="currentTab === 'art'"
        mode="art"
        variant="dashboard"
        :show-header="false"
      />

      <server-gallery
        v-else-if="currentTab === 'text'"
        mode="text"
        variant="dashboard"
        :show-header="false"
      />

      <checkpoint-gallery
        v-else-if="currentTab === 'checkpoints'"
        variant="dashboard"
        :show-header="false"
      />

      <server-gallery
        v-else-if="currentTab === 'all'"
        mode="all"
        variant="dashboard"
        :show-header="false"
      />

      <server-interact v-else-if="currentTab === 'interact'" />

      <div
        v-else
        class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
      >
        Unknown server tab: {{ currentTab }}
      </div>
    </template>
  </dashboard-shell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useNavStore } from '@/stores/navStore'
import { useServerStore } from '@/stores/serverStore'

const dashboardKey = 'server' as const

const navStore = useNavStore()
const serverStore = useServerStore()
const checkpointStore = useCheckpointStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const tabs = computed(() => navStore.getDashboardTabs(dashboardKey))
const activeTab = computed(() => navStore.getDashboardTab(dashboardKey))

const managerSummary = computed(() => {
  const artCount = serverStore.artServers.length
  const textCount = serverStore.textServers.length
  const checkpointCount = checkpointStore.visibleCheckpoints.length

  const artName =
    serverStore.activeArtServer?.label ||
    serverStore.activeArtServer?.title ||
    'no art server'

  const textName =
    serverStore.activeTextServer?.label ||
    serverStore.activeTextServer?.title ||
    'no text server'

  const checkpointName =
    checkpointStore.selectedCheckpoint?.customLabel ||
    checkpointStore.selectedCheckpoint?.name ||
    'no checkpoint'

  return `${artCount} art servers, ${textCount} text servers, and ${checkpointCount} checkpoints loaded. Active: ${artName}, ${textName}, ${checkpointName}.`
})

function setTab(tab: string) {
  navStore.setDashboardTab(dashboardKey, tab)

  if (tab === 'art' || tab === 'checkpoints') {
    serverStore.setCurrentServerMode('art')
    return
  }

  if (tab === 'text') {
    serverStore.setCurrentServerMode('text')
    return
  }

  serverStore.setCurrentServerMode('selected')
}

async function loadManagerData(force = false) {
  isLoadingManager.value = true
  managerError.value = null

  try {
    await Promise.all([
      navStore.initialize(),
      serverStore.initialize({
        force,
        fetchRemote: true,
      }),
    ])

    checkpointStore.initialize()
  } catch (error) {
    managerError.value =
      error instanceof Error ? error.message : 'Failed to load server data.'
  } finally {
    isLoadingManager.value = false
  }
}

async function refreshManagerData() {
  await loadManagerData(true)
}

onMounted(async () => {
  await loadManagerData()
  setTab(activeTab.value)
})
</script>
