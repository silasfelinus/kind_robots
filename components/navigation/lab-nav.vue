<!-- /components/content/dev/dev-nav.vue -->
<template>
  <nav-grid :cards="tabs" />
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/userStore'
import type { LinkItem } from '~/stores/linkStore'

const userStore = useUserStore()

const tabs: LinkItem[] = [
  {
    title: 'Wonder Lab',
    icon: 'kind-icon:gearhammer',
    path: '/wonderlab',
    description: 'Experimental interface for testing wild ideas.',
    tooltip: 'Where concepts go to get weird.',
  },
  {
    title: 'Rebel Button',
    icon: 'kind-icon:flame',
    path: '/button',
    description: 'A button that does absolutely nothing.',
    tooltip: 'Fight the system by clicking it.',
  },
  {
    title: 'Blueprints',
    icon: 'kind-icon:blueprint',
    path: '/blueprints',
    description: 'Work in progress automated AI art and text generation',
    tooltip: 'WIP',
  },
  {
    title: 'Sandbox',
    icon: 'kind-icon:box',
    path: '/sandbox',
    description: 'Freestyle component testing zone.',
    tooltip: 'No rules, just vibes.',
  },

  {
    title: 'Resonance Gallery',
    description: 'Explore all resonances',
    path: '/resonances',
    icon: 'kind-icon:resonance',
    tooltip: 'View the full resonance archive.',
  },
  {
    title: 'Add Resonance',
    description: 'Add a new resonance',
    path: '/addresonance',
    icon: 'kind-icon:resonance',
    tooltip: 'Launch the resonance creator.',
  },
  {
    title: 'Resonance Lab',
    description: 'Tinker and experiment',
    path: '/resonance',
    icon: 'kind-icon:resonance',
    tooltip: 'Hands-on resonance experiments.',
  },
].filter((tab) => !(tab.title === 'Store Tester' && !userStore.isAdmin))
</script>
