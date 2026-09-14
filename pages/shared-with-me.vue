<!-- /pages/shared-with-me.vue -->
<!--
  Shared with me — lists Grants where the current user is the grantee.
  Thin wrapper around <SharedWithMe>, the same pattern as build-bench.vue.
-->
<template>
  <main class="kr-surface">
    <div class="kr-scroll">
      <SharedWithMe />
    </div>
  </main>
</template>

<script setup lang="ts">
import SharedWithMe from '@/components/sharing/shared-with-me.vue'
</script>
