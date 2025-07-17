<!-- /components/content/resonance/resonance-nav.vue -->
<template>
  <nav-grid :cards="resonanceTabs" />
</template>

<script setup lang="ts">
import type { LinkItem } from '@/stores/linkStore'

const resonanceTabs: LinkItem[] = [
  {
    title: 'Gallery',
    description: 'Explore all resonances',
    path: '/resonancegallery',
    icon: 'kind-icon:resonance',
    tooltip: 'View the full resonance archive.',
  },
  {
    title: 'Create',
    description: 'Add a new resonance',
    path: '/addresonance',
    icon: 'kind-icon:resonance',
    tooltip: 'Launch the resonance creator.',
  },
  {
    title: 'Lab',
    description: 'Tinker and experiment',
    path: '/resonance',
    icon: 'kind-icon:resonance',
    tooltip: 'Hands-on resonance experiments.',
  },
]
</script>
