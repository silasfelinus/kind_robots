// /utils/scripts/verifyZuzuShowdownBoss.test.ts
//
// The Thing Behind the Door (conductor zuzu-showdown t-021): it starts flush against the stage's edge
// and nobody gets behind it; it is never stunned, pushed, knocked down or thrown, only hurt; its
// phases fall at half and a fifth of its health, the last bringing the eye out where hits do double;
// the fight is one round; its AI keeps the grab and the portals for phase 2 on, and every one of its
// attacks can land; every fighter on the roster can bring it down with plain normals inside the clock;
// its painter stays on screen through every attack, art or none; and its layers ship in both styles at
// the size boss.json says.
//
//   npx tsx utils/scripts/verifyZuzuShowdownBoss.test.ts

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  BOSS,
  BOSS_COOLDOWN,
  BOSS_PATTERNS,
  bossInput,
  bossPhase,
  bossPress,
  newBoss,
  type BossMove,
} from '../zuzuShowdown/boss'
import { BOSS_LAYERS, bossLayerUrl, bossPainter } from '../zuzuShowdown/bossArt'
import { FIGHTERS, findFighter } from '../zuzuShowdown/fighters'
import { VIEW_HEIGHT, VIEW_WIDTH } from '../zuzuShowdown/render'
import {
  INTRO_FRAMES,
  ROUND_FRAMES,
  STAGE_HALF_WIDTH,
  createMatch,
  hurtbox,
  phaseIndex,
  step,
} from '../zuzuShowdown/sim'
import {
  SUB,
  neutralInput,
  type FighterData,
  type MatchState,
  type SimInput,
} from '../zuzuShowdown/types'
import index from '../zuzuShowdown/bossLayers.json'

let passed = 0
function check(name: string, fn: () => void): void {
  try {
    fn()
    passed += 1
  } catch (error) {
    console.error(`FAIL ${name}`)
    throw error
  }
}

type Roster = [FighterData, FighterData]
const ZUZU = findFighter('zuzu')

/** Closer than this (centre to centre, pixels), `fighter` is pressed up against the door. */
function touching(fighter: FighterData): number {
  return fighter.pushbox.w / 2 + BOSS.pushbox.w / 2 + 6
}

/** A match already past its intro. */
function fightingMatch(roster: Roster): MatchState {
  let s = createMatch(roster)
  for (let i = 0; i < INTRO_FRAMES + 5; i += 1)
    s = step(s, [neutralInput(), neutralInput()], roster)
  assert.equal(s.phase, 'fight')
  return s
}

check(
  'it starts flush against the right edge, and nobody gets behind it',
  () => {
    const roster: Roster = [ZUZU, BOSS]
    let s = fightingMatch(roster)
    const edge = STAGE_HALF_WIDTH * SUB
    assert.ok(s.fighters[1].x > edge - 70 * SUB, 'at the edge')
    // Walk in and jump at it, forward, for ten seconds.
    for (let i = 0; i < 600; i += 1) {
      const p = { ...neutralInput(), right: true, up: i % 40 < 3 }
      s = step(s, [p, neutralInput()], roster)
      assert.ok(s.fighters[0].x < s.fighters[1].x, `behind it at frame ${i}`)
    }
  },
)

check('it is only ever hurt: no stun, push, knockdown or throw', () => {
  const roster: Roster = [findFighter('old-komodo'), BOSS]
  let s = fightingMatch(roster)
  const startX = s.fighters[1].x
  let hits = 0
  let tries = 0
  for (let i = 0; i < 1200 && s.phase === 'fight'; i += 1) {
    const gap = (s.fighters[1].x - s.fighters[0].x) / SUB
    const p: SimInput = { ...neutralInput() }
    const free = s.fighters[0].attack === null && i % 2 === 0
    if (gap > touching(roster[0])) p.right = true
    else if (free) {
      // Heavies, launchers (crouch HK) and throws (LP+LK close), in turn.
      const kind = tries % 3
      tries += 1
      if (kind === 0) p.hp = true
      else if (kind === 1) {
        p.down = true
        p.hk = true
      } else {
        p.lp = true
        p.lk = true
      }
    }
    s = step(s, [p, neutralInput()], roster)
    hits += s.events.filter((e) => e.type === 'hit' && e.attacker === 0).length
    const b = s.fighters[1]
    assert.equal(b.x, startX, 'never moves')
    assert.equal(b.y, 0, 'never leaves the floor')
    assert.ok(
      !['hitstun', 'knockdown', 'airhit', 'thrown', 'blockstun'].includes(
        b.action,
      ),
      `no reaction (${b.action})`,
    )
    assert.ok(
      !s.events.some((e) => e.type === 'throw' && e.attacker === 0),
      'never thrown',
    )
  }
  assert.ok(hits > 5, `it was hit (${hits})`)
})

