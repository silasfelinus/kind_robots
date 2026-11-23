// Pixel Hop, The Painted Planets slice 2 (conductor kr-arcade t-084): Candy Comet and Rondo Ring.
// Twelve campaign rounds on data-defined boards (pyramids, the wide pyramid, two rings and the
// tightrope bridge), the spring tile, two picture boards hung in the Gallery with golden brushes,
// Gumball Machine Max and Ringmaster Rattle, the planet map, title cards and rule
// demonstrations, and the save that resumes a run at its planet. A pilot probe shows runs still
// end and the attract demo still scores nothing.
//
//   npx tsx utils/scripts/verifyCabinetPixelHopPlanets.test.ts

import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { create } from '../arcade/games/pixelHop'
import {
  boardFromArt,
  boardConnected,
  cellKey,
  HOP_DIRS,
  ringBoard,
  ringLoop,
} from '../arcade/games/pixelHopBoards'
import {
  MAX_PHASES,
  PICTURES,
  PLANET_START,
  PLANETS,
  RATTLE_LOOP,
  RATTLE_PHASES,
  GLOBE_CRACKS,
  STAGES,
  auditStages,
  coinRing,
  firstOfRule,
  readHopSave,
} from '../arcade/games/pixelHopPlanets'
import type { InputFrame } from '../arcade/types'

type Cell = { r: number; c: number }
type Screen = { kind: string; cursor?: number; final?: boolean }
type Probe = {
  score: number
  lives: number
  level: number
  over: boolean
  mode: string
  stage: number
  planet: number
  round: number
  screens: Screen[]
  board: { id: string; cells: Cell[]; special: Record<string, string> }
  paint: number[][]
  brush: number
  me: Cell & { fr: number; fc: number; hop: number; falling: number }
  enemies: Array<{ kind: string; r: number; c: number }>
  boss: null | {
    kind: string
    phase: number
    sneezes?: number
    bonks?: number
    cracks?: number
    ring?: Cell[]
    i?: number
    dir?: number
    dizzy?: number
    hop?: number
    r?: number
    c?: number
    span?: number
  }
  clear: number
  freeze: number
  dropTimer: number
  gallery: Record<string, number>
  brushes: Set<number>
  save: unknown
  music: unknown
  startStage(index: number): void
  startRound(round: number): void
  land(): void
  update(input: InputFrame, players?: InputFrame[]): void
}

const blank = {
  up: false,
  down: false,
  left: false,
  right: false,
  a: false,
  b: false,
  start: false,
}
const idle = (): InputFrame => ({ held: { ...blank }, pressed: { ...blank } })
const press = (key: keyof typeof blank): InputFrame => ({
  held: { ...blank, [key]: true },
  pressed: { ...blank, [key]: true },
})

function make(
  seed: number,
  extra: { demo?: boolean; resume?: unknown; selectScreen?: boolean } = {},
): Probe {
  return create({
    rng: mulberry32(seed),
    sound: { play: () => {} },
    demo: extra.demo ?? false,
    hiScore: 0,
    resume: extra.resume,
    selectScreen: extra.selectScreen,
  }) as unknown as Probe
}

/** Clear the title card, map and rule demonstration with A presses. */
function skipScreens(game: Probe) {
  for (let i = 0; i < 400 && game.screens.length; i++) {
    game.update(i % 30 === 29 ? press('a') : idle())
  }
  assert.equal(game.screens.length, 0, 'the screens give way to play')
}

/** Stand Pip on a cube and land there (as the cabinet does at the end of a hop). */
function landOn(game: Probe, cell: Cell) {
  game.me.r = game.me.fr = cell.r
  game.me.c = game.me.fc = cell.c
  game.me.hop = 0
  game.me.falling = 0
  game.land()
}

// --- the data ---------------------------------------------------------------------------------

