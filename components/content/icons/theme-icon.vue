<!-- /components/content/icons/theme-icon.vue -->
<template>
  <button
    @click="goToThemePage"
    class="group relative flex flex-col items-center justify-center w-[2.5rem] sm:w-[2.75rem] lg:w-[3rem] xl:w-[3.5rem] min-w-[2.5rem] max-w-[3.5rem]"
  >
    <Icon
      name="kind-icon:paintbrush"
      class="text-3xl lg:text-4xl xl:text-5xl w-[2.5rem] h-[2.5rem] sm:w-[2.75rem] sm:h-[2.75rem] lg:w-[3rem] lg:h-[3rem] xl:w-[3.5rem] xl:h-[3.5rem] transition-transform transform hover:scale-110 duration-300 ease-in-out"
    />

    <!-- Label or ✕ with fade -->
    <transition name="fade" mode="out-in">
      <span
        v-if="!isEditing"
        key="label"
        class="mt-2 hidden md:block text-center text-sm sm:text-sm md:text-md lg:text-lg xl:text-xl"
      >
        {{ currentTheme }}
      </span>
      <button
        v-else
        key="remove"
        class="mt-2 text-xs bg-red-500 text-white rounded-full px-2 py-0.5 hover:bg-red-600"
        @click.stop="removeSelf"
      >
        ✕
      </button>
    </transition>

    <!-- Hover popup label for small viewports -->
    <div
      v-if="!displayStore.bigMode"
      class="absolute bottom-12 left-1/2 -translate-x-1/2 transform bg-base-200 text-sm rounded-lg p-2 shadow-lg z-50 hidden group-hover:block md:hidden"
    >
      <span class="block text-center">Theme: {{ currentTheme }}</span>
    </div>
  </button>
</template>

<script setup lang="ts">
// /components/content/icons/theme-icon.vue
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/themeStore'
import { useIconStore } from '@/stores/iconStore'
import { useDisplayStore } from '@/stores/displayStore'
import { storeToRefs } from 'pinia'

const router = useRouter()
const themeStore = useThemeStore()
const iconStore = useIconStore()
const displayStore = useDisplayStore()

const { isEditing } = storeToRefs(iconStore)
const currentTheme = computed(() => themeStore.currentTheme)

function goToThemePage() {
  if (!isEditing.value) router.push('/theme')
}

function removeSelf() {
  // Replace with actual theme icon ID from SmartIcons list
  const THEME_ICON_ID = 4
  iconStore.removeIconFromSmartBar(THEME_ICON_ID)
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
