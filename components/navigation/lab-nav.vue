<template>
  <nav-grid :cards="tabs" />
</template>

<script setup lang="ts">
import { useUserStore } from '~/stores/userStore'
import { useDisplayStore } from '~/stores/displayStore'
import type { LinkItem } from '~/stores/linkStore'

const userStore = useUserStore()
const displayStore = useDisplayStore()

const tabs: (LinkItem & { onClick: () => void; requiresAdmin?: boolean })[] = [
  {
    title: 'Wonder Lab',
    icon: 'kind-icon:gearhammer',
    onClick: () => displayStore.setMainComponent('wonder-lab'),
  },
  {
    title: 'Animation Tester',
    icon: 'kind-icon:zap',
    onClick: () => displayStore.setMainComponent('animation-tester'),
  },
  {
    title: 'Store Tester',
    icon: 'kind-icon:settings',
    requiresAdmin: true,
    onClick: () => displayStore.setMainComponent('store-tester'),
  },
  {
    title: 'Rebel Button',
    icon: 'kind-icon:flame',
    onClick: () => displayStore.setMainComponent('rebel-button'),
  },
  {
    title: 'About Page',
    icon: 'kind-icon:info',
    onClick: () => displayStore.setMainComponent('about-page'),
  },
  {
    title: 'Sponsor Page',
    icon: 'kind-icon:coin',
    onClick: () => displayStore.setMainComponent('sponsor-page'),
  },
  {
    title: 'Sandbox',
    icon: 'kind-icon:box',
    onClick: () => displayStore.setMainComponent('sandbox-grid'),
  },
].filter((tab) => !tab.requiresAdmin || userStore.isAdmin)
</script>
