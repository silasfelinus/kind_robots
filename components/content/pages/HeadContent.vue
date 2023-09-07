<script setup lang="ts">
const { page } = useContent()

const pageData = useContentHead(page)
</script>

<template>
  <div>{{ pageData }}</div>
</template>