check('phases fall at half and a fifth; the eye takes double', () => {
  assert.equal(phaseIndex(BOSS.health, BOSS), 0)
  assert.equal(phaseIndex(BOSS.health / 2, BOSS), 0)
  assert.equal(phaseIndex(BOSS.health / 2 - 1, BOSS), 1)
  assert.equal(phaseIndex(BOSS.health / 5 - 1, BOSS), 2)
  const roster: Roster = [ZUZU, BOSS]
  const s = fightingMatch(roster)
  const door = hurtbox(s.fighters[1], BOSS)!
  s.fighters[1].health = Math.floor(BOSS.health / 5) - 1
  assert.equal(bossPhase(s), 2)
  const eye = hurtbox(s.fighters[1], BOSS)!
  assert.ok(eye.bottom > door.bottom, 'the eye hangs above the floor')
  // The same jab, at full health and in phase 3.
  const damageAt = (health: number) => {
    let m = fightingMatch(roster)
    m.fighters[1].health = health
    m.fighters[0].x = m.fighters[1].x - 50 * SUB
    for (let i = 0; i < 30; i += 1) {
      m = step(m, [{ ...neutralInput(), lp: i === 0 }, neutralInput()], roster)
      const hit = m.events.find((e) => e.type === 'hit' && e.attacker === 0)
      if (hit && hit.type === 'hit') return hit.damage
    }
    return 0
  }
  const full = damageAt(BOSS.health)
  const late = damageAt(Math.floor(BOSS.health / 5) - 1)
  assert.ok(full > 0, 'the jab lands on the door')
  assert.equal(late, full * 2, 'double on the eye')
})

check('the fight is a single round', () => {
  const roster: Roster = [ZUZU, BOSS]
  let s = fightingMatch(roster)
  s.fighters[1].health = 1
  s.fighters[0].x = s.fighters[1].x - 50 * SUB
  for (let i = 0; i < 400 && s.phase !== 'over'; i += 1)
    s = step(
      s,
      [{ ...neutralInput(), lp: i % 20 === 0 }, neutralInput()],
      roster,
    )
  assert.equal(s.phase, 'over')
  assert.equal(s.winner, 0)
  assert.equal(s.round, 1)
})

check(
  'its AI saves the grab and the portals for phase 2; same seed, same fight',
  () => {
    for (const phase of [0, 1, 2]) {
      const moves = BOSS_PATTERNS[phase]!.map(([m]) => m)
      assert.equal(
        moves.includes('grasp') && moves.includes('portals'),
        phase >= 1,
        `phase ${phase}`,
      )
      const [least, most] = BOSS_COOLDOWN[phase]!
      assert.ok(least > 0 && most >= least)
    }
    const roster: Roster = [ZUZU, BOSS]
    const run = (seed: number) => {
      let s = fightingMatch(roster)
      let b = newBoss(seed)
      const seen: string[] = []
      for (let i = 0; i < 1200; i += 1) {
        const t = bossInput(b, s, 1)
        b = t.boss
        s = step(s, [neutralInput(), t.input], roster)
        for (const e of s.events) if (e.type === 'special') seen.push(e.move)
        if (s.phase !== 'fight') break
      }
      return seen
    }
    const first = run(17)
    assert.deepEqual(first, run(17))
    assert.ok(first.length >= 3, 'it attacks')
    assert.ok(
      first.every((m) => ['slam', 'sweep', 'beam'].includes(m)),
      `phase 1 only slams, sweeps and beams: ${first}`,
    )
  },
)

check('every one of its attacks can land on a fighter standing still', () => {
  const roster: Roster = [ZUZU, BOSS]
  for (const move of [
    'slam',
    'sweep',
    'beam',
    'grasp',
    'portals',
  ] as BossMove[]) {
    let s = fightingMatch(roster)
    s.fighters[0].x = s.fighters[1].x - 120 * SUB
    let landed = false
    for (let i = 0; i < 180 && !landed; i += 1) {
      const press =
        i === 0 ? bossPress(move, s.fighters[1].facing) : neutralInput()
      s = step(s, [neutralInput(), press], roster)
      landed = s.events.some(
        (e) =>
          (e.type === 'hit' && e.attacker === 1) ||
          (e.type === 'throw' && e.attacker === 1),
      )
      if (i === 2)
        assert.equal(s.fighters[1].attack?.id, move, `${move} started`)
    }
    assert.ok(landed, `${move} lands`)
  }
})

