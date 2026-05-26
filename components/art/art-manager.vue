<!-- /components/art/art-manager.vue -->
<template>
  <dashboard-shell
    dashboard-key="art"
    title="Image Workshop"
    :summary="managerSummary"
    :loading="isLoadingManager"
    :error="managerError"
    loading-message="Loading images, collections, checkpoints, and pixel goblin infrastructure..."
    nav-grid-class="xl:grid-cols-6"
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
          <art-maker />
        </div>
      </section>

      <art-gallery
        v-else-if="currentTab === 'gallery'"
        variant="dashboard"
        :show-header="false"
        :show-selected-panel="false"
      />

      <image-upload v-else-if="currentTab === 'upload'" />

      <checkpoint-gallery
        v-else-if="currentTab === 'checkpoints'"
        variant="dashboard"
        :show-header="false"
      />

      <art-styler
        v-else-if="currentTab === 'styler'"
        :art-image="artStore.currentArtImage ?? null"
      />

      <code-workbench v-else-if="currentTab === 'workbench'" />

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
        Unknown image tab: {{ currentTab }}
      </div>
    </template>
  </dashboard-shell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useServerStore } from '@/stores/serverStore'

const artStore = useArtStore()
const checkpointStore = useCheckpointStore()
const collectionStore = useCollectionStore()
const serverStore = useServerStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const activeArtServerLabel = computed(() => {
  return (
    serverStore.activeArtServer?.label ||
    serverStore.activeArtServer?.title ||
    'no image server'
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
  if (artStore.currentArtImage) return `Image #${artStore.currentArtImage.id}`
  return 'nothing selected'
})

const managerSummary = computed(() => {
  const imageCount = artStore.artImages.length
  const collectionCount = collectionStore.collections.length

  return `${imageCount} images and ${collectionCount} collections loaded. Current setup: ${activeArtServerLabel.value}, ${selectedCheckpointLabel.value}, ${selectedCollectionLabel.value}. Focus: ${selectedArtLabel.value}.`
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
