<!-- /components/conductor/watchlist-page.vue -->
<template>
  <ProjectFrontPage slug="media-watchlist" :fallback="config" />
</template>

<script setup lang="ts">
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'

const config: ProjectFrontConfig = {
  slug: 'media-watchlist',
  title: 'Media Watchlist',
  channelKey: 'wonder',
  tabKey: 'watchlist',
  icon: 'kind-icon:movie',
  tagline: 'Everything you meant to watch, in one honest list.',
  description:
    'A structured log for films and shows. Queue what you want to watch, mark what you are in the middle of, and archive what you finished — so "what should we watch tonight" finally has a single source of truth.',
  sections: [
    {
      key: 'queue',
      title: 'Queue it',
      body: 'Capture titles the moment you hear about them, before they vanish from memory.',
      icon: 'kind-icon:plus',
    },
    {
      key: 'track',
      title: 'Track it',
      body: 'Queue, in-progress, and finished — a clean three-state flow with no clutter.',
      icon: 'kind-icon:check-circle',
    },
  ],
  deliverables: {
    done: [
      'Watchlist data model and API',
      'Status flow (queued / watching / done)',
    ],
    next: ['List + detail UI', 'Shared household lists'],
  },
}
</script>
