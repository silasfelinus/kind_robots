import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createContext, runInContext } from 'node:vm'

type Tile = {
  id: number
  kind: string
  color?: number
  special?: string | null
  hp?: number
} | null
type Goal = { type: string; target: number; progress: number; color?: number }
type State = {
  rows: number
  cols: number
  board: Tile[][]
  gloom: number[][]
  goals: Goal[]
  movesLeft: number
  score: number
  over: boolean
  won: boolean
  stats: Record<string, number>
}
type Phase = { created: Array<{ special: string }>; cleared: unknown[] }
type Engine = {
  createLevelState: (def: unknown, opts?: unknown) => State
  findRuns: (s: State) => unknown[]
  findMove: (s: State) => number[][] | null
  canSwap: (s: State, a: number[], b: number[]) => boolean
  trySwap: (
    s: State,
    a: number[],
    b: number[],
  ) => { ok: boolean; phases: Phase[]; outcome?: string }
  bestMove: (s: State, limit?: number) => number[][] | null
  clone: <T>(v: T) => T
  finishBonus: (s: State) => { bonus: number }
  starsFor: (s: State, t: number[]) => number
}
type LevelDef = {
  id: string
  goals: Goal[]
  moves: number
  stars: number[]
  finale: boolean
  rows: number
  cols: number
  mask: number[][] | null
}
type Levels = {
  REGIONS: Record<string, { tier: number; next?: string[]; ending?: string }>
  ROUTE_ORDER: string[]
  ENDINGS: Record<string, { id: string }>
  CHARACTERS: Array<{ id: string; perk: string }>
  allLevels: () => string[]
  routeLevels: (r: unknown) => string[]
  parseLevelId: (id: string) => { region: string; n: number }
  buildLevel: (region: string, n: number) => LevelDef
}
type Slot = {
  levels: Record<string, { stars: number; best: number }>
  endings: string[]
  scrapbook: string[]
  route: { tier1: string | null; tier2: string | null }
  quests: {
    daily: Array<{ id: string; progress: number }>
    weekly: unknown[]
    dailyKey: string
  }
  sparkles: number
  character: string
}
type Meta = {
  createSlot: (c: string, now?: number) => Slot
  refreshQuests: (s: Slot, d: Date) => boolean
  commitLevel: (
    s: Slot,
    r: unknown,
    l: Levels,
    now?: number,
  ) => { ending: string | null; secretEnding: boolean; achievements: unknown[] }
  exportSlot: (s: Slot) => string
  importSlot: (code: string) => Slot | null
  levelUnlocked: (s: Slot, l: Levels, id: string) => boolean
  pendingFork: (s: Slot, l: Levels) => string | null
  chooseRoute: (s: Slot, l: Levels, id: string) => boolean
  scrapbookCatalog: (l: Levels) => unknown[]
  load: (storage: unknown) => {
    slots: unknown[]
    settings: Record<string, unknown>
  }
  ACHIEVEMENTS: unknown[]
  DAILY_POOL: unknown[]
  WEEKLY_POOL: unknown[]
}

function must<T>(value: T | null | undefined, label = 'value'): T {
  assert.ok(value !== undefined && value !== null, `${label} is missing`)
  return value as T
}
const region = (id: string) => must(L.REGIONS[id], `region ${id}`)

const root = new URL('../../', import.meta.url)
const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(path, root)), 'utf8')
const context = createContext({ console, btoa, atob }) as Record<
  string,
  unknown
>
for (const file of ['engine', 'levels', 'meta'])
  runInContext(read(`public/hopeful-hues/${file}.js`), context)
const E = context.HopefulHuesEngine as Engine
const L = context.HopefulHuesLevels as Levels
const M = context.HopefulHuesMeta as Meta

// World shape: a long branching map with four route endings and a secret fifth.
assert.equal(L.ROUTE_ORDER.length, 7)
const all = L.allLevels()
assert.equal(
  all.length,
  130,
  'expected 130 authored-by-seed levels across seven regions',
)
assert.equal(new Set(all).size, all.length)
for (const id of ['salon', 'grove', 'garden'])
  assert.equal(region(id).next?.length, 2, `${id} forks two ways`)
