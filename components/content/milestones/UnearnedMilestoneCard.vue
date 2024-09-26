<template>
  <!-- Unachieved Milestone Card -->
  <div
    class="card bg-base-300 hover:bg-accent-dark hover:shadow-xl rounded-2xl p-4 m-2 border transition duration-300 ease-in-out relative"
  >
    <div class="text-center flex flex-col items-center">
      <!-- Milestone Icon -->
      <Icon name="milestone.icon" class="Icon-extra-large mb-2" />
      <!-- Milestone Label -->
      <div class="text-xl font-bold text-gray-700">
        {{ milestone.label }}
      </div>
      <!-- Subtle Hint -->
      <div class="text-sm text-gray-500">
        {{ milestone.subtleHint }}
      </div>
      <!-- Tooltip -->
      <div class="mt-4">
        <div @click="toggleTooltip">
          <Icon
            v-if="!revealTooltip"
            name="ph:question-bold"
            class="text-accent text-2xl"
          />
          <div v-else class="text-sm">
            {{ milestone.tooltip }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Milestone } from './../../../stores/milestoneStore'

// Define props and destructure them
const props = defineProps<{
  milestone: Milestone
}>()
const { milestone } = props

// State to toggle tooltip visibility
const revealTooltip = ref(false)

// Variable to hold the timer ID
let timerId: ReturnType<typeof setTimeout> | null = null

// Function to toggle tooltip and set a timer to revert it back to '?'
const toggleTooltip = () => {
  // Clear any existing timer
  if (timerId) {
    clearTimeout(timerId)
  }

  // Toggle the tooltip
  revealTooltip.value = !revealTooltip.value

  // Set a new timer if the tooltip is revealed
  if (revealTooltip.value) {
    timerId = setTimeout(() => {
      revealTooltip.value = false
    }, 1200) // Reverts back to '?' after 3 seconds
  }
}
</script>
