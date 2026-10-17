import assert from 'node:assert/strict'
import {
  PINKWAKE,
  PINKWAKE_GUARDIAN,
  PINKWAKE_SECTIONS,
  PINKWAKE_WAVES,
  PINKWAKE_WAVE_SIZES,
  pinkwakeDialogue,
  pinkwakeFormation,
  pinkwakeScene,
  pinkwakeSpawns,
  pinkwakeSpires,
  pinkwakeStage,
  PINKWAKE_CALLOUTS,
  PINKWAKE_SPIRES,
  SPIRE,
} from '../arcade/games/rainbowPinkwake'
import { RAINBOW_LANES } from '../arcade/games/rainbowFormations'
import {
  BOSS_MAX_HP,
  bossTelegraph,
  createPinkwakeBoss,
  stepPinkwakeBoss,
} from '../arcade/games/rainbowPinkwakeBoss'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { emptyInput } from '../arcade/types'

assert.equal(pinkwakeStage(1, null), 'opening')
assert.equal(pinkwakeStage(PINKWAKE.openingEnds, null), 'waves')
assert.equal(pinkwakeStage(PINKWAKE.turnStarts, null), 'turn')
assert.equal(pinkwakeStage(PINKWAKE.bossStarts, null), 'boss')
assert.equal(pinkwakeStage(5000, 4850), 'aftermath')
const laneY = (lane: number) => RAINBOW_LANES.top + lane * RAINBOW_LANES.span
assert.deepEqual(pinkwakeSpawns(100), [], 'opening scene is a safe corridor')
assert.deepEqual(
  pinkwakeSpawns(330).map((spawn) => [spawn.kind, spawn.y]),
  [['picket', laneY(0.5)]],
  'the picket school opens on a vee',
)
assert.equal(pinkwakeSpawns(342).length, 2, 'the vee opens out in pairs')
assert.equal(pinkwakeSpawns(496).length, 1, 'line members enter in file')
assert.equal(pinkwakeSpawns(1560)[0]?.kind, 'spiral')
assert.equal(pinkwakeSpawns(3960)[0]?.kind, 'urchin')
assert.equal(pinkwakeSpawns(6660)[0]?.kind, 'diver')
assert.deepEqual(
  pinkwakeSpawns(PINKWAKE.turnStarts),
  [],
  'pre-boss dialogue is safe',
)

// Authored formations: every craft enters inside the waves stage, on the playfield, in its section.
let craft = 0
for (let tick = 0; tick < PINKWAKE.bossStarts + 600; tick++) {
  for (const spawn of pinkwakeSpawns(tick)) {
    craft++
    assert.equal(pinkwakeStage(tick, null), 'waves')
    assert.ok(spawn.y >= laneY(0) && spawn.y <= laneY(1), `y ${spawn.y}`)
  }
}
assert.equal(
  craft,
  PINKWAKE_WAVE_SIZES.reduce((sum, size) => sum + size, 0),
  'every formation member spawns before the pre-boss turn',
)
// Silas's first playtest (2026-10-17) asked for more craft in less time: the recut packs about as many
// craft as the nine-minute Act did into roughly a third of the time.
const waveMinutes = (PINKWAKE.turnStarts - PINKWAKE.openingEnds) / 3600
assert.ok(
  craft >= 250,
  `Act I authors ${craft} craft, over four times the 59 of the old slice`,
)
assert.ok(
  craft / waveMinutes >= 75,
  `Act I sends ${(craft / waveMinutes).toFixed(0)} craft a minute`,
)
for (const [i, section] of PINKWAKE_SECTIONS.entries()) {
  if (i > 0) assert.equal(section.from, PINKWAKE_SECTIONS[i - 1]!.to)
  // The guardian holds its section alone; every other section is authored waves.
  assert.equal(
    PINKWAKE_WAVES.some((w) => w.at >= section.from && w.at < section.to),
    section.name !== PINKWAKE_GUARDIAN.name,
    `${section.name} ${section.name === PINKWAKE_GUARDIAN.name ? 'has no' : 'has'} waves`,
  )
}
assert.equal(PINKWAKE_SECTIONS[0]!.from, PINKWAKE.openingEnds)
assert.equal(PINKWAKE_SECTIONS.at(-1)!.to, PINKWAKE.turnStarts)
assert.ok(
  waveMinutes >= 3 && waveMinutes <= 4,
  `Act I waves run ${waveMinutes.toFixed(2)} minutes (the playtest found nine too long)`,
)
assert.ok(
  PINKWAKE.bossStarts / 3600 <= 4,
  'the Pearl Seahorse arrives within four minutes',
)
assert.ok(
  PINKWAKE_GUARDIAN.from / 3600 <= 1.5,
  'the Urchin guardian arrives within a minute and a half',
)

