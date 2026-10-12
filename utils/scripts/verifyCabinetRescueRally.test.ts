// /utils/scripts/verifyCabinetRescueRally.test.ts
//
// Rescue Rally depth slice 1 (conductor kr-arcade t-035, depth-pass/CABINETS.md section 1, "Twin-stick
// and teeth"): the glitch and reboot round trip, the stomper's bonk and the dizzy walk home, the
// sparker's tell and leading shot, the parade to the beacon, twin-stick aim, the wave scripts, and a
// pilot probe that shows runs still end.
//
//   npx tsx utils/scripts/verifyCabinetRescueRally.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { glyphFor, measureText } from '../arcade/font'
import { ARCADE_GAMES } from '../arcade/games'
import mod from '../arcade/games/rescueRally'
import { ARENA, W } from '../arcade/rescueRally/arena'
import { PARADE_MAX } from '../arcade/rescueRally/family'
import {
  PYLON_SHAPES,
  kindWord,
  pylonSpots,
} from '../arcade/rescueRally/pylons'
import {
  FOES,
  FOE_KINDS,
  SPARK_TELL,
  leadShot,
  newFoe,
} from '../arcade/rescueRally/roster'
import { DISTRICTS, waveAt } from '../arcade/rescueRally/districts'
import {
  NEON_PLAZA,
  TOY_FACTORY,
  groupSize,
  scriptFoes,
} from '../arcade/rescueRally/waves'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'

const RALLY_WAVES = DISTRICTS.flatMap((d) => d.waves)

/* eslint-disable @typescript-eslint/no-explicit-any */

const quiet = { play: () => {} }
/** A game past the menu of modes, straight into the campaign. */
const fresh = (seed = 3, demo = false) => {
  const game = mod.create({
    rng: mulberry32(seed),
    sound: quiet,
    demo,
    hiScore: 0,
  }) as any
  game.menu = null
  return game
}

