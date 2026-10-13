<template>
  <span class="flex flex-wrap items-center gap-1.5 text-xs">
    <span v-if="prefix" class="font-bold opacity-70">{{ prefix }}:</span>
    <span
      v-for="chip in chips"
      :key="chip.meter"
      class="rounded-md px-2 py-0.5 font-bold"
      :class="
        chip.harmful ? 'bg-error/15 text-error' : 'bg-success/15 text-success'
      "
      >{{ chip.label }}</span
    >
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  HARMFUL_SIGN,
  METER_LABELS,
  METERS,
  type Effects,
} from '~/utils/shiftingDesks/rules'

const props = withDefaults(
  defineProps<{ effects: Effects; prefix?: string }>(),
  {
    prefix: '',
  },
)

const chips = computed(() =>
  METERS.filter((m) => props.effects[m]).map((m) => {
    const v = props.effects[m] as number
    return {
      meter: m,
      harmful: v * HARMFUL_SIGN[m] > 0,
      label: `${v > 0 ? '+' : ''}${v} ${METER_LABELS[m]}`,
    }
  }),
)
</script>
