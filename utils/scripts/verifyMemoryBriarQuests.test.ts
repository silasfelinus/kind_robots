import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { checkArtPromptContract } from '../../server/utils/artPromptContract'
import {
  BRIAR_QUESTS,
  briarQuestLog,
  briarQuestProgress,
  validateBriarQuests,
} from '../memoryDungeon/briarQuests'
import {
  HOUSE_ROOMS,
  newHouseProgress,
  type HouseRoomId,
} from '../memoryDungeon/house'
import {
  BRIAR_RARE_EVENTS,
  earnedBriarRareEvents,
  validateBriarRareEvents,
} from '../memoryDungeon/briarRareEvents'
import {
  MEMORY_BRIAR_ACHIEVEMENTS,
  memoryAchievementGallery,
  reconcileMemoryAchievements,
  restoreMemoryAchievements,
} from '../memoryDungeon/achievements'
import {
  houseEpilogueScores,
  HOUSE_EPILOGUE_LENSES,
  HOUSE_EPILOGUE_SIGNALS,
} from '../memoryDungeon/houseEpilogues'
import { BRIAR_SCENES } from '../memoryDungeon/scenes'
import { newBriarSave, restoreBriarSave } from '../memoryDungeonWorld'
import { buildMemoryDungeonPlaybook } from '../playbook/memoryDungeon'

// World One's eight side quests (kind_robots #4136: eight side quests per
// realm). Each thread is taken by real Briar and House choices, can be closed
// by a different choice, and is read from decisions the save already keeps.

assert.deepEqual(validateBriarQuests(), [])
assert.equal(BRIAR_QUESTS.length, 8)
assert.equal(new Set(BRIAR_QUESTS.map((q) => q.title)).size, 8)
assert.equal(new Set(BRIAR_QUESTS.map((q) => q.artPath)).size, 8)
for (const lens of HOUSE_EPILOGUE_LENSES)
  assert.ok(
    BRIAR_QUESTS.some((q) => q.lens === lens),
    `a thread is walked for ${lens}`,
  )
for (const q of BRIAR_QUESTS) {
  assert.deepEqual(
    checkArtPromptContract({ prompt: q.artPrompt, engine: 'krea2' }),
    [],
    `${q.id} art prompt passes the enqueue contract`,
  )
  assert.ok(
    !/\b(?:no|not|without|story|symbol\w*|readable|composition)\b/i.test(
      q.artPrompt,
    ),
    `${q.id} art prompt is literal`,
  )
}

const split = (q: (typeof BRIAR_QUESTS)[number], upTo = q.steps.length) => {
  const briar: Record<string, string> = {}
  const house: Record<string, string> = {}
  for (const step of q.steps.slice(0, upTo))
    (step.scope === 'briar' ? briar : house)[step.key] = step.advance[0]!
  return { briar, house }
}

for (const q of BRIAR_QUESTS) {
  // Untouched, under way, finished.
  assert.equal(briarQuestProgress(q, {}, {}).state, 'unstarted')
  const half = split(q, 1)
  assert.equal(briarQuestProgress(q, half.briar, half.house).state, 'active')
  const full = split(q)
  const finished = briarQuestProgress(q, full.briar, full.house)
  assert.equal(finished.state, 'complete', `${q.id} can be finished`)
  assert.equal(finished.done, q.steps.length)

  // Any step taken the other way closes the thread with its own ending.
  const closing = q.steps.find((step) => {
    const ids =
      step.scope === 'house'
        ? HOUSE_ROOMS[step.key]!.choices.map((c) => c.id)
        : (
            BRIAR_SCENES as Record<
              string,
              { choices: readonly { id: string }[] }
            >
          )[step.key]!.choices.map((c) => c.id)
    return ids.some((id) => !step.advance.includes(id))
  })!
  const other = (
    closing.scope === 'house'
      ? HOUSE_ROOMS[closing.key]!.choices
      : (
          BRIAR_SCENES as Record<string, { choices: readonly { id: string }[] }>
        )[closing.key]!.choices
  ).find((c) => !closing.advance.includes(c.id))!.id
  const closed = {
    briar: { ...full.briar },
    house: { ...full.house },
  }
  ;(closing.scope === 'briar' ? closed.briar : closed.house)[closing.key] =
    other
  assert.equal(
    briarQuestProgress(q, closed.briar, closed.house).state,
    'closed',
    `${q.id} closes when ${closing.key} goes the other way`,
  )

  // A finished thread weighs on the House epilogue it was walked for: one
  // point beyond the choice signals it shares with the epilogue lenses.
  const scores = houseEpilogueScores({ decisions: full.house }, full.briar)
  for (const lens of HOUSE_EPILOGUE_LENSES) {
    const signals = HOUSE_EPILOGUE_SIGNALS[lens].filter(
      ([scope, key, choice]) =>
        (scope === 'house' ? full.house[key] : full.briar[key]) === choice,
    ).length
    const threads = briarQuestLog(full.briar, full.house).filter(
      (t) => t.state === 'complete' && t.quest.lens === lens,
    ).length
    assert.equal(scores[lens], signals + threads, `${q.id}: ${lens} weight`)
  }
  assert.ok(scores[q.lens] >= 1)
}

