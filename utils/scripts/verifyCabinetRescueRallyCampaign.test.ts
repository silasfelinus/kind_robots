// /utils/scripts/verifyCabinetRescueRallyCampaign.test.ts
//
// Rescue Rally depth slice 2 (conductor kr-arcade t-036, depth-pass/CABINETS.md section 1, "Neon
// Plaza, Toy Factory and the Shelter"): the district engine and its saves, the Toy Factory's
// conveyors and crates, the Big Wind-Up and the Jack-in-the-Box, the Reboot Squad, the power-ups and
// the Shelter's thank-you hearts.
//
//   npx tsx utils/scripts/verifyCabinetRescueRallyCampaign.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { ARCADE_GAMES } from '../arcade/games'
import mod, { readSave } from '../arcade/games/rescueRally'
import {
  BOSSES,
  CRACK_TELL,
  LUNGE_TELL,
  bossHarms,
  bossTargets,
  newBoss,
} from '../arcade/rescueRally/bosses'
import {
  DISTRICTS,
  WAVES_PER_DISTRICT,
  districtStart,
  waveAt,
} from '../arcade/rescueRally/districts'
import { POWERS, POWER_KINDS } from '../arcade/rescueRally/powers'
import { newFoe } from '../arcade/rescueRally/roster'
import { SHELTER_ITEMS } from '../arcade/rescueRally/shelter'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'

/* eslint-disable @typescript-eslint/no-explicit-any */

const quiet = { play: () => {} }
/** A game past the menu of modes, straight into the campaign (or the Welcome Back card). */
const fresh = (seed = 3, resume?: unknown) => {
  const game = mod.create({
    rng: mulberry32(seed),
    sound: quiet,
    demo: false,
    hiScore: 0,
    resume,
  }) as any
  game.menu = null
  return game
}

function emptyArena(game: any) {
  game.foes = []
  game.family = []
  game.arrivals = [{ tick: 1e9, kind: 'drone', count: 1, from: 'vents' }]
  game.bolts = []
  game.shots = []
  game.pickups = []
  game.belts = []
  game.boss = null
  game.banner = null
  game.ventPower = true
  Object.assign(game.heroes[0], { x: 240, y: 186, invuln: 0, trail: [] })
}

function press(...buttons: (keyof InputFrame['held'])[]): InputFrame {
  const f = emptyInput()
  for (const b of buttons) {
    f.held[b] = true
    f.pressed[b] = true
  }
  return f
}

const aimAt = (x: number, y: number) => {
  const f = emptyInput()
  f.aim = { x, y }
  return f
}

// --- the campaign as data --------------------------------------------------------------------------
{
  assert.ok(DISTRICTS.length >= 2)
  for (const d of DISTRICTS) {
    assert.equal(
      d.waves.length,
      WAVES_PER_DISTRICT,
      `${d.name} has eight waves`,
    )
    assert.ok(d.waves[2]!.signature, `${d.name}: its signature wave is third`)
    assert.ok(d.waves[7]!.boss, `${d.name}: its boss is wave 8`)
    assert.equal(d.waves.filter((w) => w.boss).length, 1, `${d.name}: one boss`)
    assert.ok(d.music.tracks.length > 0)
  }
  assert.equal(DISTRICTS[0]!.waves[7]!.boss, 'windup')
  assert.equal(DISTRICTS[1]!.waves[7]!.boss, 'jack')
  // The Toy Factory's floor: conveyors and crates.
  assert.ok(DISTRICTS[1]!.waves.some((w) => w.conveyors?.length))
  assert.ok(DISTRICTS[1]!.waves.some((w) => w.crates?.length))
  assert.equal(waveAt(9).district, 1)
  assert.equal(waveAt(9).index, 0)
  assert.equal(districtStart(1), 9)
  assert.equal(districtStart(0, 2), DISTRICTS.length * 8 + 1)
  assert.equal(waveAt(districtStart(0, 2)).loop, 2)
  assert.equal(POWER_KINDS.length, 8, 'eight power-ups')
}

