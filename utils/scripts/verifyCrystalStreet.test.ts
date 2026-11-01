import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import {
  ARCHETYPES,
  GROCERY_COST,
  HEAL_NERVE,
  EDGE_BONUS,
  NIGHT_DRAWS,
  actOf,
  awaitingDraw,
  drawFrom,
  edgesOf,
  modifierFor,
  villainDeck,
  DAYS,
  AVATARS,
  BEST_WINS,
  CHARACTERS,
  FINAL_GIRL,
  SPECIAL_ENDINGS,
  STYLE_BONUS,
  activeCrew,
  isFinalGirl,
  specialEndingOf,
  standingOf,
  standingShift,
  characterFor,
  synergyOf,
  COMPANIONS,
  CREW_LIMIT,
  DECKS,
  ITEMS,
  LOCATIONS,
  SKILL_LABELS,
  VILLAINS,
  activitiesAt,
  allEncounters,
  choose,
  dismiss,
  deckByTag,
  doActivity,
  finaleTier,
  isRunState,
  newRun,
  nightfall,
  resolve,
  villainById,
  successChance,
  ARC_STEPS,
  arcProgress,
  isLoyal,
  pendingOutcome,
  reactionTo,
  shareLink,
  sharedWeekFrom,
  type RunState,
} from '../crystalStreet/rules'
import {
  COMPANION_IDS,
  ITEM_IDS,
  LOCATION_IDS,
  VILLAIN_IDS,
  type VillainId,
} from '../crystalStreet/ids'
import {
  duplicateIds,
  validateAvatar,
  validateCharacter,
  validateStyle,
  validateCompanion,
  validateDeck,
  validateItem,
  validateLocation,
  validateVillain,
} from '../crystalStreet/validate'
import { autoplay } from '../crystalStreet/autoplay'
import { TAGS } from '../crystalStreet/types'
import { TIPS, tipFor } from '../crystalStreet/tips'
import { cuesFor } from '../crystalStreet/sound'
import { buildPlaybook } from '../playbook/games'

const file = (path: string) => fileURLToPath(new URL(path, import.meta.url))
const asset = (path: string) => readFileSync(file(path), 'utf8')

// Roster sizes Silas asked for: at least twenty nightmares and twenty friends.
assert.equal(VILLAINS.length, VILLAIN_IDS.length)
assert.ok(VILLAINS.length >= 20, 'twenty or more nightmares')
assert.deepEqual(
  VILLAINS.map((v) => v.id),
  [...VILLAIN_IDS],
)
assert.ok(COMPANIONS.length >= 20, 'twenty or more companions')
assert.deepEqual(COMPANIONS.map((c) => c.id).sort(), [...COMPANION_IDS].sort())
assert.equal(CREW_LIMIT, 10, 'ten active companions at most')
assert.deepEqual(LOCATIONS.map((l) => l.id).sort(), [...LOCATION_IDS].sort())
assert.deepEqual(ITEMS.map((i) => i.id).sort(), [...ITEM_IDS].sort())
assert.equal(DECKS.length, TAGS.length, 'one night deck per tag')
assert.equal(ARCHETYPES.length, 6)
for (const a of ARCHETYPES)
  assert.equal(
    Object.values(a.skills).reduce((s, n) => s + n, 0),
    9,
    `${a.id} starts with nine skill points`,
  )

// Every card passes the authoring contract.
const problems: string[] = []
for (const v of VILLAINS) validateVillain(problems, v)
for (const c of COMPANIONS) validateCompanion(problems, c)
for (const l of LOCATIONS) validateLocation(problems, l)
for (const d of DECKS) validateDeck(problems, d)
for (const i of ITEMS) validateItem(problems, i)
// Player avatars (Silas, 2026-10-24 PT): a real cast to choose from.
assert.ok(AVATARS.length >= 12, 'twelve or more avatars')
assert.equal(new Set(AVATARS.map((a) => a.id)).size, AVATARS.length)
for (const a of AVATARS) {
  validateAvatar(problems, a)
  validateStyle(problems, `avatar ${a.id}`, a.style)
}
for (const a of ARCHETYPES) validateStyle(problems, `clique ${a.id}`, a.style)
// Look × clique = character (Silas, 2026-10-24 PT): every pairing exists,
// with its own name, bio and portrait prompt.
assert.equal(CHARACTERS.length, AVATARS.length * ARCHETYPES.length)
assert.equal(new Set(CHARACTERS.map((c) => c.title)).size, CHARACTERS.length)
for (const look of AVATARS)
  for (const clique of ARCHETYPES)
    assert.ok(
      characterFor(look.id, clique.id),
      `${look.id} × ${clique.id} has a character`,
    )
