// Butterfly Joust depth pass, slice 4 (conductor kr-arcade/t-050): the medals and the Endless Pond.
// Every tourney wave offers Unbonked (no butterfly lost), Air Ace (an x4 Air Combo) and Quick Lance
// (under par), a bout offers two, and the medal board keeps them per garden in the save. The Endless
// Pond is the leaderboard event: one garden drawn from the seed, endless waves with every rider.
// Each rule is pinned on a staged wave.
import assert from 'node:assert/strict'
import { mulberry32 } from '../arcade/curve'
import { emptyInput } from '../arcade/types'
import type { InputFrame } from '../arcade/types'
import { create } from '../arcade/games/butterflyJoust'
import { ARENAS, RAINBOW_LISTS } from '../arcade/butterflyJoust/arenas'
import { readJoustSave } from '../arcade/butterflyJoust/campaign'
import type { JoustSave } from '../arcade/butterflyJoust/campaign'
import {
  CHAMPION_PAR,
  MEDALS,
  MEDAL_IDS,
  MEDAL_PAY,
  boardRows,
  boardTotal,
  cellMedals,
  medalKey,
  parTicks,
  readMedals,
  waveParSeconds,
} from '../arcade/butterflyJoust/medals'
import {
  ENDLESS_CYCLE,
  ENDLESS_POOL,
  endlessArena,
  endlessCount,
  endlessRider,
  endlessWaveKind,
} from '../arcade/butterflyJoust/endless'
import { ROSTER } from '../arcade/butterflyJoust/roster'
import { COMBO_ACE } from '../arcade/butterflyJoust/rules'

type Rider = { alive: boolean; bestCombo: number; invuln: number }
type Inner = {
  score: number
  level: number
  lives: number
  over: boolean
  mode: string
  menu: { pick: number; board: boolean } | null
  arena: { id: string; champion: string | null; waves: unknown[] }
  wave: number
  card: number
  waveKind: string
  waveTicks: number
  diedThisWave: boolean
  riders: Rider[]
  rivals: { kind: string }[]
  cocoons: unknown[]
  carriers: unknown[]
  champion: unknown
  medals: Record<string, number>
  medalShow: { won: string[]; fresh: string[] } | null
  endlessBest: number
  banner: { text: string; sub?: string; lines?: string[] } | null
  readonly save: unknown
  menuRows(): Array<{ id: string; about: string }>
  update(input: InputFrame, players?: InputFrame[]): void
  startArena(index: number): void
  nextWave(): void
  checkWave(): void
  loseLife(r: Rider): void
}

const quiet = { play() {} }
function game(
  options: { players?: number; resume?: unknown; seed?: number } = {},
) {
  return create({
    rng: mulberry32(options.seed ?? 9),
    sound: quiet,
    demo: false,
    hiScore: 0,
    players: options.players,
    resume: options.resume,
  }) as unknown as Inner
}
function press(...buttons: (keyof InputFrame['held'])[]): InputFrame {
  const f = emptyInput()
  for (const b of buttons) {
    f.held[b] = true
    f.pressed[b] = true
  }
  return f
}
/** Move the mode card's cursor to the row with this id, and press A on it. */
function pick(g: Inner, id: string) {
  const at = g.menuRows().findIndex((row) => row.id === id)
  assert.ok(at >= 0, `the card offers ${id}`)
  for (let i = 0; i < at; i++) g.update(press('down'))
  g.update(press('a'))
}
const index = (id: string) => ARENAS.findIndex((a) => a.id === id)
/** A tourney wave staged and emptied, as if its last rider had just been bonked. */
function stage(id: string, wave: number, g = game()) {
  if (g.menu) g.update(press('a'))
  g.startArena(index(id))
  g.card = 0
  g.wave = wave - 1
  g.nextWave()
  g.card = 0
  g.rivals = []
  g.cocoons = []
  g.carriers = []
  g.banner = null
  return g
}
/** Ring the bell on a staged wave after `seconds`. */
function ring(g: Inner, seconds: number) {
  g.waveTicks = seconds * 60
  g.checkWave()
}

