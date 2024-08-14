<script setup lang="ts">
import { useLayoutStore } from './../stores/layoutStore'

const layoutStore = useLayoutStore()
</script>

<template>
  <div>
    <!-- The layout-selector component is hidden but available for future use -->
    <layout-selector class="absolute hidden" />
    <!-- Use currentLayout directly with NuxtLayout -->
    <NuxtLayout :name="layoutStore.currentLayout">
      <ContentDoc />
    </NuxtLayout>
  </div>
</template>