for (const c of CHARACTERS) validateCharacter(problems, c)
// The avatar names never collide with a clique's (Silas: "confusion between
// role and character in the select screen").
for (const a of AVATARS)
  assert.ok(
    !ARCHETYPES.some((c) => c.name === a.name),
    `${a.name} is not also a clique`,
  )
assert.deepEqual(problems, [], problems.slice(0, 20).join('\n'))

const encounters = [
  ...VILLAINS.flatMap((v) => [
    ...v.clues.map((c) => c.encounter),
    ...v.signature,
    v.finale,
  ]),
  ...COMPANIONS.flatMap((c) => [c.meet, ...(c.arc ?? [])]),
  ...LOCATIONS.flatMap((l) => l.beats),
  ...DECKS.flatMap((d) => d.encounters),
]
assert.deepEqual(duplicateIds(encounters), [], 'encounter ids are unique')
assert.equal(allEncounters().length, encounters.length)

// Two or more choices everywhere, each with an illustrated win and loss.
for (const e of encounters) {
  assert.ok(e.choices.length >= 2, `${e.id} offers a real choice`)
  for (const c of e.choices) {
    assert.ok(c.success.art && c.failure.art, `${e.id}/${c.id} has outcome art`)
    assert.notEqual(c.success.text, c.failure.text)
  }
}

// Each nightmare draws from decks that exist, and has its own best ending.
for (const v of VILLAINS) {
  for (const tag of v.tags)
    assert.ok(
      (deckByTag(tag)?.encounters.length ?? 0) >= 5,
      `${v.id}: ${tag} deck`,
    )
  assert.ok(v.endings.best.text.length > 160, `${v.id} has a best ending`)
  assert.equal(new Set(v.clues.map((c) => c.location)).size, 3)
}
for (const c of COMPANIONS)
  assert.ok(
    LOCATIONS.some((l) => l.id === c.location),
    `${c.id} can be met somewhere`,
  )

// Companion arcs (conductor crystal-street t-008): every friend has three
// hangouts and reactions; one hangout a day at their spot while in your crew;
// finishing all three makes them Loyal, a finale bonus.
for (const c of COMPANIONS) {
  assert.equal(c.arc?.length, ARC_STEPS, `${c.id} has a three-step arc`)
  assert.ok(
    Object.keys(c.reactions ?? {}).length >= 2,
    `${c.id} reacts to nightmares`,
  )
}
{
  const friend = COMPANIONS[0]!
  const id = friend.id as (typeof COMPANION_IDS)[number]
  let week: RunState = {
    ...newRun({
      seed: 'arc',
      name: 'A',
      pronouns: 'they/them',
      archetype: 'jock',
      villain: 'counselor-jess',
    }),
    crew: [id],
    flags: [`recruit:${id}`],
  }
  const hangout = () =>
    activitiesAt(week, friend.location as never).find(
      (a) => a.kind === 'hangout',
    )
  const playHangout = () => {
    const a = hangout()!
    week = doActivity(week, friend.location as never, a)
    assert.equal(week.current?.kind, 'arc')
    week = resolve(choose(week, currentChoiceId(week)))
  }
  const currentChoiceId = (r: RunState) =>
    friend.arc!.find((e) => e.id === r.current!.id)!.choices[0]!.id
  assert.deepEqual(hangout(), { kind: 'hangout', companionId: id, step: 1 })
  playHangout()
  assert.equal(arcProgress(week, id), 1)
  assert.equal(hangout(), undefined, 'one hangout a day')
  for (let step = 2; step <= ARC_STEPS; step++) {
    week = { ...week, day: week.day + 1, actions: 3 }
    playHangout()
  }
  assert.ok(isLoyal(week, id))
  assert.equal(hangout(), undefined, 'the story is finished')
  const finale = villainById('counselor-jess')!.finale
  const atFinale: RunState = {
    ...week,
    phase: 'night',
    current: { id: finale.id, kind: 'finale' },
  }
  const choice = finale.choices[0]!
  assert.equal(
    modifierFor(atFinale, choice).modifier -
      modifierFor({ ...atFinale, flags: [`recruit:${id}`] }, choice).modifier,
    1,
    'a Loyal friend adds +1 at the finale',
  )
  assert.ok(
    modifierFor(atFinale, choice).breakdown.some((b) => b.startsWith('Loyal')),
  )
  // Reactions show once the nightmare is revealed and a tag matches.
  const tagged = COMPANIONS.find((c) =>
    villainById('counselor-jess')!.tags.some((t) => c.reactions?.[t]),
  )
  if (tagged) assert.ok(reactionTo({ ...week, revealed: true }, tagged))
  assert.equal(reactionTo({ ...week, revealed: false }, friend), null)
}

