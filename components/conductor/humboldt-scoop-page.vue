<!-- /components/conductor/humboldt-scoop-page.vue -->
<template>
  <project-front-page class="kr-surface" slug="humboldt-scoop" :fallback="config" />
</template>

<script setup lang="ts">
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'

const config: ProjectFrontConfig = {
  slug: 'humboldt-scoop',
  title: 'The Humboldt Scoop',
  icon: 'kind-icon:heart',
  tagline: 'Small business, big heart, tidy yards.',
  description:
    'The Humboldt Scoop is a real-world pet-waste removal service with a warm local story. This is its Kind Robots home base — meet the service, hear the story, and book on the main site.',
  bridge: true,
  launch: {
    label: 'Visit the Humboldt Scoop',
    href: 'https://thehumboldtscoop.com',
    icon: 'kind-icon:external-link',
    external: true,
  },
  stats: [
    { label: 'Service area', value: '3+ cities', icon: 'kind-icon:map-pin' },
    { label: 'Plan tiers', value: '4', icon: 'kind-icon:calendar' },
    { label: 'Contract', value: 'None', icon: 'kind-icon:sparkles' },
  ],
  collectionLabel: 'humboldt-scoop',
}
</script>
