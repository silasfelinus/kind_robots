// /utils/scripts/verifyCabinetCableCrawlerBios.test.ts
//
// Cable Crawler depth pass, slice 4 part 2 (conductor kr-arcade/t-067): the secret BIOS, the true
// ending and the maze medals. The BIOS's three mazes and the Boot Loader's room are sound; its
// door opens only once all thirty golden bytes are found; the Boot Loader is hit only by surging
// a checksum socket not yet verified, rewrites a line of the room (outlined first) without
// touching the cable, and its defeat plays the true ending and leads on to lap two; medals are
// earned, kept in the save and read back; and a pilot probe plays the whole BIOS.
//
//   npx tsx utils/scripts/verifyCabinetCableCrawlerBios.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import cableCrawler from '../arcade/games/cableCrawler'
import {
  BOOT_LOADER_HP,
  REWRITE_TELL,
  bossCells,
  bossPhase,
  hitBoss,
  newBoss,
  updateBoss,
  type Boss,
  type BossWorld,
} from '../arcade/cableCrawler/bosses'
import {
  BIOS,
  BIOS_INDEX,
  BYTE_MAZES,
  COMPONENTS,
  biosOpen,
  boardsBefore,
  componentAt,
  componentSteps,
} from '../arcade/cableCrawler/components'
import { BIG_SURGE, earnedMedals } from '../arcade/cableCrawler/medals'
import { BOOT_ROOM } from '../arcade/cableCrawler/mazesBios'
import { COLS, mazeProblems, parseMaze } from '../arcade/cableCrawler/mazes'
import { readCableSave } from '../arcade/cableCrawler/save'
import { emptyInput } from '../arcade/types'

type Game = {
  score: number
  lives: number
  over: boolean
  walls: boolean[]
  body: number[]
  boss: Boss | null
  battery: number
  batteryMax: number
  clear: number
  dead: number
  cardTicks: number
  stepIndex: number
  compIndex: number
  ending: number
  trueEnd: boolean
  lap: number
  bytes: Set<string>
  medals: Set<string>
  bitten: boolean
  biggestSurge: number
  sockets: Array<{ k: number; charge: number }>
  save: { comp: number; medals?: string[] } | null
  maze: { id: string }
  update(input: ReturnType<typeof emptyInput>): void
  advance(): void
  beginComponent(i: number): void
  surge(s: { k: number; charge: number }): void
  bossDefeated(): void
  mazeClear(): void
  unplug(why: string): void
  rewriteLine(y: number): void
  nextComponent(): number
  demoInput(): ReturnType<typeof emptyInput>
  render(g: CanvasRenderingContext2D): void
}

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

// --- the component and its rooms ------------------------------------------------------------------
{
  assert.equal(BIOS.number, 7)
  assert.ok(
    !COMPONENTS.includes(BIOS),
    'the BIOS is secret: outside the campaign laps',
  )
  assert.equal(BIOS.mazes.length, 3)
  assert.equal(BIOS.screensaver, null)
  assert.equal(BIOS.boss.kind, 'boot-loader')
  assert.deepEqual(
    componentSteps(BIOS).map((s) => s.kind),
    ['maze', 'maze', 'maze', 'boss'],
  )
  for (const m of BIOS.mazes) assert.deepEqual(mazeProblems(m), [], m.id)
  assert.deepEqual(mazeProblems(BOOT_ROOM, 'boss'), [])
  assert.equal(parseMaze(BOOT_ROOM).banks.length, 3, 'three checksum sockets')
  assert.equal(parseMaze(BOOT_ROOM).sockets.length, 4)
  assert.equal(BIOS.look.wallStyle, 'text')
  assert.equal(componentAt(BIOS_INDEX).component, BIOS)
  assert.equal(boardsBefore(BIOS_INDEX), boardsBefore(COMPONENTS.length))
  assert.ok(
    !BYTE_MAZES.some((id) => id.startsWith('bios')),
    'BIOS bytes do not unlock the BIOS',
  )
}

