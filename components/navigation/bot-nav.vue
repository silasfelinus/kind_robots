<!-- /components/content/navigation/bot-nav.vue -->
<template>
  <nav-grid :cards="tabs" />
</template>

<script setup lang="ts">
import type { LinkItem } from '@/stores/linkStore'

const tabs: LinkItem[] = [
  {
    title: 'Add Bot',
    path: '/add-bot',
    icon: 'kind-icon:bot',
    description: 'Create and configure a new bot',
    tooltip: 'Open the bot creation form',
  },
  {
    title: 'Use Bot',
    path: '/use-bot',
    icon: 'kind-icon:chat',
    description: 'Chat with existing bots',
    tooltip: 'Test and deploy your bots',
  },
  {
    title: 'Stream Tester',
    path: '/stream',
    icon: 'kind-icon:bolt',
    description: 'Run live stream tests',
    tooltip: 'Play with streaming APIs',
  },
]
</script>
