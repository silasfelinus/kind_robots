<template>
  <div class="mb-6">
    <label :for="sliderId" class="block mb-2">{{ label }} (Min-Max):</label>
    <div class="flex items-center justify-between mb-2 relative">
      <!-- Displaying min value -->
      <span class="badge badge-info">{{ minValue }}</span>

      <!-- Dual range slider with min slider visually lower -->
      <div class="relative w-4/5 mx-2">
        <!-- Min range slider (lower than normal) -->
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

        <!-- Max range slider (normal alignment) -->
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
      <span class="badge badge-info">{{ maxValue }}</span>
    </div>
    <div class="text-center">
      Chosen {{ label }} Range: <span class="badge">{{ minValue }}</span> - <span class="badge">{{ maxValue }}</span>
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

// Ensure minValue cannot be greater than maxValue (but can be equal)
const updateMinValue = () => {
  if (minValue.value > maxValue.value) {
    minValue.value = maxValue.value
  }
  emit('update:modelValue', { min: minValue.value, max: maxValue.value })
}

// Ensure maxValue cannot be less than minValue (but can be equal)
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
.range {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 12px;
  background: var(--daisyui-colors-base-300, #ddd);
  border-radius: 6px;
}

/* Custom style for min slider, positioned below */
.min-slider {
  position: relative;
  top: 25px; /* Move the min slider below the normal slider */
  z-index: 10;
}

.max-slider {
  z-index: 20;
}

.range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background-color: var(--daisyui-colors-primary, #4a90e2);
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid var(--daisyui-colors-base-100, #fff);
}

.range.range-secondary::-webkit-slider-thumb {
  background-color: var(--daisyui-colors-secondary, #f6d860);
}

.range::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background-color: var(--daisyui-colors-primary, #4a90e2);
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid var(--daisyui-colors-base-100, #fff);
}

.range.range-secondary::-moz-range-thumb {
  background-color: var(--daisyui-colors-secondary, #f6d860);
}
</style>