/** A quiet arena: the wave's foes and family gone, the hero in the middle, nothing hurrying. */
function emptyArena(game: any) {
  game.foes = []
  game.family = []
  game.arrivals = []
  game.bolts = []
  game.shots = []
  game.banner = null
  const h = game.heroes[0]
  Object.assign(h, { x: 240, y: 186, invuln: 0, trail: [] })
  // A late group far in the future keeps the wave from clearing itself while the test runs.
  game.arrivals = [{ tick: 1e9, kind: 'drone', count: 1, from: 'vents' }]
  game.boss = null
  game.belts = []
  game.pickups = []
  game.ventPower = true
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

function hold(...buttons: (keyof InputFrame['held'])[]): InputFrame {
  const f = emptyInput()
  for (const b of buttons) f.held[b] = true
  return f
}

// --- the registry ----------------------------------------------------------------------------------
{
  const meta = ARCADE_GAMES.find((g) => g.slug === 'rescue-rally')!
  assert.equal(meta.twinStick, true, 'rescue rally aims with a second stick')
}

// --- data: the roster, the pylons and the wave scripts --------------------------------------------
{
  assert.ok(
    FOE_KINDS.length >= 9,
    'drone, seeker, spawner, tank, puddle + four new',
  )
  for (const kind of ['stomper', 'hypno', 'sparker', 'pylon'] as const)
    assert.ok(FOES[kind], `${kind} is on the roster`)
  assert.equal(FOES.stomper.hp, 0, 'no beam can stop a stomper')
  assert.ok(FOES.stomper.shove > 0, 'but it can shove one')
  assert.equal(FOES.stomper.hostile, false, 'a wave never waits on a stomper')

  for (const [name, rows] of Object.entries(PYLON_SHAPES)) {
    assert.ok(rows.join('').includes('X'), `${name} has posts`)
  }
  const word = kindWord(240, 186)
  assert.deepEqual(
    word.map((p) => p.shape),
    ['k', 'i', 'n', 'd'],
    'K-I-N-D spells out',
  )
  const posts = word.flatMap(pylonSpots)
  assert.ok(
    Math.abs(
      (Math.min(...posts.map((p) => p.x)) +
        Math.max(...posts.map((p) => p.x))) /
        2 -
        240,
    ) < 1,
    'the word is centred',
  )

  assert.equal(NEON_PLAZA.length, 8)
  assert.equal(TOY_FACTORY.length, 8)
  assert.equal(NEON_PLAZA.filter((w) => w.signature).length, 1)
  assert.equal(NEON_PLAZA[2]!.signature, true, 'the Pylon Garden is third')
  assert.equal(TOY_FACTORY[2]!.signature, true, 'the Hypno wave is third')
  assert.equal(scriptFoes(TOY_FACTORY[2]!).get('hypno'), 3, 'three hypnos')
  const names = new Set<string>()
  for (const wave of RALLY_WAVES) {
    assert.ok(!names.has(wave.name), `${wave.name} is named once`)
    names.add(wave.name)
    for (const line of [wave.name, wave.hint]) {
      for (const ch of line)
        assert.ok(
          ch === '?' || glyphFor(ch) !== glyphFor('?'),
          `glyph for ${ch} in ${line}`,
        )
      assert.ok(measureText(line, 2) <= W - 16, `${line} fits the banner`)
    }
    for (const place of wave.pylons ?? [])
      for (const p of pylonSpots(place)) {
        assert.ok(
          p.x > ARENA.left &&
            p.x < ARENA.right &&
            p.y > ARENA.top &&
            p.y < ARENA.bottom,
          `${wave.name}: its posts are inside the arena`,
        )
      }
    if (wave.beacon) {
      assert.ok(
        wave.beacon.x > ARENA.left + 20 && wave.beacon.x < ARENA.right - 20,
      )
      assert.ok(
        wave.beacon.y > ARENA.top + 20 && wave.beacon.y < ARENA.bottom - 20,
      )
    }
    assert.ok(
      wave.groups.some((g) => FOES[g.kind].hostile),
      `${wave.name} can be cleared`,
    )
  }
  // The new foes come in on the scripts: stompers in the plaza, hypnos and sparkers in the factory.
  assert.ok(NEON_PLAZA.some((w) => scriptFoes(w).has('stomper')))
  assert.ok(NEON_PLAZA.some((w) => (w.pylons ?? []).length > 0))
  assert.ok(
    TOY_FACTORY.filter((w) => !w.boss).every(
      (w) => scriptFoes(w).has('hypno') || scriptFoes(w).has('sparker'),
    ),
  )
  // The rally loops, every group (but a fixed set piece) bigger each time round.
  assert.equal(waveAt(1).script, RALLY_WAVES[0])
  assert.equal(waveAt(RALLY_WAVES.length + 1).script, RALLY_WAVES[0])
  assert.equal(waveAt(RALLY_WAVES.length + 1).loop, 2)
  const group = { kind: 'drone' as const, count: 10, from: 'edges' as const }
  assert.ok(groupSize(group, 2) > groupSize(group, 1))
  assert.ok(groupSize(group, 3) > groupSize(group, 2))
  assert.equal(groupSize({ ...group, fixed: true }, 4), 10)
}

// --- a wave script plays as written ---------------------------------------------------------------
{
  const game = fresh()
  game.startWave(3)
  const script = RALLY_WAVES[2]!
  assert.equal(game.script, script)
  const pylons = game.foes.filter(
    (f: { kind: string }) => f.kind === 'pylon',
  ).length
  const written = (script.pylons ?? []).flatMap(pylonSpots).length
  assert.ok(
    pylons > written - 4 && pylons <= written,
    'the pylon garden is laid out',
  )
  assert.equal(game.family.length, script.family.count)
  assert.deepEqual(game.beacon, script.beacon)
  assert.equal(
    game.heroes[0].x,
    script.hero!.x,
    'the hero starts where the script says',
  )
  const late = script.groups.find((g) => g.at)!
  const drones = () => game.foes.filter((f: any) => f.kind === 'drone').length
  const before = drones()
  assert.equal(game.arrivals.length, 1, 'the vent group waits')
  game.heroes[0].invuln = 99999
  game.lives = 99
  for (let t = 0; t < late.at! - 1; t++) game.update(emptyInput())
  assert.equal(game.arrivals.length, 1, 'not yet')
  game.update(emptyInput())
  game.update(emptyInput())
  assert.equal(game.arrivals.length, 0, 'through the vents on time')
  assert.ok(drones() >= Math.min(before, 1), 'drones came in')
}

// --- the glitch and reboot round trip -------------------------------------------------------------
{
  const game = fresh()
  emptyArena(game)
  const r = person(game, 300, 186)
  const hypno = newFoe('hypno', { x: 330, y: 186 }, game.rng)
  game.foes.push(hypno)
  let t = 0
  for (; t < 600 && r.state !== 'glitched'; t++) game.update(emptyInput())
  assert.equal(r.state, 'glitched', 'the hypno reaches them and glitches them')
  assert.equal(hypno.mode, 1, 'and stands in a trance')
  assert.ok(
    game.family.includes(r),
    'never removed: a glitched friend is still family',
  )
  // The glitched friend counts: the wave waits for it.
  game.foes = []
  game.arrivals = []
  game.update(emptyInput())
  assert.equal(
    game.waveDelay,
    0,
    'the wave is not clear while a friend is glitched',
  )
  // A beam reboots them, never more.
  const score = game.score
  Object.assign(r, { x: 280, y: 186, vx: 0, vy: 0 })
  game.heroes[0].invuln = 999
  const aim = emptyInput()
  aim.aim = { x: 1, y: 0 }
  for (t = 0; t < 30 && r.state === 'glitched'; t++) game.update(aim)
  assert.equal(r.state, 'calm', 'rebooted back into a rescuee')
  assert.ok(r.immune > 0, 'and safe from hypnos for a while')
  assert.ok(game.family.includes(r), 'still in the arena, ready to rescue')
  assert.equal(game.score - score, 100, 'a reboot pays a little')
}

// --- a glitched friend chases the hero and bonks it ---------------------------------------------
{
  const game = fresh()
  emptyArena(game)
  const r = person(game, 280, 186, 'glitched')
  const lives = game.lives
  for (let t = 0; t < 300 && game.lives === lives; t++)
    game.update(emptyInput())
  assert.equal(game.lives, lives - 1, 'touching a glitched friend costs a hero')
  assert.equal(r.state, 'glitched')
}

// --- the stomper knocks the family dizzy; the dizzy walk home -------------------------------------
{
  const game = fresh()
  emptyArena(game)
  const r = person(game, 120, 100)
  const stomper = newFoe('stomper', { x: 160, y: 100 }, game.rng)
  game.foes.push(stomper)
  game.heroes[0].invuln = 99999
  let t = 0
  for (; t < 900 && r.state !== 'dizzy'; t++) game.update(emptyInput())
  assert.equal(r.state, 'dizzy', 'the stomper bonks them dizzy')
  const saved = game.familySaved
  const score = game.score
  for (t = 0; t < 60 * 30 && game.family.includes(r); t++)
    game.update(emptyInput())
  assert.ok(!game.family.includes(r), 'a dizzy rescuee wanders off home')
  assert.equal(game.familySaved, saved, 'without counting as rescued')
  assert.equal(game.score, score, 'or a bonus')
  // Beams only shove it.
  const shove = fresh()
  emptyArena(shove)
  const big = newFoe('stomper', { x: 300, y: 186 }, shove.rng)
  shove.foes.push(big)
  shove.heroes[0].invuln = 99999
  const aim = emptyInput()
  aim.aim = { x: 1, y: 0 }
  for (t = 0; t < 120; t++) shove.update(aim)
  assert.ok(shove.foes.includes(big), 'no beam reboots a stomper')
  assert.ok(big.x > 320, 'the beam shoves it back')
}

// --- catching a dizzy rescuee saves them, with no bonus ------------------------------------------
{
  const game = fresh()
  emptyArena(game)
  const r = person(game, 250, 186, 'dizzy')
  r.clock = 100
  const score = game.score
  game.update(emptyInput())
  game.update(emptyInput())
  assert.ok(!game.family.includes(r))
  assert.equal(game.familySaved, 1, 'safe')
  assert.equal(game.score, score, 'unpaid')
}

// --- the sparker flashes, then leads its shot ------------------------------------------------------
{
  const lead = leadShot({ x: 100, y: 100 }, { x: 200, y: 100, vx: 0, vy: 2 }, 3)
  assert.ok(lead.y > 0.3, 'a hero walking down is shot ahead of, not at')
  const still = leadShot(
    { x: 100, y: 100 },
    { x: 200, y: 100, vx: 0, vy: 0 },
    3,
  )
  assert.ok(Math.abs(still.y) < 1e-9 && still.x > 0.99)

  const game = fresh()
  emptyArena(game)
  const sparker = newFoe('sparker', { x: 360, y: 186 }, game.rng)
  game.foes.push(sparker)
  game.heroes[0].invuln = 99999
  let flashedFor = 0
  let fired = false
  for (let t = 0; t < 600 && !fired; t++) {
    game.update(hold(t % 120 < 60 ? 'down' : 'up'))
    if (sparker.mode === 1) flashedFor++
    fired = game.bolts.length > 0
  }
  assert.ok(fired, 'it fires')
  assert.ok(flashedFor >= SPARK_TELL - 2, 'after flashing for its tell')
  const bolt = game.bolts[0]
  const toHero = Math.atan2(
    game.heroes[0].y - bolt.y,
    game.heroes[0].x - bolt.x,
  )
  const shot = Math.atan2(bolt.vy, bolt.vx)
  assert.ok(Math.abs(shot - toHero) > 0.02, 'aimed ahead of a moving hero')
  // A spark that lands costs a hero; a beam can put one out.
  const out = fresh()
  emptyArena(out)
  out.bolts.push({ x: 300, y: 186, vx: -2, vy: 0, life: 100 })
  const aim = emptyInput()
  aim.aim = { x: 1, y: 0 }
  for (let t = 0; t < 20; t++) out.update(aim)
  assert.equal(out.bolts.length, 0, 'the beam fizzles a spark')
  assert.equal(out.lives, 3)
}

// --- rescue choices: collect at once, or lead a parade to the beacon for double ------------------
{
  const game = fresh()
  emptyArena(game)
  game.beacon = { x: 240, y: 60 }
  person(game, 250, 186)
  game.update(emptyInput())
  assert.equal(game.score, 1000, 'touching collects at once')
  assert.equal(game.multiplier, 2, 'and the bonus climbs')

  const parade = fresh()
  emptyArena(parade)
  parade.beacon = { x: 240, y: 60 }
  const kids = [
    person(parade, 250, 186),
    person(parade, 240, 196),
    person(parade, 230, 186),
    person(parade, 240, 176),
  ]
  parade.update(hold('b'))
  const following = kids.filter((k) => k.state === 'parade')
  assert.equal(following.length, PARADE_MAX, 'holding B, up to three follow')
  assert.equal(parade.score, 1000, 'the fourth is collected at once')
  for (
    let t = 0;
    t < 400 && parade.family.some((k: any) => k.state === 'parade');
    t++
  )
    parade.update(hold('up'))
  assert.ok(
    following.every((k) => !parade.family.includes(k)),
    'walked to the pad',
  )
  // Multiplier 2, 3, 4 for the three, doubled.
  assert.equal(
    parade.score,
    1000 + 2 * (2000 + 3000 + 4000),
    'double the bonus at the beacon',
  )

  const scatter = fresh()
  emptyArena(scatter)
  scatter.beacon = { x: 240, y: 60 }
  const kid = person(scatter, 250, 186)
  scatter.update(hold('b'))
  assert.equal(kid.state, 'parade')
  scatter.foes.push(newFoe('drone', { x: 240, y: 186 }, scatter.rng))
  scatter.update(emptyInput())
  assert.equal(kid.state, 'calm', 'a hit scatters the parade')
  assert.ok(scatter.family.includes(kid), 'back to waiting, not lost')
}

// --- twin-stick: the second stick aims and fires on its own; B strafes without one ---------------
{
  const game = fresh()
  emptyArena(game)
  const frame = hold('left')
  frame.aim = { x: 0, y: 0.9 }
  game.update(frame)
  const h = game.heroes[0]
  assert.ok(h.x < 240, 'moves left')
  assert.ok(h.aimY > 0.99, 'aims down')
  assert.equal(game.shots.length, 1, 'and fires without A')
  assert.ok(game.shots[0].vy > 0)
  const drift = emptyInput()
  drift.aim = { x: 0.1, y: 0.1 }
  const idle = fresh()
  emptyArena(idle)
  idle.update(drift)
  assert.equal(
    idle.shots.length,
    0,
    'a stick inside the dead zone neither aims nor fires',
  )
  const strafe = fresh()
  emptyArena(strafe)
  strafe.heroes[0].aimX = 1
  strafe.heroes[0].aimY = 0
  strafe.update(hold('up', 'b', 'a'))
  assert.equal(strafe.heroes[0].aimX, 1, 'B holds the aim while moving')
  assert.ok(strafe.shots[0].vx > 0)
}

// --- the attract demo scores nothing; the pilot's runs end -----------------------------------------
{
  const demo = fresh(7, true)
  for (let t = 0; t < 60 * 60 * 3 && !demo.over; t++) demo.update(emptyInput())
  assert.equal(demo.score, 0, 'the attract demo never scores')
  assert.ok(demo.level > 2, 'but it plays on through the waves')

  const game = fresh(3)
  let t = 0
  for (; t < 60 * 60 * 45 && !game.over; t++) game.update(game.demoInput())
  assert.ok(game.over, 'the pilot runs out of heroes within 45 minutes')
  assert.ok(
    game.level > 8,
    `it gets well into the rally first (wave ${game.level})`,
  )
  const meta = ARCADE_GAMES.find((g) => g.slug === 'rescue-rally')!
  assert.ok(game.score <= meta.maxPlausibleScore)
}

console.log('verifyCabinetRescueRally: ok')
