import assert from 'node:assert/strict'
import {
  ACT_CALLOUTS,
  ACT_TERRAIN,
  CALLOUT_LINE_FRAMES,
  actCallout,
  actTerrain,
} from '../arcade/games/rainbowActBeats'
import type { ActBeatAct } from '../arcade/games/rainbowActBeats'
import { CROWN_REEF_SECTIONS } from '../arcade/games/rainbowCrownReef'
import { PALACE_SECTIONS } from '../arcade/games/rainbowEclipsePalace'
import { GLASS_SECTIONS } from '../arcade/games/rainbowGlassCurrent'
import { MOONJELLY_SECTIONS } from '../arcade/games/rainbowMoonjelly'
import { reinforcements } from '../arcade/games/rainbowPacing'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { ROSEFIN_SECTIONS } from '../arcade/games/rainbowRosefin'
import { trenchSections } from '../arcade/games/rainbowTrench'
import { WRECK_SECTIONS } from '../arcade/games/rainbowWreckyard'
import { emptyInput } from '../arcade/types'

// Conductor rainbow t-023, after Silas's first playtest ("Playing one player, there could have been dialogue
// intended but there was nothing"; "We need obstacles"): Acts II-VIII call out every section as it begins,
// solo replies included, and each has a stretch of terrain in its own look, as Act I does.

type Section = { name: string; from: number; to: number }
const SECTIONS: Record<ActBeatAct, ReadonlyArray<readonly Section[]>> = {
  2: [MOONJELLY_SECTIONS],
  3: [trenchSections('vault'), trenchSections('safe')],
  4: [ROSEFIN_SECTIONS],
  5: [WRECK_SECTIONS],
  6: [CROWN_REEF_SECTIONS],
  7: [GLASS_SECTIONS],
  8: [PALACE_SECTIONS],
}
const ACTS = [2, 3, 4, 5, 6, 7, 8] as const

for (const act of ACTS) {
  const names = new Set(SECTIONS[act].flat().map((s) => s.name))
  const callouts = Object.keys(ACT_CALLOUTS[act])
  assert.ok(callouts.length >= 5, `Act ${act} calls out ${callouts.length}`)
  for (const name of callouts)
    assert.ok(names.has(name), `Act ${act}'s callout ${name} names a section`)
  for (const [lilt, solo, coop] of Object.values(ACT_CALLOUTS[act]))
    for (const text of [lilt, solo, coop])
      assert.ok(/[.!?]$/.test(text), `"${text}" is a sentence`)
  // Lilt, then the reply: Maribel's flown solo (the pilot select renames her), the last seat's in co-op.
  const sections = SECTIONS[act][0]!
  const named = sections.find((s) => ACT_CALLOUTS[act][s.name])!
  const [lilt, solo, coop] = ACT_CALLOUTS[act][named.name]!
  assert.deepEqual(actCallout(act, sections, named.from, 1), {
    id: `A0${act}.CALL`,
    speaker: 'Lilt-7',
    text: lilt,
  })
  assert.equal(
    actCallout(act, sections, named.from + CALLOUT_LINE_FRAMES, 1)?.text,
    solo,
  )
  assert.equal(
    actCallout(act, sections, named.from + CALLOUT_LINE_FRAMES, 1)?.speaker,
    'Maribel',
  )
  assert.deepEqual(
    actCallout(act, sections, named.from + CALLOUT_LINE_FRAMES, 3),
    { id: `A0${act}.CALL`, speaker: 'Solenne', text: coop },
  )
  assert.equal(
    actCallout(act, sections, named.from + 2 * CALLOUT_LINE_FRAMES, 1),
    null,
  )

  // The terrain: a weave of at least six spires inside its section, clear of its last five seconds.
  const terrain = ACT_TERRAIN[act]
  const section = sections.find((s) => s.name === terrain.section)
  assert.ok(section, `Act ${act}'s terrain section ${terrain.section}`)
  let spires = 0
  for (let frame = 0; frame < sections.at(-1)!.to; frame++)
    for (const spire of actTerrain(act, sections, frame)) {
      spires++
      assert.ok(frame >= section.from && frame <= section.to - 300)
      assert.ok(spire.tip > 0.2 && spire.tip < 0.8, 'a spire leaves a lane')
    }
  assert.ok(spires >= 6, `Act ${act} raises ${spires} ${terrain.name}`)
}

// Reinforcements stay inside their sections and refuse a name that is not one.
{
  const extra = reinforcements(MOONJELLY_SECTIONS, {
    kinds: ['lantern'],
    every: { 'Colony wake': 240 },
  })
  const wake = MOONJELLY_SECTIONS.find((s) => s.name === 'Colony wake')!
  assert.ok(extra.length >= 5)
  assert.ok(extra.every((w) => w.at >= wake.from && w.at <= wake.to - 300))
  assert.throws(() =>
    reinforcements(MOONJELLY_SECTIONS, {
      kinds: ['lantern'],
      every: { Nope: 1 },
    }),
  )
}

// A solo demo run: every later Act shows its callouts on the comms and raises its own terrain.
function seeded(seed = 1234) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
const texts: string[] = []
const g = new Proxy({} as Record<string | symbol, unknown>, {
  get(target, key) {
    if (key in target) return target[key]
    if (key === 'fillText') return (text: string) => texts.push(String(text))
    return () => ({ addColorStop() {} })
  },
  set(target, key, value) {
    target[key] = value
    return true
  },
}) as unknown as CanvasRenderingContext2D
const game = createRainbowPrincessPreview({
  players: 1,
  demo: true,
  rng: seeded(),
  sound: { play() {} },
  hiScore: 0,
})
const heard = new Map<number, Set<string>>()
const rose = new Map<number, number>()
for (let frame = 0; frame < 400000; frame++) {
  game.update(emptyInput())
  const act = Number(game.snapshot.act.slice(1))
  if (act >= 9 || game.over) break
  if (act < 2) continue
  for (const enemy of game.snapshot.enemies)
    if (enemy.kind === 'spire' && enemy.terrain === act && enemy.x > 480)
      rose.set(act, (rose.get(act) ?? 0) + 1)
  if (frame % 24) continue
  texts.length = 0
  game.render(g)
  texts.forEach((text, i) => {
    if (!text.startsWith(`A0${act}.CALL / `)) return
    // The header, then the line's first row: one entry per line heard.
    const lines = heard.get(act) ?? new Set<string>()
    lines.add(`${text} ${texts[i + 1]}`)
    heard.set(act, lines)
  })
}
for (const act of ACTS) {
  assert.ok(
    (heard.get(act)?.size ?? 0) >= 8,
    `Act ${act}'s callouts reach the comms (${[...(heard.get(act) ?? [])].join(', ')})`,
  )
  assert.ok(
    [...(heard.get(act) ?? [])].some((text) => text.includes('/ MARIBEL ')),
    `Act ${act} has solo replies`,
  )
  assert.ok((rose.get(act) ?? 0) > 0, `Act ${act} raises its terrain`)
}

console.log(
  `rainbow act beats: ok (callouts and terrain for Acts II-VIII; ${ACTS.map((act) => `${act}:${heard.get(act)?.size ?? 0}`).join(' ')})`,
)
