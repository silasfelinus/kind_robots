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

const base = newSlimeCityStory()
assert.equal(validSlimeCityStory(base), true)
// Card unlocks: omitted means every card is open; TRICKLE is opt-in.
assert.equal(unlockModeOf(base), 'all')
assert.equal(validSlimeCityStory({ ...base, unlocks: 'trickle' }), true)
assert.equal(validSlimeCityStory({ ...base, unlocks: 'all' }), true)
assert.equal(validSlimeCityStory({ ...base, unlocks: 'everything' }), false)
assert.equal(unlockModeOf({ unlocks: 'trickle' }), 'trickle')
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
