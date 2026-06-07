<!-- /components/content/rewards/reward-manager.vue -->
<template>
  <section class="flex h-full min-h-0 w-full flex-col overflow-hidden">
    <div
      v-if="isLoadingManager || managerError"
      class="mb-4 shrink-0 rounded-2xl border border-base-300 bg-base-100 p-4"
    >
      <div v-if="isLoadingManager" class="flex items-center gap-2 text-sm">
        <span class="loading loading-spinner loading-sm text-primary" />
        <span>Loading rewards and story goblin collateral...</span>
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

    <section
      v-if="activeTab === 'overview'"
      class="grid h-full min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden xl:grid-cols-12"
    >
      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 xl:col-span-5"
      >
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
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
        </div>
      </section>

      <section
        class="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 xl:col-span-7"
      >
        <div class="min-h-0 flex-1 overflow-hidden">
          <reward-interact class="h-full min-h-0 overflow-hidden" />
        </div>
      </section>
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
      v-else-if="activeTab === 'collections'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <reward-gallery
        class="h-full min-h-0 flex-1 overflow-hidden"
        variant="dashboard"
        :show-header="false"
        :show-controls="true"
        :show-images="true"
      />
    </section>

    <section
      v-else-if="activeTab === 'interact'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <reward-interact class="h-full min-h-0 flex-1 overflow-hidden" />
    </section>

    <div
      v-else
      class="flex min-h-0 flex-1 items-center justify-center rounded-2xl border border-warning/40 bg-warning/10 p-4 text-warning"
    >
      Unknown reward tab: {{ activeTab }}
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'
import { useNavStore } from '@/stores/navStore'
import { useRewardStore } from '@/stores/rewardStore'
import { useServerStore } from '@/stores/serverStore'

type RewardTab = 'overview' | 'rewards' | 'collections' | 'builder' | 'interact'

const rewardTabs: RewardTab[] = [
  'overview',
  'rewards',
  'collections',
  'builder',
  'interact',
]

const defaultDashboardKey = 'reward'
const defaultTab: RewardTab = 'overview'

const characterStore = useCharacterStore()
const navStore = useNavStore()
const rewardStore = useRewardStore()
const serverStore = useServerStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)

const dashboardKey = computed(() => {
  return navStore.dashboardShell.dashboardKey || defaultDashboardKey
})

const activeTab = computed<RewardTab>(() => {
  const selectedTab = navStore.getDashboardTab(dashboardKey.value)

  if (rewardTabs.includes(selectedTab as RewardTab)) {
    return selectedTab as RewardTab
  }

  return defaultTab
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
