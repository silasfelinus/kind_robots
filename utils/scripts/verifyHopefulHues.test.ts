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
  authored?: boolean
  startingSpecials?: Array<[number, number, string]>
}
type Levels = {
  REGIONS: Record<string, { tier: number; next?: string[]; ending?: string }>
  ROUTE_ORDER: string[]
  ENDINGS: Record<string, { id: string }>
  CHARACTERS: Array<{ id: string; perk: string }>
  STORY_BEATS: Record<string, Array<{ at: number }>>
  allLevels: () => string[]
  routeLevels: (r: unknown) => string[]
  lineKey: (r: unknown) => string
  parseLevelId: (id: string) => { region: string; n: number }
  buildLevel: (region: string, n: number) => LevelDef
}
type Slot = {
  levels: Record<string, { stars: number; best: number }>
  endings: string[]
  scrapbook: string[]
  achievements: Record<string, number>
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

const root = new URL('../../', import.meta.url)
const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(path, root)), 'utf8')
const context = createContext({ console, btoa, atob }) as Record<
  string,
  unknown
>
const WORLD_IDS = [
  'paradise',
  'clanktown',
  'rosewood',
  'corsair',
  'sketchbook',
  'wildflower',
  'circus',
  'dustneon',
  'lagoon',
]
runInContext(read('public/hopeful-hues/worlds/registry.js'), context)
for (const world of WORLD_IDS)
  runInContext(read(`public/hopeful-hues/worlds/${world}.js`), context)
for (const file of ['engine', 'levels', 'meta', 'art'])
  runInContext(read(`public/hopeful-hues/${file}.js`), context)
const E = context.HopefulHuesEngine as Engine
const L = context.HopefulHuesLevels as Levels
const M = context.HopefulHuesMeta as Meta

// Silas, 2026-11-23 PT: nine hero-led worlds, each a long three-region road with
// its own jewels, blockers, story, quests, achievements and ending.
type WorldPack = {
  id: string
  hero: { id: string; perk: string }
  music: { timbre: string }
  jewels: Array<{ name: string; art: string }>
  regions: Array<{ id: string; beats: Array<{ at: number }> }>
  ending: { id: string }
  quests: { daily: unknown[]; weekly: unknown[] }
  achievements: Array<{ key: string }>
  prompts: Record<string, unknown>
}
const Worlds = context.HopefulHuesWorlds as { list: () => WorldPack[] }
const worlds = Worlds.list()
assert.equal(
  worlds.map((w) => w.id).join(),
  WORLD_IDS.join(),
  'nine worlds load in order',
)
assert.equal(new Set(worlds.map((w) => w.hero.id)).size, 9, 'nine heroes')
assert.equal(new Set(worlds.map((w) => w.hero.perk)).size, 9, 'nine perks')
assert.equal(
  new Set(worlds.map((w) => w.music.timbre)).size,
  9,
  'nine instruments',
)
assert.equal(
  new Set(worlds.flatMap((w) => w.jewels.map((j) => j.art))).size,
  54,
  'every world draws its own six jewels',
)
for (const w of worlds) {
  assert.equal(w.regions.length, 3, `${w.id} has three regions`)
  assert.equal(w.quests.daily.length, 3, `${w.id} daily quests`)
  assert.equal(w.quests.weekly.length, 2, `${w.id} weekly quests`)
  assert.equal(
    w.achievements.map((a) => a.key).join(','),
    'start,middle,ending,stars,signature',
    `${w.id} achievements`,
  )
  assert.ok(L.ENDINGS[w.ending.id], `${w.id} ending registered`)
  assert.ok(
    L.routeLevels(w.id).length >= 55,
    `${w.id} is a long road of at least 55 levels`,
  )
  assert.equal(L.routeLevels(w.hero.id).join(), L.routeLevels(w.id).join())
}
assert.equal(L.ROUTE_ORDER.length, 27)
const all = L.allLevels()
assert.equal(all.length, 495, 'nine worlds of 55 levels')
assert.equal(new Set(all).size, all.length)
assert.ok(L.ENDINGS.everyone, 'secret ending exists')
assert.equal(L.CHARACTERS.length, 9)

let authoredCount = 0
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
  if (def.authored) {
    authoredCount++
    assert.ok(def.startingSpecials?.length, `${id} has a designed special`)
    for (const [r, c, special] of def.startingSpecials || [])
      assert.equal(
        state.board[r]?.[c]?.special,
        special,
        `${id} special placement`,
      )
  }
  assert.equal(
    !!def.authored,
    n % 6 === 0 || def.finale,
    `${id} authored cadence`,
  )
}
assert.equal(authoredCount, 90, 'every sixth level and every world finale')
for (const w of worlds) {
  const finale = must(w.regions[2]).id
  assert.ok(L.buildLevel(finale, 19).finale, `${w.id} ends with a finale`)
}

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
const fresh = M.createSlot('kate') as unknown as {
  tutorialDone: boolean
  tips: string[]
}
assert.equal(
  fresh.tutorialDone,
  false,
  'new saves start with the guided tutorial',
)
assert.equal(fresh.tips.length, 0, 'first-time tips start unseen')

