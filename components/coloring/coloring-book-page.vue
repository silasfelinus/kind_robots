<!-- /components/coloring/coloring-book-page.vue -->
<template>
  <project-front-page
    class="kr-surface"
    slug="coloring-book"
    :fallback="config"
    :show-deliverables="false"
  >
    <template #interactive>
      <div class="flex flex-col gap-5">
        <CurationColoringBookCuration />

        <details class="group rounded-3xl border border-base-300 bg-base-100 shadow-sm">
          <summary
            class="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 p-4 marker:hidden"
          >
            <div>
              <h3 class="flex items-center gap-2 text-lg font-black">
                <Icon name="kind-icon:activity" class="size-5 text-primary" />
                Production controls & diagnostics
              </h3>
              <p class="mt-1 text-sm text-base-content/55">
                Readiness, packaging, covers, queue actions, history, and the full ledger inspector.
              </p>
            </div>
            <span class="badge badge-outline rounded-2xl group-open:badge-primary">
              Secondary tools
            </span>
          </summary>

          <div class="flex flex-col gap-5 border-t border-base-300 p-4">
            <coloring-book-readiness />
            <coloring-book-package-readiness />
            <coloring-book-cover-studio />
            <div id="coloring-production-actions">
              <coloring-book-production-toolbar />
            </div>
            <coloring-book-production-history />
            <coloring-book-studio />
          </div>
        </details>
      </div>
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
  sections: [
    {
      key: 'production',
      title: 'One canonical production view',
      body: 'The front end reads and updates the same proposal ledgers, cover queue, and package manifests used by Conductor instead of maintaining unrelated prompt cards and gallery generations.',
      icon: 'kind-icon:book',
    },
    {
      key: 'review',
      title: 'Know the next action',
      body: 'Every interior, cover, and publishing package is classified by its next required human or pipeline action, with source production kept separate from printer layout and export work.',
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
