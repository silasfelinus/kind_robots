// Slime City overworld contract (conductor slime-city t-007 first slice):
// streets connect all seven districts, travel follows streets, each district
// has a distinct rival and one street decision whose consequences reach the
// rival bout and the city's gates, and bout results open the Grand Pit.
import assert from 'node:assert/strict'
import { CAMPAIGN_CHOICE_CONSEQUENCES } from '../slimeCity/campaignConsequences'
import {
  campaignChapter,
  campaignEnding,
  createCampaignSave,
  describeTerms,
  FACTION_CAMPAIGNS,
  resolveCampaignBattle,
} from '../slimeCity/campaign'

import {
  applyTerms,
  boutBlocked,
  boutTerms,
  CITY_PLAN,
  CITY_CONTRACTS,
  CHAMPION_AFTERMATH,
  CIVIC_CRISES,
  CITY_FINALE,
  CAMPAIGN_DISTRICTS,
  championAftermath,
  cityCrisis,
  cityEpilogue,
  cityFinale,
  cityRoute,
  cityWon,
  contractBlocked,
  recordContract,
  createCity,
  decide,
  decideAftermath,
  decideCrisis,
  decideFinale,
  decideStreet,
  streetStory,
  storyMissionTerms,
  STREET_STORIES,
  gateReason,
  HEAT_LIMIT,
  recordBout,
  STREETS,
  streetsFrom,
  totalStanding,
  travel,
  type CityState,
  type DistrictId,
} from '../slimeCity/city'
import {
  CARDS,
  createMatch,
  deploy,
  deployAs,
  observe,
  DISTRICTS,
  MODES,
  TEAMS,
} from '../slimeCity/prototypes'
import {
  slimeArtId,
  SLIME_CITY_ART,
  SLIME_CITY_ART_COUNT,
} from '../slimeCity/artManifest'

const artIds = [
  ...Object.values(SLIME_CITY_ART.crews),
  ...Object.values(SLIME_CITY_ART.districts),
  ...Object.values(SLIME_CITY_ART.cards),
  ...Object.values(SLIME_CITY_ART.boards),
]
assert.equal(
  SLIME_CITY_ART_COUNT,
  52,
  'First art round has 52 rendered ArtImage IDs',
)
assert.equal(artIds.length, 52)
assert.equal(
  new Set(artIds).size,
  artIds.length,
  'Each render has distinct provenance',
)
assert.ok(artIds.every((id) => Number.isInteger(id) && id > 0))
for (const team of TEAMS) assert.ok(slimeArtId('crews', team.id))
for (const district of DISTRICTS)
  assert.ok(slimeArtId('districts', district.id))
for (const mode of MODES) assert.ok(slimeArtId('boards', mode.id))
assert.equal(Object.keys(SLIME_CITY_ART.cards).length, 36)
assert.equal(CARDS.length, 60, 'The game has 60 authored starter cards')
assert.equal(
  CARDS.filter((card) => slimeArtId('cards', card.id)).length,
  36,
  '36 illustrations correspond to actual playable card IDs',
)
assert.equal(
  CARDS.filter((card) => !slimeArtId('cards', card.id)).length,
  24,
  'Missing 24 illustrations must remain honest fallbacks',
)
assert.equal(slimeArtId('cards', 'calico'), null)
assert.equal(slimeArtId('cards', 'plating'), 258390)

const classicBlackout = (
  team: Parameters<typeof createMatch>[1],
  foe: Parameters<typeof createMatch>[2],
  seed: number,
) => createMatch('blackout', team, foe, seed, { classicFog: true })

const ids = Object.keys(CITY_PLAN) as DistrictId[]
assert.deepEqual(
  [...ids].sort(),
  DISTRICTS.map((d) => d.id).sort(),
  'Every map district has a plan',
)

// Streets: two-way, named, and the whole city is reachable from the Pitworks
assert.equal(new Set(STREETS.map((s) => s[2])).size, STREETS.length)
const seen = new Set<DistrictId>(['pitworks'])
const queue: DistrictId[] = ['pitworks']
while (queue.length) {
  for (const { to } of streetsFrom(queue.shift()!))
    if (!seen.has(to)) {
      seen.add(to)
      queue.push(to)
    }
}
assert.equal(seen.size, 7, 'All districts connected')
for (const [a, b] of STREETS) {
  assert.ok(streetsFrom(a).some((s) => s.to === b))
  assert.ok(streetsFrom(b).some((s) => s.to === a))
}

// Wayfinding picks a shortest, repeatable route through streets without skipping
// first-crossing story decisions or inventing a direct connection.
assert.deepEqual(
  cityRoute('pitworks', 'crown').map((step) => step.street),
  ['The Long Drain', 'Ledger Sewer'],
)
assert.deepEqual(cityRoute('crown', 'crown'), [])
for (const from of ids)
  for (const to of ids) {
    const route = cityRoute(from, to)
    assert.equal(route.length === 0, from === to)
    let at = from
    for (const leg of route) {
      assert.equal(leg.from, at)
      assert.ok(
        streetsFrom(at).some(
          (street) => street.to === leg.to && street.street === leg.street,
        ),
      )
      at = leg.to
    }
    assert.equal(at, to)
    assert.equal(
      route.length,
      cityRoute(to, from).length,
      'Shortest path lengths must be symmetrical',
    )
  }