// --- conveyors carry, crates block and are cover ------------------------------------------------
{
  const game = fresh()
  emptyArena(game)
  game.belts = [{ x: 200, y: 170, w: 100, h: 30, dir: 'right' }]
  game.update(emptyInput())
  assert.ok(game.heroes[0].x > 240.5, 'the belt carries the hero')

  const box = fresh()
  emptyArena(box)
  box.foes.push(newFoe('crate', { x: 255, y: 186 }, box.rng))
  for (let t = 0; t < 30; t++) box.update(press('right'))
  assert.ok(box.heroes[0].x <= 255 - 14, 'a crate stops the hero')
  assert.equal(box.lives, 3, 'and costs nothing to bump')
  box.bolts.push({ x: 300, y: 186, vx: -2, vy: 0, life: 100, confetti: false })
  for (let t = 0; t < 40; t++) box.update(emptyInput())
  assert.equal(box.lives, 3, 'a spark stops at the crate: cover')
  for (let t = 0; t < 60 && box.foes.length; t++) box.update(aimAt(1, 0))
  assert.equal(box.foes.length, 0, 'beams break a crate')
}

// --- the Big Wind-Up -----------------------------------------------------------------------------
{
  const b = newBoss('windup', { x: 240, y: 150 }, mulberry32(1))
  const [key, body] = bossTargets(b)
  assert.equal(body!.hurts, true, 'phases 1-2: the body takes hits')
  assert.equal(key!.hurts, false)
  b.phase = 2
  const [key3, body3] = bossTargets(b)
  assert.equal(key3!.hurts, true, 'phase 3: only the key winds it down')
  assert.equal(body3!.hurts, false)
  // A shockwave ring hurts on its line, but not in its gaps.
  b.shocks = [{ x: 240, y: 150, r: 80, max: 200, gaps: [0] }]
  b.x = 1000
  assert.equal(bossHarms(b, { x: 240, y: 230 }, 6), true, 'on the ring')
  assert.equal(bossHarms(b, { x: 320, y: 150 }, 6), false, 'in a gap')
  assert.equal(bossHarms(b, { x: 240, y: 190 }, 6), false, 'inside the ring')

  const game = fresh()
  game.startWave(8)
  assert.ok(game.boss && game.boss.kind === 'windup')
  emptyArena(game)
  game.boss = newBoss('windup', { x: 240, y: 110 }, game.rng)
  game.arrivals = []
  game.heroes[0].invuln = 1e9
  let cracked = -1
  let shocked = -1
  for (let t = 0; t < 600 && shocked < 0; t++) {
    game.update(emptyInput())
    if (cracked < 0 && game.boss.mode === 'crack') cracked = t
    if (game.boss.shocks.length) shocked = t
  }
  assert.ok(
    cracked >= 0 && shocked - cracked >= CRACK_TELL - 1,
    'the floor cracks first',
  )
  // Phase 2 pours little wind-ups from the hatch.
  game.boss.phase = 1
  for (let t = 0; t < 400; t++) game.update(emptyInput())
  assert.ok(
    game.foes.some((f: any) => f.kind === 'windup'),
    'phase 2: little wind-ups',
  )
  // Beaten: everything reboots, the district clears and the Shelter opens.
  const score = game.score
  game.boss.phase = 2
  game.boss.hp = 1
  game.foes = []
  // The key sits up behind its head: beam it from above.
  for (let t = 0; t < 400 && game.boss && !game.boss.down; t++) {
    const b = game.boss
    Object.assign(game.heroes[0], { x: b.x, y: Math.max(40, b.y - 120) })
    const dy = b.y - 52 - game.heroes[0].y
    game.update(aimAt(0, Math.sign(dy) || 1))
  }
  assert.ok(!game.boss || game.boss.down, 'wound down')
  assert.ok(game.score - score >= BOSSES.windup.points)
  for (let t = 0; t < 600 && !game.shelter; t++) game.update(emptyInput())
  assert.ok(game.shelter, 'the Shelter opens after the district')
}

// --- the Jack-in-the-Box ---------------------------------------------------------------------------
{
  const b = newBoss('jack', { x: 240, y: 120 }, mulberry32(2))
  assert.equal(b.mode, 'hide')
  assert.equal(bossTargets(b).length, 0, 'nothing to hit while it hides')
  assert.equal(bossHarms(b, { x: 240, y: 120 }, 8), false)
  const game = fresh()
  emptyArena(game)
  game.boss = newBoss('jack', { x: 240, y: 100 }, game.rng)
  game.arrivals = []
  game.heroes[0].invuln = 1e9
  let aimed = -1
  let lunged = -1
  for (let t = 0; t < 600 && lunged < 0; t++) {
    game.update(emptyInput())
    if (aimed < 0 && game.boss.mode === 'aim') aimed = t
    if (game.boss.mode === 'lunge') lunged = t
  }
  assert.ok(
    aimed >= 0 && lunged - aimed >= LUNGE_TELL - 1,
    'the lunge line shows first',
  )
  // Phase 2 throws confetti fans.
  game.boss.phase = 1
  let fans = 0
  for (let t = 0; t < 1200; t++) {
    game.update(emptyInput())
    if (game.boss.mode === 'fan') fans++
  }
  assert.ok(fans > 0 && game.bolts.length >= 0, 'phase 2: confetti fans')
  // Phase 3 rolls as a die; the face that lands picks the attack.
  game.boss.phase = 2
  game.boss.mode = 'roll'
  game.boss.clock = 20
  const picked = new Set<string>()
  for (let t = 0; t < 4000; t++) {
    const before = game.boss.mode
    game.update(emptyInput())
    if (before === 'land' && game.boss.mode !== 'land')
      picked.add(game.boss.mode)
  }
  assert.ok(
    picked.size >= 2,
    `the die picks different attacks (${[...picked]})`,
  )
}