assert.deepEqual(auditStages(), [], 'every stage board is sound')
assert.equal(STAGES.length, 18, 'three planets of six rounds')
assert.equal(PLANETS.length, 3)
assert.deepEqual([...PLANET_START], [0, 6, 12])
for (let p = 0; p < 3; p++) {
  const rounds = STAGES.filter((s) => s.planet === p)
  assert.deepEqual(
    rounds.map((s) => s.round),
    [1, 2, 3, 4, 5, 6],
  )
  assert.ok(rounds[4]!.picture, 'round 5 is a picture board')
  assert.ok(rounds[5]!.boss, 'round 6 is the boss')
}
assert.deepEqual(
  STAGES.filter((s) => s.boss).map((s) => s.boss),
  ['max', 'rattle', 'globe'],
)
const boardIds = new Set(STAGES.map((s) => s.board.id))
for (const id of [
  'pyramid-7',
  'pyramid-8',
  'ring-5-1',
  'ring-5-2',
  'tightrope',
])
  assert.ok(boardIds.has(id), `the campaign plays the ${id} board`)
assert.equal(PICTURES.length, 3, 'three picture boards')
assert.deepEqual(
  STAGES.map((_, i) => i).filter(firstOfRule),
  [0, 2, 4, 7, 15],
  'the rule demonstrations also teach the glacier cycle',
)
assert.ok(
  STAGES.some((s) => Object.values(s.board.special).includes('spring')),
  'Rondo Ring brings the spring tile',
)
assert.ok(
  STAGES.filter((s) => s.planet === 1).some((s) => s.foes.includes('skitter')),
  'Skitter and Scoot run on Rondo Ring',
)

assert.throws(() => boardFromArt('bad', ['# #', '# #']), /off the grid/)
assert.equal(ringBoard(5, 1).cells.length, 16, 'the thin ring')
assert.equal(ringBoard(5, 2).cells.length, 24, 'the thick ring')
assert.ok(boardConnected(ringBoard(5, 1)))
const loop = ringLoop(5)
assert.equal(loop.length, 16)
loop.forEach((cell, i) => {
  const next = loop[(i + 1) % loop.length]!
  assert.ok(
    HOP_DIRS.some(
      ([dr, dc]) => cell.r + dr === next.r && cell.c + dc === next.c,
    ),
    'Rattle rolls cube to neighbouring cube',
  )
})
assert.deepEqual(coinRing({ r: 3, c: 1 }).length, 6)

// --- the save ---------------------------------------------------------------------------------

assert.equal(readHopSave(null), null)
assert.equal(readHopSave({ v: 2, planet: 0, score: 0, lives: 3 }), null)
assert.equal(readHopSave({ v: 1, planet: 9, score: 0, lives: 3 }), null)
assert.equal(readHopSave({ v: 1, planet: 1, score: -5, lives: 3 }), null)
assert.deepEqual(
  readHopSave({
    v: 1,
    planet: 1,
    score: 4200,
    lives: 2,
    gallery: { smiley: 2, nope: 1, flower: 7 },
    brushes: [0, 0, 9],
  }),
  {
    v: 1,
    planet: 1,
    score: 4200,
    lives: 2,
    gallery: { smiley: 2 },
    brushes: [0],
  },
  'a save keeps only what this build knows',
)

// --- a run opens on Candy Comet's title card and rule demonstration ---------------------------

{
  const game = make(1)
  assert.equal(game.mode, 'planets')
  assert.equal(game.stage, 0)
  assert.deepEqual(
    game.screens.map((s) => s.kind),
    ['title', 'demo'],
    'title card, then the one-hop demonstration',
  )
  const before = game.me.r
  for (let i = 0; i < 60; i++) game.update(press('right'))
  assert.equal(game.me.r, before, 'Pip waits out the title card')
  assert.ok(game.music, 'Candy Comet has its own music')
  skipScreens(game)
  assert.equal(game.board.id, 'pyramid-7')
  const save = game.save as { planet: number; v: number }
  assert.equal(save.v, 1)
  assert.equal(save.planet, 0, 'the run is saved at planet 1')
}

// --- the picture board: pots, matching colours, the Gallery and a golden brush ---------------

