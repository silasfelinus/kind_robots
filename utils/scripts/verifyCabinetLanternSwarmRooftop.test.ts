// /utils/scripts/verifyCabinetLanternSwarmRooftop.test.ts
//
// Lantern Swarm depth pass, slice 1 (conductor kr-arcade/t-093): the formation engine and the
// Rooftop Festival. The zone's six stages are data (scripted entrances, layouts, fill orders,
// dive shapes and tuning that ramps each lap); the four dive shapes plan sound paths; escort
// lunas peel off with a diving queen and pay a climbing bonus; the last three moths dive
// non-stop, faster each pass; a captive lantern flies with its queen, drops embers, and is lost
// for good if beamed itself; the Paper Cranes Glow Stage flies through; the Grand Lantern Moth
// runs its three phases; a results card follows the Watch; and a pilot probe shows runs still
// end while the attract demo scores nothing.
//
//   npx tsx utils/scripts/verifyCabinetLanternSwarmRooftop.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { ARCADE_GAMES } from '../arcade/games'
import lanternSwarm from '../arcade/games/lanternSwarm'
import { DIVES, planDive } from '../arcade/lanternSwarm/dives'
import {
  GUARDIAN,
  hitGuardian,
  newGuardian,
  panelPos,
  updateGuardian,
  type Guardian,
  type GuardianWorld,
} from '../arcade/lanternSwarm/guardian'
import {
  escortBonus,
  hitRatio,
  newTally,
  ratioText,
  resultRows,
} from '../arcade/lanternSwarm/results'
import {
  GLOW_CHOREOGRAPHIES,
  H,
  LAP_RAMP,
  LAYOUTS,
  PATHS,
  ROOFTOP_FESTIVAL,
  SLOT_OF,
  W,
  ZONES,
  mirrorPath,
  slotsFor,
  stageAt,
  tuneFor,
  type FormationStage,
  type Kind,
  type PathName,
  type SlotKind,
} from '../arcade/lanternSwarm/zones'
import { emptyInput, type InputFrame } from '../arcade/types'

type Moth = {
  kind: Kind
  mode: string
  hp: number
  x: number
  y: number
  col: number
  row: number
  heading: number
  speed: number
  gone: boolean
  holding: boolean
  leader: Moth | null
  passes: number
  spawnAt: number
  path: Array<{ x: number; y: number }>
}
type Game = {
  score: number
  level: number
  lives: number
  over: boolean
  alive: boolean
  twin: boolean
  x: number
  safe: number
  moths: Moth[]
  beams: Array<ReturnType<typeof beam>>
  dust: Array<{ x: number; y: number; ember: boolean }>
  drifters: unknown[]
  frenzy: boolean
  glow: boolean
  clear: number
  stageIndex: number
  guardian: Guardian | null
  results: { ticks: number } | null
  tune: { capture: number; dust: number; diveSpeed: number }
  tally: ReturnType<typeof newTally>
  night: { shots: number; hits: number }
  banner: { text: string; sub?: string; sub2?: string } | null
  update(input: InputFrame): void
  render(g: CanvasRenderingContext2D): void
  startStage(index: number): void
  launchDive(m?: Moth): void
  hitMoth(m: Moth, crash?: boolean): void
  updateShots(): void
  captivePos(m: Moth): { x: number; y: number }
  demoInput(): InputFrame
}

/** A lantern beam at (x, y), on its way up. */
const beam = (x: number, y: number) => ({
  x,
  y,
  vx: 0,
  vy: -5.5,
  owner: 'lantern' as const,
  pierced: [] as Moth[],
})
const quiet = { play: () => {} }
const fakeCtx = () =>
  new Proxy(
    {},
    {
      get: (_t, k) =>
        k === 'createRadialGradient' || k === 'createLinearGradient'
          ? () => ({ addColorStop: () => {} })
          : k === 'measureText'
            ? () => ({ width: 8 })
            : () => {},
      set: () => true,
    },
  ) as unknown as CanvasRenderingContext2D

function play(seed = 3, demo = false): Game {
  return lanternSwarm.create({
    rng: mulberry32(seed),
    sound: quiet,
    demo,
    hiScore: 0,
  }) as unknown as Game
}

function press(button: 'a' | 'left' | 'right'): InputFrame {
  const frame = emptyInput()
  frame.held[button] = true
  frame.pressed[button] = true
  return frame
}

