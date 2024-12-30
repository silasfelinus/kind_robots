<template>
  <div
    class="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl p-6 shadow-lg flex flex-col items-center justify-center cursor-pointer transform hover:scale-105 transition-transform duration-300 ease-in-out"
    @click="testStore"
  >
    <div class="text-center">
      <p class="text-xl font-bold mb-2">{{ label }}</p>
      <p
        v-if="status"
        :class="status === 'success' ? 'text-green-400' : 'text-red-400'"
      >
        {{ status === 'success' ? '✅ Success' : '❌ Failed' }}
      </p>
      <ul v-if="errors.length > 0" class="text-red-500 mt-2">
        <li v-for="(error, index) in errors" :key="index">{{ error }}</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface StoreTestProps {
  label: string
  loadStore: () => Promise<unknown>
}

const props = defineProps<StoreTestProps>()

const status = ref<'' | 'success' | 'failed'>('')
const errors = ref<string[]>([])

const testStore = async () => {
  try {
    await props.loadStore()
    status.value = 'success'
    errors.value = [] // Clear errors on success
  } catch (error: unknown) {
    status.value = 'failed'
    console.error(error) // Log error for debugging
    if (error instanceof Error) {
      errors.value.push(error.message)
    } else {
      errors.value.push(String(error))
    }
  }
}
</script>
