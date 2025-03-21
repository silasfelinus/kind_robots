<template>
  <header
    class="flex justify-between items-center bg-primary rounded-2xl border p-2 relative flex-wrap gap-2"
  >
    <!-- Home Navigation -->
    <home-link />

    <!-- Layout Selector -->
    <layout-selector class="relative" />

    <!-- Butterfly Toggle -->
    <div class="flex items-center justify-center m-2">
      <butterfly-toggle />
    </div>

    <!-- Title -->
    <h1 class="text-4xl text-default font-bold">Kind Robots</h1>

    <!-- Subtitle Section -->
    <div class="flex flex-col items-center justify-center p-2 m-2 relative">
      <h1 class="text-2xl text-default font-bold">
        {{ subtitle || 'Location: 🌀 Loading...' }}
      </h1>
    </div>

    <!-- Theme Selector -->
    <div class="flex items-center justify-center relative">
      <theme-toggle />
    </div>

    <!-- Screen FX Toggle -->
    <div class="flex items-center justify-center relative">
      <screen-fx />
    </div>
  </header>
</template>

<script setup lang="ts">
import { usePageStore } from '@/stores/pageStore'

const pageStore = usePageStore()
const { subtitle } = storeToRefs(pageStore)
</script>