/** Every moth settled in its formation slot, as if the entrance had finished. */
function settle(game: Game) {
  for (const m of game.moths) m.mode = 'form'
  game.update(emptyInput())
}

const formations = ROOFTOP_FESTIVAL.stages.filter(
  (s): s is FormationStage => s.kind === 'formation',
)

// --- the zone as data ---------------------------------------------------------------------------
{
  assert.equal(ZONES[0], ROOFTOP_FESTIVAL, 'the night opens on the Rooftop')
  assert.equal(ROOFTOP_FESTIVAL.watch, 'DUSK')
  assert.deepEqual(
    ROOFTOP_FESTIVAL.stages.map((s) => s.kind),
    ['formation', 'formation', 'formation', 'glow', 'formation', 'guardian'],
    'three formations, a Glow Stage, a remix and a Guardian',
  )
  const kinds: SlotKind[] = ['queen', 'escort', 'luna', 'moth']
  for (const stage of formations) {
    const count: Record<SlotKind, number> = {
      queen: 0,
      escort: 0,
      luna: 0,
      moth: 0,
    }
    for (const g of stage.entrance) {
      assert.ok(g.path in PATHS, `${stage.name}: path ${g.path}`)
      for (const k of g.kinds) count[SLOT_OF[k]!]++
    }
    for (const k of kinds)
      assert.equal(
        count[k],
        slotsFor(stage.layout, k, stage.fill).length,
        `${stage.name}: one ${k} per ${stage.layout} slot`,
      )
    assert.equal(
      kinds.reduce((sum, k) => sum + count[k], 0),
      40,
      `${stage.name}: forty in all`,
    )
    assert.equal(count.escort, 4, `${stage.name}: four escort lunas`)
    assert.ok(stage.dives.length > 0, `${stage.name}: dives`)
  }
  // No two slots of a layout overlap.
  for (const [name, layout] of Object.entries(LAYOUTS)) {
    const seen = new Set<string>()
    for (const rows of Object.values(layout))
      for (const r of rows)
        for (const c of r.cols) {
          const key = `${r.row}:${c}`
          assert.ok(!seen.has(key), `${name}: slot ${key} used once`)
          seen.add(key)
        }
  }
  // Every stage flies its own entrance.
  const signature = (s: FormationStage) =>
    s.entrance.map((g) => `${g.path}${g.pair ? '+' : ''}@${g.at}`).join(' ')
  assert.equal(
    new Set(formations.map(signature)).size,
    formations.length,
    'no two stages share an entrance',
  )
  assert.equal(
    new Set(formations.map((s) => `${s.layout}/${s.fill}`)).size >= 3,
    true,
    'layouts and fill orders vary',
  )
  // The remix uses every dive shape; dive variety grows through the zone.
  assert.deepEqual([...formations[formations.length - 1]!.dives].sort(), [
    'loop',
    'sweep',
    'swoop',
    'zig',
  ])
  assert.deepEqual(formations[0]!.dives, ['sweep'])
  // Fill orders.
  const centre = slotsFor('classic', 'moth', 'centre')
  const edges = slotsFor('classic', 'moth', 'edges')
  assert.ok(Math.abs(centre[0]!.col - 4.5) < Math.abs(edges[0]!.col - 4.5))
  assert.equal(mirrorPath('loopL'), 'loopR')
  assert.equal(mirrorPath('hookR'), 'hookL')
  for (const name of Object.keys(PATHS) as PathName[]) {
    const a = PATHS[name]
    const b = PATHS[mirrorPath(name)]
    a.forEach((p, i) => assert.equal(p.x, W - b[i]!.x, `${name} mirrors`))
  }
}

// --- tuning ramps by stage and by lap ----------------------------------------------------------
{
  for (let i = 1; i < formations.length; i++) {
    const a = formations[i - 1]!.tune
    const b = formations[i]!.tune
    assert.ok(
      b.diveGap < a.diveGap,
      `${formations[i]!.name}: dives come sooner`,
    )
    assert.ok(b.diveSpeed > a.diveSpeed, `${formations[i]!.name}: faster`)
    assert.ok(b.dust > a.dust, `${formations[i]!.name}: dustier`)
  }
  const base = formations[0]!.tune
  const lap2 = tuneFor(base, 2)
  assert.ok(lap2.diveGap < base.diveGap && lap2.divers > base.divers)
  assert.ok(lap2.diveSpeed > base.diveSpeed && lap2.dust > base.dust)
  const late = tuneFor(formations[3]!.tune, 40)
  assert.equal(late.diveGap, LAP_RAMP.diveGap.limit)
  assert.equal(late.divers, LAP_RAMP.divers.limit)
  assert.equal(late.diveSpeed, LAP_RAMP.diveSpeed.limit)
  assert.equal(late.dust, LAP_RAMP.dust.limit)
  assert.deepEqual(tuneFor(base, 1), base)
  const place = stageAt(6)
  assert.equal(place.lap, 1)
  assert.equal(place.watch, 1, 'after the Guardian the next Watch begins')
  assert.equal(place.stageIndex, 0)
  assert.equal(stageAt(12).lap, 2, 'after the last Watch, round again')
  assert.equal(stageAt(5).stage.kind, 'guardian')
  assert.equal(stageAt(3).stage.kind, 'glow')
}

