<template>
  <div>
    <p class="text-sm text-center text-accent">{{ description }}</p>
    <div class="mt-1 relative rounded-md shadow-sm">
      <input
        id="slider"
        v-model="value"
        type="range"
        step="0.1"
        min="0"
        max="1"
        class="slider bg-accent h-1 w-full overflow-hidden cursor-pointer rounded-full"
      />
    </div>
    <p class="text-md text-accent">{{ leftLabel }} --------- {{ rightLabel }}</p>
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
  '0.0: Maximum Creativity!',
  '0.1: Prone to flights of fancy',
  '0.2: A little less wild.',
  '0.3: Thinking outside the box.',
  '0.4: Creativity under control',
  '0.5: Perfect harmony',
  '0.6: Consistency takes the lead',
  '0.7: More-or-less dependable',
  '0.8: Strongly consistent.',
  '0.9: Nearly all consistent.',
  '1.0: Consistency is Key'
]
let currentVal = value.value ? value.value : 0
const description = ref(descriptions[Math.round(currentVal * 10)])

watch(value, (newValue) => {
  if (newValue !== undefined) {
    botsStore.activeBot.temperature = newValue
    description.value = descriptions[Math.round(newValue * 10)]
  }
})
</script>

<style scoped>
.slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 16px;
  border-radius: 5px;
  background: #d3d3d3;
  outline: none;
  opacity: 0.7;
  -webkit-transition: 0.2s;
  transition: opacity 0.2s;
}

.slider:hover {
  opacity: 1;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #4caf50;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #4caf50;
  cursor: pointer;
}

.slider::-webkit-slider-runnable-track {
  width: 100%;
  height: 16px;
  cursor: pointer;
  transition: 0.2s;
  box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
  background: #3071a9;
  border-radius: 1.3px;
  border: 0.2px solid #010101;
}

.slider::-moz-range-track {
  width: 100%;
  height: 16px;
  cursor: pointer;
  transition: 0.2s;
  box-shadow: 1px 1px 1px #000000, 0px 0px 1px #0d0d0d;
  background: #3071a9;
  border-radius: 1.3px;
  border: 0.2px solid #010101;
}
</style>
