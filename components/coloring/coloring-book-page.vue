<!-- /components/coloring/coloring-book-page.vue -->
<template>
  <ProjectFrontPage
    slug="coloring-book"
    :fallback="config"
    :show-deliverables="false"
  >
    <template #interactive>
      <div class="flex flex-col gap-5">
        <coloring-book-production-toolbar />
        <coloring-book-studio />
      </div>
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
    'A ledger-backed production studio for Monster Recast, Hollywood Recast, and Kind Robots. Review all 36 proposal slots in each book, edit the canonical Conductor prompts, compare current color and black-and-white versions, request targeted candidates or revisions, accept working masters, confirm final pairs, inspect queue failures, and preview finished pages in the shared coloring engine.',
  sections: [
    {
      key: 'production',
      title: 'One canonical production view',
      body: 'The front end reads and updates the same proposal ledgers and production queue used by Conductor instead of maintaining unrelated prompt cards and gallery generations.',
      icon: 'kind-icon:book',
    },
    {
      key: 'review',
      title: 'Prompt, render, accept, and pair',
      body: 'Select any proposal ID, inspect its current candidates, save the real production prompt, request exact renders, accept color and B&W masters, and finalize a mechanically and semantically validated matched pair.',
      icon: 'kind-icon:sparkles',
    },
  ],
  deliverables: {
    done: [
      'Shared coloring engine with region fill, flood fill, palette, undo, and export',
      'Three canonical 36-proposal production ledgers in Conductor',
      'Proposal-targeted color and B&W generation with human-gated acceptance',
      'Matched-pair validation and finalization controls',
    ],
    next: [
      'Rejected and revision candidate history browser',
      'Cover production management',
      'Print-ready package and storefront hand-off',
    ],
  },
}
</script>
