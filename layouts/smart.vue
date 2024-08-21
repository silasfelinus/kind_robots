<template>
  <div class="flex flex-nowrap overflow-x-auto">
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
