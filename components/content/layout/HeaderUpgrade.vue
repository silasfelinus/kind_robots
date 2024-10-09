<template>
  <header
    class="grid grid-cols-4 items-center fixed rounded-2xl border-1 border-accent p-2 bg-base-300 z-20 mx-2 my-2 max-w-full"
    :style="{
      height: displayStore.headerHeight + 'vh',
    }"
  >
    <!-- Column 1: Avatar Image -->
    <div class="flex items-center justify-start">
      <avatar-image
        alt="User Avatar"
        class="aspect-square min-h-8 min-w-8 rounded-2xl flex-shrink-0"
        :style="{
          height: '100%', // Fills the available height of the header
        }"
      />
    </div>

    <!-- Column 2: Title and Subtitle -->
    <div class="flex flex-col text-center">
      <h1
        class="text-[13px] md:text-[20px] lg:text-[25px] xl:text-[30px] text-primary font-semibold truncate"
      >
        The {{ page.title || 'Room' }} Room
      </h1>
      <h2
        class="text-[12px] md:text-[15px] lg:text-[17px] xl:text-[20px] text-accent italic truncate"
      >
        {{ subtitle }}
      </h2>
    </div>

    <!-- Column 3: Login Button -->
    <div class="flex justify-center">
      <login-button class="w-full max-w-[120px]" />
    </div>

    <!-- Column 4: Icons (Theme and Butterfly) -->
    <div class="flex justify-end items-center space-x-2">
      <!-- Theme Icon -->
      <theme-icon class="w-8 h-8" />
      <!-- Butterfly Toggle Icon -->
      <butterfly-toggle class="w-8 h-8" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access display store
const displayStore = useDisplayStore()

const { page } = useContent()
const subtitle = computed(
  () => page.value?.subtitle ?? 'Welcome to Kind Robots',
)
</script>

<style scoped>
/* Additional styling if needed */
</style>
