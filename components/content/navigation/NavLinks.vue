<template>
  <nav
    role="navigation"
    class="relative flex items-center justify-between w-full py-4"
  >
    <!-- Hamburger Icon for Small Screens -->
    <div class="md:hidden">
      <button
        class="focus:outline-none text-accent"
        aria-label="Toggle menu"
        @click="toggleMenu"
      >
        <!-- Hamburger Icon -->
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

    <!-- Hidden Menu on Small Screens -->
    <div
      v-if="isMenuOpen"
      class="absolute top-12 left-0 w-full bg-base-200 shadow-lg md:hidden flex flex-col items-center z-50"
    >
      <nuxt-link
        v-for="link in navLinks"
        :key="link.text"
        :to="link.url"
        class="w-full text-center py-3"
        :class="getLinkClass(link.url)"
        @click="closeMenu"
      >
        {{ link.text }}
      </nuxt-link>
    </div>

    <!-- Horizontal Links for Larger Screens -->
    <div class="hidden md:flex items-center justify-center w-full gap-6">
      <nuxt-link
        v-for="link in navLinks"
        :key="link.text"
        :to="link.url"
        class="text-lg md:text-xl lg:text-2xl text-accent hover:text-primary hover:underline transition-colors duration-300"
        :class="getLinkClass(link.url)"
      >
        {{ link.text }}
      </nuxt-link>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router' // Import useRoute to access the current route

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

// Use the route to determine the current path
const route = useRoute()

// Function to return the correct class based on the current route
const getLinkClass = (url: string) => {
  const baseClass =
    'block text-accent text-lg py-3 transition-colors duration-300'
  const selectedClass = 'text-primary border-b-2 border-primary'

  return route.path === url ? `${baseClass} ${selectedClass}` : baseClass
}
</script>
