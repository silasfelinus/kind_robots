<!-- /components/characters/character-manager.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col overflow-hidden">
    <div
      v-if="isLoadingManager || managerError"
      class="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-2xl border border-base-300 bg-base-100 p-3 text-sm shadow"
    >
      <p
        class="min-w-0 flex-1 text-base-content/70"
        :class="managerError ? 'text-error' : ''"
      >
        {{ managerError || managerSummary }}
      </p>

      <button
        type="button"
        class="btn btn-sm rounded-2xl"
        :class="managerError ? 'btn-error' : 'btn-ghost'"
        :disabled="isLoadingManager"
        @click="refreshManagerData"
      >
        <Icon
          name="kind-icon:refresh"
          class="h-4 w-4"
          :class="isLoadingManager ? 'animate-spin' : ''"
        />
        Refresh
      </button>
    </div>

    <section
      v-if="activeTab === 'overview'"
      class="grid h-full min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-12"
    >
      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 xl:col-span-5"
      >
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
          <div class="flex flex-col gap-4">
            <character-gallery
              variant="dropdown"
              :show-header="false"
              :show-controls="false"
              :show-images="true"
              :show-card-actions="false"
              :show-mode-buttons="false"
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

            <reward-gallery
              variant="dropdown"
              :show-header="false"
              :show-controls="false"
              :show-images="true"
              :show-card-actions="false"
              :show-meta="false"
              :compact="true"
            />

            <dream-gallery
              variant="dropdown"
              :show-header="false"
              :show-controls="false"
              :show-images="true"
              :show-card-actions="false"
              :show-open-button="false"
              :show-stats="false"
              :show-meta="false"
              :compact="true"
            />
          </div>
        </div>
      </section>

      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 xl:col-span-7"
      >
        <character-interact class="h-full min-h-0 flex-1 overflow-hidden" />
      </section>
    </section>

    <section
      v-else-if="activeTab === 'adventure'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <adventure-builder
        class="h-full min-h-0 flex-1 overflow-hidden"
        variant="dashboard"
        :show-header="false"
      />
    </section>

    <section
      v-else-if="activeTab === 'stage'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <stage-manager class="h-full min-h-0 flex-1 overflow-hidden" />
    </section>

    <section
      v-else-if="activeTab === 'characters'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <character-gallery
        class="h-full min-h-0 flex-1 overflow-hidden"
        variant="dashboard"
        :show-header="false"
      />
    </section>

    <section
      v-else-if="activeTab === 'scenarios'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <scenario-gallery
        class="h-full min-h-0 flex-1 overflow-hidden"
        variant="dashboard"
        :show-header="false"
      />
    </section>

    <section
      v-else-if="activeTab === 'rewards'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <reward-gallery
        class="h-full min-h-0 flex-1 overflow-hidden"
        variant="dashboard"
        :show-header="false"
      />
    </section>

    <section
      v-else-if="activeTab === 'dreams'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <dream-gallery
        class="h-full min-h-0 flex-1 overflow-hidden"
        variant="dashboard"
        :show-header="false"
      />
    </section>

    <section
      v-else-if="activeTab === 'interact'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <character-interact class="h-full min-h-0 flex-1 overflow-hidden" />
    </section>

    <div
      v-else
      class="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
    >
      Unknown character tab: {{ activeTab }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useDreamStore } from '@/stores/dreamStore'
import { useNavStore } from '@/stores/navStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useServerStore } from '@/stores/serverStore'

type CharacterTab =
  | 'overview'
  | 'adventure'
  | 'stage'
  | 'characters'
  | 'scenarios'
  | 'rewards'
  | 'dreams'
  | 'interact'

const characterStore = useCharacterStore()
const dreamStore = useDreamStore()
const navStore = useNavStore()
const rewardStore = useRewardStore()
const scenarioStore = useScenarioStore()
const serverStore = useServerStore()

const defaultDashboardKey = 'character'
const defaultTab: CharacterTab = 'overview'

const validTabs: CharacterTab[] = [
  'overview',
  'adventure',
  'stage',
  'characters',
  'scenarios',
  'rewards',
  'dreams',
  'interact',
]

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const dashboardKey = computed(() => {
  return navStore.dashboardShell.dashboardKey || defaultDashboardKey
})

const activeTab = computed<CharacterTab>(() => {
  const selectedTab = navStore.getDashboardTab(dashboardKey.value)

  if (validTabs.includes(selectedTab as CharacterTab)) {
    return selectedTab as CharacterTab
  }

  return defaultTab
})

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

async function loadManagerData(force = false) {
  isLoadingManager.value = true
  managerError.value = null

  try {
    await Promise.all([
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
      rewardStore.initialize({ force, fetchRemote: true }),
      dreamStore.initialize(force),
      ...(force || !serverStore.hasLoaded
        ? [serverStore.initialize({ force, fetchRemote: true })]
        : []),
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

onMounted(async () => {
  await loadManagerData()
})
</script>
