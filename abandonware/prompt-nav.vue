<template>
  <nav-grid :cards="tabs" />
</template>

<script setup lang="ts">
import type { LinkItem } from '~/stores/linkStore'
import { useDisplayStore } from '~/stores/displayStore'

const displayStore = useDisplayStore()

const tabs: LinkItem[] = [
  {
    title: 'Pitch Gallery',
    icon: 'kind-icon:list',
    description: 'Browse and sort all current pitch ideas.',
    path: '/pitches',
  },
  {
    title: 'Add Pitch',
    icon: 'kind-icon:plus',
    description: 'Create a new AI prompt pitch.',
    path: '/addpitch',
  },
  {
    title: 'Brainstorm!',
    icon: 'kind-icon:brain',
    description: 'Playful chaos mode — spark ideas by randomness!',
    path: '/brainstorm',
  },
]
</script>
