import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { create } from '../arcade/games/ribbonRiders'
import { emptyInput } from '../arcade/types'
import { GRID, T } from '../arcade/ribbonRiders/grid'
import {
  FAIRGROUNDS,
  RAINBOW_SPOOL,
  SECRET_FAIR_INDEX,
  arenaById,
  openEvents,
} from '../arcade/ribbonRiders/fairgrounds'
import type {
  ClockworkConductor,
  LoomSpinner,
} from '../arcade/ribbonRiders/lateMarshals'
import { makeMarshal, type MarshalHost } from '../arcade/ribbonRiders/marshals'
import { RIVALS } from '../arcade/ribbonRiders/rivals'
import { readFestivalSave, newKit } from '../arcade/ribbonRiders/festival'
import type { FestivalSave } from '../arcade/ribbonRiders/festival'

function host() {
  const clock = { beat: 0, clears: 0, bumps: 0, sayings: [] as string[] }
  const hooks: MarshalHost = {
    beat: () => clock.beat,
    terrainAt: () => T.FLOOR,
    ribbonAt: () => false,
    bikeAt: () => false,
    clearCell: () => {
      clock.clears++
    },
    bumpAt: () => {
      clock.bumps++
    },
    freezeIce: () => {},
    meltBankAt: () => false,
    spawnPonies: () => {},
    player: () => ({ x: 24, y: 41 }),
    say: (message) => {
      clock.sayings.push(message)
    },
    sfx: () => {},
    burst: () => {},
  }
  return { clock, hooks }
}

{
  const clockwork = FAIRGROUNDS[2]!
  const starlight = FAIRGROUNDS[3]!
  for (const fair of [clockwork, starlight]) {
    assert.equal(fair.arenas.length, 6)
    const walked = new Set<string>()
    const walk = (id: string) => {
      if (walked.has(id)) return
      walked.add(id)
      for (const n of arenaById(fair, id).next) walk(n)
    }
    walk(fair.arenas[0]!.id)
    assert.equal(walked.size, 6, `${fair.id}: all events reachable`)
    assert.deepEqual(openEvents(fair, new Set()), [fair.arenas[0]!.id])
    for (const arena of fair.arenas) {
      assert.ok(arena.tickets > 0)
      assert.ok(arena.par > 0)
      for (const kind of arena.crew) {
        assert.ok(RIVALS[kind].tell && RIVALS[kind].answer)
      }
    }
  }
  assert.ok(
    clockwork.arenas.some((a) => a.features.some((f) => f.kind === 'gate')),
  )
  assert.ok(starlight.arenas.some((a) => a.wrap?.x))
  assert.equal(arenaById(clockwork, 'marshal').marshal, 'conductor')
  assert.equal(arenaById(starlight, 'marshal').marshal, 'loom')
  assert.equal(arenaById(clockwork, 'cb-stalls').limit, 60 * 80)
  assert.equal(arenaById(starlight, 'sl-stars').limit, 60 * 85)
}

