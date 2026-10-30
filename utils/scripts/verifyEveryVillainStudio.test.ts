import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  STAGE_PRESETS,
  clonePreset,
  paintStage,
  stageProblems,
} from '../everyVillainTactics/studio'
import {
  availableMove,
  endTurn,
  fireSelected,
  moveSelected,
  aliasFor,
  previewShot,
  trainingState,
} from '../everyVillainTactics/training'
import { lineOfSight, tileAt } from '../everyVillainTactics/combat'

assert.equal(STAGE_PRESETS.length, 7)
for (const preset of STAGE_PRESETS) {
  assert.deepEqual(
    stageProblems(preset),
    [],
    preset.id + ' must be traversable',
  )
  assert.equal(preset.spawns.length, 6)
  assert.equal(new Set(preset.spawns.map((u) => u.id)).size, 6)
}
const quad = clonePreset('college-quad')
assert.equal(tileAt(quad.map, { x: 4, y: 2 }).wall, true)
assert.equal(tileAt(quad.map, { x: 5, y: 3 }).wall, true)
assert.equal(lineOfSight(quad.map, { x: 2, y: 2 }, { x: 7, y: 2 }), false)

const lab = clonePreset('science-lab')
assert.equal(tileAt(lab.map, { x: 3, y: 0 }).wall, true)
assert.equal(tileAt(lab.map, { x: 4, y: 2 }).cover?.west, 'full')
const picnic = clonePreset('picnic-plaza')
assert.ok(picnic.title.includes('Picnic'))

assert.equal(picnic.encounter, 'warren-wreckers')
const picnicFight = trainingState(99, picnic)
const bunnyUnits = picnicFight.units.filter((u) => u.team === 'rival')
assert.equal(bunnyUnits.length, 3)
assert.ok(
  bunnyUnits.every(
    (u) => u.hp === 1 && u.maxHp === 1 && u.henchmanType === 'burrow',
  ),
)
assert.equal(bunnyUnits[0]!.henchmanName, 'Foreman Thumpkin')
endTurn(picnicFight)
const targets = bunnyUnits.map((u) => u.burrowTarget)
assert.ok(
  targets.every(Boolean),
  'Each one-hit burrower must telegraph the next tile',
)
assert.equal(new Set(targets.map((p) => p!.x + ',' + p!.y)).size, 3)
const replay = trainingState(99, picnic)
endTurn(replay)
assert.deepEqual(
  replay.units.filter((u) => u.team === 'rival').map((u) => u.burrowTarget),
  targets,
)
assert.ok(
  picnicFight.log.includes('dust rings'),
  'Turn summary explains the warning',
)

const emergence = trainingState(99, picnic)
endTurn(emergence)
const planned = { ...emergence.units[3]!.burrowTarget! }
endTurn(emergence)
assert.deepEqual(
  { x: emergence.units[3]!.x, y: emergence.units[3]!.y },
  planned,
)
assert.equal(
  emergence.units[3]!.burrowTarget,
  null,
  'The warning resolves after a full player turn',
)

const sealed = trainingState(99, picnic)
endTurn(sealed)
const tunnel = sealed.units[3]!.burrowTarget!
sealed.units[2]!.x = tunnel.x
sealed.units[2]!.y = tunnel.y
const first = { x: sealed.units[3]!.x, y: sealed.units[3]!.y }
endTurn(sealed)
assert.deepEqual(
  { x: sealed.units[3]!.x, y: sealed.units[3]!.y },
  first,
  'Occupying a marked tile must stop a burrow without overlapping fighters',
)
assert.equal(sealed.units[3]!.burrowTarget, null)
assert.ok(sealed.units[3]!.hp === 1, 'Blocked burrowers remain one-hit enemies')

// The powered lieutenant is separate from the minor one-hit species captain.
// This is one executable lair vignette, NOT 48 delivered boss encounters.
const quarry = clonePreset('quarry-lieutenant')
assert.equal(quarry.encounter, 'quarry-lieutenant')
assert.equal(quarry.spawns.find((spawn) => spawn.id === 'pip')?.x, 5)
const quarryFight = trainingState(99, quarry)
const boss = quarryFight.units.find((unit) => unit.lieutenantName)!
const minions = quarryFight.units.filter(
  (unit) => unit.henchmanType === 'burrow',
)
assert.equal(aliasFor(boss), 'Mags Hardpan')
assert.equal(boss.identity, 'accident-earth')
assert.equal(boss.hp, 4)
assert.equal(boss.maxHp, 4)
assert.equal(boss.henchmanType, undefined)
assert.equal(minions.length, 2)
assert.equal(minions[0]!.henchmanName, 'Foreman Thumpkin')
assert.ok(minions.every((unit) => unit.hp === 1 && unit.maxHp === 1))
endTurn(quarryFight)
assert.deepEqual(boss.seismicTarget, { x: 0, y: 2 })
assert.equal(boss.seismicChargeHp, 4)
assert.ok(minions.every((unit) => unit.burrowTarget))
const quarryReplay = trainingState(99, quarry)
endTurn(quarryReplay)
assert.deepEqual(
  quarryReplay.units.find((unit) => unit.lieutenantName)?.seismicTarget,
  boss.seismicTarget,
  'lieutenant target must replay deterministically',
)

const quake = trainingState(99, quarry)
quake.units
  .filter((unit) => unit.henchmanType)
  .forEach((unit) => {
    unit.hp = 0
  })
