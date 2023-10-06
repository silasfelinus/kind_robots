<template>
  <div class="flex flex-col min-h-screen bg-base-200 overflow-hidden relative">
    <!-- Header -->
    <header
      class="site-header w-full bg-gradient-to-r from-primary to-primary-light text-default shadow-md px-4 py-1 sm:px-6 lg:px-8"
    >
      <div class="container mx-auto flex items-center justify-between">
        <smart-dashboard
          class="flex flex-row bg-gradient-to-r from-primary to-primary-light border rounded-2xl p-2 m-1"
        />
        <bot-selector />
        <screen-fx />
        <avatar-image class="text-xl font-bold" />
      </div>
      <!-- Subtitle -->
      <div class="text-center rounded-2xl border p-2 m-2 shadow-lg">
        <h1 v-if="page.title" class="text-2xl">The {{ page.title }} Room</h1>
        <h1 v-else class="text-2xl">🌈 Fetching details...</h1>
      </div>
    </header>
    <!-- Tooltip Popup -->
    <div>
      <streaming-tooltip v-if="page && page.tooltip" :tooltip="page.tooltip" />
    </div>
    <!-- Main Content -->
    <main>
      <slot class="w-full h-full flex bg-base-200 rounded-2xl p-2 m-2" />
    </main>
    <!-- Footer -->
    <footer class="p-4 bg-gradient-to-r from-primary to-primary-light text-black text-center">
      <sort-nav />
      KindRobots © 2023
    </footer>
  </div>
</template>
<script setup lang="ts">
const { page } = useContent()
useContentHead(page)
</script>
