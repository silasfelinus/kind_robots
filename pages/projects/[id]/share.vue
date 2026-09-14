<!-- /pages/projects/[id]/share.vue -->
<!--
  Share a project (kind-robots/t-062, SHARING-SPEC.md). Thin wrapper around
  <ProjectSharePanel>, same pattern as build-bench.vue.
-->
<template>
  <main class="kr-surface">
    <div class="kr-scroll">
      <ProjectSharePanel />
    </div>
  </main>
</template>

<script setup lang="ts">
import ProjectSharePanel from '@/components/sharing/project-share-panel.vue'
</script>
