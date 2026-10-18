<template>
  <span
    class="relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full border-2 font-serif font-bold"
    :class="[sizeClass, stateClass]"
    :title="label"
    role="img"
    :aria-label="label"
  >
    <span aria-hidden="true">{{ initials }}</span>
    <span
      v-if="state === 'injured'"
      class="absolute bottom-0 right-0 rounded-tl-md bg-error px-1 text-[9px] font-bold text-error-content"
      aria-hidden="true"
      >+{{ days }}</span
    >
    <span
      v-else-if="state === 'on-quest'"
      class="absolute inset-x-0 bottom-0 bg-info/80 text-center text-[8px] font-bold uppercase text-info-content"
      aria-hidden="true"
      >away</span
    >
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { followerDef } from '~/utils/emperorOfDust/fortress/followers'

// Portrait mode (neutral / injured / dead). No portraits are rendered yet,
// so this draws a labeled placeholder instead of a broken image.
const props = withDefaults(
  defineProps<{
    followerId: string
    state?: 'ready' | 'on-quest' | 'injured' | 'dead'
    days?: number
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { state: 'ready', days: 0, size: 'md' },
)

const def = computed(() => followerDef(props.followerId))
const initials = computed(() =>
  (def.value?.name ?? props.followerId)
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2),
)
const sizeClass = computed(
  () =>
    ({
      sm: 'h-9 w-9 text-xs',
      md: 'h-12 w-12 text-sm',
      lg: 'h-20 w-20 text-2xl',
    })[props.size],
)
const stateClass = computed(() => {
  if (props.state === 'dead')
    return 'border-base-content/30 bg-base-300 text-base-content/40 grayscale'
  if (props.state === 'injured')
    return 'border-error/70 bg-error/10 text-base-content'
  return 'border-warning/60 bg-gradient-to-br from-amber-700/40 to-slate-700/30 text-base-content'
})
const label = computed(() => {
  const name = def.value?.name ?? props.followerId
  if (props.state === 'dead') return `${name}, remembered`
  if (props.state === 'injured')
    return `${name}, injured for ${props.days} more day(s)`
  if (props.state === 'on-quest') return `${name}, away on a quest`
  return name
})
</script>
