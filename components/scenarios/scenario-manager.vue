<!-- /components/content/weird/scenario-manager.vue -->
<template>
  <dashboard-shell
    title="Choose Your Own Weird Adventure"
    :summary="managerSummary"
    :tabs="tabs"
    :active-tab="activeTab"
    :loading="isLoadingManager"
    :error="managerError"
    loading-message="Loading weirdness from the database..."
    nav-grid-class="xl:grid-cols-8"
    @set-tab="setTab"
    @refresh="refreshManagerData"
  >
    <template #default="{ activeTab: currentTab }">
      <section v-if="currentTab === 'overview'" class="flex flex-col gap-4">
        <div class="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <scenario-gallery
              variant="row"
              title="Scenarios"
              subtitle="Pick the playground."
              :show-controls="false"
              :show-toolbar="false"
              :show-images="true"
              :show-inspirations="false"
              :compact="true"
            />
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <character-gallery
              variant="row"
              title="Characters"
              subtitle="Choose the cast."
              :show-controls="false"
              :show-toolbar="false"
              :show-images="true"
              :compact="true"
            />
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <reward-gallery
              variant="row"
              title="Rewards"
              subtitle="Pick the plot grenade."
              :show-controls="false"
              :show-toolbar="false"
              :show-images="true"
              :compact="true"
            />
          </div>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <scenario-interact />
        </div>
      </section>

      <scenario-gallery
        v-else-if="currentTab === 'scenarios'"
        variant="dashboard"
        title="Scenario Gallery"
        subtitle="Select, add, clone, or edit the playground."
      />

      <character-gallery
        v-else-if="currentTab === 'characters'"
        variant="dashboard"
        title="Character Gallery"
        subtitle="Select, add, or edit the cast."
      />

      <reward-gallery
        v-else-if="currentTab === 'rewards'"
        variant="dashboard"
        title="Reward Gallery"
        subtitle="Select, add, or edit story powers and plot grenades."
      />

      <choice-gallery
        v-else-if="currentTab === 'choices'"
        variant="dashboard"
      />

      <genre-gallery v-else-if="currentTab === 'genres'" variant="dashboard" />

      <server-manager v-else-if="currentTab === 'servers'" />

      <scenario-interact v-else-if="currentTab === 'interact'" />

      <div
        v-else
        class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
      >
        Unknown scenario tab: {{ currentTab }}
      </div>
    </template>
  </dashboard-shell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useChoiceStore } from '@/stores/choiceStore'
import { useNavStore } from '@/stores/navStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useScenarioStore } from '@/stores/scenarioStore'

const dashboardKey = 'scenario' as const

const characterStore = useCharacterStore()
const choiceStore = useChoiceStore()
const navStore = useNavStore()
const rewardStore = useRewardStore()
const scenarioStore = useScenarioStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const tabs = computed(() => navStore.getDashboardTabs(dashboardKey))
const activeTab = computed(() => navStore.getDashboardTab(dashboardKey))

const managerSummary = computed(() => {
  const scenarioCount = scenarioStore.scenarios.length
  const characterCount = characterStore.characters.length
  const rewardCount = rewardStore.rewards.length

  return `${scenarioCount} scenarios, ${characterCount} characters, ${rewardCount} rewards loaded. The goblin spreadsheet is satisfied.`
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
