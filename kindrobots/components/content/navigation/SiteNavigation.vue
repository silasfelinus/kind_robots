<template>
  <nav>
    <AppNavigation :navigation-tree="navigation" />
  </nav>
</template>

<script setup>
const { data: navigation } = await useAsyncData('navigation', () => {
  return fetchContentNavigation()
})
</script>
