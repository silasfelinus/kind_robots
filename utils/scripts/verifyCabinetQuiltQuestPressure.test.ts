// Quilt Quest depth slice 1, Pressure and pictures (conductor kr-arcade/t-127): the stitch clock
// and wildfire sparks that run up an unfinished thread, twin tangles and the split bonus, wrap
// capture, the picture-reveal renderer, shaped frames and islands, the power-up buttons, seam
// combos, and Endless Quilting's foe ladder in place of the quilt-9 plateau.
//
//   npx tsx utils/scripts/verifyCabinetQuiltQuestPressure.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { ARCADE_GAMES } from '../arcade/games'
import { create } from '../arcade/games/quiltQuest'
import {
  ENDLESS_LADDER,
  FABRIC_NAMES,
  INK_CELL,
  POWER_UP_KINDS,
  QUILT_COLS,
  QUILT_FRAMES,
  QUILT_PICTURES,
  QUILT_ROWS,
  type PowerUpKind,
  type QuiltBlock,
  WRAP_SHARE,
  endlessBlock,
  islandCells,
  paintPicture,
  pickPowerUp,
  pictureInk,
} from '../arcade/games/quiltQuestBlocks'
import { RAMPS } from '../arcade/snes'
import { type InputFrame, emptyInput } from '../arcade/types'

const COLS = QUILT_COLS
const ROWS = QUILT_ROWS
const OPEN = 0
const FILLED = 1
const EDGE = 2
const VOID = 4
const OX = 6
const OY = 30
const CELL = 4

type Tangle = {
  x: number
  y: number
  vx: number
  vy: number
  trail: Array<{ x: number; y: number }>
  small?: boolean
  twin?: boolean
}
type Spark = {
  c: number
  r: number
  pc: number
  pr: number
  hand: 1 | -1
  t: number
  wild?: boolean
  flare?: boolean
  ember?: boolean
  onThread?: number
}
type Probe = {
  score: number
  level: number
  lives: number
  over: boolean
  tick: number
  c: number
  r: number
  drawing: boolean
  dead: number
  clear: number
  fuse: number
  trail: Array<{ c: number; r: number }>
  cells: Uint8Array
  cloth: Uint8Array
  clothTotal: number
  claimed: number
  block: QuiltBlock
  tangles: Tangle[]
  tanglets: Tangle[]
  sparks: Spark[]
  buttons: Array<{ c: number; r: number; kind: PowerUpKind }>
  bows: Array<{ c: number; r: number }>
  clock: number
  clockMax: number
  wildfire: boolean
  thimbles: number
  treadle: number
  pausePin: number
  magnet: number
  mult: number
  nextMult: number
  banner: { text: string; sub?: string; sub2?: string } | null
  tally: { wraps: number; splits: number; powerUps: number; combos: string[] }
  update(input: InputFrame): void
  render(g: CanvasRenderingContext2D): void
  startLevel(level: number): void
  layCloth(): void
  resetPlayer(fresh?: boolean): void
  moveSparks(): void
  cell(c: number, r: number): number
}

const sound = { play() {} }
const make = (seed: number, demo = false) =>
  create({
    rng: mulberry32(seed),
    sound,
    demo,
    hiScore: 0,
  }) as unknown as Probe
const idx = (c: number, r: number) => r * COLS + c

/** A fresh quilt with the foes held still where a test wants them. */
function quilt(level: number, seed = 1): Probe {
  const g = make(seed)
  g.startLevel(level)
  g.banner = null
  g.sparks = []
  g.tanglets = []
  for (const t of g.tangles) {
    t.vx = 0
    t.vy = 0
  }
  return g
}
function place(t: Tangle, x: number, y: number) {
  t.x = x
  t.y = y
  t.vx = 0
  t.vy = 0
}
function hold(dir: 'up' | 'down' | 'left' | 'right' | null, slow = false) {
  const input = emptyInput()
  if (dir) input.held[dir] = true
  if (slow) input.held.b = true
  else input.held.a = true
  return input
}
/**
 * Stitch a path of straight legs from an edge cell: each leg runs in a direction until the needle
 * reaches `until` (a column or row). Returns once the stitch closes (or snaps).
 */
