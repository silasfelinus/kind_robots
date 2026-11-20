// Emperor of Dust market item art contract (conductor emperor-of-dust/t-033).
// Every ITEM_ART id must ship as a file and name a real market item, and every
// shipped item icon must be listed, so curated exports cannot drift from the
// set the market reads.
import assert from 'node:assert/strict'
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { ITEM_ART, itemDef } from '../emperorOfDust/fortress/items'

const dir = join(process.cwd(), 'public/emperor-of-dust/items')

for (const id of ITEM_ART) {
  assert.ok(itemDef(id), `${id} names no market item`)
  assert.ok(existsSync(join(dir, `${id}.webp`)), `missing file for ${id}`)
}

for (const file of readdirSync(dir).filter((name) => name.endsWith('.webp'))) {
  assert.ok(
    ITEM_ART.has(file.slice(0, -5)),
    `${file} ships but is not in ITEM_ART`,
  )
}

// 2026-11-19 PT curation of ITEMS-ROUND-1 kept six; the other 24 reroll in ROUND-2.
assert.ok(ITEM_ART.has('road-lantern'))
assert.ok(
  !ITEM_ART.has('old-road-crowbar'),
  'rejected candle-dish render must not ship',
)

console.log(`Emperor item art: ${ITEM_ART.size} icons verified`)
