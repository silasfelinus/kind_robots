// Slime City overworld contract (conductor slime-city t-007 first slice):
// streets connect all seven districts, travel follows streets, each district
// has a distinct rival and one street decision whose consequences reach the
// rival bout and the city's gates, and bout results open the Grand Pit.
import assert from 'node:assert/strict'
import {
  CLASH_BOSS_HP,
  applyClashCommand,
  chooseClashCpu,
  createClash,
  type ClashState,
} from '../slimeCity/clash'
import {
  CLASH_TERM_WEIGHTS,
  clashBossesFromTerms,
} from '../slimeCity/clashBouts'
import {
  CAMPAIGN_APPROACH_REFLECTIONS,
  CAMPAIGN_RIVAL_REACTIONS,
  campaignAftermathFor,
} from '../slimeCity/campaignAftermath'
import { CAMPAIGN_CHOICE_CONSEQUENCES } from '../slimeCity/campaignConsequences'
import { CAMPAIGN_CHAPTER_SUPPORT } from '../slimeCity/campaignSupport'
import {
  CAMPAIGN_RETRY_VOICES,
  CAMPAIGN_RIVAL_EXCHANGES,
  CAMPAIGN_RIVAL_MEMORY,
  campaignConversationFor,
} from '../slimeCity/campaignDialogue'
import {
  campaignBattleTerms,
  campaignChapter,
  campaignEchoFor,
  campaignFavorsFor,
  campaignLegacyFor,
  campaignLegacyTerms,
  CAMPAIGN_ECHOES,
  campaignEnding,
  createCampaignSave,
  describeTerms,
  FACTION_CAMPAIGNS,
  resolveCampaignBattle,
} from '../slimeCity/campaign'

import {
  applyTerms,
  type BoutTerms,
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
  BLACKOUT_HAND_SIZE,
  BLACKOUT_MANA_GAIN,
  CARDS,
  createMatch,
  deploy,
  deployAs,
  observe,
  DISTRICTS,
  MODES,
  PLAYER_MODES,
  TEAMS,
} from '../slimeCity/prototypes'
import {
  slimeArtId,
  SLIME_CITY_ART,
  SLIME_CITY_ART_COUNT,
  slimeBoardArtId,
} from '../slimeCity/artManifest'

const artIds = [
  ...Object.values(SLIME_CITY_ART.crews),
  ...Object.values(SLIME_CITY_ART.districts),
  ...Object.values(SLIME_CITY_ART.cards),
  ...Object.values(SLIME_CITY_ART.boards),
  ...Object.values(SLIME_CITY_ART.ui),
  ...Object.values(SLIME_CITY_ART.story),
  ...Object.values(SLIME_CITY_ART.attacks),
  ...Object.values(SLIME_CITY_ART.tokens),
  ...Object.values(SLIME_CITY_ART.bosses),
]
assert.equal(
  SLIME_CITY_ART_COUNT,
  808,
  '233 curated ids plus the 2026-11-07 art pass: 542 verified renders (217 cards, 263 board tokens, 60 story plates, 2 attacks), plus 11 new Ironjaw board-token moods from the 2026-11-09 ogre redo, plus the lizard Union Cook (2026-11-10), plus the title key art and two re-rendered cards (2026-11-11), plus 17 journey epilogue plates (2026-11-12) and the Ironjaw journey-left redo (2026-11-14)',
)
// 23 boss mood portraits (2026-11-11 PT) sit outside SLIME_CITY_ART_COUNT.
assert.equal(artIds.length, 808 + 23)
// Boss reactions for the Clash versus console: every key is
// '<crew>/<ready|hit|gloat|beaten>' for a real crew.
for (const key of Object.keys(SLIME_CITY_ART.bosses)) {
  const [crew, mood] = key.split('/')
  assert.ok(
    TEAMS.some((team) => team.id === crew),
    key + ' names a crew',
  )
  assert.ok(
    ['ready', 'hit', 'gloat', 'beaten'].includes(mood!),
    key + ' is a mood',
  )
}
assert.equal(Object.keys(SLIME_CITY_ART.bosses).length, 23)
assert.ok(slimeArtId('ui', 'title-splash'), 'Generated title key art')
// Evolution paintings (2026-11-11 PT curation of the Krea escalation ledgers):
// every key names a real card and level, and no painting is reused.
const evolutionKeys = Object.keys(SLIME_CITY_ART.evolutions)
assert.equal(evolutionKeys.length, 425, '425 curated L2/L3 evolution paintings')
const cardIds = new Set(CARDS.map((c) => c.id))
for (const key of evolutionKeys) {
  const [cardId = '', level = ''] = key.split('@')
  assert.ok(cardIds.has(cardId), key + ' evolves a real card')
  assert.ok(['2', '3', '3b'].includes(level), key + ' is level 2, 3 or 3b')
}
assert.equal(
  new Set(Object.values(SLIME_CITY_ART.evolutions)).size,
  evolutionKeys.length,
  'each evolution painting is used once',
)
assert.ok(
  CARDS.filter((c) => slimeArtId('cards', c.id)).length >= 290,
  'nearly the whole catalog is illustrated',
)
// Board tokens (t-022): every key is '<creature card>/<fierce|guard|hurt>'.
for (const key of Object.keys(SLIME_CITY_ART.tokens)) {
  const [cardId, pose] = key.split('/')
  const card = CARDS.find((c) => c.id === cardId)
  assert.ok(card && card.kind === 'creature', key + ' names a creature card')
  assert.ok(['fierce', 'guard', 'hurt'].includes(pose!), key + ' is a mood')
}
assert.equal(
  new Set(artIds).size,
  artIds.length,
  'Each render has distinct provenance',
)
assert.ok(artIds.every((id) => Number.isInteger(id) && id > 0))
for (const team of TEAMS) assert.ok(slimeArtId('crews', team.id))
for (const district of DISTRICTS)
  assert.ok(slimeArtId('districts', district.id))
