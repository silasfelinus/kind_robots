<template>
  <button
    class="text-primary hover:text-secondary transition-colors flex items-center space-x-1 w-full h-auto"
    @click="goToThemePage"
    @mouseover="showThemeOnHover"
    @mouseleave="hideThemeOnHover"
  >
    <Icon name="mdi-brush" class="w-auto h-auto max-w-full max-h-full" />

    <span v-if="showCurrentTheme" class="text-sm">{{ currentTheme }}</span>
  </button>
</template>

<script setup lang="ts">
import { useThemeStore } from './../../../stores/themeStore'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const themeStore = useThemeStore()

const showCurrentTheme = ref(false)
const currentTheme = computed(() => themeStore.currentTheme)

const goToThemePage = () => {
  router.push('/theme')
}

const showThemeOnHover = () => (showCurrentTheme.value = true)
const hideThemeOnHover = () => (showCurrentTheme.value = false)
</script>
