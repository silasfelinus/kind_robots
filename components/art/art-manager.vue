<!-- /components/art/art-manager.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col overflow-hidden">
    <div
      v-if="isLoadingManager"
      class="flex h-full min-h-0 flex-1 items-center justify-center kr-panel"
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
      v-else
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
      @click.capture="activeTab === 'artjob' ? handleArtJobImageClick($event) : undefined"
    >
      <div
        :class="
          activeTab === 'artjob'
            ? 'flex h-full min-h-0 flex-col overflow-hidden p-0'
            : 'kr-scroll p-3'
        "
      >
        <art-maker
          v-if="activeTab === 'generate'"
          class="min-h-full w-full"
        />

        <checkpoint-gallery
          v-else-if="activeTab === 'checkpoints'"
          class="min-h-full w-full"
          variant="dashboard"
          :show-header="false"
        />

        <div
          v-else-if="activeTab === 'styler'"
          class="grid min-h-full gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]"
        >
          <art-styler class="min-h-0" />
          <image-upload class="min-h-0" :show-model-connect="false" />
        </div>

        <stylist-manager
          v-else-if="activeTab === 'stylist'"
          class="min-h-full w-full"
        />

        <art-test
          v-else-if="activeTab === 'art-test'"
          class="min-h-full w-full"
          :show-header="false"
        />

        <coloring-book-manager
          v-else-if="activeTab === 'coloring'"
          class="min-h-full w-full"
        />

        <template v-else-if="activeTab === 'artjob'">
          <div
            class="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-base-300 bg-base-100 px-3 py-2"
          >
            <div
              role="tablist"
              aria-label="ArtJob workspace"
              class="tabs tabs-box tabs-sm bg-base-200"
            >
              <button
                type="button"
                role="tab"
                class="tab h-auto min-h-9 gap-2 rounded-xl px-4"
                :class="{ 'tab-active': artJobWorkspaceTab === 'queue' }"
                :aria-selected="artJobWorkspaceTab === 'queue'"
                @click="selectArtJobWorkspace('queue')"
              >
                Queue
                <span
                  v-if="artJobWorkspaceTab === 'queue'"
                  class="badge badge-success badge-outline badge-xs rounded-2xl"
                >
                  Live · 15s
                </span>
              </button>
              <button
                type="button"
                role="tab"
                class="tab h-auto min-h-9 gap-2 rounded-xl px-4"
                :class="{ 'tab-active': artJobWorkspaceTab === 'trainer' }"
                :aria-selected="artJobWorkspaceTab === 'trainer'"
                @click="selectArtJobWorkspace('trainer')"
              >
                Art trainer
                <span
                  v-if="pendingTrainerCount"
                  class="badge badge-primary badge-sm rounded-2xl"
                >
                  {{ pendingTrainerCount }}
                </span>
              </button>
            </div>

            <p class="hidden text-xs text-base-content/50 lg:block">
              {{
                artJobWorkspaceTab === 'queue'
                  ? 'Jobs refresh every 15s; health summaries refresh every minute'
                  : 'Review finished renders and leave training feedback'
              }}
            </p>
          </div>

          <div
            v-show="artJobWorkspaceTab === 'queue'"
            class="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3"
          >
            <artjob-failed-page-requeue class="shrink-0" />
            <artjob-queue-browser
              class="min-h-0 flex-1 overflow-hidden"
            />
          </div>

          <div
            v-show="artJobWorkspaceTab === 'trainer'"
            class="min-h-0 flex-1 overflow-hidden p-3"
          >
            <artjob-feedback-manager
              class="h-full min-h-0 overflow-hidden"
            />
          </div>
        </template>

        <div
          v-else
          class="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
        >
          Unknown image tab: {{ activeTab }}
        </div>
      </div>
    </section>

    <dialog
      ref="artPreviewDialog"
      class="modal"
      @click.self="closeArtPreview"
      @close="clearArtPreview"
    >
      <div
        class="modal-box flex h-[92vh] w-[96vw] max-w-7xl flex-col rounded-2xl border border-base-300 bg-base-100 p-3"
      >
        <div class="flex items-center justify-between gap-3 px-1 pb-3">
          <div class="min-w-0">
            <h3 class="truncate text-sm font-semibold">
              {{ artPreviewTitle }}
            </h3>
            <p class="text-[11px] text-base-content/50">
              Finished ArtJob preview
            </p>
          </div>
          <button
            type="button"
            class="btn btn-circle btn-ghost btn-sm"
            aria-label="Close art preview"
            @click="closeArtPreview"
          >
            ✕
          </button>
        </div>

        <div
          class="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-2xl bg-base-200/60 p-2"
        >
          <img
            v-if="artPreviewSrc"
            :src="artPreviewSrc"
            class="max-h-full max-w-full rounded-2xl object-contain"
            :alt="artPreviewTitle"
          />
        </div>
      </div>
    </dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useArtJobStore } from '@/stores/artJobStore'
import { useArtStore } from '@/stores/artStore'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useCollectionStore } from '@/stores/collectionStore'
import { useNavStore } from '@/stores/navStore'
import { useServerStore } from '@/stores/serverStore'
import { useUserStore } from '@/stores/userStore'

