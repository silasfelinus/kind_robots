<!-- /components/academy/academy-manager.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col overflow-hidden">
    <!--
      Timeline and Style Gallery render purely off academyStore's static seed
      data (hydrated synchronously in onMounted below) — they never need
      serverStore/artStore, so they must not be blocked by isLoadingManager /
      managerError, which only reflect the Remix Studio / Style Lab art-server
      fetch (see loadManagerData). Keeping these two branches first ensures a
      failed or slow art-server call never hides tabs that don't depend on it.
    -->
    <section class="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <div class="kr-scroll overscroll-contain p-3">
        <academy-timeline
          v-if="activeTab === 'timeline'"
          class="min-h-full w-full"
          @remix="goToRemix"
        />

        <academy-styles-browser
          v-else-if="activeTab === 'styles'"
          class="min-h-full w-full"
          @remix="goToRemix"
        />

        <div
          v-else-if="isLoadingManager"
          role="status"
          aria-live="polite"
          aria-busy="true"
          class="flex h-full min-h-0 flex-1 items-center justify-center kr-panel"
        >
          <div class="flex flex-col items-center gap-3 text-center">
            <span
              class="loading loading-spinner loading-lg text-primary"
              aria-hidden="true"
            />
            <p class="text-sm text-base-content/70">
              Dusting off the timeline, warming up the remix engine, and
              politely waking thirty-three centuries of dead masters...
            </p>
          </div>
        </div>

        <div
          v-else-if="managerError"
          role="alert"
          class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-error/40 bg-error/10 p-4 text-error"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <span>{{ managerError }}</span>
            <button
              type="button"
              class="btn btn-error btn-sm rounded-2xl"
              @click="loadManagerData(true)"
            >
              Retry
            </button>
          </div>
        </div>

        <academy-remix
          v-else-if="activeTab === 'remix'"
          class="min-h-full w-full"
        />

        <div
          v-else-if="activeTab === 'stylelab'"
          class="grid min-h-full gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]"
        >
          <art-styler class="min-h-0" :show-close="false" />

          <image-upload class="min-h-0" :show-model-connect="false" />
        </div>

        <div
          v-else
          class="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
        >
          Unknown academy tab: {{ activeTab }}
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useAcademyStore } from '@/stores/academyStore'
import { useArtStore } from '@/stores/artStore'
import { useNavStore } from '@/stores/navStore'
import { useServerStore } from '@/stores/serverStore'
import { useUploadStore } from '@/stores/uploadStore'

type AcademyTab = 'timeline' | 'styles' | 'remix' | 'stylelab'

const academyStore = useAcademyStore()
const artStore = useArtStore()
const navStore = useNavStore()
const serverStore = useServerStore()
const uploadStore = useUploadStore()

const defaultDashboardKey = 'academy'
const defaultTab: AcademyTab = 'timeline'

const validTabs: AcademyTab[] = ['timeline', 'styles', 'remix', 'stylelab']

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)
const hasConfiguredUploadTarget = ref(false)

const dashboardKey = computed(() => {
  return navStore.dashboardShell.dashboardKey || defaultDashboardKey
})

const activeTab = computed<AcademyTab>(() => {
  const selectedTab = navStore.getDashboardTab(dashboardKey.value)

  if (!validTabs.includes(selectedTab as AcademyTab)) {
    return defaultTab
  }

  return selectedTab as AcademyTab
})

function goToRemix(styleSlug: string) {
  academyStore.selectStyle(styleSlug)
  navStore.setDashboardTab(dashboardKey.value, 'remix', 'academy remix CTA')
}

function configureStyleLabUploadTarget() {
  uploadStore.setTarget({
    model: 'ArtImage',
    modelId: null,
    galleryName: 'artImageUploads',
    collectionLabel: 'image uploads',
    promptString: '[UploadedArtImage]',
    path: '[UploadedArtImage]',
    buttonLabel: 'Upload image',
    icon: 'kind-icon:image',
    showPreview: true,
  })
  hasConfiguredUploadTarget.value = true
}

function tabNeedsManagerData(tab: AcademyTab) {
  return tab === 'remix' || tab === 'stylelab'
}

watch(
  activeTab,
  (tab) => {
    if (tab === 'stylelab') {
      configureStyleLabUploadTarget()
    } else if (hasConfiguredUploadTarget.value) {
      // Style Lab's ArtImage upload target is only meaningful while that tab
      // is showing. Without this, switching to Timeline/Styles/Remix leaves
      // the shared uploadStore target pointed at Style Lab's ArtImage upload,
      // so any global upload trigger elsewhere on the page would keep
      // offering "Upload image" for a tab the user already left.
      uploadStore.clearTarget()
      hasConfiguredUploadTarget.value = false
    }

    if (tabNeedsManagerData(tab)) {
      void loadManagerData()
    }
  },
  { immediate: true },
)

async function loadManagerData(force = false) {
  if (isLoadingManager.value) return

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
    ])
  } catch (error) {
    managerError.value =
      error instanceof Error ? error.message : 'Failed to load the Academy.'
  } finally {
    isLoadingManager.value = false
  }
}

onMounted(() => {
  academyStore.hydrate()
})

onUnmounted(() => {
  if (hasConfiguredUploadTarget.value) {
    uploadStore.clearTarget()
  }
})
</script>