const tier2 = L.ROUTE_ORDER.filter((id) => region(id).tier === 2)
assert.equal(tier2.length, 4)
assert.deepEqual(
  new Set(tier2.map((id) => region(id).ending)),
  new Set(['lullaby', 'parade', 'highscore', 'letters']),
)
assert.ok(L.ENDINGS.everyone, 'secret ending exists')
assert.equal(L.CHARACTERS.length, 4)
assert.equal(
  new Set(L.CHARACTERS.map((c) => c.perk)).size,
  4,
  'each hero has a distinct perk',
)
assert.ok(
  L.routeLevels({ tier1: 'grove', tier2: 'meadow' }).length >= 55,
  'one playthrough route is at least 55 levels long',
)

for (const id of all) {
  const { region, n } = L.parseLevelId(id)
  const def = L.buildLevel(region, n)
  assert.deepEqual(def, L.buildLevel(region, n), `${id} is deterministic`)
  assert.ok(def.goals.length >= 1, `${id} has a goal`)
  assert.ok(def.moves >= 10 && def.moves <= 50, `${id} moves ${def.moves}`)
  assert.ok(
    must(def.stars[1]) < must(def.stars[2]),
    `${id} star thresholds ascend`,
  )
  const state = E.createLevelState(def)
  assert.equal(E.findRuns(state).length, 0, `${id} starts without free matches`)
  assert.ok(E.findMove(state), `${id} starts with a legal move`)
  for (const goal of def.goals)
    assert.ok(goal.target > 0, `${id} ${goal.type} target`)
}
assert.ok(
  L.buildLevel('meadow', 19).finale,
  'tier-two region ends with a finale',
)

// Special tiles: 4 in a line -> comb, 5 -> rainbow dye, L/T -> glitter bomb.
function craftedState(
  paint: Array<[number, number]>,
  swapTarget: [number, number],
) {
  const def = {
    id: 'craft',
    rows: 6,
    cols: 6,
    colors: 6,
    moves: 10,
    goals: [{ type: 'score', target: 99999 }],
    seed: 7,
  }
  const state = E.createLevelState(def)
  for (let r = 0; r < 6; r++)
    for (let c = 0; c < 6; c++)
      must(state.board[r])[c] = {
        id: 1000 + r * 6 + c,
        kind: 'gem',
        color: (r * 2 + c) % 5,
        special: null,
      }
  for (const [r, c] of paint) must(must(state.board[r])[c]).color = 5
  must(must(state.board[swapTarget[0]])[swapTarget[1]]).color = 5
  return state
}
const four = craftedState(
  [
    [2, 0],
    [2, 1],
    [2, 3],
  ],
  [1, 2],
)
const fourResult = E.trySwap(four, [1, 2], [2, 2])
assert.ok(fourResult.ok)
assert.ok(
  ['h', 'v'].includes(fourResult.phases[0]?.created[0]?.special ?? ''),
  'four in a line makes a Rainbow Comb',
)
const five = craftedState(
  [
    [2, 0],
    [2, 1],
    [2, 3],
    [2, 4],
  ],
  [1, 2],
)
assert.equal(
  E.trySwap(five, [1, 2], [2, 2]).phases[0]?.created[0]?.special,
  'rainbow',
  'five makes a Rainbow Dye',
)
const ell = craftedState(
  [
    [2, 0],
    [2, 1],
    [3, 2],
    [4, 2],
  ],
  [1, 2],
)
assert.equal(
  E.trySwap(ell, [1, 2], [2, 2]).phases[0]?.created[0]?.special,
  'bomb',
  'an L makes a Glitter Bomb',
)

// An invalid swap costs nothing; the Back button restores exactly.
const level = E.createLevelState(L.buildLevel('salon', 5))
const before = E.clone(level)
let invalid: number[][] | null = null
for (let r = 0; r < level.rows && !invalid; r++)
  for (let c = 0; c + 1 < level.cols && !invalid; c++)
    if (!E.canSwap(level, [r, c], [r, c + 1]))
      invalid = [
        [r, c],
        [r, c + 1],
      ]
