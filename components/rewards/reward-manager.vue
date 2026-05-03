<!-- /components/content/rewards/reward-manager.vue -->
<template>
  <dashboard-shell
    title="Reward Workshop"
    :summary="managerSummary"
    :tabs="tabs"
    :active-tab="activeTab"
    :loading="isLoadingManager"
    :error="managerError"
    loading-message="Loading rewards, characters, and story goblin collateral..."
    nav-grid-class="xl:grid-cols-6"
    @set-tab="setTab"
    @refresh="refreshManagerData"
  >
    <template #default="{ activeTab: currentTab }">
      <section v-if="currentTab === 'overview'" class="flex flex-col gap-4">
        <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <reward-gallery
              variant="row"
              title="Rewards"
              subtitle="Pick the artifact, boon, curse, or plot grenade."
              :show-controls="false"
              :show-toolbar="true"
              :show-images="true"
              :compact="true"
            />
          </div>

          <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
            <character-gallery
              variant="row"
              title="Characters"
              subtitle="Choose who encounters the reward."
              :show-controls="false"
              :show-toolbar="true"
              :show-images="true"
              :compact="true"
            />
          </div>
        </div>

        <div class="rounded-2xl border border-base-300 bg-base-200 p-3">
          <reward-interact />
        </div>
      </section>

      <reward-gallery
        v-else-if="currentTab === 'rewards'"
        variant="dashboard"
        title="Reward Gallery"
        subtitle="Select, add, edit, or delete story rewards and artifacts."
      />

      <character-gallery
        v-else-if="currentTab === 'characters'"
        variant="dashboard"
        title="Character Gallery"
        subtitle="Choose who encounters the reward."
      />

      <reward-gallery
        v-else-if="currentTab === 'collections'"
        variant="dashboard"
        title="Reward Collections"
        subtitle="Browse rewards by collection, story type, or chaos flavor."
        :show-controls="true"
        :show-toolbar="true"
        :show-images="true"
      />

      <server-manager v-else-if="currentTab === 'servers'" />

      <reward-interact v-else-if="currentTab === 'interact'" />

      <div
        v-else
        class="rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
      >
        Unknown reward tab: {{ currentTab }}
      </div>
    </template>
  </dashboard-shell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useNavStore } from '@/stores/navStore'
import { useRewardStore } from '@/stores/rewardStore'

const dashboardKey = 'reward' as const

const characterStore = useCharacterStore()
const navStore = useNavStore()
const rewardStore = useRewardStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const tabs = computed(() => navStore.getDashboardTabs(dashboardKey))
const activeTab = computed(() => navStore.getDashboardTab(dashboardKey))

const selectedRewardText = computed(
  () => rewardStore.selectedReward?.text || 'no reward',
)

const selectedCharacterName = computed(
  () => characterStore.selectedCharacter?.name || 'no character',
)

const managerSummary = computed(() => {
  const rewardCount = rewardStore.rewards.length
  const characterCount = characterStore.characters.length

  return `${rewardCount} rewards and ${characterCount} characters loaded. Current pairing: ${selectedRewardText.value} meets ${selectedCharacterName.value}.`
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
      rewardStore.initialize({
        force,
        fetchRemote: true,
      }),
    ])
  } catch (error) {
    managerError.value =
      error instanceof Error
        ? error.message
        : 'Failed to load reward manager data.'
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
