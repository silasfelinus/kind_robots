<template>
  <div class="theme-selector flex flex-col items-center relative">
    <div class="flex flex-row items-center justify-center space-x-2 w-full">
      <button
        ref="buttonRef"
        tabindex="0"
        aria-haspopup="true"
        aria-label="Change theme"
        class="theme-btn p-2 rounded-full border border-accent focus:outline-none focus:ring focus:ring-accent transform hover:scale-110 transition-all ease-in-out duration-200 text-lg"
        @click="toggleMenu"
      >
        theme: {{ themeStore.currentTheme }}
      </button>
    </div>
    <transition name="theme-menu-fade">
      <div
        v-show="open"
        :style="modalPosition"
        class="theme-menu fixed bg-base-300 border p-4 rounded-2xl z-50 shadow-lg transition-opacity duration-200"
        style="min-width: 250px; max-width: 400px"
      >
        <button
          v-for="(theme, index) in themeStore.themes"
          :key="index"
          class="theme-item flex items-center justify-center cursor-pointer p-2 rounded-lg hover:bg-base-200 transition-all"
          :class="theme === themeStore.currentTheme ? 'ring-2 ring-accent' : ''"
          role="menuitem"
          tabindex="0"
          @click="themeStore.changeTheme(theme)"
        >
          {{ theme }}
        </button>
      </div>
    </transition>
  </div>
</template>


<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useThemeStore } from '@/stores/themeStore'
import { useDisplayStore } from '@/stores/displayStore'

// Using the display store to track layout-related properties
const themeStore = useThemeStore()
const displayStore = useDisplayStore()
const buttonRef = ref<HTMLElement | null>(null) // Typing buttonRef properly
const open = ref(false)

// Calculating the position of the modal using displayStore
const modalPosition = computed(() => {
  if (!buttonRef.value) return {}

  const rect = buttonRef.value.getBoundingClientRect()

  return {
    top: rect.bottom + 'px',
    left: rect.left + 'px',
    right: 'auto',
    bottom: 'auto',
  }
})

const toggleMenu = () => {
  open.value = !open.value
}

// Closing the menu when clicking outside
const closeMenu = (e: MouseEvent) => {
  if (buttonRef.value && !buttonRef.value.contains(e.target as Node)) {
    open.value = false
  }
}

// Initialize theme and setup event listeners
onMounted(() => {
  themeStore.initTheme()
  window.addEventListener('click', closeMenu)
  displayStore.updateViewport() // Update viewport on mount
})

// Cleanup on unmount
onUnmounted(() => {
  window.removeEventListener('click', closeMenu)
})
</script>
