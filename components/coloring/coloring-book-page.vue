<!-- /components/coloring/coloring-book-page.vue -->
<template>
  <project-front-page
    class="kr-surface"
    slug="coloring-book"
    :fallback="config"
    :show-deliverables="false"
    wide
  >
    <template #interactive>
      <CurationColoringBookCuration />
    </template>
  </project-front-page>
</template>

<script setup lang="ts">
import CurationColoringBookCuration from '@/components/curation/coloring-book-curation.vue'
import type { ProjectFrontConfig } from '@/components/conductor/projectFront'

const config: ProjectFrontConfig = {
  slug: 'coloring-book',
  title: 'Coloring Book',
  icon: 'kind-icon:paintbrush',
  tagline: 'Build, review, pair, package, and color three living books.',
  description:
    'A ledger-backed production studio for Monster Recast, Hollywood Recast, and Kind Robots. Track the exact next action for all 108 interiors and three covers, edit canonical Conductor prompts, compare current and historical color and black-and-white versions, request targeted candidates or revisions, adopt legacy set assets, accept working masters, confirm final pairs, inspect source and print-package readiness, diagnose queue failures, and preview finished pages in the shared coloring engine.',
  deliverables: {
    done: [
      'Shared coloring engine with region fill, flood fill, palette, undo, and export',
      'Three canonical 36-proposal production ledgers in Conductor',
      'Proposal-targeted color and B&W generation with human-gated acceptance',
      'Matched-pair validation and finalization controls',
      'Legacy set-asset adoption without fabricated provenance',
      'Archived revision and rejection history browser',
      'Whole-book interior readiness dashboard',
      'Canonical three-book cover source production',
      'Vendor-neutral print-package readiness and ordered interior manifests',
    ],
    next: [
      'Choose printer, trim, binding, paper, bleed, and cover template',
      'Generate interior PDFs, cover-wrap PDFs, and source archives',
      'Storefront hand-off',
    ],
  },
}
</script>
