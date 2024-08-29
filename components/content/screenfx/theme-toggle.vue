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
        style="max-height: 50vh; max-width: 50vw; overflow: auto"
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
  if (!buttonRef.value) {
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  }

  const rect = buttonRef.value.getBoundingClientRect()
  const menuWidth = 300 // assumed width of the menu
  const menuHeight = 200 // assumed height of the menu
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight

  let left = rect.left + rect.width / 2 - menuWidth / 2 // center horizontally
  let top = rect.bottom + 5 // position below the button

  // Adjust horizontal position to keep menu within viewport
  if (left + menuWidth > windowWidth) {
    left = windowWidth - menuWidth - 5 // move left if overflowing right
  } else if (left < 0) {
    left = 5 // move right if overflowing left
  }

  // Adjust vertical position to keep menu within viewport
  if (top + menuHeight > windowHeight) {
    top = rect.top - menuHeight - 5 // place above the button if overflowing bottom
  }

  return {
    top: `${top}px`,
    left: `${left}px`,
    position: 'absolute',
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
