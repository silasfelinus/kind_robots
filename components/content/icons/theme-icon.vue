<!-- /components/content/layout/theme-icon.vue -->
<template>
  <button
    @click="goToThemePage"
    class="group relative flex items-center justify-center w-[3rem] h-[3rem]"
  >
    <Icon
      name="kind-icon:paintbrush"
      class="w-full h-full max-w-[3rem] max-h-[3rem] transition-transform hover:scale-110"
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
