<template>
  <div class="theme-toggle bg-primary p-4 rounded-md text-center text-default">
    <div class="mt-2 text-2xl mb-4">Choose Theme:</div>
    <div class="theme-list grid grid-cols-3 gap-4 p-4">
      <div
        v-for="(theme, index) in themeStore.themes"
        :key="index"
        class="theme-item cursor-pointer p-4 rounded-lg"
        :class="`bg-${theme}-500 ${theme === themeStore.currentTheme ? 'ring-4 ring-accent' : ''}`"
        @click="themeStore.changeTheme(theme)"
      >
        <div class="text-default text-center text-xl">{{ theme }}</div>
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
<style scoped>
.theme-toggle {
  z-index: 1000;
}

.theme-item {
  transition: all 0.3s ease-in-out;
}

.theme-item:hover {
  transform: scale(1.05);
}

.theme-item:active {
  transform: scale(0.95);
}
</style>
