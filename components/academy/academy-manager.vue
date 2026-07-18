<!-- /components/academy/academy-manager.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col overflow-hidden">
    <div
      v-if="isLoadingManager"
      class="flex h-full min-h-0 flex-1 items-center justify-center kr-panel"
    >
      <div class="flex flex-col items-center gap-3 text-center">
        <span class="loading loading-spinner loading-lg text-primary" />
        <p class="text-sm text-base-content/70">
          Dusting off the timeline, warming up the remix engine, and politely
          waking twenty-five centuries of dead masters...
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
          @click="loadManagerData(true)"
        >
          Retry
        </button>
      </div>
    </div>

    <section
      v-else-if="activeTab === 'timeline'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
        <academy-timeline class="min-h-full w-full" @remix="goToRemix" />
      </div>
    </section>

    <section
      v-else-if="activeTab === 'styles'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
        <academy-styles-browser class="min-h-full w-full" @remix="goToRemix" />
      </div>
    </section>

    <section
      v-else-if="activeTab === 'remix'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
        <academy-remix class="min-h-full w-full" />
      </div>
    </section>

    <section
      v-else-if="activeTab === 'stylelab'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
        <div
          class="grid min-h-full gap-3 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]"
        >
          <art-styler class="min-h-0" :show-close="false" />

          <image-upload class="min-h-0" :show-model-connect="false" />
        </div>
      </div>
    </section>

    <div
      v-else
      class="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
    >
      Unknown academy tab: {{ activeTab }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAcademyStore } from '@/stores/academyStore'
import { useArtStore } from '@/stores/artStore'
import { useNavStore } from '@/stores/navStore'
import { useServerStore } from '@/stores/serverStore'

type AcademyTab = 'timeline' | 'styles' | 'remix' | 'stylelab'

const academyStore = useAcademyStore()
const artStore = useArtStore()
const navStore = useNavStore()
const serverStore = useServerStore()

const defaultDashboardKey = 'academy'
const defaultTab: AcademyTab = 'timeline'

const validTabs: AcademyTab[] = ['timeline', 'styles', 'remix', 'stylelab']

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

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
  void loadManagerData()
})
</script>