// Every crew campaign's rival lives at a unique real district with legal paths.
assert.equal(Object.keys(CAMPAIGN_DISTRICTS).length, TEAMS.length)
assert.equal(new Set(Object.values(CAMPAIGN_DISTRICTS)).size, TEAMS.length)
for (const team of TEAMS) {
  const id = CAMPAIGN_DISTRICTS[team.id]
  assert.ok(DISTRICTS.some((district) => district.id === id))
  assert.ok(cityRoute('pitworks', id).length > 0)
}

// Rivals: distinct names, every crew appears, all three formats appear
const rivals = ids.map((id) => CITY_PLAN[id].rival)
assert.equal(new Set(rivals.map((r) => r.name)).size, 7)
for (const team of TEAMS)
  assert.ok(
    rivals.some((r) => r.team === team.id),
    team.id + ' has a rival',
  )
assert.deepEqual(
  new Set(rivals.map((r) => r.mode)),
  new Set(['blackout', 'gridiron', 'bloodrush']),
)
for (const id of ids) {
  const plan = CITY_PLAN[id]
  assert.equal(plan.choices.length, 2)
  assert.notDeepEqual(plan.choices[0].terms, plan.choices[1].terms)
  assert.notEqual(
    plan.choices[0].standing,
    plan.choices[1].standing,
    id + ' choices pull reputation different ways',
  )
}

// Each road has a unique, authored first-crossing decision with actual stakes.
assert.deepEqual(
  new Set(Object.keys(STREET_STORIES)),
  new Set(STREETS.map((street) => street[2])),
  'Every road has exactly one authored encounter',
)
for (const [from, to, street] of STREETS) {
  const seed = { ...createCity(), location: from }
  const arriving = travel(seed, to)
  assert.equal(arriving.pendingStreet, street)
  assert.equal(arriving.nights, 1)
  assert.equal(
    travel(arriving, from),
    arriving,
    'No walking away from a pending story',
  )
  assert.equal(decide(arriving, CITY_PLAN[to].choices[0].id), arriving)
  assert.equal(boutBlocked(arriving, to), 'Settle the street encounter first.')
  assert.equal(decideStreet(arriving, 'invalid'), arriving)
  const plan = streetStory(arriving)
  assert.ok(plan?.title && plan?.scene)
  assert.equal(plan.choices.length, 2)
  assert.notEqual(plan.choices[0].id, plan.choices[1].id)
  for (const choice of plan.choices) {
    const next = decideStreet(arriving, choice.id)
    assert.notEqual(next, arriving)
    assert.equal(next.pendingStreet, null)
    assert.equal(next.streetChoices[street], choice.id)
    assert.equal(next.standing[to], choice.standing)
    assert.equal(next.heat, Math.max(0, choice.heat))
    assert.deepEqual(next.streetTerms[to], choice.terms)
    assert.deepEqual(boutTerms(next, to), choice.terms)
    assert.equal(
      decideStreet(next, plan.choices[0].id),
      next,
      'Choice only once',
    )
    const returning = travel(next, from)
    assert.equal(
      returning.pendingStreet,
      null,
      'A resolved street does not demand replay',
    )
    assert.equal(returning.streetChoices[street], choice.id)
  }
}
assert.equal(streetStory(createCity()), null)

// Travel follows streets only and costs a night
let city: CityState = createCity()
assert.equal(city.location, 'pitworks')
assert.equal(travel(city, 'crown'), city, 'No street from Pitworks to Crown')
city = travel(city, 'chimera')
assert.equal(city.location, 'chimera')
assert.equal(city.nights, 1)
assert.equal(city.pendingStreet, 'Splice Avenue')
assert.equal(decide(city, 'chimera-serum'), city)
city = decideStreet(city, 'splice-smuggle')
assert.equal(city.pendingStreet, null)

// Decisions: once per district, with standing, heat and bout consequences
const helped = decide(city, 'chimera-serum')
assert.equal(helped.standing.chimera, 2)
assert.equal(helped.heat, 2)
assert.equal(decide(helped, 'chimera-guards'), helped, 'Decide once')
assert.deepEqual(boutTerms(helped, 'chimera'), { playerHp: 2 })
const sold = decide(city, 'chimera-guards')
assert.equal(sold.standing.chimera, -1)
assert.equal(totalStanding(sold), -1, 'Selling out costs citywide standing')

