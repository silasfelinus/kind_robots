<template>
  <div class="flex flex-col justify-center items-center">
    <p class="text-md text-accent">{{ rightLabel }}</p>
    <div class="mt-1 relative w-1 h-64 shadow-sm">
      <input
        id="slider"
        v-model="value"
        type="range"
        step="0.1"
        min="0"
        max="1"
        class="slider bg-accent w-1 h-full overflow-hidden cursor-pointer rounded-full"
        style="transform: rotate(180deg); writing-mode: bt-lr"
      />
    </div>
    <p class="text-md text-accent">{{ leftLabel }}</p>
    <p class="text-sm text-center text-accent">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
import { useBotsStore } from '../../stores/bots'

const botsStore = useBotsStore()

const props = defineProps({
  label: { type: String, default: 'Consistency' },
  leftLabel: { type: String, default: 'Creativity' },
  rightLabel: { type: String, default: 'Consistency' }
})

const value = ref(botsStore.activeBot.temperature)
const descriptions = [
  '1.0: Consistency is Key',
  '0.9: Nearly all consistent.',
  '0.8: Strongly consistent.',
  '0.7: More-or-less dependable',
  '0.6: Consistency takes the lead',
  '0.5: Perfect harmony',
  '0.4: Creativity under control',
  '0.3: Thinking outside the box.',
  '0.2: A little less wild.',
  '0.1: Prone to flights of fancy',
  '0.0: Maximum Creativity!'
]
let currentVal = value.value ? value.value : 0
const description = ref(descriptions[Math.round((1 - currentVal) * 10)])

watch(value, (newValue) => {
  if (newValue !== undefined) {
    botsStore.activeBot.temperature = newValue
    description.value = descriptions[Math.round((1 - newValue) * 10)]
  }
})
</script>

<!-- keep the same style as previous -->
