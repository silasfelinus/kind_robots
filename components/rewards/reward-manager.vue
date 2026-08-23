<!-- /components/content/rewards/reward-manager.vue -->
<template>
  <kr-manager
    dashboard-key="reward"
    :loading="isLoadingManager"
    :error="managerError"
    loading-label="Loading rewards..."
    :panel-tabs="['add']"
    @refresh="refreshManagerData"
  >
    <template #rewards>
      <div class="flex h-full min-h-0 flex-1 flex-col gap-2">
        <div
          v-if="rewardStore.selectedReward"
          class="flex shrink-0 justify-end"
        >
          <button
            type="button"
            class="btn btn-ghost btn-sm rounded-xl"
            title="Brainstorm variations grounded in this Reward"
            @click="startBrainstormWithReward"
          >
            <Icon name="kind-icon:brain" class="size-4" />
            <span class="hidden sm:inline">Brainstorm variations</span>
          </button>
        </div>
        <reward-interact class="h-full min-h-0 flex-1 overflow-hidden" />
      </div>
    </template>

    <template #add>
      <add-reward mode="add" @saved="handleRewardSaved" />
      <reward-facet-picker
        v-model="rewardFacetIds"
        :reward-id="null"
        class="mt-4"
      />
    </template>
  </kr-manager>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useNavStore } from '@/stores/navStore'
import { useRewardStore } from '@/stores/rewardStore'
import { performFetch } from '@/stores/utils'
import type { FacetWithAliases } from '@/stores/facetStore'

const dashboardKey = 'reward'

const navStore = useNavStore()
const rewardStore = useRewardStore()

const isLoadingManager = ref(false)
const managerError = ref<string | null>(null)
const rewardFacetIds = ref<number[]>([])

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
  navStore.setDashboardTab(dashboardKey, 'rewards')
}

function startBrainstormWithReward(): void {
  const reward = rewardStore.selectedReward
  if (!reward?.id) return
  void navigateTo({
    path: '/brainstorm',
    query: {
      source: 'reward',
      sourceId: String(reward.id),
      intent: `Generate variations for the Reward "${reward.name || 'this Reward'}" that preserve its effect and tone.`,
    },
  })
}

async function handleRewardSaved() {
  const rewardId = rewardStore.selectedReward?.id
  if (!rewardId) {
    managerError.value = 'Reward saved, but its ID could not be resolved.'
    return
  }

  try {
    const response = await performFetch<FacetWithAliases[]>(
      `/api/rewards/${rewardId}/facets`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facetIds: rewardFacetIds.value }),
      },
    )
    if (!response.success) {
      throw new Error(response.message || 'Reward Facets could not be saved.')
    }

    rewardFacetIds.value = []
    await loadManagerData(true)
    goToRewards()
  } catch (error) {
    managerError.value =
      error instanceof Error
        ? error.message
        : 'Reward Facets could not be saved.'
  }
}

onMounted(async () => {
  await loadManagerData()
})
</script>
