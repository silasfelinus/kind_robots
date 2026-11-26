import assert from 'node:assert/strict'
import { createSavePlumberPreview } from '../arcade/games/savePlumberPreview'
import { PLUMBER_WORLDS } from '../arcade/games/savePlumberWorlds'
import { emptyInput } from '../arcade/types'

// Every boss speaks: one line as the arena gate closes, one after each of the
// first two hits and one on the last, all short enough for the HUD plate.
for (const world of PLUMBER_WORLDS) {
  const { enter, hit, defeat } = world.boss.taunts
  const lines = [enter, ...hit, defeat]
  assert.equal(lines.length, 4, `${world.boss.name} has four lines`)
  for (const line of lines) {
    assert.ok(line.trim().length > 0, `${world.boss.name} line is not blank`)
    assert.ok(line.length <= 46, `${world.boss.name}: "${line}" fits the plate`)
  }
  assert.equal(new Set(lines).size, 4, `${world.boss.name} never repeats`)
}
const all = PLUMBER_WORLDS.flatMap((world) => {
  const { enter, hit, defeat } = world.boss.taunts
  return [enter, ...hit, defeat]
})
assert.equal(new Set(all).size, all.length, 'no two bosses share a line')

// Runtime: the 1-4 arena closes, Madame Pressure speaks, and each hit answers.
type Line = { words: string; timer: number } | null
type Probe = {
  hero: { x: number }
  stage: { gate: number | null }
  bossLine: Line
  hitBoss(): void
  boss: { hp: number; state: string; timer: number } | null
}
const run = createSavePlumberPreview({
  rng: () => 0.5,
  sound: { play() {} },
  demo: false,
  hiScore: 0,
})
run.loadStage(3)
run.mode = 'play'
const probe = run as unknown as Probe
assert.ok(probe.boss, '1-4 holds a boss')
assert.ok(probe.stage.gate !== null, '1-4 has an arena gate')
assert.equal(probe.bossLine, null, 'the boss is silent before the arena')
const taunts = PLUMBER_WORLDS[0]!.boss.taunts
probe.hero.x = (probe.stage.gate! + 3) * 32
run.update(emptyInput())
assert.equal(run.locked, true, 'crossing the gate closes the arena')
assert.equal(
  probe.bossLine?.words,
  taunts.enter,
  'the gate closing cues her entrance line',
)

const expected = [taunts.hit[0], taunts.hit[1], taunts.defeat]
for (const words of expected) {
  probe.hitBoss()
  assert.equal(probe.bossLine?.words, words, `hit answers with "${words}"`)
  probe.boss!.state = 'walk'
}
assert.equal(probe.boss!.hp, 0)

// The line fades on its own while the fight runs.
probe.bossLine = { words: taunts.enter, timer: 2 }
probe.boss!.hp = 3
probe.boss!.timer = 999
for (let i = 0; i < 4 && run.mode === 'play'; i++) run.update(emptyInput())
assert.equal(probe.bossLine, null, 'the line clears when its timer runs out')

// The HUD draws the boss's name and the quoted line on its plate.
const drawn: string[] = []
const g = new Proxy(
  {},
  {
    get(_target, key) {
      if (key === 'fillText') return (words: string) => drawn.push(words)
      if (key === 'measureText') return () => ({ width: 10 })
      if (key === 'createLinearGradient' || key === 'createRadialGradient')
        return () => ({ addColorStop() {} })
      return () => {}
    },
    set: () => true,
  },
) as unknown as CanvasRenderingContext2D
probe.bossLine = { words: taunts.hit[0], timer: 60 }
;(run as unknown as { renderHud(g: CanvasRenderingContext2D): void }).renderHud(
  g,
)
assert.ok(drawn.includes('MADAME PRESSURE'), 'the plate names the boss')
assert.ok(drawn.includes(`“${taunts.hit[0]}”`), 'the plate quotes her line')

console.log('Save the Plumber boss taunts: eight voiced bosses, cued and drawn')
