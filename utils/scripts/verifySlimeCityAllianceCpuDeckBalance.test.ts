// Controlled Alliance CPU/deck investigation: the SAME opponent, seed,
// lead/ally, and seat across baseline, board-aware CPU and two starter mixes.
// AI-versus-AI evidence is diagnostic, not a PvP or subjective-fun verdict.
import assert from 'node:assert/strict'
import {
  allianceProblems,
  allianceStarter,
  allianceStarterWithMix,
  STARTER_CARD_IDS,
  type AllianceDeck,
} from '../slimeCity/alliance'
import {
  CLASH_ROUND_LIMIT,
  applyClashCommand,
  chooseClashCpu,
  createClash,
  replayClash,
  type ClashCpuPolicy,
} from '../slimeCity/clash'
import {
  TEAMS,
  cardById,
  type Side,
  type TeamId,
} from '../slimeCity/prototypes'

const crews = TEAMS.map((crew) => crew.id)
type Trial = 'legacy' | 'board-aware' | 'fighter-forward' | 'ally-forward'
type Score = {
  games: number
  wins: number
  draws: number
  rounds: number
  creaturePlays: number
  evolvedPlays: number
  thirdStagePlays: number
}
const empty = (): Score => ({
  games: 0,
  wins: 0,
  draws: 0,
  rounds: 0,
  creaturePlays: 0,
  evolvedPlays: 0,
  thirdStagePlays: 0,
})
const plans = [
  'legacy',
  'board-aware',
  'fighter-forward',
  'ally-forward',
] as const
const all = () =>
  Object.fromEntries(plans.map((plan) => [plan, empty()])) as Record<
    Trial,
    Score
  >
const totals = all()
const byGeneral = Object.fromEntries(
  crews.map((team) => [team, all()]),
) as Record<TeamId, Record<Trial, Score>>
const byAlly = Object.fromEntries(crews.map((team) => [team, all()])) as Record<
  TeamId,
  Record<Trial, Score>
>
const bySeat: Record<Side, Record<Trial, Score>> = {
  player: all(),
  enemy: all(),
}

for (const general of crews)
  for (const ally of crews.filter((team) => team !== general))
    for (const plan of plans) {
      const deck = deckFor(general, ally, plan)
      assert.deepEqual(
        allianceProblems(deck),
        [],
        'legal ' + plan + ' ' + general + '/' + ally,
      )
      assert.ok(
        deck.cards.every((id) => STARTER_CARD_IDS.has(id)),
        'all presets fit the free starter collection',
      )
      assert.equal(new Set(deck.cards).size, 20)
    }

function deckFor(general: TeamId, ally: TeamId, plan: Trial): AllianceDeck {
  switch (plan) {
    case 'legacy':
    case 'board-aware':
      return allianceStarter(general, ally)
    case 'fighter-forward':
      return allianceStarterWithMix(general, ally, 'fighter-forward')
    case 'ally-forward':
      return allianceStarterWithMix(general, ally, 'ally-forward')
  }
}

function match(
  deck: AllianceDeck,
  opponent: AllianceDeck,
  seat: Side,
  seed: number,
  plan: Trial,
): 'win' | 'loss' | 'draw' {
  const first = seat === 'player' ? deck : opponent
  const second = seat === 'player' ? opponent : deck
  const options = { alliance: { player: first, enemy: second } }
  let state = createClash(first.general, second.general, seed, options)
  let evolvedPlays = 0
  let thirdStagePlays = 0
  let creaturePlays = 0
  for (let step = 0; !state.victor && step < 2400; step++) {
    const cpu: ClashCpuPolicy =
      state.active === seat && plan !== 'legacy'
        ? 'evolution-aware'
        : 'baseline'
    const command = chooseClashCpu(state, state.active, cpu)
    if (state.active === seat && command.t === 'play') {
      const level = state.levels[seat][command.card] ?? 1
      if (level >= 2) evolvedPlays++
      if (level >= 3) thirdStagePlays++
      if (cardById(command.card).kind === 'creature') creaturePlays++
    }
    const next = applyClashCommand(state, command)
    assert.notStrictEqual(next, state, 'CPU must not make no-op decisions')
    state = next
  }
  assert.ok(state.victor, 'match must end')
  assert.ok(state.round <= CLASH_ROUND_LIMIT, 'Clash round limit')
  if (seed % 101 === 0 && plan === 'board-aware') {
    const again = replayClash(
      first.general,
      second.general,
      seed,
      state.commands,
      options,
    )
    assert.deepEqual(again.boss, state.boss)
    assert.deepEqual(again.levels, state.levels)
    assert.equal(again.victor, state.victor)
    replays++
  }
  const outcome =
    state.victor === 'draw' ? 'draw' : state.victor === seat ? 'win' : 'loss'
  for (const tally of [
    totals[plan],
    byGeneral[deck.general][plan],
    byAlly[deck.ally][plan],
    bySeat[seat][plan],
  ]) {
    tally.games++
    tally.rounds += state.round
    tally.evolvedPlays += evolvedPlays
    tally.thirdStagePlays += thirdStagePlays
    tally.creaturePlays += creaturePlays
    if (outcome === 'win') tally.wins++
    if (outcome === 'draw') tally.draws++
  }
  return outcome
}