// The three legitimate alternatives in the courier thread are different
// ethical choices, not interchangeable accusations of opened letters.
const courier = BRIAR_QUESTS.find((q) => q.id === 'every-letter-delivered')!
const courierClosures = [
  ['2,4', 'copy', /kept your lantern and copied the impossible address/],
  ['1,4', 'knock', /made Grandmother name the children excluded/],
  ['6,4', 'read', /broke the destruction order’s seal and warned the House/],
] as const
const courierEndings = new Set<string>()
for (const [key, choice, expected] of courierClosures) {
  const decisions = split(courier)
  decisions.briar[key] = choice
  const result = briarQuestProgress(courier, decisions.briar, decisions.house)
  assert.equal(result.state, 'closed', `${key} ${choice} closes the thread`)
  assert.match(result.quest.closed, expected)
  assert.notEqual(result.quest.closed, courier.closed)
  courierEndings.add(result.quest.closed)
  const restored = restoreBriarSave(
    JSON.parse(
      JSON.stringify({
        ...newBriarSave(),
        revealed: Object.keys(decisions.briar),
        visited: Object.keys(decisions.briar),
        sceneChoices: decisions.briar,
      }),
    ),
  )
  assert.equal(
    briarQuestProgress(courier, restored.sceneChoices, decisions.house).quest
      .closed,
    result.quest.closed,
    'The specific closure survives a save round trip',
  )
}
assert.equal(courierEndings.size, 3, 'three different courier endings')
const invalidCourier = split(courier)
invalidCourier.briar['1,4'] = 'forged'
assert.equal(
  briarQuestProgress(courier, invalidCourier.briar, invalidCourier.house).state,
  'active',
  'Unknown scene choices cannot manufacture a quest closure',
)
const twoClosures = split(courier)
twoClosures.briar['2,4'] = 'copy'
twoClosures.briar['6,4'] = 'read'
assert.match(
  briarQuestProgress(courier, twoClosures.briar, twoClosures.house).quest
    .closed,
  /kept your lantern/,
  'When multiple choices close the quest, its earliest authored step determines the ending',
)

// The Knight's apology is not a single failed errand. Telling him the truth,
// paying the Sprite, warning the House and demanding consent carry distinct
// costs, none of which falsely claims that the House has forgiven him.
const apology = BRIAR_QUESTS.find((q) => q.id === 'an-apology-for-the-door')!
const apologyClosures = [
  ['5,4', 'truth', /crossing never existed/],
  ['5,5', 'gift', /did not learn whose broken oath/],
  ['6,4', 'read', /residents can prepare for danger/],
  ['6,2', 'demand', /residents’ testimony or their consent/],
] as const
const apologyEndings = new Set<string>()
for (const [key, choice, expected] of apologyClosures) {
  const decisions = split(apology)
  decisions.briar[key] = choice
  const result = briarQuestProgress(apology, decisions.briar, decisions.house)
  assert.equal(result.state, 'closed', `${key} ${choice} closes the apology`)
  assert.match(result.quest.closed, expected)
  assert.notEqual(result.quest.closed, apology.closed)
  apologyEndings.add(result.quest.closed)
  const restored = restoreBriarSave(
    JSON.parse(
      JSON.stringify({
        ...newBriarSave(),
        revealed: Object.keys(decisions.briar),
        visited: Object.keys(decisions.briar),
        sceneChoices: decisions.briar,
      }),
    ),
  )
  assert.equal(
    briarQuestProgress(apology, restored.sceneChoices, decisions.house).quest
      .closed,
    result.quest.closed,
    'The apology outcome survives a saved scene decision',
  )
}
assert.equal(apologyEndings.size, 4, 'four different apology endings')
const forgedApology = split(apology)
forgedApology.briar['6,2'] = 'forged'
assert.equal(
  briarQuestProgress(apology, forgedApology.briar, forgedApology.house).state,
  'active',
  'A forged House promise cannot manufacture an apology closure',
)
const twoApologyClosures = split(apology)
twoApologyClosures.briar['5,4'] = 'truth'
twoApologyClosures.briar['6,4'] = 'read'
assert.match(
  briarQuestProgress(
    apology,
    twoApologyClosures.briar,
    twoApologyClosures.house,
  ).quest.closed,
  /crossing never existed/,
  'The earliest authored apology closure wins when several choices diverge',
)