// --- the door --------------------------------------------------------------------------------------
{
  assert.equal(biosOpen(new Set()), false)
  assert.equal(
    biosOpen(new Set(BYTE_MAZES.slice(1))),
    false,
    '29 bytes is not enough',
  )
  assert.equal(biosOpen(new Set(BYTE_MAZES)), true)
  const g = play()
  g.beginComponent(5)
  assert.equal(g.nextComponent(), 6, 'without every byte the CPU Core leads on')
  g.bytes = new Set(BYTE_MAZES)
  assert.equal(
    g.nextComponent(),
    BIOS_INDEX,
    'with every byte it opens the BIOS',
  )
  g.advance()
  while (
    g.stepIndex <
    componentSteps(g.compIndex === 5 ? COMPONENTS[5]! : BIOS).length - 1
  )
    g.advance()
  g.advance()
  assert.equal(g.compIndex, BIOS_INDEX)
  assert.equal(
    g.nextComponent(),
    COMPONENTS.length,
    'and the BIOS leads on to lap two',
  )
  g.beginComponent(BIOS_INDEX)
  g.cardTicks = 0
  for (let s = 0; s < 4; s++) {
    for (let t = 0; t < 300; t++) g.update(g.demoInput())
    g.lives = 3
    g.render(fakeCtx())
    if (s < 3) g.advance()
    g.cardTicks = 0
  }
  // Lap two (index 6) never re-enters the BIOS.
  g.beginComponent(11)
  g.bytes = new Set(BYTE_MAZES)
  assert.equal(g.nextComponent(), 12)
}

// --- the Boot Loader -------------------------------------------------------------------------------
{
  const world = (calls: number[]): BossWorld => ({
    cable: () => null,
    bite: () => {},
    shuffleSockets: () => {},
    wall: () => false,
    busy: () => false,
    setWalls: () => {},
    drip: () => {},
    rewrite: (y) => calls.push(y),
    rng: mulberry32(2),
  })
  const banks = parseMaze(BOOT_ROOM).banks
  const b = newBoss(
    'boot-loader',
    [],
    parseMaze(BOOT_ROOM).boss ?? 0,
    [],
    banks,
  )
  assert.equal(b.hp, BOOT_LOADER_HP)
  assert.deepEqual(bossCells(b), [], 'it has no body to bonk')
  assert.equal(bossPhase(b), 1)
  const rows: number[] = []
  let sawTell = 0
  for (let t = 0; t < 600; t++) {
    updateBoss(b, world(rows))
    if (b.tell > 0) sawTell = Math.max(sawTell, b.tell)
  }
  assert.ok(rows.length >= 2, 'it rewrites lines')
  assert.equal(sawTell, REWRITE_TELL, 'each is outlined first')
  assert.ok(rows.every((y) => y >= 1 && y <= 17))
  // Only an unverified checksum takes a hit.
  assert.equal(
    hitBoss(b, new Set([5]), []),
    false,
    'a surge elsewhere does nothing',
  )
  assert.equal(hitBoss(b, new Set([banks[0]![0]!]), []), true)
  assert.equal(b.hp, BOOT_LOADER_HP - 1)
  assert.equal(bossPhase(b), 2)
  b.invuln = 0
  assert.equal(
    hitBoss(b, new Set([banks[0]![0]!]), []),
    false,
    'a verified checksum does not count twice',
  )
  assert.equal(hitBoss(b, new Set([banks[1]![0]!]), []), true)
  assert.equal(bossPhase(b), 3)
  b.invuln = 0
  assert.equal(hitBoss(b, new Set([banks[2]![0]!]), []), true)
  assert.equal(b.hp, 0)
}

// --- the room rewrites itself without hurting the cable --------------------------------------------
{
  const g = play()
  g.beginComponent(BIOS_INDEX)
  g.cardTicks = 0
  while (g.stepIndex < 3) g.advance()
  g.cardTicks = 0
  assert.equal(g.boss?.kind, 'boot-loader')
  const before = [...g.walls]
  const row = 5
  g.rewriteLine(row)
  assert.notEqual(
    g.walls,
    before as unknown,
    'a new wall list, so the board repaints',
  )
  const count = (w: readonly boolean[]) => w.filter(Boolean).length
  assert.equal(
    count(g.walls),
    count(before),
    'pillars move, none appear or vanish',
  )
  for (let y = 0; y < 19; y++)
    if (y !== row)
      for (let x = 0; x < COLS; x++)
        assert.equal(g.walls[y * COLS + x], before[y * COLS + x])
  for (const k of g.body) assert.ok(!g.walls[k], 'the cable is never walled in')
  g.render(fakeCtx())
}

