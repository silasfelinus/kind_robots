<!-- /components/conductor/packmaker-page.vue -->
<template>
  <ProjectFrontPage slug="packmaker" :fallback="config" />
</template>

<script setup lang="ts">
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'

const config: ProjectFrontConfig = {
  slug: 'packmaker',
  title: 'Packmaker',
  channelKey: 'builder',
  tabKey: 'packs',
  icon: 'kind-icon:box',
  tagline: 'Bundle it once. Share it everywhere.',
  description:
    'Packmaker turns loose creations into tidy, shareable packs. Choose the contents, set who can use them, and ship reusable content bundles and DLC that other builders can drop straight into their own worlds.',
  sections: [
    {
      key: 'bundle',
      title: 'Bundle anything',
      body: 'Group characters, art, scenarios, and rewards into one coherent pack.',
      icon: 'kind-icon:box',
    },
    {
      key: 'permission',
      title: 'Set the terms',
      body: 'Control access and sharing with the shared permission primitives.',
      icon: 'kind-icon:lock',
    },
  ],
  deliverables: {
    done: ['Pack concept + placement in Builder'],
    next: ['Pack builder UI', 'Access control + install flow'],
  },
}
</script>
