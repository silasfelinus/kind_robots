<!-- /components/coloring/coloring-book-page.vue -->
<template>
  <ProjectFrontPage
    slug="coloring-book"
    :fallback="config"
    :show-deliverables="false"
  >
    <template #interactive>
      <div class="flex flex-col gap-5">
        <coloring-book-readiness />
        <div id="coloring-production-actions">
          <coloring-book-production-toolbar />
        </div>
        <coloring-book-production-history />
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
    'A ledger-backed production studio for Monster Recast, Hollywood Recast, and Kind Robots. Track the exact next action for all 108 interiors, review each 36-page ledger, edit canonical Conductor prompts, compare current and historical color and black-and-white versions, request targeted candidates or revisions, adopt legacy set assets, accept working masters, confirm final pairs, diagnose queue failures, and preview finished pages in the shared coloring engine.',
  sections: [
    {
      key: 'production',
      title: 'One canonical production view',
      body: 'The front end reads and updates the same proposal ledgers and production queue used by Conductor instead of maintaining unrelated prompt cards and gallery generations.',
      icon: 'kind-icon:book',
    },
    {
      key: 'review',
      title: 'Know the next action',
      body: 'Every interior is classified as blocked, needing generation, waiting for human acceptance, ready to finalize, or final. Open any row directly into its production controls.',
      icon: 'kind-icon:check',
    },
  ],
  deliverables: {
    done: [
      'Shared coloring engine with region fill, flood fill, palette, undo, and export',
      'Three canonical 36-proposal production ledgers in Conductor',
      'Proposal-targeted color and B&W generation with human-gated acceptance',
      'Matched-pair validation and finalization controls',
      'Legacy set-asset adoption without fabricated provenance',
      'Archived revision and rejection history browser',
      'Whole-book interior readiness dashboard',
    ],
    next: [
      'Canonical cover production management',
      'Print package validation and export',
      'Storefront hand-off',
    ],
  },
}
</script>