{
  const game = make(2)
  game.startStage(4)
  skipScreens(game)
  assert.equal(game.board.id, 'smiley')
  const board = STAGES[4]!.board
  const target = board.target!
  const pots = board.pots!
  const find = (want: (key: string) => boolean) => {
    const cell = board.cells.find((x) => want(cellKey(x.r, x.c)))!
    return { r: cell.r, c: cell.c }
  }
  const purple = find((k) => target[k] === 2)
  assert.equal(game.brush, 1, 'the brush starts in colour 1')
  landOn(game, purple)
  assert.notEqual(
    game.paint[purple.r]![purple.c],
    2,
    'the wrong colour beads off',
  )
  landOn(
    game,
    find((k) => pots[k] === 2),
  )
  assert.equal(game.brush, 2, 'a pot dips the brush')
  landOn(game, purple)
  assert.equal(game.paint[purple.r]![purple.c], 2, 'the matching colour takes')
  const scoreBefore = game.score
  for (const colour of [1, 2, 3]) {
    landOn(
      game,
      find((k) => pots[k] === colour),
    )
    for (const cell of board.cells)
      if (target[cellKey(cell.r, cell.c)] === colour && game.clear === 0)
        landOn(game, cell)
  }
  assert.ok(game.clear > 0, 'the finished picture clears the round')
  assert.ok(game.score > scoreBefore + 5000, 'picture and gold bonuses')
  assert.equal(game.gallery.smiley, 2, 'no hopper lost: a gold frame')
  assert.ok(game.brushes.has(0), 'and Candy Comet golden brush')
  const save = game.save as {
    gallery: Record<string, number>
    brushes: number[]
  }
  assert.equal(save.gallery.smiley, 2, 'the Gallery is saved')
  assert.deepEqual(save.brushes, [0])
}

// --- a lost hopper means an ordinary frame and no brush --------------------------------------

{
  const game = make(3)
  game.startStage(10)
  skipScreens(game)
  assert.equal(game.board.id, 'flower')
  // Hop off the board: a hopper lost on this picture.
  game.me.r = game.me.fr = 0
  game.me.c = game.me.fc = 3
  for (let i = 0; i < 200 && game.lives === 3; i++)
    game.update(i === 0 ? press('up') : idle())
  assert.equal(game.lives, 2, 'falling off costs a hopper')
  for (let i = 0; i < 120; i++) game.update(idle())
  const board = STAGES[10]!.board
  for (const colour of [1, 2, 3]) {
    const pot = board.cells.find(
      (x) => board.pots![cellKey(x.r, x.c)] === colour,
    )!
    landOn(game, pot)
    for (const cell of board.cells)
      if (board.target![cellKey(cell.r, cell.c)] === colour && game.clear === 0)
        landOn(game, cell)
  }
  assert.equal(game.gallery.flower, 1, 'framed, but not gold')
  assert.ok(!game.brushes.has(1), 'no golden brush')
}

// --- springs launch Pip two cubes along the line ----------------------------------------------

{
  const game = make(4)
  game.startStage(6)
  skipScreens(game)
  assert.equal(game.board.id, 'ring-5-1')
  assert.equal(game.board.special['2,2'], 'spring')
  game.enemies = []
  game.me.r = game.me.fr = 1
  game.me.c = game.me.fc = 1
  game.update(press('right'))
  for (let i = 0; i < 60 && (game.me.hop > 0 || game.me.r !== 4); i++)
    game.update(idle())
  assert.deepEqual(
    [game.me.r, game.me.c],
    [4, 4],
    'down-right onto the spring lands two cubes further on',
  )
  assert.equal(game.paint[2]![2], 2, 'the spring tile is painted on the way')
  assert.equal(game.paint[4]![4], 2, 'and so is the landing')
}

// --- Gumball Machine Max: spits volleys, sneezes three times ----------------------------------

