<script setup lang="ts">
const useLayout = 'default'
</script>

<template>
  <div>
    <!-- The layout-selector component is hidden but available for future use -->
    <layout-selector class="absolute hidden" />
    <!-- Use currentLayout directly with NuxtLayout -->
    <NuxtLayout :name="useLayout">
      <ContentDoc />
    </NuxtLayout>
  </div>
</template>
