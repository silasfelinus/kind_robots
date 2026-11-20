// Bringing a device journey into an account (conductor slime-city/t-063).
// The offer appears only when the account's own story is still fresh; the
// import carries the journey but never the Tower legacy; the device copy and
// the inputs are left untouched.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { allianceStarter, type LibraryDeck } from '../slimeCity/alliance'
import { startTower } from '../slimeCity/allianceTower'
import { FACTION_CAMPAIGNS, resolveCampaignBattle } from '../slimeCity/campaign'
import {
  guestImportOffer,
  importGuestStory,
  slimeStoryIsFresh,
  slimeStoryProgress,
} from '../slimeCity/guestStoryImport'
import {
  newSlimeCityStory,
  validSlimeCityStory,
  type SlimeCityStory,
} from '../slimeCity/storySave'

const fresh = newSlimeCityStory()
assert.equal(slimeStoryIsFresh(fresh), true)
assert.deepEqual(slimeStoryProgress(fresh), {
  chapters: 0,
  districts: 0,
  endings: 0,
  pages: 0,
})

// A device journey: Catgirls two chapters in, one Riot ending on the shelf,
// its card back equipped, a named deck, and a Tower with a legacy and a run.
let campaigns = fresh.campaigns
for (const chapter of [0, 1])
  campaigns = resolveCampaignBattle(
    campaigns,
    'catgirls',
    chapter,
    FACTION_CAMPAIGNS.catgirls.chapters[chapter]!.foe,
    'cunning',
    'player',
  )
assert.equal(campaigns.catgirls.wins, 2)
const deviceDeck: LibraryDeck = {
  ...allianceStarter('catgirls', 'riot'),
  id: 'd_device',
  name: 'Kitchen Table',
}
const sharedDeck: LibraryDeck = {
  ...allianceStarter('riot', 'undertow'),
  id: 'd_shared',
  name: 'Device Copy',
}
const device: SlimeCityStory = {
  ...fresh,
  revision: 41,
  campaigns,
  journeyTeam: 'catgirls',
  journeyFormat: 'alliance',
  journeyDeckId: 'd_device',
  journeyScreen: 'chapter',
  alliances: { catgirls: allianceStarter('catgirls', 'riot') },
  library: [deviceDeck, sharedDeck],
  endings: ['riot:triumph'],
  cardBack: 'riot',
  title: 'riot',
  tower: {
    run: startTower(allianceStarter('catgirls', 'riot'), 7),
    meta: { runs: 6, bestFloor: 9, cinders: 44, cards: [] },
  },
}
assert.equal(validSlimeCityStory(device), true, 'the fixture is a real save')
assert.equal(slimeStoryIsFresh(device), false)

// The account: nothing won yet, but it has its own Tower record and a deck.
const accountDeck: LibraryDeck = {
  ...allianceStarter('ironjaw', 'exchange'),
  id: 'd_account',
  name: 'Account Only',
}
const account: SlimeCityStory = {
  ...fresh,
  revision: 7,
  library: [accountDeck, { ...sharedDeck, name: 'Account Copy' }],
  tower: {
    run: null,
    meta: { runs: 1, bestFloor: 2, cinders: 3, cards: [] },
  },
}
assert.equal(validSlimeCityStory(account), true)
assert.equal(slimeStoryIsFresh(account), true, 'decks alone are not progress')

// The offer: who, and how far.
assert.equal(guestImportOffer(account, null), null, 'no device journey')
assert.equal(guestImportOffer(account, fresh), null, 'nothing worth bringing')
assert.deepEqual(guestImportOffer(account, device), {
  team: 'catgirls',
  chapters: 2,
  districts: 0,
  endings: 1,
  pages: 0,
})

// An account that has started its own story is never offered an overwrite.
const started: SlimeCityStory = {
  ...account,
  campaigns: resolveCampaignBattle(
    fresh.campaigns,
    'riot',
    0,
    FACTION_CAMPAIGNS.riot.chapters[0]!.foe,
    'conviction',
    'player',
  ),
}
assert.equal(started.campaigns.riot.wins, 1)
assert.equal(guestImportOffer(started, device), null)
assert.equal(
  guestImportOffer({ ...account, endings: ['riot:triumph'] }, device),
  null,
)

