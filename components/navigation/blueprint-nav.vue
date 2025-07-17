<!-- /components/content/blueprints/blueprint-nav.vue -->
<template>
  <nav-grid :cards="blueprintCards" />
</template>

<script setup lang="ts">
import type { LinkItem } from '~/stores/linkStore'

const blueprintCards: LinkItem[] = [
  {
    title: 'Add Blueprint',
    path: '/addblueprint',
    icon: 'kind-icon:plus',
    description: 'Create a new AI-ready blueprint for use in generations.',
  },
  {
    title: 'View Gallery',
    path: '/blueprints',
    icon: 'kind-icon:grid',
    description: 'Browse your saved and shared blueprints.',
  },
]
</script>
