<template>
  <main class="kr-surface">
    <div class="kr-scroll h-full min-h-0 overflow-y-auto" aria-live="polite">
      <p class="sr-only">Opening the Monstrique series bible.</p>
    </div>
  </main>
</template>

<script setup lang="ts">
await navigateTo('/admin/monstrique?view=bible', { redirectCode: 302 })
</script>
