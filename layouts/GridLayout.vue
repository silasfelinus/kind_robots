<template>
  <div class="layout-dashboard">
    <slot />
  </div>
</template>

<script setup lang="ts">
// No additional logic needed unless the layout requires specific data or methods
</script>

<style scoped>
/* Scoped styles to ensure layout-specific adjustments */
.layout-dashboard {
  /* Example: Ensures full height if needed, and margin/padding are managed */
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
