<template>
  <div
    class="weird-choices bg-warning text-white flex flex-col items-center justify-center rounded-lg h-full"
  >
    <h2 class="text-lg font-bold">Options</h2>
    <ul v-if="choices.length" class="space-y-2 mt-2">
      <li
        v-for="(choice, index) in choices"
        :key="index"
        class="cursor-pointer bg-base-200 text-primary p-2 rounded-md hover:bg-base-300 transition"
        @click="selectChoice(choice)"
      >
        {{ choice }}
      </li>
    </ul>
    <p v-else>No options available</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWeirdStore } from '@/stores/weirdStore'

const weirdStore = useWeirdStore()
const choices = computed(() => weirdStore.currentOptions || [])

const selectChoice = (choice) => {
  weirdStore.processAction(choice)
}
</script>