// --- the dive-shape library ---------------------------------------------------------------------
{
  const ctx = (seed: number) => ({
    x: 60,
    y: 70,
    side: -1 as const,
    lanternX: 150,
    shipY: H - 30,
    rng: mulberry32(seed),
  })
  for (const [shape, plan] of Object.entries(DIVES)) {
    const p = plan(ctx(1))
    assert.ok(p.path.length >= 4, `${shape}: a real path`)
    for (const i of p.track) assert.ok(p.path[i], `${shape}: track ${i}`)
    assert.ok(
      p.path.some((q) => Math.abs(q.x - 150) < 40 && q.y > H - 70),
      `${shape}: comes down at the lantern`,
    )
  }
  assert.equal(DIVES.swoop(ctx(1)).returns, true)
  assert.ok(
    DIVES.swoop(ctx(1)).path.some((q) => q.y > H),
    'the swoop dips under the bottom edge',
  )
  const swoop = DIVES.swoop(ctx(1)).path
  assert.ok(swoop[swoop.length - 1]!.y < H / 2 + 20, 'and comes back up')
  for (const s of ['sweep', 'loop', 'zig'] as const)
    assert.equal(DIVES[s](ctx(1)).returns, false, `${s} wraps from the top`)
  const loop = DIVES.loop(ctx(1)).path
  const ys = loop.map((q) => q.y)
  assert.ok(
    ys.some((y, i) => i > 0 && y < ys[i - 1]!),
    'the loop climbs back up mid-dive',
  )
  const zig = DIVES.zig(ctx(1)).path
  assert.ok(
    Math.sign(zig[2]!.x - zig[1]!.x) !== Math.sign(zig[3]!.x - zig[2]!.x),
    'the zig changes direction',
  )
  assert.deepEqual(
    planDive(['sweep', 'loop', 'zig', 'swoop'], ctx(7)),
    planDive(['sweep', 'loop', 'zig', 'swoop'], ctx(7)),
    'dives are seeded',
  )
}

// --- the stages in play: entrances differ ---------------------------------------------------------
{
  const game = play()
  assert.equal(game.moths.length, 40)
  assert.equal(game.moths.filter((m) => m.kind === 'escort').length, 4)
  assert.equal(game.moths.filter((m) => m.kind === 'queen').length, 4)
  const first = game.moths.map((m) => `${m.x},${m.y},${m.spawnAt}`).join(';')
  game.startStage(1)
  const second = game.moths.map((m) => `${m.x},${m.y},${m.spawnAt}`).join(';')
  assert.notEqual(first, second, 'stage 2 no longer flies stage 1’s entrance')
  assert.equal(game.level, 2)
  assert.equal(game.banner?.sub, 'ROOFTOP PARADE')
  // Paired groups fly mirror lines at the same moment.
  const pair = game.moths.filter((m) => m.spawnAt === 30)
  assert.ok(pair.length === 2 && pair[0]!.x === W - pair[1]!.x)
  // An entrance with fire drops dust on the way in.
  game.startStage(2)
  game.tune.dust = 1
  let dusty = false
  for (let t = 0; t < 400 && !dusty; t++) {
    game.update(emptyInput())
    dusty = game.dust.length > 0
  }
  assert.ok(dusty, 'entry fire on the Ribbon Dance')
}

