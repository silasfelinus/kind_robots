<template>
  <div class="flex flex-col items-center w-full">
    <!-- Label and Min/Max Values -->
    <label :for="sliderId" class="mb-4 text-lg font-semibold text-gray-700">
      {{ label }}: {{ minValue }} - {{ maxValue }}
    </label>

    <div class="relative w-full">
      <!-- Grey Slider Track -->
      <div class="h-2 bg-gray-200 rounded-full"></div>

      <!-- Range Fill Line (colored bg-primary) -->
      <div
        class="absolute top-0 h-2 bg-primary rounded-full"
        :style="{ left: rangeFill.left, width: rangeFill.width }"
      ></div>

      <!-- Min Knob -->
      <input
        v-model="minValue"
        type="range"
        :min="props.min"
        :max="props.max"
        :step="props.step"
        class="absolute w-full h-6 appearance-none pointer-events-none"
        @input="updateMinValue"
      />
      <div
        class="absolute w-6 h-6 bg-white border-2 border-primary rounded-full pointer-events-auto transition-all duration-200"
        :style="minKnobStyle"
        @mouseenter="showMinTooltip = true"
        @mouseleave="showMinTooltip = false"
      ></div>

      <!-- Min Knob Tooltip on Hover -->
      <div
        v-if="showMinTooltip"
        class="absolute px-2 py-1 text-white bg-gray-700 rounded-md -translate-x-1/2 transform -top-8"
        :style="minKnobStyle"
      >
        {{ minValue }}
      </div>

      <!-- Max Knob -->
      <input
        v-model="maxValue"
        type="range"
        :min="props.min"
        :max="props.max"
        :step="props.step"
        class="absolute w-full h-6 appearance-none pointer-events-none"
        @input="updateMaxValue"
      />
      <div
        class="absolute w-6 h-6 bg-white border-2 border-primary rounded-full pointer-events-auto transition-all duration-200"
        :style="maxKnobStyle"
        @mouseenter="showMaxTooltip = true"
        @mouseleave="showMaxTooltip = false"
      ></div>

      <!-- Max Knob Tooltip on Hover -->
      <div
        v-if="showMaxTooltip"
        class="absolute px-2 py-1 text-white bg-gray-700 rounded-md -translate-x-1/2 transform -top-8"
        :style="maxKnobStyle"
      >
        {{ maxValue }}
      </div>

      <!-- Min/Max Value Markers -->
      <div class="absolute -left-6 top-4 text-gray-600">{{ props.min }}</div>
      <div class="absolute -right-6 top-4 text-gray-600">{{ props.max }}</div>
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
const showMinTooltip = ref(false)
const showMaxTooltip = ref(false)

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
  return { left: `calc(${left}% - 12px)` } // Adjusted for larger knob
})

const maxKnobStyle = computed(() => {
  const totalRange = props.max - props.min
  const left = ((maxValue.value - props.min) / totalRange) * 100
  return { left: `calc(${left}% - 12px)` } // Adjusted for larger knob
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
