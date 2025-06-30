<!-- /components/content/wonderlab/component-card.vue -->
<template>
  <div
    class="p-4 bg-base-200 border border-base-300 rounded-2xl hover:scale-105 hover:shadow-md transition-transform cursor-pointer"
    @click="$emit('select', component)"
  >
    <h3 class="text-lg font-semibold truncate">
      {{ component.title || 'Untitled' }}
    </h3>
    <p class="text-sm text-base-content/60 truncate">
      Folder: {{ component.folderName }}
    </p>
    <p class="text-xs text-base-content/50 mt-1 truncate">
      Component: {{ component.componentName }}
    </p>
  </div>
</template>

<script setup lang="ts">
import type { KindComponent as Component } from '@/stores/componentStore'
defineProps<{ component: Component }>()
defineEmits(['select'])
</script>