// Four defensible alternatives to the patrol's formal case carry different
// costs: speaking too early, sheltering witnesses, investigating the gate,
// and helping without testimony. None invents an official acquittal.
const patrol = BRIAR_QUESTS.find((q) => q.id === 'the-patrols-defense')!
const patrolClosures = [
  ['briar', '2,2', 'report', /unrecorded tracks cannot yet protect a witness/],
  ['briar', '4,6', 'shelter', /patrol must still petition alone/],
  ['house', 'HD-05', 'test', /gate stays locked/],
  ['house', 'HD-26', 'shelter', /village can still call protection a raid/],
] as const
const patrolEndings = new Set<string>()
for (const [scope, key, choice, expected] of patrolClosures) {
  const decisions = split(patrol)
  ;(scope === 'briar' ? decisions.briar : decisions.house)[key] = choice
  const result = briarQuestProgress(patrol, decisions.briar, decisions.house)
  assert.equal(
    result.state,
    'closed',
    `${key} ${choice} closes the patrol case`,
  )
  assert.match(result.quest.closed, expected)
  assert.notEqual(result.quest.closed, patrol.closed)
  patrolEndings.add(result.quest.closed)
  const restored = restoreBriarSave(
    JSON.parse(
      JSON.stringify({
        ...newBriarSave(),
        revealed: Object.keys(decisions.briar),
        visited: Object.keys(decisions.briar),
        sceneChoices: decisions.briar,
      }),
    ),
  )
  const house = JSON.parse(JSON.stringify(decisions.house)) as Record<
    string,
    string
  >
  assert.equal(
    briarQuestProgress(patrol, restored.sceneChoices, house).quest.closed,
    result.quest.closed,
    'The authored patrol outcome survives a serialized expedition',
  )
}
assert.equal(patrolEndings.size, 4, 'four different patrol outcomes')
const forgedPatrol = split(patrol)
forgedPatrol.house['HD-05'] = 'forged'
assert.equal(
  briarQuestProgress(patrol, forgedPatrol.briar, forgedPatrol.house).state,
  'active',
  'Forged House testimony cannot manufacture a patrol resolution',
)
const twoPatrolClosures = split(patrol)
twoPatrolClosures.briar['2,2'] = 'report'
twoPatrolClosures.house['HD-26'] = 'shelter'
assert.match(
  briarQuestProgress(patrol, twoPatrolClosures.briar, twoPatrolClosures.house)
    .quest.closed,
  /unrecorded tracks cannot yet protect a witness/,
  'The earliest authored patrol closure takes precedence over later alternatives',
)

// Oren's manifest records exits for everyone, not just the traveler who
// successfully used one. Following a marked route and privately testing a
// cellar shortcut leave different gaps in the public evacuation plan.
const manifest = BRIAR_QUESTS.find((q) => q.id === 'orens-emergency-manifest')!
const manifestClosures = [
  [
    'briar',
    '6,1',
    'follow',
    /left no ribbon for the traveler coming behind you/,
  ],
  [
    'house',
    'HD-24',
    'retreat',
    /successful private escape for a public evacuation plan/,
  ],
] as const
const manifestEndings = new Set<string>()
for (const [scope, key, choice, expected] of manifestClosures) {
  const decisions = split(manifest)
  ;(scope === 'briar' ? decisions.briar : decisions.house)[key] = choice
  const result = briarQuestProgress(manifest, decisions.briar, decisions.house)
  assert.equal(result.state, 'closed', `${key} ${choice} closes the manifest`)
  assert.match(result.quest.closed, expected)
  assert.notEqual(result.quest.closed, manifest.closed)
  manifestEndings.add(result.quest.closed)
  const restored = restoreBriarSave(
    JSON.parse(
      JSON.stringify({
        ...newBriarSave(),
        revealed: Object.keys(decisions.briar),
        visited: Object.keys(decisions.briar),
        sceneChoices: decisions.briar,
      }),
    ),
  )
  const restoredHouse = JSON.parse(JSON.stringify(decisions.house)) as Record<
    string,
    string
  >
  assert.equal(
    briarQuestProgress(manifest, restored.sceneChoices, restoredHouse).quest
      .closed,
    result.quest.closed,
    'The manifest outcome survives serialized decisions',
  )
}
assert.equal(manifestEndings.size, 2, 'two distinct manifest outcomes')
const forgedManifest = split(manifest)
forgedManifest.house['HD-24'] = 'forged'
assert.equal(
  briarQuestProgress(manifest, forgedManifest.briar, forgedManifest.house)
    .state,
  'active',
  'A fabricated cellar decision cannot close the manifest',
)
const twoManifestClosures = split(manifest)
twoManifestClosures.briar['6,1'] = 'follow'
twoManifestClosures.house['HD-24'] = 'retreat'
assert.match(
  briarQuestProgress(
    manifest,
    twoManifestClosures.briar,
    twoManifestClosures.house,
  ).quest.closed,
  /left no ribbon/,
  'The earliest authored manifest divergence determines the ending',
)

