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
        :style="minSliderStyle"
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
        :style="maxSliderStyle"
        @input="updateMaxValue"
        @mousedown="increaseZIndex('max')"
        @touchstart="increaseZIndex('max')"
      />

      <!-- Min and Max handle UI (circles with vertical lines when close together) -->
      <div
        v-if="areValuesClose"
        class="absolute w-full flex justify-between pointer-events-none"
      >
        <!-- Min circle handle -->
        <div class="absolute flex justify-center" :style="minHandleStyle">
          <div class="w-5 h-5 rounded-full bg-primary"></div>
          <div class="w-1 h-8 bg-primary"></div>
        </div>

        <!-- Max circle handle -->
        <div class="absolute flex justify-center" :style="maxHandleStyle">
          <div class="w-1 h-8 bg-primary"></div>
          <div class="w-5 h-5 rounded-full bg-primary"></div>
        </div>
      </div>

      <!-- Display min and max values below the slider -->
      <div class="flex justify-between mt-4">
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

// Styles for sliders when active (z-index handling)
const minSliderStyle = computed(() => ({
  zIndex: activeSlider.value === 'min' ? 4 : 3,
}))

const maxSliderStyle = computed(() => ({
  zIndex: activeSlider.value === 'max' ? 4 : 3,
}))

// Styles for the handle UI when the values are close
const areValuesClose = computed(() => {
  return Math.abs(minValue.value - maxValue.value) < 5
})

const minHandleStyle = computed(() => ({
  left: `${((minValue.value - props.min) / (props.max - props.min)) * 100}%`,
  bottom: areValuesClose.value ? '-30px' : '0',
}))

const maxHandleStyle = computed(() => ({
  left: `${((maxValue.value - props.min) / (props.max - props.min)) * 100}%`,
  top: areValuesClose.value ? '-30px' : '0',
}))

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

// Increase z-index for the active slider when dragging
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
