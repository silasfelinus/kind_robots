<template>
  <main>
    <NuxtLayout :name="page?.layout">
      <ContentDoc />
    </NuxtLayout>
  </main>
</template>

<script setup lang="ts">
const { page } = useContent()
</script>