// --- escort lunas and the escort bonus ----------------------------------------------------------
{
  const game = play(5)
  settle(game)
  game.tune.capture = 0
  const queens = game.moths.filter((m) => m.kind === 'queen')
  const bonuses: number[] = []
  for (const q of queens.slice(0, 3)) {
    game.launchDive(q)
    assert.equal(q.mode, 'dive')
    const escorts = game.moths.filter((m) => m.leader === q)
    if (escorts.length < 2) continue
    assert.ok(
      escorts.every((e) => e.mode === 'escort'),
      'escorts peel off',
    )
    for (let t = 0; t < 20; t++) game.update(emptyInput())
    for (const e of escorts)
      assert.ok(
        Math.abs(e.x - q.x) < 20 && Math.abs(e.y - q.y) < 12,
        'escorts fly beside their queen',
      )
    const before = game.score
    for (const e of escorts) game.hitMoth(e)
    game.hitMoth(q)
    game.hitMoth(q)
    assert.ok(q.gone)
    bonuses.push(game.score - before - 160 * 2 - 400)
  }
  assert.ok(bonuses.length >= 2, 'queens had escorts to fly with')
  assert.deepEqual(bonuses, [800, 1600, 3200].slice(0, bonuses.length))
  assert.equal(game.tally.escortBonuses, bonuses.length)
  assert.deepEqual(
    [0, 1, 2, 3].map(escortBonus),
    [800, 1600, 3200, 3200],
    'the escort bonus climbs and holds',
  )
  // Beam the queen first and there is no bonus; her escorts fly on alone.
  const solo = play(6)
  settle(solo)
  solo.tune.capture = 0
  const q = solo.moths.find((m) => m.kind === 'queen')!
  solo.launchDive(q)
  const escorts = solo.moths.filter((m) => m.leader === q)
  solo.hitMoth(q)
  solo.hitMoth(q)
  assert.equal(solo.tally.escortBonuses, 0)
  solo.update(emptyInput())
  for (const e of escorts)
    assert.equal(e.mode, 'dive', 'orphaned escorts dive on')
}

// --- the last-moth frenzy -----------------------------------------------------------------------
{
  const game = play(7)
  settle(game)
  const left = game.moths.filter((m) => m.kind === 'moth').slice(0, 3)
  for (const m of game.moths) if (!left.includes(m)) m.gone = true
  game.update(emptyInput())
  assert.ok(game.frenzy, 'three left: frenzy')
  assert.ok(
    left.every((m) => m.mode === 'dive'),
    'the last moths all dive at once',
  )
  const firstSpeed = left[0]!.speed
  let passes = 0
  game.safe = 1e6
  for (let t = 0; t < 4000 && passes < 3; t++) {
    game.update(emptyInput())
    passes = left[0]!.passes
  }
  assert.ok(passes >= 3, 'they keep diving without a rest')
  assert.ok(left[0]!.speed > firstSpeed, 'faster each pass')
}

// --- the turncoat captive lantern ---------------------------------------------------------------
{
  const game = play(9)
  settle(game)
  game.tune.capture = 0
  const q = game.moths.find((m) => m.kind === 'queen')!
  q.holding = true
  game.launchDive(q)
  game.tune.dust = 1
  let embers = false
  game.safe = 1e6
  for (let t = 0; t < 80 && !embers; t++) {
    game.update(emptyInput())
    embers = game.dust.some((d) => d.ember)
  }
  assert.ok(embers, 'the captive drops embers on you')
  // Beam the captive itself: lost for good, no rescue.
  const c = game.captivePos(q)
  assert.ok(Math.hypot(c.x - q.x, c.y - q.y) > 8, 'it trails off her shoulder')
  game.beams = [beam(c.x, c.y + 2)]
  const lives = game.lives
  game.updateShots()
  assert.equal(q.holding, false)
  assert.ok(!q.gone, 'the queen flies on')
  assert.equal(game.drifters.length, 0, 'nothing to rescue')
  assert.equal(game.lives, lives)
  assert.equal(game.banner?.text, 'LANTERN LOST')
  // Beam the queen instead and the lantern comes home.
  const q2 = game.moths.find((m) => m.kind === 'queen' && m !== q && !m.gone)!
  q2.holding = true
  q2.hp = 1
  game.hitMoth(q2)
  assert.equal(game.drifters.length, 1, 'rescued')
}