assert.ok(invalid)
assert.equal(E.trySwap(level, must(invalid![0]), must(invalid![1])).ok, false)
assert.deepEqual(level, before, 'an invalid swap leaves the board untouched')
const move = E.bestMove(level)!
const snapshot = E.clone(level)
E.trySwap(level, must(move[0]), must(move[1]))
assert.equal(level.movesLeft, snapshot.movesLeft - 1)
const replay = E.clone(snapshot)
const replayMove = E.trySwap(replay, must(move[0]), must(move[1]))
assert.ok(replayMove.ok)
assert.deepEqual(
  replay.board,
  level.board,
  'a restored snapshot replays deterministically, so Back is exact',
)

// Every level is winnable by a greedy one-move-lookahead player, at most with the +5 move gift.
let cleanWins = 0
const boosted: string[] = []
for (const id of all) {
  const { region, n } = L.parseLevelId(id)
  const def = L.buildLevel(region, n)
  const state = E.createLevelState(def)
  let boosts = 0
  for (let guard = 0; guard < 200 && !state.won; guard++) {
    if (state.over) {
      if (boosts >= 2) break
      boosts++
      state.over = false
      state.movesLeft += 5
    }
    const next = E.bestMove(state)
    assert.ok(next, `${id} always has a move`)
    E.trySwap(state, must(next![0]), must(next![1]))
  }
  assert.ok(state.won, `${id} must be winnable by the test player`)
  if (boosts) boosted.push(id)
  else cleanWins++
  E.finishBonus(state)
  assert.ok(E.starsFor(state, def.stars) >= 1)
}
assert.ok(
  cleanWins / all.length >= 0.9,
  `only ${cleanWins}/${all.length} levels won without gifts: ${boosted.join(', ')}`,
)

// Saves, quests, progression, routes, endings and scrapbook.
const slot = M.createSlot('kate', Date.UTC(2026, 10, 23))
M.refreshQuests(slot, new Date(2026, 10, 23, 12))
assert.equal(slot.quests.daily.length, 3)
assert.equal(slot.quests.weekly.length, 3)
const sameDay = M.createSlot('kate')
M.refreshQuests(sameDay, new Date(2026, 10, 23, 20))
assert.deepEqual(
  sameDay.quests.daily.map((q) => q.id),
  slot.quests.daily.map((q) => q.id),
  'daily quests are stable within a day',
)
assert.equal(
  M.refreshQuests(slot, new Date(2026, 10, 24, 9)),
  true,
  'daily quests refresh the next day',
)
assert.ok(M.DAILY_POOL.length >= 10 && M.WEEKLY_POOL.length >= 6)
assert.ok(M.ACHIEVEMENTS.length >= 30)

assert.equal(M.levelUnlocked(slot, L, 'salon-1'), true)
assert.equal(M.levelUnlocked(slot, L, 'salon-2'), false)
const stats = {
  cleared: 30,
  combs: 1,
  bombs: 0,
  rainbows: 0,
  combos: 0,
  cascadesMax: 2,
  bigCascades: 0,
  gloomCleared: 0,
  tanglesCleared: 0,
  buddiesRescued: 0,
  undos: 1,
  colorsCleared: [5, 5, 5, 5, 5, 5],
}
M.commitLevel(
  slot,
  { levelId: 'salon-1', won: true, stars: 2, score: 5000, stats },
  L,
)
assert.equal(must(slot.levels['salon-1']).stars, 2)
assert.equal(M.levelUnlocked(slot, L, 'salon-2'), true)
for (let n = 2; n <= 18; n++) slot.levels['salon-' + n] = { stars: 1, best: 1 }
assert.equal(M.pendingFork(slot, L), 'salon')
assert.equal(M.levelUnlocked(slot, L, 'grove-1'), true)
assert.equal(
  M.levelUnlocked(slot, L, 'meadow-1'),
  false,
  'far regions stay locked until their parent is finished',
)
assert.ok(M.chooseRoute(slot, L, 'grove'))
for (let n = 1; n <= 18; n++) slot.levels['grove-' + n] = { stars: 1, best: 1 }
assert.equal(M.pendingFork(slot, L), 'grove')
for (const [tier1, tier2s] of [
  ['grove', ['meadow', 'carnival']],
  ['garden', ['arcade', 'lighthouse']],
] as const) {
  for (let n = 1; n <= 18; n++)
    slot.levels[tier1 + '-' + n] = { stars: 1, best: 1 }
  for (const t2 of tier2s) {
    assert.ok(M.chooseRoute(slot, L, t2))
    for (let n = 1; n < 19; n++)
      slot.levels[t2 + '-' + n] = { stars: 1, best: 1 }
    const report = M.commitLevel(
      slot,
      { levelId: t2 + '-19', won: true, stars: 3, score: 99999, stats },
      L,
    )
    assert.equal(report.ending, region(t2).ending)
  }
}
assert.ok(
  slot.endings.includes('everyone'),
  'all four route endings reveal the secret ending',
)
assert.ok(slot.scrapbook.includes('ending:everyone'))
assert.ok(M.scrapbookCatalog(L).length >= 70)