// Coral spires: terrain that rises in the waves stage, never in the guardian's section, tips on the field.
assert.ok(PINKWAKE_SPIRES.length >= 12)
for (const spire of PINKWAKE_SPIRES) {
  assert.equal(pinkwakeStage(spire.at, null), 'waves')
  assert.ok(
    spire.at < PINKWAKE_GUARDIAN.from || spire.at >= PINKWAKE_GUARDIAN.to,
  )
  assert.ok(
    spire.tip > 0.3 && spire.tip < 0.7,
    'a spire never closes the field',
  )
  assert.deepEqual(pinkwakeSpires(spire.at).length >= 1, true)
}
// In the chicane the spires alternate, so no straight line runs past them all: weave.
const chicane = PINKWAKE_SPIRES.filter((s) => s.at >= 7800 && s.at < 9300)
assert.ok(chicane.length >= 8)
for (let i = 1; i < chicane.length; i++) {
  const [prev, next] = [chicane[i - 1]!, chicane[i]!]
  assert.notEqual(prev.top, next.top)
  const prevOpen = prev.top
    ? [laneY(prev.tip), laneY(1)]
    : [laneY(0), laneY(prev.tip)]
  const nextOpen = next.top
    ? [laneY(next.tip), laneY(1)]
    : [laneY(0), laneY(next.tip)]
  assert.ok(
    Math.max(prevOpen[0]!, nextOpen[0]!) + SPIRE.halfWidth >
      Math.min(prevOpen[1]!, nextOpen[1]!) - SPIRE.halfWidth,
    `spires at ${prev.at} and ${next.at} leave no straight line`,
  )
}

// A mine-corridor wall always leaves one open lane a ship can thread: half the corridor clears the
// 14px ram radius (core 4 + craft 10) with at least 12px to spare on each side.
const walls = PINKWAKE_WAVES.filter((wave) => wave.formation === 'wall')
assert.ok(walls.length >= 5)
for (const wall of walls) {
  const lanes = pinkwakeFormation(wall)
    .map((member) => laneY(member.lane))
    .sort((a, b) => a - b)
  const edges = [laneY(0) - 20, ...lanes, laneY(1) + 20]
  const widest = Math.max(...edges.slice(1).map((y, i) => y - edges[i]!))
  assert.ok(
    widest / 2 >= 14 + 12,
    `wall at ${wall.at} leaves a ${widest}px corridor`,
  )
  const gapY = laneY(wall.lane)
  assert.ok(
    lanes.every((y) => Math.abs(y - gapY) >= 20),
    `wall at ${wall.at} keeps its authored gap open`,
  )
}

// The SOS station drifts through a lane no formation crosses while it is on screen.
for (
  let tick = PINKWAKE.stationAppears - 60;
  tick <= PINKWAKE.stationAppears + 60;
  tick++
) {
  for (const spawn of pinkwakeSpawns(tick)) {
    assert.ok(Math.abs(spawn.y - 190) >= 30, `station lane clear at ${tick}`)
  }
}
assert.equal(pinkwakeScene(10, null)?.id, 'A01.OPEN')
assert.equal(pinkwakeScene(1100, null), null)
// Lilt calls out every section after the first, so no stretch of the Act goes quiet, solo included.
assert.equal(PINKWAKE_CALLOUTS.length, PINKWAKE_SECTIONS.length - 1)
for (const [from, id] of PINKWAKE_CALLOUTS) {
  assert.ok(PINKWAKE_SECTIONS.some((section) => section.from === from))
  assert.equal(pinkwakeScene(from, null)?.id, id)
  assert.equal(pinkwakeScene(from + 2 * PINKWAKE.sceneLineFrames, null), null)
  for (const count of [1, 2, 3, 4])
    for (const elapsed of [0, PINKWAKE.sceneLineFrames]) {
      const line = pinkwakeDialogue(id, elapsed, count, false)
      assert.ok(line?.text)
      const active = ['Maribel', 'Azure', 'Solenne', 'Vivi'].slice(0, count)
      assert.ok(line.speaker === 'Lilt-7' || active.includes(line.speaker))
    }
}
assert.equal(pinkwakeScene(PINKWAKE.turnStarts, null)?.id, 'A01.TURN')
assert.equal(pinkwakeScene(PINKWAKE.bossStarts, null), null)
assert.equal(pinkwakeScene(4900, 4900)?.id, 'A01.AFTER')
assert.equal(pinkwakeScene(4900 + PINKWAKE.aftermathFrames, 4900), null)

