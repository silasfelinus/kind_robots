<template>
  <NuxtLayout :name="layoutStore.currentLayout">
    <NuxtPage />
    <div class="fixed top-2 right-2 z-50">
      <layout-selector />
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useLayoutStore } from '@/stores/layoutStore'
import LayoutToggle from '@/components/LayoutToggle.vue'

const layoutStore = useLayoutStore()
</script>
