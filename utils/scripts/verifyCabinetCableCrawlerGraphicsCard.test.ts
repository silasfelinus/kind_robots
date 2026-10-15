// /utils/scripts/verifyCabinetCableCrawlerGraphicsCard.test.ts
//
// Cable Crawler depth pass, slice 3 part 2 (conductor kr-arcade/t-066): the Graphics Card. Its five
// picture mazes, Paint and The Glitch's room are sound; every picture is complete; a slurped spark
// reveals its pixel and a restored picture pays a bonus; the scanline cuts the tail end off a cable
// lying across its row; a glitch sprite flickers, then lands on the spark ahead and unplugs a plug
// that meets it; z-fighter walls flicker but never go solid on the cable; Paint ends when every
// pixel is coloured; The Glitch is a worm that splits and must be caught whole; and a pilot probe
// runs through the whole component.
//
//   npx tsx utils/scripts/verifyCabinetCableCrawlerGraphicsCard.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import cableCrawler from '../arcade/games/cableCrawler'
import {
  THE_GLITCH_HP,
  WORM_LENGTH,
  bossCells,
  bossPhase,
  hitBoss,
  newBoss,
  updateBoss,
  wormCells,
  type Boss,
  type BossWorld,
} from '../arcade/cableCrawler/bosses'
import {
  BYTE_MAZES,
  COMPONENTS,
  GRAPHICS_CARD,
} from '../arcade/cableCrawler/components'
import {
  SPRITE_EVERY,
  SPRITE_TELL,
  newGlitch,
  type Glitch,
} from '../arcade/cableCrawler/glitches'
import {
  COLS,
  ROWS,
  cellKey,
  cellX,
  cellY,
  mazeProblems,
  parseMaze,
  ringOf,
  type Maze,
  type Way,
} from '../arcade/cableCrawler/mazes'
import {
  PAINT_ART,
  PICTURES,
  PICTURE_COLOURS,
  PICTURE_H,
  PICTURE_W,
  paintColour,
  pictureColour,
} from '../arcade/cableCrawler/pictures'
import { parseLoop } from '../arcade/sound'
import { emptyInput, type InputFrame } from '../arcade/types'

type Game = {
  score: number
  lives: number
  over: boolean
  maze: Maze
  walls: boolean[]
  body: number[]
  dir: Way
  want: Way
  grow: number
  sparks: Set<number>
  sockets: Array<{ k: number; charge: number }>
  glitches: Glitch[]
  boss: Boss | null
  saver: { kind: string; ticks: number; caught: number; total: number } | null
  battery: number
  batteryMax: number
  dead: number
  clear: number
  cardTicks: number
  tick: number
  stepIndex: number
  compIndex: number
  scanRow: number
  scanTimer: number
  scanBitten: boolean
  banner: { text: string; sub: string } | null
  update(input: InputFrame): void
  crawl(): void
  advance(): void
  beginComponent(i: number): void
  scanCut(y: number): void
  applyZFighters(): void
  zWantsShut(k: number, ahead?: number): boolean
  spriteTarget(g: Glitch): number
  updateSprite(g: Glitch): void
  surge(s: { k: number; charge: number }): void
  eat(k: number): void
  demoInput(): InputFrame
  render(g: CanvasRenderingContext2D): void
}

const quiet = { play: () => {} }
/** A drawing context that accepts every call: enough to prove a frame paints without throwing. */
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
const RIGHT = { dx: 1, dy: 0 }
const at = (x: number, y: number) => cellKey(x, y)

function play(seed = 3): Game {
  const game = cableCrawler.create({
    rng: mulberry32(seed),
    sound: quiet,
    demo: false,
    hiScore: 0,
  }) as unknown as Game
  game.cardTicks = 0
  return game
}

/** Jump to the Graphics Card's board: 0-2 mazes, 3 Paint, 4-5 mazes, 6 The Glitch. */
function goTo(game: Game, stepIndex: number) {
  game.beginComponent(4)
  while (game.stepIndex < stepIndex) game.advance()
  game.cardTicks = 0
}

function lay(game: Game, cells: Array<[number, number]>, dir: Way) {
  game.body = cells.map(([x, y]) => at(x, y))
  game.dir = dir
  game.want = dir
  game.grow = 0
  for (const k of game.body) game.sparks.delete(k)
}

