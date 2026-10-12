// /utils/scripts/verifyCabinetRescueRallyFinale.test.ts
//
// Rescue Rally depth slice 3 (conductor kr-arcade t-037, depth-pass/CABINETS.md section 1, "Districts
// 3-5, the Glitch Core and the endings"): the Botanic Dome, Data Docks and Storm Rooftops and their
// floors, the seven new foes, Overgrowth, the Static Twins and the Glitch Core, the golden chips, the
// Reunion and both endings.
//
//   npx tsx utils/scripts/verifyCabinetRescueRallyFinale.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import mod, { readSave } from '../arcade/games/rescueRally'
import {
  bossHarms,
  bossTargets,
  hurtBoss,
  newBoss,
} from '../arcade/rescueRally/bosses'
import {
  LINK_APART,
  PETALS,
  PETAL_HP,
  SHIELD_RADIUS,
  WHIP_LIVE,
  WHIP_TELL,
  onPlate,
  shieldBlocks,
} from '../arcade/rescueRally/bossesLate'
import { DISTRICTS, districtStart } from '../arcade/rescueRally/districts'
import {
  GATE_TELL,
  LIGHTNING_TELL,
  gateState,
  windAt,
} from '../arcade/rescueRally/floors'
import {
  MIMIC_LAG,
  PRISM_TELL,
  SHIELD_KNOCKS,
  newFoe,
} from '../arcade/rescueRally/roster'
import type { FoeKind } from '../arcade/rescueRally/roster'
import { REUNION, scriptFoes } from '../arcade/rescueRally/waves'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'

/* eslint-disable @typescript-eslint/no-explicit-any */

const quiet = { play: () => {} }
const fresh = (seed = 3) =>
  mod.create({
    rng: mulberry32(seed),
    sound: quiet,
    demo: false,
    hiScore: 0,
  }) as any

function emptyArena(game: any) {
  Object.assign(game, {
    foes: [],
    family: [],
    arrivals: [{ tick: 1e9, kind: 'drone', count: 1, from: 'vents' }],
    bolts: [],
    shots: [],
    pickups: [],
    belts: [],
    vines: [],
    sprinklers: [],
    beds: [],
    pads: [],
    gates: [],
    magnetFloors: [],
    storm: undefined,
    strikes: [],
    drops: [],
    boss: null,
    banner: null,
    ventPower: true,
  })
  Object.assign(game.heroes[0], {
    x: 240,
    y: 186,
    invuln: 0,
    trail: [],
    history: [],
  })
}

function person(game: any, x: number, y: number, state = 'calm') {
  const r = {
    id: game.nextId++,
    kind: 'person',
    x,
    y,
    vx: 0,
    vy: 0,
    turn: 9999,
    color: '#f472b6',
    skin: '#fde7d6',
    state,
    clock: 0,
    immune: 0,
    seat: 0,
    slot: 0,
  }
  game.family.push(r)
  return r
}

const hold = (...buttons: (keyof InputFrame['held'])[]) => {
  const f = emptyInput()
  for (const b of buttons) f.held[b] = true
  return f
}
const aimAt = (x: number, y: number) => {
  const f = emptyInput()
  f.aim = { x, y }
  return f
}

// --- the whole city ---------------------------------------------------------------------------------
{
  assert.equal(DISTRICTS.length, 5, 'five districts')
  assert.equal(
    DISTRICTS.reduce((n, d) => n + d.waves.length, 0),
    40,
    'forty authored waves',
  )
  assert.deepEqual(
    DISTRICTS.map((d) => d.waves[7]!.boss),
    ['windup', 'jack', 'overgrowth', 'twins', 'core'],
  )
  const kinds = new Set<FoeKind>()
  for (const d of DISTRICTS)
    for (const w of d.waves) for (const k of scriptFoes(w).keys()) kinds.add(k)
  for (const k of [
    'prism',
    'thornball',
    'splitter',
    'mimic',
    'shieldbot',
    'magnet',
    'kite',
  ] as const)
    assert.ok(kinds.has(k), `${k} is in a wave`)
  const storm = DISTRICTS[4]!.waves[2]!
  assert.ok(
    storm.signature && scriptFoes(storm).size >= 13,
    'the Storm wave: every foe at once',
  )
  assert.ok(
    DISTRICTS[2]!.waves.some((w) => w.vines?.length && w.sprinklers?.length),
  )
  const vines = DISTRICTS[2]!.waves.slice(0, 7).map((w) => w.vines?.length ?? 0)
  assert.ok(vines[6]! > vines[0]!, 'the vines grow wave by wave')
  assert.ok(DISTRICTS[3]!.waves.some((w) => w.pads?.length))
  assert.ok(DISTRICTS[3]!.waves.some((w) => w.gates?.length))
  assert.ok(DISTRICTS[3]!.waves.some((w) => w.magnets?.length))
  assert.ok(DISTRICTS[4]!.waves.some((w) => w.storm?.lightningEvery))
  assert.equal(REUNION.reunion, true)
}

