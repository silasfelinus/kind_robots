import assert from 'node:assert/strict'
import {
  createRainbowGuardian,
  RAINBOW_GUARDIAN,
  rainbowGuardianGone,
  rainbowGuardianWarning,
  stepRainbowGuardian,
} from '../arcade/games/rainbowGuardian'
import { MOONJELLY_GUARDIAN } from '../arcade/games/rainbowMoonjelly'
import {
  PINKWAKE_GUARDIAN,
  PINKWAKE_SECTIONS,
} from '../arcade/games/rainbowPinkwake'
import { createRainbowPrincessPreview } from '../arcade/games/rainbowPrincessPreview'
import { emptyInput, type InputFrame } from '../arcade/types'

// Conductor rainbow t-007: each Act's mid-Act guardian holds one authored section alone, warns before
// every volley, can be destroyed by an ordinary pilot for a bonus, escapes when ignored, and comes back
// when a continue rewinds to its section.

// The module: hull, charge cue, fair patterns, escape.
assert.equal(createRainbowGuardian('urchin', 1).maxHp, 60)
assert.equal(createRainbowGuardian('urchin', 4).maxHp, 348)
assert.ok(PINKWAKE_SECTIONS.some((s) => s.name === PINKWAKE_GUARDIAN.name))
for (const kind of ['urchin', 'lantern'] as const) {
  const guardian = createRainbowGuardian(kind, 1)
  const pilots = [{ x: 80, y: 150, lives: 3 }]
  let cue = 0
  let volleys = 0
  for (let frame = 0; frame < 1200; frame++) {
    if (frame === 600) guardian.hp = guardian.maxHp / 2
    const shots = stepRainbowGuardian(guardian, pilots, false)
    if (shots.length) {
      volleys++
      assert.ok(
        cue >= RAINBOW_GUARDIAN.warningFrames,
        `${kind} volley ${volleys} followed ${cue} warning frames`,
      )
      const enraged = guardian.hp <= guardian.maxHp / 2
      if (kind === 'urchin') {
        // A twelve (sixteen when enraged) pearl ring with three pearls missing.
        assert.equal(shots.length, enraged ? 13 : 9)
      } else {
        const aim = Math.atan2(
          pilots[0]!.y - shots[0]!.y,
          pilots[0]!.x - shots[0]!.x,
        )
        assert.equal(shots.length, enraged ? 8 : 6)
        for (const shot of shots) {
          const off = Math.abs(Math.atan2(shot.vy, shot.vx) - aim)
          assert.ok(off >= 0.2, 'the lane straight at the pilot stays open')
        }
      }
    }
    // The cue is drawn after each step, as the game renders after it updates.
    cue = rainbowGuardianWarning(guardian) ? cue + 1 : 0
  }
  assert.ok(volleys >= 8, `${kind} fired ${volleys} volleys`)
  // Escaping abandons a charge in progress: no volley ever fires once it gives up.
  while (!rainbowGuardianWarning(guardian))
    stepRainbowGuardian(guardian, pilots, false)
  let fled = 0
  while (!rainbowGuardianGone(guardian)) {
    assert.equal(stepRainbowGuardian(guardian, pilots, true).length, 0)
    assert.equal(rainbowGuardianWarning(guardian), false)
    assert.ok(++fled < 200, 'it leaves the playfield')
  }
}

function seeded(seed: number) {
  let state = seed
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 0x100000000
  }
}

type Game = ReturnType<typeof createRainbowPrincessPreview>
type Mode = 'fight' | 'ignore' | 'ram'

/**
 * Fly firing lanes through the waves. At the guardian: `fight` holds its line and slips aside while it
 * charges, `ignore` dodges without ever shooting it, and `ram` flies into it.
 */
function pilot(game: Game, frame: number, mode: Mode): InputFrame {
  const s = game.snapshot
  const input = emptyInput()
  const ship = s.ships[0]
  if (!ship) return input
  input.held.a = true
  let target = 70 + (Math.floor(frame / 240) % 3) * 70
  let x = 90
  const guardian = s.guardian
  if (guardian) {
    if (mode === 'ram') {
      target = guardian.y
      x = guardian.x
    } else if (mode === 'fight') {
      const charging = guardian.nextVolley - guardian.frame < 40
      target = guardian.y + (charging ? (guardian.y > 135 ? -60 : 60) : 0)
    } else {
      input.held.a = false
      const near = s.enemyShots.filter(
        (shot) => shot.x > ship.x - 10 && shot.x < ship.x + 120,
      )
      let best = -1
      for (let y = 50; y <= 230; y += 10) {
        const room = Math.min(
          80,
          Math.abs(y - guardian.y),
          ...near.map((shot) => Math.abs(shot.y - y)),
        )
        if (room > best) {
          best = room
          target = y
        }
      }
      x = 40
    }
  }
  input.held.up = ship.y > target + 3
  input.held.down = ship.y < target - 3
  input.held.left = ship.x > x + 3
  input.held.right = ship.x < x - 3
  return input
}

