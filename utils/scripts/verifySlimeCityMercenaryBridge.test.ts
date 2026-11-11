// Crew-neutral mercenary balance study: same opponent/seed/seat for each
// role-specific candidate; symmetric mirrors check whether everyone has the
// same neutral counterplay. CPU results are not human balance acceptance.
import assert from 'node:assert/strict'
import {
  STARTER_CARD_IDS,
  allianceProblems,
  allianceStarterWithMix,
} from '../slimeCity/alliance'
import {
  mercenaryBridgeDeck,
  mercenaryBridgePackage,
} from '../slimeCity/mercenaryBridge'
import {
  applyClashCommand,
  chooseClashCpu,
  createClash,
  CLASH_ROUND_LIMIT,
} from '../slimeCity/clash'
import {
  TEAMS,
  cardById,
  type TeamId,
  type Side,
} from '../slimeCity/prototypes'
import type { AllianceDeck } from '../slimeCity/alliance'

type Variant =
  'fighter' | 'control' | 'synergy' | 'control-mirror' | 'synergy-mirror'
type Score = {
  games: number
  wins: number
  draws: number
  rounds: number
  level3: number
}
const variants: readonly Variant[] = [
  'fighter',
  'control',
  'synergy',
  'control-mirror',
  'synergy-mirror',
]
const empty = (): Score => ({
  games: 0,
  wins: 0,
  draws: 0,
  rounds: 0,
  level3: 0,
})
const score = () =>
  Object.fromEntries(variants.map((v) => [v, empty()])) as Record<
    Variant,
    Score
  >
const crews = TEAMS.map((team) => team.id)
const total = score()
const byGeneral = Object.fromEntries(
  crews.map((team) => [team, score()]),
) as Record<TeamId, Record<Variant, Score>>
const byAlly = Object.fromEntries(
  crews.map((team) => [team, score()]),
) as Record<TeamId, Record<Variant, Score>>
const bySeat: Record<Side, Record<Variant, Score>> = {
  player: score(),
  enemy: score(),
}

const control = mercenaryBridgePackage('control')
const synergy = mercenaryBridgePackage('synergy')
assert.equal(new Set(control).size, 4)
assert.equal(new Set(synergy).size, 4)
assert.notDeepEqual(
  control,
  synergy,
  'distinct tools for protection and combos',
)
for (const pkg of [control, synergy]) {
  assert.ok(pkg.every((id) => STARTER_CARD_IDS.has(id)))
  assert.equal(pkg.filter((id) => cardById(id).kind === 'creature').length, 2)
  assert.equal(pkg.filter((id) => cardById(id).kind !== 'creature').length, 2)
}
for (const general of crews)
  for (const ally of crews) {
    if (general === ally) continue
    const baseline = allianceStarterWithMix(general, ally, 'fighter-forward')
    for (const [plan, required] of [
      ['control', control],
      ['synergy', synergy],
    ] as const) {
      const deck = mercenaryBridgeDeck(general, ally, plan)
      assert.deepEqual(allianceProblems(deck), [])
      assert.equal(deck.cards.length, 20)
      assert.equal(
        deck.cards.filter((id) => cardById(id).kind === 'creature').length,
        12,
      )
      assert.equal(
        deck.cards.filter((id) => cardById(id).team === 'mercenary').length,
        4,
      )
      assert.ok(required.every((id) => deck.cards.includes(id)))
      assert.ok(deck.cards.every((id) => STARTER_CARD_IDS.has(id)))
      assert.deepEqual(
        deck.cards.filter((id) => cardById(id).team === ally),
        baseline.cards.filter((id) => cardById(id).team === ally),
        'preserve ally identity while exchanging general cards for neutral tools',
      )
    }
  }

