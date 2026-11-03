// /utils/scripts/verifyBrainstormRiffs.test.ts
//
// brainstorm riff board: the pure rules behind /play/brainstorm -- starter
// decks, line ranking from Reactions, the art prompt every human line gets,
// and the coach request that keeps the AI a helper rather than a player.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  BRAINSTORM_LINE_REACTIONS,
  BRAINSTORM_RIFF_FLAVORS,
  BRAINSTORM_RIFF_LIMITS,
  BRAINSTORM_RIFF_STARTERS,
  buildCoachRequest,
  buildLineArtPrompt,
  emptyReactionCounts,
  fullLineText,
  isBrainstormLineReaction,
  lineHeat,
  normalizeRiffFlavor,
  parseCrossoverIds,
  pickCheer,
  reactionPoints,
  sortLines,
} from '../brainstormRiffs'
import { checkArtPromptContract } from '../../server/utils/artPromptContract'

const keys = new Set<string>()
for (const starter of BRAINSTORM_RIFF_STARTERS) {
  assert.ok(!keys.has(starter.key), `duplicate starter key ${starter.key}`)
  keys.add(starter.key)
  assert.ok(starter.key.length <= 80)
  assert.ok(starter.title.length <= BRAINSTORM_RIFF_LIMITS.title)
  assert.ok((starter.stem ?? '').length <= BRAINSTORM_RIFF_LIMITS.stem)
  assert.ok(
    BRAINSTORM_RIFF_FLAVORS.some((flavor) => flavor.id === starter.flavor),
  )
  for (const line of starter.lines) {
    assert.ok(line.length <= BRAINSTORM_RIFF_LIMITS.line)
  }
}
for (const starter of BRAINSTORM_RIFF_STARTERS) {
  for (const key of starter.crossoverKeys ?? []) {
    assert.ok(keys.has(key), `${starter.key} crosses over with unknown ${key}`)
  }
}

for (const key of [
  'vanderbuilt-lacrosse',
  'trashcan-jones',
  'robert-smith',
  'jones-lacrosse-crossover',
  'terrible-ice-cream',
  'i-like-obama-but',
]) {
  assert.ok(keys.has(key), `the original table's ${key} deck must be seeded`)
}

const vanderbuilt = BRAINSTORM_RIFF_STARTERS.find(
  (starter) => starter.key === 'vanderbuilt-lacrosse',
)!
assert.equal(
  fullLineText(vanderbuilt, 'owns a time share on Venus.'),
  'Vanderbuilt Lacrosse owns a time share on Venus.',
)
assert.equal(
  fullLineText({ stem: 'Robert Smith' }, '\'s favorite song is "Macarena".'),
  'Robert Smith\'s favorite song is "Macarena".',
)
assert.equal(
  fullLineText({ stem: "I don't like how he…" }, 'created global warming.'),
  "I don't like how he created global warming.",
)
assert.equal(fullLineText({ stem: null }, '  Broken   glass '), 'Broken glass')

for (const starter of BRAINSTORM_RIFF_STARTERS) {
  const sample = starter.lines[0] ?? 'is a sample answer.'
  const prompt = buildLineArtPrompt(starter, sample)
  const violations = checkArtPromptContract({ prompt, engine: 'krea2' })
  assert.deepEqual(
    violations,
    [],
    `${starter.key} art prompt broke the art prompt contract: ${JSON.stringify(violations)}`,
  )
}
assert.match(
  buildLineArtPrompt(
    { title: 'Terrible ice cream flavors', flavor: 'list' },
    'Uncooked bacon swirl',
  ),
  /Uncooked bacon swirl, pictured as one of the terrible ice cream flavors/,
)

const counts = emptyReactionCounts()
assert.equal(reactionPoints(counts), 0)
counts.LOVED = 2
counts.CLAPPED = 1
counts.BOOED = 1
counts.FLAGGED = 5
assert.equal(reactionPoints(counts), 2 * 3 + 2 + 1)
assert.deepEqual(
  BRAINSTORM_LINE_REACTIONS.map((entry) => entry.type),
  ['LOVED', 'CLAPPED', 'BOOED'],
)
assert.ok(isBrainstormLineReaction('FLAGGED'))
assert.ok(!isBrainstormLineReaction('HATED'))

const now = new Date('2026-11-03T20:00:00Z')
const hour = 3_600_000
const fresh = {
  id: 1,
  createdAt: new Date(now.getTime() - hour),
  counts: emptyReactionCounts(),
}
const loved = {
  id: 2,
  createdAt: new Date(now.getTime() - 3 * hour),
  counts: { ...emptyReactionCounts(), LOVED: 4 },
}
const stale = {
  id: 3,
  createdAt: new Date(now.getTime() - 200 * hour),
  counts: { ...emptyReactionCounts(), LOVED: 5 },
}
assert.ok(
  lineHeat(loved.counts, loved.createdAt, now) >
    lineHeat(fresh.counts, fresh.createdAt, now),
)
assert.deepEqual(
  sortLines([stale, fresh, loved], 'hot', now).map((line) => line.id),
  [2, 1, 3],
)
assert.deepEqual(
  sortLines([fresh, loved, stale], 'top', now).map((line) => line.id),
  [3, 2, 1],
)
assert.deepEqual(
  sortLines([stale, loved, fresh], 'new', now).map((line) => line.id),
  [1, 2, 3],
)

const coach = buildCoachRequest({
  riff: vanderbuilt,
  favorites: ['Vanderbuilt Lacrosse owns a time share on Venus.'],
  recent: ['Vanderbuilt Lacrosse owns a time share on Venus.'],
})
assert.match(coach.premise, /table coach, not a player/)
assert.match(coach.premise, /favorite answers so far/)
assert.match(coach.premise, /do not repeat/)
assert.match(coach.constraints, /never a finished answer/)
assert.ok(coach.count >= 1 && coach.count <= 6)

assert.equal(normalizeRiffFlavor('persona'), 'persona')
assert.equal(normalizeRiffFlavor('nonsense'), 'list')
assert.deepEqual(parseCrossoverIds('[3,"4",-1,"x"]'), [3, 4])
assert.deepEqual(parseCrossoverIds('not json'), [])
assert.equal(typeof pickCheer(-7), 'string')

const linesRoute = readFileSync(
  'server/api/brainstorm/riffs/[id]/lines.post.ts',
  'utf8',
)
assert.match(linesRoute, /enqueueLineArt\(/, 'every human line must queue art')
const riffBoard = readFileSync('server/utils/brainstorm/riffBoard.ts', 'utf8')
assert.match(riffBoard, /buildLineArtPrompt\(/)
assert.match(
  riffBoard,
  /'\/api\/art\/enqueue'/,
  'line art must go through the ArtJob pipeline',
)
const reactionsRoute = readFileSync(
  'server/api/reactions/index.post.ts',
  'utf8',
)
assert.match(
  reactionsRoute,
  /BRAINSTORM_LINE[\s\S]*\/api\/brainstorm\/lines/,
  'generic reactions must route Brainstorm lines to their own endpoint',
)

console.log('[brainstorm-riffs] ok')