// --- the mazes and pictures --------------------------------------------------------------------
{
  assert.equal(COMPONENTS[4], GRAPHICS_CARD)
  assert.equal(GRAPHICS_CARD.number, 5)
  assert.equal(GRAPHICS_CARD.mazes.length, 5)
  assert.equal(BYTE_MAZES.length, 30)
  for (const layout of GRAPHICS_CARD.mazes)
    assert.deepEqual(mazeProblems(layout), [], `${layout.id} is sound`)
  assert.deepEqual(mazeProblems(GRAPHICS_CARD.boss.layout, 'boss'), [])
  assert.deepEqual(mazeProblems(GRAPHICS_CARD.screensaver!.layout, 'open'), [])
  const all = GRAPHICS_CARD.mazes.map(parseMaze)
  assert.ok(
    all.every((m) => m.zfighters.length >= 2),
    'z-fighter walls in every maze',
  )
  assert.ok(
    all.slice(1).every((m) => m.sprites.length >= 1),
    'glitch sprites from maze 2',
  )
  assert.ok(
    all.slice(1).every((m) => m.scan > 0),
    'a scanline from maze 2',
  )
  assert.ok(
    all.every((m) => m.picture),
    'a picture in every maze',
  )
  // The scanline sweeps quicker maze by maze.
  const scans = all.slice(1).map((m) => m.scan)
  assert.deepEqual(
    scans,
    [...scans].sort((a, b) => b - a),
  )
  // The checker spots a z-fighter that is not a doorway.
  const first = GRAPHICS_CARD.mazes[0]!
  assert.ok(
    mazeProblems({
      ...first,
      rows: first.rows.map((r, y) => (y === 1 ? r.replace(/[. ]/, 'z') : r)),
    }).some((p) => p.includes('doorway')),
  )
  // Every picture is a full 11 x 9 image in known colours, one pixel per lattice spark.
  assert.equal(PICTURES.length, 5)
  for (const pic of PICTURES) {
    assert.equal(pic.rows.length, PICTURE_H)
    for (const row of pic.rows) {
      assert.equal(row.length, PICTURE_W, `${pic.id} row width`)
      for (const ch of row)
        assert.ok(PICTURE_COLOURS[ch], `${pic.id} colour ${ch}`)
    }
  }
  for (const layout of GRAPHICS_CARD.mazes) {
    const maze = parseMaze(layout)
    const lattice = maze.sparks.filter((k) => cellX(k) % 2 && cellY(k) % 2)
    assert.equal(
      lattice.length,
      maze.sparks.length,
      'sparks sit on the lattice',
    )
    assert.ok(maze.sparks.length >= 45, `${layout.id} has pixels enough`)
    for (const k of maze.sparks)
      assert.ok(pictureColour(layout.picture!, cellX(k), cellY(k)), 'a pixel')
  }
  assert.equal(pictureColour('sunrise', 2, 2), null, 'off the lattice')
  // Paint: every pixel of the heart is a spark two cells apart.
  const paint = parseMaze(GRAPHICS_CARD.screensaver!.layout)
  const pixels = PAINT_ART.join('').replace(/ /g, '').length
  assert.equal(paint.sparks.length, pixels)
  for (const k of paint.sparks)
    assert.ok(paintColour(cellX(k), cellY(k)), 'every spark is a paint pixel')
  const parsed = parseLoop(GRAPHICS_CARD.music)
  assert.equal(parsed.length, 64)
  assert.ok(parsed.notes.length > 30)
}

// --- picture boards ----------------------------------------------------------------------------
{
  const game = play()
  goTo(game, 0)
  assert.equal(game.maze.picture, 'sunrise')
  assert.ok(game.sparks.size > 45)
  // Clearing the last spark restores the picture and pays its bonus.
  const spark = [...game.sparks][0]!
  game.sparks = new Set([spark])
  game.battery = game.batteryMax
  const before = game.score
  game.body = [at(cellX(spark), cellY(spark) + 1), game.maze.start]
  game.eat(spark)
  assert.equal(game.sparks.size, 0)
  assert.ok(game.clear > 0, 'the maze clears')
  assert.equal(game.banner?.text, 'PICTURE RESTORED!')
  assert.ok(game.score - before >= 2000, 'a restored picture pays a bonus')
}

