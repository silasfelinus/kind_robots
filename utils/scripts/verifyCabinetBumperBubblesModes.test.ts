// Bumper Bubbles depth pass, slice 5 (conductor kr-arcade/t-063): the mode menu (The Climb, Floor
// Select, Pop Party, Endless Fizz, Time Trial and the Star Board), per-floor stars and wing
// medals, and tower co-op for one to four robots. Each rule is pinned on a staged game.
//
//   npx tsx utils/scripts/verifyCabinetBumperBubblesModes.test.ts
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { ARCADE_GAMES } from '../arcade/games'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import { create } from '../arcade/games/bumperBubbles'
import type { BumperSave } from '../arcade/games/bumperBubbles'
import {
  MENU,
  PARTY_LAST,
  TOTAL_FLOORS,
  clock,
  emptyStars,
  fizzClock,
  partyFloor,
  readBest,
  readStars,
  selectableFloors,
  starsEarned,
  topFloor,
  trialMedal,
  trialPar,
  trialWings,
  withStars,
  wingMedal,
} from '../arcade/bumperBubbles/modes'

// A loose view of the game's insides, for staging.
type G = {
  update(input: InputFrame, players?: InputFrame[]): void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}
const quiet = { play: () => {} }
function game(
  options: { players?: number; resume?: unknown; demo?: boolean } = {},
): G {
  return create({
    rng: mulberry32(3),
    sound: quiet,
    demo: options.demo ?? false,
    hiScore: 0,
    players: options.players,
    resume: options.resume,
  }) as unknown as G
}
const press = (...buttons: Array<keyof InputFrame['held']>) => {
  const f = emptyInput()
  for (const b of buttons) {
    f.held[b] = true
    f.pressed[b] = true
  }
  return f
}
/** Walk the menu cursor to an entry and start it (left/right first, if given). */
function choose(
  g: G,
  id: (typeof MENU)[number]['id'],
  ...side: Array<'left' | 'right'>
) {
  const want = MENU.findIndex((m) => m.id === id)
  for (let i = 0; i < 20 && g.menu.cursor !== want; i++) g.update(press('down'))
  assert.equal(g.menu.cursor, want)
  for (const s of side) g.update(press(s))
  for (let i = 0; i < 10; i++) g.update(emptyInput())
  g.update(press('a'))
}
/** Play on, with each floor's grumps cleared away, until `done` or the ticks run out. */
function clearUntil(g: G, done: () => boolean, ticks = 60_000) {
  for (let t = 0; t < ticks && !done(); t++) {
    if (g.phase === 'play') {
      g.grumps = []
      g.bubbles = []
      g.boss = null
    }
    g.update(emptyInput())
  }
}

