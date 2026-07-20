<!-- /components/conductor/coat-dance-page.vue -->
<template>
  <ProjectFrontPage slug="coat-dance" :fallback="config">
    <template #interactive>
      <section
        class="flex flex-col gap-3 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm"
      >
        <div class="flex items-center gap-2">
          <Icon name="kind-icon:sparkles" class="size-5 text-primary" />
          <h3
            class="text-sm font-black uppercase tracking-wide text-base-content/70"
          >
            Behind the coat
          </h3>
        </div>
        <p class="text-sm leading-relaxed text-base-content/70">
          The source is real: an experimental physical-theater duet with a black
          Goodwill trench coat, performed around 2006 while finishing a dance
          major at Humboldt State University — physical theater, object
          manipulation, juggling vocabulary, spins, pantomime, and deliberate
          weirdness. The plan is to use that original recording as the
          choreographic spine for an AI-assisted remix, expanding it with
          animation, perspective shifts, and style changes while keeping the
          strange intimacy between performer and coat.
        </p>
        <ul class="flex flex-col gap-1.5">
          <li
            v-for="stage in productionStages"
            :key="stage.key"
            class="flex items-center gap-2 text-sm"
          >
            <span
              class="badge badge-sm rounded-lg"
              :class="stage.status === 'done' ? 'badge-success' : 'badge-ghost'"
            >
              {{ stage.status === 'done' ? 'done' : 'planned' }}
            </span>
            <span class="text-base-content/80">{{ stage.title }}</span>
          </li>
        </ul>
      </section>
    </template>
  </ProjectFrontPage>
</template>

<script setup lang="ts">
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'

// Mirrors projects/coat-dance/roadmap.yaml milestones m1-m5. Update alongside
// the roadmap if a milestone's status changes.
type ProductionStage = {
  key: string
  title: string
  status: 'not-started' | 'done'
}
const productionStages: ProductionStage[] = [
  { key: 'm1', title: 'Source ingest and beat map', status: 'not-started' },
  {
    key: 'm2',
    title: 'Creative treatment and section plan',
    status: 'not-started',
  },
  {
    key: 'm3',
    title: 'Pipeline tests and style frames',
    status: 'not-started',
  },
  { key: 'm4', title: 'Section remixes and assembly', status: 'not-started' },
  {
    key: 'm5',
    title: 'Final review, export, and release decision',
    status: 'not-started',
  },
]

const config: ProjectFrontConfig = {
  slug: 'coat-dance',
  title: 'Coat Dance',
  channelKey: 'art',
  tabKey: 'coat-dance',
  icon: 'kind-icon:sparkles',
  tagline: 'Motion and costume, remixed into delight.',
  description:
    'A playful video-remix project. Coat Dance takes movement and costume and loops them into short, joyful clips — the creative sandbox where a swishing coat becomes a whole tiny performance.',
  collectionLabel: 'coat-dance',
  sections: [
    {
      key: 'remix',
      title: 'Remix motion',
      body: 'Loop and layer movement into short clips that move exactly as ridiculously as intended.',
      icon: 'kind-icon:sparkles',
    },
    {
      key: 'share',
      title: 'Share the loop',
      body: 'Finished dances land in the gallery, ready to share and remix again.',
      icon: 'kind-icon:send',
    },
  ],
  deliverables: {
    done: ['Concept and reference collection'],
    next: ['Clip remixer UI', 'Export + share flow'],
  },
}
</script>
