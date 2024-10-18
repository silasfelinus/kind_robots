<template>
  <div class="mb-6">
    <label :for="sliderId" class="block mb-2">{{ label }} (Min-Max):</label>
    <div class="flex items-center justify-between mb-2">
      <!-- Displaying min value -->
      <span>{{ min }}</span>
      
      <!-- Range slider -->
      <input
        :id="sliderId"
        v-model="modelValue"
        type="range"
        :min="min"
        :max="max"
        :step="step"
        class="w-4/5 mx-2"
      />
      
      <!-- Displaying max value -->
      <span>{{ max }}</span>
    </div>
    <div class="text-center">
      Chosen {{ label }}: {{ modelValue }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits, computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Number,
    required: true
  },
  label: {
    type: String,
    required: true
  },
  min: {
    type: Number,
    required: true
  },
  max: {
    type: Number,
    required: true
  },
  step: {
    type: Number,
    default: 1
  },
  sliderId: {
    type: String,
    default: 'slider'
  }
})

const emit = defineEmits(['update:modelValue'])

// Emits the updated value to the parent component
const updateValue = (newValue: number) => {
  emit('update:modelValue', newValue)
}
</script>

<style scoped>
/* Style the slider */
input[type='range'] {
  margin: 0;
}
</style>
