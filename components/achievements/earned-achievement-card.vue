<!-- /components/content/achievements/earned-achievement-card.vue -->
<template>
  <div
    class="card bg-base-300 border hover:bg-accent-dark hover:shadow-xl rounded-2xl p-4 m-2 transition duration-300 ease-in-out relative"
  >
    <div class="absolute top-2 right-2 z-6">
      <Icon name="ph:star-bold" class="text-yellow-400 text-4xl" />
    </div>
    <div class="text-center">
      <kr-deferred-image
        v-if="achievement.imagePath"
        :src="achievement.imagePath"
        :alt="achievement.label"
        class="mx-auto mb-2 h-24 w-24 rounded-2xl object-cover"
      />
      <Icon
        v-else
        :name="achievement.icon ?? 'kind-icon:map'"
        class="text-9xl mb-2 md:w-16 md:h-16"
      />

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
      <div class="text-base mb-2">
        {{ achievement.subtleHint }}
      </div>
      <div class="text-base italic">
        {{ achievement.tooltip }}
      </div>
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
      <div class="text-xs">Karma: +{{ achievement.karma }}</div>
      <div>
        <div class="text-lg">You discovered 1 Jellybean!</div>
        <Icon name="kind-icon:jellybean" class="text-9xl" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Achievement } from './../../stores/achievementStore'

const props = defineProps<{
  achievement: Achievement
  acquiredAt: string | null
}>()
const { achievement } = props
</script>
