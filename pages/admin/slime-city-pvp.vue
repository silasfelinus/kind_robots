<template>
  <main class="kr-surface">
    <div class="kr-scroll h-full min-h-0 overflow-y-auto" aria-live="polite">
      <p class="sr-only">Opening the Slime City two-player pit.</p>
    </div>
  </main>
</template>

<script setup lang="ts">
await navigateTo('/play/slime-city-pvp', { redirectCode: 301 })
</script>