// Terms change the actual match
const base = classicBlackout('riot', 'catgirls', 77)
const hardy = applyTerms(base, boutTerms(helped, 'chimera'))
const p0 = base.units.filter((u) => u.side === 'player')
const p1 = hardy.units.filter((u) => u.side === 'player')
assert.deepEqual(
  p1.map((u) => u.maxHp),
  p0.map((u) => u.maxHp + 2),
)
const thinned = applyTerms(base, boutTerms(sold, 'chimera'))
assert.equal(
  thinned.units.filter((u) => u.side === 'enemy').length,
  base.units.filter((u) => u.side === 'enemy').length - 1,
)
assert.equal(base.units.length, 10, 'applyTerms does not mutate its input')
const trapped = applyTerms(classicBlackout('riot', 'undertow', 5), {
  rivalTrap: true,
})
assert.equal(trapped.traps.filter((t) => t.side === 'enemy').length, 1)
const armored = applyTerms(createMatch('gridiron', 'riot', 'ironjaw', 5), {
  enemyArmor: 1,
  playerMana: 2,
  rounds: -100,
})
assert.ok(
  armored.units.filter((u) => u.side === 'enemy').every((u) => u.armor >= 2),
)
assert.equal(armored.mana, 3)
assert.equal(armored.maxRounds, 8, 'Round limits never collapse below 8')

// Gates: Needle Alley needs a friend, Crown Market needs 3 standing,
// the Grand Pit needs three champions beaten
assert.ok(gateReason(createCity(), 'needles'))
assert.equal(gateReason(helped, 'needles'), null)
assert.ok(gateReason(helped, 'crown'))
assert.ok(boutBlocked(createCity(), 'pitworks'))
assert.equal(decide(createCity(), 'pit-crowd').choices.pitworks, undefined)
let run = createCity()
for (const id of ['chimera', 'foundry', 'undertow'] as DistrictId[])
  run = recordBout(run, id, 'player')
assert.equal(run.cleared.length, 3)
assert.equal(gateReason(run, 'pitworks'), null, 'Grand Pit opens')
assert.equal(
  boutBlocked(run, 'chimera'),
  'Resolve the champion aftermath first.',
)
run = decideAftermath(run, 'undertow-burn')
assert.equal(cityCrisis(run)?.id, 'broadcast')
assert.equal(boutBlocked(run, 'chimera'), 'Resolve the citywide crisis first.')
run = decideCrisis(run, 'broadcast-truth')
assert.equal(boutBlocked(run, 'chimera'), 'Already beaten.')
assert.equal(recordBout(run, 'chimera', 'player'), run, 'No double wins')
assert.equal(
  totalStanding(run),
  7,
  'Aftermath and first crisis both change standing',
)
assert.equal(gateReason(run, 'crown'), null, 'Wins open the Gilt Gate')
assert.equal(cityWon(run), false)
assert.equal(cityWon(recordBout(run, 'pitworks', 'player')), true)

for (const id of ids) {
  const here = { ...createCity(), location: id }
  assert.ok(contractBlocked(here, id))
  const unlocked = recordBout(here, id, 'player')
  assert.equal(unlocked.pendingAftermath, id)
  assert.equal(championAftermath(unlocked), CHAMPION_AFTERMATH[id])
  assert.equal(
    contractBlocked(unlocked, id),
    'Resolve the champion aftermath first.',
  )
  assert.equal(
    travel(unlocked, streetsFrom(id)[0]!.to),
    unlocked,
    'No escaping the aftermath',
  )
  assert.equal(decideAftermath(unlocked, 'not-a-choice'), unlocked)
  const story = CHAMPION_AFTERMATH[id]
  assert.equal(story.choices.length, 2)
  for (const choice of story.choices) {
    const chosenAftermath = decideAftermath(unlocked, choice.id)
    assert.equal(chosenAftermath.pendingAftermath, null)
    assert.equal(chosenAftermath.aftermathChoices[id], choice.id)
    assert.equal(
      chosenAftermath.standing[id],
      unlocked.standing[id] + choice.standing,
    )
    assert.equal(chosenAftermath.heat, Math.max(0, unlocked.heat + choice.heat))
    assert.deepEqual(chosenAftermath.streetTerms[id], choice.terms)
    assert.equal(
      decideAftermath(chosenAftermath, story.choices[0].id),
      chosenAftermath,
    )
    const resolved =
      id === 'pitworks'
        ? decideFinale(chosenAftermath, 'pit-charter')
        : chosenAftermath
    assert.equal(contractBlocked(resolved, id), null)
  }
  assert.equal(championAftermath(unlocked)?.title, story.title)
  const after = decideAftermath(unlocked, story.choices[0].id)
  const settled = id === 'pitworks' ? decideFinale(after, 'pit-charter') : after
  const won = recordContract(settled, id, 'player')
  assert.deepEqual(won.contracts, [id])
  assert.equal(recordContract(won, id, 'player'), won)
  assert.equal(recordContract(settled, id, 'enemy').contracts.length, 0)
  assert.equal(CITY_CONTRACTS[id].team.length > 0, true)
}
// Losses raise heat; too much heat bankrolls every rival
let hot = createCity()
for (let i = 0; i < HEAT_LIMIT; i++) hot = recordBout(hot, 'foundry', 'enemy')
assert.equal(hot.heat, HEAT_LIMIT)
assert.equal(hot.losses, HEAT_LIMIT)
assert.equal(boutTerms(hot, 'foundry').enemyMana, 1)
assert.equal(boutTerms(createCity(), 'foundry').enemyMana, undefined)

