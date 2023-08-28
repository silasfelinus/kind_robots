<script setup>
const { data: navigation } = await useAsyncData('navigation', () => fetchContentNavigation())
</script>

<template>
  <pre>{{ JSON.stringify(navigation, null, 2) }}</pre>
</template>
