<template>
  <header
    class="flex justify-between items-center bg-primary rounded-2xl border p-2 relative flex-wrap gap-2"
  >
    <home-link />
    <layout-selector class="relative" />

    <!-- Title -->
    <h1 class="text-4xl text-default font-bold">Kind Robots</h1>

    <!-- Subtitle Display -->
    <div class="flex flex-col items-center justify-center p-2 m-2 relative">
      <h1 class="text-4xl text-default font-bold">
        {{ subtitle || 'Location: 🌀 Loading...' }}
      </h1>
    </div>

    <!-- Theme + Butterfly Toggles -->
    <div class="flex items-center justify-center relative">
      <theme-toggle />
    </div>
    <div class="flex items-center justify-center relative">
      <butterfly-toggle />
    </div>
  </header>
</template>

<script setup lang="ts">
import { usePageStore } from '@/stores/pageStore'

const { subtitle } = storeToRefs(usePageStore())
</script>