const code = M.exportSlot(slot)
const restored = M.importSlot(code)
assert.ok(restored)
assert.equal(
  JSON.stringify(restored!.levels),
  JSON.stringify(slot.levels),
  'export/import round-trips a save',
)
assert.equal(M.importSlot('not a save'), null)
const memory: Record<string, string> = {}
const loaded = M.load({
  getItem: (k: string) => memory[k] ?? null,
  setItem: (k: string, v: string) => (memory[k] = v),
})
assert.equal(loaded.slots.length, 3, 'three save slots')
assert.equal(
  loaded.settings.backLimit,
  'unlimited',
  'Back is unlimited by default',
)

// Wiring into Kind Robots.
const html = read('public/hopeful-hues/index.html')
for (const file of ['engine', 'levels', 'meta', 'art', 'audio', 'app']) {
  assert.ok(html.includes(`./${file}.js`), `index loads ${file}.js`)
  assert.ok(
    existsSync(fileURLToPath(new URL(`public/hopeful-hues/${file}.js`, root))),
  )
}
assert.ok(
  read('pages/play/hopeful-hues.vue').includes(
    '/hopeful-hues/index.html?embedded=1',
  ),
)
assert.ok(
  read('content/channels/arcade/hopeful-hues.md').includes(
    'route: /play/hopeful-hues',
  ),
)
assert.ok(read('utils/projectPlacements.ts').includes("'hopeful-hues'"))
// Silas, 2026-11-22 PT: a front-end Play page with a home highlight and Play link, not an Arcade cabinet.
const tab = read('content/channels/arcade/hopeful-hues.md')
assert.ok(!/requiredRole/.test(tab), 'the Play tab is public')
for (const art of ['splash', 'tutorial', 'highlight', 'link-preview', 'icon']) {
  assert.ok(
    existsSync(
      fileURLToPath(new URL(`public/hopeful-hues/front/${art}.webp`, root)),
    ),
    `${art} art exists`,
  )
}
assert.ok(
  tab.includes('image: /hopeful-hues/front/splash.webp'),
  'Play link has art',
)
assert.ok(
  read('components/home/home-visitor-directory.vue').includes(
    "image: '/hopeful-hues/front/highlight.webp'",
  ),
  'home highlight entry with art',
)
assert.ok(
  read('utils/sharePreview.ts').includes(
    "image: '/hopeful-hues/front/link-preview.webp'",
  ),
  'share card',
)
assert.ok(
  !read('utils/adverts/posters.ts').includes('hopeful-hues'),
  'not an Arcade cabinet poster',
)
assert.ok(
  !existsSync(fileURLToPath(new URL('pages/admin/hopeful-hues.vue', root))),
  'no admin copy remains',
)

const app = read('public/hopeful-hues/app.js')
for (const needle of [
  'undoMove',
  'hopeful-hues:open',
  'openScrapbook',
  'openQuests',
  'openAchievements',
  'openSettings',
  'openRoutes',
  'showEnding',
  'startMusic',
]) {
  assert.ok(app.includes(needle), `app wires ${needle}`)
}

console.log(
  `Hopeful Hues contract OK: ${all.length} levels, ${cleanWins} won without gifts, ${boosted.length} with the +5 gift.`,
)
