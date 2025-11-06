<!-- /components/content/layout/vertical-nav.vue -->
<template>
  <nav-grid :cards="tabs" />
</template>

<script setup lang="ts">
import type { LinkItem } from '~/stores/linkStore'

const tabs: LinkItem[] = [
  {
    title: 'Home',
    path: '/',
    icon: 'kind-icon:home',
    description: 'Return to the main world of Kind Robots',
  },
  {
    title: 'Bot Cafe',
    path: '/botcafe',
    icon: 'kind-icon:addbot',
    description: 'Create and customize your bots',
  },
  {
    title: 'Prompt Factory',
    path: '/pitch',
    icon: 'kind-icon:chatbubble',
    description: 'Cook up new ideas for AI generation',
  },
  {
    title: 'Art Lab',
    path: '/artmaker',
    icon: 'kind-icon:easel',
    description: 'Generate and remix AI artwork',
  },
  {
    title: 'Memory Match',
    path: '/memory',
    icon: 'kind-icon:brain',
    description: 'Play and train your memory skills',
  },
  {
    title: 'Wonderlab',
    path: '/wonderlab',
    icon: 'kind-icon:gearhammer',
    description: 'Experiment with advanced AI tools',
  },
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: 'kind-icon:settings',
    description: 'Manage your account and stats',
  },
]
</script>
