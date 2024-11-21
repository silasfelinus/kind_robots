<template>
  <!-- Unachieved Milestone Card -->
  <div
    class="card bg-base-300 hover:bg-accent-dark hover:shadow-xl rounded-2xl p-4 m-2 border transition duration-300 ease-in-out relative"
  >
    <div class="text-center flex flex-col items-center">
      <!-- Milestone Icon -->
      id: {{milestone.id}}
      <Icon
        :name="props.milestone.icon ?? 'kind-icon:map'"
        class="Icon-extra-large mb-2"
      />
      <!-- Milestone Label -->
      <div class="text-xl font-bold text-gray-700">
        {{ milestone.label }}
      </div>
      <!-- Subtle Hint -->
      <div class="text-sm text-gray-500">
        {{ milestone.subtleHint }}
      </div>
      <!-- Tooltip Toggle -->
      <div
        class="mt-4 relative"
        role="button"
        tabindex="0"
        aria-expanded="false"
        @click="toggleTooltip"
      >
        <Icon
          v-if="!revealTooltip"
          name="ph:question-bold"
          class="text-accent text-2xl"
          aria-label="Click for hint"
        />
        <div
          v-else
          class="text-sm p-2 absolute bg-base-200 rounded-lg shadow-lg top-full mt-2 text-gray-700"
          role="tooltip"
          aria-live="polite"
        >
          {{ milestone.tooltip }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Milestone } from './../../../stores/milestoneStore'

const props = defineProps<{
  milestone: Milestone
}>()

// State for tooltip visibility
const revealTooltip = ref(false)

// Tooltip timer
let timerId: ReturnType<typeof setTimeout> | null = null

// Toggle tooltip with timer to auto-hide
const toggleTooltip = () => {
  if (timerId) clearTimeout(timerId)
  revealTooltip.value = !revealTooltip.value

  if (revealTooltip.value) {
    timerId = setTimeout(() => {
      revealTooltip.value = false
    }, 1200) // Tooltip closes after 1.2 seconds
  }
}
</script>
