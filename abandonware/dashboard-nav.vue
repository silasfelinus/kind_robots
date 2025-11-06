<!-- /components/content/story/dashboard-nav.vue -->
<template>
  <nav-grid :cards="tabs" />
</template>

<script setup lang="ts">
import type { LinkItem } from '~/stores/linkStore'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useDisplayStore } from '~/stores/displayStore'

const route = useRoute()
const displayStore = useDisplayStore()

const tabs: LinkItem[] = [
  {
    title: 'User Dashboard',
    path: '/dashboard',
    icon: 'kind-icon:dashboard',
    description: 'See your data and profile tools',
  },
  {
    title: 'Site Navigation',
    path: '/navigation',
    icon: 'kind-icon:compass',
    description: 'Explore app structure and flow',
  },
  {
    title: 'User Forum',
    path: '/forum',
    icon: 'kind-icon:gallery',
    description: 'Join discussions and share ideas',
  },
  {
    title: 'Milestones',
    path: '/milestones',
    icon: 'kind-icon:star',
    description: 'Track your progress and rewards',
  },
  {
    title: 'User Chat',
    path: '/chats',
    icon: 'kind-icon:chat',
    description: 'Converse with bots and users',
  },
]

const selected = ref('')

const selectTab = (path: string) => {
  const match = tabs.find((tab) => tab.path === path)
  if (match) {
    selected.value = match.title
    displayStore.setMainComponent(match.title)
  }
}

watch(
  () => route.path,
  () => selectTab(route.path),
  { immediate: true },
)
</script>
