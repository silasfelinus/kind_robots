// Emperor of Dust quest art contract (conductor emperor-of-dust/t-063).
// Every QUEST_ART entry must ship as a file, every shipped quest file must be
// listed, and every entry must belong to an authored quest, so curated exports
// cannot silently drift from the manifest the game reads.
import assert from 'node:assert/strict'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { authoredQuestDef } from '../emperorOfDust/fortress/content'
import { QUEST_ART, questArtUrl } from '../emperorOfDust/fortress/questArt'

const dir = join(process.cwd(), 'public/emperor-of-dust/quests')
const listed = new Set(QUEST_ART)
assert.equal(listed.size, QUEST_ART.length, 'QUEST_ART has duplicate entries')

for (const asset of QUEST_ART) {
  assert.ok(existsSync(join(dir, `${asset}.webp`)), `missing file for ${asset}`)
  const base = asset.replace(/-(success|failure)$/, '')
  assert.ok(authoredQuestDef(base), `${asset} names no authored quest`)
}

for (const file of readdirSync(dir).filter((name) => name.endsWith('.webp'))) {
  assert.ok(
    listed.has(file.slice(0, -5)),
    `${file} ships but is not in QUEST_ART`,
  )
}

// The 2026-11-16 PT curation shipped a notice without one outcome: the dawn
// report falls back to the notice instead of the painted-map crop.
assert.equal(
  questArtUrl('r-deserter@12', 'failure'),
  '/emperor-of-dust/quests/r-deserter.webp',
)
assert.equal(
  questArtUrl('r-deserter', 'success'),
  '/emperor-of-dust/quests/r-deserter-success.webp',
)
// The 2026-11-17 PT redo curation shipped both burrow-gallery quests as tunnel
// interiors; r-deserter's failure was rejected again and still falls back.
assert.equal(
  questArtUrl('r-low-galleries', 'failure'),
  '/emperor-of-dust/quests/r-low-galleries-failure.webp',
)
assert.equal(
  questArtUrl('q-d07-galleries'),
  '/emperor-of-dust/quests/q-d07-galleries.webp',
)

console.log(`emperor quest art: ${QUEST_ART.length} entries verified`)
