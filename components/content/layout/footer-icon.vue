<template>
  <div
    class="footer-toggle fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-secondary text-accent p-2 rounded-full opacity-75 cursor-pointer z-50"
    @click="toggleFooter"
  >
    <span v-if="isFooterOpen">&#x25BC;</span>
    <span v-else>&#x25B2;</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplayStore } from '@/stores/displayStore'

const displayStore = useDisplayStore()

// Check if the footer is open
const isFooterOpen = computed(() => displayStore.footerState === 'open')

// Toggle the footer state using displayStore
const toggleFooter = () => {
  displayStore.toggleFooter()
}
</script>

<style scoped>
.footer-toggle {
  transition: opacity 0.3s ease;
}

.footer-toggle:hover {
  opacity: 1;
}
</style>
