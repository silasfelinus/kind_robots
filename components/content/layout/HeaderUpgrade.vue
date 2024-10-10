<template>
  <header
    class="flex items-center h-full justify-between rounded-2xl border-4 p-1 bg-base-300 z-30 max-w-full m-1 box-border"
    :style="{
      height: displayStore.headerHeight + 'vh',
    }"
  >
    <!-- Left Section: Avatar -->
    <div class="flex items-center box-border relative">
      <avatar-image
        alt="User Avatar"
        class="aspect-square min-h-8 min-w-8 rounded-2xl"
        :style="{
          height: '100%', // Fills the available height of the header
        }"
      />

      <!-- Special Overlay: Shows viewportSize from displayStore -->
      <div
        class="absolute top-0 left-10 p-2 text-white bg-primary rounded-lg text-xs md:text-sm lg:text-base"
        style="transform: translateY(-50%)"
      >
        {{ displayStore.viewportSize }}
      </div>
    </div>

    <!-- Middle Section: Title and Subtitle, with flex-grow to take up more space -->
    <div
      class="flex-grow flex flex-col items-center justify-center text-center mx-4 box-border"
    >
      <h1
        class="text-[13px] md:text-[20px] lg:text-[25px] xl:text-[30px] font-semibold text-ellipsis overflow-hidden whitespace-nowrap max-w-full"
      >
        The {{ page.title || 'Room' }} Room
      </h1>
      <h2
        class="text-[12px] md:text-[15px] lg:text-[17px] xl:text-[20px] italic text-ellipsis overflow-hidden whitespace-nowrap max-w-full"
      >
        {{ subtitle }}
      </h2>
    </div>

    <!-- Right Section: Icons and Login -->
    <div class="flex items-center space-x-4 box-border">
      <!-- Login Button -->
      <login-button class="w-full max-w-[120px] box-border" />
      <!-- Theme Icon -->
      <theme-icon class="w-8 h-8 box-border" />
      <!-- Butterfly Toggle Icon -->
      <butterfly-toggle class="w-8 h-8 box-border" />
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
