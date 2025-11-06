<!-- /components/content/story/icon-nav.vue -->
<template>
  <nav-grid :cards="cards" />
</template>

<script setup lang="ts">
import type { LinkItem } from '~/stores/linkStore'

const cards: LinkItem[] = [
  {
    title: 'Add Icon',
    path: '/addicon',
    icon: 'kind-icon:plus',
    description: 'Create a new SmartIcon with custom metadata.',
  },
  {
    title: 'Icon Gallery',
    path: '/icons',
    icon: 'kind-icon:grid',
    description: 'Browse and manage all SmartIcons in the system.',
  },
]
</script>
