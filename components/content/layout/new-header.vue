<template>
  <header
    class="flex flex-col items-center p-2 bg-base-400 rounded-2xl border-8 border-accent m-2 relative"
  >
    <!-- Top Navigation -->
    <div class="flex justify-between items-center w-full">
      <home-link />
      <layout-selector class="relative" />
      <h1 class="text-4xl text-default font-bold">Welcome to Kind Robots</h1>
      <theme-toggle />
      <butterfly-toggle class="mr-2" />
    </div>

    <!-- Location & Subtitle -->
    <div
      class="flex flex-col items-center justify-center bg-secondary p-2 rounded-2xl border-8 border-accent m-2 relative w-full"
    >
      <h1 class="text-4xl text-default font-bold">
        Location: {{ title || '🌀 Loading...' }}
      </h1>
      <h2
        class="text-2xl"
        :class="subtitle ? 'text-default' : 'text-accent'"
      >
        {{ subtitle || '🌈 Fetching details...' }}
      </h2>
    </div>

    <!-- Screen FX -->
    <div class="flex justify-center items-center m-2 relative w-full">
      <screen-fx />
    </div>
  </header>
</template>

<script setup lang="ts">
import { usePageStore } from '@/stores/pageStore'

const { title, subtitle } = storeToRefs(usePageStore())
</script>

<style scoped>
/* Flip card transition */
.flip-card-enter-active,
.flip-card-leave-active {
  transition: transform 1s;
}
.flip-card-enter,
.flip-card-leave-to {
  transform: rotateY(180deg);
}
</style>