for (const mode of MODES)
  if (mode.id !== 'turf') assert.ok(slimeArtId('boards', mode.id))
// TURF's own board is queued art (Conductor slime-city/t-023); until it lands it
// plays on each district's painted Blackout floor, never a blank slot.
for (const district of DISTRICTS)
  assert.equal(
    slimeBoardArtId(district.id, 'turf'),
    slimeBoardArtId(district.id, 'blackout'),
  )
// MEATBALL is retired from play: BLACKOUT is the default tab, then BLOODRUSH
// and the Go-style TURF.
assert.deepEqual(
  PLAYER_MODES.map((mode) => mode.id),
  ['blackout', 'bloodrush', 'turf'],
)
// Each district fights on its own floor per mode (round 4), never the shared
// mode board; an unknown district still falls back to the shared board.
for (const district of DISTRICTS)
  for (const mode of PLAYER_MODES)
    assert.notEqual(
      slimeBoardArtId(district.id, mode.id),
      slimeArtId('boards', mode.id),
      district.id + ' ' + mode.id + ' has its own board',
    )
assert.ok(slimeArtId('ui', 'card-back'), 'Painted card back')
assert.equal(
  slimeBoardArtId('nowhere', 'blackout'),
  slimeArtId('boards', 'blackout'),
)
// 291 since the lizard round painted Union Cook (2026-11-10 PT); 293 with
// Pocket-Sized Problem and Long Drain Sting (2026-11-11 PT).
assert.equal(Object.keys(SLIME_CITY_ART.cards).length, 293)
assert.equal(
  TEAMS.flatMap((team) => [...team.creatures, ...team.special]).length,
  60,
  'Six ten-card founder decks',
)
assert.equal(
  CARDS.length,
  300,
  '48 Gutter Crown faction cards and 60 neutral mercenaries are playable',
)
assert.equal(
  CARDS.filter((card) => slimeArtId('cards', card.id)).length,
  293,
  '293 illustrations correspond to actual playable card IDs',
)
assert.equal(
  TEAMS.flatMap((team) => [...team.creatures, ...team.special]).filter(
    (id) => !slimeArtId('cards', id),
  ).length,
  0,
  'every founder card is illustrated',
)
assert.equal(
  CARDS.filter((card) => !slimeArtId('cards', card.id)).length,
  CARDS.length - 293,
  'Unrendered faction and neutral cards retain image-shaped fallbacks',
)
assert.ok(slimeArtId('cards', 'calico'), 'curation redo replaced Calico')
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

// Rivals: distinct names, every crew appears, both player formats appear (no MEATBALL)
const rivals = ids.map((id) => CITY_PLAN[id].rival)
assert.equal(new Set(rivals.map((r) => r.name)).size, 7)
for (const team of TEAMS)
  assert.ok(
    rivals.some((r) => r.team === team.id),
    team.id + ' has a rival',
  )
