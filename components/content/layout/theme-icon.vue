<template>
  <button
    class="text-primary hover:text-secondary transition-all flex flex-col items-center space-y-2 w-auto"
    @click="goToThemePage"
  >
    <!-- Theme Label -->
    <span class="text-sm">Theme</span>

    <!-- Icon with Scale Hover Effect -->
    <Icon
      name="mdi-brush"
      class="w-6 h-6 transition-transform text-accent hover:text-info hover:scale-110"
    />

    <!-- Always Visible Theme Name -->
    <span class="text-sm transition-colors">{{ currentTheme }}</span>
  </button>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/themeStore'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const themeStore = useThemeStore()

const currentTheme = computed(() => themeStore.currentTheme)

const goToThemePage = () => {
  router.push('/theme')
}
</script>
