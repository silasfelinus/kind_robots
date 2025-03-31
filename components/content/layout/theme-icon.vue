<!-- /components/content/layout/theme-icon.vue -->
<template>
  <button
    @click="goToThemePage"
    class="group flex flex-col items-center justify-center w-[80px] min-w-[72px] max-w-[90px] transition-all relative"
  >
    <Icon
      name="kind-icon:paintbrush"
      class="h-8 w-8 md:w-10 md:h-10 lg:w-12 lg:h-12 xl:w-14 xl:h-14 transition-transform transform hover:scale-110 duration-300 ease-in-out"
    />
    <span
      v-if="!displayStore.bigMode"
      class="mt-2 text-center text-sm md:block hidden"
    >
      {{ currentTheme }}
    </span>
    <div
      v-if="!displayStore.bigMode"
      class="absolute bottom-12 left-1/2 transform -translate-x-1/2 bg-base-200 text-sm rounded-lg p-2 shadow-lg z-50 hidden group-hover:block md:hidden"
    >
      <span class="block text-center">Theme: {{ currentTheme }}</span>
    </div>
  </button>
</template>

<script setup lang="ts">
import { useThemeStore } from '@/stores/themeStore'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const displayStore = useDisplayStore()

const router = useRouter()
const themeStore = useThemeStore()

const currentTheme = computed(() => themeStore.currentTheme)

const goToThemePage = () => {
  router.push('/theme')
}
</script>
