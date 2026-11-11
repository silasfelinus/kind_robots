import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  accountWithStory,
  newSlimeCityStory,
  storyFromAccount,
  unlockModeOf,
  validSlimeCityStory,
} from '../slimeCity/storySave'
import { createCity, travel } from '../slimeCity/city'
import {
  createCampaignSave,
  resolveCampaignBattle,
} from '../slimeCity/campaign'
import {
  STARTER_CARD_IDS,
  allianceCardPool,
  allianceStarter,
  soloStarter,
} from '../slimeCity/alliance'
import { startTower } from '../slimeCity/allianceTower'
import { TEAMS } from '../slimeCity/prototypes'

const base = newSlimeCityStory()
assert.equal(validSlimeCityStory(base), true)
// One journey restores the team, deck variant, named alliance and exact scene.
const named = allianceStarter('riot', 'ironjaw')
const journeySave = {
  ...base,
  journeyTeam: 'riot' as const,
  journeyFormat: 'alliance' as const,
  journeyDeckId: 'd_saved-crew',
  journeyScreen: 'aftermath' as const,
  alliances: { riot: named },
}
assert.equal(validSlimeCityStory(journeySave), true)
assert.deepEqual(storyFromAccount({ story: journeySave }), journeySave)
assert.equal(validSlimeCityStory({ ...journeySave, journeyDeckId: null }), true)
for (const bad of [
  { ...journeySave, journeyTeam: 'not-a-crew' },
  { ...journeySave, journeyFormat: 'duo' },
  { ...journeySave, journeyDeckId: 77 },
  { ...journeySave, journeyScreen: 'skip-to-final' },
])
  assert.equal(validSlimeCityStory(bad), false)
// Silas, 2026-11-10 PT: "everyone, including me as admin, should be restricted
// to those base cards and then cards that they particularly unlock". Every save
// reads as TRICKLE, whatever it stored.
assert.equal(unlockModeOf(base), 'trickle')
assert.equal(unlockModeOf({ unlocks: undefined }), 'trickle')
assert.equal(unlockModeOf({ unlocks: 'all' }), 'trickle')
// Every starter a new account is dealt is playable in TRICKLE before packs.
for (const team of TEAMS) {
  for (const id of [
    ...soloStarter(team.id),
    ...allianceStarter(team.id, team.id === 'riot' ? 'exchange' : 'riot').cards,
  ])
    assert.equal(STARTER_CARD_IDS.has(id), true, team.id + ' starter ' + id)
}
// ALLIANCE shrank from 30 to 20 cards (Silas, 2026-11-09 PT): a save holding a
// legacy decks and live tower runs are downsized without losing progress.
const legal = allianceStarter('catgirls', 'riot')
const retired = {
  ...legal,
  cards: [
    ...legal.cards,
    ...allianceCardPool('catgirls', 'riot')
      .map((card) => card.id)
      .filter((id) => !legal.cards.includes(id))
      .slice(0, 10),
  ],
}
assert.equal(retired.cards.length, 30)
const travelled = { ...base, city: travel(createCity(), 'chimera') }
const runningTower = {
  ...base.tower!,
  run: { ...startTower(legal, 7), deck: retired },
}
const legacyAccount = {
  story: {
    ...travelled,
    alliances: { catgirls: retired, riot: allianceStarter('riot', 'undertow') },
    tower: runningTower,
  },
}
assert.equal(validSlimeCityStory(legacyAccount.story), false)
const migrated = storyFromAccount(legacyAccount)
assert.equal(migrated.city.location, 'chimera')
assert.deepEqual(Object.keys(migrated.alliances ?? {}), ['catgirls', 'riot'])
assert.equal(migrated.alliances?.catgirls?.cards.length, 20)
assert.equal(migrated.tower?.run?.deck.cards.length, 20)
assert.deepEqual(
  migrated.tower?.run?.deck.cards,
  migrated.alliances?.catgirls?.cards,
)
assert.equal(migrated.tower?.run?.floor, runningTower.run.floor)
assert.equal(legacyAccount.story.alliances.catgirls.cards.length, 30)
assert.deepEqual(migrated.tower?.meta, runningTower.meta)
assert.deepEqual(
  (accountWithStory(legacyAccount, { meat: 3 }) as { story: unknown }).story,
  migrated,
)
assert.equal(validSlimeCityStory({ ...base, unlocks: 'trickle' }), true)
assert.equal(validSlimeCityStory({ ...base, unlocks: 'all' }), true)
assert.equal(validSlimeCityStory({ ...base, unlocks: 'everything' }), false)
assert.equal(unlockModeOf({ unlocks: 'trickle' }), 'trickle')
// Story bouts: as written or TURF, with or without PARITY.
assert.equal(
  validSlimeCityStory({ ...base, storyMode: 'turf', storyParity: true }),
  true,
)
assert.equal(validSlimeCityStory({ ...base, storyMode: 'written' }), true)
assert.equal(validSlimeCityStory({ ...base, storyMode: 'chess' }), false)
assert.equal(validSlimeCityStory({ ...base, storyParity: 'yes' }), false)
assert.equal(base.revision, 0)
assert.deepEqual(storyFromAccount({}), base)
const city = createCity()
const arrived = travel(city, 'chimera')
assert.notEqual(arrived, city)
assert.equal(validSlimeCityStory({ ...base, city: arrived }), true)

