// Paired story-bonus benchmark. Same decks and seed for baseline, protect,
// gamble and both seat assignments. CPU evidence, not a PvP win-rate target.
import assert from 'node:assert/strict'
import {
  CLASH_BOSS_HP,
  CLASH_ROUND_LIMIT,
  applyClashCommand,
  chooseClashCpu,
  createClash,
  replayClash,
} from '../slimeCity/clash'
import { allianceStarter, type AllianceDeck } from '../slimeCity/alliance'
import { allianceTacticEdge } from '../slimeCity/campaignAllianceTactics'
import { clashBossesFromTerms } from '../slimeCity/clashBouts'
import { TEAMS, type Side, type TeamId } from '../slimeCity/prototypes'

type Variant = 'baseline' | 'protect' | 'gamble'
type Score = { games: number; wins: number; draws: number }
const variants = ['baseline', 'protect', 'gamble'] as const
const crews = TEAMS.map((crew) => crew.id)
const score = (): Score => ({ games: 0, wins: 0, draws: 0 })
const scores = (): Record<Variant, Score> => ({
  baseline: score(),
  protect: score(),
  gamble: score(),
})
const total = scores()
const byGeneral = Object.fromEntries(
  crews.map((crew) => [crew, scores()]),
) as Record<TeamId, Record<Variant, Score>>
const byAlly = Object.fromEntries(
  crews.map((crew) => [crew, scores()]),
) as Record<TeamId, Record<Variant, Score>>
const bySeat: Record<Side, Record<Variant, Score>> = {
  player: scores(),
  enemy: scores(),
}
let cases = 0
let replays = 0
let protectChanged = 0
let gambleChanged = 0
let choicesDisagreed = 0

function play(
  lead: AllianceDeck,
  rival: AllianceDeck,
  seat: Side,
  chapter: number,
  variant: Variant,
  seed: number,
): 'win' | 'loss' | 'draw' {
  const edge =
    variant === 'baseline'
      ? { player: 0, enemy: 0 }
      : allianceTacticEdge(lead.ally, chapter, variant)
  assert.ok(edge)
  const bosses = clashBossesFromTerms({
    playerBossLife: seat === 'player' ? edge.player : edge.enemy,
    enemyBossLife: seat === 'player' ? edge.enemy : edge.player,
  })
  const first = seat === 'player' ? lead : rival
  const second = seat === 'player' ? rival : lead
  const options = { alliance: { player: first, enemy: second }, bosses }
  let state = createClash(first.general, second.general, seed, options)
  assert.equal(state.format, 'alliance')
  assert.deepEqual(state.boss, bosses)
  for (let step = 0; !state.victor && step < 2400; step++) {
    const next = applyClashCommand(state, chooseClashCpu(state, state.active))
    assert.notStrictEqual(next, state, 'CPU must progress')
    state = next
  }
  assert.ok(state.victor, 'seeded story Clash must terminate')
  assert.ok(state.round <= CLASH_ROUND_LIMIT)
  if (chapter === 0 && variant === 'protect' && seed % 17 === 0) {
    const replay = replayClash(
      first.general,
      second.general,
      seed,
      state.commands,
      options,
    )
    assert.deepEqual(replay.boss, state.boss)
    assert.equal(replay.victor, state.victor)
    replays++
  }
  const outcome =
    state.victor === 'draw'
      ? 'draw'
      : state.victor === seat
        ? 'win'
        : 'loss'
  for (const group of [
    total[variant],
    byGeneral[lead.general][variant],
    byAlly[lead.ally][variant],
    bySeat[seat][variant],
  ]) {
    group.games++
    if (outcome === 'win') group.wins++
    if (outcome === 'draw') group.draws++
  }
  return outcome
}

assert.equal(crews.length, 6)
assert.equal(CLASH_BOSS_HP, 40)
for (const general of crews) {
  const allies = crews.filter((crew) => crew !== general)
  for (const foe of crews) {
    if (foe === general) continue
    const foeAllies = crews.filter((crew) => crew !== foe)
    for (let chapter = 0; chapter < 5; chapter++) {
      const deck = allianceStarter(general, allies[chapter]!)
      for (let trial = 0; trial < 2; trial++) {
        const foeAlly = foeAllies[
          (crews.indexOf(general) + chapter + trial) % foeAllies.length
        ]!
        const opponent = allianceStarter(foe, foeAlly)
        const seed =
          24201 +
          crews.indexOf(general) * 2003 +
          crews.indexOf(foe) * 173 +
          chapter * 29 +
          trial * 607
        for (const seat of ['player', 'enemy'] as const) {
          const original = play(deck, opponent, seat, chapter, 'baseline', seed)
          const protect = play(deck, opponent, seat, chapter, 'protect', seed)
          const gamble = play(deck, opponent, seat, chapter, 'gamble', seed)
          if (original !== protect) protectChanged++
          if (original !== gamble) gambleChanged++
          if (protect !== gamble) choicesDisagreed++
          cases++
        }
      }
    }
  }
}
assert.equal(cases, 600)
for (const variant of variants) {
  assert.equal(total[variant].games, 600)
  for (const crew of crews) {
    assert.equal(byGeneral[crew][variant].games, 100)
    assert.equal(byAlly[crew][variant].games, 100)
  }
  assert.equal(bySeat.player[variant].games, 300)
  assert.equal(bySeat.enemy[variant].games, 300)
}
const pct = (data: Score): string =>
  ((100 * data.wins) / Math.max(1, data.games - data.draws)).toFixed(1) + '%'
const summary = (group: Record<Variant, Score>): string =>
  variants.map((kind) => kind + '=' + pct(group[kind])).join(', ')

console.log(
  'Alliance controlled balance: 600 matched setups / 1800 real Clashes; ' +
    replays +
    ' deterministic replays PASS',
)
console.log('  overall ' + summary(total))
for (const crew of crews)
  console.log('  general ' + crew + ': ' + summary(byGeneral[crew]))
for (const crew of crews)
  console.log('  ally ' + crew + ': ' + summary(byAlly[crew]))
for (const seat of ['player', 'enemy'] as const)
  console.log('  seat ' + seat + ': ' + summary(bySeat[seat]))
console.log(
  '  paired differences: protect versus baseline ' +
    protectChanged +
    '/600; gamble versus baseline ' +
    gambleChanged +
    '/600; protect versus gamble ' +
    choicesDisagreed +
    '/600',
)
console.log(
  '  Diagnostic only: do not assert faction win percentages as acceptance ' +
    'criteria. CPU strategy and starter deck composition limit conclusions.',
)
