// Ghost Trail's headline bosses (conductor kr-arcade t-016..t-019, CAMPAIGN-BLUEPRINT.md "Boss phase
// tests verify telegraph, active and recovery states"). Each boss's state machine is driven headless
// against a stub context (a Zuzu who wanders the arena and hops, and steady hits from him) for a few
// thousand ticks, and the test holds every boss to the campaign's boss contract:
//   - every named mode is reached (and a two-phase boss reaches its second phase);
//   - every attack opens from its own tell, which lasts at least 30 ticks and sounds a warning, and
//     every bolt or summon happens inside an attack;
//   - every attack leaves a punish window (vulnerable ticks before the next tell);
//   - it is never immune for long, stays inside the arena, and is deterministic;
//   - its draw() paints every mode, a hit flash and the whole dying sequence on a stub canvas;
//   - steady damage kills it in a sane time (no damage sponges).
//
// The shared harness is at the top; each builder's bosses live in their own clearly marked block.
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import {
  BOSSES,
  makeBoss,
  type Boss,
  type BossCtx,
} from '../arcade/ghostTrail/bosses'
import type { Bolt } from '../arcade/ghostTrail/foes'
import type { BossId, FoeKind } from '../arcade/ghostTrail/world'
import { FERRYMAN_TELLS } from '../arcade/ghostTrail/bosses/ferryman'
import { MARSHAL_TELLS } from '../arcade/ghostTrail/bosses/marshal'
import { MATRIARCH_TELLS } from '../arcade/ghostTrail/bosses/matriarch'

// --- shared harness ------------------------------------------------------------------------------

const GROUND_Y = 208
const ARENA_R = 3520
const ARENA_L = ARENA_R - 260
const MIN_TELL = 30
const MAX_IMMUNE = 120
const MIN_PUNISH = 24

function stubContext(): CanvasRenderingContext2D {
  const gradient = { addColorStop: () => {} }
  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'createLinearGradient' || prop === 'createRadialGradient')
          return () => gradient
        if (prop === 'getTransform') return () => ({ a: 1 })
        return () => {}
      },
      set: () => true,
    },
  ) as CanvasRenderingContext2D
}

type Tick = {
  /** Mode before and after this tick's update. */
  before: string
  mode: string
  immune: boolean
  x: number
  y: number
  phase: number
  hp: number
}
type Event = { tick: number; before: string; after: string }

type Run = {
  boss: Boss
  ticks: Tick[]
  bolts: Array<Event & { bolt: Omit<Bolt, 't'> }>
  summons: Array<Event & { kind: FoeKind }>
  warns: number[]
  /** Tick it died at, or -1. */
  killed: number
}

type DriveOptions = {
  ticks: number
  /** Zuzu lands a hit this often (when the boss can be hurt). */
  hitEvery: number
  seed?: number
  /** The act's water line over time (a tide), or none. */
  water?: (tick: number) => number | null
  /** Called after each tick (art checks). */
  each?: (b: Boss, tick: number) => void
}

/**
 * Drive a boss the way the game does (b.t++, flash fades, update, then contact and hits), with a
 * stand-in Zuzu who walks the arena back and forth and hops now and then.
 */
