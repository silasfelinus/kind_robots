<template>
  <div class="kr-surface" />
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
