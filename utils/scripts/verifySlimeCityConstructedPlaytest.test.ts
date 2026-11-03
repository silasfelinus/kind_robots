import assert from 'node:assert/strict'
import {
  BLACKOUT_HAND_SIZE,
  MANA_CAP,
  TEAMS,
  cardById,
  deckOf,
  loadoutProblems,
  replayMatch,
  type Card,
  type TeamId,
} from '../slimeCity/prototypes'
import { GUTTER_CROWN_FINALE_A } from '../slimeCity/gutterCrownFinaleA'
import { GUTTER_CROWN_FINALE_B } from '../slimeCity/gutterCrownFinaleB'
import { playHeadless } from '../slimeCity/playtest'

/**
 * Not a substitute for human fun testing: this audit actually plays 180
 * deterministic constructed-deck games against rotated founder opponents.
 * Both factions take turns being the constructed challenger across the matrix.
 * It records stagnation and new-card use instead of asserting an arbitrary
 * win-rate threshold from small samples.
 */
const newCards = [...GUTTER_CROWN_FINALE_A, ...GUTTER_CROWN_FINALE_B]
const seeds = [37, 89] as const
const variants = ['pressure', 'clinic', 'big-finish'] as const
const report = {
  matches: 0,
  completed: 0,
  playerWins: 0,
  enemyWins: 0,
  draws: 0,
  founderPlayerWins: 0,
  founderEnemyWins: 0,
  founderDraws: 0,
  changedOutcomesAgainstFounder: 0,
  totalRounds: 0,
  deadRounds: 0,
  noContact: 0,
  firstContactSum: 0,
  contactGames: 0,
  maxDeadStreak: 0,
  cardDeploys: 0,
  newcomerDeploys: 0,
  bankedSixGames: 0,
  winPaths: {} as Record<string, number>,
  crews: {} as Record<
    string,
    {
      matches: number
      wins: number
      losses: number
      draws: number
      firstContact: number
      deadRounds: number
      newcomerDeploys: number
    }
  >,
  archetypes: [] as Array<{
    team: TeamId
    name: string
    wins: number
    draws: number
    losses: number
    newCardDeploys: number
    deadRounds: number
    firstContact: number | null
    founderWins: number
    founderDraws: number
    founderLosses: number
    changedOutcomes: number
  }>,
}

