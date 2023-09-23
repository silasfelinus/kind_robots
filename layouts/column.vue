<template>
  <div class="flex flex-col min-h-screen bg-base-100 overflow-hidden relative">
    <!-- Header -->
    <header
      class="site-header w-full bg-gradient-to-r from-primary to-primary-light text-default shadow-md px-4 py-1 sm:px-6 lg:px-8"
    >
      <div class="container mx-auto flex items-center justify-between">
        <smart-dashboard
          class="flex flex-row bg-gradient-to-r from-primary to-primary-light border rounded-2xl p-2 m-1"
        />
        <bot-selector />
        <theme-toggle />
        <avatar-image class="text-xl font-bold" />
        <nav class="space-x-4">
          <!-- AMI Link -->
          <ami-link class="z-190 fixed bottom-4 right-4 md:relative md:bottom-auto md:right-auto" />
        </nav>
      </div>
    </header>
    <!-- Main Content -->
    <main>
      <slot />
    </main>
    <!-- Footer -->
    <footer class="p-4 bg-gradient-to-r from-primary to-primary-light text-black text-center">
      <sort-nav />
      KindRobots © 2023
      <screen-fx />
    </footer>

    <!-- Tooltip Popup -->
    <div>
      <streaming-tooltip :tooltip="page.tooltip" />
    </div>
  </div>
</template>
<script setup lang="ts">
const { page } = useContent()
useContentHead(page)
</script>
