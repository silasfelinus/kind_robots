<template>
  <main class="kr-surface">
    <p class="sr-only" aria-live="polite">Opening Monstrexx.</p>
  </main>
</template>

<script setup lang="ts">
await navigateTo('/admin/monstrexx', { redirectCode: 302 })
</script>
