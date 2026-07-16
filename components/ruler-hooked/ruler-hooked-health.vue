<!-- components/ruler-hooked/ruler-hooked-health.vue
     Read-only kingdom-health meters (data-model.md §4). Fill-% bars, one per axis,
     using the same rangeFill idea as components/butterfly/single-slider.vue. -->
<template>
  <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
    <div v-for="axis in axes" :key="axis.key" class="text-xs">
      <div class="mb-0.5 flex justify-between">
        <span class="font-medium capitalize">{{ axis.key }}</span>
        <span class="tabular-nums opacity-70">{{ axis.value }}</span>
      </div>
      <div class="h-2 w-full overflow-hidden rounded-full bg-base-300">
        <div
          class="h-full rounded-full transition-[width] duration-500 ease-out"
          :class="axis.color"
          :style="{ width: axis.value + '%' }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AXIS_KEYS } from '~/types/ruler-hooked'
import type { KingdomHealth } from '~/types/ruler-hooked'

const props = defineProps<{ health: KingdomHealth }>()

const COLOR: Record<string, string> = {
  nature: 'bg-green-500',
  prosperity: 'bg-amber-500',
  treasury: 'bg-yellow-500',
  joy: 'bg-pink-500',
  order: 'bg-indigo-500',
}

const axes = computed(() =>
  AXIS_KEYS.map((key) => ({
    key,
    value: Math.round(props.health[key] ?? 0),
    color: COLOR[key] ?? 'bg-primary',
  })),
)
</script>
