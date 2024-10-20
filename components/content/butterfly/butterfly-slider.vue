<template>
  <div class="mb-6">
    <label :for="sliderId" class="block mb-2">{{ label }} (Min-Max):</label>

    <div class="relative w-4/5 mx-auto">
      <!-- Range track (static background) -->
      <div class="range-track h-2 bg-gray-300 rounded-full"></div>

      <!-- Range fill (dynamic background) -->
      <div class="range-fill absolute h-2 bg-primary rounded-full" :style="rangeFill"></div>

      <!-- Min slider -->
      <input
        v-model="minValue"
        type="range"
        :min="min"
        :max="max"
        :step="step"
        class="absolute w-full opacity-0 pointer-events-none"
        @input="updateMinValue"
      />

      <!-- Max slider -->
      <input
        v-model="maxValue"
        type="range"
        :min="min"
        :max="max"
        :step="step"
        class="absolute w-full opacity-0 pointer-events-none"
        @input="updateMaxValue"
      />

      <!-- Min Knob -->
      <div
        class="absolute h-6 w-6 bg-primary rounded-full -top-2 cursor-pointer"
        :style="minKnobStyle"
      >
        <div class="absolute -bottom-6 text-center w-full text-sm">{{ minValue }}</div>
      </div>

      <!-- Max Knob -->
      <div
        class="absolute h-6 w-6 bg-primary rounded-full -top-2 cursor-pointer"
        :style="maxKnobStyle"
      >
        <div class="absolute -bottom-6 text-center w-full text-sm">{{ maxValue }}</div>
      </div>

      <!-- Display the overall min and max values outside the track -->
      <div class="flex justify-between mt-4">
        <span>{{ min }}</span>
        <span>{{ max }}</span>
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

// Ensure minValue cannot exceed maxValue
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

// Position the min and max knobs
const minKnobStyle = computed(() => {
  const totalRange = props.max - props.min
  const left = ((minValue.value - props.min) / totalRange) * 100
  return { left: `calc(${left}% - 12px)` } // Centering the knob
})

const maxKnobStyle = computed(() => {
  const totalRange = props.max - props.min
  const left = ((maxValue.value - props.min) / totalRange) * 100
  return { left: `calc(${left}% - 12px)` } // Centering the knob
})

watch(
  () => props.modelValue,
  (newVal) => {
    minValue.value = newVal.min
    maxValue.value = newVal.max
  },
  { immediate: true },
)
</script>
