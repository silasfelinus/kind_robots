<template>
  <nav-grid :cards="tabs" />
</template>

<script setup lang="ts">
import type { LinkItem } from '~/stores/linkStore'
import { useDisplayStore } from '~/stores/displayStore'

const displayStore = useDisplayStore()

const tabs: (LinkItem & { onClick: () => void })[] = [
  {
    title: 'Brainstorm2',
    icon: 'kind-icon:lightbulb',
    description: 'Classic brainstorming mode for raw ideas.',
    onClick: () => displayStore.setMainComponent('BrainstormView'),
  },
  {
    title: 'Pitch Display',
    icon: 'kind-icon:list',
    description: 'Browse and sort all current pitch ideas.',
    onClick: () => displayStore.setMainComponent('PitchDisplay'),
  },
  {
    title: 'Add Pitch',
    icon: 'kind-icon:plus',
    description: 'Create a new AI prompt pitch.',
    onClick: () => displayStore.setMainComponent('AddPitch'),
  },
  {
    title: 'Brainstorm!',
    icon: 'kind-icon:zap',
    description: 'Playful chaos mode — spark ideas by randomness!',
    onClick: () => displayStore.setMainComponent('Brainstorm'),
  },
]
</script>
