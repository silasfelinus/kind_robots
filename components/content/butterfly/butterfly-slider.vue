<template>
  <div class="mb-6">
    <label :for="sliderId" class="block mb-2">{{ label }} (Min-Max):</label>
    <div class="flex items-center justify-between mb-2">
      <!-- Displaying min value -->
      <span>{{ minValue }}</span>

      <!-- Dual range slider -->
      <div class="relative w-4/5 mx-2">
        <!-- Min range slider -->
        <input
          v-model="minValue"
          type="range"
          :min="min"
          :max="max"
          :step="step"
          class="absolute w-full z-10 min-slider"
          @input="updateMinValue"
          @mousedown="increaseZIndex('min')"
          @touchstart="increaseZIndex('min')"
        />
        <!-- Max range slider -->
        <input
          v-model="maxValue"
          type="range"
          :min="min"
          :max="max"
          :step="step"
          class="absolute w-full z-20 max-slider"
          @input="updateMaxValue"
          @mousedown="increaseZIndex('max')"
          @touchstart="increaseZIndex('max')"
        />
      </div>

      <!-- Displaying max value -->
      <span>{{ maxValue }}</span>
    </div>
    <div class="text-center">
      Chosen {{ label }} Range: {{ minValue }} - {{ maxValue }}
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  step: { type: Number, default: 1 },
  modelValue: { type: Object, required: true },
  label: { type: String, required: true },
  sliderId: { type: String, default: 'slider' },
})

const emit = defineEmits(['update:modelValue'])

const minValue = ref(props.modelValue.min)
const maxValue = ref(props.modelValue.max)
const activeSlider = ref('')

const updateMinValue = () => {
  if (minValue.value > maxValue.value) {
    minValue.value = maxValue.value
  }
  emit('update:modelValue', { min: minValue.value, max: maxValue.value })
}

const updateMaxValue = () => {
  if (maxValue.value < minValue.value) {
    maxValue.value = minValue.value
  }
  emit('update:modelValue', { min: minValue.value, max: maxValue.value })
}

const increaseZIndex = (slider: string) => {
  if (slider === 'min') {
    activeSlider.value = 'min'
  } else if (slider === 'max') {
    activeSlider.value = 'max'
  }
}

watch(
  () => props.modelValue,
  (newVal) => {
    minValue.value = newVal.min
    maxValue.value = newVal.max
  },
  { immediate: true },
)
</script>

<style scoped>
input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 10px;
  background: #ddd;
  border-radius: 5px;
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 25px;
  height: 25px;
  background-color: #4a90e2;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #fff;
}

input[type='range']::-moz-range-thumb {
  width: 25px;
  height: 25px;
  background-color: #4a90e2;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid #fff;
}

.min-slider {
  z-index: 10;
}

.max-slider {
  z-index: 20;
}

input[type='range']:active {
  z-index: 30;
}
</style>
