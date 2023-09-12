<template>
  <div class="theme-selector p-4 rounded-md text-center relative">
    <div class="mt-2 text-xl font-bold">Theme:</div>
    <div class="theme-button-wrapper relative inline-block">
      <button
        tabindex="0"
        aria-haspopup="true"
        aria-label="Change theme"
        class="theme-btn p-4 rounded-full focus:outline-none focus:ring focus:ring-accent transform hover:scale-110 transition-all ease-in-out duration-200"
        @click="toggleMenu"
      >
        <!-- Updated icon here -->
        <icon name="game-icons:pencil-brush" class="w-12 h-12" />
      </button>
      <div class="font-bold mt-2 text-xl">{{ themeStore.currentTheme }}</div>
      <transition name="theme-menu-fade">
        <div
          v-show="open"
          :style="modalPosition"
          class="origin-top-right absolute mt-2 w-96 rounded-md shadow-lg bg-base-100 ring-1 ring-black ring-opacity-5 z-50 transition-opacity duration-200"
        >
          <div
            class="py-1 theme-list grid grid-cols-3 gap-2 p-2"
            role="menu"
            aria-orientation="vertical"
            aria-labelledby="theme-list"
          >
            <!-- Theme items here -->
            <button
              v-for="(theme, index) in themeStore.themes"
              :key="index"
              :class="`theme-item block w-full text-center px-2 py-2 text-md text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md ${
                theme === themeStore.currentTheme ? 'bg-accent text-white' : ''
              }`"
              role="menuitem"
              tabindex="0"
              @click="themeStore.changeTheme(theme)"
            >
              {{ theme }}
            </button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useThemeStore } from '../../../stores/themeStore'

const themeStore = useThemeStore()
const buttonRef = ref(null)
const open = ref(false)

const modalPosition = computed(() => {
  if (!buttonRef.value) return {}

  const rect = buttonRef.value.getBoundingClientRect()
  const windowHeight = window.innerHeight
  const windowWidth = window.innerWidth

  const topSpace = rect.top
  const bottomSpace = windowHeight - rect.bottom
  const leftSpace = rect.left
  const rightSpace = windowWidth - rect.right

  return {
    top: bottomSpace > topSpace ? 'auto' : '0',
    bottom: bottomSpace > topSpace ? '0' : 'auto',
    left: rightSpace > leftSpace ? 'auto' : '0',
    right: rightSpace > leftSpace ? '0' : 'auto'
  }
})

const toggleMenu = () => {
  open.value = !open.value
}

onMounted(() => {
  themeStore.initTheme()
})
</script>

<style scoped>
.theme-selector {
  z-index: 1000;
}

.theme-btn:hover {
  background-color: var(--bg-secondary);
}

.theme-btn:focus {
  ring-color: var(--bg-accent);
}

.theme-menu-fade-enter-active,
.theme-menu-fade-leave-active {
  transition: opacity 0.2s;
}

.theme-menu-fade-enter,
.theme-menu-fade-leave-to {
  opacity: 0;
}

.theme-list {
  max-height: 800px;
  overflow-y: auto;
}

.theme-item {
  position: relative;
}

.theme-item:focus {
  outline: none;
  box-shadow: 0 0 0 3px var(--bg-accent);
}

.theme-item.selected {
  border: 2px solid var(--bg-accent);
  border-radius: 10px;
}
</style>
