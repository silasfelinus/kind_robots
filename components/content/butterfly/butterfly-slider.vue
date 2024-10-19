<template>
  <div class="mb-6">
    <label :for="sliderId" class="block mb-2">{{ label }} (Min-Max):</label>
    <div class="relative w-4/5 mx-auto">
      <!-- Range track (static background) -->
      <div class="range-track"></div>

      <!-- Range fill (dynamic background) -->
      <div class="range-fill" :style="rangeFill"></div>

      <!-- Min slider -->
      <input
        v-model="minValue"
        type="range"
        :min="min"
        :max="max"
        :step="step"
        class="absolute w-full min-slider"
        @input="updateMinValue"
        @mousedown="increaseZIndex('min')"
        @touchstart="increaseZIndex('min')"
      />

      <!-- Max slider -->
      <input
        v-model="maxValue"
        type="range"
        :min="min"
        :max="max"
        :step="step"
        class="absolute w-full max-slider"
        @input="updateMaxValue"
        @mousedown="increaseZIndex('max')"
        @touchstart="increaseZIndex('max')"
      />

      <div class="flex justify-between mt-4">
        <!-- Displaying min and max values -->
        <span class="badge badge-info">{{ minValue.toFixed(2) }}</span>
        <span class="badge badge-info">{{ maxValue.toFixed(2) }}</span>
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

// Update the range-fill style dynamically based on min and max values
const rangeFill = computed(() => {
  const totalRange = props.max - props.min
  const minPercent = ((minValue.value - props.min) / totalRange) * 100
  const maxPercent = ((maxValue.value - props.min) / totalRange) * 100

  return {
    left: `${minPercent}%`,
    width: `${maxPercent - minPercent}%`,
  }
})

// Ensure minValue cannot be greater than maxValue
const updateMinValue = () => {
  if (minValue.value > maxValue.value) {
    minValue.value = maxValue.value
  }
  emit('update:modelValue', { min: minValue.value, max: maxValue.value })
}

// Ensure maxValue cannot be less than minValue
const updateMaxValue = () => {
  if (maxValue.value < minValue.value) {
    maxValue.value = minValue.value
  }
  emit('update:modelValue', { min: minValue.value, max: maxValue.value })
}

const increaseZIndex = (slider: string) => {
  activeSlider.value = slider
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
/* Track for the range slider */
.range-track {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 8px;
  background: var(--daisyui-colors-base-300, #ddd);
  border-radius: 5px;
  transform: translateY(-50%);
  z-index: 1;
}

/* Highlighted range between min and max */
.min-slider {
  z-index: 2;
  pointer-events: none;
  /* Hide the bar but keep the knob */
  appearance: none;
  position: relative;
  background: transparent;
}

.max-slider {
  z-index: 3;
  pointer-events: none;
  /* Hide the bar but keep the knob */
  appearance: none;
  position: relative;
  background: transparent;
}

/* Grabbable knobs (circular) */
input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  background-color: var(--daisyui-colors-primary, #4a90e2);
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid var(--daisyui-colors-base-100, #fff);
  z-index: 4;
}

input[type='range']::-moz-range-thumb {
  width: 24px;
  height: 24px;
  background-color: var(--daisyui-colors-primary, #4a90e2);
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid var(--daisyui-colors-base-100, #fff);
  z-index: 4;
}

.range-fill {
  position: absolute;
  top: 50%;
  height: 8px;
  background-color: var(--daisyui-colors-primary, #4a90e2);
  border-radius: 5px;
  z-index: 2;
  transform: translateY(-50%);
  transition:
    left 0.2s,
    width 0.2s;
}
</style>
