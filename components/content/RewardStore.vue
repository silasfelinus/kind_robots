<template>
  <div class="bg-base-100 p-4">
    <h1 class="text-2xl mb-4">Rewards</h1>
    <button class="bg-primary text-white p-2 rounded" :disabled="loading" @click="fetchRewards">
      Refresh
    </button>
    <!-- Loading Animation -->
    <div v-if="loading" class="mt-2">Loading...</div>
    <!-- Error Message -->
    <div v-if="error" class="text-red-500 mt-2">
      {{ error }}
    </div>
    <!-- Rewards List -->
    <div v-else class="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
      <transition-group name="list" tag="ul">
        <li
          v-for="reward in sortedRewards"
          :key="reward.id"
          class="mb-4 flex items-center p-2 rounded border-2"
          :class="borderColor(reward.rarity)"
        >
          <!-- Icon -->
          <icon :name="`${reward.icon}`" class="text-6xl mr-4" />
          <!-- Text -->
          <div>
            <div class="text-xl">{{ reward.text }}</div>
            <div class="text-lg text-gray-600">{{ reward.power }}</div>
          </div>
        </li>
      </transition-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

interface Reward {
  id: number
  icon: string
  text: string
  power: string
  rarity: number
}

const rewards = ref<Reward[]>([])
const error = ref<string | null>(null)
const loading = ref<boolean>(false)

const fetchRewards = async () => {
  loading.value = true
  try {
    const response = await fetch('/api/rewards')
    if (!response.ok) {
      throw new Error('Failed to fetch rewards')
    }
    const data = await response.json()
    if (data.success) {
      rewards.value = data.rewards
    } else {
      throw new Error('Failed to fetch rewards')
    }
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const sortedRewards = computed(() => {
  return [...rewards.value].sort((a, b) => b.rarity - a.rarity)
})

const borderColor = (rarity: number) => {
  if (rarity > 75) return 'border-accent'
  if (rarity > 50) return 'border-primary'
  if (rarity > 25) return 'border-secondary'
  return 'border-gray-300'
}

onMounted(() => {
  fetchRewards()
})
</script>

<style>
.list-enter-active,
.list-leave-active {
  transition: opacity 1s;
}
.list-enter,
.list-leave-to {
  opacity: 0;
}
</style>
