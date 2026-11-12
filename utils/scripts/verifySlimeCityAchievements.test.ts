// Slime City achievements (conductor slime-city t-060): each deed earns its
// codes once, at the moment it happens, and every code is in the catalog.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createPinia, setActivePinia } from 'pinia'
import { useSlimeCityStore } from '../../stores/slimeCity'
import { achievementsForGame } from '../achievements/gameAchievements'
import {
  CAMPAIGN_ACHIEVEMENTS,
  campaignAchievements,
  cityAchievements,
  clashAchievements,
  pvpAchievements,
  towerAchievements,
} from '../slimeCity/achievementAwards'
import {
  WATCHED_ACTIONS,
  actionAchievements,
  watchSlimeCityAchievements,
  type SlimeCityAchievementSource,
} from '../slimeCity/achievementWatch'
import { freshTower, startTower } from '../slimeCity/allianceTower'
import { allianceStarter } from '../slimeCity/alliance'
import {
  campaignChapter,
  createCampaignSave,
  resolveCampaignBattle,
  type CampaignApproach,
  type CampaignSave,
} from '../slimeCity/campaign'
import { createCity, decideFinale, recordBout } from '../slimeCity/city'
import type { TeamId } from '../slimeCity/prototypes'

const catalog = new Set(achievementsForGame('slime-city').map((e) => e.code))
assert.ok(catalog.size >= 12, 'Slime City carries at least 12 achievements.')

function win(
  save: CampaignSave,
  team: TeamId,
  choice: CampaignApproach,
): CampaignSave {
  const chapter = campaignChapter(save, team)!
  return resolveCampaignBattle(
    save,
    team,
    save[team].wins,
    chapter.foe,
    choice,
    'player',
  )
}

// A chapter win counts; a loss does not.
let save = createCampaignSave()
const lost = resolveCampaignBattle(
  save,
  'catgirls',
  0,
  campaignChapter(save, 'catgirls')!.foe,
  'conviction',
  'enemy',
)
assert.deepEqual(campaignAchievements(save, lost, 'catgirls'), [])
let next = win(save, 'catgirls', 'conviction')
assert.deepEqual(campaignAchievements(save, next, 'catgirls'), [
  'slime-city-chapter-won',
])

// Five chapters on Conviction: the crew's campaign and the triumph.
for (let chapter = 0; chapter < 4; chapter++) {
  save = next
  next = win(save, 'catgirls', 'conviction')
}
assert.deepEqual(campaignAchievements(save, next, 'catgirls'), [
  'slime-city-chapter-won',
  'slime-city-conviction-triumph',
  'slime-city-campaign-catgirls',
])
// A finished campaign that loads finished earns nothing more.
assert.deepEqual(campaignAchievements(next, next, 'catgirls'), [])

// Cunning wins the compromise.
save = next
let cunning = save
for (let chapter = 0; chapter < 5; chapter++)
  cunning = win(cunning, 'ironjaw', 'cunning')
assert.ok(
  campaignAchievements(save, cunning, 'ironjaw').includes(
    'slime-city-cunning-compromise',
  ),
)

// The sixth crew finished tells the whole city, and counts the earlier crews.
let all = createCampaignSave()
const crews = Object.keys(CAMPAIGN_ACHIEVEMENTS) as TeamId[]
for (const crew of crews.slice(0, 5))
  for (let chapter = 0; chapter < 5; chapter++)
    all = win(all, crew, 'conviction')
let last = all
for (let chapter = 0; chapter < 5; chapter++)
  last = win(last, 'exchange', 'cunning')
const finale = campaignAchievements(all, last, 'exchange')
for (const crew of crews)
  assert.ok(finale.includes(CAMPAIGN_ACHIEVEMENTS[crew]))
assert.ok(finale.includes('slime-city-all-crews'))

// The tower: halfway at floor six, the summit at twelve.
const run = startTower(
  allianceStarter('catgirls', 'riot'),
  4242,
  freshTower().meta,
)
assert.deepEqual(towerAchievements(run, { ...run, floor: 5 }), [])
assert.deepEqual(
  towerAchievements({ ...run, floor: 5 }, { ...run, floor: 6 }),
  ['slime-city-tower-floor-6'],
)
assert.deepEqual(
  towerAchievements(
    { ...run, floor: 11, phase: 'battle' },
    { ...run, floor: 12, phase: 'complete' },
  ),
  ['slime-city-tower-summit'],
)
assert.deepEqual(towerAchievements(null, run), [])

// A Clash: winning, and a card played up to its third form.
assert.deepEqual(
  clashAchievements({ victor: 'enemy', levels: { player: {}, enemy: {} } }),
  [],
)
assert.deepEqual(
  clashAchievements({
    victor: 'player',
    levels: { player: { lynx: 3 }, enemy: {} },
  }),
  ['slime-city-first-clash-win', 'slime-city-third-form'],
)
assert.deepEqual(
  clashAchievements({
    victor: 'draw',
    levels: { player: {}, enemy: { a: 3 } },
  }),
  [],
  'Only the player’s own cards count.',
)

