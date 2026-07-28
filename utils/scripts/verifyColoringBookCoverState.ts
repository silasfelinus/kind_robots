import assert from 'node:assert/strict'
import { buildColoringBookCoverStates } from '@/server/utils/coloringBookCoverState'

const source = `schema_version: 1
defaults:
  engine: krea2
covers:
- order: 1
  book_slug: monster-recast
  title: Monster Recast
  source_ref: projects/coloring-book/sets/monster-recast/pages.yaml#cover
  prompt: >
    Original ensemble cover source illustration with a calm title area and many glamorous
    reimagined monster archetypes in one coherent old-Hollywood premiere scene.
  image_path: projects/coloring-book/sets/monster-recast/generated/cover/monster-recast-cover.webp
  status: done
  rendered_path: projects/coloring-book/sets/monster-recast/generated/cover/monster-recast-cover.webp
  art_image_id: 501
  render_seed: 123456
  render_engine: krea2
  completed_at: '2026-07-28T12:00:00Z'
  semantic_score: 91
  semantic_verdict: promote
  semantic_reasons: []
  rejected_path: null
  accepted_path: null
  approved_at: null
  final_path: null
  finalized_at: null
  revision_history:
  - requested_at: '2026-07-28T11:00:00Z'
    previous_status: needs_review
    art_image_id: 499
    semantic_score: 62
    archived_path: projects/coloring-book/sets/monster-recast/generated/cover/revisions/monster-recast-cover-old.webp
  notes:
  - Typography remains separate.
- order: 2
  book_slug: hollywood-recast
  title: Hollywood Recast
  source_ref: projects/coloring-book/sets/hollywood-recast/proposals.yaml#cover
  prompt: 'Inclusive imaginary studio ensemble with varied performers, crisp color,
    one coherent scene, and reserved title space.'
  image_path: projects/coloring-book/sets/hollywood-recast/generated/cover/hollywood-recast-cover.webp
  status: final
  rendered_path: projects/coloring-book/sets/hollywood-recast/generated/cover/hollywood-recast-cover.webp
  art_image_id: 502
  render_seed: 789
  render_engine: krea2
  completed_at: '2026-07-28T12:30:00Z'
  semantic_score: 94
  semantic_verdict: promote
  semantic_reasons:
  - Strong ensemble hierarchy.
  accepted_path: generated/cover/hollywood-recast-cover.webp
  approved_at: '2026-07-28T12:40:00Z'
  final_path: generated/cover/hollywood-recast-cover.webp
  finalized_at: '2026-07-28T12:45:00Z'
  revision_history: []
  notes: []
`

const states = buildColoringBookCoverStates(source)
assert.deepEqual(Object.keys(states), ['monster-recast', 'hollywood-recast'])

const monster = states['monster-recast']
assert.ok(monster)
assert.equal(monster.order, 1)
assert.match(monster.prompt, /calm title area/)
assert.equal(monster.status, 'done')
assert.equal(monster.artImageId, 501)
assert.equal(monster.renderSeed, 123456)
assert.equal(monster.semanticScore, 91)
assert.equal(monster.renderedUrl?.includes('monster-recast-cover.webp'), true)
assert.equal(monster.revisionHistory.length, 1)
assert.equal(monster.revisionHistory[0]?.previousStatus, 'needs_review')
assert.equal(monster.revisionHistory[0]?.artImageId, 499)
assert.equal(monster.revisionHistory[0]?.semanticScore, 62)
assert.equal(monster.revisionHistory[0]?.archivedUrl?.includes('/revisions/'), true)
assert.deepEqual(monster.notes, ['Typography remains separate.'])

const hollywood = states['hollywood-recast']
assert.ok(hollywood)
assert.match(hollywood.prompt, /Inclusive imaginary studio ensemble/)
assert.equal(hollywood.status, 'final')
assert.equal(hollywood.acceptedPath, 'generated/cover/hollywood-recast-cover.webp')
assert.equal(hollywood.finalPath, 'generated/cover/hollywood-recast-cover.webp')
assert.equal(hollywood.finalUrl?.includes('hollywood-recast-cover.webp'), true)
assert.deepEqual(hollywood.semanticReasons, ['Strong ensemble hierarchy.'])

console.log('Coloring Book cover-state contract passed.')
