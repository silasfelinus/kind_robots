import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { create } from '../arcade/games/glitchGarden'
import { dailyGardenPlan, endlessGardenStep, gardenMedals } from '../arcade/games/glitchGardenModes'
import { CAMPAIGN, GARDENS, gardenStart } from '../arcade/games/glitchGardenGardens'
import { readGardenSave, type GardenSave } from '../arcade/games/glitchGardenSave'
import { NEW_KIT } from '../arcade/games/glitchGardenShed'
import { emptyInput } from '../arcade/types'

type Probe = {
  mode: string
  level: number
  lap: number
  score: number
  over: boolean
  save: GardenSave | null
  scoreBoard: string | null
  mastered: readonly string[]
  garden: { id: string; layout: readonly string[] }
  menu: { items: Array<{ mode?: string }>; cursor: number } | null
  medalPage: boolean
  medals: Record<string, number>
  sprayersLost: number
  waveFullPatch: boolean
  update(input: ReturnType<typeof emptyInput>): void
  advance(): void
  waveFixed(): void
  writeSave(run: boolean): void
}
const original: GardenSave = {
  v: 1, reached: 4, trowels: ['kitchen-plot'],
  run: { garden: 3, lap: 0, score: 12345, lives: 3, petals: 42, kit: NEW_KIT },
}
const make = (seed = 10) => create({
  rng: mulberry32(seed), demo: false, hiScore: 0, sound: { play: () => {} },
  resume: original, selectScreen: true,
}) as unknown as Probe
function pick(g: Probe, mode: string) {
  g.menu!.cursor = g.menu!.items.findIndex((item) => item.mode === mode)
  assert.ok(g.menu!.cursor >= 0)
  const f = emptyInput()
  f.pressed.a = true
  g.update(f)
}
assert.deepEqual(dailyGardenPlan('2026-11-28'), dailyGardenPlan('2026-11-28'))
assert.notDeepEqual(dailyGardenPlan('2026-11-28'), dailyGardenPlan('2026-11-29'))
assert.equal(dailyGardenPlan('2026-11-28').layout.length, 36)
assert.ok(dailyGardenPlan('2026-11-28').layout.every((row) => row.length === 30))
for (const [n, garden, lap] of [[1,0,0],[6,2,0],[11,4,0],[16,6,0],[21,1,0],[36,7,0],[41,0,1]]) {
  const step = endlessGardenStep(n!)
  assert.equal(step.index, gardenStart(garden!))
  assert.equal(step.lap, lap)
  assert.equal(CAMPAIGN[step.index]!.kind, 'wave')
}
const endless = make()
pick(endless, 'endless')
assert.equal(endless.scoreBoard, 'glitch-garden')
assert.equal(endless.score, 0)
for (let i = 1; i < 42; i++) {
  endless.advance()
  assert.equal(endless.level, i + 1)
}
assert.equal(endless.lap, 1)
assert.equal(endless.garden.id, GARDENS[0]!.id)
endless.writeSave(false)
assert.deepEqual(endless.save, original, 'endless leaves campaign intact')
const daily = make(10)
const other = make(999)
pick(daily, 'daily')
pick(other, 'daily')
assert.equal(daily.scoreBoard, null)
assert.deepEqual(daily.garden.layout, other.garden.layout)
daily.score = 3456
daily.advance()
assert.equal(daily.over, true)
assert.ok(daily.mastered.includes('daily-bloom'))
assert.equal(daily.save?.dailyBest?.score, 3456)
assert.deepEqual(daily.save?.run, original.run)
assert.deepEqual(readGardenSave(daily.save), daily.save)
const medals = make()
pick(medals, 'medals')
assert.equal(medals.medalPage, true)
const back = emptyInput()
back.pressed.b = true
medals.update(back)
assert.equal(medals.medalPage, false)
const start = emptyInput()
start.pressed.a = true
medals.menu!.cursor = 0
medals.update(start)
medals.waveFullPatch = true
medals.sprayersLost = 0
medals.waveFixed()
assert.ok(Object.values(medals.medals).some((bits) => (bits & 5) === 5))
assert.equal(gardenMedals(true, true, true), 7)
assert.equal(gardenMedals(false, false, false), 0)
assert.ok(medals.mastered.includes('clean-patch'))
assert.ok(medals.mastered.includes('full-patch'))
assert.deepEqual(readGardenSave(medals.save)?.medals, medals.medals)
console.log('glitch garden standalone modes, medals and mastery: ok')
