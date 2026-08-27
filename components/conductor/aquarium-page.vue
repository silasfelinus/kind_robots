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
    'A darkly funny idle aquarium. Feed the occupants to keep them paying you, and unlock new species with what they earn. Every species has a field note, a rarity, and a reason it is not in any book — and the tank goes deeper than the ones you start with.',
  sections: [
    {
      key: 'loop',
      title: 'Feed the tank',
      body: 'Feed keeps a species paying out; hungry things pause, they never lose what they already earned.',
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
    done: [
      'Server-backed tanks with real offline income',
      'The real play loop — server-driven feeding and species unlocks',
      'Bestiary schema shared with Ruler Hooked',
      'Browsable public aquariums',
    ],
    next: ['Twenty species with generated art'],
  },
}
</script>
