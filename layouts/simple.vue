<template>
  <div class="bg-base-400">
    <div class="flex flex-row max-v-10%">
      <user-dashboard class="flex flex-row bg-base-200 border rounded-2xl p-2 m-1" />
      <navigation-row class="flex flex-row" />
      <!-- Toggle Button -->
      <layout-selector class="flex flex-row" />
    </div>
    <div>
      <div v-if="page.tooltip">
        <streaming-tooltip :tooltip="page.tooltip" />
      </div>
    </div>
    <slot class="bg-base-200 rounded-2xl p-2 m-2" />
    <div class="fixed bottom-0 right-0 p-4 h-132 w-132">
      <chat-toggle />
    </div>
  </div>
</template>

<script setup lang="ts">
const { page } = useContent()
</script>