assert.equal(M.levelUnlocked(slot, L, 'salon-1'), true)
assert.equal(M.levelUnlocked(slot, L, 'salon-2'), false)
for (const w of worlds)
  assert.equal(
    M.levelUnlocked(slot, L, must(w.regions[0]).id + '-1'),
    true,
    `${w.id} is open from the start`,
  )
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
assert.ok(slot.achievements['paradise-start'], 'world start achievement')
assert.equal(
  M.levelUnlocked(slot, L, 'carnival-1'),
  false,
  'later regions wait for the one before',
)
for (const w of worlds) {
  assert.ok(M.chooseRoute(slot, L, w.id))
  assert.equal(L.lineKey(slot), w.id, `switching to ${w.id}`)
  const [first, second, third] = w.regions.map((r) => r.id)
  for (const [rid, count] of [
    [first, 18],
    [second, 18],
    [third, 18],
  ] as const)
    for (let n = 1; n <= count; n++)
      slot.levels[rid + '-' + n] = { stars: 3, best: 1 }
  const report = M.commitLevel(
    slot,
    { levelId: third + '-19', won: true, stars: 3, score: 99999, stats },
    L,
  )
  assert.equal(report.ending, w.ending.id, `${w.id} ending reached`)
  assert.ok(slot.achievements[w.id + '-ending'], `${w.id} ending achievement`)
  assert.ok(slot.achievements[w.id + '-middle'], `${w.id} middle achievement`)
  if (w.id !== 'lagoon')
    assert.ok(!slot.endings.includes('everyone'), 'secret waits for all nine')
}
assert.ok(
  slot.endings.includes('everyone'),
  'every world ending reveals the secret ending',
)
assert.ok(slot.scrapbook.includes('ending:everyone'))
assert.ok(M.scrapbookCatalog(L).length >= 150)

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

// Silas, 2026-11-23 PT: real art for the intro bits. Every hero, region, story beat and ending has a painted slot.
const artPack = JSON.parse(read('public/hopeful-hues/art-pack.json')) as {
  slots: Array<{ slot: string; path: string; request: string }>
  front: Array<{ committed: string; artJob: number }>
}
const slotNames = new Set(artPack.slots.map((entry) => entry.slot))
for (const c of L.CHARACTERS)
  assert.ok(slotNames.has('hero:' + c.id), `hero art slot ${c.id}`)
for (const r of L.ROUTE_ORDER)
  assert.ok(slotNames.has('region:' + r), `region art slot ${r}`)
for (const e of Object.keys(L.ENDINGS))
  assert.ok(slotNames.has('ending:' + e), `ending art slot ${e}`)
for (const r of L.ROUTE_ORDER) {
  for (const beat of L.STORY_BEATS[r] ?? []) {
    if (beat.at !== 1)
      assert.ok(
        slotNames.has(`story:${r}-${beat.at}`),
        `story art slot ${r}-${beat.at}`,
      )
  }
}
for (const entry of artPack.slots)
  assert.match(
    entry.path,
    /^\/images\/hopeful-hues\/(heroes|regions|story|endings|worlds|maps)\/[a-z0-9-]+\.webp$/,
  )
for (const entry of artPack.front) {
  assert.ok(
    existsSync(fileURLToPath(new URL('public' + entry.committed, root))),
    entry.committed,
  )
  assert.ok(entry.artJob > 0, `${entry.committed} traces to an ArtJob`)
}

const app = read('public/hopeful-hues/app.js')
for (const needle of [
  'runTutorial',
  'finishTutorial',
  'tutorialDone',
  'showTip(',
  'Replay tutorial',
  'tipFor(',
  'renderCharacters',
  'burst(',
  'themeStyle(',
  'worldKeyArt(',
  'heroArt(',
  'regionArt(',
  'beatArt(',
  'endingArt(',
  "classList.add('missing')",
  'undoMove',
  'hopeful-hues:open',
  'openScrapbook',
  'openQuests',
  'openAchievements',
  'openSettings',
  'switchWorld',
  'showEnding',
  'startMusic',
]) {
  assert.ok(app.includes(needle), `app wires ${needle}`)
}

console.log(
  `Hopeful Hues contract OK: ${all.length} levels, ${cleanWins} won without gifts, ${boosted.length} with the +5 gift.`,
)