{
  const game = make(5)
  game.startStage(5)
  skipScreens(game)
  assert.equal(game.boss?.kind, 'max')
  assert.equal(game.board.id, 'pyramid-8')
  game.me.r = game.me.fr = 7
  game.me.c = game.me.fc = 0
  let spat = 0
  for (let i = 0; i < 400; i++) {
    game.update(idle())
    spat = Math.max(spat, game.enemies.length)
    if (game.lives < 3) break
  }
  assert.ok(spat >= 2, 'Max spits gumballs in volleys')
  // His gumballs gum up a painted coin ring cube they bounce onto.
  const gummed = make(5)
  gummed.startStage(5)
  skipScreens(gummed)
  const cube = gummed.boss!.ring![0]!
  gummed.paint[cube.r]![cube.c] = 2
  gummed.enemies = [
    {
      kind: 'gumball',
      r: cube.r,
      c: cube.c,
      fr: -1,
      fc: 0,
      hop: 1,
      falling: 0,
      wait: 99,
    } as never,
  ]
  gummed.me.r = gummed.me.fr = 7
  gummed.me.c = gummed.me.fc = 7
  gummed.update(idle())
  assert.ok(gummed.paint[cube.r]![cube.c]! < 2, 'gum takes a coat off the ring')
  const fresh = make(5)
  fresh.startStage(5)
  skipScreens(fresh)
  const scoreBefore = fresh.score
  for (let phase = 0; phase < MAX_PHASES.length; phase++) {
    assert.equal(fresh.boss!.sneezes, phase)
    const ring = fresh.boss!.ring!
    const hops = MAX_PHASES[phase]!.rule === 'two' ? 2 : 1
    for (const cell of ring) landOn(fresh, cell)
    if (hops === 2) {
      assert.equal(
        fresh.boss!.sneezes,
        phase,
        'later rings take two hops a cube',
      )
      for (const cell of ring) landOn(fresh, cell)
    }
    assert.equal(
      fresh.boss!.sneezes,
      phase + 1,
      'a painted coin ring: a sneeze',
    )
    for (let i = 0; i < 100; i++) fresh.update(idle())
    fresh.enemies = []
  }
  assert.ok(fresh.clear > 0 || fresh.planet === 1, 'three sneezes beat Max')
  assert.ok(fresh.score >= scoreBefore + 3 * 1000 + 5000)
  for (let i = 0; i < 400 && fresh.planet === 0; i++) fresh.update(idle())
  assert.equal(fresh.planet, 1, 'on to Rondo Ring')
  assert.equal(fresh.stage, PLANET_START[1])
  assert.deepEqual(
    fresh.screens.map((s) => s.kind),
    ['map', 'title'],
    'the planet map, then the title card',
  )
  const save = fresh.save as { planet: number; score: number }
  assert.equal(save.planet, 1, 'saved at the new planet')
  assert.equal(save.score, fresh.score)
}

// --- Ringmaster Rattle: wet paint ahead of him, then hop on him -------------------------------

{
  const game = make(6)
  game.startStage(11)
  skipScreens(game)
  const boss = game.boss!
  assert.equal(boss.kind, 'rattle')
  const n = RATTLE_LOOP.length
  for (let phase = 0; phase < RATTLE_PHASES.length; phase++) {
    assert.equal(boss.bonks, phase)
    assert.equal(
      boss.dir,
      RATTLE_PHASES[phase]!.dir,
      'phase 2 spins the other way',
    )
    // Let any bonk flight finish, then paint the cubes ahead of him.
    for (let i = 0; i < 40; i++) game.update(idle())
    game.me.r = game.me.fr = 3
    game.me.c = game.me.fc = 1
    game.enemies = []
    for (let k = 1; k <= RATTLE_PHASES[phase]!.need + 1; k++) {
      const cell = RATTLE_LOOP[(boss.i! + boss.dir! * k + n * 3) % n]!
      game.paint[cell.r]![cell.c] = 2
    }
    // Pip stands on the inner ring out of his way while he rolls on.
    game.me.r = game.me.fr = 4
    game.me.c = game.me.fc = 1
    for (let i = 0; i < 400 && boss.dizzy === 0; i++) {
      game.enemies = []
      game.dropTimer = 999
      game.update(idle())
    }
    assert.equal(game.lives, 3, 'Pip stays clear of him on the inner ring')
    assert.ok(boss.dizzy! > 0, 'enough wet paint and he slips')
    landOn(game, { r: boss.r!, c: boss.c! })
    game.update(idle())
    assert.equal(boss.bonks, phase + 1, 'hopping on a dizzy Rattle bonks him')
  }
  assert.ok(game.clear > 0, 'three bonks beat Rattle')
  // Before he slips, he is no pushover: meeting him costs a hopper.
  const other = make(7)
  other.startStage(11)
  skipScreens(other)
  const b = other.boss!
  other.enemies = []
  landOn(other, { r: b.r!, c: b.c! })
  other.update(idle())
  assert.equal(other.lives, 2, 'Rattle bonks a hopper who meets him spinning')
}

