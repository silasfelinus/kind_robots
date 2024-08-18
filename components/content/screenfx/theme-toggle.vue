<template>
  <div class="theme-selector flex flex-col items-center">
    <div class="flex flex-row items-center justify-center m-1 space-x-2 w-full">
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
        class="theme-menu flex flex-wrap justify-center bg-base-200 border p-2 m-1 rounded-2xl z-10 transition-opacity duration-200 w-full"
      >
        <button
          v-for="(theme, index) in themeStore.themes"
          :key="index"
          class="theme-item flex items-center justify-center cursor-pointer p-2 rounded-lg flex-grow"
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
    right: rightSpace > leftSpace ? '0' : 'auto',
  }
})

const toggleMenu = () => {
  open.value = !open.value
}

const closeMenu = (e) => {
  if (buttonRef.value && !buttonRef.value.contains(e.target)) {
    open.value = false
  }
}

onMounted(() => {
  themeStore.initTheme()
  window.addEventListener('click', closeMenu)
})

onUnmounted(() => {
  window.removeEventListener('click', closeMenu)
})
</script>
