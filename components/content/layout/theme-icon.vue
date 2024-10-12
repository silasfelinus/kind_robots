<template>
  <button
    class="transition-all flex flex-col items-center w-auto"
    @click="goToThemePage"
  >
    <!-- Theme Label -->
    <span class="text-sm">Theme</span>

    <!-- Icon with Scale Hover Effect -->
    <Icon
      name="bi:brush"
      class="h-full w-full transition-all duration-300 ease-in-out text-accent"
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
