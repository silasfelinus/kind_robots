<template>
  <div class="mb-6">
    <label :for="sliderId" class="block mb-2">{{ label }} (Min-Max):</label>
    <div class="flex items-center justify-between mb-2">
      <!-- Displaying min value -->
      <span>{{ modelValue.min }}</span>

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
        />
      </div>

      <!-- Displaying max value -->
      <span>{{ modelValue.max }}</span>
    </div>
    <div class="text-center">
      Chosen {{ label }} Range: {{ minValue }} - {{ maxValue }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

// Props for min, max, step, and label values
const props = defineProps({
  min: {
    type: Number,
    required: true,
  },
  max: {
    type: Number,
    required: true,
  },
  step: {
    type: Number,
    default: 1,
  },
  modelValue: {
    type: Object,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  sliderId: {
    type: String,
    default: 'slider',
  },
})

// Emit updated values to parent
const emit = defineEmits(['update:modelValue'])

// Internal state for the min and max values
const minValue = ref(props.modelValue.min)
const maxValue = ref(props.modelValue.max)

// Emit updated values when min or max is changed
const updateMinValue = () => {
  if (minValue.value > maxValue.value) {
    // Seamlessly swap min and max values if min exceeds max
    ;[minValue.value, maxValue.value] = [maxValue.value, minValue.value]
  }
  emit('update:modelValue', { min: minValue.value, max: maxValue.value })
}

const updateMaxValue = () => {
  if (maxValue.value < minValue.value) {
    // Seamlessly swap min and max values if max is lower than min
    ;[minValue.value, maxValue.value] = [maxValue.value, minValue.value]
  }
  emit('update:modelValue', { min: minValue.value, max: maxValue.value })
}

// Sync props with internal state if they change
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
/* Basic styles for dual-range slider */
input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 5px;
  background: #ddd;
  border-radius: 5px;
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 15px;
  height: 15px;
  background-color: #4a90e2;
  border-radius: 50%;
  cursor: pointer;
}

input[type='range']::-moz-range-thumb {
  width: 15px;
  height: 15px;
  background-color: #4a90e2;
  border-radius: 50%;
  cursor: pointer;
}

.min-slider {
  z-index: 10;
}

.max-slider {
  z-index: 20;
}
</style>
