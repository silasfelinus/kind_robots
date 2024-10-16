<template>
  <div class="relative">
    <right-toggle class="fixed top-0 right-0" />
    <tutorial-sidebar v-if="sidebarRightOpen" />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

// Access the displayStore for managing the layout state
const displayStore = useDisplayStore()
const sidebarRightOpen = computed(
  () =>
    displayStore.sidebarRightState !== 'hidden' &&
    displayStore.sidebarRightState !== 'disabled',
)
</script>