// The import itself.
const before = JSON.stringify([account, device])
const imported = importGuestStory(account, device)
assert.equal(JSON.stringify([account, device]), before, 'inputs are untouched')
assert.equal(validSlimeCityStory(imported), true, 'the result is a real save')
assert.deepEqual(imported.campaigns, device.campaigns)
assert.deepEqual(imported.city, device.city)
assert.equal(imported.journeyTeam, 'catgirls')
assert.equal(imported.journeyFormat, 'alliance')
assert.equal(imported.journeyDeckId, 'd_device')
assert.deepEqual(imported.alliances, device.alliances)
assert.deepEqual(imported.endings, ['riot:triumph'])
assert.equal(imported.cardBack, 'riot')
assert.equal(imported.title, 'riot')
// The account keeps its own revision, so the next save is not a stale write.
assert.equal(imported.revision, 7)
// The Tower legacy is the account's, exactly: no device cinders, best floor,
// run count or run in progress comes across.
assert.deepEqual(imported.tower, account.tower)
assert.notDeepEqual(imported.tower, device.tower)
// Decks: the device's first, then any the account alone has; a shared id
// keeps the device copy and appears once.
assert.deepEqual(
  imported.library?.map((deck) => [deck.id, deck.name]),
  [
    ['d_device', 'Kitchen Table'],
    ['d_shared', 'Device Copy'],
    ['d_account', 'Account Only'],
  ],
)
// An account story with no Tower yet starts a fresh one, never the device's.
const towerless = importGuestStory({ ...account, tower: undefined }, device)
assert.deepEqual(towerless.tower, fresh.tower)
// Once imported, the account is no longer fresh: the offer does not return.
assert.equal(guestImportOffer(imported, device), null)

// The store offers it only to a signed-in account whose own story loaded,
// saves the result to that account, and leaves the device copy alone.
const store = readFileSync('stores/slimeCity.ts', 'utf8')
const offer = store.slice(
  store.indexOf('const deviceImport = computed'),
  store.indexOf('function dismissDeviceImport'),
)
assert.ok(offer.length > 0, 'the store defines the import offer')
for (const guard of [
  '!id ||',
  'isGuest() ||',
  'accountPreviewOnly.value ||',
  '!storyLoaded.value ||',
  'storyAccount.value !== id ||',
  'deviceImportDismissed.value === id',
])
  assert.ok(offer.includes(guard), 'offer is guarded by ' + guard)
assert.match(
  offer,
  /applyAccountStory\(importGuestStory\(storySnapshot\(\), device\)\)\s+settleAccountStory\(\)\s+persistStory\(\)/,
  'the import is applied, settled and saved to the account',
)
assert.doesNotMatch(
  offer,
  /clearGuestSlimeStory|writeGuestSlimeStory/,
  'the import never changes the device copy',
)
assert.match(
  store,
  /settleAccountStory\(\)\s+deviceStory\.value = readGuestSlimeStory\(\)/,
  'the device journey is read when an account story loads',
)
for (const name of [
  'deviceImport',
  'importDeviceJourney',
  'dismissDeviceImport',
])
  assert.match(
    store,
    new RegExp('\\n    ' + name + ',\\n'),
    name + ' is public',
  )

// The title screen shows the offer with both answers and says what stays.
const splash = readFileSync('components/slime-city-splash.vue', 'utf8')
assert.match(splash, /v-if="lab\.deviceImport"/)
assert.match(splash, /data-testid="slime-splash-import-go"/)
assert.match(splash, /@click="lab\.importDeviceJourney\(\)"/)
assert.match(splash, /data-testid="slime-splash-import-skip"/)
assert.match(splash, /@click="lab\.dismissDeviceImport\(\)"/)
assert.match(splash, /Tower cinders and records stay behind/)

console.log(
  'Slime City device-journey import: offered only into a fresh account ' +
    'story, carries the journey, never the Tower legacy, device copy untouched',
)
