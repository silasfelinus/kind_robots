<!-- /components/content/navigation/bot-nav.vue -->
<template>
  <nav-grid :cards="tabs" />
</template>

<script setup lang="ts">
import type { LinkItem } from '@/stores/linkStore'

const tabs: LinkItem[] = [
  {
    title: 'Add Bot',
    path: '/addbot',
    icon: 'kind-icon:bot',
    description: 'Create and configure a new bot',
    tooltip: 'Open the bot creation form',
  },
  {
    title: 'Bot Gallery',
    path: '/bots',
    icon: 'kind-icon:chat',
    description: 'Chat with existing bots',
    tooltip: 'Test and deploy your bots',
  },
  {
    title: 'Stream Tester',
    path: '/stream',
    icon: 'kind-icon:bolt',
    description: 'Run live stream tests',
    tooltip: 'Testing page for the API',
  },
]
</script>