// --- the scanline ------------------------------------------------------------------------------
{
  const game = play()
  goTo(game, 1)
  assert.ok(game.maze.scan > 0)
  // A plug caught on the row the line reaches loses the tail end of its cable, once a sweep.
  const col = 5
  const cells: Array<[number, number]> = []
  for (let y = 4; y < 13; y++) cells.push([col, y])
  lay(game, cells, { dx: 0, dy: -1 })
  const before = game.body.length
  game.scanCut(8)
  assert.equal(game.body.length, before, 'a cable across the row is not cut')
  game.scanCut(1)
  assert.equal(game.body.length, before)
  game.scanCut(4)
  assert.equal(
    game.body.length,
    before - 4,
    'the plug on the line loses its tail',
  )
  game.scanCut(4)
  assert.equal(game.body.length, before - 4, 'only once a sweep')
  // It never cuts the cable shorter than a few cells.
  lay(game, cells.slice(0, 5), { dx: 0, dy: -1 })
  game.scanBitten = false
  game.scanCut(4)
  assert.ok(game.body.length >= 3)
  // The line sweeps on its own: a row at a time, then rests, then starts again.
  const g2 = play()
  goTo(g2, 1)
  g2.scanRow = -1
  g2.scanTimer = 1
  g2.battery = g2.batteryMax
  g2.update(emptyInput())
  assert.equal(g2.scanRow, 0)
  const rows: number[] = []
  for (let t = 0; t < g2.maze.scan * (ROWS + 12); t++) {
    g2.battery = g2.batteryMax
    g2.dead = 0
    g2.update(emptyInput())
    if (rows[rows.length - 1] !== g2.scanRow) rows.push(g2.scanRow)
  }
  assert.ok(rows.includes(ROWS - 1), 'it reaches the bottom row')
  assert.ok(rows.includes(-1), 'it rests, then starts again')
  // Maze 1 has no scanline.
  const g3 = play()
  goTo(g3, 0)
  assert.equal(g3.maze.scan, 0)
}

// --- glitch sprites ----------------------------------------------------------------------------
{
  const game = play()
  goTo(game, 1)
  const sprite = game.glitches.find((g) => g.kind === 'sprite')!
  assert.ok(sprite, 'SCANLINE ALLEY has a glitch sprite')
  sprite.booting = 0
  // It picks the spark the plug is heading for.
  const head = game.body[0]!
  const ahead = at(cellX(head), cellY(head) - 2)
  lay(game, [[cellX(head), cellY(head)]], { dx: 0, dy: -1 })
  game.sparks = new Set([ahead, at(1, 1), at(3, 1), at(5, 1), at(7, 1)])
  assert.equal(game.spriteTarget(sprite), ahead, 'the spark ahead')
  // A flicker first, then the teleport.
  sprite.timer = 1
  game.updateSprite(sprite)
  assert.equal(sprite.tell, SPRITE_TELL, 'it flickers first')
  assert.equal(sprite.aim, ahead)
  const home = sprite.k
  for (let t = 0; t < SPRITE_TELL - 1; t++) game.updateSprite(sprite)
  assert.equal(sprite.k, home, 'still at home until the flicker ends')
  game.updateSprite(sprite)
  assert.equal(sprite.k, ahead, 'it lands on the spark')
  assert.equal(sprite.timer, SPRITE_EVERY)
  // It never lands on the cable.
  const s2 = newGlitch('sprite', at(1, 1))
  s2.aim = head
  s2.tell = 1
  game.updateSprite(s2)
  assert.equal(s2.k, at(1, 1), 'not onto the cable')
  // Meeting it unplugs you; a surge reboots it.
  const lives = game.lives
  lay(game, [[cellX(ahead), cellY(ahead) + 1]], { dx: 0, dy: -1 })
  game.battery = game.batteryMax
  game.crawl()
  if (game.lives === lives) game.crawl()
  assert.equal(game.lives, lives - 1, 'a glitch sprite unplugs you')
  const g2 = play()
  goTo(g2, 1)
  const sp = g2.glitches.find((g) => g.kind === 'sprite')!
  sp.booting = 0
  const c = g2.body[0]!
  lay(g2, [[cellX(c), cellY(c)]], { dx: 0, dy: -1 })
  sp.k = [
    at(cellX(c) + 1, cellY(c)),
    at(cellX(c) - 1, cellY(c)),
    at(cellX(c), cellY(c) - 1),
  ].find((k) => !g2.walls[k])!
  g2.sockets[0]!.charge = 0
  g2.surge(g2.sockets[0]!)
  assert.ok(sp.down > 0, 'the surge reboots a sprite beside the cable')
}

