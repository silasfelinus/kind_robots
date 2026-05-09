<!-- /components/characters/character-manager.vue -->
<template>
  <dashboard-shell
    title="Character Workshop"
    :summary="managerSummary"
    :tabs="tabs"
    :active-tab="activeTab"
    :loading="isLoadingManager"
    :error="managerError"
    loading-message="Loading characters, rewards, scenarios, and narrative goblin permits..."
    nav-grid-class="xl:grid-cols-6"
    @set-tab="setTab"
    @refresh="refreshManagerData"
  >
    <template #default="{ activeTab: currentTab }">
      <section
        v-if="currentTab === 'overview'"
        class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12"
      >
        <div class="flex min-h-0 flex-col gap-4 xl:col-span-5">
          <character-gallery
            variant="dropdown"
            title="Character"
            subtitle="Choose the cast member."
            :show-controls="false"
            :show-images="true"
            :show-card-actions="false"
            :show-mode-buttons="false"
            :show-meta="true"
            :compact="true"
          />

          <scenario-gallery
            variant="dropdown"
            title="Scenario"
            subtitle="Optionally choose the trouble."
            :show-controls="false"
            :show-images="true"
            :show-card-actions="false"
            :show-inspirations="false"
            :show-choices="false"
            :show-meta="false"
            :compact="true"
          />

          <reward-gallery
            variant="dropdown"
            title="Reward"
            subtitle="Optionally choose the plot grenade."
            :show-controls="false"
            :show-images="true"
            :show-card-actions="false"
            :show-meta="false"
            :compact="true"
          />

          <dream-gallery
            variant="dropdown"
            title="Dream"
            subtitle="Optionally choose a collaborative dream."
            :show-controls="false"
            :show-images="true"
            :show-card-actions="false"
            :show-open-button="false"
            :show-stats="false"
            :show-meta="false"
            :compact="true"
          />

          <server-gallery
            mode="text"
            variant="dropdown"
            title="Text Server"
            subtitle="Choose the chat engine."
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
          <character-interact />
        </div>
      </section>

      <character-gallery
        v-else-if="currentTab === 'characters'"
        variant="dashboard"
        title="Character Gallery"
        subtitle="Select, add, edit, clone, delete, or chat with characters."
      />

      <scenario-gallery
        v-else-if="currentTab === 'scenarios'"
        variant="dashboard"
        title="Scenario Gallery"
        subtitle="Pair characters with a story setting."
      />

      <reward-gallery
        v-else-if="currentTab === 'rewards'"
        variant="dashboard"
        title="Reward Gallery"
        subtitle="Give characters items, powers, curses, or suspicious snacks."
      />

      <dream-gallery
        v-else-if="currentTab === 'dreams'"
        variant="dashboard"
        title="Dream Gallery"
        subtitle="Use characters inside collaborative dream sessions."
      />

      <server-manager v-else-if="currentTab === 'servers'" />

      <character-interact v-else-if="currentTab === 'interact'" />

      <div
        v-else
        class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
      >
        Unknown character tab: {{ currentTab }}
      </div>
    </template>
  </dashboard-shell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useDreamStore } from '@/stores/dreamStore'
import { useNavStore } from '@/stores/navStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useServerStore } from '@/stores/serverStore'

const dashboardKey = 'character' as const

const characterStore = useCharacterStore()
const dreamStore = useDreamStore()
const navStore = useNavStore()
const rewardStore = useRewardStore()
const scenarioStore = useScenarioStore()
const serverStore = useServerStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const tabs = computed(() => navStore.getDashboardTabs(dashboardKey))
const activeTab = computed(() => navStore.getDashboardTab(dashboardKey))

const selectedCharacterName = computed(() => {
  const character = characterStore.selectedCharacter

  if (!character) return 'no character'

  if (character.name && character.honorific) {
    return `${character.name} the ${character.honorific}`
  }

  return character.name || character.honorific || 'unnamed character'
})

const selectedScenarioName = computed(() => {
  return scenarioStore.selectedScenario?.title || 'no scenario'
})

const selectedRewardName = computed(() => {
  return (
    rewardStore.selectedReward?.label ||
    rewardStore.selectedReward?.text ||
    rewardStore.selectedReward?.power ||
    'no reward'
  )
})

const selectedDreamName = computed(() => {
  return dreamStore.selectedDream?.title || 'no dream'
})

const selectedTextServerName = computed(() => {
  return (
    serverStore.activeTextServer?.label ||
    serverStore.activeTextServer?.title ||
    'no text server'
  )
})

const managerSummary = computed(() => {
  const characterCount = characterStore.characters.length
  const scenarioCount = scenarioStore.scenarios.length
  const rewardCount = rewardStore.rewards.length
  const dreamCount = dreamStore.dreams.length

  return `${characterCount} characters, ${scenarioCount} scenarios, ${rewardCount} rewards, and ${dreamCount} dreams loaded. Current setup: ${selectedCharacterName.value}, ${selectedScenarioName.value}, ${selectedRewardName.value}, ${selectedDreamName.value}, ${selectedTextServerName.value}.`
})

function setTab(tab: string) {
  navStore.setDashboardTab(dashboardKey, tab)

  if (tab === 'servers' || tab === 'interact' || tab === 'overview') {
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
      dreamStore.initialize(force),
      serverStore.initialize({
        force,
        fetchRemote: true,
      }),
    ])
  } catch (error) {
    managerError.value =
      error instanceof Error
        ? error.message
        : 'Failed to load character manager data.'
  } finally {
    isLoadingManager.value = false
  }
}

async function refreshManagerData() {
  await loadManagerData(true)
}

watch(
  () => characterStore.selectedCharacterId,
  (characterId, previousCharacterId) => {
    if (!characterId || characterId === previousCharacterId) return

    const currentTab = navStore.getDashboardTab(dashboardKey)

    if (currentTab !== 'interact') {
      navStore.setDashboardTab(dashboardKey, 'interact')
    }
  },
)

onMounted(async () => {
  await loadManagerData()
  setTab(activeTab.value)
})
</script>