// Mosswick's two alternatives have different ethical costs. Reading the
// future entry protects the player's promise; refusing the Index protects
// their name. Neither produces the sworn, corroborated account he requested.
const mosswick = BRIAR_QUESTS.find((q) => q.id === 'mosswicks-true-account')!
const mosswickClosures = [
  ['4,2', 'ledger', /hid the price and the buyer/],
  ['7,4', 'refuse', /without the carbon copy/],
] as const
const mosswickEndings = new Set<string>()
for (const [key, choice, expected] of mosswickClosures) {
  const decisions = split(mosswick)
  decisions.briar[key] = choice
  const result = briarQuestProgress(mosswick, decisions.briar, decisions.house)
  assert.equal(result.state, 'closed', `${key} ${choice} closes the account`)
  assert.match(result.quest.closed, expected)
  assert.notEqual(result.quest.closed, mosswick.closed)
  mosswickEndings.add(result.quest.closed)
  const restored = restoreBriarSave(
    JSON.parse(
      JSON.stringify({
        ...newBriarSave(),
        revealed: Object.keys(decisions.briar),
        visited: Object.keys(decisions.briar),
        sceneChoices: decisions.briar,
      }),
    ),
  )
  assert.equal(
    briarQuestProgress(mosswick, restored.sceneChoices, decisions.house).quest
      .closed,
    result.quest.closed,
    'The Mosswick outcome survives a saved scene decision',
  )
}
assert.equal(mosswickEndings.size, 2, 'two distinct Mosswick resolutions')
const forgedMosswick = split(mosswick)
forgedMosswick.briar['7,4'] = 'forged'
assert.equal(
  briarQuestProgress(mosswick, forgedMosswick.briar, forgedMosswick.house)
    .state,
  'active',
  'A fabricated Index choice cannot manufacture a Mosswick closure',
)
const twoMosswickClosures = split(mosswick)
twoMosswickClosures.briar['4,2'] = 'ledger'
twoMosswickClosures.briar['7,4'] = 'refuse'
assert.match(
  briarQuestProgress(
    mosswick,
    twoMosswickClosures.briar,
    twoMosswickClosures.house,
  ).quest.closed,
  /hid the price and the buyer/,
  'The earliest authored Mosswick divergence determines the ending',
)

// Trusting Scylla's paperwork, helping Char repair a boot and choosing rest
// all care for the twins differently. None invents the private confession
// earned only by hearing both sisters on the landing.
const twins = BRIAR_QUESTS.find((q) => q.id === 'different-waters-same-face')!
const twinClosures = [
  ['HD-10', 'manifest', /supplies arrive intact/],
  ['HD-11', 'help', /Help was welcome/],
  ['HD-30', 'rest', /private bargain remains theirs/],
] as const
const twinEndings = new Set<string>()
for (const [key, choice, expected] of twinClosures) {
  const decisions = split(twins)
  decisions.house[key] = choice
  const result = briarQuestProgress(twins, decisions.briar, decisions.house)
  assert.equal(
    result.state,
    'closed',
    `${key} ${choice} closes the twins' thread`,
  )
  assert.match(result.quest.closed, expected)
  assert.notEqual(result.quest.closed, twins.closed)
  twinEndings.add(result.quest.closed)
  const restored = restoreBriarSave(
    JSON.parse(
      JSON.stringify({
        ...newBriarSave(),
        revealed: Object.keys(decisions.briar),
        visited: Object.keys(decisions.briar),
        sceneChoices: decisions.briar,
      }),
    ),
  )
  const restoredHouse = JSON.parse(JSON.stringify(decisions.house)) as Record<
    string,
    string
  >
  assert.equal(
    briarQuestProgress(twins, restored.sceneChoices, restoredHouse).quest
      .closed,
    result.quest.closed,
    'The chosen twin outcome survives serialized decisions',
  )
}
assert.equal(twinEndings.size, 3, 'three distinct twin resolutions')
const forgedTwins = split(twins)
forgedTwins.house['HD-11'] = 'forged'
assert.equal(
  briarQuestProgress(twins, forgedTwins.briar, forgedTwins.house).state,
  'active',
  "A forged wardrobe decision cannot close the twins' thread",
)
const twoTwinClosures = split(twins)
twoTwinClosures.house['HD-10'] = 'manifest'
twoTwinClosures.house['HD-30'] = 'rest'
assert.match(
  briarQuestProgress(twins, twoTwinClosures.briar, twoTwinClosures.house).quest
    .closed,
  /supplies arrive intact/,
  'The earliest authored twin divergence determines the ending',
)

