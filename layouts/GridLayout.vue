<template>
  <div
    class="relative flex flex-col h-screen w-screen bg-gray-100 overflow-hidden"
  >
    <!-- Toggle Navigation Button -->
    <button
      class="absolute top-4 left-4 z-50 p-2 bg-primary rounded-full"
      @click="toggleNav"
    >
      <icon name="fluent:row-triple-20-filled" class="text-2xl text-white" />
    </button>

    <!-- Header Dashboard -->
    <layout-selector class="absolute" />
    <header-dashboard class="w-full shadow-lg bg-white z-40" />
    <layout-selector class="absolute" />

    <!-- Main Content -->
    <main
      :class="{ 'pt-16': !showNav, 'pt-16 pb-32': showNav }"
      class="flex-grow overflow-y-auto transition-all duration-300"
    >
      <div
        v-if="!showNav"
        class="border border-gray-300 rounded-lg mb-4 p-4 bg-gray-200"
      >
        <slot />
      </div>
      <navigation-trimmed
        v-if="showNav"
        class="absolute bottom-0 left-0 right-0 rounded-t-xl p-2 bg-white shadow-lg z-30 transition-transform duration-300 transform"
        :class="{ 'translate-y-0': showNav, '-translate-y-full': !showNav }"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// State to manage the visibility of the navigation
const showNav = ref(false)

// Method to toggle the navigation visibility
const toggleNav = () => {
  showNav.value = !showNav.value
}
</script>

<style scoped>
/* Header and Footer Styling */
header-dashboard {
  padding: 16px;
  z-index: 40;
}

/* Navigation Transition */
.navigation-trimmed-enter-active,
.navigation-trimmed-leave-active {
  transition: opacity 0.3s ease;
}

.navigation-trimmed-enter, .navigation-trimmed-leave-to /* .navigation-trimmed-leave-active in <2.1.8 */ {
  opacity: 0;
}

/* Main Content Adjustments */
main {
  transition: padding-bottom 0.3s ease;
}
</style>