// --- the Reboot Squad -------------------------------------------------------------------------------
{
  const game = fresh()
  emptyArena(game)
  for (let i = 0; i < 15; i++)
    game.foes.push(
      newFoe('drone', { x: 300 + (i % 5) * 4, y: 186 + i }, game.rng),
    )
  for (const f of game.foes) f.timer = 1
  game.heroes[0].invuln = 1e9
  for (let t = 0; t < 200 && game.foes.length; t++) {
    for (const f of game.foes) f.hp = 0
    game.update(aimAt(1, 0))
  }
  // Fifteen beam reboots in one go: hit them all at once.
  const squad = fresh()
  emptyArena(squad)
  for (let i = 0; i < 15; i++) squad.chainUp({ x: 240, y: 186 })
  assert.equal(squad.heroes[0].squad, 1, 'fifteen in a window free a squad bot')
  const slow = fresh()
  emptyArena(slow)
  for (let i = 0; i < 15; i++) {
    slow.chainUp({ x: 240, y: 186 })
    for (let t = 0; t < 20; t++) slow.update(emptyInput())
  }
  assert.equal(
    slow.heroes[0].squad,
    0,
    'not when the window runs out between them',
  )
  // A squad bot fires on its own and takes a hit before a hero does.
  squad.foes.push(newFoe('spawner', { x: 330, y: 186 }, squad.rng))
  for (let t = 0; t < 120; t++) squad.update(emptyInput())
  assert.ok(squad.score > 0 || squad.foes[0].hp < 3, 'the squad bot fires')
  const lives = squad.lives
  squad.heroes[0].invuln = 0
  squad.hurtHero(squad.heroes[0])
  assert.equal(squad.heroes[0].squad, 0, 'the squad bot takes the hit')
  assert.equal(squad.lives, lives, 'not a hero')
}

// --- power-ups --------------------------------------------------------------------------------------
{
  for (const kind of POWER_KINDS) assert.ok(POWERS[kind].ticks > 0)
  const grab = (kind: string) => {
    const game = fresh()
    emptyArena(game)
    game.pickups.push({ kind, x: 244, y: 186, life: 100 })
    game.update(emptyInput())
    return game
  }
  const spread = grab('spread')
  assert.ok(spread.heroes[0].powers.spread > 0)
  spread.update(aimAt(1, 0))
  assert.equal(spread.shots.length, 3, 'spread: a three-way beam')
  const rapid = grab('rapid')
  for (let t = 0; t < 12; t++) rapid.update(aimAt(1, 0))
  const plain = fresh()
  emptyArena(plain)
  for (let t = 0; t < 12; t++) plain.update(aimAt(1, 0))
  assert.ok(rapid.shots.length > plain.shots.length, 'rapid: faster fire')
  const shield = grab('shield')
  shield.hurtHero(shield.heroes[0])
  assert.equal(shield.lives, 3, 'the bubble takes a hit')
  assert.equal(shield.heroes[0].powers.shield, undefined, 'and pops')
  const pause = grab('pause')
  const drone = newFoe('drone', { x: 400, y: 186 }, pause.rng)
  pause.foes.push(drone)
  const at = drone.x
  for (let t = 0; t < 60; t++) pause.update(emptyInput())
  assert.equal(drone.x, at, 'pause: every foe freezes')
  const sprint = grab('sprint')
  const from = sprint.heroes[0].x
  sprint.update(press('right'))
  assert.ok(sprint.heroes[0].x - from > 2.5, 'sprint: extra speed')
  const wide = grab('wide')
  wide.foes.push(newFoe('drone', { x: 280, y: 182 }, wide.rng))
  wide.foes.push(newFoe('drone', { x: 300, y: 182 }, wide.rng))
  for (let t = 0; t < 30; t++) wide.update(aimAt(1, 0))
  assert.equal(wide.foes.length, 0, 'wide: the beam goes straight through')
}

