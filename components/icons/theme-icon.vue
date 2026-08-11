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
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from '@/stores/themeStore'

const router = useRouter()
const themeStore = useThemeStore()
const navLabel = computed(() => themeStore.currentTheme)

function goToThemePage() {
  router.push('/themes')
}

defineExpose({ navLabel })
</script>
