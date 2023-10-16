<template>
  <div class="flex flex-col bg-base-200">
    <div class="flex flex-row">
      <new-dashboard class="flex flex-row bg-base-200 border rounded-2xl p-2 m-1" />
    </div>
    <room-title />
    <slot class="w-full h-full flex bg-base-200 rounded-2xl p-2 m-2" />
    <random-link />
    <streaming-tooltip
      v-if="page.tooltip && page.amitip"
      :tooltip="page.tooltip"
      :amitip="page.amitip"
    />
  </div>
</template>

<script setup lang="ts">
const { page } = useContent()
</script>