// An outcome that puts a bonus companion in the scene reads its alone text
// when they're not in your crew.
{
  const owner = [
    ...VILLAINS.flatMap((v) => [
      ...v.signature,
      v.finale,
      ...v.clues.map((c) => c.encounter),
    ]),
    ...LOCATIONS.flatMap((l) => l.beats),
    ...DECKS.flatMap((d) => d.encounters),
  ].find((e) => e.choices.some((c) => c.bonus?.companion && c.success.alone))!
  const choice = owner.choices.find(
    (c) => c.bonus?.companion && c.success.alone,
  )!
  const base: RunState = {
    ...newRun({
      seed: 'alone',
      name: 'A',
      pronouns: 'they/them',
      archetype: 'jock',
      villain: 'counselor-jess',
    }),
    current: { id: owner.id, kind: 'beat' },
  }
  const roll = {
    dice: [6, 6] as [number, number],
    modifier: 0,
    total: 12,
    target: choice.target,
    success: true,
    breakdown: [] as string[],
  }
  const pending = { choiceId: choice.id, roll, rerolled: false, shielded: null }
  assert.equal(pendingOutcome({ ...base, pending })!.text, choice.success.alone)
  assert.equal(
    pendingOutcome({
      ...base,
      crew: [choice.bonus!.companion as (typeof COMPANION_IDS)[number]],
      pending,
    })!.text,
    choice.success.text,
  )
}

// First-week tips (conductor crystal-street t-016): one at a time, the first
// time each moment comes up, never again once seen.
{
  const day1 = newRun({
    seed: 'tips',
    name: 'T',
    pronouns: 'they/them',
    archetype: 'jock',
    villain: 'goody-hale',
  })
  assert.equal(new Set(TIPS.map((t) => t.id)).size, TIPS.length)
  assert.equal(tipFor(day1, [])?.id, 'map')
  assert.equal(tipFor(day1, ['map']), null, 'nothing else is new on day one')
  const beat = activitiesAt(day1, 'library').find((a) => a.kind === 'beat')!
  const atCard = doActivity(day1, 'library', beat)
  assert.equal(tipFor(atCard, ['map'])?.id, 'card')
  const rolled = choose(
    atCard,
    allEncounters().find((e) => e.id === atCard.current!.id)!.choices[0]!.id,
  )
  assert.equal(tipFor(rolled, ['map', 'card'])?.id, 'outcome')
  assert.equal(tipFor({ ...day1, day: 2 }, ['map'])?.id, 'standing')
  assert.equal(tipFor({ ...day1, phase: 'ended' }, []), null)
}

// Shared weeks (conductor crystal-street t-009): a link carries the seed and
// the nightmare; anything else in the query is refused.
{
  const week = { seed: 'mh3k2x-a1b2c3', villain: 'goody-hale' as VillainId }
  const link = shareLink(week)
  assert.equal(
    link,
    '/play/crystal-street?week=mh3k2x-a1b2c3&nightmare=goody-hale',
  )
  const query = Object.fromEntries(new URL(link, 'https://x.test').searchParams)
  assert.deepEqual(sharedWeekFrom(query), week)
  assert.equal(sharedWeekFrom({ week: 'a', nightmare: 'nobody' }), null)
  assert.equal(
    sharedWeekFrom({ week: '<script>', nightmare: 'goody-hale' }),
    null,
  )
  assert.equal(sharedWeekFrom({ week: ['a'], nightmare: 'goody-hale' }), null)
  assert.equal(sharedWeekFrom({}), null)
  // The same seed and nightmare deal the same first night.
  const a = autoplay(week.seed, week.villain, 'jock', AVATARS[0]!.id)
  const b = autoplay(week.seed, week.villain, 'jock', AVATARS[0]!.id)
  assert.deepEqual(
    a.log.map((l) => l.encounterId),
    b.log.map((l) => l.encounterId),
  )
}

