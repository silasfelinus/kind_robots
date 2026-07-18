<!-- /components/conductor/newsfeed-page.vue -->
<template>
  <ProjectFrontPage slug="newsfeed" :fallback="config">
    <template #interactive>
      <section
        class="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm"
      >
        <h2 class="mb-4 text-base font-black text-base-content">Live feed</h2>
        <NewsfeedFeed />
      </section>
    </template>
  </ProjectFrontPage>
</template>

<script setup lang="ts">
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'

const config: ProjectFrontConfig = {
  slug: 'newsfeed',
  title: 'Newsfeed',
  channelKey: 'wonder',
  tabKey: 'newsfeed',
  icon: 'kind-icon:scroll',
  tagline: 'The front page the swarm writes itself.',
  description:
    'A programmable, remixable homepage feed of everything Kind Robots is making right now — fresh art, new stories, pitches in review, and project milestones. Configure what surfaces and the feed keeps the front door alive.',
  sections: [
    {
      key: 'live',
      title: 'Always fresh',
      body: 'Art, stories, and milestones flow in as the swarm creates them.',
      icon: 'kind-icon:sparkles',
    },
    {
      key: 'programmable',
      title: 'Programmable',
      body: 'Pick the sources and ordering; the feed becomes a homepage you can tune.',
      icon: 'kind-icon:wrench',
    },
  ],
  deliverables: {
    done: [
      'Feed concept and content sources mapped',
      'Server-side RSS/Atom aggregation pipeline',
      'Feed builder + item renderers',
      'Homepage placement',
    ],
    next: ['Category filtering beyond feed slugs', 'Perspective balancing UI'],
  },
}
</script>
