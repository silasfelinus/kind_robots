<template>
  <article
    class="card relative h-full min-h-48 rounded-2xl border border-base-300 bg-base-300 p-4 transition duration-300 ease-in-out hover:border-primary/25 hover:shadow-lg"
  >
    <div class="flex h-full flex-col items-center text-center">
      <Icon
        :name="achievement.icon ?? 'kind-icon:map'"
        class="kr-icon-8 mb-3 text-base-content/70"
      />

      <h3 class="kr-text-black-lg text-base-content">
        {{ achievement.label }}
      </h3>
      <p class="kr-text-dim-sm mt-1 line-clamp-2">
        {{ achievement.subtleHint }}
      </p>

      <div class="relative mt-auto pt-4">
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-circle text-accent"
          :aria-expanded="revealTooltip"
          :aria-label="revealTooltip ? 'Hide achievement hint' : 'Show achievement hint'"
          @click="toggleTooltip"
        >
          <Icon name="kind-icon:question" class="kr-icon-5" />
        </button>

        <div
          v-if="revealTooltip"
          class="absolute bottom-full left-1/2 z-10 mb-2 w-56 max-w-[70vw] -translate-x-1/2 rounded-xl border border-base-300 bg-base-100 p-3 text-sm text-base-content shadow-xl"
          role="tooltip"
          aria-live="polite"
        >
          {{ achievement.tooltip }}
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Achievement } from '~/prisma/generated/prisma/client'

const props = defineProps<{
  achievement: Achievement
}>()

const achievement = props.achievement
const revealTooltip = ref(false)
let timerId: ReturnType<typeof setTimeout> | null = null

const toggleTooltip = () => {
  if (timerId) clearTimeout(timerId)
  revealTooltip.value = !revealTooltip.value

  if (revealTooltip.value) {
    timerId = setTimeout(() => {
      revealTooltip.value = false
    }, 2400)
  }
}
</script>
