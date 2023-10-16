<template>
  <div class="flex flex-col bg-base-200">
    <new-dashboard class="flex-shrink-0" />
    <room-title class="flex-shrink-0" />

    <!-- Main container -->
    <div
      class="w-full h-full flex flex-col md:flex-row bg-base-200 rounded-2xl p-1 m-1 overflow-auto"
    >
      <!-- Content slot -->
      <div class="flex-1 min-w-0 overflow-auto">
        <slot />
      </div>

      <!-- Streaming Tooltip -->
      <streaming-tooltip
        v-if="page && page.tooltip && page.amitip"
        :tooltip="page.tooltip"
        :amitip="page.amitip"
        class="flex-shrink-0 w-full md:w-auto overflow-auto"
      />
    </div>

    <random-link class="flex-shrink-0" />
  </div>
</template>

<script setup lang="ts">
const { page } = useContent()
</script>
