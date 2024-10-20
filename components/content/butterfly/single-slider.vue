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
          :id="sliderId"
          v-model="currentValue"
          type="range"
          :min="min"
          :max="max"
          :step="step"
          class="w-full slider range range-primary"
          @input="updateValue"
        />
      </div>
    </div>
    <div class="text-center">Chosen {{ label }}: {{ currentValue }}</div>
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
.range-track {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #e0e0e0;
}

.range-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background-color: #3b82f6;
}
</style>