// Sound cues (conductor crystal-street t-016): a roll rattles then stings,
// dusk and dawn mark the phase, a new week or a reload stays silent.
{
  const day1 = newRun({
    seed: 'cues',
    name: 'C',
    pronouns: 'they/them',
    archetype: 'jock',
    villain: 'goody-hale',
  })
  assert.deepEqual(cuesFor(null, day1), [])
  assert.deepEqual(cuesFor(day1, { ...day1 }), [])
  assert.deepEqual(cuesFor({ ...day1, seed: 'other' }, day1), [])
  const beat = activitiesAt(day1, 'library').find((a) => a.kind === 'beat')!
  const atCard = doActivity(day1, 'library', beat)
  assert.deepEqual(cuesFor(day1, atCard), ['card'])
  const rolled = choose(
    atCard,
    allEncounters().find((e) => e.id === atCard.current!.id)!.choices[0]!.id,
  )
  assert.deepEqual(cuesFor(atCard, rolled), [
    'roll',
    rolled.pending!.roll.success ? 'success' : 'failure',
  ])
  assert.deepEqual(cuesFor(day1, { ...day1, phase: 'night' }), ['dusk'])
  assert.deepEqual(cuesFor({ ...day1, phase: 'night' }, day1), ['dawn'])
  assert.deepEqual(cuesFor(day1, { ...day1, ending: { tier: 'bad', at: 1 } }), [
    'ending-bad',
  ])
}

// A chosen avatar rides along with the week; an unknown one is dropped.
assert.equal(
  newRun({
    seed: 'a',
    name: 'A',
    pronouns: 'they/them',
    archetype: 'jock',
    avatar: AVATARS[0]!.id,
  }).avatar,
  AVATARS[0]!.id,
)
assert.equal(
  newRun({
    seed: 'a',
    name: 'A',
    pronouns: 'they/them',
    archetype: 'jock',
    avatar: 'nobody',
  }).avatar,
  undefined,
)

// Synergy: a typecast look doubles down on its style, an against-type one
// also plays the clique's home style; style bonuses reach the roll.
{
  const typecast = synergyOf('goalie', 'jock')!
  assert.equal(typecast.typecast, true)
  assert.deepEqual(
    typecast.bonuses.map((b) => [b.style, b.amount]),
    [['brave', STYLE_BONUS.brave + 1]],
  )
  const against = synergyOf('vogue', 'brain')!
  assert.equal(against.typecast, false)
  assert.deepEqual(
    against.bonuses.map((b) => [b.style, b.amount]),
    [
      ['camp', STYLE_BONUS.camp],
      ['clever', 1],
    ],
  )
  assert.equal(synergyOf(null, 'jock'), null)
  const styled = newRun({
    seed: 's',
    name: 'S',
    pronouns: 'they/them',
    archetype: 'brain',
    avatar: 'vogue',
  })
  const bare = { ...styled, avatar: undefined }
  const campChoice = VILLAINS.flatMap((v) => v.signature)
    .flatMap((e) => e.choices)
    .find((c) => c.intent === 'camp')!
  assert.equal(
    modifierFor(styled, campChoice).modifier -
      modifierFor(bare, campChoice).modifier,
    STYLE_BONUS.camp,
  )
}