// --- the medals as data ----------------------------------------------------------------------
{
  assert.deepEqual(MEDAL_IDS, ['unbonked', 'ace', 'quick'])
  assert.equal(
    new Set(MEDAL_IDS.map((id) => MEDALS[id].bit)).size,
    3,
    'each medal has its own bit',
  )
  const rows = boardRows()
  assert.deepEqual(
    rows.map((r) => r.arena.id),
    [...ARENAS.map((a) => a.id), RAINBOW_LISTS.id],
    'a board row per garden, then the Rainbow Lists',
  )
  for (const row of rows) {
    const bouts = row.cells.filter((c) => c.bout)
    assert.equal(
      bouts.length,
      row.arena.champion ? 1 : 0,
      `${row.arena.id}: one bout cell when there is a champion`,
    )
    assert.equal(row.cells.length, row.arena.waves.length + bouts.length)
    for (const cell of row.cells) {
      assert.equal(cell.key, medalKey(row.arena.id, cell.wave))
      assert.ok(
        parTicks(row.arena, cell.wave) > 60 * 10,
        'par is never a sprint',
      )
    }
    assert.ok(row.cells.length <= 8, `${row.arena.id}: the row fits the board`)
  }
  assert.deepEqual(
    cellMedals({ bout: true }),
    ['unbonked', 'quick'],
    'a bout has no Air Ace',
  )
  assert.deepEqual(cellMedals({ bout: false }), MEDAL_IDS)
  const empty = boardTotal({})
  assert.equal(empty.won, 0)
  assert.equal(
    empty.of,
    rows.reduce(
      (n, r) => n + r.cells.reduce((m, c) => m + cellMedals(c).length, 0),
      0,
    ),
  )
  // Par: more riders, more time; a cocoon wave has its chore; a bout reads its champion.
  assert.ok(waveParSeconds('joust', 5) > waveParSeconds('joust', 3))
  assert.ok(waveParSeconds('cocoon', 0) > waveParSeconds('joust', 0))
  assert.ok(waveParSeconds('storm', 3) > waveParSeconds('joust', 3))
  const sunset = ARENAS[0]!
  assert.equal(
    parTicks(sunset, sunset.waves.length + 1),
    CHAMPION_PAR[sunset.champion as keyof typeof CHAMPION_PAR] * 60,
  )
  // A saved board is checked cell by cell: unknown cells, stray bits and junk are dropped.
  assert.deepEqual(
    readMedals({
      'sunset-1': 7,
      'sunset-7': 7,
      'nowhere-1': 7,
      'moon-2': 1.5,
      'meadow-3': 'x',
      'heights-2': 0,
    }),
    { 'sunset-1': 7, 'sunset-7': 5 },
    'a bout cell keeps no Air Ace bit; odd cells are dropped',
  )
  assert.deepEqual(readMedals(null), {})
  assert.deepEqual(readMedals([1, 2]), {})
}

