<!-- /components/content/rewards/reward-manager.vue -->
<template>
  <dashboard-shell
    dashboard-key="reward"
    title="Reward Workshop"
    :summary="managerSummary"
    :loading="isLoadingManager"
    :error="managerError"
    loading-message="Loading rewards and story goblin collateral..."
    nav-grid-class="xl:grid-cols-5"
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
            :show-header="false"
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
          <reward-interact />
        </div>
      </section>

      <reward-gallery
        v-else-if="currentTab === 'rewards'"
        variant="dashboard"
        :show-header="false"
      />

      <reward-gallery
        v-else-if="currentTab === 'collections'"
        variant="dashboard"
        :show-header="false"
        :show-controls="true"
        :show-images="true"
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

      <reward-builder v-else-if="currentTab === 'builder'" />

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
import { useRewardStore } from '@/stores/rewardStore'
import { useServerStore } from '@/stores/serverStore'

const characterStore = useCharacterStore()
const rewardStore = useRewardStore()
const serverStore = useServerStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

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
      rewardStore.initialize({ force, fetchRemote: true }),
      ...(force || !serverStore.hasLoaded
        ? [serverStore.initialize({ force, fetchRemote: true })]
        : []),
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
