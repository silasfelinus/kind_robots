<!-- /components/conductor/ruler-hooked-page.vue -->
<template>
  <ProjectFrontPage slug="ruler-hooked" :fallback="config">
    <template #interactive>
      <RulerHookedGame />
    </template>
  </ProjectFrontPage>
</template>

<script setup lang="ts">
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'

const config: ProjectFrontConfig = {
  slug: 'ruler-hooked',
  title: 'Ruler Hooked',
  channelKey: 'wonder',
  tabKey: 'ruler-hooked',
  icon: 'kind-icon:crown',
  tagline: 'Rule the shore. Answer to the tide.',
  description:
    'A fishing-meets-kingdom-management slideshow sim. Cast lines, land catches, and spend the haul running a seaside realm through a slideshow of tides and decisions — where every catch reshapes the crown you wear.',
  sections: [
    {
      key: 'fish',
      title: 'Cast & catch',
      body: "Work the tides for the day's haul; rare catches swing the whole kingdom.",
      icon: 'kind-icon:fish',
    },
    {
      key: 'rule',
      title: 'Rule the realm',
      body: 'Spend your catch on the seaside kingdom and live with the consequences.',
      icon: 'kind-icon:crown',
    },
  ],
  deliverables: {
    done: ['Core loop design', 'Slideshow-sim structure'],
    next: ['Playable slideshow UI', 'Catch + kingdom balancing'],
  },
}
</script>