// Factions (Silas, 2026-10-24 PT: "friends family officials neighbors. if
// any of them drop to zero that could trigger a special end sequence").
{
  const fresh = newRun({
    seed: 'factions',
    name: 'F',
    pronouns: 'they/them',
    archetype: 'jock',
    avatar: AVATARS[0]!.id,
    villain: 'counselor-jess',
  })
  assert.deepEqual(standingOf(fresh), {
    friends: 3,
    family: 4,
    officials: 3,
    neighbors: 3,
  })
  const jess = villainById('counselor-jess')!
  const card = jess.signature[0]!
  const sneaky = { ...card.choices[0]!, intent: 'sneaky' as const }
  const kind = { ...card.choices[0]!, intent: 'kind' as const }
  const night: RunState = {
    ...fresh,
    phase: 'night',
    current: { id: card.id, kind: 'signature' },
  }
  // Failures cost standing (family once a night for a nightmare card,
  // officials for sneaky or reckless, friends when you face it alone);
  // kind successes win the neighbors back.
  assert.deepEqual(standingShift(night, sneaky, false), {
    officials: -1,
    family: -1,
    friends: -1,
  })
  assert.deepEqual(standingShift(night, kind, true), { neighbors: 1 })
  assert.deepEqual(
    standingShift({ ...night, flags: ['curfew-1', 'alone-1'] }, sneaky, false),
    { officials: -1 },
  )
  // A faction at zero ends the week its own way.
  const brink: RunState = {
    ...night,
    standing: { ...standingOf(fresh), family: 1 },
  }
  const choice = card.choices[0]!
  let lost = choose(brink, choice.id)
  lost = {
    ...lost,
    pending: {
      ...lost.pending!,
      roll: { ...lost.pending!.roll, success: false },
    },
  }
  const ended = resolve(lost)
  assert.equal(ended.phase, 'ended')
  assert.equal(ended.ending?.special, 'family')
  assert.match(specialEndingOf(ended)!.text, /Counselor Jess/)
  // Friends at zero start the Final Girl sequence: the finale tonight, alone.
  const lonely: RunState = {
    ...night,
    crew: ['dani-ortega'],
    standing: { ...standingOf(fresh), friends: 1 },
  }
  let shaken = choose(lonely, choice.id)
  shaken = {
    ...shaken,
    pending: {
      ...shaken.pending!,
      roll: { ...shaken.pending!.roll, success: false },
    },
  }
  const solo = dismiss(resolve(shaken), 'dani-ortega')
  assert.ok(isFinalGirl(solo) && solo.flags.includes(FINAL_GIRL))
  assert.equal(activeCrew({ ...solo, crew: ['dani-ortega'] }).length, 0)
  assert.ok(
    solo.phase === 'ended' ||
      solo.queue.some((q) => q.kind === 'finale') ||
      solo.current?.kind === 'finale' ||
      solo.phase === 'day',
  )
  for (const [id, e] of Object.entries(SPECIAL_ENDINGS)) {
    assert.ok(e.title.length > 3, `${id} title`)
    assert.ok(e.text.length > 200, `${id} text`)
    assert.ok(e.art.length > 80, `${id} art`)
  }
}

// Ending rules.
const probe = newRun({
  seed: 'probe',
  name: 'P',
  pronouns: 'they/them',
  archetype: 'jock',
})
probe.wins = BEST_WINS
probe.nerve = 5
assert.equal(finaleTier(probe, 'heart', true), 'best')
assert.equal(finaleTier(probe, 'fight', true), 'good')
assert.equal(finaleTier(probe, 'heart', false), 'bittersweet')
probe.nerve = 2
assert.equal(finaleTier(probe, 'trick', false), 'bad')
probe.wins = BEST_WINS - 1
probe.nerve = 5
assert.equal(finaleTier(probe, 'heart', true), 'good', 'best needs the wins')

// Odds math.
assert.equal(successChance(-20, 7), 1 / 36, 'boxcars always win')
assert.equal(successChance(20, 11), 35 / 36, 'snake eyes always lose')

