<template>
  <main class="kr-surface h-full min-h-0 overflow-hidden">
    <div class="kr-scroll" />
  </main>
</template>

<script setup lang="ts">
const route = useRoute()

await navigateTo(
  {
    path: '/play/video-generator',
    query: { ...route.query, studio: 'music' },
    hash: route.hash,
  },
  { replace: true, redirectCode: 301 },
)
</script>
