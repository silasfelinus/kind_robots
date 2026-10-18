<template>
  <span
    role="button"
    tabindex="0"
    class="inline-flex shrink-0 cursor-help items-center gap-1 rounded-lg border border-warning/40 bg-base-100/60 px-1.5 py-0.5 text-[11px] font-bold"
    :title="reading.explain"
    :aria-expanded="open"
    :aria-label="reading.explain"
    @click.stop.prevent="emit('toggle')"
    @keydown.enter.stop.prevent="emit('toggle')"
    @keydown.space.stop.prevent="emit('toggle')"
  >
    <Icon name="kind-icon:dice" class="size-3.5" />
    {{ reading.word }}
    <span class="font-black text-info">{{ reading.need }}</span>
  </span>
</template>

<script setup lang="ts">
import type { CheckReading } from '~/utils/shiftingLands/journey'

defineProps<{ reading: CheckReading; open?: boolean }>()
const emit = defineEmits<{ toggle: [] }>()
</script>
