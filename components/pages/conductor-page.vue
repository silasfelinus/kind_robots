<template>
  <WorkspacePage :show-header="showHeader" />
</template>

<script setup lang="ts">
import WorkspacePage from '@/components/pages/workspace-page.vue'

withDefaults(defineProps<{ showHeader?: boolean }>(), { showHeader: true })
</script>
