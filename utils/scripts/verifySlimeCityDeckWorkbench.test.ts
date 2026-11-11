import { BASE_CARD_IDS, BASE_CARD_SET } from '../slimeCity/baseCollection'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CARDS,
  TEAMS,
  cardById,
  createMatch,
  deckOf,
  loadoutProblems,
  replayMatch,
} from '../slimeCity/prototypes'
import { RESERVE_CARDS } from '../slimeCity/reserveCards'
import { newSlimeCityStory, validSlimeCityStory } from '../slimeCity/storySave'
import { RARE_COUNT, buyPack, newProgression } from '../slimeCity/progression'

assert.equal(TEAMS.length, 6)
assert.equal(RESERVE_CARDS.length, 12)
assert.equal(CARDS.length, 300)
assert.equal(RARE_COUNT * 3, CARDS.length)
assert.equal(new Set(CARDS.map((card) => card.id)).size, CARDS.length)
assert.equal(new Set(CARDS.map((card) => card.name)).size, CARDS.length)
assert.ok(CARDS.filter((card) => card.kind === 'creature').length >= 62)
assert.ok(RESERVE_CARDS.every((card) => !card.signature))

for (const team of TEAMS) {
  const starter = deckOf(team.id).map((card) => card.id)
  assert.equal(loadoutProblems(team.id, starter).length, 0)
  const reserves = RESERVE_CARDS.filter((card) => card.team === team.id)
  assert.equal(reserves.length, 2)
  const replacement = [...starter]
  for (const reserve of reserves) {
    const victim = replacement.find((id) => {
      const card = cardById(id)
      return card.kind === reserve.kind && !card.signature
    })
    assert.ok(
      victim,
      'Every reserve can replace a non-signature card of its type',
    )
    replacement[replacement.indexOf(victim!)] = reserve.id
  }
  assert.equal(loadoutProblems(team.id, replacement).length, 0)
  assert.deepEqual(new Set(replacement).size, 10)
  const practice = createMatch(
    'blackout',
    team.id,
    'riot',
    727272,
    {},
    replacement,
  )
  assert.deepEqual(
    new Set([...practice.piles.player, ...practice.hands.player]),
    new Set(replacement),
    'Practice hand and draw pile must use the edited deck',
  )
  const replayed = replayMatch(
    {
      mode: 'blackout',
      teamId: team.id,
      foeId: 'riot',
      seed: 727272,
      playerDeck: replacement,
    },
    practice.commands,
  )
  assert.deepEqual(
    replayed,
    practice,
    'Customized decks must replay deterministically',
  )
  assert.ok(loadoutProblems(team.id, [...starter, starter[0]!]).length)
  assert.ok(loadoutProblems(team.id, starter.slice(1)).length)
  assert.ok(
    loadoutProblems(team.id, [...starter.slice(0, -1), 'nonexistent']).length,
  )
  const wrongCrew = TEAMS.find((candidate) => candidate.id !== team.id)!
  assert.ok(
    loadoutProblems(team.id, [...starter.slice(0, -1), wrongCrew.special[0]!])
      .length,
  )
  assert.throws(() =>
    createMatch('blackout', team.id, 'riot', 727272, {}, ['fake']),
  )
  const story = { ...newSlimeCityStory(), decks: { [team.id]: replacement } }
  assert.equal(
    validSlimeCityStory(story),
    true,
    'Legal deck survives story-save validation',
  )
  assert.equal(
    validSlimeCityStory({ ...story, decks: { [team.id]: ['fake'] } }),
    false,
  )
}

