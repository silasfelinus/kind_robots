<!-- /components/dreams/dream-manager.vue -->
<template>
  <dashboard-shell
    title="Dream Atlas"
    :summary="managerSummary"
    :tabs="tabs"
    :active-tab="activeTab"
    :loading="isLoadingManager"
    :error="managerError"
    loading-message="Mapping dreamhouses, suspicious doors, and plot-adjacent furniture..."
    nav-grid-class="xl:grid-cols-7"
    @set-tab="setTab"
    @refresh="refreshManagerData"
  >
    <template #default="{ activeTab: currentTab }">
      <section
        v-if="currentTab === 'overview'"
        class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12"
      >
        <div class="flex min-h-0 flex-col gap-4 xl:col-span-4">
          <dream-gallery
            variant="dropdown"
            :show-header="false"
            :show-controls="true"
            :show-images="true"
            :show-card-actions="false"
            :show-open-button="false"
            :show-stats="true"
            :show-meta="true"
            :compact="true"
          />

          <scenario-gallery
            variant="dropdown"
            :show-header="false"
            :show-controls="false"
            :show-images="true"
            :show-card-actions="false"
            :show-inspirations="false"
            :show-choices="false"
            :show-meta="false"
            :compact="true"
          />
        </div>

        <div class="min-h-0 xl:col-span-8">
          <dream-interact />
        </div>
      </section>

      <add-dream v-else-if="currentTab === 'about'" mode="edit" />

      <dream-gallery
        v-else-if="currentTab === 'atlas'"
        variant="dashboard"
        :show-header="false"
      />

      <section
        v-else-if="currentTab === 'scene'"
        class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]"
      >
        <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <art-gallery :show-header="false" />
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <collection-gallery :show-header="false" />
        </div>
      </section>

      <section
        v-else-if="currentTab === 'cast'"
        class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12"
      >
        <div class="xl:col-span-7">
          <character-gallery
            variant="dashboard"
            :show-header="false"
          />
        </div>

        <div class="xl:col-span-5">
          <dream-list list-type="cast" />
        </div>
      </section>

      <section
        v-else-if="currentTab === 'items'"
        class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12"
      >
        <div class="xl:col-span-7">
          <reward-gallery
            variant="dashboard"
            :show-header="false"
          />
        </div>

        <div class="xl:col-span-5">
          <dream-list list-type="items" />
        </div>
      </section>

      <scenario-gallery
        v-else-if="currentTab === 'plot'"
        variant="dashboard"
        :show-header="false"
      />

      <dream-prompts v-else-if="currentTab === 'prompts'" />

      <dream-interact v-else-if="currentTab === 'chat'" />

      <div
        v-else
        class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
      >
        Unknown Dream tab: {{ currentTab }}
      </div>
    </template>
  </dashboard-shell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useDreamStore } from '@/stores/dreamStore'
import { useNavStore } from '@/stores/navStore'
import { usePromptStore } from '@/stores/promptStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useServerStore } from '@/stores/serverStore'

const dashboardKey = 'dream' as const

const dreamStore = useDreamStore()
const navStore = useNavStore()
const promptStore = usePromptStore()
const scenarioStore = useScenarioStore()
const serverStore = useServerStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const tabs = [
  { key: 'overview', label: 'Overview', icon: 'kind-icon:map' },
  { key: 'about', label: 'About', icon: 'kind-icon:scroll' },
  { key: 'atlas', label: 'Atlas', icon: 'kind-icon:door' },
  { key: 'scene', label: 'Scene', icon: 'kind-icon:image' },
  { key: 'cast', label: 'Cast', icon: 'kind-icon:users' },
  { key: 'items', label: 'Items', icon: 'kind-icon:gift' },
  { key: 'plot', label: 'Plot', icon: 'kind-icon:story' },
  { key: 'prompts', label: 'Prompts', icon: 'kind-icon:sparkles' },
  { key: 'chat', label: 'Chat', icon: 'kind-icon:chat' },
]

const activeTab = computed(() => navStore.getDashboardTab(dashboardKey))

const managerSummary = computed(() => {
  const dreamCount = dreamStore.dreams.length
  const scenarioCount = scenarioStore.scenarios.length
  const selected = dreamStore.selectedDream?.title || 'no location selected'

  return `${dreamCount} Dream locations and ${scenarioCount} Scenarios loaded. Current location: ${selected}.`
})

function setTab(tab: string) {
  navStore.setDashboardTab(dashboardKey, tab)

  if (tab === 'scene') {
    serverStore.setCurrentServerMode('art')
    return
  }

  if (tab === 'prompts' || tab === 'chat' || tab === 'overview') {
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
      dreamStore.initialize(force),
      promptStore.initialize?.(),
      scenarioStore.initialize({
        force,
        fetchRemote: true,
        includeSeeds: true,
      }),
      serverStore.initialize({
        force,
        fetchRemote: true,
      }),
    ])
  } catch (error) {
    managerError.value =
      error instanceof Error ? error.message : 'Failed to load Dream atlas.'
  } finally {
    isLoadingManager.value = false
  }
}

async function refreshManagerData() {
  await loadManagerData(true)
}

onMounted(async () => {
  await loadManagerData()

  if (!activeTab.value) {
    setTab('overview')
    return
  }

  setTab(activeTab.value)
})
</script>