check(
  'every fighter can bring the door down with normals inside the clock',
  () => {
    for (const fighter of FIGHTERS) {
      const roster: Roster = [fighter, BOSS]
      let s = fightingMatch(roster)
      let frames = 0
      let swings = 0
      for (; frames < ROUND_FRAMES && s.phase === 'fight'; frames += 1) {
        const gap = (s.fighters[1].x - s.fighters[0].x) / SUB
        const p: SimInput = { ...neutralInput() }
        if (gap > touching(fighter)) p.right = true
        else if (s.fighters[0].attack === null && frames % 2 === 0) {
          // Heavy punches and kicks in turn; the eye (phase 3) hangs above the kicks.
          if (swings % 2 === 0) p.hp = true
          else p.hk = true
          swings += 1
        }
        // The door stands still and never strikes back in this check.
        s = step(s, [p, neutralInput()], roster)
      }
      assert.equal(s.fighters[1].health, 0, `${fighter.slug} brought it down`)
      assert.ok(frames < ROUND_FRAMES * 0.8, `${fighter.slug} in ${frames}`)
    }
  },
)

// ---------------------------------------------------------------- drawing

type Call = { op: string; args: number[] }

function stubContext() {
  const calls: Call[] = []
  const record =
    (op: string) =>
    (...args: unknown[]) => {
      calls.push({
        op,
        args: args.filter((a): a is number => typeof a === 'number'),
      })
    }
  const g = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    fillRect: record('fillRect'),
    drawImage: record('drawImage'),
    save: record('save'),
    restore: record('restore'),
    translate: record('translate'),
    scale: record('scale'),
    beginPath: record('beginPath'),
    rect: record('rect'),
    clip: record('clip'),
    arc: record('arc'),
    ellipse: record('ellipse'),
    fill: record('fill'),
    stroke: record('stroke'),
  }
  return { g: g as unknown as CanvasRenderingContext2D, calls }
}

check('its painter stays on screen through every attack and phase', () => {
  const roster: Roster = [ZUZU, BOSS]
  const image = {} as CanvasImageSource
  const full = Object.fromEntries(BOSS_LAYERS.map((l) => [l, image]))
  for (const art of [{}, full]) {
    const paint = bossPainter(BOSS, () => art)
    for (const health of [BOSS.health, BOSS.health / 3, BOSS.health / 10]) {
      for (const move of [
        'slam',
        'sweep',
        'beam',
        'grasp',
        'portals',
      ] as BossMove[]) {
        let s = fightingMatch(roster)
        s.fighters[1].health = Math.floor(health)
        s.fighters[0].x = s.fighters[1].x - 150 * SUB
        for (let i = 0; i < 120; i += 1) {
          const press =
            i === 0 ? bossPress(move, s.fighters[1].facing) : neutralInput()
          s = step(s, [neutralInput(), press], roster)
          const { g, calls } = stubContext()
          paint(g, s, 1, 0)
          for (const c of calls)
            for (const n of c.args)
              assert.ok(Number.isFinite(n), `${move} ${c.op} ${n}`)
          const translates = calls.filter((c) => c.op === 'translate')
          for (const t of translates) {
            const [x, y] = t.args as [number, number]
            assert.ok(
              x > -200 &&
                x < VIEW_WIDTH + 200 &&
                y >= 0 &&
                y <= VIEW_HEIGHT + 120,
              `${move} at ${x},${y}`,
            )
          }
          assert.ok(
            calls.some((c) => c.op === 'drawImage' || c.op === 'fillRect'),
            'the door is drawn',
          )
        }
      }
    }
  }
})

check('its layers ship in both styles at their manifest size', () => {
  const sizes = index as Record<string, { w: number; h: number }>
  assert.deepEqual([...BOSS_LAYERS].sort(), [
    'door',
    'eye',
    'tentacle-grasp',
    'tentacle-rise',
    'tentacle-sweep',
  ])
  for (const layer of BOSS_LAYERS) {
    const png = readFileSync(
      join(process.cwd(), 'public', bossLayerUrl(layer, 'pixel')),
    )
    assert.equal(png.readUInt32BE(16), sizes[layer]!.w, `${layer} width`)
    assert.equal(png.readUInt32BE(20), sizes[layer]!.h, `${layer} height`)
    const webp = readFileSync(
      join(process.cwd(), 'public', bossLayerUrl(layer, 'hd')),
    )
    assert.equal(webp.toString('ascii', 8, 12), 'WEBP', layer)
  }
})

console.log(`verifyZuzuShowdownBoss: ${passed} checks passed`)
