<!-- /components/ui/section-heading.vue -->
<!-- Small heading + hint used by the UI gallery (components/ui/ui-gallery.vue). -->
<template>
  <div class="space-y-1">
    <h2 class="text-smart-heading font-bold">{{ title }}</h2>
    <p v-if="hint" class="text-smart-caption max-w-2xl opacity-60">
      {{ hint }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  hint?: string
}>()
</script>