// --- Rondo Ring leads to Glacier Moon, not an early ending ----------------------

{
  const game = make(8)
  game.startStage(11)
  skipScreens(game)
  const boss = game.boss!
  for (let k = 0; k < 3; k++) {
    boss.dizzy = 100
    landOn(game, { r: boss.r!, c: boss.c! })
    game.update(idle())
    for (let i = 0; i < 40; i++) game.update(idle())
  }
  for (let i = 0; i < 400 && game.planet === 1; i++) game.update(idle())
  assert.equal(game.mode, 'planets', 'two planets do not finish the tour')
  assert.equal(game.planet, 2)
  assert.equal(game.stage, PLANET_START[2])
  assert.equal(game.board.id, 'pyramid-7')
  const save = game.save as { planet: number; score: number }
  assert.equal(save.planet, 2, 'Glacier Moon becomes the resume point')
}

// --- Glacier Moon ice, snowball and frost hazards --------------------------------

assert.ok(boardConnected(STAGES[14]!.board), 'twin peaks are connected')
assert.equal(STAGES[14]!.board.id, 'twin-peaks')
assert.equal(STAGES[15]!.rule, 'cycle', 'the aurora uses cycling paint')
assert.ok(
  STAGES.slice(12, 18).some((s) =>
    Object.values(s.board.special).includes('ice'),
  ),
  'Glacier Moon introduces slippery tiles',
)
assert.ok(
  STAGES.slice(12, 18).some((s) => s.foes.includes('frost')),
  'frost flakes freeze the player',
)
assert.ok(
  STAGES.slice(12, 18).some((s) => s.foes.includes('snowball')),
  'snowballs erase paint as they grow',
)

{
  const game = make(18)
  game.startStage(12)
  skipScreens(game)
  game.enemies = []
  game.me.r = game.me.fr = 1
  game.me.c = game.me.fc = 1
  game.update(press('down'))
  for (let i = 0; i < 50; i++) game.update(idle())
  assert.deepEqual(
    [game.me.r, game.me.c],
    [3, 1],
    'ice at row 2 slides Pip one extra cube along the hop',
  )
  assert.equal(game.paint[2]![1], 2, 'Pip paints the icy tile')
  assert.equal(game.paint[3]![1], 2, 'Pip also paints the slid-to tile')
}

{
  const game = make(19)
  game.startStage(13)
  skipScreens(game)
  game.me.r = game.me.fr = 6
  game.me.c = game.me.fc = 3
  game.enemies = [
    {
      kind: 'snowball',
      r: 4,
      c: 2,
      fr: 3,
      fc: 1,
      hop: 1,
      falling: 0,
      wait: 99,
    } as never,
  ]
  game.paint[4]![2] = 2
  game.update(idle())
  assert.equal(game.paint[4]![2], 1, 'a rolling snowball scuffs fresh paint')
  assert.equal(game.enemies[0]?.kind, 'snowball')
  const frost = make(20)
  frost.startStage(13)
  skipScreens(frost)
  frost.enemies = [
    {
      kind: 'frost',
      r: frost.me.r,
      c: frost.me.c,
      fr: frost.me.r,
      fc: frost.me.c,
      hop: 0,
      falling: 0,
      wait: 99,
    } as never,
  ]
  frost.update(idle())
  assert.equal(frost.lives, 3, 'touching frost stuns rather than bonks')
  assert.equal(frost.enemies.length, 0, 'the flake is collected on contact')
  const initial = { r: frost.me.r, c: frost.me.c }
  frost.update(press('right'))
  for (let i = 0; i < 30; i++) frost.update(idle())
  assert.deepEqual(
    [frost.me.r, frost.me.c],
    [initial.r, initial.c],
    'one second of frost disables movement',
  )
}

// --- The Snow Globe: four glowing cracks unlock the next planet ---------------