// Respecting the orchard's consent, sharing a remembered taste, and naming an
// unfed guest are worthwhile acts, but none supplies the workers' missing meal.
// The Threads log must report each tradeoff rather than invent a stolen harvest.
const orchard = BRIAR_QUESTS.find((q) => q.id === 'feed-the-orchard-workers')!
const orchardClosures = [
  ['briar', '3,1', 'listen', /carried no apples to the field kitchen/],
  ['briar', '1,3', 'keep', /story about food instead of supper/],
  ['house', 'HD-04', 'record', /demands a fair share of the next delivery/],
] as const
const orchardEndings = new Set<string>()
for (const [scope, key, choice, expected] of orchardClosures) {
  const decisions = split(orchard)
  ;(scope === 'briar' ? decisions.briar : decisions.house)[key] = choice
  const result = briarQuestProgress(orchard, decisions.briar, decisions.house)
  assert.equal(
    result.state,
    'closed',
    `${key} ${choice} closes the food thread`,
  )
  assert.match(result.quest.closed, expected)
  assert.notEqual(result.quest.closed, orchard.closed)
  orchardEndings.add(result.quest.closed)
  const restored = restoreBriarSave(
    JSON.parse(
      JSON.stringify({
        ...newBriarSave(),
        revealed: Object.keys(decisions.briar),
        visited: Object.keys(decisions.briar),
        sceneChoices: decisions.briar,
      }),
    ),
  )
  const restoredHouse = JSON.parse(JSON.stringify(decisions.house)) as Record<
    string,
    string
  >
  assert.equal(
    briarQuestProgress(orchard, restored.sceneChoices, restoredHouse).quest
      .closed,
    result.quest.closed,
    'The food-thread ending survives serialized decisions',
  )
}
assert.equal(orchardEndings.size, 3, 'three distinct orchard outcomes')
const forgedOrchard = split(orchard)
forgedOrchard.house['HD-04'] = 'forged'
assert.equal(
  briarQuestProgress(orchard, forgedOrchard.briar, forgedOrchard.house).state,
  'active',
  'A fabricated pantry choice cannot close the orchard thread',
)
const twoOrchardClosures = split(orchard)
twoOrchardClosures.briar['3,1'] = 'listen'
twoOrchardClosures.house['HD-04'] = 'record'
assert.match(
  briarQuestProgress(
    orchard,
    twoOrchardClosures.briar,
    twoOrchardClosures.house,
  ).quest.closed,
  /carried no apples/,
  'The earliest authored orchard divergence determines the ending',
)

// Hiding names from a hostile registry, asking a painted witness for consent,
// and preserving competing letters are defensible choices, not the same
// failure to count the erased. None falsely claims the village knows the names.
const lintel = BRIAR_QUESTS.find((q) => q.id === 'names-on-the-lintel')!
const lintelClosures = [
  ['briar', '6,3', 'protect', /no public record to reclaim/],
  ['house', 'HD-07', 'speak', /wrote down their answer with permission/],
  [
    'house',
    'HD-17',
    'preserve',
    /village must still learn whom the bargain bound/,
  ],
] as const
const lintelEndings = new Set<string>()
for (const [scope, key, choice, expected] of lintelClosures) {
  const decisions = split(lintel)
  ;(scope === 'briar' ? decisions.briar : decisions.house)[key] = choice
  const result = briarQuestProgress(lintel, decisions.briar, decisions.house)
  assert.equal(
    result.state,
    'closed',
    `${key} ${choice} closes the lintel quest`,
  )
  assert.match(result.quest.closed, expected)
  assert.notEqual(result.quest.closed, lintel.closed)
  lintelEndings.add(result.quest.closed)
  const restored = restoreBriarSave(
    JSON.parse(
      JSON.stringify({
        ...newBriarSave(),
        revealed: Object.keys(decisions.briar),
        visited: Object.keys(decisions.briar),
        sceneChoices: decisions.briar,
      }),
    ),
  )
  const restoredHouse = JSON.parse(JSON.stringify(decisions.house)) as Record<
    string,
    string
  >
  assert.equal(
    briarQuestProgress(lintel, restored.sceneChoices, restoredHouse).quest
      .closed,
    result.quest.closed,
    'The chosen lintel resolution survives serialized decisions',
  )
}
assert.equal(lintelEndings.size, 3, 'three distinct lintel resolutions')
const forgedLintel = split(lintel)
forgedLintel.house['HD-17'] = 'forged'
assert.equal(
  briarQuestProgress(lintel, forgedLintel.briar, forgedLintel.house).state,
  'active',
  'A forged House letter decision cannot manufacture a lintel resolution',
)
const twoLintelClosures = split(lintel)
twoLintelClosures.briar['6,3'] = 'protect'
twoLintelClosures.house['HD-17'] = 'preserve'
assert.match(
  briarQuestProgress(lintel, twoLintelClosures.briar, twoLintelClosures.house)
    .quest.closed,
  /no public record to reclaim/,
  'The earliest authored lintel divergence determines the ending',
)