const founderControls = new Map<string, ReturnType<typeof playHeadless>>()
for (const crew of TEAMS) {
  const roster = newCards.filter((c) => c.team === crew.id)
  assert.equal(roster.length, 16)
  const creatures = roster.filter((c) => c.kind === 'creature')
  const spells = roster.filter((c) => c.kind === 'spell')
  const equipment = roster.filter((c) => c.kind === 'equipment')
  const traps = roster.filter((c) => c.kind === 'trap')
  const plans: Card[][] = [
    [creatures[0]!, creatures[2]!, spells[0]!],
    [creatures[4]!, spells[3]!, equipment[0]!],
    [creatures[5]!, spells[4]!, traps[2]!],
  ]
  const aggregate = {
    matches: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    firstContact: 0,
    deadRounds: 0,
    newcomerDeploys: 0,
  }
  report.crews[crew.id] = aggregate
  for (const [index, plan] of plans.entries()) {
    const deck = deckOf(crew.id).map((card) => card.id)
    const founderSlots = new Set<number>()
    for (const card of plan) {
      const slot = deck.findIndex(
        (id, at) =>
          !founderSlots.has(at) &&
          cardById(id).kind === card.kind &&
          !cardById(id).signature,
      )
      assert.ok(slot >= 0, crew.id + '/' + card.name + ' has a valid swap')
      founderSlots.add(slot)
      deck[slot] = card.id
    }
    assert.deepEqual(
      loadoutProblems(crew.id, deck),
      [],
      crew.id + '/' + variants[index] + ' is a legal ten-card deck',
    )
    assert.equal(deck.length, 10)
    assert.equal(new Set(deck).size, 10)

    const stats = {
      team: crew.id,
      name: variants[index]!,
      wins: 0,
      draws: 0,
      losses: 0,
      newCardDeploys: 0,
      deadRounds: 0,
      firstContact: null as number | null,
      founderWins: 0,
      founderDraws: 0,
      founderLosses: 0,
      changedOutcomes: 0,
    }
    for (const foe of TEAMS) {
      if (foe.id === crew.id) continue
      for (const seed of seeds) {
        let maxMana = 0
        const game = playHeadless(
          'blackout',
          crew.id,
          foe.id,
          seed,
          (state) => {
            assert.ok(state.mana >= 0 && state.mana <= MANA_CAP)
            assert.ok(state.enemyMana >= 0 && state.enemyMana <= MANA_CAP)
            maxMana = Math.max(maxMana, state.mana)
            const cards = [
              ...state.piles.player,
              ...state.hands.player,
              ...state.discards.player,
            ]
            assert.equal(
              new Set(cards).size,
              cards.length,
              'Draw, hand and spent pile cannot duplicate a card',
            )
            assert.equal(
              cards.length,
              deck.length,
              'A ten-card constructed deck is never silently lost',
            )
            assert.ok(state.hands.player.length <= BLACKOUT_HAND_SIZE)
          },
          {},
          undefined,
          deck,
        )
        const { state, metrics } = game
        // Same faction, opposing founder deck, seating and seed. Reuse the
        // control across three archetypes so it is not called 180 unique games.
        const controlKey = [crew.id, foe.id, seed].join(':')
        let founder = founderControls.get(controlKey)
        if (!founder) {
          founder = playHeadless('blackout', crew.id, foe.id, seed)
          founderControls.set(controlKey, founder)
        }
        assert.ok(founder.state.victor, 'Founder baseline must settle')
        if (founder.metrics.victor === 'player') {
          report.founderPlayerWins++
          stats.founderWins++
        } else if (founder.metrics.victor === 'enemy') {
          report.founderEnemyWins++
          stats.founderLosses++
        } else {
          report.founderDraws++
          stats.founderDraws++
        }
        if (founder.metrics.victor !== metrics.victor) {
          report.changedOutcomesAgainstFounder++
          stats.changedOutcomes++
        }
        report.matches++
        aggregate.matches++
        assert.ok(state.victor, 'Headless game cannot remain unresolved')
        assert.ok(metrics.commands >= 2)
        assert.ok(metrics.rounds > 0)
        report.completed++
        report.totalRounds += metrics.rounds
        report.deadRounds += metrics.deadRounds
        report.maxDeadStreak = Math.max(
          report.maxDeadStreak,
          metrics.longestDeadStreak,
        )
        stats.deadRounds += metrics.deadRounds
        aggregate.deadRounds += metrics.deadRounds
        if (metrics.firstContact !== null) {
          report.contactGames++
          report.firstContactSum += metrics.firstContact
          aggregate.firstContact += metrics.firstContact
          stats.firstContact =
            stats.firstContact === null
              ? metrics.firstContact
              : Math.min(stats.firstContact, metrics.firstContact)
        } else report.noContact++
        const win = state.victor
        if (win === 'player') {
          stats.wins++
          aggregate.wins++
          report.playerWins++
        } else if (win === 'enemy') {
          stats.losses++
          aggregate.losses++
          report.enemyWins++
        } else {
          stats.draws++
          aggregate.draws++
          report.draws++
        }
        if (maxMana >= 6) report.bankedSixGames++
        const path = metrics.winPath ?? 'draw'
        report.winPaths[path] = (report.winPaths[path] ?? 0) + 1
        const deploys = state.commands.filter(
          (c) => c.t === 'deploy' && c.side === 'player',
        )
        const newcomers = deploys.filter(
          (c) => c.t === 'deploy' && plan.some((card) => card.id === c.card),
        ).length
        report.cardDeploys += deploys.length
        report.newcomerDeploys += newcomers
        aggregate.newcomerDeploys += newcomers
        stats.newCardDeploys += newcomers

        // Every archetype gets a real exact server-replay audit, not just a
        // two-runs-have-same-victor comparison.
        if (
          seed === seeds[0] &&
          foe.id === TEAMS.find((t) => t.id !== crew.id)!.id
        ) {
          assert.deepEqual(
            replayMatch(
              {
                mode: 'blackout',
                teamId: crew.id,
                foeId: foe.id,
                seed,
                playerDeck: deck,
              },
              state.commands,
            ),
            state,
            crew.id + '/' + variants[index] + ' must replay byte-for-byte',
          )
        }
      }
    }
    report.archetypes.push(stats)
  }
}
assert.equal(report.matches, TEAMS.length * 3 * 5 * seeds.length)
assert.equal(report.completed, 180)
assert.equal(founderControls.size, TEAMS.length * 5 * seeds.length)
assert.equal(
  report.founderPlayerWins + report.founderEnemyWins + report.founderDraws,
  report.matches,
)
assert.equal(
  report.playerWins + report.enemyWins + report.draws,
  report.matches,
)
assert.equal(report.archetypes.length, 18)
assert.ok(report.cardDeploys > 0)
const founderSideWins = { player: 0, enemy: 0, draw: 0 }
for (const founder of founderControls.values()) {
  if (founder.metrics.victor === 'player') founderSideWins.player++
  else if (founder.metrics.victor === 'enemy') founderSideWins.enemy++
  else founderSideWins.draw++
}
assert.equal(
  founderSideWins.player + founderSideWins.enemy + founderSideWins.draw,
  founderControls.size,
)

const warnings = report.archetypes.flatMap((row) => {
  const issues: string[] = []
  if (row.wins === 0) issues.push('no wins in sample')
  const deckScore = row.wins + row.draws * 0.5
  const founderScore = row.founderWins + row.founderDraws * 0.5
  if (deckScore <= founderScore - 2)
    issues.push('at least two fewer points than same-seed founder deck')
  if (row.newCardDeploys === 0) issues.push('new cards never played')
  if (row.deadRounds >= 20) issues.push('many no-progress rounds')
  return issues.map((issue) => row.team + '/' + row.name + ': ' + issue)
})
console.log(
  'SLIME_CITY_300_CARD_ADVERSARIAL_REPORT ' +
    JSON.stringify({
      ...report,
      uniqueFounderControls: founderControls.size,
      founderSideWins,
      warnings,
      averageRounds: report.totalRounds / report.matches,
      averageDeadRounds: report.deadRounds / report.matches,
      averageFirstContact:
        report.contactGames > 0
          ? report.firstContactSum / report.contactGames
          : null,
    }),
)
console.log(
  'Slime City constructed Blackout: 180 seeded bouts plus 60 cached founder controls, 18 legal decks, 18 exact replays, conservation PASS',
)