function stitch(
  g: Probe,
  from: [number, number],
  legs: Array<['up' | 'down' | 'left' | 'right', number]>,
) {
  g.c = from[0]
  g.r = from[1]
  assert.equal(g.cell(g.c, g.r), EDGE, 'stitches start on an edge')
  let began = false
  let on = 0
  const going = ([dir, until]: (typeof legs)[number]) =>
    dir === 'down'
      ? g.r < until
      : dir === 'up'
        ? g.r > until
        : dir === 'right'
          ? g.c < until
          : g.c > until
  for (let t = 0; t < 2000; t++) {
    if (began && !g.drawing) return
    if (g.dead || g.clear) return
    while (legs[on] && !going(legs[on]!)) on++
    g.update(hold(legs[on] ? legs[on]![0] : null))
    if (g.drawing) began = true
  }
  assert.fail('the stitch never closed')
}

// --- the ladder: a new foe every two quilts, then heat, no plateau ---------------------------------
{
  assert.ok(ARCADE_GAMES.some((m) => m.slug === 'quilt-quest'))
  const quilts = ENDLESS_LADDER.map((s) => s.quilt)
  assert.deepEqual(quilts, [1, 3, 5, 7], 'a new foe every two quilts')
  const b1 = endlessBlock(1)
  assert.equal(b1.tangles, 1)
  assert.equal(b1.twins, false)
  assert.equal(b1.tanglets, 0)
  assert.equal(b1.wildSparks, 0)
  assert.equal(b1.unlock?.foe, 'tangle')
  assert.equal(endlessBlock(2).unlock, null)
  assert.ok(endlessBlock(3).tanglets >= 1, 'tanglets from quilt 3')
  assert.equal(endlessBlock(5).twins, true, 'twin tangles from quilt 5')
  assert.equal(endlessBlock(5).tangles, 2)
  assert.equal(endlessBlock(7).wildSparks, 1, 'a wildfire spark from quilt 7')
  // Past the old quilt-9 plateau the cloth keeps heating up.
  const late = [9, 11, 13, 15, 17, 21].map(endlessBlock)
  for (let i = 1; i < late.length; i++)
    assert.ok(late[i]!.heat > late[i - 1]!.heat, 'heat rises every two quilts')
  assert.ok(endlessBlock(17).clockTicks < endlessBlock(9).clockTicks)
  assert.ok(endlessBlock(17).tanglets > endlessBlock(9).tanglets)
  assert.ok(endlessBlock(15).tangles > endlessBlock(9).tangles)
  assert.ok(endlessBlock(13).wildSparks > endlessBlock(9).wildSparks)
  // Pictures and frames rotate through the pool.
  const pics = new Set(
    [1, 2, 3, 4, 5, 6].map((q) => endlessBlock(q).picture.id),
  )
  assert.equal(pics.size, QUILT_PICTURES.length)
  const frames = new Set(
    Array.from({ length: 12 }, (_, i) => endlessBlock(i + 1).frame.id),
  )
  assert.equal(frames.size, QUILT_FRAMES.length, 'every frame comes round')
  assert.equal(endlessBlock(1).frame.shape, 'rect', "quilt 1 is today's cloth")
  // A real game follows the ladder.
  const g = make(3)
  g.startLevel(5)
  assert.equal(g.tangles.filter((t) => t.twin).length, 2)
  assert.equal(g.tanglets.length, endlessBlock(5).tanglets)
  assert.ok(
    g.banner?.sub2?.includes('TWIN TANGLES'),
    'the new foe is announced',
  )
  g.startLevel(7)
  assert.equal(g.sparks.filter((s) => s.ember && s.wild).length, 1)
}

// --- the pictures: authored 61 x 51, sewn in the six fabric ramps ---------------------------------
{
  assert.ok(QUILT_PICTURES.length >= 6)
  for (const p of QUILT_PICTURES) {
    const cells = paintPicture(p)
    assert.equal(cells.length, COLS * ROWS)
    assert.equal(paintPicture(p), cells, 'painted once, cached')
    const fabrics = new Set<number>()
    let ink = 0
    for (const v of cells) {
      assert.ok(v > 0, `${p.id}: every cell is painted`)
      const decoded = pictureInk(v)
      if (!decoded) {
        assert.equal(v, INK_CELL)
        ink++
        continue
      }
      assert.ok(decoded.fabric >= 0 && decoded.fabric < FABRIC_NAMES.length)
      assert.ok(decoded.shade >= 0 && decoded.shade <= 4)
      fabrics.add(decoded.fabric)
    }
    assert.ok(fabrics.size >= 3, `${p.id} uses several fabrics`)
    assert.ok(ink > 20, `${p.id} has inked outlines`)
    const f = p.feature
    assert.ok(
      f.x >= 1 && f.y >= 1 && f.x + f.w <= COLS - 1 && f.y + f.h <= ROWS - 1,
    )
  }
}