{
  const game = make(21)
  game.startStage(17)
  skipScreens(game)
  assert.equal(game.boss?.kind, 'globe')
  assert.equal(game.board.id, 'twin-peaks')
  const before = game.score
  for (let i = 0; i < GLOBE_CRACKS.length; i++) {
    const crack = GLOBE_CRACKS[i]!
    landOn(game, crack)
    assert.equal(
      game.boss?.cracks,
      i + 1,
      'each crack must be lit in the authored order',
    )
  }
  assert.ok(game.clear > 0, 'four fractures defeat the snow globe')
  assert.ok(game.score >= before + 9000, 'boss and crack rewards are scored')
  for (let i = 0; i < 400 && game.mode === 'planets'; i++) game.update(idle())
  assert.equal(game.mode, 'endless', 'the glacier clear opens the encore')
  assert.equal(game.round, 19)
  assert.equal(game.screens[0]?.kind, 'map')
  assert.equal(game.screens[0]?.final, true)
  const save = game.save as { planet: number; cleared?: boolean }
  assert.equal(save.planet, 0, 'a cleared campaign starts fresh')
  assert.equal(save.cleared, true)
}

// --- resume at a planet, and the mode menu -----------------------------------

{
  const kept = {
    v: 1,
    planet: 1,
    score: 8000,
    lives: 4,
    gallery: { smiley: 1 },
    brushes: [],
  }
  const game = make(9, { resume: kept })
  assert.equal(game.planet, 1, 'a save resumes at its planet')
  assert.equal(game.stage, PLANET_START[1])
  assert.equal(game.score, 8000)
  assert.equal(game.lives, 4)
  assert.equal(game.gallery.smiley, 1)

  const menu = make(9, { resume: kept, selectScreen: true })
  assert.equal(menu.screens[0]?.kind, 'menu')
  assert.equal(menu.music, null, 'the menu is quiet')
  menu.update(press('a'))
  assert.equal(menu.planet, 1, 'CONTINUE picks the run up at Rondo Ring')
  assert.equal(menu.score, 8000)

  const fresh = make(9, { resume: kept, selectScreen: true })
  fresh.update(press('down'))
  fresh.update(press('a'))
  assert.equal(fresh.planet, 0, 'THE PAINTED PLANETS starts again at planet 1')
  assert.equal(fresh.score, 0)
  assert.equal(fresh.gallery.smiley, 1, 'and keeps the Gallery')

  const endless = make(9, { selectScreen: true })
  endless.update(press('down'))
  endless.update(press('a'))
  assert.equal(endless.mode, 'endless', 'ENDLESS PYRAMID is still there')
  assert.equal(endless.board.id, 'pyramid-7')

  const gallery = make(9, { selectScreen: true })
  gallery.update(press('up'))
  gallery.update(press('a'))
  assert.equal(gallery.screens[0]?.kind, 'gallery')
  gallery.update(press('b'))
  assert.equal(gallery.screens[0]?.kind, 'menu')
}

// --- determinism ------------------------------------------------------------------------------

{
  const trace = (seed: number) => {
    const game = make(seed, { demo: true })
    for (let i = 0; i < 60 * 60 * 2 && !game.over; i++) game.update(idle())
    return JSON.stringify([
      game.stage,
      game.round,
      game.me,
      game.lives,
      game.paint,
    ])
  }
  assert.equal(trace(11), trace(11), 'the attract demo replays exactly')
}

// --- pilot probe: runs still end, the attract demo scores 0 ----------------------------------

{
  let demoEnded = 0
  for (let seed = 1; seed <= 8; seed++) {
    const demo = make(seed, { demo: true })
    for (let t = 0; t < 60 * 60 * 10 && !demo.over; t++) demo.update(idle())
    assert.equal(demo.score, 0, 'the attract demo scores 0')
    if (demo.over) demoEnded++
  }
  assert.ok(demoEnded >= 6, `attract runs end on their own (${demoEnded}/8)`)
  // Rounds with a chaser (Boing) or a boss: standing still is never safe for long.
  for (const stage of [1, 7, 9, 5, 11]) {
    const game = make(20 + stage)
    game.startStage(stage)
    for (let t = 0; t < 60 * 60 * 10 && !game.over; t++) game.update(idle())
    assert.ok(game.over, `an idle run on stage ${stage} ends`)
    assert.ok(game.score < 3_000_000, 'under the plausibility ceiling')
  }
}

console.log('Pixel Hop Painted Planets (Candy, Rondo and Glacier) passed')