// Silas, 2026-11-10 PT: every account owns the base collection from the
// start (each crew's 20-card starter plus 20 mercenaries); packs only ever
// add cards beyond it.
assert.equal(newProgression().cards.length, BASE_CARD_IDS.length)
assert.ok(BASE_CARD_IDS.length >= 120 && BASE_CARD_IDS.length < CARDS.length)
// Starters change (fighters first, gear folded into fighters) but a card
// anyone was ever dealt stays in the base: an older saved deck must still
// pass the server's ownership check instead of failing every story save.
for (const id of [
  'laser',
  's3-catgirls-garrote',
  'ninthlife',
  'fusevest',
  'drysuit',
  's3-bloodfairies-tripcord',
  's2-bloodfairies-roadie-megaphone',
  's1-forge-spark',
  's2-exchange-executive-health-coverage',
])
  assert.ok(BASE_CARD_SET.has(id), id + ' stays in the base collection')
let wallet = { ...newProgression(), meat: CARDS.length * 1000 }
for (let i = 0; i < 400 && wallet.cards.length < CARDS.length; i++) {
  const next = buyPack(wallet, 1234 + wallet.opened)
  assert.ok(next.lastPack.every((id) => !BASE_CARD_SET.has(id)))
  wallet = next
}
assert.equal(
  wallet.cards.length,
  CARDS.length,
  'Every extra remains available without paid upsell',
)

const service = readFileSync('server/utils/slimeCityProgress.ts', 'utf8')
const store = readFileSync('stores/slimeCity.ts', 'utf8')
const ui = readFileSync('pages/admin/slime-city.vue', 'utf8')
assert.match(service, /STARTER_CARD_IDS\.has\(id\)/)
assert.match(service, /ownedCards/)
assert.match(store, /persistStory\(\)/)
// Silas, 2026-11-08 PT: the armory builds SOLO and ALLIANCE Clash decks (both
// 20 cards since 2026-11-09); the 10-card classic workbench is retired.
assert.match(store, /function toggleSoloCard/)
assert.match(ui, /data-testid="slime-solo-workbench"/)
assert.match(ui, /data-testid="slime-solo-play"/)
assert.match(ui, /data-testid="slime-alliance-workbench"/)
assert.match(ui, /data-testid="slime-card-filters"/)
assert.match(ui, /data-testid="slime-card-inspector"/)
// Silas, 2026-11-11 PT: owned cards only by default, a clear SOLO / SECOND
// FACTION choice, and locked cards behind a toggle.
assert.match(ui, /data-testid="slime-deck-type-solo"/)
assert.match(ui, /data-testid="slime-general-picker"/)
assert.match(ui, /data-testid="slime-ally-picker"/)
assert.match(ui, /'slime-starter-' \+ deck\.id/)
assert.match(store, /STARTER_MATCHUPS/)
assert.match(store, /function dealStarterDeck/)
assert.match(ui, /data-testid="slime-show-locked"/)
assert.match(ui, /showLocked\.value \|\|\s+lab\.isCardUnlocked\(card\.id\)/)
assert.match(ui, /clashCardText\(inspectCard, evolutionLevel\)/)
assert.doesNotMatch(ui, /data-testid="slime-deck-workbench"/)
assert.match(service, /proposed\.soloDecks/)
assert.match(service, /proposed\.alliances/)
assert.doesNotMatch(store, /localStorage|sessionStorage/)
// Silas, 2026-11-10 PT: ALL CARDS is retired for everyone, admin included.
// Decks are always ownership-gated server-side; the client resets any saved
// deck holding a locked card.
assert.match(service, /for \(const deck of allDecks\)/)
assert.doesNotMatch(store, /function setUnlockMode/)
assert.match(store, /function enforceCollection/)
assert.doesNotMatch(ui, /slime-unlock-all|slime-unlock-trickle/)
assert.match(ui, /data-testid="slime-pack-open"/)
// ALL CARDS hides the pack shop and the last-pack reveal; TRICKLE shows them.
assert.match(
  ui,
  /v-if="lab\.unlockMode === 'trickle'"\s+class="sc-reward-panel sc-shop-panel"/,
)
assert.match(
  ui,
  /v-if="\s*lab\.unlockMode === 'trickle' && lab\.progress\.lastPack\.length\s*"/,
)
console.log(
  'Slime City deck workbench: six legal edited decks, seeded practice, account ownership, base collection, earned unlocks, all packs PASS',
)