// Day and night loop.
let run: RunState = newRun({
  seed: 'loop',
  name: 'Loop',
  pronouns: 'she/her',
  archetype: 'weirdo',
  villain: 'frieda-krueger',
})
assert.equal(run.villain, 'frieda-krueger')
assert.equal(run.phase, 'day')
assert.equal(run.revealed, false)
assert.ok(
  !activitiesAt(run, 'library').some((a) => a.kind === 'clue'),
  'no leads before the nightmare shows itself',
)
const train = activitiesAt(run, 'gym').find((a) => a.kind === 'train')!
run = doActivity(run, 'gym', train)
assert.equal(run.actions, 2)
assert.equal(run.skills.brawn, 1)
assert.ok(
  !activitiesAt(run, 'library').some((a) => a.kind === 'train'),
  'one training a day',
)
// The nurse and the market (Silas, 2026-10-24 PT): the clinic patches you up
// and steadies a shaken friend; the market trades quarters for nerve and less
// dread.
{
  let day = newRun({
    seed: 'stops',
    name: 'S',
    pronouns: 'they/them',
    archetype: 'jock',
  })
  day.nerve = 4
  day.dread = 3
  day.quarters = 5
  const heal = activitiesAt(day, 'mercy-clinic').find((a) => a.kind === 'heal')
  assert.ok(heal, 'the clinic offers the nurse')
  day = doActivity(day, 'mercy-clinic', heal!)
  assert.equal(day.nerve, 4 + HEAL_NERVE)
  const food = activitiesAt(day, 'thriftee-mart').find(
    (a) => a.kind === 'groceries',
  )
  assert.ok(food, 'the market sells comfort food')
  day = doActivity(day, 'thriftee-mart', food!)
  assert.equal(day.quarters, 5 - GROCERY_COST)
  assert.equal(day.dread, 2)
  day.quarters = 1
  assert.ok(
    !activitiesAt(day, 'thriftee-mart').some((a) => a.kind === 'groceries'),
    'comfort food costs quarters',
  )
}
run = nightfall(run)
assert.equal(run.phase, 'night')
assert.equal(run.revealed, true)
assert.equal(run.current, null, 'the night waits for a deck choice')
assert.ok(awaitingDraw(run))
assert.equal(run.draws, NIGHT_DRAWS)
assert.ok(
  villainDeck(run).every((e) => e.act === 1),
  'act one deals act one',
)
run = drawFrom(run, 'villain')
assert.equal(
  run.current?.kind,
  'signature',
  'the villain deck deals its own card',
)
assert.equal(run.draws, NIGHT_DRAWS - 1)
const firstNight = allEncounters().find((e) => e.id === run.current!.id)!
run = resolve(choose(run, firstNight.choices.find((c) => !c.requires)!.id))
assert.equal(run.rolls, 1)
assert.ok(isRunState(JSON.parse(JSON.stringify(run))), 'saves round-trip')

// Determinism and balance across seeded autoplay.
const a = autoplay('same-seed')
const b = autoplay('same-seed')
assert.deepEqual(
  a,
  { ...b, ending: { ...b.ending!, at: a.ending!.at } },
  'seeded weeks replay exactly',
)

// Acts: nights 1-2, 3-4 and 5-6 deal only that act's villain cards, never
// repeat one, and a week can see every card of an act. Beating any card of an
// act earns its edge; edges add to every finale roll.
assert.equal(actOf(1), 1)
assert.equal(actOf(4), 2)
assert.equal(actOf(6), 3)
for (const v of VILLAINS) {
  const actById = new Map(v.signature.map((e) => [e.id, e.act]))
  const orders = new Set<string>()
  for (let i = 0; i < 10; i++) {
    const week = autoplay(`acts-${v.id}-${i}`, v.id as VillainId)
    const dealt = week.log.filter(
      (l) => l.phase === 'night' && actById.has(l.encounterId),
    )
    for (const l of dealt)
      assert.equal(
        actById.get(l.encounterId),
        actOf(l.day),
        `${v.id} act order`,
      )
    const ids = dealt.map((l) => l.encounterId)
    assert.equal(
      new Set(ids).size,
      ids.length,
      `${v.id} villain cards never repeat`,
    )
    for (const l of dealt.filter((d) => d.success))
      assert.ok(
        week.flags.includes(`edge-${actOf(l.day)}`),
        `${v.id} edge earned`,
      )
    orders.add(ids.join(','))
  }
  assert.ok(orders.size > 1, `${v.id} villain cards vary week to week`)
}

// Finale edges: each edge adds to the finale roll, and a week with no edges
// still has a real chance at every approach.
{
  const v = VILLAINS[0]!
  const w = newRun({
    seed: 'edges',
    name: 'E',
    pronouns: 'they/them',
    archetype: 'jock',
    villain: v.id as VillainId,
  })
  w.day = DAYS
  w.phase = 'night'
  w.current = { id: v.finale.id, kind: 'finale' }
  const fight = v.finale.choices.find((c) => c.id === 'fight')!
  const bare = modifierFor(w, fight).modifier
  w.flags.push('edge-1', 'edge-3')
  assert.equal(modifierFor(w, fight).modifier, bare + 2 * EDGE_BONUS)
  assert.equal(edgesOf(w).length, 2)
}

