<!-- /components/conductor/voice-lab-page.vue -->
<template>
  <ProjectFrontPage slug="alexa-integration" :fallback="config" />
</template>

<script setup lang="ts">
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'

const config: ProjectFrontConfig = {
  slug: 'alexa-integration',
  title: 'Voice Lab',
  channelKey: 'wonder',
  tabKey: 'voice-lab',
  icon: 'kind-icon:microphone',
  tagline: 'Kind Robots, out loud.',
  description:
    'The experimental voice frontier: an Alexa skill and a local relay that let Serendipity and friends listen and speak. This lab is where the wiring is documented and the relay status shows whether the voice bridge is awake.',
  sections: [
    {
      key: 'skill',
      title: 'The skill',
      body: 'An Alexa skill that hands your voice to the Kind Robots narrators and back.',
      icon: 'kind-icon:microphone',
    },
    {
      key: 'relay',
      title: 'The relay',
      body: 'A local relay bridges the skill to the app; its status tells you if voice is live.',
      icon: 'kind-icon:server',
    },
  ],
  deliverables: {
    done: ['Voice skill + local relay prototype'],
    next: ['Relay status readout', 'Setup walkthrough'],
  },
}
</script>
