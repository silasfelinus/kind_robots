<template>
  <div
    class="weird-adventure bg-secondary text-white flex flex-col items-center justify-start p-4 rounded-lg h-full overflow-y-auto"
  >
    <h2 class="text-lg font-bold">Adventure Log</h2>
    <ul class="space-y-2 mt-2">
      <li
        v-for="(entry, index) in adventureLog"
        :key="index"
        class="bg-base-200 text-base-content p-2 rounded-md shadow"
      >
        <strong>{{ entry.sender }}:</strong> {{ entry.content }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWeirdStore } from '@/stores/weirdStore'

const weirdStore = useWeirdStore()
const adventureLog = computed(() => weirdStore.history)
</script>