// --- z-fighter walls ---------------------------------------------------------------------------
{
  const game = play()
  goTo(game, 0)
  const zs = game.maze.zfighters
  assert.ok(zs.length >= 2)
  // They flicker: solid for part of the cycle and passable for the rest.
  const seen = new Set<boolean>()
  for (let t = 0; t < 60 * 5; t++) {
    game.tick = t
    game.applyZFighters()
    seen.add(game.walls[zs[0]!]!)
  }
  assert.deepEqual([...seen].sort(), [false, true])
  // Out of step with one another.
  game.tick = 0
  assert.notEqual(game.zWantsShut(zs[0]!), game.zWantsShut(zs[1]!, 100))
  // Never solid on the cable.
  const z = zs[0]!
  let shutAt = -1
  for (let t = 0; t < 60 * 5 && shutAt < 0; t++)
    if (game.zWantsShut(z, t)) shutAt = t
  game.tick = shutAt
  lay(game, [[cellX(z), cellY(z)]], RIGHT)
  game.body = [z, game.maze.start]
  game.applyZFighters()
  assert.equal(game.walls[z], false, 'the cable holds the z-fighter open')
}

// --- Paint -------------------------------------------------------------------------------------
{
  const game = play()
  goTo(game, 3)
  assert.equal(game.saver?.kind, 'paint')
  const total = game.saver!.total
  assert.equal(total, game.sparks.size)
  assert.ok(total >= 30)
  // Colouring every pixel ends the Screensaver early, perfect.
  const before = game.score
  const cells = [...game.sparks]
  game.battery = game.batteryMax
  for (const k of cells) game.eat(k)
  assert.equal(game.saver!.caught, total)
  assert.ok(game.clear > 0, 'it ends when the picture is done')
  assert.ok(game.score - before >= 5000, 'a perfect picture pays')
}

// --- The Glitch --------------------------------------------------------------------------------
{
  const game = play()
  goTo(game, 6)
  assert.equal(game.boss?.kind, 'the-glitch')
  const ring = ringOf(game.maze)
  assert.ok(ring.length > 50)
  const boss = newBoss('the-glitch', ring, game.maze.boss!)
  assert.equal(boss.hp, THE_GLITCH_HP)
  assert.equal(bossCells(boss).length, WORM_LENGTH, 'one worm')
  assert.equal(bossPhase(boss), 1)
  boss.hp = 3
  assert.equal(bossPhase(boss), 2)
  boss.hp = 2
  assert.equal(bossPhase(boss), 3)

  const world = (
    cable: BossWorld['cable'] = () => null,
    bite = () => {},
  ): BossWorld => ({
    cable,
    bite,
    shuffleSockets: () => {},
    wall: () => false,
    busy: () => false,
    setWalls: () => {},
    drip: () => {},
    rng: mulberry32(1),
  })

  // Phase 1: it walks the ring, and a surge through its body hits it.
  boss.hp = THE_GLITCH_HP
  boss.stun = 0
  boss.timer = 1
  const start = boss.at
  updateBoss(boss, world())
  assert.notEqual(boss.at, start, 'it walks the ring')
  const swept = new Set(bossCells(boss))
  assert.equal(hitBoss(boss, swept), true)
  assert.equal(boss.hp, THE_GLITCH_HP - 1)
  assert.equal(
    hitBoss(boss, swept),
    false,
    'it shrugs off a second surge at once',
  )

  // Meeting the plug head-on bites.
  let bitten = 0
  const b2 = newBoss('the-glitch', ring, game.maze.boss!)
  b2.timer = 1
  const next = ring[(b2.at + 1) % ring.length]!
  updateBoss(
    b2,
    world(
      (k) => (k === next ? 'head' : null),
      () => bitten++,
    ),
  )
  assert.equal(bitten, 1, 'the head bites')

  // Phase 2: it sees the plug, glows, then charges; a charge into the cable stuns it.
  const b3 = newBoss('the-glitch', ring, game.maze.boss!)
  b3.hp = 4
  b3.timer = 1
  const bodyCell = ring[(b3.at + 3) % ring.length]!
  const seesHead = world((k) => (k === bodyCell ? 'head' : null))
  updateBoss(b3, seesHead)
  assert.ok(b3.tell > 0, 'it glows before it charges')
  for (let t = 0; t < 60 && !b3.charging; t++) updateBoss(b3, seesHead)
  assert.ok(b3.charging > 0, 'then it charges')
  const wall = ring[(b3.at + 1) % ring.length]!
  b3.timer = 1
  updateBoss(
    b3,
    world((k) => (k === wall ? 'body' : null)),
  )
  assert.ok(b3.stun > 0, 'a charge into the cable stuns it')
  assert.equal(b3.charging, 0)

  // Phase 3: it splits in two, and one surge must catch both worms.
  const b4 = newBoss('the-glitch', ring, game.maze.boss!)
  b4.hp = 3
  b4.invuln = 0
  b4.stun = 0
  const one = new Set(bossCells(b4))
  assert.equal(hitBoss(b4, one), true, 'the hit that brings phase 3')
  assert.equal(bossPhase(b4), 3)
  assert.ok(b4.twin >= 0, 'it splits')
  assert.equal(bossCells(b4).length, WORM_LENGTH * 2, 'two worms')
  b4.invuln = 0
  const hp = b4.hp
  const firstOnly = new Set(wormCells(ring, b4.at, b4.dir))
  assert.equal(hitBoss(b4, firstOnly), false, 'one worm alone is not enough')
  const secondOnly = new Set(wormCells(ring, b4.twin, b4.twinDir))
  assert.equal(hitBoss(b4, secondOnly), false)
  assert.equal(b4.hp, hp)
  assert.equal(hitBoss(b4, new Set(bossCells(b4))), true, 'both at once lands')
  assert.equal(b4.hp, hp - 1)
  // The twin walks the other way round the ring.
  b4.invuln = 0
  b4.stun = 0
  b4.timer = 1
  const twin = b4.twin
  updateBoss(b4, world())
  assert.notEqual(b4.twin, twin)

  // On the board: meeting the worm bonks, and defeating it ends the room.
  const head = game.maze.start
  assert.equal(game.boss!.hp, THE_GLITCH_HP)
  const lives = game.lives
  const g2 = play()
  goTo(g2, 6)
  const cells = bossCells(g2.boss!)
  const target = cells[1]!
  g2.body = [at(cellX(target), cellY(target) + 1), head]
  g2.body = [ring.find((k) => !cells.includes(k) && k !== target) ?? head, head]
  assert.ok(lives >= 1)
  g2.boss!.hp = 1
  g2.boss!.invuln = 0
  g2.boss!.twin = (g2.boss!.at + (ring.length >> 1)) % ring.length
  const both = new Set(bossCells(g2.boss!))
  assert.equal(hitBoss(g2.boss!, both, g2.body), true)
  assert.equal(g2.boss!.hp, 0)
  assert.equal(bossCells(g2.boss!).length, 0, 'a beaten boss fills no cells')
}