// --- frames and islands: shaped cloth, a live edge round it, sparks that circulate --------------------
for (const frame of QUILT_FRAMES) {
  const g = quilt(1)
  g.block = { ...g.block, frame }
  g.layCloth()
  g.resetPlayer()
  assert.equal(
    g.cell(g.c, g.r),
    EDGE,
    `${frame.id}: the needle starts on an edge`,
  )
  assert.ok(g.clothTotal > 900, `${frame.id}: plenty of cloth`)
  let edges = 0
  let voids = 0
  for (let i = 0; i < g.cells.length; i++) {
    if (g.cells[i] === EDGE) edges++
    if (g.cells[i] === VOID) voids++
    if (g.cloth[i]) assert.equal(g.cells[i], OPEN)
  }
  assert.ok(edges > 100, `${frame.id}: an edge to run`)
  if (frame.shape !== 'rect')
    assert.ok(voids > 100, `${frame.id}: wood outside`)
  for (const isle of frame.islands)
    for (const [c, r] of islandCells(isle)) {
      assert.equal(g.cloth[idx(c, r)], 0, `${frame.id}: islands are pre-sewn`)
      assert.notEqual(g.cell(c, r), OPEN)
    }
  // A spark runs the rim without getting stuck in a corner.
  g.c = -10
  g.sparks = [
    { ...g.sparks[0], c: 0, r: 0, pc: 0, pr: 0, hand: 1, t: 0, onThread: -1 },
  ]
  Object.assign(
    g.sparks[0]!,
    (() => {
      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++)
          if (g.cell(c, r) === EDGE && !g.cloth[idx(c, r)])
            return { c, r, pc: c - 1, pr: r }
      return {}
    })(),
  )
  const seen = new Set<number>()
  for (let t = 0; t < 6000; t++) {
    g.tick++
    g.moveSparks()
    seen.add(idx(g.sparks[0]!.c, g.sparks[0]!.r))
    assert.equal(g.cell(g.sparks[0]!.c, g.sparks[0]!.r), EDGE)
  }
  assert.ok(
    seen.size > 80,
    `${frame.id}: the spark runs the rim (${seen.size})`,
  )
}

// --- the stitch clock empties into wildfire; a claim calms it ----------------------------------------
{
  const g = quilt(2)
  g.startLevel(2)
  g.banner = null
  g.tangles.forEach((t) => place(t, 45, 30))
  g.tanglets = []
  assert.equal(g.clock, g.clockMax)
  assert.equal(g.clockMax, endlessBlock(2).clockTicks)
  const plain = g.sparks.length
  g.clock = 1
  g.update(emptyInput())
  assert.ok(g.wildfire, 'an empty clock lights the wildfire')
  assert.equal(g.sparks.length, plain + 1, 'a flare joins the sparks')
  assert.ok(
    g.sparks.every((s) => s.wild),
    'every spark flares gold',
  )
  g.sparks.forEach((s) => (s.t = 9999))
  stitch(
    g,
    [10, 0],
    [
      ['down', 6],
      ['left', 0],
    ],
  )
  assert.ok(!g.wildfire, 'a claim calms it')
  assert.ok(g.clock >= g.clockMax - 2, 'and refills the clock')
  assert.equal(g.sparks.length, plain, 'the flare burns out')
  assert.ok(g.sparks.every((s) => !s.wild))
}