console.log(
  'Slime City overworld: 7 districts, 9 streets, rivals, decisions, gates and heat PASS',
)

// Every story tells five unique conflicts, and each crew faces all five rivals.
assert.deepEqual(
  Object.keys(FACTION_CAMPAIGNS).sort(),
  TEAMS.map((team) => team.id).sort(),
)
const storyIds = TEAMS.map((team) => team.id)
const distinctTitles: string[] = []
const uniqueAftermaths = new Set<string>()
for (const team of TEAMS) {
  const campaign = FACTION_CAMPAIGNS[team.id]
  assert.equal(campaign.team, team.id)
  assert.ok(campaign.prologue && campaign.principle)
  assert.equal(campaign.chapters.length, 5)
  assert.deepEqual(
    new Set(campaign.chapters.map((chapter) => chapter.foe)),
    new Set(storyIds.filter((id) => id !== team.id)),
    'Every rival challenged exactly once for ' + team.id,
  )
  let story = createCampaignSave()
  for (const [index, chapter] of campaign.chapters.entries()) {
    distinctTitles.push(chapter.title)
    assert.ok(chapter.scene && chapter.victory && chapter.defeat)
    assert.deepEqual(
      chapter.choices.map((choice) => choice.id),
      ['conviction', 'cunning'],
    )
    for (const option of chapter.choices) {
      assert.ok(describeTerms(option.terms))
      const ending = CAMPAIGN_CHOICE_CONSEQUENCES[team.id][index]?.[option.id]
      assert.ok(ending?.victory && ending.defeat)
      uniqueAftermaths.add(ending.victory)
      uniqueAftermaths.add(ending.defeat)
    }
    const braveWin = resolveCampaignBattle(
      story,
      team.id,
      index,
      chapter.foe,
      'conviction',
      'player',
    )
    const slyWin = resolveCampaignBattle(
      story,
      team.id,
      index,
      chapter.foe,
      'cunning',
      'player',
    )
    assert.notEqual(
      braveWin[team.id].lastScene,
      slyWin[team.id].lastScene,
      'Choices must create different authored victory text',
    )
    const slyLoss = resolveCampaignBattle(
      story,
      team.id,
      index,
      chapter.foe,
      'cunning',
      'enemy',
    )
    assert.notEqual(
      slyLoss[team.id].lastScene,
      braveWin[team.id].lastScene,
      'Losing cannot reuse a victory',
    )
    assert.equal(campaignChapter(story, team.id), chapter)
    const wrongRival = storyIds.find(
      (id) => id !== team.id && id !== chapter.foe,
    )!
    assert.equal(
      resolveCampaignBattle(
        story,
        team.id,
        index,
        wrongRival,
        'conviction',
        'player',
      ),
      story,
    )
    assert.equal(
      resolveCampaignBattle(
        story,
        team.id,
        index + 1,
        chapter.foe,
        'conviction',
        'player',
      ),
      story,
    )
    const lost = resolveCampaignBattle(
      story,
      team.id,
      index,
      chapter.foe,
      'conviction',
      'enemy',
    )
    assert.equal(lost[team.id].wins, index, 'Loss cannot unlock next mission')
    assert.equal(lost[team.id].losses, 1)
    const won = resolveCampaignBattle(
      story,
      team.id,
      index,
      chapter.foe,
      index % 2 ? 'cunning' : 'conviction',
      'player',
    )
    assert.equal(won[team.id].wins, index + 1)
    assert.equal(won[team.id].decisions.length, index + 1)
    assert.ok(won[team.id].lastScene?.startsWith(chapter.victory))
    assert.ok(
      won[team.id].lastScene?.includes(
        CAMPAIGN_CHOICE_CONSEQUENCES[team.id][index]![
          index % 2 ? 'cunning' : 'conviction'
        ].victory,
      ),
    )
    assert.equal(
      resolveCampaignBattle(
        won,
        team.id,
        index,
        chapter.foe,
        'conviction',
        'player',
      ),
      won,
      'Resolved battles cannot be farmed for progression',
    )
    story = won
  }
  assert.equal(campaignChapter(story, team.id), null)
  assert.ok(campaignEnding(story, team.id))
  assert.equal(
    resolveCampaignBattle(
      story,
      team.id,
      4,
      campaign.chapters[4]!.foe,
      'conviction',
      'player',
    ),
    story,
  )
  for (const other of storyIds.filter((id) => id !== team.id)) {
    assert.equal(
      story[other].wins,
      0,
      'Other faction campaigns remain independent',
    )
  }
  assert.equal(campaignEnding(createCampaignSave(), team.id), null)
}
assert.equal(new Set(distinctTitles).size, 30)
assert.equal(
  uniqueAftermaths.size,
  120,
  'Every result has distinct authored text',
)
const alternate = createCampaignSave()
let divergent = alternate
for (const [index, chapter] of FACTION_CAMPAIGNS.riot.chapters.entries()) {
  divergent = resolveCampaignBattle(
    divergent,
    'riot',
    index,
    chapter.foe,
    'cunning',
    'player',
  )
}
assert.equal(
  campaignEnding(divergent, 'riot'),
  FACTION_CAMPAIGNS.riot.compromise,
)
console.log(
  'Slime City faction campaigns: 6 crews, 30 rival chapters, gating and endings PASS',
)