let scenarios = 0
let replays = 0
let cpuChangedOutcome = 0
let fighterChangedOutcome = 0
let allyChangedOutcome = 0
for (const general of crews)
  for (const ally of crews.filter((team) => team !== general))
    for (const rival of crews.filter((team) => team !== general))
      for (const trial of [0, 1])
        for (const seat of ['player', 'enemy'] as const) {
          const rivalOptions = crews.filter((team) => team !== rival)
          const rivalAlly =
            rivalOptions[(crews.indexOf(ally) + trial) % rivalOptions.length]!
          const opponent = allianceStarter(rival, rivalAlly)
          const seed =
            37601 +
            crews.indexOf(general) * 2011 +
            crews.indexOf(ally) * 273 +
            crews.indexOf(rival) * 31 +
            trial * 503
          const outcomes = {} as Record<Trial, 'win' | 'loss' | 'draw'>
          for (const plan of plans)
            outcomes[plan] = match(
              deckFor(general, ally, plan),
              opponent,
              seat,
              seed,
              plan,
            )
          if (outcomes.legacy !== outcomes['board-aware']) cpuChangedOutcome++
          if (outcomes.legacy !== outcomes['fighter-forward'])
            fighterChangedOutcome++
          if (outcomes.legacy !== outcomes['ally-forward']) allyChangedOutcome++
          scenarios++
        }

assert.equal(scenarios, 600, 'all lead/ally/rival combinations and both seats')
for (const plan of plans) {
  assert.equal(totals[plan].games, 600)
  for (const crew of crews) {
    assert.equal(byGeneral[crew][plan].games, 100)
    assert.equal(byAlly[crew][plan].games, 100)
  }
  assert.equal(bySeat.player[plan].games, 300)
  assert.equal(bySeat.enemy[plan].games, 300)
}
const pct = (data: Score) =>
  ((100 * data.wins) / Math.max(1, data.games - data.draws)).toFixed(1) + '%'
const report = (group: Record<Trial, Score>) =>
  plans
    .map((plan) => {
      const s = group[plan]
      return plan + '=' + pct(s)
    })
    .join(', ')

console.log(
  'Alliance CPU and deck controlled trials: ' +
    scenarios +
    ' matched matchups / ' +
    scenarios * plans.length +
    ' completed CPU Clashes, ' +
    replays +
    ' deterministic replays PASS',
)
console.log('  overall: ' + report(totals))
for (const crew of crews) {
  console.log('  general ' + crew + ': ' + report(byGeneral[crew]))
  console.log('  ally ' + crew + ': ' + report(byAlly[crew]))
}
for (const side of ['player', 'enemy'] as const)
  console.log('  seat ' + side + ': ' + report(bySeat[side]))
console.log(
  '  changed outcomes relative to old CPU and classic decks: board-aware ' +
    cpuChangedOutcome +
    '/600, fighter-forward ' +
    fighterChangedOutcome +
    '/600, ally-forward ' +
    allyChangedOutcome +
    '/600',
)
for (const plan of plans) {
  const s = totals[plan]
  console.log(
    '  plays ' +
      plan +
      ': creatures=' +
      s.creaturePlays +
      ', at L2+=' +
      s.evolvedPlays +
      ', at L3=' +
      s.thirdStagePlays +
      ', mean rounds=' +
      (s.rounds / s.games).toFixed(1),
  )
}
console.log('  Diagnostic CPU controls; not a human-play balance verdict.')
