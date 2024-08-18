<template>
  <button
    class="p-2 bg-primary rounded-full m-2 w-8 h-8 flex items-center justify-center"
    @click="toggleNav"
  >
    <icon name="fluent:row-triple-20-filled" class="text-lg text-white" />
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
