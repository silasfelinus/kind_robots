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
      body: 'Reliable yard cleanups on a schedule that fits your household and your dogs.',
      icon: 'kind-icon:check-circle',
    },
    {
      key: 'story',
      title: 'The story',
      body: 'A neighborly Humboldt business built on trust, routine, and genuinely tidy lawns.',
      icon: 'kind-icon:hand-heart',
    },
  ],
}
</script>