// Story missions combine district consequences with one specific story
// approach; this cannot modify the city, chapter definitions, or browser
// account rewards. The direct STORY button keeps the original terms.
const openingCity = createCity()
const atUndertow = decideStreet(
  travel(openingCity, 'undertow'),
  'drain-protect',
)
const chapterApproach =
  FACTION_CAMPAIGNS.catgirls.chapters[0]!.choices[1]!.terms
const combined = storyMissionTerms(atUndertow, 'undertow', chapterApproach)
assert.equal(combined.playerMana, 3)
assert.equal(combined.rivalTrap, true)
assert.equal(chapterApproach.playerMana, 2)
assert.equal(openingCity.location, 'pitworks')
assert.equal(openingCity.pendingStreet, null)
const heatedCity = { ...atUndertow, heat: HEAT_LIMIT }
assert.equal(
  storyMissionTerms(heatedCity, 'undertow', chapterApproach).enemyMana,
  (chapterApproach.enemyMana ?? 0) + 1,
  'Too much city heat finances the enemy even in the faction campaign',
)
const cleanCity = createCity()
assert.equal(
  storyMissionTerms(cleanCity, 'undertow', chapterApproach).playerMana,
  chapterApproach.playerMana,
)
assert.equal(
  applyTerms(createMatch('blackout', 'catgirls', 'undertow', 2001), combined)
    .mana,
  4,
)
const scenarioBase = createMatch('blackout', 'catgirls', 'bloodfairies', 2001)
const scenario = applyTerms(
  {
    ...scenarioBase,
    hands: {
      player: ['lynx', ...scenarioBase.hands.player.slice(0, 3)],
      enemy: ['sprite', ...scenarioBase.hands.enemy.slice(0, 3)],
    },
  },
  { playerHp: 2, enemyArmor: 1, fewerRivals: 1 },
)
assert.equal(scenario.units.length, 0)
assert.equal(
  observe(scenario, 'enemy').fieldCap,
  observe(scenarioBase, 'enemy').fieldCap - 1,
)
const summoned = deploy(scenario, 'lynx', 0, 0)
const lynx = summoned.units.find((unit) => unit.side === 'player')
assert.ok(lynx, 'A chapter buff must survive an initially empty battlefield')
assert.equal(lynx.maxHp, 4, 'Your HP bonus applies when a card is summoned')
assert.equal(lynx.hp, 4)
const withEnemy = deployAs(summoned, 'enemy', 'sprite', 9, 0)
const sprite = withEnemy.units.find((unit) => unit.side === 'enemy')
assert.ok(sprite)
assert.equal(sprite.armor, 1, 'Rival armor applies to future enemy summons')
assert.equal(
  withEnemy.scenarioBonus?.fewerRivals,
  1,
  'The enemy field cap reduction persists through recorded deployments',
)
assert.equal(scenario.units.length, 0, 'Applying terms and summoning are pure')

console.log('Slime City campaign street consequence contract PASS')

// Store flow: walk a street, decide, fight the rival under those terms,
// and the finished bout changes the city.
const { createPinia, setActivePinia } = await import('pinia')
const { useSlimeCityStore } = await import('../../stores/slimeCity')
setActivePinia(createPinia())
const lab = useSlimeCityStore()
lab.chooseTeam('catgirls')
assert.equal(lab.city.location, 'pitworks')
lab.visit('crown')
assert.equal(lab.routeSteps.length, 2, 'Distant district plans two street legs')
assert.equal(lab.route?.to, 'undertow')
lab.walk()
assert.equal(lab.city.location, 'undertow')
assert.equal(lab.city.pendingStreet, 'The Long Drain')
assert.equal(lab.districtId, 'crown', 'Destination remains selected en route')
lab.walk()
assert.equal(
  lab.city.location,
  'undertow',
  'Street event prevents skipping ahead',
)
lab.chooseStreet(STREET_STORIES['The Long Drain']!.choices[0].id)
assert.equal(streetStory(lab.city), null)
assert.equal(lab.districtId, 'crown', 'Choice preserves onward destination')
assert.equal(lab.route?.to, 'crown')
lab.walk()
assert.equal(lab.city.location, 'crown')
assert.equal(lab.city.pendingStreet, 'Ledger Sewer')
lab.chooseStreet(STREET_STORIES['Ledger Sewer']!.choices[1].id)
assert.equal(lab.city.location, 'crown')
assert.equal(lab.routeSteps.length, 0)
lab.showCards()
assert.equal(lab.view, 'cards')
lab.showCity()
lab.showCampaign()
assert.equal(lab.view, 'campaign')
lab.showCity()
lab.resetCity()

