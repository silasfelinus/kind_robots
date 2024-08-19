<template>
  <div class="relative">
    <!-- Header -->
    <header
      class="bg-primary shadow-md z-20 flex flex-col md:flex-row items-center p-2 overflow-x-auto"
    >
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

      <div class="flex-1 flex items-center justify-center">
        <smart-links class="text-sm w-full max-w-screen-md" />
      </div>

      <div
        class="md:flex md:flex-wrap items-center md:justify-end gap-2 overflow-x-auto"
      >
        <div
          class="flex-shrink-0 flex items-center justify-center min-w-[100px]"
        >
          <butterfly-toggle class="text-sm flex-shrink-0" />
        </div>

        <div
          class="flex-shrink-0 flex items-center justify-center min-w-[100px]"
        >
          <theme-toggle class="text-sm flex-shrink-0" />
        </div>

        <div
          class="flex-shrink-0 flex items-center justify-center min-w-[100px]"
        >
          <login-button class="text-sm flex-shrink-0" />
        </div>

        <div
          class="flex-shrink-0 flex items-center justify-center min-w-[100px]"
        >
          <NavToggle class="flex-shrink-0" @toggle-nav="toggleNav" />
        </div>
      </div>
    </header>

    <!-- Jellybean Counter -->
    <!-- Positioned fixed at the bottom right, only visible if the user is logged in -->
    <jellybean-count
      v-if="isLoggedIn"
      class="fixed bottom-8 right-8 bg-white p-2 rounded-full shadow-md z-10"
    />

    <!-- Navigation -->
    <!-- Fixed full-screen navigation drawer that slides in from the top -->
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
</style>