type ArtTab =
  | 'generate'
  | 'gallery'
  | 'checkpoints'
  | 'styler'
  | 'stylist'
  | 'coloring'
  | 'art-test'
  | 'artjob'

type LegacyArtTab = ArtTab | 'upload'
type ArtJobWorkspaceTab = 'queue' | 'trainer'

const ART_JOB_REFRESH_INTERVAL_MS = 15_000
const ART_JOB_STATS_REFRESH_INTERVAL_MS = 60_000

const artJobStore = useArtJobStore()
const artStore = useArtStore()
const checkpointStore = useCheckpointStore()
const collectionStore = useCollectionStore()
const navStore = useNavStore()
const serverStore = useServerStore()
const userStore = useUserStore()

const defaultDashboardKey = 'art'
const defaultTab: ArtTab = 'generate'

const validTabs: LegacyArtTab[] = [
  'generate',
  'gallery',
  'checkpoints',
  'styler',
  'stylist',
  'coloring',
  'art-test',
  'artjob',
]

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)
const artJobWorkspaceTab = ref<ArtJobWorkspaceTab>('queue')
const artPreviewDialog = ref<HTMLDialogElement | null>(null)
const artPreviewSrc = ref('')
const artPreviewTitle = ref('Generated art')
let artJobRefreshTimer: ReturnType<typeof setInterval> | null = null
let artJobStatsRefreshTimer: ReturnType<typeof setInterval> | null = null

const dashboardKey = computed(() => {
  return navStore.dashboardShell.dashboardKey || defaultDashboardKey
})

const activeTab = computed<ArtTab>(() => {
  const selectedTab = navStore.getDashboardTab(dashboardKey.value)

  if (!validTabs.includes(selectedTab as LegacyArtTab)) {
    return defaultTab
  }

  if (selectedTab === 'upload') {
    return 'styler'
  }

  return selectedTab as ArtTab
})

const shouldLiveRefreshArtJobs = computed(() => {
  return (
    userStore.isAdmin &&
    activeTab.value === 'artjob' &&
    artJobWorkspaceTab.value === 'queue'
  )
})

const pendingTrainerCount = computed(() => {
  return artJobStore.trainerJobs.filter((job) => {
    return !job.payload?.curation?.human
  }).length
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

async function selectArtJobWorkspace(tab: ArtJobWorkspaceTab): Promise<void> {
  artJobWorkspaceTab.value = tab
  if (
    tab === 'trainer' &&
    !artJobStore.trainerJobs.length &&
    !artJobStore.loadingTrainerJobs
  ) {
    await artJobStore.fetchTrainerJobs()
  }
}

function stopArtJobLiveRefresh(): void {
  if (artJobRefreshTimer) {
    clearInterval(artJobRefreshTimer)
    artJobRefreshTimer = null
  }
  if (artJobStatsRefreshTimer) {
    clearInterval(artJobStatsRefreshTimer)
    artJobStatsRefreshTimer = null
  }
}

async function refreshArtJobRows(): Promise<void> {
  if (!import.meta.client || !shouldLiveRefreshArtJobs.value) return
  if (document.visibilityState !== 'visible') return
  if (artJobStore.loadingJobs) return

  await artJobStore.fetchJobs()
}

async function refreshArtJobStats(): Promise<void> {
  if (!import.meta.client || !shouldLiveRefreshArtJobs.value) return
  if (document.visibilityState !== 'visible') return
  if (artJobStore.loadingStats) return

  await artJobStore.fetchStats()
}

function syncArtJobLiveRefresh(): void {
  stopArtJobLiveRefresh()
  if (!import.meta.client || !shouldLiveRefreshArtJobs.value) return

  artJobRefreshTimer = setInterval(() => {
    void refreshArtJobRows()
  }, ART_JOB_REFRESH_INTERVAL_MS)
  artJobStatsRefreshTimer = setInterval(() => {
    void refreshArtJobStats()
  }, ART_JOB_STATS_REFRESH_INTERVAL_MS)
}

function handleVisibilityChange(): void {
  if (document.visibilityState === 'visible') {
    void refreshArtJobRows()
    void refreshArtJobStats()
  }
}

function handleArtJobImageClick(event: MouseEvent): void {
  const target = event.target
  if (!(target instanceof Element)) return

  const anchor = target.closest('a[href^="data:image/"]')
  if (!(anchor instanceof HTMLAnchorElement)) return

  const src = anchor.getAttribute('href') || ''
  if (!src) return

  event.preventDefault()
  event.stopPropagation()

  artPreviewSrc.value = src
  artPreviewTitle.value = anchor.title || 'Generated art'
  artPreviewDialog.value?.showModal()
}

function closeArtPreview(): void {
  artPreviewDialog.value?.close()
}

function clearArtPreview(): void {
  artPreviewSrc.value = ''
  artPreviewTitle.value = 'Generated art'
}

watch(shouldLiveRefreshArtJobs, syncArtJobLiveRefresh, { immediate: true })

onMounted(async () => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
  await loadManagerData()
})

onBeforeUnmount(() => {
  stopArtJobLiveRefresh()
  if (import.meta.client) {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
})
</script>
