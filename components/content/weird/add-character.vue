<template>
  <div
    class="rounded-2xl border p-2 md:p-4 mx-auto bg-base-200 grid gap-1 md:gap-4 grid-cols-1"
  >
    <h1
      class="text-lg md:text-2xl lg:text-3xl xl:4xl text-center col-span-full"
    >
      Character Designer
    </h1>

    <!-- Top Section -->
    <div
      class="flex flex-wrap justify-between items-center col-span-full gap-1 md:gap-4"
    >
      <character-title />
    </div>

    <!-- Middle Section -->
    <div class="flex flex-wrap w-full mt-1 md:mt-4">
      <!-- Left: Art Section -->
      <div class="w-full md:w-1/2 p-1 md:p-4">
        <character-art />
      </div>

      <!-- Right: Stats Section -->
      <div class="w-full md:w-1/2 p-1 md:p-4">
        <character-stats />
        <character-rewards />
      </div>
    </div>

    <!-- Bottom Section -->
    <div class="grid gap-1 md:gap-4 mt-1 md:mt-2 lg:mt-3">
      <character-bottom />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useCharacterStore } from '@/stores/characterStore'

const characterStore = useCharacterStore()

onMounted(() => {
  characterStore.generateRandomCharacter()
})
</script>
