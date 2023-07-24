<template>
  <div>
    <p class="text-sm text-center text-base-content">{{ description }}</p>
    <div class="mt-1 relative rounded-md shadow-sm">
      <input
        id="slider"
        v-model="temperature"
        type="range"
        step="0.1"
        min="0"
        max="1"
        class="slider bg-accent h-1 w-full overflow-hidden cursor-pointer rounded-full"
      />
    </div>
    <p class="text-md text-base-content">{{ leftLabel }} ---- {{ rightLabel }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'

const props = defineProps({
  label: { type: String, default: 'Temperature' },
  leftLabel: { type: String, default: 'Consistency' },
  rightLabel: { type: String, default: 'Creativity' }
})

const temperature = ref()
const descriptions = [
  '0.0: Consistently Consistent',
  '0.1: Nearly consistent.',
  '0.2: Strongly consistent.',
  '0.3: More-or-less dependable',
  '0.4: Consistency takes the lead',
  '0.5: Perfect harmony',
  '0.6: Dabbles in Creativity',
  '0.7: Thinks Outside the Box.',
  '0.8: A Little Bit Wild.',
  '0.9: Prone to Flights of Fancy',
  '1.0: Maximum Creativity!'
]
const description = ref('')

watchEffect(() => {
  description.value = descriptions[Math.round(temperature.value * 10)]
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