function drive(id: BossId, o: DriveOptions): Run {
  const def = BOSSES[id]
  assert.ok(def, `${id}: has a definition`)
  const rng = mulberry32(o.seed ?? 7)
  let tick = 0
  let mode = ''
  const run: Run = {
    boss: undefined as unknown as Boss,
    ticks: [],
    bolts: [],
    summons: [],
    warns: [],
    killed: -1,
  }
  const zuzu = (t: number) => {
    // A slow sweep across the arena with a pause at each end, hopping every couple of seconds.
    const span = ARENA_R - ARENA_L - 40
    const s = (t % 1400) / 1400
    const tri = s < 0.5 ? s * 2 : 2 - s * 2
    const px = ARENA_L + 20 + span * Math.min(1, Math.max(0, tri * 1.2 - 0.1))
    const hop = t % 130
    const py = hop < 36 ? GROUND_Y - (5.4 * hop - 0.15 * hop * hop) : GROUND_Y
    return { px, py: Math.min(GROUND_Y, py) }
  }
  const ctx: BossCtx = {
    px: ARENA_L + 60,
    py: GROUND_Y,
    groundY: GROUND_Y,
    speed: 1.12,
    rng,
    groundAt: () => true,
    floorAt: () => GROUND_Y,
    blockedAt: () => false,
    waterY: o.water?.(0) ?? null,
    arenaL: ARENA_L,
    arenaR: ARENA_R,
    tier: 1,
    bolt: (bolt) =>
      run.bolts.push({ tick, before: mode, after: run.boss?.mode ?? '', bolt }),
    summon: (kind) =>
      run.summons.push({
        tick,
        before: mode,
        after: run.boss?.mode ?? '',
        kind,
      }),
    sound: (name) => {
      if (name === 'warn') run.warns.push(tick)
    },
  }
  const b = makeBoss(id, ARENA_R - 50, GROUND_Y, ctx)
  run.boss = b
  for (tick = 1; tick <= o.ticks; tick++) {
    const z = zuzu(tick)
    ctx.px = z.px
    ctx.py = z.py
    ctx.waterY = o.water?.(tick) ?? null
    b.t++
    if (b.flash > 0) b.flash--
    mode = b.mode
    def!.update(b, ctx)
    // Events record the mode after the update (the closure reads b.mode at call time, so patch).
    for (const e of run.bolts) if (e.tick === tick) e.after = b.mode
    for (const e of run.summons) if (e.tick === tick) e.after = b.mode
    const immune = def!.immune?.(b) ?? false
    run.ticks.push({
      before: mode,
      mode: b.mode,
      immune,
      x: b.x,
      y: b.y,
      phase: b.phase,
      hp: b.hp,
    })
    o.each?.(b, tick)
    if (!immune && tick % o.hitEvery === 0) {
      b.hp -= 1
      b.flash = 6
      if (b.hp <= 0) {
        run.killed = tick
        break
      }
    }
  }
  return run
}

/** The run's modes as segments: [mode, first tick index, length]. */
function segments(
  run: Run,
): Array<{ mode: string; start: number; len: number }> {
  const out: Array<{ mode: string; start: number; len: number }> = []
  run.ticks.forEach((t, i) => {
    const last = out[out.length - 1]
    if (last && last.mode === t.mode) last.len++
    else out.push({ mode: t.mode, start: i + 1, len: 1 })
  })
  return out
}

type BossSpec = {
  id: BossId
  /** Every mode the fight must show. */
  modes: string[]
  /** Attack mode -> the tell that must open it. */
  tells: Record<string, string>
  phases?: number
  /** Most summons a whole fight may make. */
  maxSummons: number
  water?: (tick: number) => number | null
}

