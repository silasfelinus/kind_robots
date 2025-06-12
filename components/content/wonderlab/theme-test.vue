<!-- /components/content/wonderlab/theme-test.vue -->
<template>
  <div class="p-6">
    <h2 class="text-xl font-bold mb-4">🎨 Built-in Themes</h2>
    <div class="grid gap-2 grid-cols-2">
      <div
        v-for="theme in themeStore.daisyuiThemes"
        :key="theme"
        class="p-4 border rounded-xl cursor-pointer text-center hover:bg-primary hover:text-primary-content"
        @click="handleSetTheme(theme)"
      >
        {{ theme }}
      </div>
    </div>

    <h2 class="text-xl font-bold mt-8 mb-4">🌍 Shared Themes</h2>
    <div class="grid gap-2 grid-cols-2">
      <div
        v-for="theme in themeStore.sharedThemes"
        :key="theme.id"
        class="p-4 border rounded-xl cursor-pointer text-center hover:bg-secondary hover:text-secondary-content"
        @click="handleSetTheme(theme)"
      >
        {{ theme.name }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useThemeStore, type Theme } from '@/stores/themeStore'

const themeStore = useThemeStore()

function handleSetTheme(theme: string | Theme) {
  const input = typeof theme === 'string' ? theme : theme
  themeStore.setActiveTheme(input)
}
</script>
