<template>
  <div class="relative">
    <div class="relative">
      <!-- Header -->
      <header
        class="bg-primary shadow-md z-20 flex flex-col md:flex-row items-center p-2 overflow-x-auto"
        class="bg-primary shadow-md z-20 flex flex-col md:flex-row items-center p-2 overflow-x-auto"
      >
        <!-- Left Section: Avatar and Room Title -->
        <!-- Display avatar, title, and subtitle, centered and spaced appropriately -->
        <!-- Left Section: Avatar and Room Title -->
        <!-- Display avatar, title, and subtitle, centered and spaced appropriately -->
        <div class="flex items-center space-x-2 flex-shrink-0 w-full md:w-auto">
          <avatar-image
            :size="avatarSize"
            class="w-12 h-12 md:w-16 md:h-16 rounded-full"
          />
          <div class="flex flex-col text-left">
            <room-title class="text-sm font-semibold" />
            <h2 class="text-xs text-gray-500 italic">
              <h2 class="text-xs text-gray-500 italic">
                {{ page.subtitle || 'the kindest' }}
              </h2>
            </h2>
          </div>
        </div>

        <!-- Center Section: Smart Links -->
        <!-- Center the smart links in the middle of the header with appropriate margins -->
        <div class="flex-1 flex items-center justify-center px-1 mt-1 md:mt-0">
          <smart-links class="text-sm w-full max-w-screen-md" />
          <!-- Center Section: Smart Links -->
          <!-- Center the smart links in the middle of the header with appropriate margins -->
          <div
            class="flex-1 flex items-center justify-center px-1 mt-1 md:mt-0"
          >
            <smart-links class="text-sm w-full max-w-screen-md" />
          </div>

          <!-- Right Section for Medium and Large Screens -->
          <!-- Show the icons for larger screens, ensuring they are spaced and aligned properly -->
          <div
            class="hidden md:flex md:flex-wrap items-center md:justify-end gap-2 mt-1 md:mt-0 overflow-x-auto"
          >
            <div
              class="flex-shrink-0 flex items-center justify-center min-w-[50px]"
            >
              <butterfly-toggle class="text-sm" />
            </div>

            <div
              class="flex-shrink-0 flex items-center justify-center min-w-[50px]"
            >
              <theme-toggle class="text-sm" />
            </div>

            <div
              class="flex-shrink-0 flex items-center justify-center min-w-[50px]"
            >
              <login-button />
            </div>

            <div
              class="flex-shrink-0 flex items-center justify-center min-w-[50px]"
            >
              <NavToggle class="flex-shrink-0" @toggle-nav="toggleNav" />
            </div>
          </div>
        </div>
      </header>

      <!-- Right Section for Small Screens -->
      <!-- Icons placed below the avatar-image and title-subtitle section on small screens -->
      <div
        class="md:hidden flex flex-col items-center gap-2 mt-2 p-2 bg-primary border-t border-gray-300"
      >
        <!-- Container for avatar, title, and icons stacked vertically -->
        <div class="flex flex-col items-center">
          <avatar-image
            :size="avatarSize"
            class="w-12 h-12 md:w-16 md:h-16 rounded-full"
          />
          <div class="flex flex-col text-center mt-2">
            <room-title class="text-sm font-semibold" />
            <h2 class="text-xs text-gray-500 italic">
              {{ page.subtitle || 'the kindest' }}
            </h2>
          </div>
        </div>

        <!-- Icons stacked vertically and centered -->
        <div class="flex flex-col items-center gap-2 mt-2">
          <butterfly-toggle class="text-sm" />
          <theme-toggle class="text-sm" />
          <login-button />
          <NavToggle class="flex-shrink-0" @toggle-nav="toggleNav" />
        </div>
      </div>

      <!-- Jellybean Counter -->
      <!-- Positioned fixed at the bottom right, only visible if the user is logged in -->
      <!-- Positioned fixed at the bottom right, only visible if the user is logged in -->
      <jellybean-count
        v-if="isLoggedIn"
        class="fixed bottom-8 right-8 bg-white p-2 rounded-full shadow-md z-10"
      />

      <!-- Navigation -->
      <!-- Fixed full-screen navigation drawer that slides in from the top -->
      <!-- Fixed full-screen navigation drawer that slides in from the top -->
      <navigation-trimmed
        v-if="showNav"
        class="fixed top-0 left-0 right-0 bottom-0 bg-secondary shadow-lg transition-transform duration-300"
        :class="{ 'translate-y-0': showNav, 'translate-y-full': !showNav }"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

const { page } = useContent()
const avatarSize = 'small'

const showNav = ref(false)
const isLoggedIn = computed(() => useUserStore().isLoggedIn)

const toggleNav = () => {
  showNav.value = !showNav.value
}
</script>

<style scoped>
header {
  overflow-x: auto;
  white-space: nowrap;
}

/* Medium and Large Screen Adjustments */
@media (min-width: 768px) {
  /* Ensure the right section does not shrink too much and remains visible */
  .right-section {
    display: flex;
    flex-wrap: wrap;
    gap: 8px; /* Space between icons */
  }

  /* Ensure each icon has a minimum width to prevent squishing */
  .right-section .flex-shrink-0 {
    min-width: 50px; /* Minimum width for icons */
  }
}

/* Small Screen Adjustments */
@media (max-width: 768px) {
  /* Hide right section on small screens */
  .right-section {
    display: none;
  }

  /* Show right section icons stacked below the avatar-image and title-subtitle */
  .right-section-small {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background-color: #1e3a8a; /* Matches bg-primary */
    border-top: 1px solid #d1d5db; /* Matches border-gray-300 */
    display: none;
  }

  /* Show right section icons stacked below the avatar-image and title-subtitle */
  .right-section-small {
    display: flex;
    flex-direction: column;
    gap: 8px;
    background-color: #1e3a8a; /* Matches bg-primary */
    border-top: 1px solid #d1d5db; /* Matches border-gray-300 */
  }
}
</style>