// --- the new roster ---------------------------------------------------------------------------------
{
  // The prism glows, then hatches a thornball; the thornball's shells bounce off the walls.
  const game = fresh()
  emptyArena(game)
  game.heroes[0].invuln = 1e9
  const prism = newFoe('prism', { x: 120, y: 100 }, game.rng)
  game.foes.push(prism)
  let glowed = 0
  for (
    let t = 0;
    t < 600 && !game.foes.some((f: any) => f.kind === 'thornball');
    t++
  ) {
    game.update(emptyInput())
    if (prism.mode === 1) glowed++
  }
  assert.ok(
    game.foes.some((f: any) => f.kind === 'thornball'),
    'the prism hatches',
  )
  assert.ok(glowed >= PRISM_TELL - 1, 'after glowing')
  const shells = fresh()
  emptyArena(shells)
  shells.heroes[0].invuln = 1e9
  shells.bolts.push({
    x: 20,
    y: 186,
    vx: -2,
    vy: 0,
    life: 200,
    confetti: false,
    bounces: 2,
  })
  for (let t = 0; t < 8; t++) shells.update(emptyInput())
  assert.ok(
    shells.bolts[0] && shells.bolts[0].vx > 0,
    'a shell bounces off the wall',
  )

  // The splitter splits into four drones.
  const split = fresh()
  emptyArena(split)
  const sp = newFoe('splitter', { x: 300, y: 186 }, split.rng)
  sp.hp = 1
  split.foes.push(sp)
  for (let t = 0; t < 20 && split.foes.includes(sp); t++)
    split.update(aimAt(1, 0))
  assert.equal(
    split.foes.filter((f: any) => f.kind === 'drone').length,
    4,
    'four pieces',
  )

  // The mimic walks the hero's path, two seconds behind.
  const echo = fresh()
  emptyArena(echo)
  const mimic = newFoe('mimic', { x: 240, y: 186 }, echo.rng)
  echo.foes.push(mimic)
  echo.heroes[0].invuln = 1e9
  for (let t = 0; t < MIMIC_LAG + 60; t++) echo.update(hold('right'))
  const h = echo.heroes[0]
  const then = h.history[h.history.length - 1 - MIMIC_LAG]
  assert.ok(
    Math.hypot(mimic.x - then.x, mimic.y - then.y) < 6,
    'on the old path',
  )
  assert.ok(h.x - mimic.x > 100, 'well behind the hero')

  // The shield bot: the front clanks, the flank hurts, a battering rattles the shield round.
  const shield = fresh()
  emptyArena(shield)
  shield.heroes[0].invuln = 1e9
  const bot = newFoe('shieldbot', { x: 330, y: 186 }, shield.rng)
  bot.face = Math.PI
  shield.foes.push(bot)
  for (let t = 0; t < 6 * (SHIELD_KNOCKS - 1); t++) shield.update(aimAt(1, 0))
  assert.equal(bot.hp, 3, 'beams from the front clank off')
  for (let t = 0; t < 40 && bot.hp === 3; t++) shield.update(aimAt(1, 0))
  assert.ok(bot.hp < 3 || !shield.foes.includes(bot), 'rattled, it can be hit')
  const flank = fresh()
  emptyArena(flank)
  flank.heroes[0].invuln = 1e9
  const side = newFoe('shieldbot', { x: 330, y: 186 }, flank.rng)
  side.face = -Math.PI / 2
  flank.foes.push(side)
  for (let t = 0; t < 12; t++) flank.update(aimAt(1, 0))
  assert.ok(side.hp < 3, 'from the side it takes hits')

  // The magnet pulses, then pulls the hero.
  const pull = fresh()
  emptyArena(pull)
  pull.heroes[0].invuln = 1e9
  const mag = newFoe('magnet', { x: 330, y: 186 }, pull.rng)
  mag.mode = 2
  mag.clock = 100
  pull.foes.push(mag)
  pull.update(emptyInput())
  assert.ok(pull.heroes[0].x > 240, 'pulled toward it')

  // The kite drone's shadow falls first, then a pylon lands on it.
  const kite = fresh()
  emptyArena(kite)
  kite.heroes[0].invuln = 1e9
  kite.foeWorld.drop({ x: 300, y: 100 })
  assert.equal(kite.drops.length, 1)
  for (let t = 0; t < 59; t++) kite.update(emptyInput())
  assert.ok(
    !kite.foes.some((f: any) => f.kind === 'pylon'),
    'only a shadow at first',
  )
  kite.update(emptyInput())
  kite.update(emptyInput())
  assert.ok(
    kite.foes.some((f: any) => f.kind === 'pylon'),
    'then a pylon',
  )
}