// --- medals at the bell ----------------------------------------------------------------------
{
  // A clean, quick wave with an x4 combo: all three, each paid, the board and the save updated.
  const g = stage('sunset', 1)
  assert.equal(g.mode, 'tourney')
  g.riders[0]!.bestCombo = COMBO_ACE
  const before = g.score
  ring(g, 5)
  assert.deepEqual(g.medalShow?.won, ['unbonked', 'ace', 'quick'])
  assert.deepEqual(g.medalShow?.fresh, ['unbonked', 'ace', 'quick'])
  assert.equal(g.medals['sunset-1'], 7)
  assert.ok(g.score - before >= MEDAL_PAY * 3, 'each medal pays')
  assert.ok(g.banner?.lines?.some((l) => l.startsWith('MEDALS')))
  const saved = readJoustSave(g.save) as JoustSave
  assert.equal(saved.medals['sunset-1'], 7, 'won medals are kept at once')

  // Won again: no longer fresh, the board unchanged.
  const again = stage('sunset', 1, g)
  again.riders[0]!.bestCombo = COMBO_ACE
  ring(again, 5)
  assert.deepEqual(again.medalShow?.fresh, [])
  assert.equal(again.medals['sunset-1'], 7)
}
{
  // Slow, a combo short, and a butterfly lost: nothing.
  const g = stage('sunset', 2)
  g.riders[0]!.bestCombo = COMBO_ACE - 1
  g.diedThisWave = true
  ring(g, 9999)
  assert.equal(g.medalShow, null, 'no medals, no strip')
  assert.equal(g.medals['sunset-2'], undefined)
}
{
  // Over par but clean: Unbonked only, and the board adds to what it had.
  const g = stage('meadow', 2)
  ring(g, 9999)
  assert.deepEqual(g.medalShow?.won, ['unbonked'])
  assert.equal(g.medals['meadow-2'], MEDALS.unbonked.bit)
  const h = stage('meadow', 2, g)
  h.diedThisWave = true
  ring(h, 1)
  assert.equal(h.medals['meadow-2'], MEDALS.unbonked.bit | MEDALS.quick.bit)
  // A party earns them together: anyone's x4 is the team's Air Ace.
  const p = stage('meadow', 3, game({ players: 2 }))
  p.riders[1]!.bestCombo = COMBO_ACE
  ring(p, 9999)
  assert.deepEqual(p.medalShow?.won, ['unbonked', 'ace'])
}
{
  // The medal wiring reads the real game: a lost life marks the wave, the combo is tracked.
  const g = stage('sunset', 3)
  g.riders[0]!.invuln = 0
  g.loseLife(g.riders[0]!)
  assert.equal(g.diedThisWave, true)
}
{
  // A bout: two medals at most, never an Air Ace.
  const g = stage('sunset', ARENAS[0]!.waves.length + 1)
  assert.ok(g.champion, 'the bout is staged')
  // The champion bested (a stand-in that has finished its tumble).
  g.champion = { done: true, busy: () => false }
  g.riders[0]!.bestCombo = COMBO_ACE
  ring(g, 10)
  assert.deepEqual(g.medalShow?.won, ['unbonked', 'quick'])
  assert.equal(
    g.medals[medalKey('sunset', ARENAS[0]!.waves.length + 1)],
    MEDALS.unbonked.bit | MEDALS.quick.bit,
  )
}

// --- medals belong to the tourney ------------------------------------------------------------
{
  const g = game()
  pick(g, 'classic')
  g.rivals = []
  g.cocoons = []
  g.carriers = []
  g.riders[0]!.bestCombo = COMBO_ACE
  ring(g, 1)
  assert.equal(g.medalShow, null, 'the Classic Pond keeps no medals')
  assert.deepEqual(g.medals, {})
}

// --- the medal board on the mode card ---------------------------------------------------------
{
  const g = game()
  const rows = g.menuRows().map((r) => r.id)
  assert.deepEqual(rows, ['tourney', 'endless', 'classic', 'medals'])
  assert.deepEqual(
    game({ players: 2 })
      .menuRows()
      .map((r) => r.id),
    ['tourney', 'endless', 'classic', 'versus', 'medals'],
  )
  assert.equal(
    g.menuRows().at(-1)!.about,
    `0 OF ${boardTotal({}).of} MEDALS WON`,
  )
  pick(g, 'medals')
  assert.ok(g.menu?.board, 'the board opens over the card')
  g.update(press('down'))
  g.update(press('a'))
  assert.ok(g.menu && !g.menu.board, 'any button closes it, back on the card')
  assert.equal(g.mode, 'tourney', 'nothing started')
}
{
  // The board comes back with the device, and stays through a new tourney's save.
  const first = stage('sunset', 1)
  ring(first, 5)
  const g = game({ resume: first.save })
  assert.ok(g.medals['sunset-1'])
  assert.ok(
    g
      .menuRows()
      .at(-1)!
      .about.startsWith(`${boardTotal(g.medals).won} OF`),
  )
  pick(g, 'tourney')
  assert.deepEqual(
    (readJoustSave(g.save) as JoustSave).medals,
    g.medals,
    'a new tourney keeps the board',
  )
  // An older save (before the medals) still reads: it simply has none yet.
  const old = { ...(first.save as Record<string, unknown>) }
  delete old.medals
  delete old.endless
  const read = readJoustSave(old) as JoustSave
  assert.deepEqual(read.medals, {})
  assert.equal(read.endless, 0)
  assert.ok(JSON.stringify(first.save).length < 8 * 1024)
}

