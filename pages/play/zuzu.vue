<template>
  <main class="kr-surface">
    <div class="kr-scroll grid min-h-0 place-items-center p-6">
      <NuxtLink to="/play/arcade" class="btn btn-primary">
        Continue to Play
      </NuxtLink>
    </div>
  </main>
</template>

<script setup lang="ts">
await navigateTo('/play/arcade', { redirectCode: 301, replace: true })
</script>
