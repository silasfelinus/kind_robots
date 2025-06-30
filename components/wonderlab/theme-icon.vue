<!-- /components/content/icons/theme-icon.vue -->
<template>
  <button
    @click="goToThemePage"
    class="w-full h-full flex items-center justify-center transition-transform hover:scale-110"
  >
    <Icon name="kind-icon:paintbrush" class="w-full h-full" />
  </button>
</template>

<script setup lang="ts">
// /components/content/icons/theme-icon.vue
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/themeStore'
import { useSmartbarStore } from '@/stores/smartbarStore'

const router = useRouter()
const themeStore = useThemeStore()
const smartbarStore = useSmartbarStore()

const isEditing = computed(() => smartbarStore.isEditing)
const navLabel = computed(() => themeStore.currentTheme)

function goToThemePage() {
  if (!isEditing.value) router.push('/themes')
}

// expose for label logic
defineExpose({ navLabel })
</script>
