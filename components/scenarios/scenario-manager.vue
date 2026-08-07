<!-- /components/content/scenarios/scenario-manager.vue -->
<template>
  <kr-manager
    dashboard-key="scenario"
    :loading="isLoadingManager"
    :error="managerError"
    loading-label="Loading weirdness from the database..."
    :panel-tabs="['add']"
    @refresh="refreshManagerData"
    @tab="handleTabChange"
  >
    <!-- Scenarios: gallery → select → configure → story, all in place -->
    <template #scenarios>
      <scenario-interact class="h-full min-h-0 flex-1 overflow-hidden" />
    </template>

    <!-- Add: the "+" tab -->
    <template #add>
      <add-scenario mode="add" @saved="handleScenarioSaved" />
    </template>
  </kr-manager>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from '#app'
import { useCharacterStore } from '@/stores/characterStore'
import { useChoiceStore } from '@/stores/choiceStore'
import { useNavStore } from '@/stores/navStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useServerStore } from '@/stores/serverStore'

const dashboardKey = 'scenario'

const characterStore = useCharacterStore()
const choiceStore = useChoiceStore()
const navStore = useNavStore()
const rewardStore = useRewardStore()
const route = useRoute()
const router = useRouter()
const scenarioStore = useScenarioStore()
const serverStore = useServerStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

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

/*
 * Entering the "+" tab is a navigation event that must prep the form exactly
 * once per entry. kr-manager owns tab resolution now and emits the rendered
 * tab, so this reacts to that rather than re-deriving it from navStore.
 */
function handleTabChange(tab: string) {
  if (tab === 'add') {
    prepareAddForm()
  }
}

/**
 * createScenario already selects the new scenario in the store, so jumping
 * to the scenarios tab lands directly in the configure phase for it.
 */
function handleScenarioSaved() {
  navStore.setDashboardTab(dashboardKey, 'scenarios')
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

  // Deep-link support: a caller (e.g. the storybook front page's "Start a
  // new scenario" CTA) can land here with ?scenario=new to jump straight to
  // the add tab. This must run *after* loadManagerData, since the page's
  // own content frontmatter (dashboardTab: scenarios) already resolved the
  // tab to 'scenarios' before this component mounted -- setting it here is
  // what actually overrides that default. kr-manager's `tab` emit then fires
  // and preps the form.
  if (route.query.scenario === 'new') {
    navStore.setDashboardTab(dashboardKey, 'add')
    const { scenario: _drop, ...restQuery } = route.query
    router.replace({ query: restQuery })
  }
})
</script>
