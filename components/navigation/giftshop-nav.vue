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
    title: 'Credits',
    path: '/credits',
    icon: 'kind-icon:coin',
    description: 'Buy tokens and subscription plans',
  },
  {
    title: 'Subscriptions',
    path: '/subscriptions',
    icon: 'kind-icon:rocket',
    description: 'Manage or cancel your monthly support',
  },
  {
    title: 'About',
    path: '/about',
    icon: 'kind-icon:info-circle',
    description: 'Learn about Kind Robots',
  },
  {
    title: 'AmiBot',
    path: '/amibot',
    icon: 'kind-icon:butterfly',
    description: 'Meet our quirky AI hostess',
  },
]
</script>
