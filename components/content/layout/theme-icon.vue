<template>
  <button
    class="transition-all flex flex-col items-center space-y-2 w-auto"
    @click="goToThemePage"
  >
    <!-- Theme Label -->
    <span class="text-sm">Theme</span>

    <!-- Icon with Scale Hover Effect -->
    <Icon
      name="bi:brush"
      class="w-6 h-6 text-accent transition-transform hover:scale-110"
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