// --- wildfire runs up an unfinished thread; a plain spark only lights the fuse --------------------------
for (const wild of [true, false]) {
  const g = quilt(1)
  g.tangles.forEach((t) => place(t, 45, 40))
  g.c = 0
  g.r = 25
  for (let t = 0; t < 40 && g.trail.length < 9; t++) g.update(hold('right'))
  assert.ok(g.drawing && g.trail.length >= 8)
  // A spark coming down the left edge toward where the thread began.
  g.sparks = [{ c: 0, r: 23, pc: 0, pr: 22, hand: 1, t: 0, wild, onThread: -1 }]
  let climbed = false
  let lit = false
  for (let t = 0; t < 120 && !g.dead; t++) {
    g.update(emptyInput())
    if ((g.sparks[0]?.onThread ?? -1) >= 0) climbed = true
    if (g.fuse >= 0 && !climbed) lit = true
  }
  if (wild) {
    assert.ok(climbed, 'wildfire climbs onto the thread')
    assert.equal(g.banner?.sub, 'WILDFIRE RAN UP THE THREAD')
    assert.equal(g.lives, 2)
  } else {
    assert.ok(!climbed, 'a plain spark never runs the thread')
    assert.ok(lit, 'it lights the fuse instead')
  }
}

// --- twin tangles split apart finish the quilt at once, and the next pays x2 ---------------------------
{
  const g = quilt(5)
  const twins = g.tangles.filter((t) => t.twin)
  assert.equal(twins.length, 2)
  place(twins[0]!, 15, 25)
  place(twins[1]!, 45, 25)
  stitch(g, [30, 0], [['down', ROWS - 1]])
  assert.ok(g.clear > 0, 'the quilt is finished at once')
  assert.ok(g.claimed < 60, 'well short of the target')
  assert.equal(g.banner?.text, 'SPLIT THE TWINS!')
  assert.equal(g.nextMult, 2)
  assert.equal(g.tally.splits, 1)
  while (g.clear > 0) g.update(emptyInput())
  assert.equal(g.level, 6)
  assert.equal(g.mult, 2, 'the next quilt pays double')
  const before = g.score
  g.sparks = []
  g.tangles.forEach((t) => place(t, 45, 30))
  g.tanglets = []
  g.c = 0
  g.r = 25
  g.update(hold('right'))
  assert.equal(g.score - before, 2, 'a stitch pays x2')
  // Twins left on the same side don't split.
  const h = quilt(5)
  const pair = h.tangles.filter((t) => t.twin)
  place(pair[0]!, 40, 15)
  place(pair[1]!, 45, 35)
  stitch(h, [30, 0], [['down', ROWS - 1]])
  assert.equal(h.clear, 0)
  assert.equal(h.nextMult, 1)
}

// --- wrap capture: a tanglet boxed in under 3% is tied in a bow ----------------------------------------
{
  const g = quilt(3)
  g.tangles.forEach((t) => place(t, 45, 30))
  const tanglet: Tangle = {
    x: 5,
    y: 5,
    vx: 0,
    vy: 0,
    trail: [],
    small: true,
  }
  g.tanglets = [tanglet]
  const before = g.score
  stitch(
    g,
    [9, 0],
    [
      ['down', 9],
      ['left', 0],
    ],
  )
  assert.ok(64 * 100 < WRAP_SHARE * g.clothTotal)
  assert.equal(g.tanglets.length, 0, 'the tanglet is wrapped')
  assert.deepEqual(g.bows, [{ c: 5, r: 5 }])
  assert.equal(g.tally.wraps, 1)
  assert.equal(g.cell(5, 5), FILLED, 'its pocket is sewn')
  assert.ok(g.score - before > 1000, 'a bow pays')
  // Boxed in a big pocket, it holds the cloth open and stays a threat.
  const h = quilt(3)
  h.tangles.forEach((t) => place(t, 50, 40))
  h.tanglets = [{ x: 10, y: 10, vx: 0, vy: 0, trail: [], small: true }]
  stitch(
    h,
    [22, 0],
    [
      ['down', 22],
      ['left', 0],
    ],
  )
  assert.equal(h.tanglets.length, 1, 'too big a pocket: no bow')
  assert.equal(h.cell(10, 10), OPEN, 'and the pocket stays open')
  // The big tangle is never wrapped, however small its box.
  const k = quilt(1)
  place(k.tangles[0]!, 4, 4)
  stitch(
    k,
    [9, 0],
    [
      ['down', 9],
      ['left', 0],
    ],
  )
  assert.equal(k.tangles.length, 1)
  assert.equal(k.cell(4, 4), OPEN)
}

