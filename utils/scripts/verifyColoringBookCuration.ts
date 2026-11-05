// Coloring Book curation: editable riff/recast and version revert
// (Silas, 2026-11-04 PT).
import assert from 'node:assert/strict'
import { parse as parseYaml } from 'yaml'
import type {
  ColoringBookProductionState,
  ColoringBookProposal,
} from '~/types/coloringBookStudio'
import {
  buildColoringBookStudioData,
  parseColoringBookConcepts,
  upsertColoringBookConcept,
} from '@/server/utils/coloringBookStudio'
import {
  coloringBookBwRequest,
  coloringBookVersions,
  shownVersionPath,
} from '@/utils/coloringBookVersions'

// --- upsertColoringBookConcept -------------------------------------------

const monster = `set: monster-recast
version: 2
concepts:
  - id: mr-001
    working_title: The Perfect Woman
    source_lineage: Frankenstein's monster laboratory activation
    recast: >
      Woman Doctor Frankenstein and her hunchbacked assistant
      create a statuesque Amazonian woman.
    framing: Low wide view.

  - id: mr-002
    working_title: Sweet Dreams, Darling
    framing: Bedroom threshold.

group_page_seeds:
  - title: Royal Monsters
    hook: keep me
`

const edited = upsertColoringBookConcept(
  monster,
  'monster-recast',
  'mr-001',
  {
    sourceLineage: 'Bride: the lab reveal',
    recast: 'A woman doctor builds a giantess.',
  },
  'The Perfect Woman',
)
const editedData = parseYaml(edited) as {
  concepts: Record<string, string>[]
  group_page_seeds: unknown[]
}
assert.equal(editedData.concepts[0]!.source_lineage, 'Bride: the lab reveal')
assert.equal(
  editedData.concepts[0]!.recast,
  'A woman doctor builds a giantess.',
)
assert.equal(
  editedData.concepts[0]!.framing,
  'Low wide view.',
  'folded recast fully replaced',
)
assert.equal(editedData.group_page_seeds.length, 1, 'later sections untouched')
assert.ok(
  edited.includes('  - id: mr-002\n    working_title: Sweet Dreams, Darling'),
)

// A concept with no lineage/recast lines gets them inserted after the title.
const inserted = upsertColoringBookConcept(
  monster,
  'monster-recast',
  'mr-002',
  { sourceLineage: 'Freddy Krueger', recast: 'A burn-survivor woman' },
  'Sweet Dreams, Darling',
)
const insertedConcepts = parseColoringBookConcepts(inserted)
assert.equal(insertedConcepts['mr-002']!.sourceLineage, 'Freddy Krueger')
assert.equal(
  insertedConcepts['mr-001']!.recast?.startsWith('Woman Doctor'),
  true,
)

// A page with no block is appended inside `concepts:`, before later keys.
const appended = upsertColoringBookConcept(
  monster,
  'monster-recast',
  'mr-003',
  { sourceLineage: 'The Ring', recast: '' },
  'Broadcast Giant',
)
const appendedData = parseYaml(appended) as {
  concepts: { id: string; recast: null }[]
  group_page_seeds: unknown[]
}
assert.deepEqual(
  appendedData.concepts.map((c) => c.id),
  ['mr-001', 'mr-002', 'mr-003'],
)
assert.equal(appendedData.concepts[2]!.recast, null)
assert.equal(appendedData.group_page_seeds.length, 1)

// Hollywood Recast has no concept file yet: the first save creates one.
const created = upsertColoringBookConcept(
  '',
  'hollywood-recast',
  'hwr-019',
  {
    sourceLineage: 'The subway-grate breeze from The Seven Year Itch',
    recast: 'A jolly, hairy Scotsman whose kilt billows up',
  },
  'Nebula "Crooner"',
)
const createdConcepts = parseColoringBookConcepts(created)
assert.equal(
  createdConcepts['hwr-019']!.recast,
  'A jolly, hairy Scotsman whose kilt billows up',
)
assert.equal((parseYaml(created) as { set: string }).set, 'hollywood-recast')
assert.equal(
  (parseYaml(created) as { concepts: { working_title: string }[] }).concepts[0]!
    .working_title,
  'Nebula "Crooner"',
)

// --- render settings + accepted history are read from the queue ----------

