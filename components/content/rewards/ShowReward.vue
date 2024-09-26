<template>
  <div class="bg-base-300 p-4 rounded shadow-lg modal">
    <!-- Reward Details -->
    <Icon :name="reward.icon" class="text-6xl mb-2" />
    <h2 class="text-xl mb-2">
      {{ reward.text }}
    </h2>
    <p class="text-lg text-gray-600">
      {{ reward.power }}
    </p>
    <p class="text-sm text-gray-400">Rarity: {{ reward.rarity }}</p>

    <!-- Edit Button -->
    <button
      class="bg-primary text-default p-2 rounded mt-4"
      @click="showEditReward = !showEditReward"
    >
      Edit Reward
    </button>

    <!-- Edit Reward Form -->
    <transition name="fade" mode="out-in">
      <EditReward v-if="showEditReward" :reward="reward" />
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Destructure reward directly from props
const { reward } = defineProps<{
  reward: {
    icon: string
    text: string
    power: string
    rarity: number
  }
}>()

// Define showEditReward as a reactive boolean state
const showEditReward = ref(false)
</script>
