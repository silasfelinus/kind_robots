<template>
  <nav>
    <AppNavigation :navigation-tree="navigation" />
  </nav>
</template>

<script setup lang="ts">
const { data: navigation } = await useAsyncData('navigation', () => {
  return fetchContentNavigation()
})
</script>
