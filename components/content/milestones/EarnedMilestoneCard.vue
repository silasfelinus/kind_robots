<template>
  <!-- Achieved Milestone Card -->
  <div
    class="card bg-base-200 border hover:bg-accent-dark hover:shadow-xl rounded-2xl p-4 m-2 transition duration-300 ease-in-out relative"
  >
    <!-- Star Icon for Achieved Milestones -->
    <div class="absolute top-2 right-2 z-6">
      <icon name="ph:star-bold" class="text-yellow-400 text-4xl" />
    </div>
    <div class="text-center">
      <!-- Milestone Icon -->
      <icon :name="milestone.icon" class="text-9xl mb-2 md:w-16 md:h-16" />
      <!-- Milestone Label -->
      <div class="text-2xl font-bold">
        <a
          v-if="milestone.pageHint"
          :href="milestone.pageHint"
          class="hover:underline"
        >
          {{ milestone.label }}
        </a>
        <template v-else>
          {{ milestone.label }}
        </template>
      </div>
      <!-- Subtle Hint -->
      <div class="text-md mb-2">
        {{ milestone.subtleHint }}
      </div>
      <!-- Tooltip -->
      <div class="text-md italic">
        {{ milestone.tooltip }}
      </div>
      <!-- Earned Date -->
      <div class="text-xs">
        Earned on:
        {{
          acquiredAt
            ? new Date(acquiredAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Unknown'
        }}
      </div>
      <!-- Karma Points -->
      <div class="text-xs">Karma: +{{ milestone.karma }}</div>
      <!-- Jellybean Award -->
      <div>
        <div class="text-lg">You discovered 1 Jellybean!</div>
        <icon name="tdesign:bean" class="text-9xl" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Milestone } from './../../../stores/milestoneStore'

// Define props and destructure them
const props = defineProps<{
  milestone: Milestone
  acquiredAt: string | null
}>()
const { milestone } = props
</script>
