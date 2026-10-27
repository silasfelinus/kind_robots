<template>
  <main class="kr-surface">
    <div class="kr-scroll grid min-h-0 place-items-center p-6">
      <NuxtLink to="/stylist" class="btn btn-primary">
        Continue to Superkate Services
      </NuxtLink>
    </div>
  </main>
</template>

<script setup lang="ts">
await navigateTo('/stylist', { redirectCode: 301, replace: true })
</script>
