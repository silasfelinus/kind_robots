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
      <section v-if="currentTab === 'overview'" class="flex flex-col gap-4">
        <art-interact />

        <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <art-gallery
            variant="row"
            title="Recent Art"
            subtitle="Fresh pixels from the machine."
            :show-controls="false"
            :show-toolbar="false"
            :show-card-actions="true"
            :show-prompts="false"
            :show-meta="false"
            :show-selected-panel="true"
            :show-footer="false"
            :compact="true"
            :display-limit="30"
          />
        </div>
      </section>

      <art-interact v-else-if="currentTab === 'generate'" />

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

      <server-gallery v-else-if="currentTab === 'servers'" />

      <section
        v-else-if="currentTab === 'selected'"
        class="rounded-2xl border border-base-300 bg-base-200 p-3"
      >
        <div
          v-if="artStore.currentArt"
          class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(280px,420px)_minmax(0,1fr)]"
        >
          <art-card
            :art="artStore.currentArt"
            :art-image="artStore.currentArtImage"
            :selected="true"
            :show-actions="true"
            :show-prompt="false"
            :show-meta="true"
            :show-generation-meta="true"
            :show-select-button="false"
          />

          <div class="rounded-2xl border border-base-300 bg-base-100 p-4">
            <h2 class="text-xl font-bold text-primary">Selected Art</h2>

            <div class="mt-4 grid gap-3">
              <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
                <p class="text-xs font-bold uppercase text-base-content/45">
                  Prompt
                </p>

                <p
                  class="mt-1 whitespace-pre-wrap text-sm text-base-content/80"
                >
                  {{ artStore.currentArt.promptString }}
                </p>
              </div>

              <div
                v-if="artStore.currentArt.negativePrompt"
                class="rounded-2xl border border-base-300 bg-base-200 p-3"
              >
                <p class="text-xs font-bold uppercase text-base-content/45">
                  Negative Prompt
                </p>

                <p
                  class="mt-1 whitespace-pre-wrap text-sm text-base-content/80"
                >
                  {{ artStore.currentArt.negativePrompt }}
                </p>
              </div>

              <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
                  <p class="text-xs font-bold uppercase text-base-content/45">
                    Checkpoint
                  </p>

                  <p class="mt-1 truncate text-sm text-base-content/80">
                    {{ artStore.currentArt.checkpoint || 'n/a' }}
                  </p>
                </div>

                <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
                  <p class="text-xs font-bold uppercase text-base-content/45">
                    Sampler
                  </p>

                  <p class="mt-1 truncate text-sm text-base-content/80">
                    {{ artStore.currentArt.sampler || 'n/a' }}
                  </p>
                </div>

                <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
                  <p class="text-xs font-bold uppercase text-base-content/45">
                    Server
                  </p>

                  <p class="mt-1 truncate text-sm text-base-content/80">
                    {{ artStore.currentArt.serverName || 'n/a' }}
                  </p>
                </div>

                <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
                  <p class="text-xs font-bold uppercase text-base-content/45">
                    Seed
                  </p>

                  <p class="mt-1 truncate text-sm text-base-content/80">
                    {{ artStore.currentArt.seed ?? 'n/a' }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else
          class="flex min-h-72 flex-col items-center justify-center rounded-2xl border border-base-300 bg-base-100 p-6 text-center text-base-content/55"
        >
          <Icon name="kind-icon:image" class="h-12 w-12 text-primary" />

          <p class="mt-2 text-lg font-bold">No art selected.</p>

          <p class="mt-1 text-sm">
            Select something from the gallery first. The pixels demand
            attention.
          </p>
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