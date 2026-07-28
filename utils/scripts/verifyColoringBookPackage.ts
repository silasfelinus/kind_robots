import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import type {
  ColoringBookCoverState,
  ColoringBookProposal,
  ColoringBookStudioBook,
} from '~/types/coloringBookStudio'
import { parseColoringBookPackageData } from '@/server/utils/coloringBookPackage'
import { reconcileColoringBookPackageData } from '@/utils/coloringBookPackage'

const packageYaml = `schema_version: 1
project: coloring-book
requirements:
  interior_slots: 1
  source_orientation: portrait
  source_aspect_ratio: '2:3'
  source_pixel_size: 1024x1536
  print_interior_variant: bw
  archive_color_masters: true
  final_cover_source_required: true
  source_ready_definition: All final pairs and cover source exist.
  package_ready_definition: Source, layout, and exports exist.
books:
- order: 1
  slug: kind-robots
  title: Kind Robots
  layout:
    trim_width_inches: null
    trim_height_inches: null
    bleed_inches: null
    binding: null
    paper: null
    interior_color_mode: null
    cover_color_mode: null
    printer_template: null
    page_count_includes_blanks: null
    inside_cover_printing: null
    barcode_area_reserved: null
  exports:
    ordered_interior_manifest: projects/coloring-book/packages/kind-robots/interiors.yaml
    interior_pdf: null
    cover_wrap_pdf: null
    source_archive: null
`

const fallback = parseColoringBookPackageData(null, packageYaml)
assert.equal(fallback.generated, false)
assert.equal(fallback.books.length, 1)
assert.equal(fallback.books[0]?.slug, 'kind-robots')
assert.equal(fallback.books[0]?.missingLayoutFields.length, 11)
assert.equal(fallback.books[0]?.missingExportFields.length, 3)
assert.equal(fallback.requirements.sourcePixelSize, '1024x1536')

const readinessYaml = `schema_version: 1
project: coloring-book
requirements:
  interior_slots: 1
books:
- order: 1
  slug: kind-robots
  title: Kind Robots
  status: exports-needed
  next_action: Generate export files.
  source_ready: true
  layout_ready: true
  exports_ready: false
  package_ready: false
  interior_count: 1
  expected_interior_count: 1
  final_pair_count: 1
  cover_status: final
  source_issues:
    missing_slots: []
    extra_slots: []
    duplicate_slots: []
    missing_prompts: []
    missing_final_color: []
    missing_final_bw: []
    missing_color_files: []
    missing_bw_files: []
    cover_not_final: false
    cover_final_path: generated/cover/kind-robots-cover.webp
    cover_final_exists: true
  missing_layout_fields: []
  missing_export_fields:
  - interior_pdf
  - cover_wrap_pdf
  - source_archive
  export_exists:
    interior_pdf: false
    cover_wrap_pdf: false
    source_archive: false
  ordered_interior_manifest: projects/coloring-book/packages/kind-robots/interiors.yaml
all_source_ready: true
all_package_ready: false
`

const generated = parseColoringBookPackageData(readinessYaml, packageYaml)
assert.equal(generated.generated, true)
assert.equal(generated.books[0]?.status, 'exports-needed')
assert.equal(generated.books[0]?.sourceReady, true)
assert.equal(generated.books[0]?.sourceIssues.coverNotFinal, false)
assert.deepEqual(generated.books[0]?.missingExportFields, [
  'interior_pdf',
  'cover_wrap_pdf',
  'source_archive',
])

const proposal: ColoringBookProposal = {
  slot: 1,
  id: 'kr-001',
  title: 'Final Page',
  prompt: 'A complete production prompt.',
  promptRef: null,
  promptSourcePath: 'projects/coloring-book/sets/kind-robots/proposals.yaml',
  inspirations: [],
  accepted: {
    color: 'approved/kr-001-color.webp',
    bw: 'approved/kr-001-bw.webp',
  },
  final: {
    color: 'approved/kr-001-color.webp',
    bw: 'approved/kr-001-bw.webp',
  },
  notes: [],
  queue: {
    status: 'approved',
    imagePath: null,
    renderedPath: null,
    artImageId: null,
    semanticScore: null,
    semanticVerdict: null,
    semanticAttempts: 0,
    semanticGateError: null,
    completedAt: null,
    renderEngine: null,
    revisionCount: 0,
  },
  colorPath: 'approved/kr-001-color.webp',
  colorUrl: null,
  bwPath: 'approved/kr-001-bw.webp',
  bwUrl: null,
}

const book: ColoringBookStudioBook = {
  order: 1,
  slug: 'kind-robots',
  title: 'Kind Robots',
  status: 'active-production',
  targetProposals: 1,
  coverIsSeparate: true,
  counts: {
    total: 1,
    prompts: 1,
    pending: 0,
    rendered: 0,
    acceptedColor: 1,
    acceptedPairs: 1,
    finalPairs: 1,
    needsReview: 0,
    blocked: 0,
  },
  proposals: [proposal],
}

const cover: ColoringBookCoverState = {
  order: 1,
  bookSlug: 'kind-robots',
  title: 'Kind Robots',
  prompt: 'A complete cover prompt.',
  sourceRef: null,
  imagePath: 'generated/cover/kind-robots-cover.webp',
  status: 'final',
  renderedPath: 'generated/cover/kind-robots-cover.webp',
  renderedUrl: null,
  artImageId: 1,
  renderSeed: 2,
  renderEngine: 'krea2',
  completedAt: null,
  semanticScore: 90,
  semanticVerdict: 'promote',
  semanticReasons: [],
  rejectedPath: null,
  rejectedUrl: null,
  acceptedPath: 'generated/cover/kind-robots-cover.webp',
  acceptedUrl: null,
  approvedAt: null,
  finalPath: 'generated/cover/kind-robots-cover.webp',
  finalUrl: null,
  finalizedAt: null,
  revisionHistory: [],
  notes: [],
}

const reconciled = reconcileColoringBookPackageData(
  fallback,
  [book],
  { 'kind-robots': cover },
  {},
)
assert.equal(reconciled.books[0]?.sourceReady, true)
assert.equal(reconciled.books[0]?.status, 'layout-needed')
assert.equal(reconciled.books[0]?.finalPairCount, 1)
assert.equal(reconciled.allSourceReady, true)
assert.equal(reconciled.allPackageReady, false)

const page = readFileSync('components/coloring/coloring-book-page.vue', 'utf8')
assert.match(page, /<coloring-book-package-readiness\s*\/>/)
assert.match(page, /<coloring-book-cover-studio\s*\/>/)

console.log('Coloring Book package contract passed.')
