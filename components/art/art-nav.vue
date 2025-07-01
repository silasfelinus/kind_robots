<!-- /components/content/art/art-nav.vue -->
<template>
  <nav-grid :cards="artCards" />
</template>

<script setup lang="ts">
const artCards = [
  {
    title: 'Add Art',
    icon: 'kind-icon:plus',
    to: '/addart',
    description: 'Upload your own image or generate art using our tools.',
  },
  {
    title: 'Gallery',
    icon: 'kind-icon:gallery',
    to: '/artgallery',
    description: 'Browse your past artwork and saved creations.',
  },
  {
    title: 'Edit Art',
    icon: 'kind-icon:sparkles',
    to: '/editor',
    description: 'Choose an image and transform it with text or presets.',
  },
  {
    title: 'Animal Hybrid',
    icon: 'kind-icon:plus',
    to: '/hybrid',
    description:
      'Use AI to invent hybrid creatures by merging two real-world animals.',
  },
]
</script>
