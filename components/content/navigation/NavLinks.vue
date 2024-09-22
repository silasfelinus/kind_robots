<template>
  <nav class="relative flex items-center justify-center w-full">
    <!-- Hamburger Icon for Small Screens -->
    <div class="sm:hidden">
      <button
        class="p-2 focus:outline-none text-accent"
        aria-label="Toggle menu"
        @click="toggleMenu"
      >
        <!-- Hamburger Icon (Accolade Menu Icon) -->
        <svg
          class="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 6h16M4 12h16M4 18h16"
          ></path>
        </svg>
      </button>
    </div>

    <!-- Hidden Menu on Small Screens (Accolade Menu) -->
    <div
      v-if="isMenuOpen"
      class="absolute top-12 left-0 w-full bg-base-200 shadow-lg sm:hidden flex flex-col items-center"
    >
      <nuxt-link
        v-for="link in navLinks"
        :key="link.text"
        :to="link.url"
        class="block text-accent text-lg py-2 hover:bg-secondary hover:text-base-100 w-full text-center"
        @click="closeMenu"
      >
        {{ link.text }}
      </nuxt-link>
    </div>

    <!-- Normal Nav Links for Larger Screens -->
    <div class="hidden sm:flex items-center gap-4">
      <nuxt-link
        v-for="link in navLinks"
        :key="link.text"
        :to="link.url"
        class="text-accent text-lg hover:underline whitespace-nowrap"
      >
        {{ link.text }}
      </nuxt-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Control whether the hamburger menu is open
const isMenuOpen = ref(false)

// Toggle the menu open or closed
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

// Close the menu when a link is clicked
const closeMenu = () => {
  isMenuOpen.value = false
}

// Navigation links
const navLinks = [
  { text: 'Kind Robots', url: '/' },
  { text: 'Welcome', url: '/intro' },
  { text: 'Art', url: '/memory' },
  { text: 'PromptBots', url: '/botcafe' },
  { text: 'AMI', url: '/amibot' },
]
</script>

<style scoped>
/* Optional styles for further customizing the menu appearance */
nav {
  position: relative;
}

button {
  outline: none;
}
</style>
