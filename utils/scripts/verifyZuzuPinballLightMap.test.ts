// The insert light-map editor (conductor zuzu-pinball/t-017): the Last
// Bell's inserts, flashers and LED rail laid over its painted playfield in
// the private workshop. The model is pure: the map frame round-trips metres
// and pixels, every lamp lands on the art, nudges and drags are tracked to
// the millimetre, and the moves come back as table data to paste in.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  cssColor,
  insertSnippet,
  ledPositions,
  lightMapOf,
  mapFrame,
  movedInserts,
  nudged,
  NUDGE_FAST_M,
  NUDGE_M,
  roundMm,
} from '../arcade/pinball/lightMap'
import { AMI_VILLAGE_GREYBOX } from '../arcade/pinball/tables/amiVillage/table'
import { ZUZU_LAST_BELL_GREYBOX as table } from '../arcade/pinball/tables/zuzuLastBell/table'

const map = lightMapOf(table)
assert.equal(map.art, table.art?.playfield?.src, 'over the painted playfield')
assert.deepEqual(map.bounds.min, table.art?.playfield?.min)
assert.equal(map.inserts.length, table.inserts?.length)
assert.ok(map.inserts.length > 10, 'the Last Bell has its inserts')
assert.equal(map.flashers.length, table.flashers?.length ?? 0)
assert.equal(map.rail.leds.length, table.ledRail?.count, 'every LED placed')

// Everything the editor draws lands on the art.
const inside = ([x, z]: readonly [number, number]) =>
  x >= map.bounds.min[0] &&
  x <= map.bounds.max[0] &&
  z >= map.bounds.min[1] &&
  z <= map.bounds.max[1]
for (const i of map.inserts) assert.ok(inside(i.at), `${i.id} on the art`)
for (const f of map.flashers) assert.ok(inside(f.at), `${f.id} on the art`)
for (const led of map.rail.leds) assert.ok(inside(led), 'an LED on the art')

// The editor works on copies: the table itself never changes.
map.inserts[0]!.at = [9, 9]
assert.notDeepEqual(table.inserts![0]!.at, [9, 9])

// The frame: metres to pixels and back, square pixels, up the table is up.
{
  const frame = mapFrame(map.bounds, 600)
  const spanX = map.bounds.max[0] - map.bounds.min[0]
  const spanZ = map.bounds.max[1] - map.bounds.min[1]
  assert.ok(Math.abs(frame.height / frame.width - spanZ / spanX) < 1e-9)
  assert.deepEqual(frame.toMap(map.bounds.min), [0, 0])
  const corner = frame.toMap(map.bounds.max)
  assert.ok(Math.abs(corner[0] - 600) < 1e-9)
  assert.ok(Math.abs(corner[1] - frame.height) < 1e-9)
  for (const insert of lightMapOf(table).inserts) {
    const back = frame.toTable(frame.toMap(insert.at))
    assert.ok(Math.hypot(back[0] - insert.at[0], back[1] - insert.at[1]) < 1e-9)
  }
  const [, topY] = frame.toMap([0, -0.9])
  const [, bottomY] = frame.toMap([0, 0])
  assert.ok(topY < bottomY, 'up the table is up the map')
  assert.ok(Math.abs(frame.metresPerPixel * 600 - spanX) < 1e-9)
}

// Nudges: a millimetre, five with Shift, up the table is -z.
assert.deepEqual(nudged([0, 0], 'ArrowRight'), [NUDGE_M, 0])
assert.deepEqual(nudged([0, 0], 'ArrowLeft', true), [-NUDGE_FAST_M, 0])
assert.deepEqual(nudged([0, 0], 'ArrowUp'), [0, -NUDGE_M])
assert.deepEqual(nudged([0, 0], 'ArrowDown'), [0, NUDGE_M])

// Moves are tracked to the millimetre and written back as table data.
{
  const original = lightMapOf(table).inserts
  const edited = original.map((i) => ({ ...i }))
  assert.deepEqual(movedInserts(original, edited), [], 'nothing moved')
  assert.equal(insertSnippet([]), '// No inserts moved.')
  const a = edited[2]!
  const b = edited[5]!
  a.at = nudged(nudged(a.at, 'ArrowRight', true), 'ArrowUp')
  b.at = [b.at[0] + 0.0002, b.at[1]]
  const moves = movedInserts(original, edited)
  assert.deepEqual(
    moves.map((m) => m.id),
    [a.id],
    'a sub-millimetre twitch is not a move',
  )
  assert.deepEqual(moves[0]!.to, roundMm(a.at))
  assert.deepEqual(moves[0]!.from, roundMm(original[2]!.at))
  const snippet = insertSnippet(moves)
  assert.match(snippet, new RegExp(`^// ${a.id}: was \\[`))
  assert.match(
    snippet,
    new RegExp(
      `at: \\[${moves[0]!.to[0].toFixed(3)}, ${moves[0]!.to[1].toFixed(3)}\\],$`,
    ),
  )
}

// LEDs spaced evenly along the rail, at both ends' halves.
{
  const leds = ledPositions(
    [
      [0, 0],
      [1, 0],
    ],
    4,
  )
  assert.deepEqual(
    leds.map(([x]) => x),
    [0.125, 0.375, 0.625, 0.875],
  )
  assert.deepEqual(ledPositions([], 4), [])
}
assert.equal(cssColor(0x3fbfb0), '#3fbfb0')
assert.equal(cssColor(0xff), '#0000ff')

// A table without a rail or art still maps: Kind Pinball's lamps.
{
  const kp = lightMapOf({ ...AMI_VILLAGE_GREYBOX, art: undefined })
  assert.equal(kp.art, undefined)
  assert.deepEqual(kp.rail, { points: [], leds: [] })
  for (const i of kp.inserts) assert.ok(i.at[0] >= kp.bounds.min[0])
}

// The protected admin workshop owns the editor; the public Play route does not.
{
  const workshop = readFileSync(
    new URL('../../pages/admin/zuzu-pinball-workshop.vue', import.meta.url),
    'utf8',
  )
  assert.match(workshop, /<ArcadePinballLightMap :table="ZUZU_LAST_BELL_GREYBOX"/)
  assert.ok(workshop.includes('user.isAdmin'), 'workshop requires admin')
  const play = readFileSync(
    new URL('../../pages/play/zuzu-pinball.vue', import.meta.url),
    'utf8',
  )
  assert.doesNotMatch(play, /ArcadePinballLightMap/, 'editor stays private')
  assert.ok(!play.includes('user.isAdmin'), 'public play stays accessible')
  const editor = readFileSync(
    new URL(
      '../../components/arcade/arcade-pinball-light-map.vue',
      import.meta.url,
    ),
    'utf8',
  )
  assert.doesNotMatch(
    editor.slice(0, editor.indexOf('<script')),
    /<!--/,
    'no comments in the template',
  )
}

console.log(
  `Zuzu light map: ${map.inserts.length} inserts, ${map.flashers.length} flashers and ${map.rail.leds.length} LEDs over the painted playfield, frame round-trip, mm nudges, moves written back as table data, private admin workshop`,
)
