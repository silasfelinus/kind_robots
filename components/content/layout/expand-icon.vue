<template>
  <div class="absolute top-2 right-2 cursor-pointer" @click="expandParent">
    <!-- Your icon (adjust the name and style as needed) -->
    <icon name="kind-icon:expand" class="text-lg" />
  </div>
</template>

<script setup>
// Assume parent exposes `toggleExpand` function
const { toggleExpand } = defineExpose()

const expandParent = () => {
  toggleExpand() // Calls the parent's expand method
}
</script>
