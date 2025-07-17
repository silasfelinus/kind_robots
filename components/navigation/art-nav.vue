<!-- /components/content/art/art-nav.vue -->
<template>
  <nav-grid :cards="artCards" />
</template>

<script setup lang="ts">
import type { LinkItem } from '~/stores/linkStore'

const artCards: LinkItem[] = [
  {
    title: 'Add Art',
    path: '/addart',
    icon: 'kind-icon:plus',
    description: 'Upload your own image or generate art using our tools.',
  },
  {
    title: 'Gallery',
    path: '/artgallery',
    icon: 'kind-icon:gallery',
    description: 'Browse your past artwork and saved creations.',
  },
  {
    title: 'Edit Art',
    path: '/editor',
    icon: 'kind-icon:sparkles',
    description: 'Choose an image and transform it with text or presets.',
  },
  {
    title: 'Animal Hybrid',
    path: '/hybrid',
    icon: 'kind-icon:plus',
    description:
      'Use AI to invent hybrid creatures by merging two real-world animals.',
  },
]
</script>
