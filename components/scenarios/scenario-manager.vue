<!-- /components/scenarios/scenario-manager.vue -->
<template>
  <section class="flex h-full min-h-0 flex-col overflow-hidden">
    <div
      v-if="isLoadingManager || managerError"
      class="mb-4 shrink-0 rounded-2xl border border-base-300 bg-base-100 p-4"
    >
      <div v-if="isLoadingManager" class="flex items-center gap-2 text-sm">
        <span class="loading loading-spinner loading-sm text-primary" />
        <span>Loading weirdness from the database...</span>
      </div>

      <div v-if="managerError" class="mt-2 text-sm text-error">
        {{ managerError }}
      </div>

      <button
        v-if="managerError"
        type="button"
        class="btn btn-sm btn-outline mt-3 rounded-2xl"
        @click="refreshManagerData"
      >
        Try Again
      </button>
    </div>

    <section
      v-if="activeTab === 'overview'"
      class="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-12"
    >
      <div class="flex min-h-0 flex-col gap-4 overflow-y-auto xl:col-span-5">
        <scenario-gallery
          variant="dropdown"
          :show-header="false"
          :show-controls="false"
          :show-images="true"
          :show-inspirations="false"
          :show-choices="false"
          :show-card-actions="false"
          :show-meta="false"
          :compact="true"
        />

        <character-gallery
          variant="dropdown"
          :show-header="false"
          :show-controls="false"
          :show-images="true"
          :show-card-actions="false"
          :show-meta="false"
          :compact="true"
        />

        <reward-gallery
          variant="dropdown"
          :show-header="false"
          :show-controls="false"
          :show-images="true"
          :show-card-actions="false"
          :show-meta="false"
          :compact="true"
        />
      </div>

      <div class="min-h-0 overflow-y-auto xl:col-span-7">
        <scenario-interact />
      </div>
    </section>

    <scenario-gallery
      v-else-if="activeTab === 'scenarios'"
      class="min-h-0 flex-1 overflow-y-auto"
      variant="dashboard"
      :show-header="false"
    />

    <character-gallery
      v-else-if="activeTab === 'characters'"
      class="min-h-0 flex-1 overflow-y-auto"
      variant="dashboard"
      :show-header="false"
    />

    <reward-gallery
      v-else-if="activeTab === 'rewards'"
      class="min-h-0 flex-1 overflow-y-auto"
      variant="dashboard"
      :show-header="false"
    />

    <scenario-interact
      v-else-if="activeTab === 'interact'"
      class="min-h-0 flex-1 overflow-y-auto"
    />

    <div
      v-else
      class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
    >
      Unknown scenario tab: {{ activeTab }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useChoiceStore } from '@/stores/choiceStore'
import { useNavStore } from '@/stores/navStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useServerStore } from '@/stores/serverStore'

type ScenarioTab =
  | 'overview'
  | 'scenarios'
  | 'builder'
  | 'characters'
  | 'rewards'
  | 'interact'

const scenarioTabs: ScenarioTab[] = [
  'overview',
  'scenarios',
  'builder',
  'characters',
  'rewards',
  'interact',
]

const defaultDashboardKey = 'scenario'
const defaultTab: ScenarioTab = 'overview'

const characterStore = useCharacterStore()
const choiceStore = useChoiceStore()
const navStore = useNavStore()
const rewardStore = useRewardStore()
const scenarioStore = useScenarioStore()
const serverStore = useServerStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const dashboardKey = computed(() => {
  return navStore.dashboardShell.dashboardKey || defaultDashboardKey
})

const activeTab = computed<ScenarioTab>(() => {
  const selectedTab = navStore.getDashboardTab(dashboardKey.value)

  if (scenarioTabs.includes(selectedTab as ScenarioTab)) {
    return selectedTab as ScenarioTab
  }

  return defaultTab
})

async function loadManagerData(force = false) {
  isLoadingManager.value = true
  managerError.value = null

  try {
    await Promise.all([
      choiceStore.initialize(),
      characterStore.initialize({
        force,
        fetchRemote: true,
        createDefaultForm: true,
      }),
      scenarioStore.initialize({
        force,
        fetchRemote: true,
        includeSeeds: true,
      }),
      rewardStore.initialize({
        force,
        fetchRemote: true,
      }),
      ...(force || !serverStore.hasLoaded
        ? [serverStore.initialize({ force, fetchRemote: true })]
        : []),
    ])
  } catch (error) {
    managerError.value =
      error instanceof Error
        ? error.message
        : 'Failed to load scenario manager data.'
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