{
  const { clock, hooks } = host()
  const marshal = makeMarshal('conductor', hooks) as ClockworkConductor
  assert.equal(marshal.phase, 1)
  assert.equal(marshal.targets().length, 0, 'attached coaches are not targets')
  for (let car = 0; car < 5; car++) {
    clock.beat = car
    marshal.update()
    const old = marshal.targets()
    assert.equal(old.length, 9, 'one coach uncouples on the chime')
    const field = new Uint8Array(GRID * GRID)
    marshal.paint(field)
    assert.equal(field.filter((cell) => cell === 2).length, 9)
    assert.ok(field.includes(1) || car === 4)
    assert.ok(marshal.wrapped(new Set(old)), `coach ${car + 1} wraps`)
    assert.equal(marshal.coaches, car + 1)
    if (car < 4) {
      assert.equal(marshal.targets().length, 0)
      assert.ok(!marshal.wrapped(new Set(old)), 'cannot claim the next coach before the chime')
    }
  }
  assert.equal(marshal.phase, 2)
  assert.equal(marshal.hits, 1)
  const track0 = new Uint8Array(GRID * GRID)
  marshal.paint(track0)
  assert.ok(
    track0.includes(1) && track0.includes(2),
    'tracks and hub are solid',
  )
  clock.beat = 6
  marshal.update()
  const track1 = new Uint8Array(GRID * GRID)
  marshal.paint(track1)
  assert.notDeepEqual(track0, track1, 'the track switches on the clock beat')
  assert.ok(clock.clears > 0 && clock.bumps > 0)
  assert.ok(marshal.wrapped(new Set(marshal.targets())))
  assert.equal(marshal.phase, 3)
  assert.equal(marshal.hits, 2)
  const from = marshal.engineX
  for (let tick = 0; tick < 15; tick++) marshal.update()
  assert.notEqual(marshal.engineX, from, 'the loose engine moves')
  assert.ok(marshal.wrapped(new Set(marshal.targets())))
  assert.equal(marshal.hits, 3)
  assert.ok(marshal.defeated)
  assert.equal(marshal.targets().length, 0)
  assert.ok(!marshal.wrapped(new Set([0])), 'no double reward after defeat')
  assert.equal(clock.sayings.filter((s) => s === 'A COACH UNCOUPLES!').length, 5)
}

{
  const { clock, hooks } = host()
  const marshal = makeMarshal('loom', hooks) as LoomSpinner
  assert.equal(marshal.phase, 1)
  const shuttles = marshal.threads()
  assert.ok(shuttles.length > 0, 'shuttles have real collision cells')
  const field = new Uint8Array(GRID * GRID)
  marshal.paint(field)
  assert.ok(field.includes(1) && field.includes(2), 'shuttles and hub painted')
  clock.beat = 1
  marshal.update()
  assert.notDeepEqual(shuttles, marshal.threads(), 'gaps move on a beat')
  assert.ok(clock.bumps > 0 && clock.clears > 0)
  assert.ok(marshal.wrapped(new Set(marshal.targets())))
  assert.equal(marshal.phase, 2)
  assert.ok(marshal.threads().length > shuttles.length, 'grid is denser')
  assert.ok(marshal.wrapped(new Set(marshal.targets())))
  assert.equal(marshal.phase, 3)
  assert.equal(marshal.threadKnots().length, 4)
  assert.equal(marshal.targets().length, 20)
  assert.ok(!marshal.wrapped(new Set([marshal.targets()[0]!])), 'a partial thread is not captured')
  assert.ok(!marshal.wrapped(new Set([24 * GRID + 24])), 'hub locked until all four threads are claimed')
  for (let n = 0; n < 4; n++) {
    const knot = marshal.threadKnots()[0]!
    assert.ok(marshal.wrapped(new Set(knot)))
    assert.equal(marshal.threadKnots().length, 3 - n)
    assert.ok(!marshal.wrapped(new Set(knot)), 'a claimed shuttle cannot score twice')
    assert.equal(marshal.hits, 2)
  }
  assert.deepEqual(marshal.threads(), [])
  assert.equal(marshal.targets().length, 9)
  assert.ok(marshal.wrapped(new Set(marshal.targets())))
  assert.equal(marshal.hits, 3)
  assert.ok(marshal.defeated)
}

{
  const game = create({
    rng: mulberry32(21),
    sound: { play: () => {} },
    demo: false,
    hiScore: 0,
  }) as unknown as {
    playArena: (arena: (typeof FAIRGROUNDS)[number]['arenas'][number]) => void
    marshal: { kind: string; phase: number } | null
    ready: number
    over: boolean
    update: (frame: ReturnType<typeof emptyInput>) => void
  }
  for (const index of [2, 3]) {
    const fair = FAIRGROUNDS[index]!
    game.playArena(arenaById(fair, 'marshal'))
    assert.equal(game.marshal?.kind, index === 2 ? 'conductor' : 'loom')
    game.ready = 0
    for (let tick = 0; tick < 120 && !game.over; tick++)
      game.update(emptyInput())
    assert.ok(game.marshal?.phase, 'the Marshal remains wired to the game loop')
  }
}

