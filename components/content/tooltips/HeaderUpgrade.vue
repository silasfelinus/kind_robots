<template>
  <div class="relative">
    <!-- Header -->
    <header
      class="bg-primary shadow-md z-20 flex flex-col items-center p-4"
      :style="{ height: headerHeight }"
    >
      <!-- Header Content -->
      <div class="flex w-full items-center justify-between flex-wrap">
        <!-- Left Section -->
        <div class="flex items-center space-x-2">
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
        <div class="flex-1 flex flex-col items-center justify-center px-2">
          <smart-links class="text-sm" />
        </div>

        <!-- Right Section -->
        <div class="flex items-center space-x-2">
          <login-button />
          <NavToggle @toggle-nav="toggleNav" />
          <theme-toggle class="text-sm" />
          <butterfly-toggle class="text-sm" />
        </div>
      </div>

      <!-- Jellybean Counter -->
      <jellybean-count
        v-if="isLoggedIn"
        class="fixed bottom-8 right-8 bg-white p-2 rounded-full shadow-md z-10"
      />
    </header>

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

const headerHeight = computed(() => `calc(8rem + env(safe-area-inset-top))`)

const showNav = ref(false)
const isLoggedIn = computed(() => useUserStore().isLoggedIn)

const toggleNav = () => {
  showNav.value = !showNav.value
}
</script>
