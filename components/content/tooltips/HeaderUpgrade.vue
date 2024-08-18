<template>
  <div class="flex flex-col min-h-screen">
    <!-- Header -->
    <header
      class="flex flex-col items-center p-1 fixed top-0 left-0 right-0 z-40 bg-white shadow-md"
      :style="{ height: headerHeight, maxHeight: '100vh' }"
    >
      <!-- Header Content -->
      <div class="flex w-full items-center justify-between px-1">
        <!-- Left Section -->
        <div class="flex items-center space-x-1 flex-shrink-0">
          <avatar-image :size="avatarSize" class="rounded-full w-10 h-10" />
          <div class="flex flex-col text-left">
            <room-title class="text-sm font-semibold" />
            <h2 class="text-xs text-gray-500 italic">
              {{ page.subtitle || 'the kindest' }}
            </h2>
          </div>
        </div>

        <!-- Center Section -->
        <div class="flex-1 flex flex-col items-center justify-center px-2">
          <smart-links class="text-sm mb-1" />
          <!-- Nav and Controls Section -->
          <div class="flex items-center space-x-1">
            <NavToggle @toggle-nav="toggleNav" />
            <theme-toggle class="text-sm" />
            <butterfly-toggle class="text-sm" />
          </div>
        </div>
      </div>

      <!-- Jellybean Counter -->
      <jellybean-count
        class="fixed top-1 right-1 text-sm z-10 bg-white p-1 rounded-full shadow-md"
      />
    </header>

    <!-- Navigation -->
    <navigation-trimmed
      v-if="showNav"
      class="relative z-30 p-1 bg-white shadow-lg transition-transform duration-300 transform"
      :class="{ 'translate-y-0': showNav, 'translate-y-full': !showNav }"
    />

    <!-- Main Content -->
    <main class="flex-1 p-4">
      <!-- Your main content goes here -->
      <slot />
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

const { page } = useContent()
const avatarSize = 'small'

// Define responsive header height
const headerHeight = computed(() => {
  return `calc(3rem + env(safe-area-inset-top))`
})

const showNav = ref(false)

const toggleNav = () => {
  showNav.value = !showNav.value
}
</script>