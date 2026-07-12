<!-- /components/conductor/davinci-page.vue -->
<template>
  <ProjectFrontPage slug="davinci" :fallback="config" />
</template>

<script setup lang="ts">
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'

const config: ProjectFrontConfig = {
  slug: 'davinci',
  title: 'Da Vinci',
  channelKey: 'wonder',
  tabKey: 'davinci',
  icon: 'kind-icon:castle',
  tagline: 'Live a life. Leave a legacy.',
  description:
    'A generative life-and-legacy simulation. Each run seeds a life of ambition and craft, advances through chapters of choices that move your stats, collects art along the way, and resolves into an ending — with hundreds of achievements tracking every mark you leave.',
  launch: {
    label: 'Begin a life',
    href: '/davinci',
    icon: 'kind-icon:sparkles',
  },
  stats: [
    { label: 'achievements', value: '1000+', icon: 'kind-icon:trophy' },
    { label: 'endings', value: 'many', icon: 'kind-icon:book' },
  ],
  sections: [
    {
      key: 'choices',
      title: 'Chapters of choice',
      body: 'Every decision nudges your stats and bends the story toward a different legacy.',
      icon: 'kind-icon:map',
    },
    {
      key: 'legacy',
      title: 'A legacy that remembers',
      body: 'Runs collect generated art and unlock achievements that persist across lives.',
      icon: 'kind-icon:trophy',
    },
  ],
  deliverables: {
    done: [
      'Life-run schema (runs, choices, stats, endings, achievements)',
      'Da Vinci API surface',
    ],
    next: ['Playable run UI', 'Achievement gallery'],
  },
}
</script>
