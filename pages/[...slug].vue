<template>
  <div>
    <!-- The layout-selector component is hidden but available for future use -->
    <layout-selector class="absolute" />
    <!-- Use currentLayout directly with NuxtLayout -->
    <NuxtLayout :class="currentLayout">
      <ContentDoc />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { useLayoutStore } from './../stores/layoutStore'

const layoutStore = useLayoutStore()
const currentLayout = layoutStore.currentLayout
</script>
