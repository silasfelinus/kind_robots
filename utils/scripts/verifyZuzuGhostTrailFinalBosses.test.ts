// Ghost Trail's last two headline bosses, the Bell Heretic and the Abbess (conductor kr-arcade t-018,
// t-019; the other bosses are in verifyZuzuGhostTrailBosses.test.ts; CAMPAIGN-BLUEPRINT.md "Boss phase
// tests verify telegraph, active and recovery states"). Each boss's state machine is driven headless
// against a stub context (a Zuzu who wanders the arena and hops, landing hits whenever the boss can be
// hurt), and held to the boss contract: every named mode is reached, tells precede attacks, immunity
// never runs long, it stays in the arena, its art paints every mode on a stub canvas, and steady
// damage kills it in a sane time (no damage sponges).
//
// Each builder's bosses live in their own clearly marked, block-scoped section, so sections merge
// side by side.
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import { create } from '../arcade/games/zuzuGhostTrail'
import { ACTS } from '../arcade/ghostTrail/campaign'
import {
  BOSSES,
  makeBoss,
  type Boss,
  type BossCtx,
} from '../arcade/ghostTrail/bosses'
import type { Bolt } from '../arcade/ghostTrail/foes'
import type { BossId, FoeKind } from '../arcade/ghostTrail/world'
import { ABBESS_MODES, ABBESS_TELLS } from '../arcade/ghostTrail/bosses/abbess'
import {
  HERETIC_MODES,
  HERETIC_TELLS,
  REACH_FROM,
} from '../arcade/ghostTrail/bosses/heretic'

