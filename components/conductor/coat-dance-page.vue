<!-- /components/conductor/coat-dance-page.vue -->
<template>
  <ProjectFrontPage slug="coat-dance" :fallback="config" />
</template>

<script setup lang="ts">
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'

const config: ProjectFrontConfig = {
  slug: 'coat-dance',
  title: 'Coat Dance',
  channelKey: 'art',
  tabKey: 'coat-dance',
  icon: 'kind-icon:sparkles',
  tagline: 'Motion and costume, remixed into delight.',
  description:
    'A playful video-remix project. Coat Dance takes movement and costume and loops them into short, joyful clips — the creative sandbox where a swishing coat becomes a whole tiny performance.',
  collectionLabel: 'coat-dance',
  sections: [
    {
      key: 'remix',
      title: 'Remix motion',
      body: 'Loop and layer movement into short clips that move exactly as ridiculously as intended.',
      icon: 'kind-icon:sparkles',
    },
    {
      key: 'share',
      title: 'Share the loop',
      body: 'Finished dances land in the gallery, ready to share and remix again.',
      icon: 'kind-icon:send',
    },
  ],
  deliverables: {
    done: ['Concept and reference collection'],
    next: ['Clip remixer UI', 'Export + share flow'],
  },
}
</script>
