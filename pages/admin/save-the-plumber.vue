<template>
  <main class="kr-surface">
    <div class="kr-scroll h-full min-h-0 overflow-y-auto" aria-live="polite">
      <p class="sr-only">Redirecting to save the plumber.</p>
    </div>
  </main>
</template>

<script setup lang="ts">
await navigateTo('/play/save-the-plumber', { redirectCode: 301 })
</script>