function checkBoss(spec: BossSpec) {
  const { id } = spec
  const def = BOSSES[id]!
  assert.ok(def.draw, `${id}: paints its own art`)
  assert.ok(def.hp >= 20 && def.hp <= 34, `${id}: hp ${def.hp} is in 20..34`)

  // A long fight with sparse hits, so every mode and phase gets its turn.
  const g = stubContext()
  const run = drive(id, {
    ticks: 6000,
    hitEvery: 70,
    water: spec.water,
    each: (b, tick) => {
      if (tick % 3 === 0) {
        def.draw!(g, b, tick, 1)
        def.draw!(g, b, tick, -1)
      }
    },
  })
  const seen = new Set(run.ticks.map((t) => t.mode))
  for (const m of spec.modes)
    assert.ok(
      seen.has(m),
      `${id}: reaches mode '${m}' (saw ${[...seen].join(', ')})`,
    )
  if (spec.phases)
    assert.ok(
      run.ticks.some((t) => t.phase === spec.phases),
      `${id}: reaches phase ${spec.phases}`,
    )

  // Tells precede attacks: an attack mode only ever opens from its tell, which ran >= 30 ticks
  // and sounded a warning when it began.
  const segs = segments(run)
  segs.forEach((s, i) => {
    const tell = spec.tells[s.mode]
    if (!tell) return
    const prev = segs[i - 1]
    assert.ok(prev, `${id}: '${s.mode}' never opens a fight`)
    assert.equal(prev!.mode, tell, `${id}: '${s.mode}' opens from '${tell}'`)
    assert.ok(
      prev!.len >= MIN_TELL,
      `${id}: tell '${tell}' lasts ${prev!.len} >= ${MIN_TELL} ticks`,
    )
    assert.ok(
      run.warns.some((w) => w >= prev!.start - 1 && w <= prev!.start + 1),
      `${id}: tell '${tell}' at tick ${prev!.start} sounds a warning`,
    )
  })
  // Every attack actually happened.
  for (const attack of Object.keys(spec.tells))
    assert.ok(seen.has(attack), `${id}: attack '${attack}' happens`)
  // Every bolt and summon comes out inside an attack.
  const attacks = new Set(Object.keys(spec.tells))
  for (const e of [...run.bolts, ...run.summons])
    assert.ok(
      attacks.has(e.before) || attacks.has(e.after),
      `${id}: tick ${e.tick}: harm only comes from an attack (${e.before} -> ${e.after})`,
    )
  // Bolts start inside (or at the edge of) the arena and are well formed.
  for (const { bolt } of run.bolts) {
    assert.ok(
      bolt.x >= ARENA_L - 20 && bolt.x <= ARENA_R + 20,
      `${id}: ${bolt.kind} starts in the arena (${bolt.x})`,
    )
    for (const k of ['x', 'y', 'vx', 'vy', 'grav', 'hw', 'hh', 'life'] as const)
      assert.ok(Number.isFinite(bolt[k]), `${id}: ${bolt.kind}.${k} is finite`)
    assert.ok(
      bolt.life > 0 && bolt.hw > 0 && bolt.hh > 0,
      `${id}: ${bolt.kind} can land`,
    )
  }
  assert.ok(
    run.summons.length <= spec.maxSummons,
    `${id}: summons ${run.summons.length} <= ${spec.maxSummons}`,
  )

  // A punish window after every attack: vulnerable ticks before the next tell begins.
  const tellModes = new Set(Object.values(spec.tells))
  segs.forEach((s, i) => {
    if (!attacks.has(s.mode)) return
    let open = 0
    for (let j = i; j < segs.length && !tellModes.has(segs[j]!.mode); j++) {
      const seg = segs[j]!
      for (let k = seg.start; k < seg.start + seg.len; k++)
        if (!run.ticks[k - 1]!.immune) open++
    }
    const ended = segs.slice(i + 1).some((x) => tellModes.has(x.mode))
    if (ended)
      assert.ok(
        open >= MIN_PUNISH,
        `${id}: '${s.mode}' at ${s.start} leaves a punish window (${open} ticks)`,
      )
  })

  // Never immune for long, always for a reason the art shows (a named mode), and in the arena.
  let streak = 0
  let worst = 0
  for (const t of run.ticks) {
    streak = t.immune ? streak + 1 : 0
    worst = Math.max(worst, streak)
    assert.ok(
      t.x >= ARENA_L && t.x <= ARENA_R,
      `${id}: stays in the arena (x ${t.x.toFixed(1)} in ${t.mode})`,
    )
    assert.ok(
      t.y >= 40 && t.y <= GROUND_Y,
      `${id}: stays on screen (y ${t.y.toFixed(1)} in ${t.mode})`,
    )
  }
  assert.ok(
    worst <= MAX_IMMUNE,
    `${id}: immune at most ${worst} <= ${MAX_IMMUNE} ticks running`,
  )

  // Deterministic: the same seed fights the same fight.
  const again = drive(id, { ticks: 1500, hitEvery: 70, water: spec.water })
  const first = drive(id, { ticks: 1500, hitEvery: 70, water: spec.water })
  assert.deepEqual(
    again.ticks.map((t) => `${t.mode}@${t.x.toFixed(2)},${t.y.toFixed(2)}`),
    first.ticks.map((t) => `${t.mode}@${t.x.toFixed(2)},${t.y.toFixed(2)}`),
    `${id}: deterministic`,
  )

  // Steady damage (a hit every third of a second it can be hurt) kills it in a sane time.
  const fight = drive(id, { ticks: 60 * 150, hitEvery: 20, water: spec.water })
  assert.ok(fight.killed > 0, `${id}: steady hits kill it within 150 s`)
  assert.ok(
    fight.killed >= 60 * 8,
    `${id}: it is no pushover either (${(fight.killed / 60).toFixed(1)} s)`,
  )

  // The art: a hit flash and every frame of the dying sequence paint without throwing.
  const b = fight.boss
  b.flash = 6
  def.draw!(g, b, 1, 1)
  for (let d = 70; d >= 1; d--) {
    b.dying = d
    b.flash = 0
    def.draw!(g, b, 100 + d, d % 2 ? 1 : -1)
  }
  console.log(
    `  ${id}: ${seen.size} modes, killed by steady hits in ${(fight.killed / 60).toFixed(1)} s, longest immunity ${worst} ticks`,
  )
}