function play(
  deck: AllianceDeck,
  enemy: AllianceDeck,
  seat: Side,
  seed: number,
  variant: Variant,
): 'win' | 'loss' | 'draw' {
  const first = seat === 'player' ? deck : enemy
  const second = seat === 'player' ? enemy : deck
  let s = createClash(first.general, second.general, seed, {
    alliance: { player: first, enemy: second },
  })
  let level3 = 0
  for (let step = 0; !s.victor && step < 2300; step++) {
    const move = chooseClashCpu(s, s.active)
    if (
      move.t === 'play' &&
      s.active === seat &&
      (s.levels[seat][move.card] ?? 1) >= 3
    )
      level3++
    s = applyClashCommand(s, move)
  }
  assert.ok(s.victor, 'mercenary match must terminate')
  assert.ok(s.round <= CLASH_ROUND_LIMIT)
  const result =
    s.victor === 'draw' ? 'draw' : s.victor === seat ? 'win' : 'loss'
  for (const group of [
    total[variant],
    byGeneral[deck.general][variant],
    byAlly[deck.ally][variant],
    bySeat[seat][variant],
  ]) {
    group.games++
    group.rounds += s.round
    group.level3 += level3
    if (result === 'win') group.wins++
    if (result === 'draw') group.draws++
  }
  return result
}

let cases = 0
let controlFlips = 0
let synergyFlips = 0
for (const general of crews) {
  const allies = crews.filter((crew) => crew !== general)
  const rivals = crews.filter((crew) => crew !== general)
  for (const [allyIndex, ally] of allies.entries()) {
    const fighter = allianceStarterWithMix(general, ally, 'fighter-forward')
    const protectedDeck = mercenaryBridgeDeck(general, ally, 'control')
    const comboDeck = mercenaryBridgeDeck(general, ally, 'synergy')
    for (const [rivalIndex, rival] of rivals.entries()) {
      const enemyAlly = crews.filter((crew) => crew !== rival)[
        (allyIndex + rivalIndex) % 5
      ]!
      const enemy = allianceStarterWithMix(rival, enemyAlly, 'fighter-forward')
      const enemyControl = mercenaryBridgeDeck(rival, enemyAlly, 'control')
      const enemySynergy = mercenaryBridgeDeck(rival, enemyAlly, 'synergy')
      const seed =
        56311 +
        crews.indexOf(general) * 2111 +
        allyIndex * 307 +
        rivalIndex * 43
      for (const seat of ['player', 'enemy'] as const) {
        const base = play(fighter, enemy, seat, seed, 'fighter')
        const protect = play(protectedDeck, enemy, seat, seed, 'control')
        const combo = play(comboDeck, enemy, seat, seed, 'synergy')
        play(protectedDeck, enemyControl, seat, seed, 'control-mirror')
        play(comboDeck, enemySynergy, seat, seed, 'synergy-mirror')
        if (base !== protect) controlFlips++
        if (base !== combo) synergyFlips++
        cases++
      }
    }
  }
}
assert.equal(cases, 300)
for (const variant of variants) {
  assert.equal(total[variant].games, 300)
  for (const crew of crews) {
    assert.equal(byGeneral[crew][variant].games, 50)
    assert.equal(byAlly[crew][variant].games, 50)
  }
  assert.equal(bySeat.player[variant].games, 150)
  assert.equal(bySeat.enemy[variant].games, 150)
}
const pct = (s: Score) =>
  ((100 * s.wins) / Math.max(1, s.games - s.draws)).toFixed(1) + '%'
const summary = (s: Record<Variant, Score>) =>
  variants.map((variant) => variant + ' ' + pct(s[variant])).join(' | ')
console.log(
  'Mercenary bridge controlled matrix: 300 matched cases / 1500 completed ' +
    'CPU Clashes, all 30 directed partners and both seats PASS',
)
console.log('  shared control package: ' + control.join(', '))
console.log('  shared synergy package: ' + synergy.join(', '))
console.log('  overall: ' + summary(total))
for (const crew of crews) {
  console.log('  general ' + crew + ': ' + summary(byGeneral[crew]))
  console.log('  ally ' + crew + ': ' + summary(byAlly[crew]))
}
for (const seat of ['player', 'enemy'] as const)
  console.log('  seat ' + seat + ': ' + summary(bySeat[seat]))
console.log(
  '  changed outcomes vs fighter-forward: control ' +
    controlFlips +
    '/300, synergy ' +
    synergyFlips +
    '/300',
)
console.log(
  '  Equal access is not equal outcome. Do not tune a crew without paired data.',
)
