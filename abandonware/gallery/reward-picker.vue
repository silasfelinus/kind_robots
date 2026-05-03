<!-- /components/content/rewards/reward-picker.vue -->
<template>
  <div class="picker-root">
    <div class="picker-controls">
      <input
        v-model="query"
        type="search"
        placeholder="Search rewards…"
        class="input input-bordered input-xs w-full bg-base-200"
      />
    </div>

    <div v-if="rewardStore.error" class="picker-error">
      🚨 {{ rewardStore.error }}
    </div>

    <div v-else-if="isLoading" class="picker-loading">
      <span class="loading loading-spinner loading-sm text-primary" />
    </div>

    <div v-else-if="filtered.length === 0" class="picker-empty">
      <span>🌟</span> No rewards found
    </div>

    <ul v-else class="picker-list">
      <li
        v-for="reward in filtered"
        :key="reward.id"
        class="picker-row"
        :class="{ 'picker-row--active': rewardStore.selectedReward?.id === reward.id }"
        @click="rewardStore.setRewardById(reward.id)"
      >
        <!-- Tiny art or icon -->
        <img
          v-if="reward.imagePath"
          :src="reward.imagePath"
          class="picker-avatar"
          alt=""
        />
        <span v-else class="picker-icon">
          <Icon :name="reward.icon || 'kind-icon:star'" class="w-5 h-5" />
        </span>

        <span class="picker-label">
          <span class="picker-name">{{ reward.text }}</span>
          <span class="picker-sub">
            Power {{ reward.power }} · {{ reward.rarity }}
          </span>
        </span>

        <button
          class="picker-action"
          :class="rewardStore.selectedReward?.id === reward.id ? 'btn-primary' : 'btn-ghost'"
          @click.stop="rewardStore.setRewardById(reward.id)"
        >
          {{ rewardStore.selectedReward?.id === reward.id ? 'Selected' : 'Select' }}
        </button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRewardStore } from '@/stores/rewardStore'

const rewardStore = useRewardStore()
const query = ref('')
const isLoading = ref(false)

onMounted(async () => {
  isLoading.value = true
  try { await rewardStore.fetchRewards() } catch {}
  finally { isLoading.value = false }
})

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q
    ? rewardStore.rewards.filter((r) => r.text?.toLowerCase().includes(q))
    : rewardStore.rewards
})
</script>
