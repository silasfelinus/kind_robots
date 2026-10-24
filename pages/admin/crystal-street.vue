<template>
  <main class="kr-surface">
    <div class="kr-scroll h-full min-h-0 overflow-y-auto" aria-live="polite">
      <p class="sr-only">Redirecting to Terrors on Crystal Street.</p>
    </div>
  </main>
</template>

<script setup lang="ts">
await navigateTo('/play/crystal-street', { redirectCode: 301 })
</script>