assert.deepEqual(
  new Set(rivals.map((r) => r.mode)),
  new Set(['blackout', 'bloodrush']),
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

/**
 * A win's tactical echo survives through account-backed campaign decisions,
 * affects exactly the next chapter, and has the same rules on both story
 * quick-starts and district launches. Defeats do not earn an echo.
 */
for (const team of TEAMS) {
  const chapter = FACTION_CAMPAIGNS[team.id].chapters[0]!
  const fresh = createCampaignSave()
  assert.equal(campaignEchoFor(fresh, team.id), null)
  const defeated = resolveCampaignBattle(
    fresh,
    team.id,
    0,
    chapter.foe,
    'cunning',
    'enemy',
  )
  assert.equal(campaignEchoFor(defeated, team.id), null)
  for (const approach of ['conviction', 'cunning'] as const) {
    const saved = resolveCampaignBattle(
      fresh,
      team.id,
      0,
      chapter.foe,
      approach,
      'player',
    )
    const expected = {
      ...CAMPAIGN_ECHOES[team.id][approach],
      ...CAMPAIGN_CHAPTER_SUPPORT[team.id][0]![approach],
    }
    assert.deepEqual(campaignEchoFor(saved, team.id), expected)
    assert.ok(expected.title.length >= 10 && expected.story.length >= 55)
    assert.deepEqual(campaignBattleTerms(saved, team.id, {}), expected.terms)
    const baseTerms = {
      playerMana: 1,
      enemyMana: 1,
      enemyArmor: 1,
      rivalTrap: true,
    }
    const adjusted = campaignBattleTerms(saved, team.id, baseTerms)
    assert.equal(
      adjusted.playerMana,
      baseTerms.playerMana + (expected.terms.playerMana ?? 0),
    )
    assert.equal(
      adjusted.enemyMana,
      baseTerms.enemyMana + (expected.terms.enemyMana ?? 0),
    )
    assert.equal(
      adjusted.enemyArmor,
      baseTerms.enemyArmor + (expected.terms.enemyArmor ?? 0),
    )
    assert.equal(adjusted.rivalTrap, true)
    assert.deepEqual(
      baseTerms,
      { playerMana: 1, enemyMana: 1, enemyArmor: 1, rivalTrap: true },
      'Previous encounters and shared chapter data are never mutated',
    )
    const nextRival = FACTION_CAMPAIGNS[team.id].chapters[1]!.foe
    const actualMatch = applyTerms(
      createMatch('blackout', team.id, nextRival, 20261102),
      adjusted,
    )
    assert.equal(
      actualMatch.mana,
      BLACKOUT_MANA_GAIN + (adjusted.playerMana ?? 0),
    )
    assert.equal(
      actualMatch.enemyMana,
      BLACKOUT_MANA_GAIN + (adjusted.enemyMana ?? 0),
    )
    assert.equal(campaignEchoFor(saved, nextRival), null)
    const before = saved
    const failedRetry = resolveCampaignBattle(
      saved,
      team.id,
      1,
      nextRival,
      approach,
      'enemy',
    )
    assert.deepEqual(
      campaignEchoFor(failedRetry, team.id),
      campaignEchoFor(before, team.id),
      'Losing next chapter does not erase an earned story echo',
    )
  }
}
console.log(
  'Slime City 12 faction campaign echoes: earned, bounded, applied PASS',
)

// The five saved chapters must offer distinct support choices per crew,
// not five copies of a two-effect faction buff. Check both approaches
// independently, all sixty narratives, bounded battle terms and unlock order.
const supportNames = new Set<string>()
for (const team of TEAMS) {
  const chapters = FACTION_CAMPAIGNS[team.id].chapters
  const support = CAMPAIGN_CHAPTER_SUPPORT[team.id]
  assert.equal(support.length, chapters.length)
  const uniqueTerms = new Set<string>()
  let base = createCampaignSave()
  for (let index = 0; index < chapters.length; index++) {
    const chapter = chapters[index]!
    const pair = support[index]!
    for (const approach of ['conviction', 'cunning'] as const) {
      const favor = pair[approach]
      assert.ok(favor.title.length >= 10)
      assert.ok(favor.story.length >= 55)
      assert.ok(
        !supportNames.has(favor.title),
        'Each earned ally has a distinct name',
      )
      supportNames.add(favor.title)
      const terms = favor.terms
      const keys = Object.keys(terms)
      assert.ok(keys.length > 0)
      assert.ok(
        keys.every((key) =>
          [
            'playerMana',
            'enemyMana',
            'playerHp',
            'enemyArmor',
            'fewerRivals',
            'rounds',
            'rivalTrap',
          ].includes(key),
        ),
      )
      assert.ok((terms.playerMana ?? 0) <= 2)
      assert.ok((terms.enemyMana ?? 0) <= 1)
      assert.ok((terms.playerHp ?? 0) <= 2)
      assert.ok((terms.rounds ?? 0) <= 2)
      assert.ok((terms.fewerRivals ?? 0) <= 1)
      assert.ok((terms.enemyArmor ?? 0) >= -1)
      if (terms.rivalTrap) assert.equal(terms.playerMana, 2)
      uniqueTerms.add(JSON.stringify(terms))
      if (index < 4) {
        const unlocked = resolveCampaignBattle(
          base,
          team.id,
          index,
          chapter.foe,
          approach,
          'player',
        )
        assert.equal(campaignFavorsFor(unlocked, team.id).length, index + 1)
        assert.deepEqual(
          campaignBattleTerms(unlocked, team.id, {}, index),
          terms,
          'Saved choice unlocks its own chapter terms and never a later chapter',
        )
        assert.equal(
          campaignFavorsFor(base, team.id).some(
            (entry) => entry.chapterIndex === index,
          ),
          false,
          'An unearned chapter cannot enter the support dossier',
        )
      }
    }
    if (index < 4) {
      base = resolveCampaignBattle(
        base,
        team.id,
        index,
        chapter.foe,
        'conviction',
        'player',
      )
    }
  }
  assert.ok(
    uniqueTerms.size >= 8,
    'Each crew must earn a meaningful tactical variety, not duplicate effects',
  )
}
assert.equal(supportNames.size, 60)
console.log(
  'Slime City chapter supports: sixty named/unique favors, bounded terms and unlocks PASS',
)

// Earned ally favors are existing campaign decisions, not a second inventory.
// Only one selected favor applies to the battle; no route, defeat, or replay
// can claim a chapter that has not been won.
for (const team of TEAMS) {
  let saved = createCampaignSave()
  assert.deepEqual(campaignFavorsFor(saved, team.id), [])
  for (let index = 0; index < 4; index++) {
    const chapter = FACTION_CAMPAIGNS[team.id].chapters[index]!
    saved = resolveCampaignBattle(
      saved,
      team.id,
      index,
      chapter.foe,
      index % 2 === 0 ? 'conviction' : 'cunning',
      'player',
    )
    const favors = campaignFavorsFor(saved, team.id)
    assert.equal(favors.length, index + 1)
    assert.equal(favors[index]!.chapterTitle, chapter.title)
    assert.equal(favors[index]!.ally, chapter.foe)
    assert.ok(favors[index]!.echo.speaker.length > 5)
    assert.ok(favors[index]!.echo.voice.length > 50)
    assert.deepEqual(campaignEchoFor(saved, team.id), favors[index]!.echo)
    for (const favor of favors) {
      assert.deepEqual(
        campaignEchoFor(saved, team.id, favor.chapterIndex),
        favor.echo,
      )
      assert.deepEqual(
        campaignBattleTerms(saved, team.id, {}, favor.chapterIndex),
        favor.echo.terms,
        'Only the one selected ally contributes terms',
      )
    }
    assert.deepEqual(campaignEchoFor(saved, team.id, -1), favors[index]!.echo)
    assert.deepEqual(campaignEchoFor(saved, team.id, 999), favors[index]!.echo)
    assert.deepEqual(campaignEchoFor(saved, team.id, 1.5), favors[index]!.echo)
    const defeated = resolveCampaignBattle(
      saved,
      team.id,
      index + 1,
      FACTION_CAMPAIGNS[team.id].chapters[index + 1]!.foe,
      'cunning',
      'enemy',
    )
    assert.deepEqual(
      campaignFavorsFor(defeated, team.id),
      favors,
      'A lost mission cannot mint or revoke an ally',
    )
  }
  const openingTerms = { playerMana: 1, enemyMana: 1 }
  const earlier = campaignBattleTerms(saved, team.id, openingTerms, 0)
  const latest = campaignBattleTerms(saved, team.id, openingTerms)
  assert.notDeepEqual(earlier, latest)
  assert.deepEqual(
    openingTerms,
    { playerMana: 1, enemyMana: 1 },
    'Both quick start and district terms stay immutable',
  )
  const rival = FACTION_CAMPAIGNS[team.id].chapters[4]!.foe
  const actual = applyTerms(
    createMatch('blackout', team.id, rival, 20261102),
    earlier,
  )
  assert.equal(actual.mana, BLACKOUT_MANA_GAIN + (earlier.playerMana ?? 0))
  assert.equal(actual.enemyMana, BLACKOUT_MANA_GAIN + (earlier.enemyMana ?? 0))
  const finished = resolveCampaignBattle(
    saved,
    team.id,
    4,
    rival,
    'conviction',
    'player',
  )
  assert.equal(campaignFavorsFor(finished, team.id).length, 5)
  assert.equal(campaignEchoFor(finished, team.id), null)
  assert.deepEqual(campaignBattleTerms(finished, team.id, {}), {})
  // Crew legacy (t-009): a finished campaign's favors, the finale's fifth by
  // default, carry into district rival and contract bouts. A campaign in
  // progress keeps them for story fights only.
  const finishedFavors = campaignFavorsFor(finished, team.id)
  assert.equal(campaignLegacyFor(saved, team.id), null)
  assert.deepEqual(
    campaignLegacyTerms(saved, team.id, openingTerms),
    openingTerms,
  )
  assert.deepEqual(campaignLegacyFor(finished, team.id), finishedFavors[4])
  assert.deepEqual(campaignLegacyFor(finished, team.id, 0), finishedFavors[0])
  assert.deepEqual(campaignLegacyFor(finished, team.id, 99), finishedFavors[4])
  const finale = finishedFavors[4]!.echo.terms
  const legacy = campaignLegacyTerms(finished, team.id, openingTerms)
  for (const key of [
    'playerMana',
    'enemyMana',
    'playerHp',
    'enemyArmor',
    'fewerRivals',
    'rounds',
  ] as const)
    assert.equal(
      legacy[key] ?? 0,
      ((openingTerms as BoutTerms)[key] ?? 0) + (finale[key] ?? 0),
      team.id + ' legacy ' + key + ' stacks on city terms',
    )
  assert.notDeepEqual(
    legacy,
    openingTerms,
    team.id + "'s finale favor changes a city bout",
  )
}
console.log(
  'Slime City ally dossier: 6 crews, four previous favors, bounded combat PASS',
)

// Thirty authored rival confrontations respect the current save and never
// leak a future chapter. Victory history changes what the next rival says;
// defeat adds a personal retry beat without awarding a chapter or favor.
const allRivalLines = new Set<string>()
const allPlayerLines = new Set<string>()
for (const team of TEAMS) {
  assert.equal(CAMPAIGN_RIVAL_EXCHANGES[team.id].length, 5)
  assert.ok(CAMPAIGN_RETRY_VOICES[team.id].length > 65)
  for (const approach of ['conviction', 'cunning'] as const) {
    let save = createCampaignSave()
    for (let index = 0; index < 5; index++) {
      const chapter = FACTION_CAMPAIGNS[team.id].chapters[index]!
      const conversation = campaignConversationFor(save, team.id)
      assert.ok(conversation)
      assert.equal(conversation.chapterIndex, index)
      assert.equal(conversation.rivalTeam, chapter.foe)
      assert.equal(
        conversation.rivalSpeaker,
        CAMPAIGN_ECHOES[chapter.foe].conviction.speaker,
      )
      assert.equal(
        conversation.playerSpeaker,
        CAMPAIGN_ECHOES[team.id].conviction.speaker,
      )
      assert.ok(conversation.rivalLine.length > 45)
      assert.ok(conversation.playerLine.length > 45)
      assert.equal(conversation.retryLine, null)
      assert.equal(
        conversation.rememberedChoice,
        index === 0 ? null : CAMPAIGN_RIVAL_MEMORY[team.id][approach],
      )
      if (approach === 'conviction') {
        allRivalLines.add(conversation.rivalLine)
        allPlayerLines.add(conversation.playerLine)
      }
      const lost = resolveCampaignBattle(
        save,
        team.id,
        index,
        chapter.foe,
        approach,
        'enemy',
      )
      assert.equal(lost[team.id].wins, index)
      const rematch = campaignConversationFor(lost, team.id)
      assert.equal(rematch?.retryLine, CAMPAIGN_RETRY_VOICES[team.id])
      assert.equal(rematch?.rememberedChoice, conversation.rememberedChoice)
      save = resolveCampaignBattle(
        lost,
        team.id,
        index,
        chapter.foe,
        approach,
        'player',
      )
    }
    assert.equal(campaignConversationFor(save, team.id), null)
    assert.equal(save[team.id].decisions.length, 5)
    for (const other of TEAMS.filter((candidate) => candidate.id !== team.id)) {
      assert.equal(campaignConversationFor(save, other.id)?.chapterIndex, 0)
    }
  }
}
assert.equal(allRivalLines.size, 30)
assert.equal(allPlayerLines.size, 30)
console.log(
  'Slime City rival dialogue: 30 distinct showdowns, 12 decision callbacks, six rematch beats PASS',
)

// Every one of the 30 rival battles has distinct victory and defeat lines.
// The replay takes no side effects: only the actually attempted tactic can
// appear on a defeat, and earlier saves remain readable.
const rivalVictoryLines = new Set<string>()
const rivalDefeatLines = new Set<string>()
for (const crew of TEAMS) {
  const team = crew.id
  assert.equal(CAMPAIGN_RIVAL_REACTIONS[team].length, 5)
  assert.equal(campaignAftermathFor(createCampaignSave(), team), null)
  for (const approach of ['conviction', 'cunning'] as const) {
    let saved = createCampaignSave()
    for (let index = 0; index < 5; index++) {
      const chapter = FACTION_CAMPAIGNS[team].chapters[index]!
      const lost = resolveCampaignBattle(
        saved,
        team,
        index,
        chapter.foe,
        approach,
        'enemy',
      )
      const defeat = campaignAftermathFor(lost, team)
      assert.equal(defeat?.result, 'enemy')
      assert.equal(defeat?.chapterIndex, index)
      assert.equal(defeat?.foe, chapter.foe)
      assert.equal(defeat?.approach, approach)
      assert.equal(
        defeat?.playerLine,
        CAMPAIGN_APPROACH_REFLECTIONS[team][approach],
      )
      assert.equal(
        defeat?.rivalLine,
        CAMPAIGN_RIVAL_REACTIONS[team][index]!.defeat,
      )
      assert.equal(lost[team].lastApproach, approach)
      assert.equal(lost[team].wins, index)
      const earlierSave = {
        ...lost,
        [team]: { ...lost[team], lastApproach: undefined },
      }
      const earlier = campaignAftermathFor(earlierSave, team)
      assert.equal(earlier?.approach, null, 'Old losses cannot invent a choice')
      assert.equal(earlier?.playerLine, null)
      const won = resolveCampaignBattle(
        lost,
        team,
        index,
        chapter.foe,
        approach,
        'player',
      )
      const victory = campaignAftermathFor(won, team)
      assert.equal(victory?.chapterIndex, index)
      assert.equal(victory?.result, 'player')
      assert.equal(victory?.approach, approach)
      assert.equal(
        victory?.rivalLine,
        CAMPAIGN_RIVAL_REACTIONS[team][index]!.victory,
      )
      const legacyWin = {
        ...won,
        [team]: { ...won[team], lastApproach: undefined },
      }
      assert.equal(campaignAftermathFor(legacyWin, team)?.approach, approach)
      assert.equal(won[team].decisions.length, index + 1)
      if (approach === 'conviction') {
        rivalVictoryLines.add(victory!.rivalLine)
        rivalDefeatLines.add(defeat!.rivalLine)
      }
      saved = won
    }
    assert.equal(campaignAftermathFor(saved, team)?.chapterIndex, 4)
    assert.equal(campaignChapter(saved, team), null)
    for (const other of TEAMS.filter((entry) => entry.id !== team)) {
      assert.equal(campaignAftermathFor(saved, other.id), null)
    }
  }
}
assert.equal(rivalVictoryLines.size, 30)
assert.equal(rivalDefeatLines.size, 30)
console.log(
  'Slime City 60 rival aftermaths: approach fidelity, legacy saves and independent crews PASS',
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
  BLACKOUT_MANA_GAIN + (combined.playerMana ?? 0),
)
const scenarioBase = createMatch('blackout', 'catgirls', 'bloodfairies', 2001)
const scenario = applyTerms(
  {
    ...scenarioBase,
    hands: {
      player: [
        'lynx',
        ...scenarioBase.hands.player
          .filter((id) => id !== 'lynx')
          .slice(0, BLACKOUT_HAND_SIZE - 1),
      ],
      enemy: [
        'sprite',
        ...scenarioBase.hands.enemy
          .filter((id) => id !== 'sprite')
          .slice(0, BLACKOUT_HAND_SIZE - 1),
      ],
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
/** Play the store's launched Clash bout CPU vs CPU and report the result. */
function playStoreClash(): ClashState {
  const setup = lab.clashSetup()
  let g = createClash(setup.player, setup.enemy, setup.seed, setup.options)
  for (let i = 0; !g.victor && i < 2000; i++)
    g = applyClashCommand(g, chooseClashCpu(g, g.active))
  assert.ok(g.victor, 'the Clash bout finishes')
  lab.settleClash(lab.clashLaunch.id, g)
  return g
}
lab.chooseTeam('catgirls')
assert.equal(lab.city.location, 'pitworks')
lab.visit('crown')
assert.equal(lab.routeSteps.length, 2, 'Distant district plans two street legs')
assert.equal(lab.route?.to, 'undertow')
lab.walk()
assert.equal(lab.city.location, 'undertow')
assert.equal(lab.city.pendingStreet, 'The Long Drain')
assert.equal(lab.cityScene, 'street', 'A street story takes over the stage')
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
assert.equal(
  lab.cityScene,
  'map',
  'Mid-route, a settled story returns to the map',
)
assert.equal(lab.route?.to, 'crown')
lab.walk()
assert.equal(lab.city.location, 'crown')
assert.equal(lab.city.pendingStreet, 'Ledger Sewer')
lab.chooseStreet(STREET_STORIES['Ledger Sewer']!.choices[1].id)
assert.equal(lab.city.location, 'crown')
assert.equal(lab.routeSteps.length, 0)
assert.equal(lab.cityScene, 'district', 'Arriving opens the district scene')
lab.showCityMap()
assert.equal(lab.cityScene, 'map')
lab.enterCity()
assert.equal(lab.cityScene, 'district')
lab.showCity()
assert.equal(lab.cityScene, 'map', 'The CITY tab backs out to the map')
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
// Every bout is CLASH (Silas, 2026-11-08 PT). Silas, 2026-11-10 PT: the city
// is "the open ended pick a deck and have an experience game" -- its bouts deal
// the format you picked; the street and serum terms move the bosses' life.
lab.fightRival()
assert.equal(lab.view, 'clash')
assert.equal(lab.clashLaunch.kind, 'rival')
assert.equal(lab.clashLaunch.format, lab.journeyFormat, 'City: journey deck')
assert.equal(lab.clashLaunch.format, 'solo', 'a new journey starts Solo')
assert.equal(lab.clashLaunch.enemy, 'catgirls', 'Mirror rival bout')
assert.equal(lab.bout, 'chimera')
assert.equal(lab.storyBoutLabel('blackout'), 'SOLO CLASH')
lab.setJourneyFormat('alliance')
assert.equal(lab.storyBoutLabel('blackout'), 'ALLIANCE CLASH')
lab.setJourneyFormat('solo')
assert.deepEqual(
  lab.clashLaunch.bosses,
  clashBossesFromTerms(boutTerms(lab.city, 'chimera')),
)
assert.equal(
  lab.clashLaunch.bosses!.player,
  CLASH_BOSS_HP + 2 * CLASH_TERM_WEIGHTS.playerHp,
  'Street and serum terms stack (+2 HP) onto your boss',
)
const rivalGame = playStoreClash()
assert.equal(rivalGame.boss.player <= lab.clashLaunch.bosses!.player, true)
assert.equal(lab.bout, null, 'Bout settled')
assert.equal(lab.lastBout, 'chimera')
assert.equal(lab.clashResult?.kind, 'rival')
if (rivalGame.victor === 'player')
  assert.ok(lab.city.cleared.includes('chimera'))
if (rivalGame.victor === 'enemy') assert.equal(lab.city.heat, 3)
lab.settleClash(lab.clashLaunch.id, rivalGame)
assert.equal(lab.lastBout, 'chimera', 'A bout settles exactly once')
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
assert.equal(lab.view, 'clash')
assert.equal(lab.clashLaunch.kind, 'contract', 'Contracts are city bouts')
assert.equal(
  lab.clashLaunch.format,
  lab.journeyFormat,
  'Contracts deal the same Journey deck',
)
assert.equal(lab.contractBout, 'chimera')
assert.equal(lab.clashLaunch.enemy, 'catgirls')
const contractGame = playStoreClash()
assert.equal(lab.contractBout, null)
assert.equal(lab.lastContract, 'chimera')
if (contractGame.victor === 'player')
  assert.deepEqual(lab.city.contracts, ['chimera'])
if (contractGame.victor === 'enemy') assert.equal(lab.city.contracts.length, 0)
lab.showCity()
lab.resetCity()
assert.equal(lab.city.contracts.length, 0)

// Crew legacy in the store (t-009): once the active crew's campaign is won,
// district rival and contract bouts carry its chosen favor.
{
  const team = lab.activeTeam
  let won = createCampaignSave()
  FACTION_CAMPAIGNS[team].chapters.forEach((chapter, index) => {
    won = resolveCampaignBattle(
      won,
      team,
      index,
      chapter.foe,
      'conviction',
      'player',
    )
  })
  const before = lab.campaignSave
  lab.campaignSave = won
  assert.equal(lab.campaignLegacy?.chapterIndex, 4, 'The finale favor leads')
  lab.selectCampaignFavor(1)
  assert.equal(
    lab.campaignLegacy?.chapterIndex,
    1,
    'A finished campaign still picks its favor',
  )
  lab.visit('chimera')
  lab.walk()
  lab.chooseStreet('splice-smuggle')
  lab.choose('chimera-serum')
  lab.fightRival()
  assert.equal(lab.view, 'clash')
  const expected = clashBossesFromTerms(
    campaignLegacyTerms(won, team, boutTerms(lab.city, 'chimera'), 1),
  )
  const baseline = clashBossesFromTerms(boutTerms(lab.city, 'chimera'))
  assert.deepEqual(
    lab.clashLaunch.bosses,
    expected,
    'Rival bout carries the legacy',
  )
  assert.notDeepEqual(
    expected,
    baseline,
    'and the favor really changes the bout',
  )
  lab.showCity()
  lab.resetCity()
  lab.campaignSave = before
}

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
assert.equal(
  boosted.mana,
  BLACKOUT_MANA_GAIN + 2,
  'Citywide alliance supplies two opening mana',
)
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
// THE LAST SHIFT: three authored strike scenes come before the first bout.
lab.startCampaignBattle('conviction')
assert.equal(lab.view, 'campaign', 'Unplayed Ironjaw scenes block the bout')
for (let beat = 0; beat < 3; beat++) {
  assert.ok(lab.ironjawCurrent, 'next Ironjaw strike scene is present')
  lab.chooseCampaignJourneyBeat('left')
}
assert.equal(lab.ironjawCurrent, null)
assert.equal(lab.ironjawShift.solidarity, 3)
assert.equal(lab.ironjawShift.stage, 'basking')
lab.startCampaignBattle('conviction')
assert.equal(lab.view, 'clash')
assert.equal(lab.clashLaunch.kind, 'campaign', 'Story bouts are Solo Clash')
assert.equal(lab.clashLaunch.format, 'solo')
assert.equal(lab.clashLaunch.enemy, 'exchange')
assert.equal(lab.campaignBout?.team, 'ironjaw')
assert.equal(
  lab.clashLaunch.bosses!.enemy,
  CLASH_BOSS_HP + CLASH_TERM_WEIGHTS.enemyMana,
  'Story approach moves the rival boss',
)
const storyGame = playStoreClash()
assert.equal(lab.campaignBout, null)
assert.equal(lab.lastCampaign, 'ironjaw')
assert.equal(
  lab.campaignSave.ironjaw.wins,
  storyGame.victor === 'player' ? 1 : 0,
)
lab.showCampaign()
assert.equal(lab.view, 'campaign')
assert.equal(
  lab.campaignScreen,
  'aftermath',
  'A settled chapter returns to its aftermath scene first',
)
// A won chapter first asks for its card reward; the loss path has none.
const rewardChoices = lab.campaignRewardChoices
if (rewardChoices) {
  lab.continueCampaign()
  assert.equal(
    lab.campaignScreen,
    'aftermath',
    'An unclaimed card reward holds the aftermath scene',
  )
  lab.chooseCampaignCardReward(rewardChoices[0].id)
}
lab.continueCampaign()
assert.equal(lab.campaignScreen, 'chapter')
lab.showCampaignAftermath()
assert.equal(lab.campaignScreen, 'aftermath')
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
assert.equal(
  lab.cityScene,
  'map',
  'Across town, following the story shows the lit route on the map',
)
lab.startCampaignBattle('conviction')
assert.equal(lab.view, 'city', 'Cannot launch mission while across town')
lab.walk()
assert.equal(lab.city.location, 'undertow')
assert.equal(lab.city.pendingStreet, 'The Long Drain')
assert.equal(lab.cityScene, 'street')
lab.startCampaignBattle('conviction')
assert.equal(lab.view, 'city', 'Unresolved street encounter blocks mission')
lab.chooseStreet(STREET_STORIES['The Long Drain']!.choices[0].id)
assert.equal(lab.campaignAtDestination, true)
assert.equal(
  lab.cityScene,
  'story',
  'Arriving opens the story mission as its own full-stage scene',
)
lab.startCampaignBattle('cunning')
assert.equal(
  lab.view,
  'city',
  'Unplayed Gene Riot story beats block a premature boss fight',
)
for (let beat = 0; beat < 3; beat++) {
  assert.ok(lab.geneRiotCurrent, 'next authored scene is present')
  lab.chooseGeneRiotBeat('left')
}
assert.equal(
  lab.geneRiotCurrent,
  null,
  'all three chosen scenes unlock the city mission',
)
lab.startCampaignBattle('cunning')
assert.equal(lab.view, 'clash')
assert.equal(lab.clashLaunch.enemy, 'undertow')
assert.ok(lab.campaignBout, 'City mission uses campaign settlement')
assert.equal(lab.clashSetup().player, 'catgirls')
assert.ok(
  lab.clashLaunch.bosses!.player >
    CLASH_BOSS_HP + 3 * CLASH_TERM_WEIGHTS.playerMana,
  'City chapter stacks street and approach bonuses with earned Gene Riot story choices',
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
assert.equal(lab.cityScene, 'crisis', 'The crisis takes the stage first')
assert.equal(lab.campaignAtDestination, false)
lab.startCampaignBattle('conviction')
assert.equal(lab.view, 'city', 'City crisis blocks the mission button')
lab.chooseCrisis('broadcast-truth')
assert.equal(lab.crisisEvent, null)
assert.equal(lab.campaignAtDestination, true)
lab.startCampaignBattle('conviction')
assert.equal(lab.view, 'clash', 'Crisis resolution unlocks city story fights')
assert.equal(lab.clashSetup().player, 'catgirls')
assert.ok(
  lab.clashLaunch.bosses!.player >=
    CLASH_BOSS_HP + CLASH_TERM_WEIGHTS.playerMana,
  'City campaign inherits the crisis bonus on your boss',
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

lab.showCampaign()
lab.chooseTeam('bloodfairies')
assert.ok(
  lab.bloodfairyCurrent,
  'Bloodfairy story opens its own authored scene',
)
assert.equal(lab.bloodfairyChorus.voices, 0)
lab.startCampaignBattle('conviction')
assert.equal(
  lab.view,
  'campaign',
  'Bloodfairy cannot skip the chorus into a battle',
)
for (let scene = 0; scene < 3; scene++) {
  assert.ok(lab.campaignJourneyCurrent)
  lab.chooseCampaignJourneyBeat('left')
}
assert.equal(lab.bloodfairyChorus.voices, 3)
assert.equal(lab.campaignJourneyCurrent, null)
lab.startCampaignBattle('conviction')
assert.equal(
  lab.view,
  'clash',
  'three choices unlock the first Bloodfairy showdown',
)
assert.equal(lab.clashLaunch.kind, 'campaign')
assert.ok(lab.clashLaunch.cards?.includes('s1-riot-choir'))
assert.ok(
  lab.clashLaunch.bosses!.player > CLASH_BOSS_HP,
  'The first coalition fight benefits from gathered members',
)
console.log(
  'Slime City Bloodfairy story store: gated scenes, chorus tactics and real Clash deck PASS',
)
