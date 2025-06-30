<!-- /components/content/test-runner.vue -->
<template>
  <div class="p-4">
    <h2 class="text-xl font-semibold mb-4">Test Runner</h2>
    <test-display />
  </div>
</template>

<script setup lang="ts">
import TestDisplay from '@/components/content/admin/test-display.vue'

console.log(
  '🧪 Registered components:',
  Object.keys(import.meta.glob('/components/**/*.vue')),
)
</script>
