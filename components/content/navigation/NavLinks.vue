<template>
  <nav
    role="navigation"
    class="relative flex items-center justify-between w-full"
  >
    <!-- Hamburger Icon for Small Screens -->
    <div class="sm:hidden">
      <button
        class="focus:outline-none text-accent"
        aria-label="Toggle menu"
        @click="toggleMenu"
      >
        <!-- Hamburger Icon -->
        <svg
          class="w-5 h-5"
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

    <!-- Hidden Menu on Small Screens -->
    <div
      v-if="isMenuOpen"
      class="absolute top-10 left-0 w-full bg-base-300 shadow-lg sm:hidden flex flex-col items-center"
    >
      <nuxt-link
        v-for="link in navLinks"
        :key="link.text"
        :to="link.url"
        class="block text-accent text-base py-1 hover:bg-secondary hover:text-base-100 w-full text-center"
        @click="closeMenu"
      >
        {{ link.text }}
      </nuxt-link>
    </div>

    <!-- Horizontal Links for Larger Screens -->
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

const isMenuOpen = ref(false)

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const closeMenu = () => {
  isMenuOpen.value = false
}

const navLinks = [
  { text: 'Kind Robots', url: '/' },
  { text: 'Welcome', url: '/intro' },
  { text: 'Art', url: '/memory' },
  { text: 'PromptBots', url: '/botcafe' },
  { text: 'AMI', url: '/amibot' },
]
</script>

<style scoped>
nav {
  position: relative;
}
</style>
