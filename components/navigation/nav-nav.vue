<!-- /components/content/nav/nav-nav.vue -->
<template>
  <nav-grid :cards="navCards" @card-click="handleClick" />
</template>

<script setup lang="ts">
import { useLinkStore } from '~/stores/linkStore'
import type { LinkItem } from '~/stores/linkStore'

const emit = defineEmits(['card-click', 'nav-selected'])

const linkStore = useLinkStore()

const navCards: LinkItem[] = [
  {
    title: 'Art Nav',
    icon: 'kind-icon:palette',
    description: 'Explore art tools and gallery options.',
    tooltip: 'Show Art Navigation',
  },
  {
    title: 'Bot Nav',
    icon: 'kind-icon:robot',
    description: 'Create, customize, and chat with AI bots.',
    tooltip: 'Show Bot Navigation',
  },
  {
    title: 'Dashboard Nav',
    icon: 'kind-icon:layout-dashboard',
    description: 'Access your profile, stats, and key features.',
    tooltip: 'Show Dashboard',
  },
  {
    title: 'Giftshop Nav',
    icon: 'kind-icon:shopping-bag',
    description: 'Buy tokens and support Kind Robots projects.',
    tooltip: 'Go shopping!',
  },
  {
    title: 'Lab Nav',
    icon: 'kind-icon:flask',
    description: 'Enter our experimental playground of tools.',
    tooltip: 'Open Lab Navigation',
  },
  {
    title: 'Prompt Nav',
    icon: 'kind-icon:speech-bubble',
    description: 'Craft, save, and reuse your best prompts.',
    tooltip: 'Show Prompt Tools',
  },
]

const titleToComponent = {
  'Art Nav': 'art-nav',
  'Bot Nav': 'bot-nav',
  'Dashboard Nav': 'dashboard-nav',
  'Giftshop Nav': 'giftshop-nav',
  'Lab Nav': 'lab-nav',
  'Prompt Nav': 'prompt-nav',
} as const

type NavTitle = keyof typeof titleToComponent

function handleClick(item: LinkItem) {
  if (item.title in titleToComponent) {
    linkStore.navComponent = titleToComponent[item.title as NavTitle]
    emit('nav-selected') // Switch to 'custom' in splash-nav
  } else {
    console.warn('Unknown nav title:', item.title)
  }
}
</script>
