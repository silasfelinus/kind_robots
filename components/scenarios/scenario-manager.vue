<!-- /components/scenarios/scenario-manager.vue -->
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
      <section
        v-if="currentTab === 'overview'"
        class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12"
      >
        <div class="flex min-h-0 flex-col gap-4 xl:col-span-5">
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
        </div>

        <div class="min-h-0 xl:col-span-7">
          <scenario-interact />
        </div>
      </section>

      <scenario-gallery
        v-else-if="currentTab === 'scenarios'"
        variant="dashboard"
        :show-header="false"
      />

      <character-gallery
        v-else-if="currentTab === 'characters'"
        variant="dashboard"
        :show-header="false"
      />

      <reward-gallery
        v-else-if="currentTab === 'rewards'"
        variant="dashboard"
        :show-header="false"
      />

      <section
        v-else-if="currentTab === 'servers'"
        class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12"
      >
        <div class="min-h-0 xl:col-span-7">
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

        <div class="min-h-0 xl:col-span-5">
          <div
            class="h-full rounded-2xl border border-base-300 bg-base-200 p-3"
          >
            <server-interact />
          </div>
        </div>
      </section>

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
import { useServerStore } from '@/stores/serverStore'

const dashboardKey = 'scenario' as const

const characterStore = useCharacterStore()
const choiceStore = useChoiceStore()
const navStore = useNavStore()
const rewardStore = useRewardStore()
const scenarioStore = useScenarioStore()
const serverStore = useServerStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const tabs = computed(() => navStore.getDashboardTabs(dashboardKey))
const activeTab = computed(() => navStore.getDashboardTab(dashboardKey))

const managerSummary = computed(() => {
  const scenarioCount = scenarioStore.scenarios.length
  const characterCount = characterStore.characters.length
  const rewardCount = rewardStore.rewards.length
  const textCount = serverStore.textServers.length

  const scenarioName = scenarioStore.selectedScenario?.title || 'no scenario'

  const characterName =
    characterStore.selectedCharacter?.name ||
    characterStore.selectedCharacter?.honorific ||
    'no character'

  const rewardName =
    rewardStore.selectedReward?.label ||
    rewardStore.selectedReward?.text ||
    rewardStore.selectedReward?.power ||
    'no reward'

  return `${scenarioCount} scenarios, ${characterCount} characters, ${rewardCount} rewards, and ${textCount} text servers loaded. Active setup: ${scenarioName}, ${characterName}, ${rewardName}.`
})

function setTab(tab: string) {
  navStore.setDashboardTab(dashboardKey, tab)

  if (tab === 'overview' || tab === 'interact' || tab === 'servers') {
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
      serverStore.initialize({
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
  setTab(activeTab.value)
})
</script>
