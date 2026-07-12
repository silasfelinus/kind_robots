<!-- /components/conductor/conductor-app-page.vue -->
<template>
  <ProjectFrontPage slug="conductor-app" :fallback="config" />
</template>

<script setup lang="ts">
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'

const config: ProjectFrontConfig = {
  slug: 'conductor-app',
  title: 'Conductor App',
  channelKey: 'conductor',
  tabKey: 'conductor-app',
  icon: 'kind-icon:external-link',
  tagline: 'Steer the swarm from your pocket.',
  description:
    'The companion Flutter client for Conductor — review projects, approve gates, and nudge the build loop from a phone. This is its launch pad and status inside Kind Robots.',
  bridge: true,
  sections: [
    {
      key: 'mobile',
      title: 'Conductor, mobile',
      body: 'The steering surface, reshaped for a phone: projects, gates, and approvals.',
      icon: 'kind-icon:external-link',
    },
    {
      key: 'status',
      title: 'Build + launch',
      body: 'Track the Flutter client build and launch it when a deploy is live.',
      icon: 'kind-icon:server',
    },
  ],
  deliverables: {
    done: ['Flutter client project underway'],
    next: ['Web/app deploy + launch link', 'In-app project steering parity'],
  },
}
</script>
