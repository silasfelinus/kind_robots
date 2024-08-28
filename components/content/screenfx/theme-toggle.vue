<template>
  <div class="theme-selector flex flex-col items-center relative">
    <div
      class="flex flex-row items-center justify-center rounded-2xl border bg-secondary m-1 p-1 w-full z-50"
    >
      <button
        ref="buttonRef"
        tabindex="0"
        aria-haspopup="true"
        aria-label="Change theme"
        class="theme-btn p-2 focus:outline-none focus:ring focus:ring-accent bg-secondary transform hover:scale-110 transition-all ease-in-out duration-200 text-lg"
        @click="toggleMenu"
      >
        theme: {{ themeStore.currentTheme }}
      </button>
    </div>
    <transition name="theme-menu-fade">
      <div
        v-show="open"
        :style="modalPosition"
        class="theme-menu flex flex-wrap justify-center bg-base-200 border p-2 m-1 rounded-2xl z-50 absolute transition-opacity duration-200"
        style="max-height: 90vh; max-width: 95vw; overflow: auto"
      >
        <button
          v-for="(theme, index) in themeStore.themes"
          :key="index"
          class="theme-item flex items-center justify-center cursor-pointer p-2 rounded-lg flex-grow text-accent"
          :class="theme === themeStore.currentTheme ? 'ring-2 ring-accent' : ''"
          role="menuitem"
          tabindex="0"
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
  if (!buttonRef.value)
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }

  const rect = buttonRef.value.getBoundingClientRect()
  const windowHeight = window.innerHeight
  const windowWidth = window.innerWidth

  let top, bottom, left, right

  if (rect.bottom + 200 <= windowHeight) {
    top = `${rect.bottom}px`
    bottom = 'auto'
  } else if (rect.top >= 200) {
    top = 'auto'
    bottom = `${windowHeight - rect.top}px`
  } else {
    top = '50%'
    transform = 'translateY(-50%)'
  }

  if (rect.left + 300 <= windowWidth) {
    left = `${rect.left}px`
    right = 'auto'
  } else if (rect.right >= 300) {
    left = 'auto'
    right = `${windowWidth - rect.right}px`
  } else {
    left = '50%'
    transform = 'translateX(-50%)'
  }

  return { top, bottom, left, right, position: 'absolute' }
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
