<template>
  <div class="relative">
    <!-- Header -->
    <header
      ref="headerRef"
      class="z-50 flex flex-col md:flex-row items-center justify-between overflow-x-visible max-w-full"
      :class="{ 'flex-col': isMobile }"
    >
      <!-- Left Section -->
      <div class="flex items-center space-x-2 flex-shrink-0 min-w-0 md:flex-1">
        <avatar-image
          :size="avatarSize"
          class="w-12 h-12 md:w-16 md:h-16 rounded"
          alt="User Avatar"
        />
        <div class="flex items-center flex-shrink-0 min-w-0 md:flex-1">
          <room-title class="text-sm font-semibold bg-base-200 rounded-2xl" />
          <h2 class="text-xs text-gray-500 italic pl-1">
            {{ pageSubtitle }}
          </h2>
        </div>
      </div>

      <!-- Center Section -->
      <div class="flex-1 flex items-center justify-center px-0 min-w-0">
        <smart-links class="text-sm w-full max-w-screen-md z-30" />
      </div>

      <!-- Right Section -->
      <div
        class="flex items-center justify-end gap-2 overflow-visible min-w-0 md:flex-1"
        :class="{ 'flex-wrap': isMobile }"
      >
        <butterfly-toggle class="text-sm z-40 hidden sm:block" />
        <theme-toggle class="text-sm z-50 hidden sm:block" />
        <login-button />
        <nav-toggle class="text-sm z-40" @toggle-nav="toggleNav" />
      </div>
    </header>

    <!-- Jellybean Counter -->
    <jellybean-count
      v-if="isLoggedIn"
      class="fixed bottom-2 center bg-white p-2 rounded-full shadow-md z-40"
    />

    <!-- Navigation -->
    <navigation-trimmed
      v-if="showNav"
      class="absolute bottom-0 bg-secondary shadow-lg transition-transform duration-300 z-20"
      :class="{ 'translate-y-0': showNav, 'translate-y-full': !showNav }"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useUserStore, useContent } from '@/stores'

const { page } = useContent()
const avatarSize = ref('small')
const showNav = ref(false)
const isLoggedIn = computed(() => useUserStore().isLoggedIn)
const pageSubtitle = computed(() => page?.subtitle || 'the kindest')

const isMobile = ref(false)
const headerRef = ref<HTMLElement | null>(null)

function handleResize() {
  isMobile.value = window.innerWidth < 768
  if (headerRef.value) {
    headerRef.value.clientHeight
  }
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const toggleNav = () => (showNav.value = !showNav.value)
</script>

<style scoped>
.avatar-image {
  perspective: 1000px;
  width: 100%;
  max-width: 100px;
}
header {
  overflow-x: hidden;
  max-width: 100vw;
}

.navigation-trimmed {
  position: absolute;
  width: 100%;
  transition: transform 0.3s ease-in-out;
}

@media (max-width: 768px) {
  .flex-wrap {
    flex-direction: column;
  }
}
</style>