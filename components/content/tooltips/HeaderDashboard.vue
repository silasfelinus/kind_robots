<template>
  <div class="relative">
    <!-- Header -->
    <header
      class="z-40 flex flex-col md:flex-row items-center overflow-x-hidden"
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
            {{ page?.subtitle || 'the kindest' }}
          </h2>
        </div>
      </div>

      <!-- Center Section -->
      <div class="flex-1 flex items-center justify-center px-1">
        <smart-links class="text-sm w-full max-w-screen-md z-30" />
      </div>

      <!-- Right Section -->
      <div
        class="flex items-center justify-end gap-2 overflow-x-hidden w-full md:w-auto"
      >
        <butterfly-toggle class="text-sm z-40" />
        <theme-toggle class="text-sm z-40" />
        <login-button class="text-sm z-40" />
        <nav-toggle class="text-sm z-40" @toggle-nav="toggleNav" />
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
      class="relative bottom-0 bg-secondary shadow-lg transition-transform duration-300 z-20"
      :class="{ 'translate-y-0': showNav, 'translate-y-full': !showNav }"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, nextTick } from 'vue'
import { useUserStore } from './../../../stores/userStore' // Ensure to import your stores correctly

import { useRoute } from 'vue-router'
import { useAsyncData } from '#app'
import type { ContentType } from '~/content.config'

// Get the route params
const route = useRoute()

const page = computed(() => {
  const { data } = useAsyncData(route.path, async () => {
    return (await queryCollection('content')
      .path(route.path)
      .first()) as ContentType | null
  })
  return data.value
})

const avatarSize = ref('small')

const showNav = ref(false)
const isLoggedIn = computed(() => useUserStore().isLoggedIn)
const headerHeight = ref(0)

// Provide a type hint for headerRef as HTMLElement or null
const headerRef = ref<HTMLElement | null>(null)

onMounted(async () => {
  await nextTick()
  if (headerRef.value) {
    headerHeight.value = headerRef.value.clientHeight // Now TypeScript knows what clientHeight is
  }
})

const toggleNav = () => {
  showNav.value = !showNav.value
}
</script>
<style scoped>
/* General overflow management for the header */
header {
  overflow-x: hidden; /* Prevent horizontal scrolling */
  white-space: nowrap; /* Prevent items from wrapping */
  z-index: 50; /* Ensuring the header is above most elements */
}

/* Positioning for fixed elements */
.fixed {
  position: fixed;
  right: 0;
  left: 0;
  z-index: 10; /* Lower z-index for non-critical overlay elements */
}

.bg-primary {
  background-color: var(--color-primary);
}

.navigation-trimmed {
  position: fixed;
  bottom: 0;
  background-color: var(--color-secondary);
  border: 1px solid #ccc;
  border-radius: 20px;
  z-index: 30; /* Ensure it's under the header */
  transform: translateY(
    calc(100% - var(--header-height))
  ); /* Adjust translation based on header height */
  transition: transform 0.3s ease-in-out;
}

.show-nav {
  transform: translateY(
    var(--header-height)
  ); /* Correct the transform direction */
}

@media (max-width: 768px) {
  /* Mobile-specific adjustments */
  header {
    z-index: 50;
  }

  .fixed {
    background-color: var(--color-primary);
  }
}
</style>
