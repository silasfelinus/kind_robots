<!-- /pages/build-bench.vue -->
<!--
  Build Bench — a head-to-head A/B test bench for image-generation builds.
  Thin wrapper around <BuildBench>; the whole surface is the two-panel bench.
-->
<template>
  <main class="kr-surface">
    <div class="kr-scroll">
      <BuildBench />
    </div>
  </main>
</template>

<script setup lang="ts">
import BuildBench from '@/components/art/build-bench.vue'
</script>
