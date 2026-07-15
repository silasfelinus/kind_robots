<!-- /components/conductor/humboldt-scoop-page.vue -->
<template>
  <ProjectFrontPage slug="humboldt-scoop" :fallback="config" />
</template>

<script setup lang="ts">
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'

const config: ProjectFrontConfig = {
  slug: 'humboldt-scoop',
  title: 'The Humboldt Scoop',
  channelKey: 'wonder',
  tabKey: 'humboldt-scoop',
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
  sections: [
    {
      key: 'service',
      title: 'The service',
      body: 'Weekly, bi-weekly, monthly, and one-time cleanup plans — plus commercial/HOA and shared-space routes. Flat honest pricing, cancel anytime, no long-term contract.',
      icon: 'kind-icon:check-circle',
    },
    {
      key: 'area',
      title: 'Service area',
      body: 'Core routes in Eureka, Arcata, and McKinleyville, with Trinidad, Cutten, Freshwater, and Blue Lake served by request.',
      icon: 'kind-icon:map-pin',
    },
    {
      key: 'story',
      title: 'The story',
      body: 'A neighborly Humboldt business built on trust, routine, and genuinely tidy lawns — plus a Poopstakes giveaway for every new customer.',
      icon: 'kind-icon:hand-heart',
    },
  ],
  stats: [
    { label: 'Service area', value: '3+ cities', icon: 'kind-icon:map-pin' },
    { label: 'Plan tiers', value: '4', icon: 'kind-icon:calendar' },
    { label: 'Contract', value: 'None', icon: 'kind-icon:sparkles' },
  ],
  collectionLabel: 'humboldt-scoop',
}
</script>
