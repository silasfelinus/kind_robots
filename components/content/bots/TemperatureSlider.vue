<template>
  <div>
    <!-- Temperature Slider -->
    <div class="mb-6">
      <p class="text-sm text-center text-base-content">
        {{ temperatureDescription }}
      </p>
      <div class="mt-1 relative rounded-md shadow-sm">
        <input
          id="temperature-slider"
          v-model="temperature"
          type="range"
          step="0.1"
          min="0"
          max="1"
          class="slider bg-accent h-1 w-full overflow-hidden cursor-pointer rounded-full"
        />
      </div>
      <p class="text-md text-base-content">Consistency ---- Creativity</p>
    </div>

    <!-- Number of Requests Slider -->
    <div class="mb-6">
      <p class="text-sm text-center text-base-content">
        Number of Requests: {{ numberOfRequests }}
      </p>
      <div class="mt-1 relative rounded-md shadow-sm">
        <input
          id="requests-slider"
          v-model="numberOfRequests"
          type="range"
          step="1"
          min="1"
          max="50"
          class="slider bg-accent h-1 w-full overflow-hidden cursor-pointer rounded-full"
        />
      </div>
      <p class="text-md text-base-content">Few Requests ---- Many Requests</p>
    </div>

    <!-- Max Tokens Slider -->
    <div class="mb-6">
      <p class="text-sm text-center text-base-content">
        Max Tokens: {{ maxTokens }}
      </p>
      <div class="mt-1 relative rounded-md shadow-sm">
        <input
          id="tokens-slider"
          v-model="maxTokens"
          type="range"
          step="25"
          min="25"
          max="1000"
          class="slider bg-accent h-1 w-full overflow-hidden cursor-pointer rounded-full"
        />
      </div>
      <p class="text-md text-base-content">Fewer Tokens ---- More Tokens</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { usePitchStore } from '~/stores/pitchStore'

const pitchStore = usePitchStore()

// Temperature slider bindings
const temperature = computed({
  get: () => pitchStore.temperature,
  set: (value) => (pitchStore.temperature = value),
})

// Descriptions based on temperature levels
const temperatureDescriptions = [
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
  '1.0: Maximum Creativity!',
]
const temperatureDescription = computed(
  () => temperatureDescriptions[Math.round(temperature.value * 10)],
)

// Number of Requests slider bindings
const numberOfRequests = computed({
  get: () => pitchStore.numberOfRequests,
  set: (value) => (pitchStore.numberOfRequests = value),
})

// Max Tokens slider bindings
const maxTokens = computed({
  get: () => pitchStore.maxTokens,
  set: (value) => (pitchStore.maxTokens = value),
})


// Watch for changes to each slider value and save to local storage
watch(temperature, pitchStore.saveStateToLocalStorage)
watch(numberOfRequests, pitchStore.saveStateToLocalStorage)
watch(maxTokens, pitchStore.saveStateToLocalStorage)
</script>

<style scoped>
/* Styling for the slider */
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
  box-shadow:
    1px 1px 1px #000000,
    0px 0px 1px #0d0d0d;
  background: #3071a9;
  border-radius: 1.3px;
  border: 0.2px solid #010101;
}

.slider::-moz-range-track {
  width: 100%;
  height: 16px;
  cursor: pointer;
  transition: 0.2s;
  box-shadow:
    1px 1px 1px #000000,
    0px 0px 1px #0d0d0d;
  background: #3071a9;
  border-radius: 1.3px;
  border: 0.2px solid #010101;
}
</style>