// --- the floors -----------------------------------------------------------------------------------
{
  const game = fresh()
  emptyArena(game)
  game.vines = [{ x: 250, y: 150, w: 12, h: 80 }]
  for (let t = 0; t < 30; t++) game.update(hold('right'))
  assert.ok(game.heroes[0].x <= 250 - 7, 'vines stop the hero')
  game.shots = []
  game.update(aimAt(1, 0))
  for (let t = 0; t < 10; t++) game.update(emptyInput())
  assert.ok(
    game.shots.every((s: any) => s.x < 250),
    'and the beam',
  )

  const wet = fresh()
  emptyArena(wet)
  wet.sprinklers = [{ x: 240, y: 186, r: 40 }]
  wet.update(hold('right'))
  assert.ok(wet.heroes[0].x - 240 < 1.2, 'sprinklers slow the hero')

  const bed = fresh()
  emptyArena(bed)
  bed.beds = [{ x: 380, y: 260, w: 60, h: 40 }]
  person(bed, 410, 280)
  assert.equal(
    bed.foeWorld.family({ x: 400, y: 200 }),
    null,
    'a hypno cannot see into a flowerbed',
  )

  const pads = fresh()
  emptyArena(pads)
  pads.pads = [
    [
      { x: 244, y: 186 },
      { x: 400, y: 300 },
    ],
  ]
  pads.update(emptyInput())
  assert.ok(
    Math.hypot(pads.heroes[0].x - 400, pads.heroes[0].y - 300) < 4,
    'a pad sends the hero across',
  )
  pads.update(emptyInput())
  assert.ok(
    Math.hypot(pads.heroes[0].x - 400, pads.heroes[0].y - 300) < 4,
    'and not straight back',
  )

  const g = {
    x0: 200,
    y0: 186,
    x1: 280,
    y1: 186,
    period: 180,
    on: 70,
    offset: 0,
  }
  assert.equal(gateState(g, 10), 'on')
  assert.equal(gateState(g, 100), 'off')
  assert.equal(gateState(g, 180 - GATE_TELL + 1), 'tell')
  const zap = fresh()
  emptyArena(zap)
  zap.gates = [{ ...g, offset: 100 }]
  zap.update(emptyInput())
  assert.equal(zap.lives, 3, 'an off gate is safe')
  zap.gates = [g]
  zap.waveTick = 0
  zap.update(emptyInput())
  assert.equal(zap.lives, 2, 'a hot gate costs a hero')

  const bend = fresh()
  emptyArena(bend)
  bend.magnetFloors = [{ x: 250, y: 170, w: 100, h: 60 }]
  bend.update(aimAt(1, 0))
  for (let t = 0; t < 6; t++) bend.update(emptyInput())
  assert.ok(bend.shots[0].vy > 0.5, 'a magnet floor bends the beam')

  const w = windAt(100, { lightningEvery: 0, wind: 0.4 })
  assert.ok(Math.hypot(w.x, w.y) > 0)
  const gust = fresh()
  emptyArena(gust)
  gust.storm = { lightningEvery: 0, wind: 0.4 }
  gust.waveTick = 99
  gust.update(emptyInput())
  assert.ok(
    Math.hypot(gust.heroes[0].x - 240, gust.heroes[0].y - 186) > 0.05,
    'the wind pushes',
  )

  const bolt = fresh()
  emptyArena(bolt)
  bolt.strikes = [{ x: 240, y: 186, clock: LIGHTNING_TELL }]
  for (let t = 0; t < LIGHTNING_TELL - 1; t++) bolt.update(emptyInput())
  assert.equal(bolt.lives, 3, 'the ring glows first')
  bolt.update(emptyInput())
  assert.equal(bolt.lives, 2, 'then it strikes')
  const miss = fresh()
  emptyArena(miss)
  miss.strikes = [{ x: 400, y: 100, clock: 2 }]
  for (let t = 0; t < 4; t++) miss.update(emptyInput())
  assert.equal(miss.lives, 3, 'outside the ring is safe')
}

