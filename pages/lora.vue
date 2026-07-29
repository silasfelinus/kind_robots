<!-- /pages/lora.vue -->
<!--
  Back-compat redirect. The LoRA browser is now a tab in the unified Model
  Library (/models?tab=loras); this keeps old /lora bookmarks and links working.
-->
<script setup lang="ts">
definePageMeta({ redirect: { path: '/models', query: { tab: 'loras' } } })
</script>

<template>
  <div />
</template>
