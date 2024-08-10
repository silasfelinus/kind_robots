<template>
  <div>
    <span
      v-if="!editing"
      @click="enableEditing"
    >{{ value }}</span>
    <input
      v-if="editing"
      v-model="newValue"
      @blur="updateValue"
    >
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const { value, isEditable } = defineProps<{
  value: string
  isEditable: boolean
}>()

const emit = defineEmits<{
  (e: 'update', value: string): void
}>()

const editing = ref(false)
const newValue = ref(value)

const enableEditing = () => {
  if (isEditable) {
    editing.value = true
  }
}

const updateValue = () => {
  emit('update', newValue.value)
  editing.value = false
}
</script>
