// Endings gallery and campaign scrapbook (slime-city/t-059).
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  FACTION_CAMPAIGNS,
  campaignEnding,
  createCampaignSave,
  resolveCampaignBattle,
  type CampaignSave,
} from '../slimeCity/campaign'
import { chooseRiotBeat, riotEpilogue } from '../slimeCity/campaignRiot'
import { ALLIANCE_LATER_ARCS } from '../slimeCity/campaignAllianceLater'
import {
  earnedEndingIds,
  endingById,
  endingCatalog,
  endingGallery,
  recordFinishedRuns,
  validEndings,
  validScrapbook,
} from '../slimeCity/endings'
import {
  newSlimeCityStory,
  storyFromAccount,
  validSlimeCityStory,
} from '../slimeCity/storySave'
import { TEAMS } from '../slimeCity/prototypes'
import {
  CREW_TROPHIES,
  crewTrophyShelf,
  crewTrophyUnlocked,
  earnedCrewTitles,
} from '../slimeCity/crewTrophies'

// Every crew: two plates, three journey epilogues, two endings per ally arc.
for (const crew of TEAMS) {
  const catalog = endingCatalog(crew.id)
  const arcs = Object.keys(ALLIANCE_LATER_ARCS[crew.id]).filter(
    (ally) => ally !== crew.id,
  ).length
  assert.equal(catalog.length, 5 + arcs * 2, crew.id + ' catalog size')
  assert.equal(new Set(catalog.map((e) => e.id)).size, catalog.length)
  for (const entry of catalog) {
    assert.ok(entry.title.length > 0 && entry.story.length > 0, entry.id)
    assert.equal(endingById(entry.id)?.story, entry.story)
  }
  assert.ok(catalog.some((e) => e.story === FACTION_CAMPAIGNS[crew.id].triumph))
  assert.deepEqual(earnedEndingIds(createCampaignSave(), crew.id), [])
}

// Play the Anarkissed all the way down the left path with Conviction.
function finishRiot(path: 'left' | 'right'): CampaignSave {
  let save = createCampaignSave()
  for (let chapter = 0; chapter < 5; chapter++) {
    for (let scene = 0; scene < 3; scene++) save = chooseRiotBeat(save, path)
    save = resolveCampaignBattle(
      save,
      'riot',
      chapter,
      FACTION_CAMPAIGNS.riot.chapters[chapter]!.foe,
      path === 'left' ? 'conviction' : 'cunning',
      'player',
    )
  }
  return save
}
const left = finishRiot('left')
assert.equal(left.riot.wins, 5)
const leftIds = earnedEndingIds(left, 'riot')
assert.deepEqual(leftIds, ['riot:triumph', 'riot:journey:left'])
assert.equal(endingById('riot:triumph')?.story, campaignEnding(left, 'riot'))
assert.equal(endingById('riot:journey:left')?.story, riotEpilogue(left.riot))
const right = finishRiot('right')
assert.deepEqual(earnedEndingIds(right, 'riot'), [
  'riot:compromise',
  'riot:journey:right',
])
assert.equal(endingById('riot:journey:right')?.story, riotEpilogue(right.riot))

// The alliance finale's ally and pick name the alliance ending.
const ally = Object.keys(ALLIANCE_LATER_ARCS.riot).find((id) => id !== 'riot')!
const allied: CampaignSave = {
  ...left,
  riot: {
    ...left.riot,
    allianceJourney: { 4: { ally: ally as 'ironjaw', pick: 'gamble' } },
  },
}
assert.deepEqual(earnedEndingIds(allied, 'riot'), [
  ...leftIds,
  'riot:alliance:' + ally + ':gamble',
])

// Recording is idempotent: one page per finished run, endings deduplicated.
const empty = { endings: [], scrapbook: [] }
const first = recordFinishedRuns(empty, left, { riot: 'Encore' })
assert.equal(first.changed, true)
assert.deepEqual(first.endings, leftIds)
assert.equal(first.scrapbook.length, 1)
assert.deepEqual(first.scrapbook[0], {
  team: 'riot',
  run: 1,
  decisions: left.riot.decisions,
  losses: 0,
  endings: leftIds,
  favor: 'Encore',
})
const again = recordFinishedRuns(first, left)
assert.equal(again.changed, false, 'unknown favor keeps the saved one')
assert.equal(again.scrapbook[0]!.favor, 'Encore')
const refavored = recordFinishedRuns(first, left, { riot: 'Second Encore' })
assert.equal(refavored.changed, true)
assert.equal(refavored.scrapbook.length, 1)
assert.equal(refavored.scrapbook[0]!.favor, 'Second Encore')
const withAlly = recordFinishedRuns(first, allied, { riot: 'Encore' })
assert.equal(withAlly.scrapbook.length, 1, 'same run, same page')
assert.equal(withAlly.endings.length, 3)
// A different finished run (as if replayed) adds run 2 and keeps old endings.
const second = recordFinishedRuns(withAlly, right)
assert.equal(second.scrapbook.length, 2)
assert.equal(second.scrapbook[1]!.run, 2)
assert.equal(second.endings.length, 5)
assert.equal(recordFinishedRuns(empty, createCampaignSave()).changed, false)
// Inputs are never mutated.
assert.deepEqual(first.scrapbook[0]!.favor, 'Encore')