{
  const parade = arenaById(FAIRGROUNDS[3]!, 'sl-parade')
  assert.equal(parade.objective, 'escort')
  assert.equal(parade.escort?.health, 3)
  assert.ok(parade.limit && parade.limit > 0)
  const run = () =>
    create({
      rng: mulberry32(4),
      sound: { play: () => {} },
      demo: false,
      hiScore: 0,
    }) as unknown as {
      playArena: (arena: typeof parade) => void
      cells: Uint8Array
      timeLeft: number
      escortLastX: number
      escortHits: number
      roundClear: number
      lives: number
      checkRoundOver: () => void
    }
  const safe = run()
  safe.playArena(parade)
  safe.cells[32 * GRID + 5] = 1
  safe.checkRoundOver()
  assert.equal(safe.escortHits, 0, 'own ribbons cannot harm the float')
  safe.timeLeft = 0
  safe.checkRoundOver()
  assert.ok(safe.roundClear > 0, 'the protected moon reaches its destination')

  const tangled = run()
  tangled.playArena(parade)
  for (const x of [5, 6, 7]) {
    tangled.timeLeft = parade.limit! - Math.ceil(((x - 5) * parade.limit!) / 37)
    tangled.escortLastX = x - 1
    tangled.cells[32 * GRID + x] = 5
    tangled.checkRoundOver()
    assert.equal(tangled.escortHits, x - 4, 'enemy ribbon tangles the float')
  }
  assert.equal(tangled.lives, 2, 'three tangles cost one rider')
}

{
  const champion = create({
    rng: mulberry32(8),
    sound: { play: () => {} },
    demo: false,
    hiScore: 0,
  }) as unknown as {
    finishFestival: () => void
    menu: { kind: string } | null
    save: { champion: boolean; fair: number } | null
    update: (frame: ReturnType<typeof emptyInput>) => void
  }
  champion.finishFestival()
  assert.equal(champion.menu?.kind, 'credits')
  assert.equal(champion.save?.champion, true)
  assert.equal(champion.save?.fair, 0, 'the trophy resumes a fresh festival')
  for (let i = 0; i < 10; i++) champion.update(emptyInput())
  const next = emptyInput()
  next.pressed.a = true
  champion.update(next)
  assert.equal(champion.menu?.kind, 'title', 'credits return to the title')
}

