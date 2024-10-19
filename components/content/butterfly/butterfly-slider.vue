<template>
  <div class="mb-6">
    <label :for="sliderId" class="block mb-2">{{ label }} (Min-Max):</label>
    <div class="relative w-4/5 mx-auto">
      <!-- Single slider bar with two knobs -->
      <div class="relative">
        <!-- Min slider (knob visually below the bar) -->
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

        <!-- Max slider (aligned with the bar) -->
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

      <div class="flex justify-between mt-4">
        <!-- Displaying min and max values below the slider -->
        <span class="badge badge-info">{{ minValue }}</span>
        <span class="badge badge-info">{{ maxValue }}</span>
      </div>
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

/* Styling for the min slider knob (below the bar) */
.min-slider {
  position: relative;
  top: 20px; /* Move it visually below the slider */
  z-index: 10;
}

/* Styling for the max slider knob (aligned with the slider bar) */
.max-slider {
  position: relative;
  z-index: 20;
}

/* DaisyUI style for the slider knobs */
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