lab.visit('pitworks')
lab.walk()
assert.equal(
  lab.city.location,
  'pitworks',
  'Walking to the current district is a no-op',
)
lab.visit('chimera')
assert.equal(lab.route?.street, 'Splice Avenue')
lab.walk()
assert.equal(lab.city.location, 'chimera')
assert.equal(lab.streetEvent?.title, 'THE RUNAWAY AMBULANCE')
assert.equal(lab.streetProgress, 0)
lab.chooseStreet('splice-smuggle')
assert.equal(lab.streetProgress, 1)
assert.equal(lab.streetEvent, null)
lab.choose('chimera-serum')
lab.fightRival()
assert.equal(lab.view, 'arena')
assert.equal(lab.mode, 'blackout')
assert.equal(lab.match.foeId, 'catgirls', 'Mirror rival bout')
assert.equal(
  lab.match.units.length,
  0,
  'New Blackout starts with open deployment',
)
assert.equal(lab.hand.length, 4, 'New Blackout deals four cards')
assert.ok(
  lab.match.units
    .filter((u) => u.side === 'player')
    .every((u) => u.maxHp === u.hp && u.maxHp >= 3),
  'Street and serum terms stack (+2 HP)',
)
lab.closeGuide()
for (let i = 0; i < 40 && !lab.match.victor; i++) lab.nextRound()
assert.ok(lab.match.victor)
assert.equal(lab.bout, null, 'Bout settled')
assert.equal(lab.lastBout, 'chimera')
if (lab.match.victor === 'player')
  assert.ok(lab.city.cleared.includes('chimera'))
if (lab.match.victor === 'enemy') assert.equal(lab.city.heat, 3)
lab.showCity()
lab.resetCity()
assert.equal(lab.city.nights, 0)
lab.city = recordBout(
  { ...createCity(), location: 'chimera' },
  'chimera',
  'player',
)
assert.equal(lab.aftermathEvent?.title, CHAMPION_AFTERMATH.chimera.title)
lab.chooseAftermath('chimera-free')
assert.equal(lab.city.pendingAftermath, null)
assert.equal(lab.city.aftermathChoices.chimera, 'chimera-free')
lab.visit('chimera')
lab.fightContract()
assert.equal(lab.view, 'arena')
assert.equal(lab.mode, 'blackout', 'Contracts use the main Blackout ruleset')
assert.equal(lab.contractBout, 'chimera')
assert.equal(lab.match.foeId, 'catgirls')
lab.closeGuide()
for (let i = 0; i < 40 && !lab.match.victor; i++) lab.nextRound()
assert.ok(lab.match.victor)
assert.equal(lab.contractBout, null)
assert.equal(lab.lastContract, 'chimera')
if (lab.match.victor === 'player')
  assert.deepEqual(lab.city.contracts, ['chimera'])
if (lab.match.victor === 'enemy') assert.equal(lab.city.contracts.length, 0)
lab.showCity()
lab.resetCity()
assert.equal(lab.city.contracts.length, 0)

// Citywide pressure is earned at two, four and six victories. Each choice is
// a single-use seeded-independent story beat that affects later real fights.
assert.deepEqual(
  CIVIC_CRISES.map((crisis) => crisis.afterChampions),
  [2, 4, 6],
)
assert.equal(cityCrisis(createCity()), null)
let crisisSweep: CityState = createCity()
let firstCrisisCity: CityState | null = null
const opposition: DistrictId[] = [
  'chimera',
  'foundry',
  'undertow',
  'redline',
  'needles',
  'crown',
]
for (const [index, id] of opposition.entries()) {
  const before = crisisSweep
  crisisSweep = recordBout(crisisSweep, id, 'player')
  assert.equal(
    cityCrisis(crisisSweep),
    null,
    'Champion aftermath is always first',
  )
  assert.ok(championAftermath(crisisSweep))
  assert.equal(decideCrisis(crisisSweep, 'broadcast-truth'), crisisSweep)
  assert.equal(
    decideAftermath(before, CHAMPION_AFTERMATH[id].choices[0].id),
    before,
    'Cannot choose an aftermath without its victory',
  )
  crisisSweep = decideAftermath(
    crisisSweep,
    CHAMPION_AFTERMATH[id].choices[0].id,
  )
  if (index % 2 === 0) {
    assert.equal(cityCrisis(crisisSweep), null)
    continue
  }
  const active = CIVIC_CRISES[(index - 1) / 2]!
  assert.equal(cityCrisis(crisisSweep)?.id, active.id)
  assert.equal(active.choices.length, 2)
  assert.equal(
    travel(crisisSweep, streetsFrom(crisisSweep.location)[0]!.to),
    crisisSweep,
    'Citywide disaster cannot be ignored by walking away',
  )
  assert.equal(
    boutBlocked(crisisSweep, 'pitworks'),
    'Resolve the citywide crisis first.',
  )
  assert.equal(decideCrisis(crisisSweep, 'not-a-crisis-choice'), crisisSweep)
  if (index === 1) firstCrisisCity = crisisSweep
  const choice = active.choices[index === 3 ? 1 : 0]
  const beforeChoice = crisisSweep
  crisisSweep = decideCrisis(crisisSweep, choice.id)
  assert.equal(cityCrisis(crisisSweep), null)
  assert.equal(crisisSweep.crisisChoices[active.id], choice.id)
  assert.equal(
    crisisSweep.standing[crisisSweep.location],
    beforeChoice.standing[crisisSweep.location] + choice.standing,
  )
  assert.equal(crisisSweep.heat, Math.max(0, beforeChoice.heat + choice.heat))
  assert.equal(
    decideCrisis(crisisSweep, active.choices[0].id),
    crisisSweep,
    'No second rewards or rerolls from a resolved crisis',
  )
}
assert.equal(Object.keys(crisisSweep.crisisChoices).length, 3)
assert.equal(crisisSweep.crisisTerms.playerMana, 2)
assert.equal(crisisSweep.crisisTerms.enemyArmor, -1)
const boosted = applyTerms(
  createMatch('blackout', 'riot', 'catgirls', 421),
  boutTerms(crisisSweep, 'pitworks'),
)
assert.equal(boosted.mana, 3, 'Citywide alliance supplies two opening mana')
assert.equal(
  boosted.scenarioBonus?.enemyArmor,
  -1,
  'The exposed rival armor penalty reaches real future deployments',
)
assert.deepEqual(createCity().crisisChoices, {})
console.log(
  'Slime City citywide acts: 3 crises, choice locks and battle effects PASS',
)

