<!-- /components/conductor/aquarium-page.vue -->
<template>
  <project-front-page
    class="kr-surface"
    slug="cthulhuquarium"
    :fallback="config"
  >
    <template #interactive>
      <CthulhuquariumGame />
    </template>
  </project-front-page>
</template>

<script setup lang="ts">
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'

const config: ProjectFrontConfig = {
  slug: 'cthulhuquarium',
  title: 'Cthulhuquarium',
  icon: 'kind-icon:fish',
  tagline:
    'It sits in the back of the curiosity shop, and now it is yours to feed.',
  description:
    'A darkly funny idle aquarium. Click the drifting motes for coins, spend them on food, and keep the occupants fed well enough to keep paying you. Every species has a field note, a rarity, and a reason it is not in any book — and the tank goes deeper than the three you can see.',
  sections: [
    {
      key: 'loop',
      title: 'Feed the tank',
      body: 'Click for coins, buy food, keep the occupants fed. Fed things pay out; hungry things stop.',
      icon: 'kind-icon:coin',
    },
    {
      key: 'collect',
      title: 'Collect the unlistable',
      body: 'Each unlock reveals a field note written by someone who is not telling you everything.',
      icon: 'kind-icon:fish',
    },
  ],
  deliverables: {
    done: ['Play-loop prototype', 'Bestiary schema shared with Ruler Hooked'],
    next: [
      'Server-backed tanks and offline income',
      'Twenty species with generated art',
      'Browsable public aquariums',
    ],
  },
}
</script>
