<!-- /components/dreams/dream-manager.vue -->
<template>
  <dashboard-shell
    title="Dream Manager"
    :summary="managerSummary"
    :tabs="tabs"
    :active-tab="activeTab"
    :loading="isLoadingManager"
    :error="managerError"
    loading-message="Loading dreams, servers, prompts, and moonlit nonsense..."
    nav-grid-class="xl:grid-cols-8"
    @set-tab="setTab"
    @refresh="refreshManagerData"
  >
    <template #default="{ activeTab: currentTab }">
      <section
        v-if="currentTab === 'overview'"
        class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12"
      >
        <div class="flex min-h-0 flex-col gap-4 xl:col-span-5">
          <dream-gallery
            variant="dropdown"
            :show-header="false"
            :show-controls="false"
            :show-images="true"
            :show-card-actions="false"
            :show-open-button="false"
            :show-stats="false"
            :show-meta="true"
            :compact="true"
          />

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
          />

          <server-gallery
            mode="text"
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

        <div class="min-h-0 xl:col-span-7">
          <dream-interact />
        </div>
      </section>

      <dream-gallery
        v-else-if="currentTab === 'dreams'"
        variant="dashboard"
        :show-header="false"
      />

      <dream-prompts v-else-if="currentTab === 'prompts'" />

      <section
        v-else-if="currentTab === 'art'"
        class="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]"
      >
        <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <art-gallery :show-header="false" />
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <collection-gallery :show-header="false" />
        </div>
      </section>

      <collection-gallery
        v-else-if="currentTab === 'collections'"
        :show-header="false"
      />

      <scenario-gallery
        v-else-if="currentTab === 'scenarios'"
        variant="dashboard"
        :show-header="false"
      />

      <section
        v-else-if="currentTab === 'servers'"
        class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12"
      >
        <div class="min-h-0 xl:col-span-6">
          <server-gallery
            mode="text"
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

        <div class="min-h-0 xl:col-span-6">
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

        <div class="min-h-0 xl:col-span-12">
          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <server-interact />
          </div>
        </div>
      </section>

      <dream-interact v-else-if="currentTab === 'interact'" />

      <div
        v-else
        class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
      >
        Unknown dream tab: {{ currentTab }}
      </div>
    </template>
  </dashboard-shell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCheckpointStore } from '@/stores/checkpointStore'
import { useDreamStore } from '@/stores/dreamStore'
import { useNavStore } from '@/stores/navStore'
import { usePromptStore } from '@/stores/promptStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useServerStore } from '@/stores/serverStore'

const dashboardKey = 'dream' as const

const checkpointStore = useCheckpointStore()
const dreamStore = useDreamStore()
const navStore = useNavStore()
const promptStore = usePromptStore()
const scenarioStore = useScenarioStore()
const serverStore = useServerStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const tabs = computed(() => navStore.getDashboardTabs(dashboardKey))
const activeTab = computed(() => navStore.getDashboardTab(dashboardKey))

const selectedDreamName = computed(() => {
  return dreamStore.selectedDream?.title || 'no dream'
})

const selectedScenarioName = computed(() => {
  return scenarioStore.selectedScenario?.title || 'no scenario'
})

const selectedCheckpointName = computed(() => {
  return (
    checkpointStore.selectedCheckpoint?.customLabel ||
    checkpointStore.selectedCheckpoint?.name ||
    'no checkpoint'
  )
})

const artServerName = computed(() => {
  return (
    serverStore.activeArtServer?.label ||
    serverStore.activeArtServer?.title ||
    'no art server'
  )
})

const textServerName = computed(() => {
  return (
    serverStore.activeTextServer?.label ||
    serverStore.activeTextServer?.title ||
    'no text server'
  )
})

const managerSummary = computed(() => {
  const dreamCount = dreamStore.dreams.length
  const scenarioCount = scenarioStore.scenarios.length

  return `${dreamCount} dreams and ${scenarioCount} scenarios loaded. Current setup: ${selectedDreamName.value}, ${artServerName.value}, ${selectedCheckpointName.value}, ${textServerName.value}, ${selectedScenarioName.value}.`
})

function setTab(tab: string) {
  navStore.setDashboardTab(dashboardKey, tab)

  if (tab === 'art') {
    serverStore.setCurrentServerMode('art')
    return
  }

  if (tab === 'prompts' || tab === 'interact' || tab === 'overview') {
    serverStore.setCurrentServerMode('text')
    return
  }

  if (tab === 'servers') {
    serverStore.setCurrentServerMode('selected')
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

    checkpointStore.initialize()
  } catch (error) {
    managerError.value =
      error instanceof Error ? error.message : 'Failed to load dream manager.'
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
