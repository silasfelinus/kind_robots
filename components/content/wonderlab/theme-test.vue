<!-- /components/content/themes/theme-test.vue -->
<template>
  <div class="p-6">
    <h2 class="text-xl font-bold mb-4">🎨 Built-in Themes</h2>
    <div class="grid gap-2 grid-cols-2">
      <div
        v-for="theme in themeStore.daisyuiThemes"
        :key="theme"
        class="p-4 border rounded-xl cursor-pointer text-center hover:bg-primary hover:text-primary-content"
        @click="setTheme(theme)"
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
        @click="setTheme(theme)"
      >
        {{ theme.name }}
      </div>
    </div>

    <p v-if="themeError" class="mt-6 text-sm text-error whitespace-pre-wrap">
      {{ themeError }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useThemeStore, type Theme } from '@/stores/themeStore'

const themeStore = useThemeStore()
const themeError = ref('')

function setTheme(theme: string | Theme) {
  const input = typeof theme === 'string' ? theme : {
    ...theme,
    values: typeof theme.values === 'object' ? theme.values : {},
  }

  try {
    const result = themeStore.setActiveTheme(input)
    if (!result.success) {
      themeError.value = `❌ Failed to apply theme\n${result.message}`
    } else {
      themeError.value = ''
    }
  } catch (err) {
    themeError.value = `❌ setTheme crashed:\n${(err as Error).message}`
  }
}
</script>