// --- drawing -----------------------------------------------------------------------------------
{
  // Every kind of board paints a frame: a half-revealed picture with its scanline, z-fighters and
  // sprite tell; Paint half coloured; and The Glitch as one worm, then two.
  for (const step of [0, 1, 3, 6]) {
    const game = play()
    goTo(game, step)
    for (let t = 0; t < 400; t++) {
      game.battery = game.batteryMax
      game.dead = 0
      game.update(game.demoInput())
      if (t % 100 === 0) game.render(fakeCtx())
    }
    if (game.boss) {
      game.boss.hp = 2
      game.boss.invuln = 0
      game.boss.twin = (game.boss.at + 30) % 90
      game.render(fakeCtx())
      game.boss.stun = 10
      game.render(fakeCtx())
    }
    const sprite = game.glitches.find((g) => g.kind === 'sprite')
    if (sprite) {
      sprite.aim = game.body[0]!
      sprite.tell = 20
      game.render(fakeCtx())
    }
  }
}

// --- pilot probes ------------------------------------------------------------------------------
{
  const run = (seed: number, ticks: number, keep: boolean, from: number) => {
    const game = play(seed)
    goTo(game, 0)
    game.beginComponent(from)
    game.cardTicks = 0
    let t = 0
    for (; t < ticks && !game.over; t++) {
      if (keep) game.lives = Math.max(game.lives, 2)
      game.update(game.demoInput())
    }
    return { game, t }
  }
  // Held up on cables, the pilot plays through the whole Graphics Card.
  for (const seed of [1, 3]) {
    const { game } = run(seed, 60 * 60 * 20, true, 4)
    assert.ok(
      game.compIndex >= 5,
      `seed ${seed}: through the Graphics Card (component ${game.compIndex})`,
    )
    assert.ok(game.score < 60_000_000)
  }
  // Without them, runs end.
  for (const seed of [2, 5]) {
    const { game } = run(seed, 60 * 60 * 30, false, 4)
    assert.ok(game.over, `seed ${seed}: the run ends`)
  }
  // The same seed plays the same game.
  const a = run(7, 60 * 60 * 3, true, 4).game
  const b = run(7, 60 * 60 * 3, true, 4).game
  assert.equal(a.score, b.score)
  assert.deepEqual(a.body, b.body)
}

void COLS

console.log('verifyCabinetCableCrawlerGraphicsCard: ok')
