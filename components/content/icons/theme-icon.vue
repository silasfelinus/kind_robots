<!-- /components/content/layout/theme-icon.vue -->
<template>
  <button
    @click="goToThemePage"
    class="w-full h-full flex items-center justify-center transition-transform hover:scale-110"
  >
    <Icon
      name="kind-icon:paintbrush"
      class="w-full h-full max-w-[3rem] max-h-[3rem]"
    />
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