// --- the Paper Cranes Glow Stage ----------------------------------------------------------------
{
  const groups = GLOW_CHOREOGRAPHIES['paper-cranes']
  assert.equal(
    groups.reduce((sum, g) => sum + g.count, 0),
    40,
  )
  for (const g of groups) {
    const crossings = g.path.filter(
      (p, i) =>
        i > 0 && Math.sign(p.x - W / 2) !== Math.sign(g.path[i - 1]!.x - W / 2),
    ).length
    assert.ok(crossings >= 2, 'a figure-of-eight crosses the middle twice')
  }
  const game = play(11)
  game.startStage(3)
  assert.ok(game.glow)
  assert.equal(game.moths.length, 40)
  let t = 0
  for (; t < 6000 && game.clear === 0; t++) game.update(emptyInput())
  assert.ok(game.clear > 0, 'the cranes fly through and away')
  assert.equal(game.banner?.text, 'GLOW STAGE OVER')
  assert.equal(game.tally.glows, 1)
  assert.equal(game.dust.length, 0, 'no dust in a Glow Stage')
}

// --- the Grand Lantern Moth ---------------------------------------------------------------------
{
  const gd = newGuardian(1)
  const caught: number[] = []
  const world = (lanternX: number): GuardianWorld => ({
    rng: mulberry32(2),
    lanternX,
    shipY: H - 30,
    open: true,
    diveSpeed: 2,
    dust: () => {},
    caught: (x) => {
      caught.push(x)
      return true
    },
    crash: () => {},
    sound: () => {},
    spawn: () => {},
  })
  for (let t = 0; t < GUARDIAN.enterTicks + 2; t++)
    updateGuardian(gd, world(20))
  assert.equal(String(gd.act), 'idle')
  // Phase 1: the body shrugs beams off; each wing panel is its own target.
  assert.equal(hitGuardian(gd, gd.x, gd.y + 4)?.kind, 'shrug')
  assert.equal(gd.panels.length, 4)
  for (const p of gd.panels) {
    let last = null
    while (p.hp > 0) {
      const at = panelPos(gd, p)
      last = hitGuardian(gd, at.x, at.y)
      assert.equal(last?.kind, 'panel')
    }
    assert.equal(last?.points, GUARDIAN.panelPoints)
  }
  assert.equal(gd.phase, 2, 'wings down: the sweep')
  // Phase 2: the sweep needs a moment to take hold. Dash through it and it never does...
  let x = W - 20
  for (let t = 0; t < 400 && gd.act !== 'sweep'; t++)
    updateGuardian(gd, world(x))
  assert.equal(String(gd.act), 'sweep')
  let held = 0
  for (let t = 0; t < GUARDIAN.sweepTicks && gd.act === 'sweep'; t++) {
    if (Math.abs(gd.sweepX - x) < 40) x = Math.max(8, x - 1.9 * gd.sweepDir)
    updateGuardian(gd, world(x))
    held = Math.max(held, gd.held)
  }
  assert.equal(caught.length, 0, 'slipped through the glow')
  assert.ok(held > 0 && held < GUARDIAN.grip)
  // ...but sit in it and it carries the lantern off.
  for (let t = 0; t < 600 && caught.length === 0; t++)
    updateGuardian(gd, world(gd.act === 'sweep' ? gd.sweepX : 112))
  assert.equal(caught.length, 1)
  assert.ok(gd.holding, 'the Guardian carries the lantern')
  while (gd.phase === 2) hitGuardian(gd, gd.x, gd.y)
  assert.equal(gd.phase, 3, 'then it dives')
  for (let t = 0; t < 5; t++) updateGuardian(gd, world(112))
  assert.equal(gd.ring.length, GUARDIAN.ringSize, 'inside a ring of escorts')
  let dived = false
  for (let t = 0; t < 400 && !dived; t++) {
    updateGuardian(gd, world(112))
    dived = gd.act === 'dive'
  }
  assert.ok(dived)
  let hits = 0
  let calmed = false
  while (!calmed && hits < 200) {
    const hit = hitGuardian(gd, gd.x, gd.y)
    hits++
    calmed = !!hit?.calmed
  }
  assert.ok(calmed, 'calmed at last')
  assert.equal(gd.phase, 4)
  for (let t = 0; t < 600 && !gd.done; t++) updateGuardian(gd, world(112))
  assert.ok(gd.done, 'it floats home')

  // In the game: calming the Guardian rescues its captive and ends the Watch on a results card.
  const game = play(13)
  game.startStage(5)
  assert.ok(game.guardian)
  game.guardian!.holding = true
  game.guardian!.phase = 3
  game.guardian!.hp = 1
  game.guardian!.act = 'hover'
  game.beams = [beam(game.guardian!.x, game.guardian!.y + 8)]
  game.update(emptyInput())
  assert.equal(game.guardian!.phase, 4)
  assert.equal(game.tally.guardians, 1)
  assert.equal(game.drifters.length, 1, 'the caught lantern comes home')
  for (let t = 0; t < 2000 && !game.results; t++) game.update(emptyInput())
  assert.ok(game.results, 'a results card after the Watch')
}

