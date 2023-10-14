<template>
  <div class="bg-base-400">
    <div class="flex flex-row">
      <new-dashboard class="flex flex-row bg-base-200 border rounded-2xl p-2 m-1" />
    </div>
    <room-title />
    <slot class="w-full h-full flex bg-base-200 rounded-2xl p-2 m-2" />
    <random-link />
    <div v-if="page.tooltip">
      <streaming-tooltip v-if="page && page.tooltip" :tooltip="page.tooltip" />
    </div>
  </div>
</template>

<script setup lang="ts">
const { page } = useContent()
</script>
