<template>
  <div
    class="weird-art bg-accent text-white flex items-center justify-center rounded-lg h-full"
  >
    <div class="flex flex-col items-center">
      <img
        v-if="currentArt"
        :src="currentArt"
        alt="Weird Art"
        class="rounded-md shadow-lg object-cover h-32 w-32"
      />
      <p v-else>No Art Available</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useWeirdStore } from '@/stores/weirdStore'

const weirdStore = useWeirdStore()
const currentArt = computed(() => weirdStore.artImage)
</script>
