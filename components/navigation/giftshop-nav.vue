<!-- /components/content/story/giftshop-nav.vue -->
<template>
  <nav-grid :cards="tabs" />
</template>

<script setup lang="ts">
import type { LinkItem } from '~/stores/linkStore'

const tabs: LinkItem[] = [
  {
    title: 'Gift Shop',
    path: '/giftshop',
    icon: 'kind-icon:gift',
    description: 'Shop for art, merch, and tokens',
  },
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: 'kind-icon:dashboard',
    description: 'Manage your profile and tools',
  },
  {
    title: 'Forum',
    path: '/forum',
    icon: 'kind-icon:gallery',
    description: 'Join the community conversation',
  },
  {
    title: 'Credits',
    path: '/credits',
    icon: 'kind-icon:coin',
    description: 'Buy tokens and subscription plans',
  },
  {
    title: 'About',
    path: '/about',
    icon: 'kind-icon:info',
    description: 'Learn about Kind Robots',
  },
  {
    title: 'AmiBot',
    path: '/amibot',
    icon: 'kind-icon:butterfly',
    description: 'Talk to our quirky AI hostess',
  },
]
</script>
