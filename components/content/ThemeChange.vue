<template>
  <div class="theme-selector">
    <button
      tabindex="0"
      aria-haspopup="true"
      aria-label="Change theme"
      class="theme-btn bg-base-200 p-4 rounded-full focus:outline-none focus:ring focus:ring-primary shadow-md transform hover:scale-110 transition-all ease-in-out duration-200"
      @click="toggleMenu"
      @keydown.space.prevent="toggleMenu"
    >
      <span class="theme-icon w-6 h-6"></span>
    </button>
    <transition name="theme-menu-fade">
      <div
        v-show="open"
        class="origin-top-right absolute right-0 mt-12 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 transition-opacity duration-200"
      >
        <div
          class="py-1 theme-list grid grid-cols-3 gap-2 p-2"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="options-menu"
        >
          <button
            v-for="(theme, index) in themes"
            :key="index"
            class="theme-item block w-full text-center px-2 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md"
            role="menuitem"
            tabindex="0"
            @click="changeTheme(theme)"
          >
            {{ theme }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
const open = ref(false)

const themes = [
  'light',
  'dark',
  'cupcake',
  'bumblebee',
  'emerald',
  'corporate',
  'synthwave',
  'retro',
  'cyberpunk',
  'valentine',
  'halloween',
  'garden',
  'forest',
  'aqua',
  'lofi',
  'pastel',
  'fantasy',
  'wireframe',
  'black',
  'luxury',
  'dracula',
  'cmyk',
  'autumn',
  'business',
  'acid',
  'lemonade',
  'night',
  'coffee',
  'winter'
]

const toggleMenu = () => {
  open.value = !open.value
}

const changeTheme = (theme: string) => {
  open.value = false
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('theme', theme)
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  const defaultTheme = savedTheme || 'emerald'
  changeTheme(defaultTheme)
})
</script>

<style>
.theme-selector {
  z-index: 1000;
}

.theme-btn {
  background-color: #1e3a8a;
}

.theme-icon {
  background-image: url('data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="white"%3E%3Cpath stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/%3E%3C/svg%3E');
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
  max-height: 400px; /* Increase the max-height */
  overflow-y: auto;
}
.theme-item:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.5);
}

/* Adjust the menu position */
.transition {
  left: 0;
}
</style>
