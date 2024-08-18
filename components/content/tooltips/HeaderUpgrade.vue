<template>
  <div class="relative">
    <!-- Header -->
    <header
      class="bg-primary shadow-md z-20 flex flex-col md:flex-row items-center p-2 overflow-x-auto"
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
      <div class="flex-1 flex items-center justify-center px-1 mt-1 md:mt-0">
        <smart-links class="text-sm w-full max-w-screen-md" />
      </div>

      <!-- Right Section -->
      <div
        class="flex flex-wrap md:flex-nowrap md:items-center md:justify-end space-x-2 mt-1 md:mt-0 overflow-x-auto"
      >
        <login-button class="flex-shrink-0" />
        <NavToggle class="flex-shrink-0" @toggle-nav="toggleNav" />
        <theme-toggle class="text-sm flex-shrink-0" />
        <butterfly-toggle class="text-sm flex-shrink-0" />
      </div>
    </header>

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

const toggleNav = () => {
  showNav.value = !showNav.value
}
</script>

<style scoped>
header {
  overflow-x: auto;
  white-space: nowrap;
}

.right-section {
  flex-shrink: 0;
}

.right-section .flex-shrink-0 {
  min-width: 40px; /* Adjust as needed to ensure items stay visible */
}

@media (max-width: 640px) {
  header {
    flex-direction: column;
  }

  .right-section {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
}
</style>
