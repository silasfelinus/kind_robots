<template>
  <div class="theme-selector flex flex-col items-center relative w-full h-full">
    <!-- Theme Button -->
    <div
      class="theme-button-container flex items-center justify-center rounded-2xl border bg-secondary m-1 p-1 w-full"
    >
      <button
        ref="buttonRef"
        tabindex="0"
        aria-haspopup="true"
        aria-label="Change theme"
        class="theme-btn w-full max-w-full h-auto p-2 focus:outline-none focus:ring focus:ring-accent bg-secondary hover:scale-105 transition-all ease-in-out duration-200 text-lg"
        @click="toggleMenu"
      >
        theme: {{ themeStore.currentTheme }}
      </button>
    </div>

    <!-- Theme Menu -->
    <transition name="theme-menu-fade">
      <div
        v-show="open"
        :style="modalPosition"
        class="theme-menu flex flex-col items-center justify-center bg-base-200 border p-2 mt-2 rounded-2xl z-50 shadow-lg"
        style="max-height: 50vh; overflow-y-auto"
      >
        <button
          v-for="(theme, index) in themeStore.themes"
          :key="index"
          class="theme-item flex items-center justify-center p-2 m-1 rounded-lg text-accent cursor-pointer hover:bg-accent-light transition-all"
          :class="theme === themeStore.currentTheme ? 'ring-2 ring-accent' : ''"
          @click="changeTheme(theme)"
        >
          {{ theme }}
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useThemeStore } from '../../../stores/themeStore'

const themeStore = useThemeStore()
const buttonRef = ref(null)
const open = ref(false)

const modalPosition = computed(() => {
  if (!buttonRef.value) {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  }

  const rect = buttonRef.value.getBoundingClientRect()
  const menuWidth = 'auto' // Let the menu adapt to its contents
  const menuHeight = 'auto'

  return {
    top: `${rect.bottom + 8}px`, // 8px margin below the button
    left: `${rect.left}px`,
    position: 'absolute',
    width: `${menuWidth}`,
    height: `${menuHeight}`,
  }
})

const toggleMenu = () => {
  open.value = !open.value
}

const changeTheme = (theme) => {
  themeStore.changeTheme(theme)
  open.value = false
}

const closeMenu = (e) => {
  if (!buttonRef.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => {
  themeStore.initTheme()
  document.addEventListener('click', closeMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenu)
})
</script>

<style scoped>
.theme-btn {
  text-align: center;
}

.theme-button-container {
  width: 100%;
  max-width: 100%;
}

.theme-menu-fade-enter-active,
.theme-menu-fade-leave-active {
  transition: opacity 0.2s;
}

.theme-menu-fade-enter,
.theme-menu-fade-leave-to {
  opacity: 0;
}
</style>