// --- pure helpers ------------------------------------------------------------------------------
{
  assert.equal(TOTAL_FLOORS, 100)
  assert.equal(emptyStars().length, 100)
  assert.equal(readStars(undefined), emptyStars())
  assert.equal(readStars('12'), null, 'the wrong length is no star string')
  assert.equal(readStars('x'.repeat(100)), null)
  assert.equal(readBest({ '11': 5 }), null, 'there is no wing 11')
  assert.deepEqual(readBest({ '3': 4000 }), { '3': 4000 })
  assert.equal(starsEarned({ lost: false, ticks: 900 }), 3)
  assert.equal(starsEarned({ lost: false, ticks: 2000 }), 2)
  assert.equal(starsEarned({ lost: true, ticks: 900 }), 2)
  assert.equal(starsEarned({ lost: true, ticks: 2000 }), 1)
  let s = withStars(emptyStars(), 5, 2)
  s = withStars(s, 5, 1)
  assert.equal(s[4], '2', 'a floor keeps its best stars')
  assert.equal(topFloor(s), 5)
  assert.equal(selectableFloors(s), 6, 'one floor past the highest cleared')
  assert.equal(
    selectableFloors(emptyStars(), 3),
    21,
    'a saved wing opens its first floor',
  )
  assert.equal(trialWings(s), 1)
  assert.equal(trialWings(withStars(emptyStars(), 35, 1)), 4)
  // Wing medals: bronze, silver, gold by the weakest floor.
  let w = emptyStars()
  for (let f = 1; f <= 10; f++) w = withStars(w, f, 3)
  assert.equal(wingMedal(w, 1), 3)
  w = withStars(w, 4, 0)
  assert.equal(wingMedal(w, 1), 3, 'withStars never lowers a floor')
  const part = '3333333330' + '0'.repeat(90)
  assert.equal(wingMedal(part, 1), 0, 'one floor short earns nothing')
  assert.equal(wingMedal('2323232323' + '0'.repeat(90), 1), 2)
  assert.equal(trialMedal(trialPar(2), 2), 3)
  assert.equal(trialMedal(trialPar(2) * 1.2, 2), 2)
  assert.equal(trialMedal(trialPar(2) * 3, 2), 1)
  assert.equal(clock(60 * 61 + 30), '1:01.5')
  assert.equal(partyFloor(1), 1)
  assert.equal(PARTY_LAST, 91)
  const [warn1, fizz1] = fizzClock(1)
  const [, fizz50] = fizzClock(50)
  assert.ok(
    fizz50 < fizz1 && warn1 < fizz1,
    'Old Flat Fizz arrives sooner each floor',
  )
  assert.ok(fizzClock(500)[1] >= 600, 'but never under ten seconds')
}

// --- the menu ----------------------------------------------------------------------------------
{
  assert.equal(game({ demo: true }).menu, null, 'the attract demo has no menu')
  const g = game()
  assert.ok(g.menu, 'a new game opens on the menu')
  const lvl = g.level
  const tick = g.roundTicks
  for (let i = 0; i < 40; i++) g.update(emptyInput())
  assert.equal(g.roundTicks, tick, 'the world waits on the menu')
  assert.equal(g.music, null)
  // The Climb starts the tower as it always did.
  choose(g, 'climb')
  assert.equal(g.menu, null)
  assert.equal(g.mode, 'climb')
  assert.equal(g.level, lvl)
  // A saved wing offers to continue first; B then opens the menu.
  const resumed = game({
    resume: { v: 1, wing: 3, score: 1000, letters: '' } satisfies BumperSave,
  })
  assert.ok(resumed.offer && !resumed.menu)
  resumed.update(press('b'))
  assert.ok(!resumed.offer && resumed.menu)
  // A records-only save (stars, no wing to continue) goes straight to the menu.
  const records = game({
    resume: {
      v: 1,
      wing: 1,
      score: 0,
      letters: '',
      stars: withStars(emptyStars(), 1, 3),
    } satisfies BumperSave,
  })
  assert.ok(records.menu && !records.offer)
  // The star board is a screen of the menu and returns to it.
  choose(records, 'stars')
  assert.ok(records.menu.board)
  for (let i = 0; i < 12; i++) records.update(emptyInput())
  records.update(press('a'))
  assert.ok(records.menu && !records.menu.board)
}

// --- stars -------------------------------------------------------------------------------------
{
  const g = game()
  choose(g, 'climb')
  g.setPhase('play')
  clearUntil(g, () => g.level === 2)
  assert.equal(g.level, 2)
  assert.equal(g.save.stars[0], '3', 'a fast, clean clear earns three stars')
  // A robot lost on a floor costs a star; a slow clear costs another.
  g.setPhase('play')
  g.lostThisFloor = true
  g.roundTicks = 3000
  clearUntil(g, () => g.level === 3)
  assert.equal(g.save.stars[1], '1', 'cleared, but slow and bonked')
  // Replaying a floor never lowers its best.
  g.startFloor(2)
  g.setPhase('play')
  clearUntil(g, () => g.level === 3)
  assert.equal(g.save.stars[1], '3', 'a better clear raises the stars')
}

