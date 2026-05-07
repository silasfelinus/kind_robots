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
    nav-grid-class="xl:grid-cols-5"
    @set-tab="setTab"
    @refresh="refreshManagerData"
  >
    <template #default="{ activeTab: currentTab }">
      <server-gallery
        v-if="currentTab === 'overview'"
        title="Servers"
        subtitle="Browse, select, test, edit, activate, and inspect your available engines."
        variant="dashboard"
        mode="all"
      />

      <server-gallery
        v-else-if="currentTab === 'art'"
        mode="art"
        variant="dashboard"
        title="Art Servers"
        subtitle="Only image-capable engines."
      />

      <server-gallery
        v-else-if="currentTab === 'text'"
        mode="text"
        variant="dashboard"
        title="Text Servers"
        subtitle="Only chat-capable engines."
      />

      <server-gallery
        v-else-if="currentTab === 'all'"
        mode="all"
        variant="dashboard"
        title="All Servers"
        subtitle="Every visible server in one place."
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
import { useNavStore } from '@/stores/navStore'
import { useServerStore } from '@/stores/serverStore'

const dashboardKey = 'server' as const

const navStore = useNavStore()
const serverStore = useServerStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const tabs = computed(() => navStore.getDashboardTabs(dashboardKey))
const activeTab = computed(() => navStore.getDashboardTab(dashboardKey))

const managerSummary = computed(() => {
  const artCount = serverStore.artServers.length
  const textCount = serverStore.textServers.length
  const artName =
    serverStore.activeArtServer?.label ||
    serverStore.activeArtServer?.title ||
    'no art server'
  const textName =
    serverStore.activeTextServer?.label ||
    serverStore.activeTextServer?.title ||
    'no text server'

  return `${artCount} art servers and ${textCount} text servers loaded. Active engines: ${artName} and ${textName}.`
})

function setTab(tab: string) {
  navStore.setDashboardTab(dashboardKey, tab)

  if (tab === 'art') {
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