const tiers: Record<string, number> = {
  best: 0,
  good: 0,
  bittersweet: 0,
  bad: 0,
}
const bestBy = new Map<string, number>()
const RUNS = 20
for (const v of VILLAINS) {
  for (let i = 0; i < RUNS; i++) {
    const end = autoplay(
      `${v.id}-${i}`,
      v.id as VillainId,
      ARCHETYPES[i % 6]!.id,
      AVATARS[(i * 7) % AVATARS.length]!.id,
    )
    assert.equal(end.phase, 'ended', `${v.id}-${i} finishes`)
    assert.ok(end.ending, `${v.id}-${i} has an ending`)
    tiers[end.ending!.tier]! += 1
    if (end.ending!.tier === 'best')
      bestBy.set(v.id, (bestBy.get(v.id) ?? 0) + 1)
    assert.ok(end.crew.length <= CREW_LIMIT)
  }
}
const total = VILLAINS.length * RUNS
console.log(
  `Crystal Street autoplay over ${total} weeks: ` +
    Object.entries(tiers)
      .map(([t, n]) => `${t} ${Math.round((n / total) * 100)}%`)
      .join(', '),
)
for (const v of VILLAINS)
  assert.ok(
    (bestBy.get(v.id) ?? 0) > 0,
    `${v.id}: a careful week can reach the best ending`,
  )
// A guard, not the balance target: 460 seeded weeks carry about +/-2 points
// of noise around careful play's true rate (64% on the 2,208-week report,
// conductor projects/crystal-street/BALANCE-REPORT.md, which holds every
// nightmare to 40-75%), so the line sits a little above it.
assert.ok(
  tiers.best! < total * 0.68,
  'the best ending is earned, not automatic',
)
assert.ok(tiers.bad! + tiers.bittersweet! > 0, 'weeks can go wrong')

// Surface contracts: public play route, legacy admin redirect, arcade tab,
// store-owned storage, playbook.
assert.ok(existsSync(file('../../pages/play/crystal-street.vue')))
assert.match(
  asset('../../pages/play/crystal-street.vue'),
  /<header-page-bar[^>]*console-theme="crystal-street"[^>]*>[\s\S]*?data-testid="cs-menu-bar"[\s\S]*?label="Game screens"[\s\S]*?<\/header-page-bar>/,
  'the menu and game headers ride the shared console system bar',
)
assert.match(
  asset('../../pages/admin/crystal-street.vue'),
  /navigateTo\('\/play\/crystal-street', \{ redirectCode: 301 \}\)/,
)
assert.equal(
  existsSync(file('../../content/channels/admin/crystal-street.md')),
  false,
)
const tab = asset('../../content/channels/arcade/crystal-street.md')
assert.match(tab, /\nchannelKey: arcade\n/)
assert.doesNotMatch(tab, /requiredRole/)
assert.match(tab, /route: \/play\/crystal-street/)
// The theme music video (MusicVideo 15) ships with the game.
assert.ok(existsSync(file('../../public/crystal-street/video/theme.mp4')))
assert.ok(
  existsSync(file('../../public/crystal-street/video/theme-poster.webp')),
)
const trailerRoom = asset(
  '../../components/crystal-street/crystal-street-theme.vue',
)
assert.match(trailerRoom, /data-testid="cs-theme-room"/)
assert.match(trailerRoom, /class="cs-tv-cabinet"/)
assert.match(trailerRoom, /data-testid="cs-theme-video"/)
assert.match(trailerRoom, /src="\/crystal-street\/video\/theme\.mp4"/)
assert.match(trailerRoom, /controls\s+playsinline/)
assert.match(
  asset('../../components/crystal-street/crystal-street-title.vue'),
  /icon: 'kind-icon:tv'/,
)
assert.match(
  asset('../../pages/play/crystal-street.vue'),
  /label: 'Trailer', icon: 'kind-icon:tv'/,
)
assert.ok(existsSync(file('../../assets/icons/tv.svg')))
assert.match(
  asset('../../components/home/home-visitor-directory.vue'),
  /route: '\/play\/crystal-street'/,
)
for (const name of readdirSync(file('../../components/crystal-street')))
  assert.ok(
    !/localStorage|\$fetch/.test(
      asset(`../../components/crystal-street/${name}`),
    ),
    `${name} leaves storage to the store`,
  )
assert.ok(
  !/localStorage|\$fetch/.test(asset('../../pages/play/crystal-street.vue')),
)
assert.match(
  asset('../../stores/crystalStreetStore.ts'),
  /crystal-street-scrapbook-v1/,
)
const book = buildPlaybook('crystal-street')
assert.equal(
  book.routes.filter((r) => VILLAIN_IDS.includes(r.id as VillainId)).length,
  VILLAINS.length,
)
assert.equal(Object.keys(SKILL_LABELS).length, 6)

console.log('Crystal Street contract passed')
