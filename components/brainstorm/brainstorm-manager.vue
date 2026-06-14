<!-- /components/content/brainstorm/brainstorm-manager.vue -->
<template>
  <section class="flex h-full min-h-0 flex-col overflow-hidden">
    <div
      v-if="isLoadingManager"
      class="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-base-300 bg-base-100 p-6"
    >
      <div class="flex flex-col items-center gap-3 text-center">
        <span class="loading loading-spinner loading-lg text-primary" />
        <p class="text-sm text-base-content/70">
          Loading pitches, prompts, art hooks, and idea goblin infrastructure...
        </p>
      </div>
    </div>

    <div
      v-else-if="managerError"
      class="rounded-2xl border border-error/40 bg-error/10 p-4 text-error"
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

    <template v-else>
      <section
        v-if="activeTab === 'overview' || activeTab === 'interact'"
        class="min-h-0 flex-1 overflow-hidden"
      >
        <brainstorm-interact :show-header="false" />
      </section>

      <section
        v-else-if="activeTab === 'prompts'"
        class="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-200 p-3"
      >
        <prompt-gallery :show-header="false" />
      </section>

      <section
        v-else-if="activeTab === 'pitches'"
        class="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-200 p-3"
      >
        <pitch-gallery :show-header="false" />
      </section>

      <section
        v-else-if="activeTab === 'brainstorm'"
        class="min-h-0 flex-1 overflow-hidden"
      >
        <brainstorm-interact :show-header="false" />
      </section>

      <div
        v-else
        class="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
      >
        Unknown brainstorm tab: {{ activeTab }}
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useArtStore } from '@/stores/artStore'
import { usePitchStore } from '@/stores/pitchStore'
import { usePromptStore } from '@/stores/promptStore'
import { useNavStore } from '@/stores/navStore'
import { useServerStore } from '@/stores/serverStore'

type BrainstormTab =
  | 'overview'
  | 'interact'
  | 'pitches'
  | 'prompts'
  | 'brainstorm'

const pitchStore = usePitchStore()
const promptStore = usePromptStore()
const artStore = useArtStore()
const navStore = useNavStore()
const serverStore = useServerStore()

const defaultDashboardKey = 'brainstorm'
const defaultTab: BrainstormTab = 'overview'

const validTabs: BrainstormTab[] = [
  'overview',
  'interact',
  'pitches',
  'prompts',
  'brainstorm',
]

const dashboardKey = computed(() => {
  return navStore.dashboardShell.dashboardKey || defaultDashboardKey
})

const activeTab = computed<BrainstormTab>(() => {
  const selectedTab = navStore.getDashboardTab(dashboardKey.value)

  if (validTabs.includes(selectedTab as BrainstormTab)) {
    return selectedTab as BrainstormTab
  }

  return defaultTab
})

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

async function loadManagerData(force = false) {
  isLoadingManager.value = true
  managerError.value = null

  try {
    await Promise.all([
      pitchStore.initialize({ force, fetchRemote: true }),
      promptStore.initialize({ force, fetchRemote: true }),
      artStore.initialize({
        force,
        hydrateImages: false,
        initializeServerStore: false,
      }),
      ...(force || !serverStore.hasLoaded
        ? [serverStore.initialize({ force, fetchRemote: true })]
        : []),
    ])
  } catch (error) {
    managerError.value =
      error instanceof Error
        ? error.message
        : 'Failed to load brainstorm manager.'
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
