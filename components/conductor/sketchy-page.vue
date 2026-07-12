<!-- /components/conductor/sketchy-page.vue -->
<template>
  <ProjectFrontPage slug="sketchy" :fallback="config">
    <template #interactive>
      <ProjectPitchBoard
        slug="sketchy"
        noun="assignment"
        title="Your sketch assignments"
        icon="kind-icon:pencil"
        body-placeholder="Draft a drawing assignment — subject, constraint, time limit."
        empty-text="No assignments yet. Give yourself the first prompt."
      />
    </template>
  </ProjectFrontPage>
</template>

<script setup lang="ts">
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'

const config: ProjectFrontConfig = {
  slug: 'sketchy',
  title: 'Sketchy',
  channelKey: 'academy',
  tabKey: 'sketchy',
  icon: 'kind-icon:pencil',
  tagline: 'Show up, fill the page, get a little better.',
  description:
    'A drawing-habit studio. Sketchy hands you an assignment and a timer, then offers gentle critique — the low-pressure daily practice that turns "I can\'t draw" into a stack of finished pages.',
  sections: [
    {
      key: 'prompt',
      title: 'A prompt a day',
      body: 'Fresh assignments and constraints keep the blank page from winning.',
      icon: 'kind-icon:pencil',
    },
    {
      key: 'critique',
      title: 'Kind critique',
      body: 'Honest, encouraging feedback that helps without stinging.',
      icon: 'kind-icon:hand-heart',
    },
  ],
  deliverables: {
    done: ['Assignment + critique concept', 'Reference imagery'],
    next: ['Daily prompt engine', 'Submission + streak tracking'],
  },
}
</script>
