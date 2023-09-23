<template>
  <div
    class="card bg-accent hover:bg-accent-dark hover:shadow-lg rounded-xl p-4 transition duration-300 ease-in-out relative"
  >
    <div class="absolute top-2 right-2 z-6">
      <icon name="ph:star-bold" class="text-yellow-400 text-2xl" />
    </div>
    <div class="text-center">
      <icon :name="milestone.icon" class="text-6xl mb-2" />
      <div class="text-xl font-bold text-white">
        <!-- Conditionally render the link if pageHint exists -->
        <a v-if="milestone.pageHint" :href="milestone.pageHint" class="hover:underline">{{
          milestone.label
        }}</a>
        <!-- If pageHint doesn't exist, just display the label -->
        <template v-else>{{ milestone.label }}</template>
      </div>
      <!-- Conditionally render subtleHint if it exists -->
      <div v-if="milestone.subtleHint" class="text-white text-sm mb-2">
        {{ milestone.subtleHint }}
      </div>
      <div class="text-white text-xs italic">{{ milestone.tooltip }}</div>
      <div class="text-white text-xs">
        Earned on: {{ new Date(milestone.createdAt).toLocaleDateString() }}
      </div>
      <div class="text-white text-xs">Karma: {{ milestone.karma }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Milestone } from '@prisma/client'

const props = defineProps<{
  milestone: Milestone
}>()

const { milestone } = props
</script>
