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
      class="theme-list grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full overflow-y-auto h-full px-4"
    >
      <button
        v-for="(theme, index) in themeStore.themes"
        :key="index"
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

        <!-- Theme Name -->
        <span class="font-serif text-lg">{{ theme }}</span>

        <!-- Hover Overlay -->
        <div
          class="hover-overlay absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-opacity-80 bg-base-300 text-base-content text-sm font-light rounded-xl transition-all"
        >
          Click to apply
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useThemeStore } from '../../../stores/themeStore'

const themeStore = useThemeStore()

onMounted(() => {
  themeStore.initTheme()
})

const themeChanged = computed(() => themeStore.firstThemeChanged)
</script>
