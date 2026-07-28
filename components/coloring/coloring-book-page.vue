<!-- /components/coloring/coloring-book-page.vue -->
<template>
  <ProjectFrontPage
    slug="coloring-book"
    :fallback="config"
    :show-deliverables="false"
  >
    <template #interactive>
      <coloring-book-studio />
    </template>
  </ProjectFrontPage>
</template>

<script setup lang="ts">
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'

const config: ProjectFrontConfig = {
  slug: 'coloring-book',
  title: 'Coloring Book',
  channelKey: 'art',
  tabKey: 'coloring',
  icon: 'kind-icon:paintbrush',
  tagline: 'Build, review, pair, and color three living books.',
  description:
    'A ledger-backed production studio for Monster Recast, Hollywood Recast, and Kind Robots. Review all 36 proposal slots in each book, edit the canonical Conductor prompts, compare current color and black-and-white versions, request targeted candidates or revisions, inspect queue failures, and preview finished pages in the shared coloring engine.',
  sections: [
    {
      key: 'production',
      title: 'One canonical production view',
      body: 'The front end now reads the same proposal ledgers and color queue used by Conductor instead of maintaining unrelated prompt cards and gallery generations.',
      icon: 'kind-icon:book',
    },
    {
      key: 'review',
      title: 'Prompt, render, and review by page',
      body: 'Select any proposal ID, inspect its strongest color and line-art candidates, save the real production prompt, and send a proposal-targeted render request through the semantic-gated pipeline.',
      icon: 'kind-icon:sparkles',
    },
  ],
  deliverables: {
    done: [
      'Shared coloring engine with region fill, flood fill, palette, undo, and export',
      'Sampler and Cozy Corner end-user sets',
      'Three canonical 36-proposal production ledgers in Conductor',
    ],
    next: [
      'Proposal-level acceptance and final-pair promotion controls',
      'Targeted black-and-white conversion after color-master approval',
      'Print-ready package and storefront hand-off',
    ],
  },
}
</script>