{
  type Arena = (typeof FAIRGROUNDS)[number]['arenas'][number]
  type SecretProbe = {
    save: FestivalSave | null
    fair: number
    roundTicks: number
    kidWrapped: boolean
    escortHits: number
    cleared: Set<string>
    goldenBows: string[]
    titleChoices: string[]
    menu: { kind: string } | null
    marshal: { kind: string } | null
    trueEnding: boolean
    openFairground(fair: number): void
    playArena(arena: Arena): void
    clearEvent(arena: Arena): void
    afterClear(): void
    chooseTitle(choice: string): void
    openTitle(): void
  }
  const run = (resume?: FestivalSave) =>
    create({
      rng: mulberry32(42),
      sound: { play: () => {} },
      demo: false,
      hiScore: 0,
      selectScreen: true,
      resume,
    }) as unknown as SecretProbe

  const legacy: FestivalSave = {
    v: 1,
    fair: 0,
    score: 0,
    lives: 3,
    tickets: 0,
    kit: newKit(),
    continued: false,
    champion: false,
  }
  assert.deepEqual(readFestivalSave(legacy), legacy)
  assert.equal(
    readFestivalSave({ ...legacy, fair: SECRET_FAIR_INDEX }),
    null,
    'a locked secret checkpoint cannot be loaded',
  )
  const game = run(legacy)
  assert.ok(!game.titleChoices.includes('spool'))
  game.chooseTitle('spool')
  assert.equal(game.menu?.kind, 'title', 'locked choice cannot enter')

  for (const [i, fair] of FAIRGROUNDS.entries()) {
    const special = fair.arenas.find((a) => a.special)!
    game.openFairground(i)
    game.playArena(special)
    game.roundTicks = special.par + 1
    game.clearEvent(special)
    assert.equal(game.goldenBows.length, i, 'late clears do not earn gold')
    game.roundTicks = special.par
    game.kidWrapped = true
    game.clearEvent(special)
    assert.equal(game.goldenBows.length, i, 'wrapping a friend loses gold')
    game.kidWrapped = false
    if (special.objective === 'escort') {
      game.escortHits = 1
      game.clearEvent(special)
      assert.equal(game.goldenBows.length, i, 'a damaged float loses gold')
      game.escortHits = 0
    }
    game.clearEvent(special)
    game.clearEvent(special)
    assert.equal(game.goldenBows.length, i + 1, 'one bow per fairground')
    assert.deepEqual(game.save?.goldenBows, game.goldenBows)
  }
  const bows = game.goldenBows
  assert.deepEqual(
    readFestivalSave({
      ...legacy,
      goldenBows: [...bows, bows[0], 'fake'],
    })?.goldenBows,
    bows,
  )
  const restored = run(game.save!)
  assert.ok(restored.titleChoices.includes('spool'))
  restored.chooseTitle('spool')
  assert.equal(restored.fair, SECRET_FAIR_INDEX)
  assert.equal(restored.save?.fair, SECRET_FAIR_INDEX)
  assert.equal(restored.menu?.kind, 'board')
  assert.ok(readFestivalSave(restored.save))
  for (const arena of RAINBOW_SPOOL.arenas) {
    assert.deepEqual(openEvents(RAINBOW_SPOOL, restored.cleared), [arena.id])
    restored.playArena(arena)
    assert.equal(restored.marshal?.kind ?? null, arena.marshal ?? null)
    restored.clearEvent(arena)
    restored.afterClear()
    if (arena.next.length) assert.equal(restored.menu?.kind, 'board')
  }
  assert.equal(restored.menu?.kind, 'credits')
  assert.equal(restored.trueEnding, true)
  assert.equal(restored.save?.trueChampion, true)
  assert.equal(restored.save?.champion, true)
  assert.equal(restored.save?.fair, 0)
  assert.deepEqual(restored.save?.goldenBows, bows)
}

{
  const game = create({
    rng: mulberry32(88),
    sound: { play: () => {} },
    demo: false,
    hiScore: 0,
  }) as unknown as {
    playArena: (arena: (typeof FAIRGROUNDS)[number]['arenas'][number]) => void
    marshal: LoomSpinner
    player: { id: number }
    cells: Uint8Array
    fill: Uint8Array
    dyn: Uint8Array
    paintDyn(): void
    giftWrap(bike: { id: number }, region: number[]): void
  }
  game.playArena(arenaById(FAIRGROUNDS[3]!, 'marshal'))
  const loom = game.marshal
  assert.ok(loom.wrapped(new Set(loom.targets())))
  assert.ok(loom.wrapped(new Set(loom.targets())))
  game.paintDyn()
  const knot = loom.threadKnots()[0]!
  assert.ok(knot.every((i) => game.dyn[i] === 2))
  game.giftWrap(game.player, knot)
  assert.ok(knot.every((i) => game.dyn[i] === 0 && game.cells[i] === game.player.id && game.fill[i] === 1), 'claimed shuttles become player-owned gifts in the real engine')
}

console.log('ribbon riders late circuit and Grand Marshals: ok')
