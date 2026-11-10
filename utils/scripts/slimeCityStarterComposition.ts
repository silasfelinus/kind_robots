// Slime City fighters-first baseline: executable, reproducible starter composition.
// Run: npx tsx utils/scripts/slimeCityStarterComposition.ts
// Intentionally diagnostic, not a quota: Silas must approve wholesale card cuts.
import assert from 'node:assert/strict'
import { clashDeck, CLASH_DECK_SIZE } from '../slimeCity/clash'
import { CARDS, TEAMS, cardById } from '../slimeCity/prototypes'

const rows = TEAMS.map((team) => {
  const ids = clashDeck(team.id)
  assert.equal(ids.length, CLASH_DECK_SIZE, team.id + ': starter size')
  assert.equal(
    new Set(ids).size,
    ids.length,
    team.id + ': duplicate starter cards',
  )
  const cards = ids.map(cardById)
  for (const card of cards)
    assert.ok(
      card.team === team.id || card.team === 'mercenary',
      team.id + ': off-crew starter ' + card.id,
    )
  const count = (kind: (typeof cards)[number]['kind']) =>
    cards.filter((card) => card.kind === kind).length
  return {
    crew: team.id,
    fighters: count('creature'),
    spells: count('spell'),
    traps: count('trap'),
    equipment: count('equipment'),
    mercenaries: cards.filter((card) => card.team === 'mercenary').length,
    fighterShare: Math.round((100 * count('creature')) / cards.length) + '%',
    toReach13Fighters: Math.max(0, 13 - count('creature')),
    nonfighterIds: cards
      .filter((card) => card.kind !== 'creature')
      .map((card) => card.id)
      .join(', '),
  }
})
assert.equal(TEAMS.length, 6, 'six playable crews')
assert.equal(CARDS.length, 300, 'preserve the 300-card catalog')
console.table(rows)
console.log(
  'Starter audit is informational; no cards or saved deck IDs were changed.',
)