endTurn(quake)
const quakeBoss = quake.units.find((unit) => unit.lieutenantName)!
const victim = quake.units.find(
  (unit) =>
    unit.team === 'squad' &&
    unit.x === quakeBoss.seismicTarget?.x &&
    unit.y === quakeBoss.seismicTarget?.y,
)!
const victimHp = victim.hp
endTurn(quake)
assert.equal(victim.hp, victimHp - 1, 'warning resolves as a real one-HP quake')
assert.equal(
  quakeBoss.seismicTarget,
  null,
  'seismic warning clears after release',
)

const dodge = trainingState(99, quarry)
dodge.units
  .filter((unit) => unit.henchmanType)
  .forEach((unit) => {
    unit.hp = 0
  })
endTurn(dodge)
const dodged = dodge.units.find((unit) => unit.id === 'hattie')!
dodge.selected = dodged.id
assert.equal(availableMove(dodge, { x: 2, y: 2 }), true)
assert.ok(
  moveSelected(dodge, { x: 2, y: 2 }),
  'player can dodge the marked area',
)
const safeHp = dodged.hp
endTurn(dodge)
assert.equal(
  dodged.hp,
  safeHp,
  'relocating outside the marked area prevents quake damage',
)

let interrupted = false
for (let seed = 1; seed < 96 && !interrupted; seed++) {
  const counter = trainingState(seed, quarry)
  counter.units
    .filter((unit) => unit.henchmanType)
    .forEach((unit) => {
      unit.hp = 0
    })
  endTurn(counter)
  const lieutenant = counter.units.find((unit) => unit.lieutenantName)!
  // Hattie is a short-range tank now, so the squad's best-placed shooter
  // takes the drumhead shot (roles change range, never the counter rule).
  const marksman = counter.units
    .filter((unit) => unit.team === 'squad' && unit.hp > 0)
    .sort(
      (a, b) =>
        previewShot(b, lieutenant, counter.map).hit -
          previewShot(a, lieutenant, counter.map).hit ||
        a.id.localeCompare(b.id),
    )[0]!
  assert.ok(previewShot(marksman, lieutenant, counter.map).hit > 0)
  counter.selected = marksman.id
  const fired = fireSelected(counter, lieutenant)
  assert.ok(fired, 'normal attack remains legal during drumhead counterplay')
  if (lieutenant.hp === 4) continue
  const hp = marksman.hp
  endTurn(counter)
  assert.equal(lieutenant.seismicTarget, null)
  assert.equal(marksman.hp, hp, 'hit on a marked drum cancels the queued quake')
  assert.ok(
    counter.events.some((event) => event.includes('loses the downbeat')),
  )
  interrupted = true
}
assert.ok(
  interrupted,
  'at least one reproducible seed hits the boss during charge',
)

const modified = paintStage(quad, { x: 2, y: 1 }, 'wall')
assert.equal(tileAt(modified.map, { x: 2, y: 1 }).wall, true)
assert.equal(
  tileAt(quad.map, { x: 2, y: 1 }).wall,
  undefined,
  'presets are immutable',
)
assert.equal(
  paintStage(modified, { x: 2, y: 1 }, 'erase').map.tiles['2,1'],
  undefined,
)
assert.equal(
  paintStage(quad, { x: 0, y: 4 }, 'wall'),
  quad,
  'spawns cannot be buried',
)
const secret = paintStage(quad, { x: 2, y: 0 }, 'secret')
assert.ok(secret.secrets.some((p) => p.x === 2 && p.y === 0))
assert.ok(
  !paintStage(secret, { x: 2, y: 0 }, 'secret').secrets.some(
    (p) => p.x === 2 && p.y === 0,
  ),
)

const state = trainingState(223, quad)
assert.equal(state.map.tiles['4,2']?.wall, true)
assert.equal(state.stageId, 'college-quad')
assert.equal(state.turnLimit, 9)
assert.equal(
  availableMove(state, { x: 4, y: 2 }),
  false,
  'fountain blocks movement',
)
const source = state.units[0]!
const target = state.units.find((u) => u.id === 'remy')!
const expected = previewShot(source, target, quad.map)
assert.equal(previewShot(source, target, state.map).hit, expected.hit)
assert.equal(previewShot(source, target, state.map).clear, expected.clear)

const veryShort = clonePreset('science-lab')
veryShort.turnLimit = 2
const timer = trainingState(223, veryShort)
for (let round = 0; round < 3 && timer.phase === 'active'; round++)
  endTurn(timer)
assert.equal(
  timer.phase,
  'defeat',
  'expired studio timer is enforced in combat',
)

const invalid = clonePreset('college-quad')
invalid.spawns[0]!.x = 4
invalid.spawns[0]!.y = 2
assert.ok(
  stageProblems(invalid).some((problem) => problem.includes('traversable')),
)

const page = readFileSync(
  new URL('../../pages/admin/every-villain-tactics.vue', import.meta.url),
  'utf8',
)
const store = readFileSync(
  new URL('../../stores/everyVillainTacticsStore.ts', import.meta.url),
  'utf8',
)
assert.match(page, /data-testid="tactics-stage-studio"/)
assert.match(page, /data-testid="studio-playtest"/)
assert.match(page, /store\.paintCell\(cell\)/)
assert.match(store, /trainingState\(\s*0x53a1b7,\s*isPlaytest\.value/)
assert.match(page, /data-testid="tactics-burrow-warning"/)
assert.match(page, /data-testid="studio-encounter"/)
assert.match(store, /isBurrowWarning/)
assert.match(store, /isSeismicWarning/)
assert.match(page, /data-testid="tactics-seismic-warning"/)
assert.match(page, /Quarry lieutenant/)
console.log(
  'Every Villain Studio: preset maps, paint, spawns, LOS, timer and real-rules playtest verified.',
)
