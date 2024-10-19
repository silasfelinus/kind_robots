<template>
  <div class="mb-6">
    <label :for="sliderId" class="block mb-2">{{ label }}:</label>
    <div class="flex items-center justify-between mb-2">
      <!-- Displaying current value -->
      <span>{{ currentValue }}</span>

      <!-- Single range slider -->
      <div class="relative w-4/5 mx-2">
        <!-- Range slider -->
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
      Chosen {{ label }}: {{ currentValue }}
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
</style>