// --- the true ending ---------------------------------------------------------------------------------
{
  const g = play()
  g.bytes = new Set(BYTE_MAZES)
  g.beginComponent(BIOS_INDEX)
  g.cardTicks = 0
  while (g.stepIndex < 3) g.advance()
  g.cardTicks = 0
  g.lives = 3
  g.boss!.hp = 1
  const bank = g.boss!.banks[0]!
  g.boss!.lit = [false, true, true]
  g.boss!.invuln = 0
  g.body = [g.sockets[0]!.k, bank[0]!]
  g.surge(g.sockets[0]!)
  assert.equal(g.boss!.hp, 0, 'the last checksum beats the Boot Loader')
  assert.ok(g.trueEnd && g.ending > 0, 'and the whole Mainframe comes alive')
  assert.equal(g.save!.comp, COMPONENTS.length, 'a quit now resumes on lap two')
  const frame = emptyInput()
  for (let t = 0; t < 60 * 11 && g.compIndex === BIOS_INDEX; t++) {
    g.update(frame)
    g.render(fakeCtx())
  }
  assert.equal(g.compIndex, COMPONENTS.length, 'on to lap two')
  assert.equal(g.trueEnd, false)
}

// --- medals ----------------------------------------------------------------------------------------
{
  const run = { bitten: false, biggestSurge: 0, battery: 100, batteryMax: 100 }
  assert.deepEqual(earnedMedals(run), ['bites', 'battery'])
  assert.deepEqual(earnedMedals({ ...run, bitten: true, battery: 49 }), [])
  assert.deepEqual(earnedMedals({ ...run, biggestSurge: BIG_SURGE }), [
    'bites',
    'surge',
    'battery',
  ])
  assert.deepEqual(
    earnedMedals({ ...run, biggestSurge: BIG_SURGE - 1, battery: 50 }),
    ['bites', 'battery'],
  )

  const g = play()
  g.beginComponent(0)
  g.cardTicks = 0
  const id = g.maze.id
  g.battery = g.batteryMax
  g.mazeClear()
  assert.ok(g.medals.has(`${id}:bites`) && g.medals.has(`${id}:battery`))
  assert.ok(!g.medals.has(`${id}:surge`))
  assert.ok(
    g.save!.medals!.includes(`${id}:bites`),
    'kept for good in the save',
  )
  // An unplug costs the No Bites medal on the next maze.
  g.advance()
  g.cardTicks = 0
  const next = g.maze.id
  g.clear = 0
  g.dead = 0
  g.unplug('test')
  g.battery = g.batteryMax
  g.clear = 0
  g.mazeClear()
  assert.ok(!g.medals.has(`${next}:bites`), 'bitten: no medal')
  // The save reads back, dropping anything unknown.
  const back = readCableSave({
    ...g.save,
    medals: [`${id}:bites`, 'nonsense:bites', `${id}:fake`, `${id}:bites`, 7],
  })!
  assert.deepEqual(back.medals, [`${id}:bites`])
  assert.deepEqual(
    readCableSave({ ...g.save, comp: BIOS_INDEX })!.comp,
    BIOS_INDEX,
  )
  const resumed = cableCrawler.create({
    rng: mulberry32(1),
    sound: quiet,
    demo: false,
    hiScore: 0,
    resume: g.save,
  }) as unknown as Game
  assert.ok(resumed.medals.has(`${id}:bites`), 'medals come back with the run')
}

// --- a pilot plays the whole BIOS -------------------------------------------------------------------
{
  for (const seed of [1, 3]) {
    const game = play(seed)
    game.beginComponent(BIOS_INDEX)
    game.cardTicks = 0
    for (
      let t = 0;
      t < 60 * 60 * 20 && game.compIndex === BIOS_INDEX && !game.over;
      t++
    ) {
      game.lives = Math.max(game.lives, 2)
      game.update(game.demoInput())
    }
    assert.ok(
      game.compIndex >= COMPONENTS.length,
      `seed ${seed}: through the BIOS (${game.compIndex})`,
    )
  }
}

console.log('verifyCabinetCableCrawlerBios: ok')
