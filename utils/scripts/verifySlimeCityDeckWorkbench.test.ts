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
import { RARE_COUNT, buyPack, canBuyPack, newProgression } from '../slimeCity/progression'

assert.equal(TEAMS.length, 6)
assert.equal(RESERVE_CARDS.length, 12)
assert.equal(CARDS.length, 72)
assert.equal(RARE_COUNT, 24)
assert.equal(new Set(CARDS.map((card) => card.id)).size, 72)
assert.equal(new Set(CARDS.map((card) => card.name)).size, 72)
assert.equal(CARDS.filter((card) => card.kind === 'creature').length, 30)
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
    assert.ok(victim, 'Every reserve can replace a non-signature card of its type')
    replacement[replacement.indexOf(victim!)] = reserve.id
  }
  assert.equal(loadoutProblems(team.id, replacement).length, 0)
  assert.deepEqual(new Set(replacement).size, 10)
  const practice = createMatch('blackout', team.id, 'riot', 727272, {}, replacement)
  assert.deepEqual(
    new Set([...practice.piles.player, ...practice.hands.player]),
    new Set(replacement),
    'Practice hand and draw pile must use the edited deck',
  )
  const replayed = replayMatch(
    { mode: 'blackout', teamId: team.id, foeId: 'riot', seed: 727272, playerDeck: replacement },
    practice.commands,
  )
  assert.deepEqual(replayed, practice, 'Customized decks must replay deterministically')
  assert.ok(loadoutProblems(team.id, [...starter, starter[0]!]).length)
  assert.ok(loadoutProblems(team.id, starter.slice(1)).length)
  assert.ok(loadoutProblems(team.id, [...starter.slice(0, -1), 'nonexistent']).length)
  const wrongCrew = TEAMS.find((candidate) => candidate.id !== team.id)!
  assert.ok(loadoutProblems(team.id, [...starter.slice(0, -1), wrongCrew.special[0]!]).length)
  assert.throws(() => createMatch('blackout', team.id, 'riot', 727272, {}, ['fake']))
  const story = { ...newSlimeCityStory(), decks: { [team.id]: replacement } }
  assert.equal(validSlimeCityStory(story), true, 'Legal deck survives story-save validation')
  assert.equal(validSlimeCityStory({ ...story, decks: { [team.id]: ['fake'] } }), false)
}

let wallet = { ...newProgression(), meat: 2400 }
for (let i = 0; i < 24; i++) {
  assert.equal(canBuyPack(wallet), true)
  wallet = buyPack(wallet, 1234 + i)
  assert.equal(wallet.lastPack.length, 3)
}
assert.equal(canBuyPack(wallet), false)
assert.equal(wallet.cards.length, 72, 'Every extra remains available without paid upsell')

const service = readFileSync('server/utils/slimeCityProgress.ts', 'utf8')
const store = readFileSync('stores/slimeCity.ts', 'utf8')
const ui = readFileSync('pages/admin/slime-city.vue', 'utf8')
assert.match(service, /founderCards/)
assert.match(service, /ownedCards/)
assert.match(store, /persistStory\(\)/)
assert.match(store, /testCustomDeck\(\)/)
assert.match(ui, /data-testid="slime-deck-workbench"/)
assert.match(ui, /data-testid="slime-deck-practice"/)
assert.doesNotMatch(store, /localStorage|sessionStorage/)
console.log('Slime City deck workbench: six legal edited decks, seeded practice, account ownership, 24 packs PASS')
