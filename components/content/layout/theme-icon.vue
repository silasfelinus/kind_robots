<template>
  <div class="theme-selector flex flex-col items-center relative">
    <div class="flex flex-row items-center justify-center space-x-2 w-full">
      <button
        tabindex="0"
        aria-haspopup="true"
        aria-label="Change theme"
        class="theme-btn p-2 rounded-full border border-accent focus:outline-none focus:ring focus:ring-accent transform hover:scale-110 transition-all ease-in-out duration-200 text-lg"
        @click="goToThemePage"
      >
        theme: {{ themeStore.currentTheme }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/themeStore'
import { useRouter } from 'vue-router'

const themeStore = useThemeStore()
const router = useRouter()

// Function to navigate to the /theme page
const goToThemePage = () => {
  router.push('/theme')
}
</script>