// --- bosses-b: the Bell Heretic and the Abbess -----------------------------------------------------
{
  const GROUND = 208
  const R = 3520
  const L = R - 260
  const MIN_TELL = 30
  /** Longest run of warded ticks either boss may show (the Abbess's transformation included). */
  const MAX_WARD = 330
  const MIN_WINDOW = 24

  /** A stub canvas that throws on a non-finite coordinate, so broken art math fails loudly. */
  const paintCalls = { n: 0 }
  const stubCanvas = (): CanvasRenderingContext2D => {
    const gradient = { addColorStop: () => {} }
    return new Proxy(
      {},
      {
        get(_t, prop) {
          if (
            prop === 'createLinearGradient' ||
            prop === 'createRadialGradient'
          )
            return () => gradient
          return (...args: unknown[]) => {
            paintCalls.n++
            for (const a of args)
              if (typeof a === 'number')
                assert.ok(Number.isFinite(a), `art: ${String(prop)} got ${a}`)
          }
        },
        set: () => true,
      },
    ) as CanvasRenderingContext2D
  }

  type Tick = {
    mode: string
    immune: boolean
    x: number
    y: number
    phase: number
    hp: number
    maxHp: number
  }
  type Fight = {
    boss: Boss
    ticks: Tick[]
    bolts: Array<{ tick: number; mode: string; bolt: Omit<Bolt, 't'> }>
    summons: Array<{ tick: number; kind: FoeKind }>
    warns: number[]
    /** Ticks at which onDefeat turned a death into a transformation. */
    refused: number[]
    killed: number
  }

  /**
   * Drive a boss as the game does (b.t++, flash fades, update; a hit at 0 HP asks onDefeat first),
   * with a stand-in Zuzu who walks the arena back and forth, pausing and hopping now and then.
   */
  const fight = (
    id: BossId,
    o: {
      ticks: number
      hitEvery: number
      seed?: number
      each?: (b: Boss, tick: number) => void
    },
  ): Fight => {
    const def = BOSSES[id]!
    let tick = 0
    let b: Boss | null = null
    const run: Fight = {
      boss: undefined as unknown as Boss,
      ticks: [],
      bolts: [],
      summons: [],
      warns: [],
      refused: [],
      killed: -1,
    }
    const ctx: BossCtx = {
      px: L + 50,
      py: GROUND,
      groundY: GROUND,
      speed: 1.24,
      rng: mulberry32(o.seed ?? 11),
      groundAt: () => true,
      floorAt: () => GROUND,
      blockedAt: () => false,
      waterY: null,
      arenaL: L,
      arenaR: R,
      tier: 1,
      bolt: (bolt) => run.bolts.push({ tick, mode: b?.mode ?? '', bolt }),
      summon: (kind) => run.summons.push({ tick, kind }),
      sound: (name) => {
        if (name === 'warn') run.warns.push(tick)
      },
    }
    const walk = (t: number) => {
      const span = R - L - 30
      const s = (t % 1700) / 1700
      const tri = s < 0.5 ? s * 2 : 2 - s * 2
      const px = L + 15 + span * Math.min(1, Math.max(0, tri * 1.25 - 0.12))
      const hop = t % 150
      const py = hop < 36 ? GROUND - (5.4 * hop - 0.15 * hop * hop) : GROUND
      return { px, py: Math.min(GROUND, py) }
    }
    b = makeBoss(id, R - 50, GROUND, ctx)
    run.boss = b
    let cool = 0
    for (tick = 1; tick <= o.ticks; tick++) {
      const z = walk(tick)
      ctx.px = z.px
      ctx.py = z.py
      b.t++
      if (b.flash > 0) b.flash--
      def.update(b, ctx)
      const immune = def.immune?.(b) ?? false
      run.ticks.push({
        mode: b.mode,
        immune,
        x: b.x,
        y: b.y,
        phase: b.phase,
        hp: b.hp,
        maxHp: b.maxHp,
      })
      o.each?.(b, tick)
      if (--cool <= 0 && !immune) {
        cool = o.hitEvery
        b.hp -= 1
        b.flash = 6
        if (b.hp <= 0) {
          if (def.onDefeat?.(b, ctx)) {
            run.refused.push(tick)
            continue
          }
          run.killed = tick
          break
        }
      }
    }
    return run
  }

  const segments = (run: Fight) => {
    const out: Array<{ mode: string; start: number; len: number }> = []
    run.ticks.forEach((t, i) => {
      const last = out[out.length - 1]
      if (last && last.mode === t.mode) last.len++
      else out.push({ mode: t.mode, start: i + 1, len: 1 })
    })
    return out
  }

  /** Where a bolt can first touch Zuzu (a painted weapon's hitbox steps in from off-screen). */
  const landsAt = (bolt: Omit<Bolt, 't'>) =>
    Math.abs(bolt.vx) === REACH_FROM || Math.abs(bolt.vy) === REACH_FROM
      ? { x: bolt.x + bolt.vx, y: bolt.y + bolt.vy }
      : { x: bolt.x, y: bolt.y }

  const check = (
    id: BossId,
    spec: {
      modes: readonly string[]
      tells: Record<string, string>
      /** Moves that relocate rather than attack (no punish window owed after them). */
      moves?: string[]
      maxSummons: number
      /** Seconds a hit every 30 open ticks takes to kill it. */
      pace: [number, number]
    },
  ) => {
    const def = BOSSES[id]!
    assert.ok(def.draw, `${id}: paints its own art`)
    const g = stubCanvas()
    // Several long fights with sparse hits, so every move and phase gets its turn; paint as we go.
    const runs = [3, 11, 29].map((seed) =>
      fight(id, {
        ticks: 60 * 200,
        hitEvery: 75,
        seed,
        each: (b, tick) => {
          if (tick % 2 === 0) {
            def.draw!(g, b, tick, 1)
            def.draw!(g, b, tick, -1)
          }
        },
      }),
    )
    const seen = new Set(runs.flatMap((r) => r.ticks.map((t) => t.mode)))
    let longestWard = 0
    for (const m of spec.modes)
      assert.ok(
        seen.has(m),
        `${id}: reaches '${m}' (saw ${[...seen].join(', ')})`,
      )
    for (const m of seen)
      assert.ok(spec.modes.includes(m), `${id}: '${m}' is a named mode`)

    for (const run of runs) {
      const segs = segments(run)
      // Tells precede attacks: an attack only opens from its own tell, which ran >= 30 ticks and
      // sounded a warning as it began.
      segs.forEach((s, i) => {
        const tell = spec.tells[s.mode]
        if (!tell) return
        const prev = segs[i - 1]
        assert.ok(prev, `${id}: '${s.mode}' never opens a fight`)
        assert.equal(
          prev!.mode,
          tell,
          `${id}: '${s.mode}' opens from '${tell}'`,
        )
        assert.ok(
          prev!.len >= MIN_TELL,
          `${id}: tell '${tell}' lasts ${prev!.len} >= ${MIN_TELL} ticks`,
        )
        assert.ok(
          run.warns.some((w) => w >= prev!.start - 1 && w <= prev!.start + 1),
          `${id}: tell '${tell}' at ${prev!.start} sounds a warning`,
        )
      })
      for (const attack of Object.keys(spec.tells))
        assert.ok(
          runs.some((r) => r.ticks.some((t) => t.mode === attack)),
          `${id}: '${attack}' happens`,
        )
      // A punish window after every attack: unwarded ticks before the next tell.
      const tells = new Set(Object.values(spec.tells))
      segs.forEach((s, i) => {
        if (!spec.tells[s.mode] || spec.moves?.includes(s.mode)) return
        let open = 0
        let ended = false
        for (let j = i; j < segs.length; j++) {
          // A window cut short by the end of a bar (death or transformation) is not owed.
          if (segs[j]!.mode === 'transform') break
          if (j > i && tells.has(segs[j]!.mode)) {
            ended = true
            break
          }
          const seg = segs[j]!
          for (let k = seg.start; k < seg.start + seg.len; k++)
            if (!run.ticks[k - 1]!.immune) open++
        }
        if (ended)
          assert.ok(
            open >= MIN_WINDOW,
            `${id}: '${s.mode}' at ${s.start} leaves a window (${open} ticks)`,
          )
      })
      // Warding is never permanent, and the boss keeps to the arena and the screen.
      let streak = 0
      let worst = 0
      for (const t of run.ticks) {
        streak = t.immune ? streak + 1 : 0
        worst = Math.max(worst, streak)
        assert.ok(
          t.x >= L + 10 && t.x <= R - 10,
          `${id}: in the arena (${t.x})`,
        )
        assert.ok(t.y >= 40 && t.y <= GROUND, `${id}: on screen (${t.y})`)
      }
      assert.ok(
        worst <= MAX_WARD,
        `${id}: warded ${worst} <= ${MAX_WARD} ticks`,
      )
      longestWard = Math.max(longestWard, worst)
      // Hazards start in the arena, well formed; pilot cues can never touch Zuzu.
      for (const { bolt, tick } of run.bolts) {
        for (const k of [
          'x',
          'y',
          'vx',
          'vy',
          'grav',
          'hw',
          'hh',
          'life',
          'arm',
        ] as const)
          assert.ok(Number.isFinite(bolt[k]), `${id}: ${bolt.kind}.${k} finite`)
        const at = landsAt(bolt)
        assert.ok(
          at.x >= L - 4 && at.x <= R + 4,
          `${id}: ${bolt.kind} at tick ${tick} lands in the arena (${at.x})`,
        )
        if (bolt.hh === 0)
          assert.ok(bolt.y + bolt.vy < 0, `${id}: a cue is harmless`)
        else
          assert.ok(
            at.y > 20 && at.y < GROUND + 4,
            `${id}: ${bolt.kind} on screen`,
          )
      }
      assert.ok(
        run.summons.length <= spec.maxSummons,
        `${id}: ${run.summons.length} summons <= ${spec.maxSummons}`,
      )
    }

    // Deterministic: the same seed fights the same fight.
    const a = fight(id, { ticks: 2400, hitEvery: 40, seed: 5 })
    const b2 = fight(id, { ticks: 2400, hitEvery: 40, seed: 5 })
    assert.deepEqual(
      a.ticks.map((t) => `${t.mode}${t.x.toFixed(2)}${t.y.toFixed(2)}`),
      b2.ticks.map((t) => `${t.mode}${t.x.toFixed(2)}${t.y.toFixed(2)}`),
      `${id}: deterministic`,
    )

    // Steady damage (a hit every half second it is open) kills it in a sane time.
    const times = [1, 2, 3].map((seed) => {
      const f = fight(id, { ticks: 60 * 300, hitEvery: 30, seed })
      assert.ok(f.killed > 0, `${id}: steady hits kill it`)
      return f.killed / 60
    })
    for (const s of times)
      assert.ok(
        s >= spec.pace[0] && s <= spec.pace[1],
        `${id}: steady hits kill it in ${s.toFixed(1)} s (${spec.pace.join('..')})`,
      )

    // The hit flash and every frame of the dying sequence paint.
    const last = runs[0]!.boss
    last.flash = 6
    def.draw!(g, last, 1, 1)
    last.flash = 0
    for (let d = 70; d >= 1; d--) {
      last.dying = d
      def.draw!(g, last, 100 + d, d % 2 ? 1 : -1)
    }
    last.dying = 0
    console.log(
      `  ${id}: ${seen.size} modes, steady hits kill it in ${times.map((s) => s.toFixed(0)).join('/')} s, longest ward ${longestWard} ticks`,
    )
    return runs
  }

  // The Bell Heretic.
  const heretic = check('heretic', {
    modes: HERETIC_MODES,
    tells: HERETIC_TELLS,
    moves: ['leap'],
    maxSummons: 0,
    pace: [45, 150],
  })
  {
    const def = BOSSES.heretic!
    assert.ok(def.hp >= 30 && def.hp <= 36, 'heretic: hp about 30..36')
    for (const run of heretic) {
      // His robe catches at half health, once, and the pattern quickens.
      const turned = run.ticks.findIndex((t) => t.phase === 2)
      if (turned < 0) continue
      assert.equal(
        run.ticks[turned]!.mode,
        'ignite',
        'heretic: the robe catches',
      )
      assert.ok(
        run.ticks[turned]!.hp <= run.boss.maxHp / 2,
        'heretic: at half health',
      )
      const len = (mode: string, phase: number) => {
        const segs = segments(run).filter(
          (s) => s.mode === mode && run.ticks[s.start - 1]!.phase === phase,
        )
        return segs.length ? Math.min(...segs.map((s) => s.len)) : NaN
      }
      for (const tell of ['swingTell', 'slamTell'])
        if (len(tell, 1) && len(tell, 2))
          assert.ok(len(tell, 2) < len(tell, 1), `heretic: ${tell} quickens`)
      // Ritual circles glow (armed) long before they burn; stones fall from above.
      for (const e of run.bolts) {
        if (e.bolt.kind === 'pillar')
          assert.ok(e.bolt.arm >= MIN_TELL, 'heretic: circles glow first')
        if (e.bolt.kind === 'clod')
          assert.ok(e.bolt.y < 60, 'heretic: stones drop')
      }
    }
    // Waves roll both ways from the slam.
    const waves = heretic
      .flatMap((r) => r.bolts)
      .filter((e) => e.bolt.kind === 'wave')
    assert.ok(
      waves.some((w) => w.bolt.vx < 0) && waves.some((w) => w.bolt.vx > 0),
    )
    assert.ok(
      def.immune!({ mode: 'stalk' } as Boss),
      'heretic: warded while he stalks',
    )
    assert.ok(
      !def.immune!({ mode: 'stuck' } as Boss),
      'heretic: open when the bell sticks',
    )
  }

  // The Abbess: two phases, each with its own bar.
  const abbess = check('abbess', {
    modes: ABBESS_MODES,
    tells: ABBESS_TELLS,
    moves: ['appear'],
    maxSummons: 2,
    pace: [80, 240],
  })
  {
    const def = BOSSES.abbess!
    assert.ok(def.hp >= 24 && def.hp <= 30, 'abbess: hp about 26 a phase')
    for (const run of abbess) {
      assert.equal(run.refused.length, 1, 'abbess: refuses death exactly once')
      const at = run.refused[0]!
      const before = run.ticks[at - 1]!
      assert.equal(before.phase, 1, 'abbess: the first bar ends in phase one')
      // The transformation: under three seconds, warded, the bar refilling to a new maximum.
      const trans = run.ticks.slice(at).findIndex((t) => t.mode !== 'transform')
      assert.ok(
        trans > 0 && trans <= 180,
        `abbess: transforms in ${trans} <= 180 ticks`,
      )
      const during = run.ticks.slice(at, at + trans)
      assert.ok(
        during.every((t) => t.immune && t.phase === 2),
        'abbess: warded, phase two',
      )
      for (let i = 1; i < during.length; i++)
        assert.ok(
          during[i]!.hp >= during[i - 1]!.hp,
          'abbess: the bar only refills',
        )
      assert.ok(
        during[0]!.hp < during[during.length - 1]!.hp,
        'abbess: visibly',
      )
      const after = run.ticks[at + trans]!
      assert.equal(after.hp, after.maxHp, 'abbess: a full second bar')
      assert.equal(after.mode, 'hover', 'abbess: rises as the spectre')
      // Phase one's moves never come back, and phase two's never came before.
      const p1 = new Set([
        'glide',
        'vanish',
        'appear',
        'orbsTell',
        'orbs',
        'summonTell',
        'summon',
        'fireTell',
        'fire',
        'pray',
      ])
      run.ticks.forEach((t, i) => {
        if (i < at - 1)
          assert.ok(p1.has(t.mode), `abbess: '${t.mode}' in phase one`)
        else if (i > at + trans)
          assert.ok(!p1.has(t.mode), `abbess: '${t.mode}' in phase two`)
      })
    }
    // Her fire line glows (armed) through the whole tell before it burns.
    const fire = abbess
      .flatMap((r) => r.bolts)
      .filter((e) => e.bolt.kind === 'pillar')
    assert.ok(fire.length > 0, 'abbess: raises a fire line')
    for (const e of fire)
      assert.ok(e.bolt.arm >= MIN_TELL, 'abbess: the line glows first')
    // Phase two is faster: each attack's tell is shorter than any phase one tell.
    const tellLen = (run: Fight, modes: string[]) =>
      segments(run)
        .filter((s) => modes.includes(s.mode))
        .map((s) => s.len)
    const p1Tells = abbess.flatMap((r) =>
      tellLen(r, ['orbsTell', 'summonTell', 'fireTell']),
    )
    const p2Tells = abbess.flatMap((r) =>
      tellLen(r, ['sweepTell', 'tollTell', 'diveTell']),
    )
    assert.ok(
      Math.max(...p2Tells) <= Math.min(...p1Tells),
      'abbess: phase two quickens',
    )
    // Translucent while out of reach, solid when she can be hurt.
    assert.ok(def.immune!({ mode: 'glide' } as Boss))
    assert.ok(!def.immune!({ mode: 'pray' } as Boss))
    assert.ok(!def.immune!({ mode: 'stagger' } as Boss))
  }

  // --- in the real game: the onDefeat hook, and the painted weapons' hitboxes -----------------------
  type Game = {
    boss: Boss | null
    x: number
    y: number
    vy: number
    poncho: boolean
    invuln: number
    lives: number
    dead: number
    card: unknown
    clear: number
    camX: number
    act: { length: number }
    startAct: (i: number) => void
    hurtBoss: (damage: number, x: number, y: number) => void
    update: (input: ReturnType<typeof emptyInput>) => void
  }
  const arena = (boss: BossId) => {
    const index = ACTS.length - 1
    const act = ACTS[index]!
    const was = act.boss
    act.boss = boss
    const game = create({
      rng: mulberry32(4),
      sound: { play: () => {} },
      demo: false,
      hiScore: 0,
    }) as unknown as Game
    game.startAct(index)
    game.card = null
    game.clear = 0
    game.x = game.act.length - 180
    game.camX = game.act.length - 260
    for (let i = 0; i < 4 && !game.boss; i++) {
      game.invuln = 9999
      game.update(emptyInput())
    }
    act.boss = was
    assert.ok(game.boss, `${boss}: appears in the arena`)
    return game
  }
  {
    // The Abbess refuses her first death and transforms; her second death is real.
    const game = arena('abbess')
    const b = game.boss!
    b.mode = 'pray'
    b.hp = 1
    game.hurtBoss(1, b.x, b.y - 20)
    assert.equal(b.dying, 0, 'abbess: the first bar does not kill her')
    assert.equal(b.phase, 2, 'abbess: she turns')
    assert.equal(b.mode, 'transform')
    for (let i = 0; i < 200 && b.mode === 'transform'; i++) {
      game.invuln = 9999
      game.lives = 9
      game.update(emptyInput())
    }
    assert.equal(game.boss, b, 'abbess: still fighting')
    assert.equal(b.hp, b.maxHp, 'abbess: her bar is full again')
    b.mode = 'stagger'
    b.hp = 1
    game.hurtBoss(1, b.x, b.y - 20)
    assert.ok(b.dying > 0, 'abbess: the second bar ends her')
  }
  {
    // A boss without the hook dies at zero, as before.
    const game = arena('heretic')
    const b = game.boss!
    b.mode = 'spent'
    b.hp = 1
    game.hurtBoss(1, b.x, b.y - 20)
    assert.ok(b.dying > 0, 'heretic: dies at zero')
  }
  {
    // The swinging bell is painted, not a bolt sprite, yet the game's collision still lands it.
    const game = arena('heretic')
    const b = game.boss!
    b.mode = 'swingTell'
    b.timer = 1
    b.face = -1
    game.x = b.x - 30
    game.y = GROUND
    game.vy = 0
    game.invuln = 0
    game.poncho = true
    let hit = false
    for (let i = 0; i < 60 && !hit; i++) {
      game.x = b.x - 30
      game.update(emptyInput())
      hit = !game.poncho
    }
    assert.ok(hit, 'heretic: the swinging bell knocks Zuzu down')
  }
  console.log('Ghost Trail bosses (bosses-b): ok')
}