// --- the results card and hit ratio -------------------------------------------------------------
{
  assert.equal(hitRatio({ shots: 0, hits: 0 }), 0)
  assert.equal(hitRatio({ shots: 8, hits: 5 }), 62.5)
  assert.equal(ratioText({ shots: 3, hits: 1 }), '33.3%')
  const tally = { ...newTally(), shots: 10, hits: 7, glows: 1, perfectGlows: 1 }
  const rows = Object.fromEntries(resultRows(tally))
  assert.equal(rows['HIT RATIO'], '70.0%')
  assert.equal(rows['PERFECT GLOWS'], '1 / 1')

  const game = play(15)
  for (let t = 0; t < 8; t++) game.update(t % 2 ? emptyInput() : press('a'))
  assert.ok(game.tally.shots > 0, 'shots are counted')
  game.startStage(5)
  game.tally.shots = 10
  game.tally.hits = 4
  game.guardian!.done = true
  game.update(emptyInput())
  for (let t = 0; t < 200 && !game.results; t++) game.update(emptyInput())
  assert.ok(game.results)
  game.render(fakeCtx())
  for (let t = 0; t < 30; t++) game.update(press('a'))
  assert.ok(game.results, 'the card stays up a moment')
  for (let t = 0; t < 100 && game.results; t++)
    game.update(t % 2 ? emptyInput() : press('a'))
  assert.equal(game.results, null, 'A flies on')
  // The Evening forks: the Sky Chart (verifyCabinetLanternSwarmEvening.test.ts) picks the way.
  for (let t = 0; t < 100 && game.stageIndex === 5; t++)
    game.update(t % 2 ? emptyInput() : press('a'))
  assert.equal(game.stageIndex, 6)
  assert.equal(game.level, 7)
  assert.equal(game.banner?.text, 'EVENING WATCH', 'on into the next Watch')
  assert.equal(game.tally.shots, 0, 'a fresh tally for the Watch')
  assert.ok(game.night.shots > 0, 'the night keeps its own tally')

  // Game over shows the whole night's hit ratio.
  const over = play(16)
  over.night = { shots: 4, hits: 3 }
  over.lives = 0
  over.alive = false
  ;(over as unknown as { respawn: number }).respawn = 1
  over.update(emptyInput())
  assert.ok(over.over)
  assert.equal(over.banner?.sub2, 'NIGHT HIT RATIO 75.0%')
}

// --- every screen renders headless --------------------------------------------------------------
{
  const game = play(17)
  for (const stage of [0, 1, 2, 3, 4, 5]) {
    game.startStage(stage)
    for (let t = 0; t < 300; t++) {
      game.update(emptyInput())
      if (t % 60 === 0) game.render(fakeCtx())
    }
  }
}

// --- pilot probe: runs still end, scores stay plausible, the attract demo scores 0 ---------------
{
  const meta = ARCADE_GAMES.find((g) => g.slug === 'lantern-swarm')!
  let furthest = 0
  for (const seed of [1, 2, 3, 4]) {
    const game = play(seed)
    let t = 0
    for (; t < 300_000 && !game.over; t++) game.update(game.demoInput())
    assert.ok(game.over, `seed ${seed}: the run ends (${t} ticks)`)
    assert.ok(game.score > 0 && game.score < meta.maxPlausibleScore)
    assert.ok(game.night.hits > 0 && game.night.hits <= game.night.shots)
    furthest = Math.max(furthest, game.level)
  }
  assert.ok(furthest >= 4, `the pilot gets into the Watch (stage ${furthest})`)
  // A strong pilot (spare lanterns) calms the Guardian and reaches the results card.
  const strong = play(2)
  strong.startStage(5)
  strong.lives = 99
  for (let t = 0; t < 20_000 && !strong.results; t++)
    strong.update(strong.demoInput())
  assert.ok(strong.results, 'the pilot calms the Grand Lantern Moth')

  const demo = play(21, true)
  for (let t = 0; t < 40_000 && !demo.over; t++) demo.update(emptyInput())
  assert.equal(demo.score, 0, 'the attract demo scores 0')
  assert.ok(demo.level > 1, 'the attract demo plays on')
}

console.log('lantern swarm rooftop festival: ok')
