<!-- /components/scenarios/scenario-manager.vue -->
<!--
  Two tabs while we build out the rest of the suite:
    scenarios — the full phased flow (browse → configure → story),
                owned by scenario-interact + storyStore.phase
    add       — the "+" tab, straight into add-scenario
  Legacy tab keys (overview, interact, characters, rewards) funnel
  into 'scenarios' so stale navStore state never strands the user.
-->
<template>
  <section class="flex h-full min-h-0 w-full flex-col overflow-hidden">
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

    <!-- Scenarios: gallery → select → configure → story, all in place -->
    <section
      v-if="activeTab === 'scenarios'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <scenario-interact class="h-full min-h-0 flex-1 overflow-hidden" />
    </section>

    <!-- Add: the "+" tab -->
    <section
      v-else
      class="flex h-full min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain"
    >
      <add-scenario mode="add" @saved="handleScenarioSaved" />
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useChoiceStore } from '@/stores/choiceStore'
import { useNavStore } from '@/stores/navStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useServerStore } from '@/stores/serverStore'

type ScenarioTab = 'scenarios' | 'add'

const defaultDashboardKey = 'scenario'
const defaultTab: ScenarioTab = 'scenarios'

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

  return selectedTab === 'add' ? 'add' : defaultTab
})

/** Blank form for a fresh scenario. */
function blankScenarioForm() {
  return {
    title: '',
    description: '',
    locations: '',
    genres: '',
    inspirations: '',
    intros: [],
    artPrompt: '',
    imagePath: null,
    artImageId: null,
    isPublic: true,
    isMature: false,
  }
}

/**
 * Entering the "+" tab should mean a fresh scenario — but never clobber an
 * unsaved draft. Only reset when the form holds an already-saved scenario.
 */
function prepareAddForm() {
  const formId = scenarioStore.scenarioForm?.id

  if (typeof formId === 'number' && formId > 0) {
    scenarioStore.deselectScenario()
    scenarioStore.scenarioForm = blankScenarioForm()
  } else if (!scenarioStore.scenarioForm) {
    scenarioStore.scenarioForm = blankScenarioForm()
  }
}

/**
 * createScenario already selects the new scenario in the store, so jumping
 * to the scenarios tab lands directly in the configure phase for it.
 */
function handleScenarioSaved() {
  navStore.setDashboardTab(dashboardKey.value, 'scenarios')
}

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

  if (activeTab.value === 'add') {
    prepareAddForm()
  }
})

// Needed: entering the "+" tab is a navigation event that must prep
// the form exactly once per entry, without clobbering unsaved drafts.
watch(activeTab, (tab) => {
  if (tab === 'add') {
    prepareAddForm()
  }
})
</script>
