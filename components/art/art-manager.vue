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
      <section
        v-if="currentTab === 'generate'"
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

          <checkpoint-gallery
            variant="dropdown"
            :show-header="false"
            :show-controls="false"
            :show-status="false"
            :auto-load="false"
          />

          <art-gallery
            variant="dropdown"
            :show-header="false"
            :show-controls="false"
            :compact="true"
          />
        </div>

        <div class="min-h-0 xl:col-span-7">
          <add-art />
        </div>
      </section>

      <art-gallery
        v-else-if="currentTab === 'gallery'"
        variant="dashboard"
        :show-header="false"
        :show-selected-panel="true"
      />

      <collection-gallery
        v-else-if="currentTab === 'collections'"
        variant="dashboard"
        :show-header="false"
      />

      <checkpoint-gallery
        v-else-if="currentTab === 'checkpoints'"
        variant="dashboard"
        :show-header="false"
      />

      <art-doctor v-else-if="currentTab === 'doctor'" />

      <section
        v-else-if="currentTab === 'servers'"
        class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12"
      >
        <div class="min-h-0 xl:col-span-7">
          <server-gallery
            mode="art"
            variant="dashboard"
            :show-header="false"
            :show-controls="true"
            :show-card-actions="true"
            :show-descriptions="true"
            :show-meta="true"
            :show-capabilities="true"
            :show-use-buttons="true"
            :show-workflow="true"
            :show-defaults="true"
            :show-status="true"
          />
        </div>

        <div class="min-h-0 xl:col-span-5">
          <div
            class="h-full rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <server-interact />
          </div>
        </div>
      </section>

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
    'no art server'
  )
})

const selectedCheckpointLabel = computed(() => {
  return (
    checkpointStore.selectedCheckpoint?.customLabel ||
    checkpointStore.selectedCheckpoint?.name ||
    'no checkpoint'
  )
})

const selectedCollectionLabel = computed(() => {
  const selected =
    collectionStore.selectedCollections?.[0] ||
    collectionStore.collections.find((collection) => {
      return collection.id === collectionStore.selectedCollectionIds?.[0]
    })

  return selected?.label || 'no collection'
})

const selectedArtLabel = computed(() => {
  return artStore.currentArt ? `Art #${artStore.currentArt.id}` : 'no art'
})

const managerSummary = computed(() => {
  const artCount = artStore.art.length
  const collectionCount = collectionStore.collections.length

  return `${artCount} art records and ${collectionCount} collections loaded. Current setup: ${activeArtServerLabel.value}, ${selectedCheckpointLabel.value}, ${selectedCollectionLabel.value}. Selected: ${selectedArtLabel.value}.`
})

function setTab(tab: string) {
  navStore.setDashboardTab(dashboardKey, tab)

  if (tab === 'generate' || tab === 'checkpoints' || tab === 'servers') {
    serverStore.setCurrentServerMode('art')
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
      artStore.initialize({
        force,
        fetchRemote: true,
        hydrateImages: false,
      }),
      collectionStore.fetchCollections?.(),
    ])

    checkpointStore.initialize()

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
  setTab(activeTab.value)
})
</script>
