<!-- /components/content/layout/theme-icon.vue -->
<template>
  <button
    @click="goToThemePage"
    class="group flex flex-col items-center justify-center w-[2.5rem] sm:w-[2.75rem] lg:w-[3rem] xl:w-[3.5rem] min-w-[2.5rem] max-w-[3.5rem]"
  >
    <Icon
      name="kind-icon:paintbrush"
      class="text-3xl lg:text-4xl xl:text-5xl w-[2.5rem] h-[2.5rem] sm:w-[2.75rem] sm:h-[2.75rem] lg:w-[3rem] lg:h-[3rem] xl:w-[3.5rem] xl:h-[3.5rem] transition-transform transform hover:scale-110 duration-300 ease-in-out"
    />
    <span
      v-if="!displayStore.bigMode"
      class="mt-2 hidden md:block text-center text-sm sm:text-sm md:text-md lg:text-lg xl:text-xl"
    >
      {{ currentTheme }}
    </span>
    <div
      v-if="!displayStore.bigMode"
      class="absolute bottom-12 left-1/2 -translate-x-1/2 transform bg-base-200 text-sm rounded-lg p-2 shadow-lg z-50 hidden group-hover:block md:hidden"
    >
      <span class="block text-center">Theme: {{ currentTheme }}</span>
    </div>
  </button>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/themeStore'
import { useRouter } from 'vue-router'
import { computed } from 'vue'

const displayStore = useDisplayStore()
const themeStore = useThemeStore()
const router = useRouter()

const currentTheme = computed(() => themeStore.currentTheme)

function goToThemePage() {
  router.push('/theme')
}
</script>
