<!-- /components/content/story/theme-toggle.vue -->
<template>
  <div
    class="theme-toggle relative flex flex-col items-center justify-start rounded-2xl text-lg w-full max-w-5xl mx-auto p-4 gap-4 border shadow-lg"
  >
    <!-- Title -->
    <div class="text-2xl font-bold w-full text-center">Choose Theme:</div>

    <!-- Theme list -->
    <div
      class="theme-list grid gap-6 w-full"
      :class="{
        'grid-cols-1 sm:grid-cols-2': true,
        'place-items-center': true,
      }"
    >
      <magic-container
        v-for="theme in themeStore.themes"
        :key="theme"
        :data-theme="theme"
        class="theme-container p-4 rounded-xl border shadow-sm transition-all cursor-pointer flex flex-col items-center justify-between w-full max-w-sm"
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

        <!-- Color Swatches -->
        <div class="color-swatches flex gap-2 mt-4">
          <div
            v-for="color in ['primary', 'secondary', 'accent']"
            :key="color"
            :class="`bg-${color} rounded-full border border-base-content`"
            class="h-6 w-6 lg:h-10 lg:w-10"
          ></div>
        </div>
      </magic-container>
    </div>
  </div>
</template>

<script setup lang="ts">
// /components/content/story/theme-toggle.vue
import { onMounted, computed } from 'vue'
import { useThemeStore } from '@/stores/themeStore'
import { useMilestoneStore } from '@/stores/milestoneStore'

const themeStore = useThemeStore()
const milestoneStore = useMilestoneStore()

onMounted(() => {
  try {
    themeStore.initTheme()
  } catch (error) {
    console.error('Error initializing theme store:', error)
  }
})

const themeChanged = computed(() => themeStore.firstThemeChanged)

const handleThemeChange = (theme: string) => {
  try {
    themeStore.changeTheme(theme)
    milestoneStore.rewardMilestone(9)
  } catch (error) {
    console.error('Error changing theme:', error)
  }
}
</script>
