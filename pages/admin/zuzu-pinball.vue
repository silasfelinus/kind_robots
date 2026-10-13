<template>
  <main class="kr-surface">
    <div class="kr-scroll grid min-h-0 place-items-center p-6">
      <NuxtLink to="/play/zuzu-pinball" class="btn btn-primary">
        Continue to Zuzu Pinball
      </NuxtLink>
    </div>
  </main>
</template>

<script setup lang="ts">
await navigateTo('/play/zuzu-pinball', { redirectCode: 301, replace: true })
</script>
