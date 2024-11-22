<template>
  <button
    @click="themeStore.changeTheme(theme)"
    class="theme-button relative flex flex-col items-center justify-between p-4 rounded-xl transition-all cursor-pointer text-lg border shadow-sm"
    :class="[
      theme === themeStore.currentTheme ? 'ring-4 ring-accent' : 'border-base-300',
      `bg-${theme}-base`,
      `text-${theme}-primary`
    ]"
  >
    <!-- Theme Colors Swatches -->
    <div class="swatches flex gap-2 w-full justify-center mb-2">
      <div
        v-for="color in ['primary', 'secondary', 'accent']"
        :key="color"
        :class="`bg-${theme}-${color} h-8 w-8 rounded-full`"
        class="transition-transform hover:scale-110"
      ></div>
    </div>

    <!-- Theme Title -->
    <span class="font-serif text-lg">{{ theme }}</span>
  </button>
</template>

<script setup lang="ts">
import { useThemeStore } from '../../../stores/themeStore'

const themeStore = useThemeStore()
</script>