type Watch = {
  spawns: Array<{ tick: number; hp: number; maxHp: number }>
  bonus: number
  pickupsDropped: number
  shotsAfterDefeat: number
  continues: number
}

/** Fly Act I until the guardian section is over; report what happened to the guardian. */
function flyActOne(mode: Mode, until = PINKWAKE_GUARDIAN.to + 60) {
  const game = createRainbowPrincessPreview({
    players: 1,
    demo: false,
    rng: seeded(1234),
    sound: { play() {} },
    hiScore: 0,
  })
  const watch: Watch = {
    spawns: [],
    bonus: 0,
    pickupsDropped: 0,
    shotsAfterDefeat: -1,
    continues: 0,
  }
  for (let frame = 0; frame < 60000; frame++) {
    const before = game.snapshot
    if (before.continueLeft > 0) {
      const input = emptyInput()
      input.pressed.a = before.continueLeft < 500
      if (input.pressed.a) watch.continues++
      game.update(input)
      continue
    }
    const input = pilot(game, frame, mode)
    game.update(input, [input])
    const after = game.snapshot
    const guardian = after.guardian
    if (guardian && guardian.frame === 1)
      watch.spawns.push({
        tick: after.tick,
        hp: guardian.hp,
        maxHp: guardian.maxHp,
      })
    if (guardian) {
      assert.ok(
        after.tick >= PINKWAKE_GUARDIAN.from &&
          after.tick < PINKWAKE_GUARDIAN.to,
        `the guardian stays inside its section (tick ${after.tick})`,
      )
    }
    if (
      before.guardian &&
      !after.guardian &&
      after.guardians[1] === 'defeated'
    ) {
      watch.bonus = after.score - before.score
      watch.pickupsDropped = after.pickups.length - before.pickups.length
      watch.shotsAfterDefeat = after.enemyShots.length
    }
    if (after.tick >= until && after.continueLeft === 0) return { game, watch }
  }
  assert.fail(`${mode} pilot never finished the guardian section`)
}

// An ordinary pilot destroys the Urchin guardian for its bonus and a full set of pickups.
{
  const { game, watch } = flyActOne('fight')
  assert.equal(game.snapshot.guardians[1], 'defeated')
  assert.ok(watch.spawns.length >= 1)
  assert.equal(watch.spawns[0]!.tick, PINKWAKE_GUARDIAN.from)
  assert.equal(watch.spawns[0]!.maxHp, 60)
  assert.ok(watch.bonus >= RAINBOW_GUARDIAN.bonus, `bonus ${watch.bonus}`)
  assert.equal(watch.pickupsDropped, 3)
  assert.equal(watch.shotsAfterDefeat, 0, 'its pellets go with it')
}

// A pilot who never shoots it sees it escape before its section ends; it never returns.
{
  const { game, watch } = flyActOne('ignore', PINKWAKE_GUARDIAN.to + 600)
  assert.equal(game.snapshot.guardians[1], 'escaped')
  assert.equal(game.snapshot.guardian, null)
  assert.equal(watch.bonus, 0)
}

// Ramming it costs hits, not the guardian; when the crew falls in its section, the continue rewinds to
// the section start and a fresh guardian flies again.
{
  const { watch } = flyActOne('ram')
  assert.ok(watch.continues >= 1, 'the rammer fell')
  assert.ok(watch.spawns.length >= 2, 'the guardian flew again')
  for (const spawn of watch.spawns) {
    assert.equal(spawn.tick, PINKWAKE_GUARDIAN.from)
    assert.equal(spawn.hp, spawn.maxHp)
  }
}

// Act II's Lantern guardian arrives in its own section of the Moonjelly clock.
{
  const game = createRainbowPrincessPreview({
    players: 1,
    demo: true,
    rng: seeded(1234),
    sound: { play() {} },
    hiScore: 0,
  })
  let arrived: number | null = null
  for (let frame = 0; frame < 90000 && arrived === null; frame++) {
    game.update(emptyInput())
    const s = game.snapshot
    if (s.act === 'S02' && s.guardian?.frame === 1) {
      arrived = s.actTwoFrame
      assert.equal(s.guardian.kind, MOONJELLY_GUARDIAN.kind)
    }
  }
  assert.equal(arrived, MOONJELLY_GUARDIAN.from)
}

console.log(
  'rainbow guardians: ok (urchin ring and lantern fans telegraphed, destroyed, escaped, rewound)',
)