// --- power-up buttons: enclose one to claim it ------------------------------------------------------
{
  assert.deepEqual([...POWER_UP_KINDS].sort(), [
    'magnet',
    'pause',
    'spool',
    'thimble',
    'treadle',
  ])
  const picked = new Set(
    Array.from({ length: 100 }, (_, i) => pickPowerUp(i / 100)),
  )
  assert.equal(picked.size, POWER_UP_KINDS.length)
  const g = make(4)
  assert.equal(g.buttons.length, endlessBlock(1).buttons, 'buttons are hidden')
  for (const b of g.buttons) assert.equal(g.cell(b.c, b.r), OPEN)

  const claim = (kinds: PowerUpKind[]) => {
    const q = quilt(2)
    q.tangles.forEach((t) => place(t, 45, 30))
    q.buttons = kinds.map((kind, i) => ({ c: 3 + i, r: 3 + (i % 3), kind }))
    q.buttons.push({ c: 40, r: 40, kind: 'spool' })
    stitch(
      q,
      [9, 0],
      [
        ['down', 9],
        ['left', 0],
      ],
    )
    assert.equal(q.buttons.length, 1, 'only the enclosed buttons are claimed')
    return q
  }
  // Thimble: forgives one snap.
  const t = claim(['thimble'])
  assert.equal(t.thimbles, 1)
  t.c = 0
  t.r = 25
  for (let i = 0; i < 8; i++) t.update(hold('right'))
  place(t.tangles[0]!, t.c + 1, t.r + 1)
  t.update(emptyInput())
  assert.ok(t.dead > 0)
  assert.equal(t.lives, 3, 'the thimble saved the needle')
  assert.equal(t.thimbles, 0)
  assert.equal(t.banner?.text, 'THIMBLE!')
  // Treadle: the needle runs half as fast again.
  const run = (q: Probe) => {
    q.c = 12
    q.r = 0
    q.sparks = []
    for (let i = 0; i < 60; i++) q.update(hold('right'))
    return q.c - 12
  }
  const tr = claim(['treadle'])
  assert.ok(tr.treadle > 0)
  const fast = run(tr)
  const plain = run(quilt(2))
  assert.equal(plain, 30)
  assert.ok(fast >= 44 && fast <= 46, `treadle ${fast} vs ${plain}`)
  // Spool: twice the stitch clock.
  const sp = claim(['spool'])
  assert.ok(sp.clock >= sp.clockMax * 2 - 2)
  // Pause Pin: every foe holds still.
  const pp = claim(['pause'])
  assert.ok(pp.pausePin > 0)
  pp.tangles.forEach((tg) => {
    tg.vx = 0.5
    tg.vy = 0.3
  })
  const at = pp.tangles.map((tg) => [tg.x, tg.y])
  for (let i = 0; i < 100; i++) pp.update(emptyInput())
  assert.deepEqual(
    pp.tangles.map((tg) => [tg.x, tg.y]),
    at,
  )
  for (let i = 0; i < 300; i++) pp.update(emptyInput())
  assert.notDeepEqual(
    pp.tangles.map((tg) => [tg.x, tg.y]),
    at,
    'and moves again when the pin lets go',
  )
  // Magnet: the sparks are pulled off the edge for a while.
  const mg = quilt(4)
  mg.startLevel(4)
  mg.banner = null
  mg.tangles.forEach((tg) => place(tg, 45, 30))
  mg.tanglets = []
  mg.buttons = [{ c: 4, r: 4, kind: 'magnet' }]
  mg.sparks.forEach((s) => (s.t = 0))
  stitch(
    mg,
    [9, 0],
    [
      ['down', 9],
      ['left', 0],
    ],
  )
  assert.ok(mg.magnet > 0)
  assert.ok(mg.sparks.length > 0 && mg.sparks.every((s) => s.t >= 300))
  assert.equal(mg.tally.powerUps, 1)
}

