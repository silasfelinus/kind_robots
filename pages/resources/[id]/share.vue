<!-- /pages/resources/[id]/share.vue -->
<!--
  Share a resource (kind-robots/t-062, SHARING-SPEC.md). Thin wrapper around
  <ResourceSharePanel>, same pattern as build-bench.vue.
-->
<template>
  <main class="kr-surface">
    <div class="kr-scroll">
      <ResourceSharePanel />
    </div>
  </main>
</template>

<script setup lang="ts">
import ResourceSharePanel from '@/components/sharing/resource-share-panel.vue'
</script>
