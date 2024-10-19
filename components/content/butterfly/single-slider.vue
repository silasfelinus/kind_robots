<template>
  <div class="mb-6">
    <label :for="sliderId" class="block mb-2">{{ label }}:</label>
    <div class="flex items-center justify-between mb-2">
      <!-- Displaying current value -->
      <span>{{ currentValue }}</span>

      <!-- Single range slider -->
      <div class="relative w-4/5 mx-2">
        <!-- Range track (static background) -->
        <div class="range-track"></div>

        <!-- Range fill (dynamic background) -->
        <div class="range-fill" :style="rangeFill"></div>

        <!-- Slider input -->
        <input
          v-model="currentValue"
          type="range"
          :min="min"
          :max="max"
          :step="step"
          class="w-full slider"
          @input="updateValue"
        />
      </div>
    </div>
    <div class="text-center">
      Chosen {{ label }}: {{ currentValue.toFixed(2) }}
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  step: { type: Number, default: 1 },
  modelValue: { type: Number, required: true },
  label: { type: String, required: true },
  sliderId: { type: String, default: 'slider' },
})

const emit = defineEmits(['update:modelValue'])

const currentValue = ref(props.modelValue)

const rangeFill = computed(() => {
  const totalRange = props.max - props.min
  const valuePercent = ((currentValue.value - props.min) / totalRange) * 100
  return {
    width: `${valuePercent}%`,
  }
})

const updateValue = () => {
  emit('update:modelValue', currentValue.value)
}

watch(
  () => props.modelValue,
  (newVal) => {
    currentValue.value = newVal
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

/* Dynamic fill for selected range */
.range-fill {
  position: absolute;
  top: 50%;
  height: 8px;
  background-color: var(--daisyui-colors-primary, #4a90e2);
  border-radius: 5px;
  z-index: 2;
  transform: translateY(-50%);
}

/* Slider input styling */
input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 10px;
  background: transparent; /* The range track is managed by .range-track */
  position: relative;
  z-index: 3;
}

/* Grabbable slider knob (circular) */
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
</style>
