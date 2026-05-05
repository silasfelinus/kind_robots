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
      <section v-if="currentTab === 'overview'" class="flex flex-col gap-4">
        <div class="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <character-gallery
              variant="row"
              title="Characters"
              subtitle="Pick the cast."
              :show-controls="false"
              :show-toolbar="false"
              :show-images="true"
              :show-card-actions="true"
              :show-mode-buttons="false"
              :compact="true"
            />
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <scenario-gallery
              variant="row"
              title="Scenarios"
              subtitle="Pick the trouble."
              :show-controls="false"
              :show-toolbar="false"
              :show-images="true"
              :show-inspirations="false"
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

const managerSummary = computed(() => {
  const characterCount = characterStore.characters.length
  const scenarioCount = scenarioStore.scenarios.length
  const rewardCount = rewardStore.rewards.length
  const selectedCharacter =
    characterStore.selectedCharacter?.name || 'no character'

  return `${characterCount} characters, ${scenarioCount} scenarios, and ${rewardCount} rewards loaded. Current cast member: ${selectedCharacter}.`
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
})
</script>