// --- the Shelter, thank-you hearts and saves --------------------------------------------------------
{
  const game = fresh()
  // Rescues pay hearts.
  emptyArena(game)
  const before = game.hearts
  game.family.push({
    id: 99,
    kind: 'cat',
    x: 246,
    y: 186,
    vx: 0,
    vy: 0,
    turn: 999,
    color: '#fff',
    skin: '#fff',
    state: 'calm',
    clock: 0,
    immune: 0,
    seat: 0,
    slot: 0,
  })
  game.update(emptyInput())
  assert.ok(game.hearts > before, 'a rescue earns a thank-you heart')
  assert.ok(game.friends > 0, 'and a friend at the Shelter')

  const shop = fresh()
  shop.level = 8
  shop.index = 7
  shop.hearts = 200
  shop.openShelter()
  for (let t = 0; t < 25; t++) shop.update(emptyInput())
  const lives = shop.lives
  shop.update(press('a'))
  assert.equal(shop.lives, lives + 1, 'a spare hero')
  assert.equal(shop.hearts, 200 - SHELTER_ITEMS[0]!.cost(0))
  shop.update(press('down'))
  shop.update(press('a'))
  assert.equal(shop.heroes[0].squad, 1, 'a squad bot')
  shop.hearts = 0
  shop.update(press('down'))
  shop.update(press('a'))
  assert.equal(shop.upgrades.beam, 0, 'no hearts, no beam')
  shop.update(press('up'))
  shop.update(press('up'))
  shop.update(press('up'))
  shop.update(press('a'))
  assert.equal(shop.shelter, null, 'on to the next district')
  assert.equal(shop.level, 9)
  assert.equal(shop.district, 1)
  // The district's start is saved.
  const save = shop.save
  assert.ok(save && save.district === 1, 'saved at the Toy Factory')
  assert.deepEqual(readSave(JSON.parse(JSON.stringify(save))), save)
  assert.equal(
    readSave({ ...save, district: 99 }),
    null,
    'a bad save is ignored',
  )
  assert.equal(readSave({ ...save, score: -5 }), null)
  assert.equal(readSave('nonsense'), null)

  // Picking it back up on a new cabinet: the opening card offers it.
  const back = fresh(4, save)
  assert.ok(back.offer, 'the saved rally is offered')
  assert.equal(back.level, 1)
  back.update(press('a'))
  assert.equal(back.level, 9, 'continued at the Toy Factory')
  assert.equal(back.lives, save.lives)
  assert.equal(back.heroes[0].squad, 1)
  const anew = fresh(4, save)
  anew.update(press('down'))
  anew.update(press('a'))
  assert.equal(anew.level, 1, 'or a new rally')
  assert.equal(anew.save.district, 0)

  // Game over keeps the district, with the score back to zero.
  back.lives = 0
  back.heroes[0].alive = false
  for (let t = 0; t < 200; t++) back.update(emptyInput())
  assert.ok(back.over)
  assert.equal(back.save.district, 1)
  assert.equal(back.save.score, 0)
  assert.equal(back.save.continued, true)
  // The attract demo never saves.
  const demo = mod.create({
    rng: mulberry32(1),
    sound: quiet,
    demo: true,
    hiScore: 0,
  }) as any
  assert.equal(demo.save, undefined)
}

// --- the music: a loop per district, the boss theme on a boss wave, the Shelter's tune ------------
{
  const game = fresh()
  assert.equal(game.music, DISTRICTS[0]!.music)
  game.startWave(8)
  assert.notEqual(game.music, DISTRICTS[0]!.music, 'the boss theme')
  game.startWave(9)
  assert.equal(game.music, DISTRICTS[1]!.music)
}

// --- a full pilot run passes the first boss --------------------------------------------------------
{
  const meta = ARCADE_GAMES.find((g) => g.slug === 'rescue-rally')!
  const game = fresh(3)
  let shelters = 0
  for (let t = 0; t < 60 * 60 * 45 && !game.over; t++) {
    const was = !!game.shelter
    game.update(game.demoInput())
    if (!was && game.shelter) shelters++
  }
  assert.ok(shelters >= 1, 'the pilot reaches the Shelter')
  assert.ok(game.over, 'and its run still ends')
  assert.ok(game.score <= meta.maxPlausibleScore)
}

console.log('verifyCabinetRescueRallyCampaign: ok')
