<template>
  <div
    class="theme-toggle relative flex flex-col items-center justify-center bg-base-300 p-4 rounded-2xl text-lg w-full h-full border shadow-lg overflow-auto"
  >
    <!-- Title -->
    <div class="text-2xl font-bold mb-4 w-full text-center">Choose Theme:</div>

    <!-- Milestone reward (conditionally shown) -->
    <award-milestone v-if="themeChanged" :id="9" />

    <!-- Theme list -->
    <div
      class="theme-list grid grid-cols-3 gap-6 w-full overflow-y-auto h-full px-4"
    >
      <div
        v-for="theme in themeStore.themes"
        :key="theme"
        :data-theme="theme"
        class="theme-container p-4 rounded-xl border shadow-sm transition-all cursor-pointer flex flex-col items-center justify-between"
        :class="
          theme === themeStore.currentTheme
            ? 'ring-4 ring-accent'
            : 'border-base-300'
        "
        @click="handleThemeChange(theme)"
      >
        <!-- Button Preview -->
        <button
          class="theme-preview w-full h-16 rounded-lg flex items-center justify-center text-lg font-serif"
        >
          {{ theme }}
        </button>

        <!-- Circular Color Swatches -->
        <div class="color-swatches flex gap-2 mt-4">
          <div
            v-for="color in ['primary', 'secondary', 'accent']"
            :key="color"
            :class="`bg-${theme}-${color} rounded-full border border-base-content`"
            class="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useThemeStore } from '../../../stores/themeStore'

const themeStore = useThemeStore()

// Initialize theme store
onMounted(() => {
  try {
    themeStore.initTheme()
  } catch (error) {
    console.error('Error initializing theme store:', error)
  }
})

// Track if the theme has been changed
const themeChanged = computed(() => themeStore.firstThemeChanged)

// Handle theme change
const handleThemeChange = (theme: string) => {
  try {
    themeStore.changeTheme(theme)
  } catch (error) {
    console.error('Error changing theme:', error)
  }
}
</script>