const gallery = endingGallery('riot', second.endings)
assert.equal(gallery.found, 5)
assert.equal(gallery.total, endingCatalog('riot').length)
assert.equal(endingGallery('catgirls', second.endings).found, 0)

// Saves: valid round-trip, forged or cross-crew ids rejected.
assert.ok(validEndings(second.endings))
assert.ok(validScrapbook(second.scrapbook))
assert.equal(validEndings(['riot:triumph', 'riot:triumph']), false)
assert.equal(validEndings(['riot:secret']), false)
assert.equal(
  validScrapbook([{ ...second.scrapbook[0]!, endings: ['ironjaw:triumph'] }]),
  false,
)
assert.equal(
  validScrapbook([{ ...second.scrapbook[0]!, decisions: ['conviction'] }]),
  false,
)
const story = {
  ...newSlimeCityStory(),
  campaigns: allied,
  endings: second.endings,
  scrapbook: second.scrapbook,
}
assert.ok(validSlimeCityStory(story))
assert.equal(validSlimeCityStory({ ...story, endings: ['nope'] }), false)
assert.ok(JSON.stringify(story).length < 32768, 'fits the story size cap')
// A retired ending id or a broken page is pruned on load, not a story reset.
const loaded = storyFromAccount({
  story: {
    ...story,
    revision: 7,
    endings: [...second.endings, 'riot:alliance:retired:gamble'],
    scrapbook: [...second.scrapbook, { team: 'riot', run: 'x' }],
  },
})
assert.equal(loaded.revision, 7, 'story kept')
assert.deepEqual(loaded.endings, second.endings)
assert.deepEqual(loaded.scrapbook, second.scrapbook)

// Server keeps endings (never forgets one) and the tower/journey seat.
const server = readFileSync('server/utils/slimeCityProgress.ts', 'utf8')
assert.ok(server.includes('...(current.endings ?? [])'))
assert.ok(server.includes('scrapbook: proposed.scrapbook ?? current.scrapbook'))
assert.ok(server.includes('tower: proposed.tower ?? current.tower'))
assert.ok(server.includes('journeyTeam: proposed.journeyTeam'))
const store = readFileSync('stores/slimeCity.ts', 'utf8')
assert.ok(store.includes('endings: endingsFound.value'))
assert.ok(store.includes('scrapbook: scrapbook.value'))
assert.ok(store.includes('watch([campaignSave, campaignLegacy], syncEndings)'))
const campaign = readFileSync('components/slime-city-campaign.vue', 'utf8')
assert.ok(campaign.includes('<SlimeCityEndings v-if="lab.endingsOpen" />'))
assert.ok(campaign.includes('data-testid="slime-campaign-open-endings"'))

console.log('slime-city endings gallery + scrapbook: ok')

// Crew trophies (slime-city/t-061): cosmetic only, derived from the gallery.
{
  for (const crew of TEAMS) {
    const t = CREW_TROPHIES[crew.id]
    assert.ok(t, crew.id + ' has a trophy')
    assert.ok(t.trophy && t.title && t.line && t.frame.name, crew.id)
    assert.ok(t.frame.background.includes('gradient'), crew.id + ' frame')
    assert.equal(crewTrophyUnlocked(crew.id, []), false)
    assert.equal(crewTrophyUnlocked(crew.id, [crew.id + ':compromise']), true)
    assert.equal(crewTrophyUnlocked(crew.id, [crew.id + ':triumph']), true)
    // Journey or alliance endings alone never unlock it.
    assert.equal(
      crewTrophyUnlocked(crew.id, [crew.id + ':journey:left']),
      false,
    )
  }
  assert.equal(
    new Set(TEAMS.map((c) => CREW_TROPHIES[c.id].title)).size,
    TEAMS.length,
    'titles are unique',
  )
  const empty = crewTrophyShelf([])
  assert.equal(empty.unlocked, 0)
  assert.equal(empty.total, TEAMS.length)
  // A real finished run unlocks exactly that crew's trophy.
  const won = finishRiot('left')
  const rec = recordFinishedRuns({ endings: [], scrapbook: [] }, won)
  const shelf = crewTrophyShelf(rec.endings)
  assert.equal(shelf.unlocked, 1)
  assert.deepEqual(earnedCrewTitles(rec.endings), [CREW_TROPHIES.riot.title])
  // Cosmetic only: the story save shape is unchanged.
  const ui = readFileSync('components/slime-city-endings.vue', 'utf8')
  assert.match(ui, /slime-trophy-shelf/)
  assert.match(
    readFileSync('components/slime-city-campaign.vue', 'utf8'),
    /slime-campaign-trophy-unlocked/,
  )
}
console.log('slime-city crew trophies verified')
