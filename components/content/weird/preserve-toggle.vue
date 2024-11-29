<template>
  <div class="flex items-center space-x-2">
    <input
      v-if="showPreserve"
      id="preserveToggle"
      v-model="preserve"
      type="checkbox"
      class="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
    />
    <label
      v-if="showPreserve"
      for="preserveToggle"
      class="text-sm text-gray-600 cursor-pointer"
    >
      Preserve
    </label>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const value = ref('') // Field input value
const preserve = ref(false) // Preserve toggle state

// Automatically toggle "Preserve" based on input
const showPreserve = ref(false)

watch(value, (newValue) => {
  showPreserve.value = !!newValue.trim()
  if (!showPreserve.value) {
    preserve.value = false // Reset preserve if input is cleared
  }
})
</script>