// --- the Endless Pond ---------------------------------------------------------------------------
{
  // The pool: every rider in the roster, each unlocked in time.
  assert.deepEqual(
    new Set(ENDLESS_POOL.map((p) => p.kind)),
    new Set(Object.keys(ROSTER)),
    'every rider turns up',
  )
  for (let wave = 1; wave <= 30; wave++) {
    for (let k = 0; k < 20; k++) {
      const kind = endlessRider(wave, k / 20)
      const from = ENDLESS_POOL.find((p) => p.kind === kind)!.from
      assert.ok(wave >= from, `wave ${wave}: ${kind} is not out yet`)
    }
  }
  assert.equal(endlessRider(1, 0), 'drifter')
  assert.notEqual(endlessRider(40, 0), 'drifter', 'the drifters thin out')
  assert.equal(endlessCount(1), 2)
  assert.equal(endlessCount(99), 8)
  assert.equal(
    endlessWaveKind(9, 1),
    'survival',
    'solo, the Team wave is Survival',
  )
  assert.equal(endlessWaveKind(9, 2), 'team')
  assert.ok(ENDLESS_CYCLE.includes('lantern'))
  assert.equal(endlessArena(0), ARENAS[0])
  assert.equal(endlessArena(0.9999), ARENAS[ARENAS.length - 1])
}
{
  const g = game({ seed: 4 })
  pick(g, 'endless')
  assert.equal(g.mode, 'endless')
  assert.ok(
    ARENAS.some((a) => a === (g.arena as unknown)),
    'one of the six gardens',
  )
  const twin = game({ seed: 4 })
  pick(twin, 'endless')
  assert.equal(twin.arena.id, g.arena.id, 'the seed picks the garden')
  const ids = new Set<string>()
  for (let seed = 1; seed <= 24; seed++) {
    const e = game({ seed })
    pick(e, 'endless')
    ids.add(e.arena.id)
  }
  assert.ok(ids.size >= 4, 'the pond is not always the same garden')
  assert.equal(g.level, 1)
  assert.equal(g.rivals.length, endlessCount(1))
  // The bell: no medals, but the pond's best wave is kept at once.
  g.card = 0
  g.rivals = []
  g.cocoons = []
  g.carriers = []
  ring(g, 1)
  assert.equal(g.medalShow, null)
  assert.equal(g.endlessBest, 1)
  assert.equal((readJoustSave(g.save) as JoustSave).endless, 1)
  assert.equal(
    (readJoustSave(g.save) as JoustSave).arena,
    0,
    'the pond leaves no tourney to continue',
  )
  // A party faces one more rider per extra seat.
  const p = game({ players: 3, seed: 4 })
  pick(p, 'endless')
  assert.equal(p.rivals.length, endlessCount(1) + 2)
  // The best comes back on the card.
  const back = game({ resume: g.save })
  assert.equal(back.endlessBest, 1)
  assert.ok(back.menuRows().some((r) => r.about.endsWith('BEST: WAVE 1')))
  // Game over says how far the pond held you.
  const over = game({ seed: 4 })
  pick(over, 'endless')
  over.card = 0
  over.level = 6
  over.lives = 1
  for (const r of over.riders) r.invuln = 0
  over.loseLife(over.riders[0]!)
  assert.equal(over.banner?.text, 'GAME OVER')
  assert.equal(over.banner?.sub, 'NEW BEST: WAVE 5')
}
{
  // The pond's waves climb: deeper waves bring more riders and the later ones.
  const g = game({ seed: 2 })
  pick(g, 'endless')
  const seen = new Set<string>()
  for (let wave = 2; wave <= 14; wave++) {
    g.nextWave()
    for (const r of g.rivals) seen.add(r.kind)
  }
  assert.equal(g.level, 14)
  assert.ok(seen.has('diver') || seen.has('lancer'), 'the later riders arrive')
}
{
  // The demo never touches the board or the pond's best.
  const d = create({
    rng: mulberry32(3),
    sound: quiet,
    demo: true,
    hiScore: 0,
  }) as unknown as Inner
  for (let t = 0; t < 60 * 60 * 2 && !d.over; t++) d.update(emptyInput())
  assert.equal(d.score, 0)
  assert.deepEqual(d.medals, {})
  assert.equal(d.save, undefined)
}

console.log('verifyCabinetButterflyJoustMedals: ok')
