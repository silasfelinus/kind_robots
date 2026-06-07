<!-- /components/art/art-manager.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col overflow-hidden">
    <div
      v-if="isLoadingManager"
      class="flex h-full min-h-0 flex-1 items-center justify-center rounded-2xl border border-base-300 bg-base-100 p-6"
    >
      <div class="flex flex-col items-center gap-3 text-center">
        <span class="loading loading-spinner loading-lg text-primary" />
        <p class="text-sm text-base-content/70">
          Loading images, collections, checkpoints, and pixel goblin
          infrastructure...
        </p>
      </div>
    </div>

    <div
      v-else-if="managerError"
      class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-error/40 bg-error/10 p-4 text-error"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <span>{{ managerError }}</span>
        <button
          type="button"
          class="btn btn-error btn-sm rounded-2xl"
          @click="refreshManagerData"
        >
          Retry
        </button>
      </div>
    </div>

    <section
      v-else-if="activeTab === 'generate'"
      class="grid h-full min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-12"
    >
      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 xl:col-span-5"
      >
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          <art-gallery
            variant="dropdown"
            :show-header="false"
            :show-controls="false"
            :compact="true"
          />
        </div>
      </section>

      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 xl:col-span-7"
      >
        <art-maker class="h-full min-h-0 flex-1 overflow-hidden" />
      </section>
    </section>

    <section
      v-else-if="activeTab === 'gallery'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <art-gallery
        class="h-full min-h-0 flex-1 overflow-hidden"
        variant="dashboard"
        :show-header="false"
        :show-selected-panel="false"
      />
    </section>

    <section
      v-else-if="activeTab === 'upload'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100"
    >
      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
        <image-upload />
      </div>
    </section>

    <section
      v-else-if="activeTab === 'checkpoints'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <checkpoint-gallery
        class="h-full min-h-0 flex-1 overflow-hidden"
        variant="dashboard"
        :show-header="false"
      />
    </section>

    <section
      v-else-if="activeTab === 'styler'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <art-styler class="h-full min-h-0 flex-1 overflow-hidden" />
    </section>

    <section
      v-else-if="activeTab === 'workbench'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <code-workbench class="h-full min-h-0 flex-1 overflow-hidden" />
    </section>

    <section
      v-else-if="activeTab === 'memory-dungeon'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <memory-dungeon
        class="h-full min-h-0 w-full flex-1 overflow-hidden"
        :show-header="false"
      />
    </section>

    <div
      v-else
      class="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
    >
      Unknown image tab: {{ activeTab }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useNavStore } from '@/stores/navStore'
import { useServerStore } from '@/stores/serverStore'

type ArtTab =
  | 'generate'
  | 'gallery'
  | 'upload'
  | 'checkpoints'
  | 'styler'
  | 'workbench'
  | 'memory-dungeon'

const artStore = useArtStore()
const checkpointStore = useCheckpointStore()
const collectionStore = useCollectionStore()
const navStore = useNavStore()
const serverStore = useServerStore()

const defaultDashboardKey = 'art'
const defaultTab: ArtTab = 'generate'

const validTabs: ArtTab[] = [
  'generate',
  'gallery',
  'upload',
  'checkpoints',
  'styler',
  'workbench',
  'memory-dungeon',
]

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const dashboardKey = computed(() => {
  return navStore.dashboardShell.dashboardKey || defaultDashboardKey
})

const activeTab = computed<ArtTab>(() => {
  const selectedTab = navStore.getDashboardTab(dashboardKey.value)

  if (validTabs.includes(selectedTab as ArtTab)) {
    return selectedTab as ArtTab
  }

  return defaultTab
})

async function loadManagerData(force = false) {
  isLoadingManager.value = true
  managerError.value = null

  try {
    await Promise.all([
      ...(force || !serverStore.hasLoaded
        ? [serverStore.initialize({ force, fetchRemote: true })]
        : []),
      artStore.initialize({
        force,
        fetchRemote: true,
        hydrateImages: false,
        initializeServerStore: false,
      }),
      collectionStore.fetchCollections?.(),
    ])

    if (!checkpointStore.selectedSampler) {
      checkpointStore.selectSamplerByName('Euler a')
    }
  } catch (error) {
    managerError.value =
      error instanceof Error ? error.message : 'Failed to load image manager.'
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
