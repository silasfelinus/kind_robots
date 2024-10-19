<template>
  <header
    class="flex items-center h-full justify-between bg-base-300 rounded-2xl border-4 p-1 z-30 max-w-full box-border"
    :style="{
      height: displayStore.headerHeight,
    }"
  >
    <!-- Left Section: Avatar -->
    <div class="flex items-center box-border relative">
      <avatar-image
        alt="User Avatar"
        class="aspect-square rounded-xl max-w-15%"
        :style="{
          height: '100%', // Fills the available height of the header
        }"
      />

      <!-- Special Overlay: Shows viewportSize from displayStore -->
      <div
        class="fixed bottom-1 left-1/2 text-white bg-primary rounded-lg text-xs md:text-sm lg:text-base"
      >
        {{ displayStore.viewportSize }}
      </div>
    </div>

    <!-- Second Section: Title and Subtitle, with flex-grow to take up more space -->
    <div
      class="max-w-40% flex-grow flex flex-col items-center justify-center text-center mx-1 box-border"
    >
      <h1
        class="text-xs md:text-sm lg:text-md xl:text-xl font-semibold text-ellipsis overflow-hidden whitespace-nowrap max-w-full"
      >
        The {{ page.title || 'Room' }} Room
      </h1>
      <h2
        class="text-xs md:text-sm lg:text-lg xl:text-xl italic text-ellipsis overflow-hidden whitespace-nowrap max-w-full"
      >
        {{ subtitle }}
      </h2>
    </div>

    <!-- Right Section: Icons and Login -->
    <div class="w-50% flex items-center space-x-1 box-border">
      <!-- Login Button -->
      <login-path class="w-1/3 h-100% box-border" />
      <!-- Theme Icon -->
      <theme-icon class="w-1/3 h-100%  box-border" />
      <!-- Butterfly Toggle Icon -->
      <swarm-icon class="w-1/3 h-100% box-border" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access display store
const displayStore = useDisplayStore()

// Access page content and subtitle
const { page } = useContent()
const subtitle = computed(
  () => page.value?.subtitle ?? 'Welcome to Kind Robots',
)
</script>
