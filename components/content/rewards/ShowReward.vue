<template>
  <div class="bg-base-200 p-4 rounded shadow-lg modal">
    <!-- Reward Details -->
    <Icon :name="props.reward.Icon" class="text-6xl mb-2" />
    <h2 class="text-xl mb-2">
      {{ props.reward.text }}
    </h2>
    <p class="text-lg text-gray-600">
      {{ props.reward.power }}
    </p>
    <p class="text-sm text-gray-400">Rarity: {{ props.reward.rarity }}</p>

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

<template>
  <div>
    <!-- Display the icon here -->
    <div>{{ reward.icon }} - {{ reward.text }}</div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

const props = defineProps<{
  reward: {
    icon: string // Changed from Icon to icon
    text: string
    power: string
    rarity: number
  }
}>()
</script>
