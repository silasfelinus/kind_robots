<template>
  <div
    class="theme-toggle flex flex-col items-center bg-base-200 p-2 m-1 rounded-2xl text-lg w-screen h-screen"
  >
    <div class="text-2xl font-bold mb-2 w-full text-center">Choose Theme:</div>
    <div class="theme-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full h-full">
      <div
        v-for="(theme, index) in themeStore.themes"
        :key="index"
        class="theme-item flex items-center justify-center cursor-pointer p-2 rounded-lg"
        :class="theme === themeStore.currentTheme ? 'ring-2 ring-accent' : ''"
        @click="themeStore.changeTheme(theme)"
      >
        <div class="text-lg w-full text-center">{{ theme }}</div>
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
</script>
