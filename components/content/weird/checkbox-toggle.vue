<template>
  <div class="flex items-center space-x-2">
    <input
      v-model="checked"
      type="checkbox"
      class="checkbox checkbox-primary"
      :title="title"
      @change="emitChange"
    />
    <label>{{ label }}</label>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    default: 'Toggle this field',
  },
})

// Emits
const emit = defineEmits(['update:modelValue'])

// Computed property for checkbox state
const checked = computed({
  get: () => props.modelValue, // Access `modelValue` from `props`
  set: (value: boolean) => emit('update:modelValue', value),
})

// Emit value change (optional)
function emitChange() {
  emit('update:modelValue', checked.value)
}
</script>
