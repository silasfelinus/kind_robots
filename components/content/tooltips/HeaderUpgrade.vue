<template>
  <div class="relative">
    <!-- Header -->
    <header
      class="bg-primary rounded-2xl shadow-md z-20 flex flex-col md:flex-row items-center p-1 overflow-x-auto"
    >
      <!-- Left Section -->
      <div class="flex items-center space-x-2 flex-shrink-0 w-full md:w-auto">
        <avatar-image
          :size="avatarSize"
          class="w-12 h-12 md:w-16 md:h-16 rounded-full"
        />
        <div class="flex flex-col text-left">
          <room-title class="text-sm font-semibold" />
          <h2 class="text-xs text-gray-500 italic">
            {{ page.subtitle || 'the kindest' }}
          </h2>
        </div>
      </div>

      <!-- Center Section -->
      <div class="flex-1 flex items-center justify-center px-1">
        <smart-links class="text-sm w-full max-w-screen-md" />
      </div>

      <!-- Right Section -->
      <div
        class="flex flex-wrap items-center justify-end gap-2 overflow-x-auto"
      >
        <div class="flex-shrink-0 flex items-center justify-center">
          <butterfly-toggle class="text-sm" />
        </div>

        <div class="flex-shrink-0 flex items-center justify-center">
          <theme-toggle class="text-sm" />
        </div>

        <div class="flex-shrink-0 flex items-center justify-center">
          <login-button class="text-sm" />
        </div>

        <div class="flex-shrink-0 flex items-center justify-center">
          <nav-toggle class="text-sm" @toggle-nav="toggleNav" />
        </div>
      </div>
    </header>

    <!-- Jellybean Counter -->
    <jellybean-count
      v-if="isLoggedIn"
      class="fixed bottom-8 right-8 bg-white p-2 rounded-full shadow-md z-10"
    />

    <!-- Navigation Drawer -->
    <navigation-trimmed
      v-if="showNav"
      class="fixed bottom bg-secondary border rounded-2xl shadow-lg transition-transform duration-300 m-2 z-50"
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

const toggleNav = () => {
  showNav.value = !showNav.value
}
</script>

<style scoped>
/* Ensure horizontal overflow is handled in the header */
header {
  overflow-x: auto;
  white-space: nowrap;
}

/* Small screen header icons */
.md\\:hidden {
  display: none; /* Hide small screen icons on larger screens */
}

.md\\:flex {
  display: flex; /* Show icons only on medium screens and larger */
}

.fixed {
  position: fixed;
}

.top-0 {
  top: 0;
}

.left-0 {
  left: 0;
}

.right-0 {
  right: 0;
}

.bg-primary {
  background-color: var(--color-primary); /* Adjust color as needed */
}

/* Ensure header items are spaced out properly on small screens */
.md\\:space-x-2 {
  margin-right: 0.5rem; /* Space between icons */
}

.md\\:overflow-x-auto {
  overflow-x: auto; /* Allow horizontal scrolling if needed */
}

.md\\:hidden {
  display: none; /* Hide this section on larger screens */
}

.md\\:flex {
  display: flex; /* Ensure this section is visible on medium screens and larger */
}

.md\\:space-x-2 {
  margin-right: 0.5rem; /* Space between icons */
}

@media (max-width: 768px) {
  /* Adjustments for small screens */
  .fixed {
    top: 0;
    left: 0;
    right: 0;
    background-color: var(--color-primary);
  }

  .space-x-2 {
    margin-right: 0.5rem; /* Space between icons */
  }
}
</style>
