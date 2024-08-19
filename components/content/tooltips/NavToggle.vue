<template>
  <button
    class="p-1 bg-primary rounded-full m-1 w-8 h-8 flex items-center justify-center"
    @click="toggleNav"
  >
    <icon name="fluent-emoji-flat-world-map" class="text-lg text-white" />
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
