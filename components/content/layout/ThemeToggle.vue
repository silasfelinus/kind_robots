<template>
  <button
    @click="goToThemePage"
    class="text-primary hover:text-secondary transition-colors flex items-center space-x-1"
  >
    <icon name="mdi-brush" class="w-8 h-8" /> <!-- Paintbrush Icon -->
    <span v-if="showCurrentTheme" class="text-sm">{{ currentTheme }}</span>
  </button>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/themeStore'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const themeStore = useThemeStore()

// Optionally show the current theme name
const showCurrentTheme = ref(false)
const currentTheme = computed(() => themeStore.currentTheme) // Get current theme

const goToThemePage = () => {
  router.push('/themes') // Direct user to the theme page
}

// Optionally show the current theme on hover
const showThemeOnHover = () => (showCurrentTheme.value = true)
const hideThemeOnHover = () => (showCurrentTheme.value = false)
</script>

<style scoped>
/* No circular background, just the icon */
</style>
