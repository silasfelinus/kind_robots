<template>
  <div class="mb-6">
    <label :for="sliderId" class="block mb-2">{{ label }} (Min-Max):</label>
    <div class="flex items-center justify-between mb-2">
      <!-- Displaying min value -->
      <span>{{ minValue }}</span>

      <!-- Dual range slider -->
      <div class="relative w-4/5 mx-2">
        <input
          type="range"
          :min="min"
          :max="max"
          :step="step"
          v-model="minValue"
          class="absolute w-full slider-thumb"
          @input="updateMinValue"
        />
        <input
          type="range"
          :min="min"
          :max="max"
          :step="step"
          v-model="maxValue"
          class="absolute w-full slider-thumb"
          @input="updateMaxValue"
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

// Sync props with internal state if they change
watch(
  () => props.modelValue,
  (newVal) => {
    minValue.value = newVal.min
    maxValue.value = newVal.max
  },
  { immediate: true }
)
</script>

<style scoped>
/* Basic styles for dual-range slider */
.slider-thumb {
  appearance: none;
  background: transparent;
  position: relative;
  z-index: 1;
  pointer-events: none;
}

input[type='range'] {
  pointer-events: all;
  z-index: 2;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  -webkit-appearance: none;
  background-color: transparent;
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  background-color: #4a90e2;
  height: 15px;
  width: 15px;
  border-radius: 50%;
  cursor: pointer;
}
</style>