// --- Floor Select ------------------------------------------------------------------------------
{
  let stars = emptyStars()
  for (let f = 1; f <= 14; f++) stars = withStars(stars, f, 2)
  const g = game({ resume: { v: 1, wing: 1, score: 0, letters: '', stars } })
  choose(g, 'select', 'right', 'right')
  assert.equal(g.mode, 'select')
  assert.equal(g.level, 3)
  // Right past the last reached floor wraps to floor 1; left from 1 reaches the last.
  const h = game({ resume: { v: 1, wing: 1, score: 0, letters: '', stars } })
  choose(h, 'select', 'left')
  assert.equal(h.level, 15, 'one floor past the highest cleared')
  // A Floor Select climb below the saved wing leaves that save alone.
  const k = game({ resume: { v: 1, wing: 4, score: 9000, letters: '', stars } })
  k.update(press('b'))
  choose(k, 'select', 'left')
  assert.equal(k.level, 31)
  k.startFloor(11)
  assert.equal(
    k.save.wing,
    4,
    'a lower floor does not overwrite the saved wing',
  )
}

// --- Pop Party ---------------------------------------------------------------------------------
{
  const g = game()
  choose(g, 'party')
  assert.equal(g.mode, 'party')
  assert.equal(g.grumps.length, 0, 'no grump walks free at the party')
  const held = g.bubbles.filter((b: { held: unknown }) => b.held)
  assert.ok(held.length >= 3, 'every grump starts held in a bubble')
  const before = g.save
  // The party visits one floor of each wing and ends with a result card.
  clearUntil(g, () => !!g.result)
  assert.ok(g.result, 'the party ends')
  assert.equal(g.level, PARTY_LAST)
  assert.match(g.result.title, /PARTY/)
  assert.equal(g.save, before, 'the party never touches the climb save')
  assert.ok(g.score >= 10_000, 'a finished party pays its bonus')
  for (let i = 0; i < 130; i++) g.update(emptyInput())
  g.update(press('a'))
  assert.equal(g.over, true)
}

// --- Endless Fizz ------------------------------------------------------------------------------
{
  const g = game()
  choose(g, 'fizz')
  assert.equal(g.mode, 'fizz')
  g.startFloor(99)
  g.setPhase('play')
  clearUntil(g, () => g.level === 100)
  g.setPhase('play')
  clearUntil(g, () => g.level === 101)
  assert.equal(g.level, 101, 'floor 100 does not end Endless Fizz')
  assert.notEqual(g.phase, 'ending')
  assert.equal(g.save, null, 'Endless Fizz keeps no save')
}

// --- Time Trial --------------------------------------------------------------------------------
{
  const g = game()
  choose(g, 'trial')
  assert.equal(g.mode, 'trial')
  assert.equal(g.level, 1)
  clearUntil(g, () => !!g.result)
  assert.ok(g.result, 'ten floors end the trial')
  assert.equal(g.level, 10)
  assert.match(g.result.title, /WING 1/)
  const best = g.save.best['1']
  assert.ok(
    best > 0 && best === g.trialTicks,
    'the time is kept as the wing best',
  )
  assert.ok(
    g.save.stars.slice(0, 10) !== '0000000000',
    'trial floors earn stars',
  )
}

// --- co-op -------------------------------------------------------------------------------------
{
  const meta = ARCADE_GAMES.find((m) => m.slug === 'bumper-bubbles')!
  assert.equal(meta.maxPlayers, 4, 'the cabinet seats four')
  const g = game({ players: 3 })
  choose(g, 'climb')
  assert.equal(g.robots.length, 3)
  const frames = [press('right'), press('left'), emptyInput()]
  g.setPhase('play')
  for (let i = 0; i < 30; i++) g.update(frames[2]!, frames)
  assert.ok(g.robots[0].x !== g.robots[1].x, 'each seat steers its own robot')
  assert.equal(g.lives, 3 + 3 - 1, 'the team shares its robots')
}

console.log('bumper bubbles (slice 5): ok')