console.log('Slime City overworld store flow PASS')

lab.showCampaign()
lab.chooseTeam('ironjaw')
assert.equal(lab.view, 'campaign')
assert.equal(lab.activeChapter?.foe, 'exchange')
lab.startCampaignBattle('conviction')
assert.equal(lab.view, 'arena')
assert.equal(lab.mode, 'blackout')
assert.equal(lab.match.foeId, 'exchange')
assert.equal(lab.campaignBout?.team, 'ironjaw')
assert.equal(lab.match.enemyMana, 2, 'Story approach affects match resources')
lab.closeGuide()
for (let i = 0; i < 40 && !lab.match.victor; i++) lab.nextRound()
assert.ok(lab.match.victor)
assert.equal(lab.campaignBout, null)
assert.equal(lab.lastCampaign, 'ironjaw')
assert.equal(
  lab.campaignSave.ironjaw.wins,
  lab.match.victor === 'player' ? 1 : 0,
)
lab.showCampaign()
assert.equal(lab.view, 'campaign')
assert.equal(lab.campaignSave.catgirls.wins, 0)
lab.chooseTeam('catgirls')
assert.equal(
  lab.activeChapter?.foe,
  'undertow',
  'Switching crews begins their own story',
)
// The STORY map shortcut launches the same chapter via a physical destination,
// but never bypasses a first-crossing story or grants account rewards.
lab.showCampaign()
lab.resetCity()
lab.findCampaignBattle()
assert.equal(lab.view, 'city')
assert.equal(lab.districtId, 'undertow')
assert.equal(lab.routeSteps.length, 1)
lab.startCampaignBattle('conviction')
assert.equal(lab.view, 'city', 'Cannot launch mission while across town')
lab.walk()
assert.equal(lab.city.location, 'undertow')
assert.equal(lab.city.pendingStreet, 'The Long Drain')
lab.startCampaignBattle('conviction')
assert.equal(lab.view, 'city', 'Unresolved street encounter blocks mission')
lab.chooseStreet(STREET_STORIES['The Long Drain']!.choices[0].id)
assert.equal(lab.campaignAtDestination, true)
lab.startCampaignBattle('cunning')
assert.equal(lab.view, 'arena')
assert.equal(lab.match.foeId, 'undertow')
assert.ok(lab.campaignBout, 'City mission uses campaign settlement')
assert.equal(lab.match.teamId, 'catgirls')
assert.equal(
  lab.match.mana,
  4,
  'City-based chapter includes +2 cunning mana AND +1 street decision mana',
)
assert.equal(
  lab.city.cleared.length,
  0,
  'Faction mission is separate from district champion ledger',
)
console.log('Slime City faction campaign store battle PASS')

// City-launched chapters must settle citywide crises before a battle can begin.
lab.showCity()
lab.resetCity()
assert.ok(firstCrisisCity)
lab.city = { ...firstCrisisCity, location: 'undertow' }
lab.chooseTeam('catgirls')
lab.findCampaignBattle()
assert.equal(lab.view, 'city')
assert.equal(lab.crisisEvent?.id, 'broadcast')
assert.equal(lab.campaignAtDestination, false)
lab.startCampaignBattle('conviction')
assert.equal(lab.view, 'city', 'City crisis blocks the mission button')
lab.chooseCrisis('broadcast-truth')
assert.equal(lab.crisisEvent, null)
assert.equal(lab.campaignAtDestination, true)
lab.startCampaignBattle('conviction')
assert.equal(lab.view, 'arena', 'Crisis resolution unlocks city story fights')
assert.equal(lab.match.teamId, 'catgirls')
assert.equal(
  lab.match.mana,
  2,
  'City campaign inherits one bonus opening mana from the crisis',
)
console.log('Slime City civic crisis / campaign store integration PASS')

