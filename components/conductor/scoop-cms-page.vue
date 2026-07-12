<!-- /components/conductor/scoop-cms-page.vue -->
<template>
  <ProjectFrontPage slug="humboldt-scoop-cms" :fallback="config" />
</template>

<script setup lang="ts">
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'

const config: ProjectFrontConfig = {
  slug: 'humboldt-scoop-cms',
  title: 'Humboldt Scoop CMS',
  channelKey: 'conductor',
  tabKey: 'scoop-cms',
  icon: 'kind-icon:heart',
  tagline: 'The back office behind the tidy yards.',
  description:
    'The admin console for the Humboldt Scoop service: manage customers, schedules, and routes so the real-world pet-waste business runs on rails. Internal, admin-only tooling.',
  sections: [
    {
      key: 'customers',
      title: 'Customers & routes',
      body: 'Keep the client book, addresses, and service schedule in one place.',
      icon: 'kind-icon:person',
    },
    {
      key: 'ops',
      title: 'Daily ops',
      body: 'Plan routes and track visits so nothing on the schedule slips.',
      icon: 'kind-icon:map',
    },
  ],
  deliverables: {
    done: ['Service domain modeled'],
    next: ['Customer + schedule console', 'Route planning view'],
  },
}
</script>
