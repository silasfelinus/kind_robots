<!-- /components/content/rewards/reward-manager.vue -->
<template>
  <dashboard-shell
    title="Reward Workshop"
    :summary="managerSummary"
    :tabs="tabs"
    :active-tab="activeTab"
    :loading="isLoadingManager"
    :error="managerError"
    loading-message="Loading rewards and story goblin collateral..."
    nav-grid-class="xl:grid-cols-5"
    @set-tab="setTab"
    @refresh="refreshManagerData"
  >
    <template #default="{ activeTab: currentTab }">
      <section
        v-if="currentTab === 'overview'"
        class="grid min-h-0 grid-cols-1 gap-4 xl:grid-cols-12"
      >
        <div class="flex min-h-0 flex-col gap-4 xl:col-span-5">
          <reward-gallery
            variant="dropdown"
            title="Reward"
            subtitle="Choose the artifact, boon, curse, or plot grenade."
            :show-controls="false"
            :show-images="true"
            :show-card-actions="false"
            :show-descriptions="true"
            :show-meta="true"
            :compact="true"
          />

          <server-gallery
            mode="text"
            variant="dropdown"
            title="Text Server"
            subtitle="Choose the narration engine."
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
          <reward-interact />
        </div>
      </section>

      <reward-gallery
        v-else-if="currentTab === 'rewards'"
        variant="dashboard"
        title="Reward Gallery"
        subtitle="Select, add, edit, or delete story rewards and artifacts."
      />

      <reward-gallery
        v-else-if="currentTab === 'collections'"
        variant="dashboard"
        title="Reward Collections"
        subtitle="Browse rewards by collection, story type, or chaos flavor."
        :show-controls="true"
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
import { useServerStore } from '@/stores/serverStore'

const dashboardKey = 'reward' as const

const characterStore = useCharacterStore()
const navStore = useNavStore()
const rewardStore = useRewardStore()
const serverStore = useServerStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const tabs = computed(() => navStore.getDashboardTabs(dashboardKey))
const activeTab = computed(() => navStore.getDashboardTab(dashboardKey))

const selectedRewardText = computed(() => {
  return (
    rewardStore.selectedReward?.label ||
    rewardStore.selectedReward?.text ||
    rewardStore.selectedReward?.power ||
    'no reward'
  )
})

const selectedCharacterName = computed(() => {
  return (
    characterStore.selectedCharacter?.name ||
    characterStore.selectedCharacter?.honorific ||
    'no optional character'
  )
})

const selectedTextServerName = computed(() => {
  return (
    serverStore.activeTextServer?.label ||
    serverStore.activeTextServer?.title ||
    'no text server'
  )
})

const managerSummary = computed(() => {
  const rewardCount = rewardStore.rewards.length
  const textCount = serverStore.textServers.length

  return `${rewardCount} rewards and ${textCount} text servers loaded. Current setup: ${selectedRewardText.value}, ${selectedTextServerName.value}, optional character: ${selectedCharacterName.value}.`
})

function setTab(tab: string) {
  navStore.setDashboardTab(dashboardKey, tab)

  if (tab === 'servers' || tab === 'interact' || tab === 'overview') {
    serverStore.setCurrentServerMode('text')
  }
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
      serverStore.initialize({
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
  setTab(activeTab.value)
})
</script>