// Grand Pit victory is a ceremony, not merely a boolean. Champion aftermath
// comes first; a four-victory crisis takes priority over the final charter.
const preFinaleCity = createCity()
assert.equal(cityFinale(preFinaleCity), null)
assert.equal(decideFinale(preFinaleCity, 'pit-charter'), preFinaleCity)
const pitVictory = recordBout(preFinaleCity, 'pitworks', 'player')
assert.equal(cityWon(pitVictory), true)
assert.equal(cityFinale(pitVictory), null)
assert.ok(championAftermath(pitVictory))
const pitAftermath = decideAftermath(
  pitVictory,
  CHAMPION_AFTERMATH.pitworks.choices[0].id,
)
assert.equal(cityFinale(pitAftermath), CITY_FINALE)
assert.equal(cityEpilogue(pitAftermath), null)
assert.equal(
  boutBlocked(pitAftermath, 'chimera'),
  'Choose the fate of the Grand Pit first.',
)
assert.equal(
  contractBlocked(pitAftermath, 'pitworks'),
  'Choose the fate of the Grand Pit first.',
)
assert.equal(
  travel(pitAftermath, 'chimera'),
  pitAftermath,
  'Cannot walk away before deciding who owns the city',
)
assert.equal(
  decideFinale(pitAftermath, 'fake-finale'),
  pitAftermath,
  'Invalid ending choices do not mutate the city',
)
for (const choice of CITY_FINALE.choices) {
  const completed = decideFinale(pitAftermath, choice.id)
  assert.equal(completed.finaleChoice, choice.id)
  assert.equal(cityFinale(completed), null)
  assert.equal(
    completed.standing.pitworks,
    pitAftermath.standing.pitworks + choice.standing,
  )
  assert.equal(completed.heat, Math.max(0, pitAftermath.heat + choice.heat))
  assert.ok(cityEpilogue(completed)?.title)
  assert.equal(
    decideFinale(completed, CITY_FINALE.choices[0].id),
    completed,
    'Cannot earn ending consequences a second time',
  )
  assert.notEqual(
    travel(completed, 'chimera'),
    completed,
    'Optional districts remain playable after the finale',
  )
}
const charter = decideFinale(pitAftermath, 'pit-charter')
const crowned = decideFinale(pitAftermath, 'pit-crown')
assert.equal(charter.crisisTerms.playerHp, 1)
assert.equal(crowned.crisisTerms.playerMana, 1)
assert.notEqual(cityEpilogue(charter)?.title, cityEpilogue(crowned)?.title)
assert.equal(createCity().finaleChoice, null)
let fourChampions = run
fourChampions = recordBout(fourChampions, 'pitworks', 'player')
fourChampions = decideAftermath(
  fourChampions,
  CHAMPION_AFTERMATH.pitworks.choices[0].id,
)
assert.equal(cityCrisis(fourChampions)?.id, 'strike')
assert.equal(cityFinale(fourChampions), null)
fourChampions = decideCrisis(fourChampions, 'strike-solidarity')
assert.equal(cityFinale(fourChampions), CITY_FINALE)
fourChampions = decideFinale(fourChampions, 'pit-charter')
assert.ok(cityEpilogue(fourChampions)?.legacy.includes('trust'))
assert.equal(cityFinale(fourChampions), null)
console.log(
  'Slime City Grand Pit finale, gates, alternatives and aftermath PASS',
)

lab.showCity()
lab.resetCity()
lab.city = { ...pitAftermath, location: 'undertow' }
lab.chooseTeam('catgirls')
lab.findCampaignBattle()
assert.equal(lab.finaleEvent?.title, CITY_FINALE.title)
assert.equal(lab.campaignAtDestination, false, 'Finale blocks a city chapter')
lab.startCampaignBattle('conviction')
assert.equal(lab.view, 'city')
lab.chooseFinale('pit-charter')
assert.equal(lab.finaleEvent, null)
assert.equal(lab.finaleResult?.title, cityEpilogue(charter)?.title)
assert.equal(lab.campaignAtDestination, true)
lab.dismissFinale()
assert.equal(lab.finaleDismissed, true)
lab.revisitFinale()
assert.equal(lab.finaleDismissed, false)
assert.equal(lab.districtId, 'pitworks')
lab.resetCity()
assert.equal(lab.city.finaleChoice, null)
assert.equal(lab.finaleResult, null)
assert.equal(lab.finaleDismissed, false)
console.log('Slime City finale store / new run navigation PASS')