// Every quest step can be completed together: no two threads demand
// opposite choices at the same place, so a single run can tie off all eight.
const all = {
  briar: {} as Record<string, string>,
  house: {} as Record<string, string>,
}
for (const q of BRIAR_QUESTS)
  for (const step of q.steps) {
    const bag = step.scope === 'briar' ? all.briar : all.house
    const already = bag[step.key]
    if (already)
      assert.ok(
        step.advance.includes(already),
        `${q.id} and another thread agree at ${step.key}`,
      )
    else bag[step.key] = step.advance[0]!
  }
assert.ok(
  briarQuestLog(all.briar, all.house).every((t) => t.state === 'complete'),
  'one run can tie off all eight threads',
)

// Saves: threads read existing decisions, and a reload keeps them.
const save = restoreBriarSave(
  JSON.parse(
    JSON.stringify({
      ...newBriarSave(),
      revealed: Object.keys(all.briar),
      visited: Object.keys(all.briar),
      sceneChoices: all.briar,
    }),
  ),
)
assert.deepEqual(save.sceneChoices, all.briar)
assert.ok(!('quests' in save), 'threads add no save field')

// Eight cross-thread rare interludes are genuinely earned: four decisions
// from different scenes/rooms, two mutually exclusive authored consequences.
// No invented reward, hidden save field, or unvisited witness can trigger one.
assert.deepEqual(validateBriarRareEvents(), [])
assert.equal(BRIAR_RARE_EVENTS.length, BRIAR_QUESTS.length)
assert.equal(new Set(BRIAR_RARE_EVENTS.map((event) => event.id)).size, 8)
assert.deepEqual(
  new Set(BRIAR_RARE_EVENTS.map((event) => event.questId)),
  new Set(BRIAR_QUESTS.map((quest) => quest.id)),
  'each of the eight authored quests has a distinct rare convergence',
)
const rareCases = [
  {
    id: 'the-fourth-column',
    briar: { '6,1': 'mark' },
    house: { 'HD-24': 'mark', 'HD-05': 'open' },
    branchScope: 'briar',
    branchKey: '4,3',
    choices: ['plan', 'load'],
  },
  {
    id: 'the-second-signature',
    briar: { '4,2': 'promise', '7,4': 'register' },
    house: { 'HD-17': 'read' },
    branchScope: 'house',
    branchKey: 'HD-25',
    choices: ['compare', 'recount'],
  },
  {
    id: 'a-letter-written-back',
    briar: { '5,4': 'errand', '6,4': 'carry' },
    house: { 'HD-17': 'read' },
    branchScope: 'briar',
    branchKey: '6,3',
    choices: ['remember', 'protect'],
  },
  {
    id: 'the-voice-that-came-home',
    briar: { '2,4': 'lend', '3,5': 'listen' },
    house: { 'HD-07': 'speak' },
    branchScope: 'briar',
    branchKey: '6,4',
    choices: ['carry', 'read'],
  },
  {
    id: 'the-road-without-an-owner',
    briar: { '3,2': 'ask', '2,2': 'observe' },
    house: { 'HD-12': 'map' },
    branchScope: 'house',
    branchKey: 'HD-26',
    choices: ['testify', 'shelter'],
  },
  {
    id: 'two-crowns-one-promise',
    briar: { '4,4': 'escort' },
    house: { 'HD-10': 'improvise', 'HD-11': 'respect' },
    branchScope: 'house',
    branchKey: 'HD-30',
    choices: ['rest', 'talk'],
  },
  {
    id: 'supper-for-tomorrow',
    briar: { '3,1': 'harvest', '1,3': 'return' },
    house: { 'HD-04': 'share' },
    branchScope: 'briar',
    branchKey: '1,8',
    choices: ['plant', 'share'],
  },
  {
    id: 'the-name-left-blank',
    briar: { '6,3': 'remember' },
    house: { 'HD-07': 'count', 'HD-17': 'read' },
    branchScope: 'house',
    branchKey: 'HD-20',
    choices: ['testify', 'protect'],
  },
] as const
// The rare-event save fixtures must include the actual passages to each
// House witness; merely naming a distant room cannot earn its testimony.
const rareHouseRoutes = new Map<HouseRoomId, HouseRoomId[]>([
  ['HD-01', ['HD-01']],
])
const rareHouseQueue: HouseRoomId[] = ['HD-01']
for (let i = 0; i < rareHouseQueue.length; i++) {
  const room = rareHouseQueue[i]!
  for (const next of HOUSE_ROOMS[room]!.exits) {
    if (rareHouseRoutes.has(next)) continue
    rareHouseRoutes.set(next, [...rareHouseRoutes.get(room)!, next])
    rareHouseQueue.push(next)
  }
}
const visitedRareHouseRooms = (rooms: string[]): HouseRoomId[] => {
  const visited = new Set<HouseRoomId>(['HD-01'])
  for (const room of rooms) {
    const route = rareHouseRoutes.get(room as HouseRoomId)
    assert.ok(route, `Authored House path to ${room} exists`)
    for (const step of route) visited.add(step)
  }
  return [...visited]
}
assert.deepEqual(earnedBriarRareEvents({}, {}), [])
for (const event of rareCases) {
  const endings = new Set<string>()
  for (const choice of event.choices) {
    const briar: Record<string, string> = { ...event.briar }
    const house: Record<string, string> = { ...event.house }
    ;(event.branchScope === 'briar' ? briar : house)[event.branchKey] = choice
    const earned = earnedBriarRareEvents(briar, house)
    assert.equal(earned.length, 1, `${event.id} ${choice} is earned`)
    assert.equal(earned[0]?.id, event.id)
    assert.ok(earned[0]!.outcome.length > 180)
    endings.add(earned[0]!.outcome)
    const restored = restoreBriarSave(
      JSON.parse(
        JSON.stringify({
          ...newBriarSave(),
          revealed: Object.keys(briar),
          visited: Object.keys(briar),
          sceneChoices: briar,
          house: {
            ...newHouseProgress(),
            visited: visitedRareHouseRooms(Object.keys(house)),
            decisions: house,
          },
        }),
      ),
    )
    assert.deepEqual(
      earnedBriarRareEvents(
        restored.sceneChoices,
        restored.house?.decisions ?? {},
      ),
      earned,
      `${event.id} survives a save/reload without new state`,
    )
    const missingBranchBriar = { ...briar }
    const missingBranchHouse = { ...house }
    Reflect.deleteProperty(
      event.branchScope === 'briar' ? missingBranchBriar : missingBranchHouse,
      event.branchKey,
    )
    assert.equal(
      earnedBriarRareEvents(missingBranchBriar, missingBranchHouse).length,
      0,
      `${event.id} requires a recorded final decision`,
    )
    for (const key of Object.keys(event.briar)) {
      const incomplete = { ...briar }
      Reflect.deleteProperty(incomplete, key)
      assert.equal(
        earnedBriarRareEvents(incomplete, house).length,
        0,
        `${event.id} requires Briar ${key}`,
      )
    }
    for (const key of Object.keys(event.house)) {
      const incomplete = { ...house }
      Reflect.deleteProperty(incomplete, key)
      assert.equal(
        earnedBriarRareEvents(briar, incomplete).length,
        0,
        `${event.id} requires House ${key}`,
      )
    }
    const invalidBriar = { ...briar }
    const invalidHouse = { ...house }
    ;(event.branchScope === 'briar' ? invalidBriar : invalidHouse)[
      event.branchKey
    ] = 'forged'
    assert.equal(
      earnedBriarRareEvents(invalidBriar, invalidHouse).length,
      0,
      `${event.id} rejects forged branch choices`,
    )
  }
  assert.equal(endings.size, 2, `${event.id} has two distinct outcomes`)
}

