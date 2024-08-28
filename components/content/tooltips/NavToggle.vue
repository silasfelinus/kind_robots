<template>
  <button
    class="p-1 bg-base-200 m-1 flex items-center justify-center"
    @click="toggleNav"
  >
    <icon name="gis:map-favorite" class="text-lg text-accent" />
  </button>
</template>

<script lang="ts" setup>
const emit = defineEmits<{
  (e: 'toggleNav'): void
}>()

const toggleNav = () => {
  emit('toggleNav')
}
</script>

<style scoped>
/* Add any specific styles for the toggle button if needed */
</style>
