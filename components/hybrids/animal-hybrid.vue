<!-- /components/content/hybrids/animal-hybrid.vue -->
<template>
  <hybrid-grid>
    <!-- Labels -->
    <template #label-left>🦁 Zoo</template>
    <template #label-center>🧬 Builder</template>
    <template #label-right>🖼️ Gallery</template>

    <!-- Page Title -->
    <template #title>
      <h1 class="text-3xl font-bold text-primary text-center">
        🦋 Animal Hybrid Lab
      </h1>
    </template>

    <!-- Left Panel: Zoo -->
    <template #left>
      <animal-explorer />
    </template>

    <!-- Center Panel: Builder -->
    <template #center>
      <generate-hybrid />
    </template>

    <!-- Right Panel: Hybrid Gallery -->
    <template #right>
      <hybrid-gallery />
    </template>

    <!-- Footer Panel (optional) -->
    <template #footer>
      <hybrid-footer />
    </template>

    <!-- Optional Overlay -->
    <template #overlay>
      <hybrid-overlay />
    </template>
  </hybrid-grid>
</template>

<script setup lang="ts">
// /components/content/hybrid/animal-hybrid.vue
// Acts as the hybrid lab layout and entry point.
</script>