// World One's first eight cosmetic achievements are earned by the existing
// four-decision rare convergences, not by unverified counters or repeated loot.
assert.equal(MEMORY_BRIAR_ACHIEVEMENTS.length, 8)
assert.equal(new Set(MEMORY_BRIAR_ACHIEVEMENTS.map((m) => m.id)).size, 8)
assert.deepEqual(
  new Set(MEMORY_BRIAR_ACHIEVEMENTS.map((m) => m.id)),
  new Set(BRIAR_RARE_EVENTS.map((event) => event.id)),
)
assert.deepEqual(restoreMemoryAchievements(null), [])
assert.deepEqual(restoreMemoryAchievements(['unknown', 12, 'unknown']), [])
assert.deepEqual(memoryAchievementGallery([]).filter((m) => m.earned), [])
for (const medal of MEMORY_BRIAR_ACHIEVEMENTS) {
  const quest = BRIAR_QUESTS.find((q) => q.id === medal.questId)
  assert.equal(medal.artPath, quest?.artPath, 'reuse authored quest art')
  assert.ok(medal.title.length >= 12 && medal.description.length >= 45)
}
let lifetime: string[] = []
for (const event of rareCases) {
  const briar: Record<string, string> = { ...event.briar }
  const house: Record<string, string> = { ...event.house }
  ;(event.branchScope === 'briar' ? briar : house)[event.branchKey] =
    event.choices[0]
  const earned = earnedBriarRareEvents(briar, house)
  const previousCount = lifetime.length
  lifetime = reconcileMemoryAchievements(lifetime, earned)
  assert.equal(lifetime.length, previousCount + 1)
  assert.ok(lifetime.includes(event.id))
  assert.deepEqual(
    reconcileMemoryAchievements(lifetime, earned),
    lifetime,
    'replaying a rare ending never duplicates its medal',
  )
  assert.deepEqual(
    reconcileMemoryAchievements(
      restoreMemoryAchievements(JSON.parse(JSON.stringify(lifetime))),
      [],
    ),
    lifetime,
    'earned medals survive a new run with no current scene choices',
  )
  assert.deepEqual(
    reconcileMemoryAchievements(lifetime, [
      { id: 'invented', questId: 'invented', title: '', premise: '', outcome: '' },
    ]),
    lifetime,
    'unknown reward IDs never enter the permanent ledger',
  )
}
assert.equal(memoryAchievementGallery(lifetime).filter((m) => m.earned).length, 8)
assert.deepEqual(
  restoreMemoryAchievements([lifetime[1], lifetime[0], lifetime[1], 'fake']),
  lifetime.slice(0, 2),
  'restoration deduplicates and returns medals in canonical order',
)

