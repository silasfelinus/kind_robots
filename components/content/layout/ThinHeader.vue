<template>
  <header
    class="flex justify-between items-center bg-primary rounded-2xl border p-2 relative"
  >
    <home-link />
    <layout-selector class="relative" />

    <!-- Title and Subtitle -->
    <h1 class="text-4xl text-default font-bold">Kind Robots</h1>
    <div class="flex flex-col items-center justify-center p-2 m-2 relative">
      <!-- Conditional rendering for title -->
      <h1 v-if="page.subtitle" class="text-4xl text-default font-bold">
        {{ page.subtitle }}
      </h1>
      <h1 v-else class="text-4xl text-default font-bold">
        Location: 🌀 Loading...
      </h1>
    </div>

    <!-- Theme Selector -->
    <div class="flex items-center justify-center relative">
      <theme-toggle />
    </div>

    <!-- Butterfly Toggle -->
    <div class="flex items-center justify-center relative">
      <butterfly-toggle />
    </div>
  </header>
</template>

<script setup lang="ts">
const { page } = useContent()
</script>
