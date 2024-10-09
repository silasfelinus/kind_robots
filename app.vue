<template>
  <header
    class="flex items-center justify-between fixed rounded-2xl border-1 border-accent p-2 bg-base-300 z-20 mx-2 my-2 max-w-full"
    :style="{
      height: displayStore.headerHeight + 'vh',
    }"
  >
    <!-- Avatar, Title, Subtitle, and Login Button Section -->
    <div class="flex items-center justify-between w-full">
      <!-- Avatar Image, automatically fills available height -->
      <avatar-image
        alt="User Avatar"
        class="aspect-square rounded-2xl flex-shrink-0"
        :style="{
          height: '100%', // Fills the available height of the header
        }"
        @click="toggleSidebar"
      />
      <!-- Title, Subtitle, and Login Button Column -->
      <div
        class="flex flex-col items-center justify-center flex-grow text-center"
      >
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

      <!-- Login Button Column -->
      <div class="ml-auto">
        <login-button class="w-full max-w-[120px]" />
      </div>
    </div>

    <!-- Non-login Icons (Vertical on small screens, horizontal on larger screens) -->
    <div
      class="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2 flex-shrink-0"
    >
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
// Toggle the left sidebar
const toggleSidebar = () => {
  displayStore.toggleSidebar('sidebarLeftState')
}
</script>

<style scoped>
/* Additional styling if needed */
</style>