// The city: a district champion, then the Grand Pit's final call.
const city = createCity()
assert.deepEqual(
  cityAchievements(city, recordBout(city, 'chimera', 'enemy')),
  [],
)
assert.deepEqual(
  cityAchievements(city, recordBout(city, 'chimera', 'player')),
  ['slime-city-district-champion'],
)
const won = { ...city, cleared: ['pitworks' as const] }
assert.deepEqual(cityAchievements(won, decideFinale(won, 'pit-charter')), [
  'slime-city-city-finale',
])

// PvP: only a finished duel this seat won.
assert.deepEqual(
  pvpAchievements({ stage: 'finished', outcome: 'player', seat: 'player' }),
  ['slime-city-pvp-win'],
)
assert.deepEqual(
  pvpAchievements({ stage: 'finished', outcome: 'player', seat: 'enemy' }),
  [],
)
assert.deepEqual(
  pvpAchievements({ stage: 'battle', outcome: null, seat: 'player' }),
  [],
)
assert.deepEqual(pvpAchievements(null), [])

// Every code a helper can return is in the catalog, and the catalog has no
// code nothing awards.
const awarded = new Set([
  ...Object.values(CAMPAIGN_ACHIEVEMENTS),
  'slime-city-chapter-won',
  'slime-city-conviction-triumph',
  'slime-city-cunning-compromise',
  'slime-city-all-crews',
  'slime-city-tower-floor-6',
  'slime-city-tower-summit',
  'slime-city-first-clash-win',
  'slime-city-third-form',
  'slime-city-district-champion',
  'slime-city-city-finale',
  'slime-city-pvp-win',
  'slime-city-first-pack',
  'slime-city-alliance-builder',
])
assert.deepEqual([...awarded].sort(), [...catalog].sort())

// The watcher judges the real store's actions: a deed awards, loading a
// story does not.
setActivePinia(createPinia())
const lab = useSlimeCityStore()
for (const name of WATCHED_ACTIONS)
  assert.equal(
    typeof (lab as unknown as Record<string, unknown>)[name],
    'function',
    `The Slime City store has no ${name} action to watch.`,
  )
const earned: string[][] = []
const stop = watchSlimeCityAchievements(
  lab as unknown as SlimeCityAchievementSource,
  (codes) => earned.push(codes),
)
lab.city = { ...createCity(), cleared: ['pitworks'] }
lab.chooseFinale('pit-charter')
assert.deepEqual(earned, [['slime-city-city-finale']])
lab.chooseFinale('pit-charter')
assert.equal(earned.length, 1, 'A decided finale is not decided twice.')
await lab.hydrateStory()
assert.equal(earned.length, 1, 'Loading a story awards nothing.')
stop()

// The judging itself, action by action.
const quiet = {
  campaignSave: createCampaignSave(),
  city: createCity(),
  towerRun: null,
  playAlliance: allianceStarter('catgirls', 'riot'),
  progress: {},
  progressError: '',
  clashResult: null,
}
assert.deepEqual(
  actionAchievements(
    'settleClash',
    [1, { victor: 'player', levels: { player: {}, enemy: {} } }],
    quiet,
    { ...quiet, clashResult: { kind: 'practice', victor: 'player' } },
  ),
  ['slime-city-first-clash-win'],
)
assert.deepEqual(
  actionAchievements(
    'settleClash',
    [1, { victor: 'player', levels: { player: {}, enemy: {} } }],
    { ...quiet, clashResult: { kind: 'practice', victor: 'player' } },
    { ...quiet, clashResult: { kind: 'practice', victor: 'player' } },
  ),
  [],
  'A Clash settles once.',
)
const chapterOne = win(createCampaignSave(), 'riot', 'cunning')
assert.deepEqual(
  actionAchievements('settleClash', [], quiet, {
    ...quiet,
    campaignSave: chapterOne,
  }),
  ['slime-city-chapter-won'],
)
assert.deepEqual(
  actionAchievements('hydrateStory', [], quiet, {
    ...quiet,
    campaignSave: chapterOne,
  }),
  [],
)
assert.deepEqual(
  actionAchievements('purchasePack', [], quiet, { ...quiet, progress: {} }),
  ['slime-city-first-pack'],
)
assert.deepEqual(
  actionAchievements('purchasePack', [], quiet, {
    ...quiet,
    progressError: 'Purchase rejected.',
  }),
  [],
)
assert.deepEqual(
  actionAchievements('toggleAllianceCard', [], quiet, {
    ...quiet,
    playAlliance: allianceStarter('catgirls', 'undertow'),
  }),
  ['slime-city-alliance-builder'],
)
assert.deepEqual(actionAchievements('toggleAllianceCard', [], quiet, quiet), [])

const plugin = readFileSync('plugins/slime-city-achievements.client.ts', 'utf8')
assert.ok(
  plugin.includes("store.$id === 'slimeCityLab'") &&
    plugin.includes('watchSlimeCityAchievements(') &&
    plugin.includes("store.$id === 'slimeCityPvp'") &&
    plugin.includes('award(pvpAchievements(duel))'),
  'A Pinia plugin watches the Slime City and VS stores.',
)

console.log(`Slime City achievements passed: ${catalog.size} achievements.`)