// --- the last three bosses -----------------------------------------------------------------------
{
  // Overgrowth: petals first, then the core; root whips show before they lash.
  const og = newBoss('overgrowth', { x: 240, y: 120 }, mulberry32(1))
  const petals = bossTargets(og).filter((t) => t.id.startsWith('p'))
  assert.equal(petals.length, PETALS)
  assert.ok(
    !bossTargets(og).find((t) => t.id === 'core')!.hurts,
    'the core is closed',
  )
  for (let k = 0; k < PETALS; k++)
    for (let i = 0; i < PETAL_HP; i++) hurtBoss(og, `p${k}`)
  assert.equal(og.phase, 1, 'every petal broken')
  assert.ok(bossTargets(og)[0]!.hurts, 'now the core')
  og.whips = [
    { x0: 0, y0: 200, x1: 480, y1: 200, clock: WHIP_TELL + WHIP_LIVE },
  ]
  assert.equal(
    bossHarms(og, { x: 100, y: 200 }, 6),
    false,
    'the line shows first',
  )
  og.whips[0]!.clock = WHIP_LIVE
  assert.equal(
    bossHarms(og, { x: 100, y: 200 }, 6),
    true,
    'then the whip lashes',
  )

  // The Static Twins: the link breaks only far apart; one down, the other enrages.
  const tw = newBoss('twins', { x: 240, y: 186 }, mulberry32(1))
  tw.twins[0]!.x = 200
  tw.twins[1]!.x = 280
  assert.equal(
    bossTargets(tw).find((t) => t.id === 'link')!.hurts,
    false,
    'too close',
  )
  tw.twins[0]!.x = 120
  tw.twins[1]!.x = 120 + LINK_APART + 10
  assert.equal(
    bossTargets(tw).find((t) => t.id === 'link')!.hurts,
    true,
    'far apart',
  )
  assert.equal(
    bossHarms(tw, { x: 240, y: tw.twins[0]!.y }, 6),
    true,
    'the beam between them hurts',
  )
  while (tw.phase === 0) hurtBoss(tw, 'link')
  assert.equal(tw.phase, 1)
  while (tw.twins[0]!.hp > 0) hurtBoss(tw, 't0')
  assert.equal(tw.phase, 2, 'one down: the other enrages')
  while (!tw.down) hurtBoss(tw, 't1')

  // The Glitch Core: plates stop beams, the gaps let them through.
  const core = newBoss('core', { x: 240, y: 156 }, mulberry32(1))
  const angles = Array.from({ length: 64 }, (_, i) => (i / 64) * Math.PI * 2)
  const blocked = angles.filter((a) => onPlate(core, a)).length
  assert.ok(blocked > 20 && blocked < 60, 'plates and gaps')
  const plate = angles.find((a) => onPlate(core, a))!
  const gap = angles.find((a) => !onPlate(core, a))!
  const at = (a: number) => ({
    x: core.x + Math.cos(a) * SHIELD_RADIUS,
    y: core.y + Math.sin(a) * SHIELD_RADIUS,
  })
  assert.equal(shieldBlocks(core, at(plate)), true)
  assert.equal(shieldBlocks(core, at(gap)), false)

  // Phase 2 glitches every rescuee and shuts tight until they are all rebooted.
  const game = fresh()
  emptyArena(game)
  game.boss = newBoss('core', { x: 240, y: 100 }, game.rng)
  game.arrivals = []
  game.heroes[0].invuln = 1e9
  for (let i = 0; i < 4; i++) person(game, 100 + i * 80, 300)
  game.boss.phase = 1
  game.boss.hp = 40
  game.update(emptyInput())
  assert.ok(
    game.family.every((r: any) => r.state === 'glitched'),
    'everyone glitched at once',
  )
  assert.equal(game.boss.guard, true)
  assert.equal(bossTargets(game.boss)[0]!.hurts, false, 'shut tight')
  for (const r of game.family) r.state = 'calm'
  game.update(emptyInput())
  assert.equal(
    bossTargets(game.boss)[0]!.hurts,
    true,
    'open once they are rebooted',
  )
}

