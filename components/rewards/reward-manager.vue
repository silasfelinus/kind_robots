<!-- /components/content/rewards/reward-manager.vue -->
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
        {{ managerError || 'Loading rewards...' }}
      </p>

      <button
        type="button"
        class="btn btn-sm rounded-2xl"
        :class="managerError ? 'btn-error' : 'btn-ghost'"
        :disabled="isLoadingManager"
        @click="refreshManagerData"
      >
        <span
          v-if="isLoadingManager"
          class="loading loading-spinner loading-xs"
        />
        <Icon v-else name="kind-icon:refresh" class="h-4 w-4" />
        Refresh
      </button>
    </div>

    <section
      v-if="activeTab === 'rewards'"
      class="flex h-full min-h-0 flex-1 flex-col overflow-hidden"
    >
      <reward-interact class="h-full min-h-0 flex-1 overflow-hidden" />
    </section>

    <section
      v-else-if="activeTab === 'add'"
      class="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-base-300 bg-base-100 p-4"
    >
      <div class="mb-4 flex items-start justify-between gap-3">
        <div class="min-w-0">
          <h2 class="text-xl font-black text-primary">Add Reward</h2>

          <p class="mt-1 text-sm text-base-content/60">
            Create a skill, item, pet, boon, curse, magic favor, or narrative
            plot grenade.
          </p>
        </div>

        <button
          class="btn btn-ghost btn-sm rounded-xl"
          type="button"
          @click="goToRewards"
        >
          <Icon name="kind-icon:arrow-left" class="h-4 w-4" />
          <span class="hidden sm:inline">Rewards</span>
        </button>
      </div>

      <add-reward mode="add" @saved="handleRewardSaved" />
    </section>

    <div
      v-else
      class="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-center text-warning"
    >
      <Icon name="kind-icon:warning" class="h-10 w-10" />

      <div>
        <p class="text-lg font-black">Unknown reward tab: {{ activeTab }}</p>

        <p class="mt-1 text-sm opacity-80">
          The reward dashboard only supports Rewards and Add.
        </p>
      </div>

      <button
        class="btn btn-warning btn-sm rounded-xl"
        type="button"
        @click="goToRewards"
      >
        Go to Rewards
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useNavStore } from '@/stores/navStore'
import { useRewardStore } from '@/stores/rewardStore'

type RewardTab = 'rewards' | 'add'

const rewardTabs: RewardTab[] = ['rewards', 'add']

const defaultDashboardKey = 'reward'
const defaultTab: RewardTab = 'rewards'

const navStore = useNavStore()
const rewardStore = useRewardStore()

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
    await rewardStore.initialize({ force, fetchRemote: true })
  } catch (error) {
    managerError.value =
      error instanceof Error ? error.message : 'Failed to load rewards.'
  } finally {
    isLoadingManager.value = false
  }
}

async function refreshManagerData() {
  await loadManagerData(true)
}

function goToRewards() {
  navStore.setDashboardTab(dashboardKey.value, 'rewards')
}

async function handleRewardSaved() {
  await loadManagerData(true)
  goToRewards()
}

onMounted(async () => {
  await loadManagerData()
})
</script>