// The Forge counts the eight threads as quests.
const book = buildMemoryDungeonPlaybook()
const beats = Object.values(book.nodes).filter((n) =>
  n.key.startsWith('briar-quest:'),
)
assert.equal(beats.length, 8)
assert.ok(beats.every((n) => n.kind === 'quest' && n.needsArt && n.artPrompt))

// The overworld opens the Threads log, and the store owns it.
const overworld = readFileSync(
  'components/pages/memory-dungeon-overworld.vue',
  'utf8',
)
assert.match(overworld, /data-testid="memory-quest-log-open"/)
assert.match(overworld, /<memory-dungeon-quest-log/)
assert.match(
  overworld,
  /import MemoryDungeonQuestLog from '~\/components\/memory-dungeon\/quest-log\.vue'/,
  'the log is imported where it mounts',
)
const log = readFileSync('components/memory-dungeon/quest-log.vue', 'utf8')
assert.match(log, /data-testid="memory-quest-log"/)
assert.match(log, /world\.briarQuests/)
assert.match(log, /data-testid="memory-rare-interlude"/)
assert.match(log, /data-testid="memory-medals-toggle"/)
assert.match(log, /data-testid="memory-medals-gallery"/)
assert.match(log, /data-testid="memory-medal"/)
assert.match(log, /kr-scroll min-h-0 flex-1 overflow-y-auto/)
assert.doesNotMatch(log, /\$fetch|localStorage/)
const store = readFileSync('stores/memoryWorldStore.ts', 'utf8')
assert.match(store, /briarQuestLog\(state\.value\.sceneChoices/)
assert.match(store, /earnedBriarRareEvents\(/)
assert.match(store, /memoryDungeonAchievementsV1/)
assert.match(store, /restoreMemoryAchievements\(/)
assert.match(store, /syncAchievements\(\)/)
assert.match(store, /briarAchievements,/)

console.log(
  'Memory Briar quests: 8 side quests, 8 rare interludes with 16 outcomes, 8 persistent cosmetic medals, epilogue weight and save restoration verified',
)
