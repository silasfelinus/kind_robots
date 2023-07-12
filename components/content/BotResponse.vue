<template>
  <div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
    <h3 class="text-lg font-semibold mb-2">Responses</h3>
    <div class="mt-2 space-y-2">
      <p v-for="(response, index) in parsedResponses" :key="index" class="inline-block">
        <span class="text-gray-700 dark:text-gray-100">{{ response }}</span>
      </p>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps({
  responses: {
    type: String,
    required: true
  }
})

let parsedResponses = ref([])

watch(
  () => props.responses,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      let data = JSON.parse(newVal).choices.map((choice: any) => choice.text.trim())
      parsedResponses.value = data
    }
  },
  { immediate: true }
)
</script>
