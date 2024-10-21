<template>
  <button
    class="p-1 bg-base-300 m-1 flex items-center justify-center"
    @click="toggleNav"
  >
    <Icon
      name="kind-icon:map"
      class="Icon-effect w-16 h-16 cursor-pointer transform transition-transform ease-in-out hover:scale-110"
    />
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
