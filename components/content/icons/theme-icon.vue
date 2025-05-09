<!-- /components/content/layout/theme-icon.vue -->
<template>
  <button
    @click="goToThemePage"
    class="group relative flex flex-col items-center justify-center w-[2.5rem] sm:w-[2.75rem] lg:w-[3rem] xl:w-[3.5rem] min-w-[2.5rem] max-w-[3.5rem]"
  >
    <Icon
      name="kind-icon:paintbrush"
      class="text-3xl lg:text-4xl xl:text-5xl w-[2.5rem] h-[2.5rem] sm:w-[2.75rem] sm:h-[2.75rem] lg:w-[3rem] lg:h-[3rem] xl:w-[3.5rem] xl:h-[3.5rem] transition-transform transform hover:scale-110 duration-300 ease-in-out"
    />


<span
  v-if="!isEditing && !displayStore.bigMode"
  class="absolute top-full mt-1 text-xs text-center pointer-events-none"
>
  {{ currentTheme }}
</span>


  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/themeStore'
import { useDisplayStore } from '@/stores/displayStore'
import { useIconStore } from '@/stores/iconStore'
import { storeToRefs } from 'pinia'

const router = useRouter()
const themeStore = useThemeStore()
const displayStore = useDisplayStore()
const iconStore = useIconStore()

const { isEditing } = storeToRefs(iconStore)
const currentTheme = computed(() => themeStore.currentTheme)

function goToThemePage() {
  if (!isEditing.value) router.push('/theme')
}
</script>
