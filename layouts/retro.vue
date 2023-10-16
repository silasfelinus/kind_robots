<template>
  <div class="flex flex-col min-h-screen bg-base-200">
    <!-- Header -->
    <header
      class="site-header w-full bg-gradient-to-r from-primary to-primary-light text-default shadow-lg p-4 mb-2"
    >
      <div class="flex justify-between items-center">
        <new-dashboard class="w-full md:w-auto flex-shrink-0" />
        <!-- Subtitle -->
        <room-title class="text-xl md:text-2xl ml-2" />
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-grow">
      <slot class="w-full h-full flex bg-base-200 rounded-2xl p-1 m-1" />
    </main>

    <!-- Random Link -->
    <random-link class="flex-shrink-0 mb-2" />

    <!-- Footer -->
    <footer class="p-4 bg-secondary text-default text-center flex-shrink-0">
      <sort-nav />
      <streaming-tooltip
        v-if="page.tooltip && page.amitip"
        :tooltip="page.tooltip"
        :amitip="page.amitip"
      />
    </footer>
  </div>
</template>

<script setup lang="ts">
const { page } = useContent()
</script>
