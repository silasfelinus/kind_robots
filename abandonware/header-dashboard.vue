<!-- /components/content/tooltips/header-dashboard.vue -->
<template>
  <div class="relative">
    <!-- Header -->
    <header
      ref="headerRef"
      class="app-header z-40 flex flex-col md:flex-row items-center overflow-x-hidden"
    >
      <!-- Left: Avatar & Room Info -->
      <div class="flex items-center space-x-2 flex-shrink-0 w-full md:w-auto">
        <avatar-image class="w-12 h-12 md:w-16 md:h-16 rounded-full" />
        <div class="flex flex-col text-left">
          <room-title class="text-sm font-semibold" />
          <h2 class="text-xs text-gray-500 italic">
            {{ subtitle || 'the kindest' }}
          </h2>
        </div>
      </div>

      <!-- Center: Smart Links -->
      <div class="flex-1 flex items-center justify-center px-1">
        <smart-links class="text-sm w-full max-w-screen-md z-30" />
      </div>

      <!-- Right: Controls -->
      <div class="flex items-center justify-end gap-2 w-full md:w-auto">
        <butterfly-toggle class="text-sm z-40" />
        <theme-toggle class="text-sm z-40" />
        <login-button class="text-sm z-40" />
        <nav-toggle class="text-sm z-40" @toggle-nav="toggleNav" />
      </div>
    </header>

    <!-- Jellybean Counter -->
    <jellybean-icon
      v-if="isLoggedIn"
      class="fixed bottom-8 right-8 bg-white p-2 rounded-full shadow-md z-10"
    />

    <!-- Navigation Panel -->
    <navigation-trimmed
      v-if="showNav"
      class="fixed bottom-0 left-0 right-0 bg-secondary shadow-lg transition-transform duration-300 z-20"
      :class="{ 'translate-y-0': showNav, 'translate-y-full': !showNav }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { usePageStore } from '@/stores/pageStore'
import { useUserStore } from '@/stores/userStore'

const { subtitle } = storeToRefs(usePageStore())
const { isLoggedIn } = storeToRefs(useUserStore())

const showNav = ref(false)
const headerRef = ref<HTMLElement | null>(null)

onMounted(async () => {
  await nextTick()
  if (headerRef.value) {
    const height = headerRef.value.clientHeight
    document.documentElement.style.setProperty('--header-height', `${height}px`)
  }
})

const toggleNav = () => {
  showNav.value = !showNav.value
}
</script>

<style scoped>
.app-header {
  overflow-x: hidden;
  white-space: nowrap;
  z-index: 50;
}

.navigation-trimmed {
  transform: translateY(100%);
}
.navigation-trimmed.translate-y-0 {
  transform: translateY(0);
}
</style>
