<!-- /components/content/achievements/earned-achievement-card.vue -->
<template>
  <!-- Achieved Achievement Card -->
  <div
    class="card bg-base-300 border hover:bg-accent-dark hover:shadow-xl rounded-2xl p-4 m-2 transition duration-300 ease-in-out relative"
  >
    <!-- Star Icon for Achieved Achievements -->
    <div class="absolute top-2 right-2 z-6">
      <Icon name="ph:star-bold" class="text-yellow-400 text-4xl" />
    </div>
    <div class="text-center">
      id: {{ achievement.id }}
      <!-- Achievement Icon -->
      <Icon
        :name="achievement.icon ?? 'kind-icon:map'"
        class="text-9xl mb-2 md:w-16 md:h-16"
      />

      <!-- Achievement Label -->
      <div class="text-2xl font-bold">
        <a
          v-if="achievement.pageHint"
          :href="achievement.pageHint"
          class="hover:underline"
        >
          {{ achievement.label }}
        </a>
        <template v-else>
          {{ achievement.label }}
        </template>
      </div>
      <!-- Subtle Hint -->
      <div class="text-base mb-2">
        {{ achievement.subtleHint }}
      </div>
      <!-- Tooltip -->
      <div class="text-base italic">
        {{ achievement.tooltip }}
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
      <div class="text-xs">Karma: +{{ achievement.karma }}</div>
      <!-- Jellybean Award -->
      <div>
        <div class="text-lg">You discovered 1 Jellybean!</div>
        <Icon name="kind-icon:jellybean" class="text-9xl" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Achievement } from './../../stores/achievementStore'

// Define props and destructure them
const props = defineProps<{
  achievement: Achievement
  acquiredAt: string | null
}>()
const { achievement } = props
</script>