const save = createCampaignSave()
const branch = resolveCampaignBattle(
  save,
  'catgirls',
  0,
  'undertow',
  'cunning',
  'player',
)
assert.equal(branch.catgirls.wins, 1)
assert.equal(branch.catgirls.lastApproach, 'cunning')
const defeat = resolveCampaignBattle(
  save,
  'catgirls',
  0,
  'undertow',
  'conviction',
  'enemy',
)
assert.equal(defeat.catgirls.lastApproach, 'conviction')
assert.equal(defeat.catgirls.wins, 0)
assert.equal(validSlimeCityStory({ ...base, campaigns: defeat }), true)
const legacyCampaigns = {
  ...save,
  catgirls: { ...save.catgirls, lastApproach: undefined },
}
assert.equal(
  validSlimeCityStory({ ...base, campaigns: legacyCampaigns }),
  true,
  'Older account-backed saves remain valid with no last-attempt field',
)
assert.equal(
  validSlimeCityStory({ ...base, city: arrived, campaigns: branch }),
  true,
)
const wallet = { version: 1, xp: 900, meat: 150, cards: ['lynx'] }
const savedAccount = {
  ...wallet,
  story: { ...base, revision: 1, city: arrived, campaigns: branch },
}
assert.deepEqual(storyFromAccount(savedAccount).campaigns, branch)
assert.deepEqual(accountWithStory(savedAccount, { ...wallet, meat: 250 }), {
  ...wallet,
  meat: 250,
  story: savedAccount.story,
})
assert.deepEqual(
  accountWithStory(wallet, wallet),
  wallet,
  'No story does not invent a save',
)

for (const mutation of [
  { ...base, revision: -1 },
  { ...base, city: { ...city, location: 'hacker-district' } },
  { ...base, city: { ...city, heat: Number.POSITIVE_INFINITY } },
  { ...base, city: { ...city, log: Array(31).fill('x') } },
  { ...base, city: { ...city, cleared: ['pitworks', 'pitworks'] } },
  { ...base, city: { ...city, finaleChoice: 'skip-to-win' } },
  {
    ...base,
    city: { ...city, streetTerms: { pitworks: { playerHp: 99999 } } },
  },
  { ...base, campaigns: { ...save, catgirls: { ...save.catgirls, wins: 6 } } },
  {
    ...base,
    campaigns: {
      ...save,
      catgirls: { ...save.catgirls, lastApproach: 'purchased-win' },
    },
  },
  {
    ...base,
    campaigns: {
      ...save,
      catgirls: { ...save.catgirls, lastApproach: 4 },
    },
  },
  {
    ...base,
    campaigns: {
      ...save,
      catgirls: { ...save.catgirls, decisions: ['cunning'] },
    },
  },
]) {
  assert.equal(
    validSlimeCityStory(mutation),
    false,
    'Malformed or impossible save rejected',
  )
}

const service = readFileSync('server/utils/slimeCityProgress.ts', 'utf8')
const store = readFileSync('stores/slimeCity.ts', 'utf8')
for (const route of ['story.get.ts', 'story.post.ts']) {
  const source = readFileSync('server/api/slime-city/' + route, 'utf8')
  assert.match(source, /requireSlimeCityPreviewUser\(event\)/)
  assert.doesNotMatch(source, /body\??\.userId/)
}
assert.match(service, /accountWithStory\(row\.data, after\)/)
assert.match(service, /proposed\.revision !== current\.revision/)
assert.match(service, /where: \{ userId, version: row\.version \}/)
assert.match(store, /void hydrateStory\(\)/)
assert.match(store, /persistStory\(\)/)
assert.doesNotMatch(store, /localStorage|sessionStorage/)
console.log(
  'Slime City story saves: account isolation, validation, version CAS and wallet preservation PASS',
)