// --- golden chips, the Reunion and the endings ----------------------------------------------------
{
  // Everyone home in a signature wave: a golden chip.
  const game = fresh()
  game.startWave(3)
  emptyArena(game)
  game.arrivals = []
  game.familyTotal = 1
  game.familySaved = 1
  game.update(emptyInput())
  assert.ok(game.chips.has('plaza'), 'the Plaza chip')
  // Not when someone was lost.
  const lost = fresh()
  lost.startWave(3)
  emptyArena(lost)
  lost.arrivals = []
  lost.familyTotal = 3
  lost.familySaved = 2
  lost.update(emptyInput())
  assert.equal(lost.chips.size, 0)

  // The Shelter sells a hint for the next district's chip.
  const shop = fresh()
  shop.level = 8
  shop.index = 7
  shop.hearts = 50
  shop.openShelter()
  for (let t = 0; t < 25; t++) shop.update(emptyInput())
  shop.shelter.cursor = 4
  const press = emptyInput()
  press.pressed.a = true
  press.held.a = true
  shop.update(press)
  assert.equal(shop.hintFor, 1, 'the Toy Factory chip hint')
  assert.equal(shop.hearts, 42)

  // Beating the Core without every chip: the credits, then the rally goes round again.
  const end = fresh()
  end.startWave(districtStart(4) + 7)
  end.boss.down = 2
  end.boss.hp = 0
  end.foes = []
  end.arrivals = []
  for (let t = 0; t < 200 && !end.ending; t++) end.update(emptyInput())
  assert.ok(end.ending && !end.ending.trueEnding, 'the ending rolls')
  for (let t = 0; t < 60 * 60 && end.ending; t++) end.update(emptyInput())
  assert.equal(end.ending, null)
  assert.equal(end.level, 41, 'and round the city again')
  assert.equal(end.loop, 2)
  assert.equal(end.cleared, true)

  // With all five chips the Reunion comes first: no foes, every family to greet; then the true ending.
  const all = fresh()
  for (const d of DISTRICTS) all.chips.add(d.id)
  all.startWave(districtStart(4) + 7)
  all.boss.down = 2
  all.foes = []
  all.arrivals = []
  for (let t = 0; t < 200 && !all.script.reunion; t++) all.update(emptyInput())
  assert.equal(all.script.reunion, true, 'the Reunion')
  assert.ok(all.family.length >= 20)
  assert.ok(!all.foes.some((f: any) => f.kind !== 'pylon'), 'no foes')
  for (let t = 0; t < 60 * 60 && !all.ending; t++) {
    const r = all.family[0]
    if (r) Object.assign(all.heroes[0], { x: r.x, y: r.y })
    all.update(emptyInput())
  }
  assert.ok(all.ending?.trueEnding, 'the true ending')

  // The chips and the clear are kept in the save; a version-1 save still reads.
  end.writeSave()
  const save = end.save
  assert.equal(save.cleared, true)
  assert.deepEqual(readSave(JSON.parse(JSON.stringify(save))), save)
  const v1 = { ...save, v: 1 }
  delete (v1 as any).chips
  delete (v1 as any).cleared
  assert.deepEqual(readSave(v1)?.chips, [])
  assert.equal(
    readSave({ ...save, chips: ['moon'] }),
    null,
    'an unknown chip is refused',
  )
}

// --- a wave that drags on fades out --------------------------------------------------------------
{
  const game = fresh()
  game.startWave(2)
  game.heroes[0].invuln = 1e9
  for (let t = 0; t < 60 * 151 && game.level === 2; t++)
    game.update(emptyInput())
  assert.ok(game.level === 3 || game.waveDelay > 0, 'the glitch fades')
}

console.log('verifyCabinetRescueRallyFinale: ok')