for (const count of [1, 2, 3, 4]) {
  for (const scene of ['A01.OPEN', 'A01.TURN', 'A01.AFTER'] as const) {
    for (const rescued of [true, false]) {
      for (const elapsed of [0, 96, 192]) {
        const line = pinkwakeDialogue(scene, elapsed, count, rescued)
        assert.ok(line)
        assert.ok(line.speaker)
        assert.ok(line.text)
        const active = ['Maribel', 'Azure', 'Solenne', 'Vivi'].slice(0, count)
        assert.ok(line.speaker === 'Lilt-7' || active.includes(line.speaker))
      }
      assert.equal(
        pinkwakeDialogue(scene, PINKWAKE.aftermathFrames, count, rescued),
        null,
      )
    }
  }
}
const boss = createPinkwakeBoss()
assert.equal(boss.hp, BOSS_MAX_HP)
let bullets = 0
let warned = false
let warningFrames = 0
let volleys = 0
for (let tick = 0; tick < 510; tick++) {
  if (tick === 180) boss.hp = 90
  if (tick === 330) boss.hp = 30
  const volley = stepPinkwakeBoss(boss, [{ x: 60, y: 130, lives: 3 }])
  if (volley.length) {
    assert.ok(
      warningFrames >= 36,
      `B01 phase ${boss.phase} fired without 36 consecutive warning frames`,
    )
    warningFrames = 0
    volleys++
  }
  if (bossTelegraph(boss)) {
    warned = true
    warningFrames++
  } else if (!volley.length) {
    warningFrames = 0
  }
  bullets += volley.length
  assert.ok(
    volley.every(
      (bullet) => bullet.vx < 0 && Math.hypot(bullet.vx, bullet.vy) <= 2.11,
    ),
  )
}
assert.equal(boss.phase, 3)
assert.ok(warned, 'boss has visible shot telegraph')
assert.ok(volleys >= 3, 'all boss phases reach an actual volley')
assert.ok(bullets >= 10, 'all phases fire real volleys')
assert.equal(boss.x, 398)

// Reproduce the real engine order: step boss at frame 269, then a ship
// projectile drops phase-2 health below 50 before the next update.
// The legacy modulo schedule fired seven phase-3 pellets on frame 270.
const damageBoundary = createPinkwakeBoss()
for (let frame = 0; frame < 269; frame++) {
  if (frame === 170) damageBoundary.hp = 51
  stepPinkwakeBoss(damageBoundary, [{ x: 60, y: 130, lives: 3 }])
}
assert.equal(damageBoundary.frame, 269)
assert.equal(damageBoundary.phase, 2)
damageBoundary.hp = 49
const premature = stepPinkwakeBoss(damageBoundary, [
  { x: 60, y: 130, lives: 3 },
])
assert.equal(premature.length, 0, 'phase-3 must not volley immediately')
assert.equal(damageBoundary.phase, 3)
assert.equal(damageBoundary.nextVolleyAt, 342)
let phaseWarning = 0
for (let frame = 271; frame <= 341; frame++) {
  const shot = stepPinkwakeBoss(damageBoundary, [{ x: 60, y: 130, lives: 3 }])
  assert.equal(shot.length, 0, 'phase transition is visibly rearmed')
  if (bossTelegraph(damageBoundary)) phaseWarning++
}
assert.equal(phaseWarning, 36)
assert.equal(
  stepPinkwakeBoss(damageBoundary, [{ x: 60, y: 130, lives: 3 }]).length,
  7,
  'third phase begins only after its full telegraph',
)

function rng(seed = 427) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}
const create = () =>
  createRainbowPrincessPreview({
    rng: rng(),
    sound: { play() {} },
    demo: true,
    hiScore: 0,
    players: 2,
  })
const a = create()
const b = create()
for (let tick = 0; tick < PINKWAKE.bossStarts + 150; tick++) {
  const frame = emptyInput()
  a.update(frame, [frame, frame])
  b.update(frame, [frame, frame])
  if (tick % 300 === 0 || tick > PINKWAKE.bossStarts - 2) {
    assert.deepEqual(
      a.snapshot,
      b.snapshot,
      `Act I desynchronized at tick ${tick}`,
    )
  }
}
assert.equal(a.snapshot.act, 'S01')
assert.equal(a.snapshot.stage, 'boss')
assert.ok(
  a.snapshot.boss,
  'Pearl Seahorse enters after authored pre-boss scene',
)
assert.equal(
  a.snapshot.sceneId,
  null,
  'dangerous boss volley has no dialogue overlay',
)

// School bonus: clearing every craft of a formation pays out; formations that slip past do not.
function school(players: number, fire: boolean, frames: number) {
  const game = createRainbowPrincessPreview({
    rng: rng(3),
    sound: { play() {} },
    demo: false,
    hiScore: 0,
    players,
  })
  for (let tick = 0; tick < frames; tick++) {
    const pilots = Array.from({ length: players }, () => {
      const frame = emptyInput()
      frame.held.a = fire
      return frame
    })
    game.update(pilots[0]!, pilots)
  }
  return game.snapshot
}
const squad = school(4, true, 600)
assert.ok(squad.schoolBonuses >= 1, 'a cleared opening line pays a bonus')
assert.ok(
  squad.score >= 3 * 125 + 3 * RAINBOW_LANES.schoolBonusPerCraft,
  'the bonus is added to the score',
)
assert.equal(
  school(1, false, 2200).schoolBonuses,
  0,
  'formations that escape earn nothing',
)
console.log('Pinkwake Act I wave, comms and boss fixtures passed')
