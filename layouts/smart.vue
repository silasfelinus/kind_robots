<template>
  <div class="layout-smart">
    <slot />
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const columnWidth = 300 // Width of each column in pixels
const columns = ref(1)

onMounted(() => {
  const containerWidth = window.innerWidth
  columns.value = Math.floor(containerWidth / columnWidth)
})
</script>

<style scoped>
.layout-smart {
  @apply flex flex-nowrap overflow-x-auto max-w-screen;
}
.layout-smart > * {
  @apply flex-none w-[300px]; /* Sets fixed width for each column */
}
</style>
