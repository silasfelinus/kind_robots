<template>
  <div class="relative">
    <!-- Header -->
    <header
      :class="[
        'bg-primary shadow-md z-20 flex flex-col md:flex-row items-center p-2 overflow-x-auto',
        { 'header-collapsed': isCollapsed },
      ]"
      @click="handleHeaderInteraction"
    >
      <!-- Left Section -->
      <div class="flex items-center space-x-2 flex-shrink-0 w-full md:w-auto">
        <avatar-image
          :size="avatarSize"
          class="w-12 h-12 md:w-16 md:h-16 rounded-full"
        />
        <div class="flex flex-col text-left">
          <room-title class="text-sm font-semibold" />
          <h2 class="text-xs text-gray-500 italic text-center">
            {{ page.subtitle || 'the kindest' }}
          </h2>
        </div>
      </div>

      <!-- Center Section -->
      <div class="flex-1 flex items-center justify-center px-0 mt-0">
        <smart-links class="text-lg w-full max-w-screen-md" />
      </div>

      <!-- Right Section -->
      <div
        class="flex flex-wrap md:flex-nowrap items-center md:justify-end space-x-2 mt-0 overflow-x-auto"
      >
        <div class="flex-shrink-0 min-w-max">
          <butterfly-toggle class="text-sm" />
        </div>

        <div class="flex-shrink-0 min-w-max">
          <theme-toggle class="text-sm" />
        </div>

        <div class="flex-shrink-0 min-w-max">
          <login-button />
        </div>

        <div class="flex-shrink-0 min-w-max">
          <NavToggle class="flex-shrink-1" @toggle-nav="toggleNav" />
        </div>
      </div>
    </header>

    <!-- Restore Header Icon -->
    <div
      v-if="isCollapsed"
      class="fixed top-4 right-4 bg-white p-2 rounded-full shadow-md z-10 cursor-pointer"
      @click="restoreHeader"
    >
      <icon name="arrow-up" class="text-primary" />
    </div>

    <!-- Jellybean Counter -->
    <jellybean-count
      v-if="isLoggedIn"
      class="fixed bottom-8 right-8 bg-white p-2 rounded-full shadow-md z-10"
    />

    <!-- Navigation -->
    <navigation-trimmed
      v-if="showNav"
      class="fixed top-0 left-0 right-0 bottom-0 bg-secondary shadow-lg transition-transform duration-300"
      :class="{ 'translate-y-0': showNav, 'translate-y-full': !showNav }"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

const { page } = useContent()
const avatarSize = 'small'

const showNav = ref(false)
const isLoggedIn = computed(() => useUserStore().isLoggedIn)
const isCollapsed = ref(false)

const toggleNav = () => {
  showNav.value = !showNav.value
}

const handleHeaderInteraction = () => {
  if (window.innerWidth <= 768) {
    // Adjust this breakpoint as needed
    isCollapsed.value = true
  }
}

const restoreHeader = (event: Event) => {
  event.stopPropagation()
  isCollapsed.value = false
}

// Reset header collapse status when resizing window
window.addEventListener('resize', () => {
  if (window.innerWidth > 768) {
    // Adjust this breakpoint as needed
    isCollapsed.value = false
  }
})
</script>

<style scoped>
header {
  overflow-x: auto;
  white-space: nowrap;
  transition: height 0.3s ease;
}

.header-collapsed {
  height: 60px; /* Adjust height when collapsed */
}

.header-collapsed .flex-1 {
  display: none; /* Hide the center section when collapsed */
}

.fixed {
  position: fixed;
}

@media (min-width: 769px) {
  /* Adjust breakpoint as needed */
  .header-collapsed {
    height: auto; /* Ensure the header expands fully on larger screens */
  }
  .fixed {
    display: none;
  }
}
</style>
