<template>
  <div class="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
    <h3 class="text-lg font-semibold mb-2">{{ botName }} is typing...</h3>
    <div v-if="isTyping" class="animate-pulse">
      <span class="text-gray-500 dark:text-gray-300">...</span>
    </div>
    <div class="mt-2 space-y-2">
      <p v-for="(word, index) in parsedResponses" :key="index" class="inline-block">
        <span class="text-gray-700 dark:text-gray-100">{{ word }}</span>
        <span class="text-gray-500 dark:text-gray-300">.</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'

const props = defineProps({
  responses: {
    type: String,
    required: true
  },
  botName: {
    type: String,
    default: 'Bot'
  }
})

let isTyping = ref(true)

let parsedResponses = ref([])

watch(
  () => props.responses,
  (newVal, oldVal) => {
    if (newVal !== oldVal) {
      isTyping.value = true
      let data = JSON.parse(newVal).choices[0].text.trim().split(' ')
      parsedResponses.value = data
    }
  },
  { immediate: true }
)

onMounted(async () => {
  await nextTick()
  isTyping.value = false
})
</script>