// --- seam combos ---------------------------------------------------------------------------------------
{
  // Big Block: 10% or more in one stitch.
  const big = quilt(1)
  place(big.tangles[0]!, 45, 25)
  stitch(big, [12, 0], [['down', ROWS - 1]])
  assert.ok(big.tally.combos.includes('bigBlock'))
  assert.ok(!big.tally.combos.includes('squareSeam'))
  // Square Seam: an exact square patch.
  const sq = quilt(1)
  place(sq.tangles[0]!, 45, 25)
  stitch(
    sq,
    [7, 0],
    [
      ['down', 7],
      ['left', 0],
    ],
  )
  assert.deepEqual(sq.tally.combos, ['squareSeam'])
  const rect = quilt(1)
  place(rect.tangles[0]!, 45, 25)
  stitch(
    rect,
    [12, 0],
    [
      ['down', 7],
      ['left', 0],
    ],
  )
  assert.deepEqual(rect.tally.combos, [], 'a long rectangle is no square')
  // Picture Perfect: the sunflower's face revealed in one patch.
  const pic = quilt(1)
  assert.equal(pic.block.picture.id, 'sunflower')
  place(pic.tangles[0]!, 50, 40)
  stitch(
    pic,
    [22, 0],
    [
      ['down', 27],
      ['right', 38],
      ['up', 0],
    ],
  )
  assert.ok(pic.tally.combos.includes('picturePerfect'))
  // Revealed in two patches, it isn't.
  const half = quilt(1)
  place(half.tangles[0]!, 50, 40)
  stitch(
    half,
    [30, 0],
    [
      ['down', 18],
      ['right', COLS - 1],
    ],
  )
  assert.ok(half.cell(34, 15) === FILLED, 'part of the face is showing')
  stitch(
    half,
    [22, 0],
    [
      ['down', 27],
      ['right', 38],
      ['up', 0],
    ],
  )
  assert.ok(!half.tally.combos.includes('picturePerfect'))
}

// --- the picture-reveal renderer paints each sewn cell in its picture's fabric ------------------------
{
  const g = quilt(1)
  place(g.tangles[0]!, 45, 25)
  stitch(g, [12, 0], [['down', ROWS - 1]])
  // The first full-cell fill at a spot is its base colour.
  const firsts = new Map<string, string>()
  let style = ''
  const record = new Proxy(
    {},
    {
      get: (_, prop) => {
        if (prop === 'fillRect')
          return (x: number, y: number, w: number, h: number) => {
            const key = `${x},${y}`
            if (w === CELL && h === CELL && !firsts.has(key))
              firsts.set(key, style)
          }
        if (prop === 'measureText') return () => ({ width: 6 })
        if (prop === 'createLinearGradient' || prop === 'createRadialGradient')
          return () => ({ addColorStop: () => {} })
        return () => {}
      },
      set: (_, prop, value) => {
        if (prop === 'fillStyle') style = String(value)
        return true
      },
    },
  ) as CanvasRenderingContext2D
  g.render(record)
  const picture = paintPicture(g.block.picture)
  const ramps = FABRIC_NAMES.map((n) => RAMPS[n])
  let checked = 0
  for (let r = 1; r < ROWS - 1; r++)
    for (let c = 1; c < 11; c++) {
      if (g.cell(c, r) !== FILLED) continue
      const ink = pictureInk(picture[idx(c, r)]!)
      const want = ink ? ramps[ink.fabric]![ink.shade] : '#140a26'
      assert.equal(firsts.get(`${OX + c * CELL},${OY + r * CELL}`), want)
      checked++
    }
  assert.ok(checked > 300, 'the claimed patch shows the picture')
  // Finishing a quilt fades the whole picture in.
  g.claimed = 0
  g.clear = 100
  g.render(record)
}

// --- runs still end, deterministically; the attract demo scores 0 ----------------------------------------
const meta = ARCADE_GAMES.find((m) => m.slug === 'quilt-quest')!
for (const seed of [1, 2, 3]) {
  const a = make(seed)
  const b = make(seed)
  let ticks = 0
  while (!a.over && ticks < 200_000) {
    const input = emptyInput()
    input.held.a = true
    const dir = ['right', 'down', 'left', 'up'] as const
    input.held[dir[(ticks >> 5) % 4]!] = true
    a.update(input)
    b.update(input)
    ticks++
  }
  assert.ok(a.over, `seed ${seed} ends`)
  assert.equal(a.score, b.score)
  assert.equal(a.level, b.level)
  assert.ok(a.score <= meta.maxPlausibleScore)
}
{
  let levels = 0
  for (const seed of [1, 2, 3, 4]) {
    const d = make(seed, true)
    for (let i = 0; i < 20_000 && !d.over; i++) d.update(emptyInput())
    assert.equal(d.score, 0, 'the attract demo scores 0')
    levels = Math.max(levels, d.level)
  }
  assert.ok(levels >= 3, 'the pilot still finishes quilts')
}

console.log('quilt quest pressure and pictures: ok')