const queue = `books:
- order: 1
  slug: monster-recast
  entries:
  - slot: 1
    id: mr-001
    status: approved
    rendered_path: projects/coloring-book/sets/monster-recast/approved/perfect-woman-color.webp
    engine: sdxl-checkpoint
    checkpoint: Illustrious/arthemyWesternArt_v30.safetensors
    lora: coloring/lineart.safetensors
    lora_strength: 0.75
    accepted_history:
    - variant: color
      path: generated/color-proposals-v1/mr-001-perfect-woman.webp
      replaced_at: '2026-11-04T20:00:00Z'
    - variant: bw
      path: generated/bw/mr-001-bw.webp
      replaced_at: '2026-11-04T20:00:00Z'
    bw_status: pending
`
const ledger = `book:
  order: 1
  slug: monster-recast
  title: Monster Recast
proposals:
- slot: 1
  id: mr-001
  title: "The Perfect Woman"
  prompt: {text: null, ref: homage-concepts.yaml#mr-001}
  inspirations:
  - {path: approved/perfect-woman-color.webp, kind: discovered-color-candidate}
  - {path: approved/perfect-woman-bw.webp, kind: discovered-bw-candidate}
  accepted: {color: approved/perfect-woman-color.webp, bw: null}
  final: {color: null, bw: null}
  notes: []
`
const data = buildColoringBookStudioData({
  queue,
  ledgers: { 'monster-recast': ledger },
  prompts: { 'monster-recast': '' },
  concepts: { 'monster-recast': monster },
})
const page = data.books.find((book) => book.slug === 'monster-recast')!
  .proposals[0] as ColoringBookProposal
assert.deepEqual(page.queue.renderSettings, {
  engine: 'sdxl-checkpoint',
  checkpoint: 'Illustrious/arthemyWesternArt_v30.safetensors',
  lora: 'coloring/lineart.safetensors',
  loraStrength: 0.75,
})
assert.equal(page.queue.acceptedHistory.length, 2)
assert.equal(
  page.concept?.sourceLineage,
  "Frankenstein's monster laboratory activation",
)

// --- version strip ------------------------------------------------------

const production = {
  bwRenderedPath: null,
  history: [
    {
      id: 'color:revision:x',
      variant: 'color',
      kind: 'revision',
      path: 'projects/coloring-book/sets/monster-recast/generated/color-proposals-v1/revisions/mr-001-perfect-woman-20260914T053610Z.webp',
      url: null,
      createdAt: '2026-09-14T05:36:10Z',
      status: 'done',
      score: null,
      verdict: null,
      reasons: [],
      artImageId: 17068,
      seed: null,
      engine: null,
    },
  ],
} as unknown as ColoringBookProductionState

const color = coloringBookVersions('monster-recast', page, production, 'color')
assert.deepEqual(
  color.map((version) => [version.label, version.path, version.current]),
  [
    ['Accepted', 'approved/perfect-woman-color.webp', true],
    [
      'Earlier pick',
      'generated/color-proposals-v1/mr-001-perfect-woman.webp',
      false,
    ],
    [
      'Earlier render',
      'generated/color-proposals-v1/revisions/mr-001-perfect-woman-20260914T053610Z.webp',
      false,
    ],
  ],
  'current first, de-duplicated against the original inspiration it came from',
)
assert.ok(
  color[0]!.url.startsWith(
    'https://raw.githubusercontent.com/silasfelinus/conductor/main/projects/coloring-book/sets/monster-recast/',
  ),
)

const bw = coloringBookVersions('monster-recast', page, production, 'bw')
assert.deepEqual(
  bw.map((version) => [version.label, version.path, version.current]),
  [
    ['Earlier pick', 'generated/bw/mr-001-bw.webp', false],
    ['Original', 'approved/perfect-woman-bw.webp', false],
  ],
)

// --- new B&W source -----------------------------------------------------

const bwFrom = (
  choice: Parameters<typeof coloringBookBwRequest>[0],
  picked: { color?: string; bw?: string } = {},
) => coloringBookBwRequest(choice, 'monster-recast', page, production, picked)

assert.deepEqual(
  bwFrom('shown-color'),
  { source: 'color', path: '' },
  'the accepted color master keeps the original conversion path',
)
assert.deepEqual(
  bwFrom('shown-color', {
    color:
      'projects/coloring-book/sets/monster-recast/generated/color-proposals-v1/mr-001-perfect-woman.webp',
  }),
  {
    source: 'version',
    path: 'generated/color-proposals-v1/mr-001-perfect-woman.webp',
  },
  'a previewed color version is sent set-relative',
)
assert.equal(
  bwFrom('shown-bw'),
  null,
  'no current B&W and none previewed means nothing to start from',
)
assert.deepEqual(bwFrom('shown-bw', { bw: 'generated/bw/mr-001-bw.webp' }), {
  source: 'version',
  path: 'generated/bw/mr-001-bw.webp',
})
assert.deepEqual(bwFrom('prompt', { color: 'approved/x.webp' }), {
  source: 'prompt',
  path: '',
})
assert.equal(
  shownVersionPath('monster-recast', page, production, 'color', null),
  'approved/perfect-woman-color.webp',
)

console.log('coloring book curation contract: ok')