// --- bosses-a: the Grave Marshal, the Drowned Ferryman, the Storm-Crow Matriarch -----------------
{
  checkBoss({
    id: 'marshal',
    modes: [
      'cover',
      'step',
      'aim',
      'volley',
      'reload',
      'back',
      'light',
      'throw',
      'recover',
      'whistle',
      'deputies',
      'vault',
    ],
    tells: MARSHAL_TELLS,
    maxSummons: 2,
  })
  // The two lanes both come up, and each volley stays in its lane.
  const run = drive('marshal', { ticks: 6000, hitEvery: 70 })
  const lanes = new Set(
    run.bolts.filter((e) => e.bolt.kind === 'bullet').map((e) => e.bolt.y),
  )
  assert.deepEqual(
    [...lanes].sort((a, b) => a - b),
    [GROUND_Y - 38, GROUND_Y - 12],
    'marshal: fires down exactly two lanes, chest and jump height',
  )
  // Behind cover he shrugs hits off; in the open he takes them.
  assert.ok(BOSSES.marshal!.immune!({ mode: 'cover' } as Boss))
  assert.ok(!BOSSES.marshal!.immune!({ mode: 'reload' } as Boss))
}
{
  // The Watering Hole's tide (low under the ground, high over it), as stage 3 has it.
  const tide = (t: number) => {
    const phase = (t % 1500) / 1500
    return phase > 0.4 && phase < 0.85 ? 196 : 236
  }
  checkBoss({
    id: 'ferryman',
    modes: [
      'drift',
      'oarUp',
      'swing',
      'rest',
      'anchorTell',
      'anchor',
      'sink',
      'rise',
      'whirl',
      'chain',
      'lantern',
      'call',
      'submerge',
      'surface',
    ],
    tells: FERRYMAN_TELLS,
    phases: 2,
    maxSummons: 4,
    water: tide,
  })
  // His waves ride the water line: taller and higher when the tide is up.
  const run = drive('ferryman', { ticks: 6000, hitEvery: 70, water: tide })
  const waves = run.bolts.filter((e) => e.bolt.kind === 'wave')
  assert.ok(waves.length > 2, 'ferryman: rolls waves')
  for (const w of waves) {
    const water = tide(w.tick)
    const surf = Math.min(GROUND_Y, water)
    assert.equal(
      w.bolt.y + w.bolt.hh,
      surf,
      `ferryman: wave at tick ${w.tick} rolls on the surface (${surf})`,
    )
  }
  // Phase 2 comes at half health, not before.
  const turned = run.ticks.findIndex((t) => t.phase === 2)
  assert.ok(turned > 0)
  assert.ok(
    run.ticks[turned]!.hp <= run.boss.maxHp / 2,
    'ferryman: turns at half health',
  )
  // Phase 2 adds the chain and the drowned; phase 1 never uses them.
  for (const e of run.bolts)
    if (e.bolt.kind === 'chain')
      assert.equal(
        run.ticks[e.tick - 1]!.phase,
        2,
        'ferryman: chain is phase 2',
      )
}
{
  checkBoss({
    id: 'matriarch',
    modes: [
      'perch',
      'spread',
      'volley',
      'screech',
      'dive',
      'land',
      'rise',
      'storm',
      'strike',
      'caw',
      'call',
    ],
    tells: MATRIARCH_TELLS,
    maxSummons: 6,
  })
  const run = drive('matriarch', { ticks: 6000, hitEvery: 70 })
  // Lightning glows (armed) for a long beat before it can hurt.
  const pillars = run.bolts.filter((e) => e.before === 'storm')
  assert.ok(pillars.length >= 3, 'matriarch: calls lightning')
  for (const p of pillars)
    assert.ok(
      p.bolt.arm >= MIN_TELL,
      'matriarch: lightning glows before it strikes',
    )
  // She perches high (out of a standing throw's reach) and comes down to the ground to dive.
  assert.ok(run.ticks.some((t) => t.mode === 'perch' && t.y < GROUND_Y - 30))
  assert.ok(run.ticks.some((t) => t.mode === 'land' && t.y === GROUND_Y))
}

// --- the Bell Heretic and the Abbess are verified in verifyZuzuGhostTrailFinalBosses.test.ts -------

console.log('Ghost Trail bosses: ok')
