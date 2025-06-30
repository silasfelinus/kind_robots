<!-- /components/content/pages/head-content.vue -->
<template>
  <div v-if="page">{{ page }}</div>
  <div v-else>Loading...</div>
</template>

<script setup lang="ts">
import { usePageStore } from '@/stores/pageStore'

const { page } = storeToRefs(usePageStore())
</script>
