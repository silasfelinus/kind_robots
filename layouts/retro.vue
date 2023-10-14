<template>
  <div class="flex flex-col bg-base-200">
    <!-- Header -->
    <header
      class="site-header w-full bg-gradient-to-r from-primary to-primary-light text-default shadow-md px-4 py-1 sm:px-6 lg:px-8"
    >
      <new-dashboard />
    </header>
    <!-- Main Content -->
    <main>
      <slot class="w-full h-full flex bg-base-200 rounded-2xl p-2 m-2" />
    </main>
    <random-link />
    <!-- Footer -->
    <footer class="p-4 bg-gradient-to-r from-primary to-primary-light text-black text-center">
      <sort-nav />
      <!-- Tooltip Popup -->
      <div>
        <streaming-tooltip v-if="page && page.tooltip" :tooltip="page.tooltip" />
      </div>
      <!-- Subtitle -->
      <room-title />
      KindRobots © 2023
    </footer>
  </div>
</template>
<script setup lang="ts">
const { page } = useContent()
</script>
