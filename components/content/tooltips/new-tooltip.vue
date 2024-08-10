<script setup lang="ts">
const { page } = useContent()
</script>

<template>
  <streaming-tooltip
    v-if="page.tooltip && page.amitip"
    :tooltip="page.tooltip"
    :amitip="page.amitip"
    class="w-full h-full overflow-visible"
  />
</template>
