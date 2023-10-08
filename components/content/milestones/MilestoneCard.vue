<template>
  <!-- Achieved Milestone Card -->
  <div
    v-if="achieved"
    class="card bg-accent hover:bg-accent-dark hover:shadow-xl rounded-2xl p-4 transition duration-300 ease-in-out relative"
  >
    <!-- Star Icon for Achieved Milestones -->
    <div class="absolute top-2 right-2 z-6">
      <icon name="ph:star-bold" class="text-yellow-400 text-2xl" />
    </div>
    <div class="text-center">
      <!-- Milestone Icon -->
      <icon :name="milestone.icon" class="text-6xl mb-2" />
      <!-- Milestone Label -->
      <div class="text-xl font-bold text-white">
        <a v-if="milestone.pageHint" :href="milestone.pageHint" class="hover:underline">
          {{ milestone.label }}
        </a>
        <template v-else>{{ milestone.label }}</template>
      </div>
      <!-- Subtle Hint -->
      <div v-if="milestone.subtleHint" class="text-white text-sm mb-2">
        {{ milestone.subtleHint }}
      </div>
      <!-- Tooltip -->
      <div class="text-white text-xs italic">{{ milestone.tooltip }}</div>
      <!-- Earned Date -->
      <div class="text-white text-xs">
        Earned on: {{ new Date(milestone.createdAt).toLocaleDateString() }}
      </div>
      <!-- Karma Points -->
      <div class="text-white text-xs">Karma: {{ milestone.karma }}</div>
    </div>
  </div>
  <div
    v-else
    class="card bg-base-200 hover:bg-base-300 hover:shadow-xl rounded-2xl p-4 transition duration-300 ease-in-out relative flex flex-col justify-center items-center"
    @mouseover="hover = true"
    @mouseleave="hover = false"
    @click="showTooltip = !showTooltip"
  >
    <div class="text-center">
      <!-- Milestone Icon -->
      <icon :name="milestone.icon" class="text-6xl mb-2" />
      <!-- Milestone Label -->
      <div class="text-xl font-bold">{{ milestone.label }}</div>
      <!-- Subtle Hint (visible on hover) -->
      <div v-show="hover" class="text-lg mb-2">
        {{ milestone.subtleHint }}
      </div>
      <!-- Tooltip (visible on click) -->
      <div v-show="showTooltip" class="text-md italic">{{ milestone.tooltip }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Milestone } from '@/stores/milestoneStore'

// Define props and destructure them
const props = defineProps<{
  milestone: Milestone
  achieved: boolean
}>()
const { milestone, achieved } = props
// Hover state for showing subtleHint
const hover = ref(false)
// Click state for showing tooltip
const showTooltip = ref(false)
</script>
