<template>
  <div
    class="theme-toggle fixed inset-0 z-50 flex flex-col items-center justify-center bg-base-300 p-4 rounded-2xl text-lg w-full h-full border shadow-lg"
  >
    <div class="text-2xl font-bold mb-4 w-full text-center">Choose Theme:</div>
    <milestone-reward v-if="themeChanged" :id="9" />
    <div
      class="theme-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full h-auto"
    >
      <div
        v-for="(theme, index) in themeStore.themes"
        :key="index"
        class="theme-item flex items-center justify-center cursor-pointer p-4 rounded-lg hover:bg-base-200 transition-all"
        :class="theme === themeStore.currentTheme ? 'ring-2 ring-accent' : ''"
        @click="themeStore.changeTheme(theme)"
      >
        <div class="text-lg w-full text-center">
          {{ theme }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useThemeStore } from '../../../stores/themeStore'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.initTheme()
})

const themeChanged = computed(() => themeStore.firstThemeChanged)
</script>
