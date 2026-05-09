<!-- /components/art/art-manager.vue -->
<template>
  <dashboard-shell
    title="Art Workshop"
    :summary="managerSummary"
    :tabs="tabs"
    :active-tab="activeTab"
    :loading="isLoadingManager"
    :error="managerError"
    loading-message="Loading art, collections, checkpoints, and pixel goblin infrastructure..."
    nav-grid-class="xl:grid-cols-6"
    @set-tab="setTab"
    @refresh="refreshManagerData"
  >
    <template #default="{ activeTab: currentTab }">
      <add-art v-if="currentTab === 'generate'" />

      <art-gallery
        v-else-if="currentTab === 'gallery'"
        variant="dashboard"
        title="Art Gallery"
        subtitle="Browse, select, upload, collect, and inspect generated art."
        :show-selected-panel="true"
      />

      <collection-gallery
        v-else-if="currentTab === 'collections'"
        variant="dashboard"
        title="Collections"
        subtitle="Organize art into reusable sets."
      />

      <checkpoint-gallery
        v-else-if="currentTab === 'checkpoints'"
        variant="dashboard"
        title="Checkpoints"
        subtitle="Choose models, samplers, and verify the active backend model."
      />

      <server-gallery
        v-else-if="currentTab === 'servers'"
        variant="dashboard"
        mode="art"
        title="Art Servers"
        subtitle="Select the backend or browser-accessible image engine."
      />

      <art-interact v-else-if="currentTab === 'selected'" />

      <div
        v-else
        class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
      >
        Unknown art tab: {{ currentTab }}
      </div>
    </template>
  </dashboard-shell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useNavStore } from '@/stores/navStore'
import { useServerStore } from '@/stores/serverStore'

const dashboardKey = 'art' as const

const artStore = useArtStore()
const checkpointStore = useCheckpointStore()
const collectionStore = useCollectionStore()
const navStore = useNavStore()
const serverStore = useServerStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const tabs = computed(() => navStore.getDashboardTabs(dashboardKey))
const activeTab = computed(() => navStore.getDashboardTab(dashboardKey))

const activeArtServerLabel = computed(() => {
  return (
    serverStore.activeArtServer?.label ||
    serverStore.activeArtServer?.title ||
    'No art server selected'
  )
})

const selectedCheckpointLabel = computed(() => {
  return (
    checkpointStore.selectedCheckpoint?.customLabel ||
    checkpointStore.selectedCheckpoint?.name ||
    'No checkpoint selected'
  )
})

const managerSummary = computed(() => {
  const artCount = artStore.art.length
  const collectionCount = collectionStore.collections.length
  const selectedArt = artStore.currentArt
    ? `Art #${artStore.currentArt.id}`
    : 'no art selected'

  return `${artCount} art records, ${collectionCount} collections. Current model: ${selectedCheckpointLabel.value}. Server: ${activeArtServerLabel.value}. Selected: ${selectedArt}.`
})

function setTab(tab: string) {
  navStore.setDashboardTab(dashboardKey, tab)
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
      artStore.initialize({
        force,
        fetchRemote: true,
        hydrateImages: false,
      }),
      checkpointStore.initialize(),
      collectionStore.fetchCollections?.(),
    ])

    if (!checkpointStore.selectedSampler) {
      checkpointStore.selectSamplerByName('Euler a')
    }
  } catch (error) {
    managerError.value =
      error instanceof Error ? error.message : 'Failed to load art manager.'
  } finally {
    isLoadingManager.value = false
  }
}

async function refreshManagerData() {
  await loadManagerData(true)
}

onMounted(async () => {
  await loadManagerData()
})
</script>
