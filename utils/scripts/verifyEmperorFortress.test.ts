import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { ACT_ONE_DAYS, ACT_ONE_QUESTS } from '../emperorOfDust/fortress/actOne'
import { ACT_ONE_LATE_QUESTS } from '../emperorOfDust/fortress/actOneLate'
import { ACT_TWO_QUESTS } from '../emperorOfDust/fortress/actTwo'
import { ACT_THREE_QUESTS } from '../emperorOfDust/fortress/actThree'
import { ACT_FOUR_QUESTS } from '../emperorOfDust/fortress/actFour'
import { ACT_FIVE_QUESTS } from '../emperorOfDust/fortress/actFive'
import { ENDINGS, endingOf } from '../emperorOfDust/fortress/endings'
import {
  DAYS,
  LAST_DAY,
  QUEST_TEMPLATES,
  questDef,
} from '../emperorOfDust/fortress/content'
import {
  BAND_NEED,
  PLEDGES,
  WAGE,
  applyEffects,
  assignQuest,
  audienceScene,
  audiencesToday,
  bedsUsed,
  buyItem,
  chooseAudienceOption,
  createRun,
  dailyTaxes,
  equipItem,
  finishDay,
  followerMood,
  followerStatus,
  forecastMark,
  injuryDaysLeft,
  isOver,
  optionBlockers,
  optionVisible,
  partyLimit,
  postDawnQuests,
  previewQuest,
  recruit,
  selectHideout,
  traitKnown,
  upgradeBeds,
  withdrawQuest,
} from '../emperorOfDust/fortress/engine'
import {
  FOLLOWERS,
  ITEMS,
  followerDef,
} from '../emperorOfDust/fortress/followers'
import { REGIONS } from '../emperorOfDust/fortress/factions'
import { NPCS, npcDef, reactionMood } from '../emperorOfDust/fortress/npcs'
import { CAST_ART, castArtUrl } from '../emperorOfDust/fortress/castArt'
import {
  decodeBook,
  decodeCodex,
  decodeSlot,
  encodeBook,
  encodeSlot,
  mergeCodex,
  newBook,
  recordDawn,
  rewindTo,
  updateCurrent,
  validateRun,
} from '../emperorOfDust/fortress/saves'
import {
  acquireRelic,
  chooseNextLoadout,
  claimableRelics,
  decodeRelicVault,
  emptyRelicVault,
  encodeRelicVault,
  eyeReveals,
} from '../emperorOfDust/fortress/relics'
import {
  KINGDOM_FACTIONS,
  LOCAL_FACTIONS,
  STATS,
} from '../emperorOfDust/fortress/types'
import type {
  AudienceDef,
  AudienceOption,
  FortressRun,
} from '../emperorOfDust/fortress/types'

// --- content contract -------------------------------------------------------
assert.equal(FOLLOWERS.length, 20, 'the full cast of twenty')
assert.deepEqual(
  FOLLOWERS.map((def) => def.id),
  Array.from({ length: 20 }, (_, i) => `F${String(i + 1).padStart(3, '0')}`),
)
assert.equal(
  FOLLOWERS.filter((def) => def.romanceable).length,
  6,
  'six romanceable followers',
)
assert.equal(
  new Set(FOLLOWERS.map((def) => def.ability.kind)).size,
  FOLLOWERS.length,
  'every follower has a mechanic nobody else has',
)
const castSpecies = [
  ...FOLLOWERS.map((def) => def.species),
  ...NPCS.map((npc) => npc.species),
].map((species) => species.toLowerCase())
assert.equal(
  new Set(castSpecies).size,
  castSpecies.length,
  'no two named characters share a species',
)
for (const day of DAYS)
  for (const audience of day.audiences)
    if (audience.npc) assert.ok(npcDef(audience.npc), audience.npc)
for (const faction of [...LOCAL_FACTIONS, ...KINGDOM_FACTIONS]) {
  const reps = NPCS.filter((npc) => npc.faction === faction)
  assert.ok(reps.length, `${faction} has a named NPC`)
  assert.ok(
    reps.some((npc) =>
      DAYS.some((day) => day.audiences.some((a) => a.npc === npc.slug)),
    ),
    `${faction}'s NPC speaks at court by Day ${LAST_DAY}`,
  )
}
const kiyo = followerDef('F003')!
assert.equal(kiyo.species, 'Koala', 'Zuzu’s mother is at court')
assert.ok(kiyo.starter && !kiyo.romanceable)
assert.ok(kiyo.talk?.some((line) => line.includes('Zuzu')))
assert.ok(FOLLOWERS.some((def) => def.species === 'Fennec fox'))
assert.ok(
  FOLLOWERS.some((def) =>
    def.traits.some(
      (t) =>
        t.kind === 'allegiance' &&
        t.amount < 0 &&
        t.trigger.faction === def.origin,
    ),
  ),
  'someone raised by a faction secretly works against it',
)
assert.equal(FOLLOWERS.filter((def) => def.starter).length, 4, 'four starters')
for (const def of FOLLOWERS) {
  for (const stat of STATS) {
    assert.ok(
      def.stats[stat] >= 0 && def.stats[stat] <= 10,
      `${def.id} ${stat}`,
    )
  }
  const total = STATS.reduce((sum, stat) => sum + def.stats[stat], 0)
  assert.ok(total >= 19 && total <= 26, `${def.id} stat total ${total}`)
  assert.ok(
    def.traits.some((t) => t.kind === 'skill'),
    `${def.id} has a secret skill`,
  )
  assert.ok(
    def.traits.some((t) => t.kind === 'weakness'),
    `${def.id} has a weakness`,
  )
  assert.ok(def.ability.name && def.ability.text, `${def.id} unique ability`)
  for (const trait of def.traits) {
    if (trait.kind === 'allegiance') assert.ok(trait.revealFlag, trait.id)
  }
}
assert.equal(
  new Set(FOLLOWERS.map((def) => def.ability.name)).size,
  FOLLOWERS.length,
  'abilities are unique per follower',
)
for (const quest of [
  ...ACT_ONE_QUESTS,
  ...ACT_ONE_LATE_QUESTS,
  ...ACT_TWO_QUESTS,
  ...ACT_THREE_QUESTS,
  ...ACT_FOUR_QUESTS,
  ...ACT_FIVE_QUESTS,
]) {
  assert.ok(quest.durationDays >= 1 && quest.durationDays <= 3, quest.id)
  assert.ok(quest.party.min >= 1 && quest.party.max <= 4, quest.id)
  assert.ok(quest.party.min <= quest.party.max, quest.id)
  assert.ok(quest.requirements.length >= 1, quest.id)
}
for (const def of DAYS) {
  assert.equal(
    def.briefings.filter((b) => !b.truth).length,
    1,
    `day ${def.day} has one lie`,
  )
  for (const id of def.quests) assert.ok(questDef(id), id)
  for (const audience of def.audiences) {
    for (const option of audience.options) {
      for (const id of option.postsQuests ?? []) assert.ok(questDef(id), id)
      for (const id of option.effects.recruit ?? [])
        assert.ok(followerDef(id), id)
    }
  }
}
assert.deepEqual(
  ACT_ONE_DAYS.map((def) => def.day),
  [1, 2, 3, 4],
)
assert.deepEqual(
  DAYS.map((def) => def.day),
  Array.from({ length: LAST_DAY }, (_, i) => i + 1),
  'all fifty days are scripted end to end',
)
for (const def of DAYS) {
  assert.ok(
    def.audiences.length + def.quests.length >= 1,
    `day ${def.day} has something to do`,
  )
  for (const report of def.briefings)
    if (report.komodoLie) assert.equal(report.truth, false, report.id)
}
assert.ok(
  new Set(DAYS.map((def) => def.briefings.findIndex((b) => !b.truth))).size > 1,
  'the lie is not always in the same slot',
)
assert.ok(
  DAYS.some((def) => def.briefings.some((b) => b.komodoLie)),
  'Act I plants at least one of Komodo’s own lies',
)
assert.ok(
  DAYS.find((def) => def.day === 5)!.quests.includes('q-d05-flour-barrels'),
  'Day 5 posts the flour quest at dawn',
)
assert.ok(
  ACT_ONE_LATE_QUESTS.find((quest) => quest.id === 'q-d05-flour-barrels')!
    .outcomes.expired,
  'the flour quest has an expiry outcome',
)
assert.ok(
  ACT_ONE_LATE_QUESTS.some((quest) => quest.lethal),
  'Act I teaches the lethal marker',
)

// --- a new run --------------------------------------------------------------
const start = createRun(1234)
assert.equal(start.day, 1)
assert.equal(start.brass, 120)
assert.equal(start.roster.length, 4)
assert.equal(start.beds, 6)
assert.ok(!('horde' in start), 'no Horde in v0.3')
assert.ok(validateRun(start))
assert.ok(start.board.some((entry) => entry.questId === 'q-d01-well-road'))
assert.equal(
  start.board.filter((entry) => entry.questId.includes('@')).length,
  1,
  'one seeded chore on an authored day',
)
assert.ok(!start.revealedFactions.includes('rustline'), 'Rustline is fogged')
assert.equal(audiencesToday(start).length, 3)

// --- throne room ------------------------------------------------------------
const repaired = chooseAudienceOption(start, 'd01-aqueduct', 'repair').run
assert.ok(
  repaired.board.some((entry) => entry.questId === 'q-d01-aqueduct-repair'),
)
assert.throws(
  () => chooseAudienceOption(repaired, 'd01-aqueduct', 'levy'),
  /already answered/,
)
const levied = chooseAudienceOption(start, 'd01-aqueduct', 'levy').run
assert.equal(levied.brass, 145)
assert.equal(levied.affinity['hollow-bell'], 0)
const broke: FortressRun = { ...start, brass: 10 }
assert.throws(
  () => chooseAudienceOption(broke, 'd01-toll', 'pay'),
  /Needs 20 brass/,
)
assert.equal(chooseAudienceOption(start, 'd01-toll', 'pay').run.brass, 100)

// --- quest room -------------------------------------------------------------
const odds = previewQuest(repaired, 'q-d01-aqueduct-repair', ['F002'])
assert.equal(odds.estimate, false)
assert.equal(odds.durationDays, 2)
assert.ok(odds.chance >= 5 && odds.chance <= 95)
assert.equal(odds.perRequirement[0]?.needed, BAND_NEED.mid)
const rookFaster = previewQuest(repaired, 'q-d01-aqueduct-repair', [
  'F002',
  'F001',
])
assert.equal(rookFaster.durationDays, 1, 'Rook’s Trailwise shortens the road')

const inspecting = chooseAudienceOption(start, 'd01-mirefen', 'question').run
const blind = previewQuest(inspecting, 'q-d01-mirefen-inspect', ['F003'])
assert.equal(blind.estimate, true, 'hidden Lore requirement gives a range')
assert.equal(blind.perRequirement[1]?.hidden, true)
assert.ok(blind.low <= blind.chance && blind.chance <= blind.high)

assert.throws(
  () => assignQuest(repaired, 'q-d01-aqueduct-repair', []),
  /1-3 followers/,
)
assert.throws(
  () => assignQuest(repaired, 'q-d01-aqueduct-repair', ['F002', 'F002']),
  /only be sent once/,
)
const sent = assignQuest(repaired, 'q-d01-aqueduct-repair', ['F002'])
assert.equal(followerStatus(sent, 'F002'), 'on-quest')
assert.throws(
  () => assignQuest(sent, 'q-d01-well-road', ['F002']),
  /not ready/,
  'no double-booking',
)
const withdrawn = withdrawQuest(sent, 'q-d01-aqueduct-repair')
assert.equal(followerStatus(withdrawn, 'F002'), 'ready')
assert.ok(
  withdrawn.board.some((entry) => entry.questId === 'q-d01-aqueduct-repair'),
)

// --- finishing days ---------------------------------------------------------
const day2 = finishDay(sent).run
assert.equal(day2.day, 2)
assert.equal(
  followerStatus(day2, 'F002'),
  'on-quest',
  'two-day quest still out',
)
assert.equal(day2.brass, sent.brass + dailyTaxes(day2) - WAGE * bedsUsed(day2))
const wellExpired = day2.reports[0]?.quests.find(
  (q) => q.questId === 'q-d01-well-road',
)
assert.equal(wellExpired, undefined, 'well road stays two days on the board')
const day3 = finishDay(day2).run
assert.equal(followerStatus(day3, 'F002') === 'on-quest', false)
const repairReport = day3.reports[1]?.quests.find(
  (q) => q.questId === 'q-d01-aqueduct-repair',
)
assert.ok(repairReport && repairReport.tier !== 'expired')
assert.ok(
  day3.reports[1]?.quests.some(
    (q) => q.questId === 'q-d01-well-road' && q.tier === 'expired',
  ),
  'unassigned quests expire with consequences',
)

// Same seed, branch and choices replay identically.
assert.deepEqual(finishDay(finishDay(sent).run).run, day3)

// Secret traits reveal when relevant and then show in previews.
const saffronRepair = repairReport!.revealedTraits
assert.ok(
  saffronRepair.includes('F002-bridge-builder'),
  'repair reveals Bridge-builder',
)
const day1b = chooseAudienceOption(
  createRun(1234),
  'd01-aqueduct',
  'repair',
).run
const unknown = previewQuest(day1b, 'q-d01-aqueduct-repair', ['F002'])
const known = previewQuest(
  day1b,
  'q-d01-aqueduct-repair',
  ['F002'],
  saffronRepair,
)
assert.ok(
  known.chance >= unknown.chance,
  'Codex knowledge improves the forecast',
)
assert.ok(
  (known.perRequirement[0]?.total ?? 0) >
    (unknown.perRequirement[0]?.total ?? 0),
)
const codex = mergeCodex({ version: 1, revealed: [] }, saffronRepair)
assert.deepEqual(decodeCodex(JSON.stringify(codex)), codex)
assert.equal(decodeCodex('{"version":1,"revealed":[3]}'), null)

// Injuries keep followers home for whole days; deaths need a lethal quest.
const hurt = createRun(9)
hurt.roster[0]!.injuredUntilDay = 4
assert.equal(followerStatus(hurt, 'F001'), 'injured')
assert.equal(injuryDaysLeft(hurt, 'F001'), 3)
assert.throws(() => assignQuest(hurt, 'q-d01-well-road', ['F001']), /not ready/)

let deaths = 0
for (let seed = 1; seed <= 300; seed += 1) {
  let run = chooseAudienceOption(createRun(seed), 'd01-toll', 'break-toll').run
  run = assignQuest(run, 'q-d01-toll-break', ['F003', 'F004'])
  run = finishDay(run).run
  deaths += run.memorials.length
}
assert.equal(deaths, 0, 'quests without a lethal marker never kill')

// Day 9's convoy is marked lethal: a weak party can lose someone, rarely,
// and never more than one follower per quest.
// A run as it stands at dawn of `day`; `patch` is applied before dawn so the
// day's audiences see it.
const onDay = (
  seed: number,
  day: number,
  patch: Partial<FortressRun> = {},
): FortressRun => {
  const run: FortressRun = {
    ...createRun(seed),
    day,
    board: [],
    reports: [],
    ...patch,
  }
  postDawnQuests(run)
  return run
}
let convoyDeaths = 0
for (let seed = 1; seed <= 300; seed += 1) {
  let run = assignQuest(onDay(seed, 9), 'q-d09-iron-convoy', ['F003', 'F004'])
  run = finishDay(finishDay(run).run).run
  assert.ok(run.memorials.length <= 1, 'at most one death per quest')
  convoyDeaths += run.memorials.length
}
assert.ok(convoyDeaths > 0, 'a lethal quest can kill')
assert.ok(
  convoyDeaths < 60,
  `deaths stay rare (${convoyDeaths}/300 weak parties)`,
)

// Day 6's stable is where the court first learns its followers' secrets:
// whichever starter goes alone reveals something.
for (const id of ['F001', 'F002', 'F003', 'F004']) {
  const run = assignQuest(onDay(6, 6), 'q-d06-empty-stable', [id])
  const report = finishDay(run).report.quests.find(
    (quest) => quest.questId === 'q-d06-empty-stable',
  )
  assert.ok(
    report?.revealedTraits.length,
    `${id} reveals a secret at the stable`,
  )
}

// Day 5 has two versions of Vane's audience, never both.
const plainDay5 = audiencesToday(onDay(5, 5)).map((a) => a.id)
assert.ok(
  plainDay5.includes('d05-toll') && !plainDay5.includes('d05-toll-grudge'),
)
const grudgeDay5 = audiencesToday(onDay(5, 5, { flags: ['feast-armed'] })).map(
  (a) => a.id,
)
assert.ok(
  grudgeDay5.includes('d05-toll-grudge') && !grudgeDay5.includes('d05-toll'),
)

// --- barracks and market ----------------------------------------------------
const pip = chooseAudienceOption(
  onDay(5, 4),
  'd04-letter-from-bell',
  'welcome',
).run
assert.ok(pip.roster.some((state) => state.id === 'F005'))
assert.equal(bedsUsed(pip), 5)
const turnedAway = chooseAudienceOption(
  onDay(5, 4),
  'd04-letter-from-bell',
  'turn-away',
).run
assert.ok(turnedAway.recruitable.includes('F005'))
const fullBarracks: FortressRun = {
  ...turnedAway,
  roster: [
    ...turnedAway.roster,
    { id: 'F006', joinedDay: 1, equipment: {} },
    { id: 'F007', joinedDay: 1, equipment: {} },
  ],
}
assert.throws(() => recruit(fullBarracks, 'F005'), /barracks are full/)
const bigger = upgradeBeds(fullBarracks)
assert.equal(bigger.beds, 9)
assert.equal(recruit(bigger, 'F005').roster.length, 7)
assert.throws(() => upgradeBeds(bigger), /gate-watch support 12/)

const shopped = buyItem(start, 'surveyors-glass')
assert.equal(
  shopped.brass,
  120 - (ITEMS.find((i) => i.id === 'surveyors-glass')?.price ?? 0),
)
const equipped = equipItem(shopped, 'F002', 'tool', 'surveyors-glass')
assert.deepEqual(equipped.inventory, [])
assert.throws(
  () => equipItem(equipped, 'F001', 'tool', 'surveyors-glass'),
  /does not own/,
)
assert.throws(
  () => equipItem(shopped, 'F002', 'charm', 'surveyors-glass'),
  /does not fit/,
)
assert.deepEqual(equipItem(equipped, 'F002', 'tool', null).inventory, [
  'surveyors-glass',
])

// --- economy and loans ------------------------------------------------------
const poor = finishDay({ ...start, brass: -30 }).run
assert.equal(poor.loans, 1, 'unpaid wages take a Ledger loan')
assert.ok(poor.brass >= 0)
assert.equal(poor.local.ledger, 7)

// --- act ends, betrayal, hideout --------------------------------------------
const day10: FortressRun = { ...createRun(77), day: 10, board: [], reports: [] }
const day11 = finishDay(day10).run
assert.ok(
  day11.revealedFactions.includes('rustline'),
  'Rustline revealed after Act I',
)
const doomed: FortressRun = {
  ...day10,
  strength: { ...day10.strength, freeholds: 0 },
}
assert.ok(
  finishDay(doomed).run.wipedOut.includes('freeholds'),
  'zero strength is wiped out at act end',
)
const day40: FortressRun = { ...createRun(77), day: 40, board: [], reports: [] }
const fled = finishDay(day40).run
assert.ok(fled.flags.includes('komodo-betrayal'))
assert.equal(fled.hideout, 'nameless-cave', 'no ally: the fallback cave')
const moleFriends: FortressRun = {
  ...day40,
  affinity: { ...day40.affinity, moles: 70, saltroad: 30 },
}
assert.equal(selectHideout(moleFriends), 'mole-tunnels')

// --- audience scenes: beats that branch and always close --------------------
const sceneOptions = (audience: AudienceDef): AudienceOption[] => [
  ...audience.options,
  ...(audience.beats ?? []).flatMap((beat) => beat.options),
]
let sceneCount = 0
for (const def of DAYS) {
  for (const audience of def.audiences) {
    const beats = audience.beats ?? []
    if (beats.length) sceneCount += 1
    const ids = beats.map((beat) => beat.id)
    assert.equal(new Set(ids).size, ids.length, `${audience.id} beat ids`)
    const byId = new Map(beats.map((beat) => [beat.id, beat]))
    for (const group of [audience.options, ...beats.map((b) => b.options)]) {
      assert.ok(group.length >= 1, `${audience.id} every beat can be answered`)
      const optionIds = group.map((option) => option.id)
      assert.equal(new Set(optionIds).size, optionIds.length, audience.id)
    }
    for (const option of sceneOptions(audience)) {
      if (option.next)
        assert.ok(byId.has(option.next), `${audience.id} -> ${option.next}`)
      for (const id of option.postsQuests ?? []) assert.ok(questDef(id), id)
      for (const id of option.effects.recruit ?? [])
        assert.ok(followerDef(id), id)
    }
    // Every beat is reachable, and no path loops back on itself.
    const reached = new Set<string>()
    const walk = (options: AudienceOption[], path: string[]) => {
      for (const option of options) {
        if (!option.next) continue
        assert.ok(
          !path.includes(option.next),
          `${audience.id} loops at ${option.next}`,
        )
        reached.add(option.next)
        walk(byId.get(option.next)!.options, [...path, option.next])
      }
    }
    walk(audience.options, [])
    for (const id of ids) assert.ok(reached.has(id), `${audience.id}/${id}`)
    // Every closing answer has a reply; every line has words in it.
    for (const option of sceneOptions(audience))
      assert.ok(option.response.trim(), `${audience.id}/${option.id} reply`)
    for (const line of [
      ...audience.lines,
      ...beats.flatMap((beat) => beat.lines),
    ])
      assert.ok(
        (typeof line === 'string' ? line : line.text).trim(),
        audience.id,
      )
  }
}
assert.ok(sceneCount >= 3, 'the court holds scenes, not only petitions')
{
  // Story gates hide an answer; brass gates show it locked.
  const run = createRun(99)
  const callback = { id: 'x', label: 'x', effects: {}, response: 'x' }
  assert.ok(!optionVisible(run, { ...callback, requires: { flags: ['nope'] } }))
  assert.ok(
    optionVisible(run, { ...callback, requires: { notFlags: ['nope'] } }),
  )
  assert.ok(
    !optionVisible(run, { ...callback, requires: { follower: 'F020' } }),
  )
  assert.ok(optionVisible(run, { ...callback, requires: { cost: 99999 } }))
  // Every beat keeps at least one answer a player can see.
  for (const def of DAYS)
    for (const audience of def.audiences)
      for (const beat of audience.beats ?? [])
        assert.ok(
          beat.options.some((option) => !option.requires?.flags?.length),
          `${audience.id}/${beat.id} has an answer without a story gate`,
        )
}

{
  // Walk Day 1's first scene: an answer that leads on keeps the audience
  // open, applies its effects at once, and the day's end closes any scene.
  let run = createRun(4242)
  const audience = audiencesToday(run).find((entry) =>
    entry.options.some(
      (option) => option.next && optionBlockers(run, option).length === 0,
    ),
  )!
  assert.ok(audience, 'Day 1 opens with a scene')
  const lead = audience.options.find(
    (option) => option.next && optionBlockers(run, option).length === 0,
  )!
  const step = chooseAudienceOption(run, audience.id, lead.id)
  run = step.run
  assert.equal(step.next, lead.next)
  assert.ok(!run.audiencesHeard.includes(audience.id), 'scene still open')
  assert.equal(run.audienceBeats?.[audience.id], lead.next)
  assert.ok(run.flags.includes(`chose:${audience.id}:${lead.id}`))
  assert.equal(audienceScene(run, audience).beatId, lead.next)
  assert.ok(validateRun(run), 'a run mid-scene saves')
  assert.throws(
    () => chooseAudienceOption(run, audience.id, lead.id),
    /unknown option/,
    'the opening answers are gone once the scene moves on',
  )
  // The day can end mid-scene: the scene closes, its choices stand.
  const ended = finishDay(run).run
  assert.equal(ended.audienceBeats, undefined)
  assert.ok(ended.flags.includes(`chose:${audience.id}:${lead.id}`))
  // Follow the scene to its close.
  for (let i = 0; i < 10 && !run.audiencesHeard.includes(audience.id); i += 1) {
    const option = audienceScene(run, audience).options.find(
      (entry) => optionBlockers(run, entry).length === 0,
    )
    assert.ok(option, `${audience.id} has an open answer at every beat`)
    run = chooseAudienceOption(run, audience.id, option.id).run
  }
  assert.ok(run.audiencesHeard.includes(audience.id), 'the scene closes')
  assert.equal(run.audienceBeats, undefined)
}

// --- a whole campaign, with saves and rewinds --------------------------------
let book = newBook(createRun(31337))
let runs = 0
while (!isOver(book.current)) {
  let run = book.current
  for (const audience of audiencesToday(run)) {
    const option = audience.options.find(
      (o) => optionBlockers(run, o).length === 0,
    )
    if (option) run = chooseAudienceOption(run, audience.id, option.id).run
  }
  for (const entry of [...run.board]) {
    const quest = questDef(entry.questId)!
    const ready = run.roster
      .filter((state) => followerStatus(run, state.id) === 'ready')
      .map((state) => state.id)
    if (quest.mustInclude && !ready.includes(quest.mustInclude)) continue
    const party = [
      ...(quest.mustInclude ? [quest.mustInclude] : []),
      ...ready.filter((id) => id !== quest.mustInclude),
    ].slice(0, quest.party.min)
    if (party.length === quest.party.min)
      run = assignQuest(run, entry.questId, party)
  }
  book = updateCurrent(book, run)
  book = recordDawn(book, finishDay(run).run)
  runs += 1
  assert.ok(validateRun(book.current), `day ${book.current.day} saves cleanly`)
}
assert.equal(runs, LAST_DAY, 'fifty days to the end')
assert.equal(book.dawns.length, LAST_DAY)
assert.throws(() => finishDay(book.current), /over/)
const encoded = encodeBook(book)
assert.deepEqual(decodeBook(encoded), book)
assert.ok(
  encoded.length < 1_000_000,
  `a full campaign save is ${encoded.length} bytes`,
)

const rewound = rewindTo(book, 20)
assert.equal(rewound.current.day, 20)
assert.equal(rewound.dawns.length, 20)
assert.ok(
  rewound.current.branch > book.dawns[19]!.branch,
  'rewind starts a new branch',
)
assert.ok(decodeBook(encodeBook(rewound)), 'rewound book is valid')
// Over many seeds, a rewound dawn sometimes posts different chores.
let differs = 0
for (let seed = 1; seed <= 40; seed += 1) {
  const fresh = newBook(createRun(seed))
  const dawn2 = recordDawn(fresh, finishDay(fresh.current).run)
  const again = rewindTo(dawn2, 2)
  if (
    JSON.stringify(again.current.board.map((b) => b.questId).sort()) !==
    JSON.stringify(dawn2.current.board.map((b) => b.questId).sort())
  )
    differs += 1
}
assert.ok(differs > 0, 'rewinding re-rolls seeded events')
assert.throws(() => rewindTo(rewound, 30), /no dawn/)

// Malformed saves are rejected rather than half-loaded.
assert.equal(decodeBook(null), null)
assert.equal(decodeBook('{nope'), null)
const tampered = JSON.parse(encoded)
tampered.current.roster[0].id = 'F999'
assert.equal(decodeBook(JSON.stringify(tampered)), null)
const doubleBooked = JSON.parse(encodeBook(newBook(sent)))
doubleBooked.current.active.push({
  ...doubleBooked.current.active[0],
  questId: 'q-d01-well-road',
})
assert.equal(
  decodeBook(JSON.stringify(doubleBooked)),
  null,
  'double-booked saves are rejected',
)
const horde = JSON.parse(encodeBook(newBook(start)))
horde.current.local.ledger = 99
assert.equal(decodeBook(JSON.stringify(horde)), null)
const slot = encodeSlot(
  '  Before the feast  ',
  newBook(start),
  new Date('2026-10-18T00:00:00Z'),
)
assert.equal(decodeSlot(slot)?.label, 'Before the feast')
assert.equal(decodeSlot(slot.replace('"version":3', '"version":2')), null)

// Effects stay bounded.
const bounded = createRun(1)
applyEffects(bounded, { local: { yard: -50 }, affinity: { abbey: 500 } })
assert.equal(bounded.local.yard, 0)
assert.equal(bounded.affinity.abbey, 100)
assert.ok(
  bounded.flags.includes('crisis:yard'),
  'an emptied local faction raises a crisis',
)

// Items of Power: earned by story flags, kept in a vault outside the run.
const vault = emptyRelicVault()
const plain = createRun(3)
assert.deepEqual(claimableRelics(plain, vault), [])
assert.throws(() => acquireRelic(vault, plain, 'eye-of-elder-crow'), /earned/)
const earned = { ...plain, flags: ['relic-eye-earned'] }
const owned = acquireRelic(vault, earned, 'eye-of-elder-crow')
assert.deepEqual(claimableRelics(earned, owned), [])
const loadout = chooseNextLoadout(owned, ['eye-of-elder-crow'])
assert.deepEqual(decodeRelicVault(encodeRelicVault(loadout)), loadout)
assert.throws(
  () => chooseNextLoadout(owned, ['komodo-brass-hourglass']),
  /collected/,
)
assert.equal(decodeRelicVault('{"version":1,"owned":["nope"]}'), null)
const seeing = createRun(3, loadout.nextLoadout)
assert.equal(eyeReveals(seeing, false), true, 'the Eye marks the lie')
assert.equal(eyeReveals(seeing, true), false)
assert.equal(eyeReveals(plain, false), false, 'no Eye, no reveal')

// --- the late cast's abilities ---------------------------------------------
const withCast = (seed: number, day: number, ids: string[]): FortressRun =>
  onDay(seed, day, {
    roster: ids.map((id) => ({ id, joinedDay: 1, equipment: {} })),
  })
// Last Wall: the Day 9 lethal convoy never kills while Mags is along.
let wardedDeaths = 0
for (let seed = 1; seed <= 300; seed += 1) {
  let run = withCast(seed, 9, ['F003', 'F013'])
  run = assignQuest(run, 'q-d09-iron-convoy', ['F003', 'F013'])
  run = finishDay(finishDay(run).run).run
  wardedDeaths += run.memorials.length
}
assert.equal(wardedDeaths, 0, 'Last Wall: nobody dies with Mags')
// Cave-Luck: the preview shows the two-roll odds, and play matches them.
const luckPreview = previewQuest(withCast(1, 3, ['F011']), 'q-d03-toll-audit', [
  'F011',
])
let luckyWins = 0
for (let seed = 1; seed <= 400; seed += 1) {
  const tier = finishDay(
    assignQuest(withCast(seed, 3, ['F011']), 'q-d03-toll-audit', ['F011']),
  ).report.quests.find((q) => q.questId === 'q-d03-toll-audit')?.tier
  if (tier === 'success' || tier === 'triumph') luckyWins += 1
}
assert.ok(
  Math.abs((luckyWins / 400) * 100 - luckPreview.chance) <= 8,
  `Cave-Luck odds are honest (${luckPreview.chance}% shown, ${luckyWins / 4}% played)`,
)
// Heeded Omens: Isolde's quests never end in outright failure.
for (let seed = 1; seed <= 200; seed += 1) {
  let run = withCast(seed, 3, ['F015'])
  run = chooseAudienceOption(run, 'd03-fen-lanterns', 'ambush').run
  run = assignQuest(
    {
      ...run,
      roster: [...run.roster, { id: 'F017', joinedDay: 1, equipment: {} }],
    },
    'q-d03-fen-ambush',
    ['F015', 'F017'],
  )
  const tier = finishDay(run).report.quests.find(
    (q) => q.questId === 'q-d03-fen-ambush',
  )?.tier
  assert.notEqual(tier, 'failure', 'Heeded Omens turns failure into partial')
}
// Salvage Rights and Second Helpings pay out on success.
let pellBrass = 0
let juniperYard = 0
for (let seed = 1; seed <= 60; seed += 1) {
  const base = withCast(seed, 1, ['F014', 'F020'])
  const pell = finishDay(assignQuest(base, 'q-d01-well-road', ['F014'])).report
  const won = pell.quests.find((q) => q.questId === 'q-d01-well-road')
  if (won?.tier === 'success' || won?.tier === 'triumph')
    pellBrass += won.effects.brass ?? 0
  const juniper = finishDay(
    assignQuest(base, 'q-d01-well-road', ['F020']),
  ).report.quests.find((q) => q.questId === 'q-d01-well-road')
  if (juniper?.tier === 'success' || juniper?.tier === 'triumph')
    juniperYard += juniper.effects.local?.yard ?? 0
}
assert.ok(pellBrass >= 25 * 10, 'Salvage Rights adds 15 brass per success')
assert.ok(juniperYard >= 3 * 10, 'Second Helpings warms the Yard by 2')
// Confessor: a successful quest with Teodor reveals a companion's secret.
let confessed = false
for (let seed = 1; seed <= 40 && !confessed; seed += 1) {
  const run = withCast(seed, 1, ['F012', 'F004'])
  const report = finishDay(
    assignQuest(run, 'q-d01-well-road', ['F012', 'F004']),
  ).report.quests.find((q) => q.questId === 'q-d01-well-road')
  if (report?.tier === 'success' || report?.tier === 'triumph') {
    assert.ok(
      report.revealedTraits.some((id) => id.startsWith('F004')),
      'Confessor reveals Flint’s secret',
    )
    assert.ok(!report.revealedTraits.some((id) => id.startsWith('F012')))
    confessed = true
  }
}
assert.ok(confessed)
// Old Maps: after Hollin's quest the board's hidden requirements are known.
const mapRun = chooseAudienceOption(
  withCast(2, 1, ['F019', 'F003']),
  'd01-mirefen',
  'question',
).run
const afterMaps = finishDay(
  assignQuest(mapRun, 'q-d01-well-road', ['F019']),
).run
assert.ok(
  afterMaps.flags.includes('scouted:q-d01-mirefen-inspect'),
  'Old Maps scouts the board',
)
// Thick Hide: Cobb's own injuries are halved; Immaculate Apology halves losses.
let cobbDays = 0
let flintDays = 0
for (let seed = 1; seed <= 200; seed += 1) {
  const run = withCast(seed, 3, ['F017', 'F004'])
  const posted = chooseAudienceOption(run, 'd03-fen-lanterns', 'ambush').run
  const report = finishDay(
    assignQuest(posted, 'q-d03-fen-ambush', ['F017', 'F004']),
  ).report.quests[0]
  for (const injury of report?.injuries ?? [])
    if (injury.followerId === 'F017') cobbDays += injury.days
    else flintDays += injury.days
}
assert.ok(
  cobbDays < flintDays,
  `Thick Hide heals faster (${cobbDays} vs ${flintDays})`,
)
let sableLoss = 0
let plainLoss = 0
for (let seed = 1; seed <= 200; seed += 1) {
  for (const [id, add] of [
    ['F016', (n: number) => (sableLoss += n)],
    ['F017', (n: number) => (plainLoss += n)],
  ] as const) {
    const run = chooseAudienceOption(
      withCast(seed, 3, [id]),
      'd03-fen-lanterns',
      'hail',
    ).run
    const report = finishDay(
      assignQuest(run, 'q-d03-fen-hail', [id]),
    ).report.quests.find((q) => q.questId === 'q-d03-fen-hail')
    if (report?.tier === 'failure')
      add(-(report.effects.affinity?.['mire-mothers'] ?? 0))
  }
}
assert.ok(sableLoss <= plainLoss, 'Immaculate Apology softens failures')

// --- recruitment routes in Act I ----------------------------------------------
const recruits = (
  day: number,
  audienceId: string,
  optionId: string,
  run?: FortressRun,
) =>
  chooseAudienceOption(run ?? onDay(1, day), audienceId, optionId).run
    .recruitable
assert.ok(
  recruits(5, 'd05-flour', 'buy').includes('F008'),
  'Bram after the flour',
)
assert.ok(
  recruits(7, 'd07-crow-warning', 'errand').includes('F011'),
  'Tamsin with the parcel',
)
assert.ok(
  recruits(8, 'd08-family', 'escort').includes('F012'),
  'Teodor stays behind',
)
assert.ok(
  !recruits(8, 'd08-family', 'abbey').includes('F012'),
  'Teodor leaves with the Abbey if the children go',
)
assert.ok(
  recruits(10, 'd10-oath', 'care').includes('F013'),
  'Mags after the oath',
)
const kitchens = audiencesToday(
  onDay(1, 9, { local: { ...createRun(1).local, yard: 12 } }),
)
assert.ok(
  kitchens.some((a) => a.id === 'd09-kitchens'),
  'Juniper when the Yard is warm',
)
assert.ok(
  !audiencesToday(onDay(1, 9)).some((a) => a.id === 'd09-kitchens'),
  'Juniper waits for Yard support',
)
for (let seed = 1; seed <= 5; seed += 1) {
  const after = finishDay(onDay(seed, 10)).run
  assert.ok(
    after.recruitable.includes('F017'),
    'Cobb comes whatever befalls Thistledown',
  )
}

// --- Act II ------------------------------------------------------------------
// Saffron's water engine is her own quest.
const engineDay = withCast(4, 13, ['F001', 'F002'])
const offered = chooseAudienceOption(engineDay, 'd13-saffron-deal', 'lend').run
assert.throws(
  () => assignQuest(offered, 'q-d13-water-engine', ['F001']),
  /Saffron Kett must go/,
)
assert.ok(assignQuest(offered, 'q-d13-water-engine', ['F002']))
assert.ok(
  !audiencesToday(withCast(4, 13, ['F001'])).some(
    (a) => a.id === 'd13-saffron-deal',
  ),
  'no Saffron, no Saffron deal',
)
// Both early Items of Power have a story route in Act II.
const rewardFlags = (questId: string) =>
  ACT_TWO_QUESTS.find((q) => q.id === questId)?.rewards.success.flags ?? []
assert.ok(rewardFlags('q-d14-sick-courier').includes('relic-hourglass-earned'))
assert.ok(rewardFlags('q-d17-who-lies').includes('relic-eye-earned'))
// Tamsin's reading of the covenant reveals her hidden allegiance.
const covenantDay = withCast(4, 11, ['F001', 'F011'])
const read = chooseAudienceOption(covenantDay, 'd11-rainmaker', 'tamsin').run
const bond = followerDef('F011')!.traits.find((t) => t.kind === 'allegiance')!
assert.ok(traitKnown(read, bond, []), 'the covenant reading reveals Tamsin')
// Act II recruitment: Ash, Pell, Isolde, Vesper and Hollin.
const recruitedBy = (
  questId: string,
  tier: 'success' | 'triumph' = 'success',
) =>
  ACT_TWO_QUESTS.find((q) => q.id === questId)?.rewards[tier]?.recruitable ?? []
assert.ok(
  recruitedBy('q-d14-sick-courier').includes('F007'),
  'Ash, the courier',
)
assert.ok(
  recruitedBy('q-d15-study-glass').includes('F014'),
  'Pell, the salvager',
)
assert.ok(
  recruitedBy('q-d12-mirefen-defense').includes('F015'),
  'Isolde, the witch',
)
assert.ok(
  chooseAudienceOption(
    { ...onDay(1, 18), brass: 100 },
    'd18-fair',
    'host',
  ).run.recruitable.includes('F018'),
  'Vesper, the fire-juggler',
)
const archive = onDay(1, 14, {
  local: { ...createRun(1).local, lamplight: 12 },
})
assert.ok(
  chooseAudienceOption(
    archive,
    'd14-hollin',
    'welcome',
  ).run.recruitable.includes('F019'),
  'Hollin, when the Archive is warm',
)
// The covenant comes due only if it was signed.
assert.ok(
  !audiencesToday(onDay(1, 20)).some((a) => a.id === 'd20-covenant-due'),
)
assert.ok(
  audiencesToday(onDay(1, 20, { flags: ['rain-covenant'] })).some(
    (a) => a.id === 'd20-covenant-due',
  ),
)

// The court seen at dawn stays all day: answering one petition never sends
// another away, even if it changes what that petitioner needs.
const flourDay = onDay(1, 9, { local: { ...createRun(1).local, yard: 12 } })
assert.ok(audiencesToday(flourDay).some((a) => a.id === 'd09-kitchens'))
const colderYard = { ...flourDay, local: { ...flourDay.local, yard: 3 } }
assert.ok(
  audiencesToday(colderYard).some((a) => a.id === 'd09-kitchens'),
  'Juniper stays for the day even if the Yard cools',
)

// --- Act III -----------------------------------------------------------------
// Keel comes only after genuine talks with the Moles.
assert.ok(
  !audiencesToday(onDay(1, 26)).some((a) => a.id === 'd26-mole-truce'),
  'no truce without talks',
)
const truceDay = onDay(1, 26, {
  flags: ['mole-talks-opened'],
  affinity: { ...createRun(1).affinity, moles: 0 },
})
assert.ok(
  chooseAudienceOption(
    truceDay,
    'd26-mole-truce',
    'truce',
  ).run.recruitable.includes('F009'),
  'Keel joins after the truce',
)
// Sable asks for sanctuary on Day 28, beside the envoy who wants them back.
const verge = onDay(1, 28)
assert.ok(
  chooseAudienceOption(
    verge,
    'd28-defector',
    'sanctuary',
  ).run.recruitable.includes('F016'),
)
assert.ok(
  !chooseAudienceOption(
    verge,
    'd28-defector',
    'return',
  ).run.recruitable.includes('F016'),
)
// Giving the Coldbrook children away on Day 8 comes back on Day 24.
assert.ok(!audiencesToday(onDay(1, 24)).some((a) => a.id === 'd24-coldbrook'))
assert.ok(
  audiencesToday(
    onDay(1, 24, { flags: ['abbey-took-coldbrook-children'] }),
  ).some((a) => a.id === 'd24-coldbrook'),
  'Wenna comes back for her children',
)
// Flint's trial needs Flint; Pip's reading reveals Pip's allegiance.
assert.ok(
  !audiencesToday(withCast(1, 27, ['F001'])).some((a) => a.id === 'd27-trial'),
)
const pipRead = chooseAudienceOption(
  withCast(1, 29, ['F001', 'F005']),
  'd29-mayors-secret',
  'pip',
).run
const page = followerDef('F005')!.traits.find((t) => t.kind === 'allegiance')!
assert.ok(
  traitKnown(pipRead, page, []),
  'Pip’s reading reveals the replaced page',
)
// Komodo lies four times by the end of Act III, each one his own, and three
// more in Act IV as the betrayal nears (Days 32, 37 and 40).
const komodoLies = (days: typeof DAYS) =>
  days.flatMap((def) => def.briefings).filter((b) => b.komodoLie).length
assert.equal(komodoLies(DAYS.filter((def) => def.day <= 30)), 4)
assert.equal(komodoLies(DAYS), 7)

// Under the Wall: Keel's Wits count toward Might requirements.
const keel = followerDef('F009')!
const wellRoad = questDef('q-d01-well-road')!
const dug = previewQuest(withCast(1, 1, ['F009']), 'q-d01-well-road', ['F009'])
assert.equal(
  dug.perRequirement[0]?.total,
  keel.stats.might +
    keel.stats.wits +
    (wellRoad.faction ? (keel.factionModifiers[wellRoad.faction] ?? 0) : 0),
)
// Many Hands: Lumen joins a party that is already full.
const crowded = withCast(1, 1, ['F001', 'F002', 'F004', 'F010'])
assert.equal(partyLimit(wellRoad, ['F001', 'F010']), wellRoad.party.max + 1)
const withLumen = assignQuest(crowded, 'q-d01-well-road', [
  'F001',
  'F002',
  'F010',
])
assert.ok(validateRun(withLumen), 'a Many Hands party still saves')
assert.throws(
  () => assignQuest(crowded, 'q-d01-well-road', ['F001', 'F002', 'F004']),
  /1-2 followers/,
)
// Stalling Letters: Ash buys one expiring quest a single extra day.
const stalling = onDay(1, 1, {
  roster: [{ id: 'F007', joinedDay: 1, equipment: {} }],
  board: [{ questId: 'q-d01-toll-parley', postedDay: 1, lastDay: 1 }],
})
const stalledNight = finishDay(stalling)
assert.equal(
  stalledNight.run.board.find((e) => e.questId === 'q-d01-toll-parley')
    ?.lastDay,
  2,
)
assert.ok(stalledNight.report.events.some((e) => e.includes('Ash Quill')))
const secondNight = finishDay(stalledNight.run)
assert.ok(
  secondNight.report.quests.some(
    (q) => q.questId === 'q-d01-toll-parley' && q.tier === 'expired',
  ),
  'only once per quest',
)
assert.ok(
  finishDay({ ...stalling, roster: [] }).report.quests.some(
    (q) => q.questId === 'q-d01-toll-parley' && q.tier === 'expired',
  ),
  'without Ash it expires on time',
)
// Hot Meals First: Bram at home heals the wounded a day faster.
const sore = (ids: string[]) =>
  onDay(1, 5, {
    roster: [
      ...ids.map((id) => ({ id, joinedDay: 1, equipment: {} })),
      { id: 'F001', joinedDay: 1, injuredUntilDay: 9, equipment: {} },
    ],
  })
assert.equal(injuryDaysLeft(finishDay(sore(['F008'])).run, 'F001'), 2)
assert.equal(injuryDaysLeft(finishDay(sore([])).run, 'F001'), 3)
// Reads the Wind: Nera marks the false briefing, but not Komodo's own lie.
const marks = (day: number, ids: string[]) =>
  DAYS.find((def) => def.day === day)!.briefings.map((b) =>
    forecastMark(withCast(1, day, ids), b),
  )
assert.deepEqual(marks(1, ['F006']), [null, 'false', null])
assert.deepEqual(marks(7, ['F006']), [null, 'unreadable', null])
assert.deepEqual(marks(1, ['F001']), [null, null, null])

// Cast art: every listed image exists and names a real character and slot.
for (const asset of CAST_ART) {
  const [group, slug, kind, state] = asset.split('/')
  assert.ok(
    existsSync(`public/emperor-of-dust/cast/${asset}.webp`),
    `${asset} has its file`,
  )
  assert.ok(
    group === 'followers' ? !!followerDef(slug ?? '') : !!npcDef(slug ?? ''),
    `${asset} names a cast member`,
  )
  const slots =
    kind === 'portrait'
      ? ['neutral', 'injured', 'dead']
      : ['neutral', 'happy', 'excited', 'sad', 'angry', 'betrayal']
  assert.ok(
    (kind === 'illustrated' ||
      (kind === 'portrait' && group === 'followers')) &&
      slots.includes(state ?? ''),
    `${asset} is a known image slot`,
  )
}
assert.equal(castArtUrl('followers/F999/illustrated/neutral'), undefined)
// Every cast member has their neutral art; followers have a neutral portrait too.
for (const def of FOLLOWERS) {
  assert.ok(castArtUrl(`followers/${def.id}/illustrated/neutral`), def.id)
  assert.ok(castArtUrl(`followers/${def.id}/portrait/neutral`), def.id)
}
for (const def of NPCS)
  assert.ok(castArtUrl(`npcs/${def.slug}/illustrated/neutral`), def.slug)
assert.ok(castArtUrl('npcs/young-komodo/illustrated/betrayal'))
// The full t-012 set: 20 followers x 8 images, 17 NPCs x 5 moods, the betrayal.
assert.equal(CAST_ART.length, 20 * 8 + 17 * 5 + 1)
// An NPC's reaction follows their faction's change in support.
assert.equal(reactionMood({ affinity: { moles: 10 } }, 'moles'), 'excited')
assert.equal(reactionMood({ local: { lamplight: 2 } }, 'lamplight'), 'happy')
assert.equal(reactionMood({ affinity: { moles: -3 } }, 'moles'), 'sad')
assert.equal(reactionMood({ affinity: { moles: -15 } }, 'moles'), 'angry')
assert.equal(reactionMood({ affinity: { saltroad: 20 } }, 'moles'), 'neutral')
assert.equal(reactionMood({ brass: 50 }), 'neutral')
// The map room's illustrated base map and every region's marker on it.
assert.ok(existsSync('public/emperor-of-dust/map/wasteland.webp'))
for (const region of REGIONS) {
  assert.ok(
    region.x > 0 && region.x < 100 && region.y > 0 && region.y < 100,
    `${region.id} sits on the map`,
  )
}

// Every quest happens somewhere on the map.
for (const quest of [
  ...ACT_ONE_QUESTS,
  ...ACT_ONE_LATE_QUESTS,
  ...ACT_TWO_QUESTS,
  ...ACT_THREE_QUESTS,
  ...ACT_FOUR_QUESTS,
  ...ACT_FIVE_QUESTS,
])
  assert.ok(
    REGIONS.some((region) => region.id === quest.region),
    `${quest.id} is on the map`,
  )

// --- Act IV: the long table --------------------------------------------------
// Day 31's war quest and Day 36's Abbey cellar are lethal.
assert.ok(questDef('q-d31-iron-rain')!.lethal)
assert.ok(questDef('q-d36-bell-rehearsal')!.lethal)
// Wolves at Noon posts both defences at dawn, and both leave the board that day.
const noon = onDay(1, 33)
for (const id of ['q-d33-thistledown', 'q-d33-waystation'])
  assert.ok(
    noon.board.some((entry) => entry.questId === id && entry.lastDay === 33),
    id,
  )
// Two Bridges: the court holds one route, and Saffron picks hers if present.
const tunnel = chooseAudienceOption(onDay(1, 35), 'd35-two-bridges', 'tunnel')
assert.ok(tunnel.run.board.some((entry) => entry.questId === 'q-d35-tunnel'))
assert.ok(!tunnel.run.board.some((entry) => entry.questId === 'q-d35-trestle'))
const saffronChoice = DAYS.find(
  (def) => def.day === 35,
)!.audiences[0]!.options.find((option) => option.id === 'saffron')!
assert.ok(
  optionBlockers(withCast(1, 35, ['F001']), saffronChoice).length,
  'only Saffron herself can choose for Saffron',
)
assert.equal(optionBlockers(withCast(1, 35, ['F002']), saffronChoice).length, 0)
// Komodo's clues: the prisoner he questions escapes; the ledger page he takes
// is never seen again; the Archive only asks to evacuate if it kept the page.
const questioned = chooseAudienceOption(onDay(1, 38), 'd38-pardon', 'komodo')
assert.ok(questioned.run.flags.includes('prisoner-to-komodo'))
assert.ok(
  !audiencesToday(onDay(1, 40)).some((a) => a.id === 'd40-archive'),
  'no page, no warning',
)
assert.ok(
  audiencesToday(onDay(1, 40, { flags: ['ledger-page-kept'] })).some(
    (a) => a.id === 'd40-archive',
  ),
  'the Keeper who kept the page asks to move the books',
)
// Komodo speaks for himself on his last day, and the betrayal still comes at dawn.
assert.ok(
  DAYS.find((def) => def.day === 40)!.audiences.some(
    (a) => a.npc === 'young-komodo',
  ),
)
const lastNight = chooseAudienceOption(
  onDay(1, 40),
  'd40-quiet-word',
  'leave',
).run
assert.ok(finishDay(lastNight).run.flags.includes('komodo-betrayal'))

// --- Act V: the hideout and the endings ------------------------------------
// Keeper Vellum gives the briefings once Komodo has gone.
for (const def of DAYS)
  assert.equal(
    def.advisor?.npc,
    def.day > 40 ? 'abelard-vellum' : undefined,
    `day ${def.day} advisor`,
  )
// The betrayal names the hideout as a flag, and Day 42 seats exactly one host.
const hideouts = [
  'mole-tunnels',
  'crow-cave',
  'bell-cellars',
  'wagon-circle',
  'moving-caravan',
  'freehold-barn',
  'rail-station',
  'nameless-cave',
]
for (const hideout of hideouts) {
  const terms = audiencesToday(
    onDay(1, 42, { hideout, flags: [`hideout:${hideout}`] }),
  ).filter((a) => a.id.startsWith('d42-terms-'))
  assert.deepEqual(
    terms.map((a) => a.id),
    [`d42-terms-${hideout}`],
    hideout,
  )
  const accepted = chooseAudienceOption(
    onDay(1, 42, { hideout, flags: [`hideout:${hideout}`] }),
    terms[0]!.id,
    'accept',
  ).run
  const hostQuest = terms[0]!.options[0]!.postsQuests![0]!
  assert.ok(
    accepted.board.some((entry) => entry.questId === hostQuest),
    `${hideout} posts its host quest`,
  )
}
const betrayed = finishDay(
  chooseAudienceOption(onDay(1, 40), 'd40-quiet-word', 'leave').run,
).run
assert.ok(betrayed.hideout)
assert.ok(betrayed.flags.includes(`hideout:${betrayed.hideout}`))
// Day 50: the front door is always posted; the well and the bell are earned.
const lastDay = onDay(1, 50)
assert.ok(
  lastDay.board.some((entry) => entry.questId === 'q-d50-last-dispatch'),
)
assert.ok(questDef('q-d50-last-dispatch')!.lethal)
const roads = DAYS.find((def) => def.day === 50)!.audiences[0]!
for (const [id, flag] of [
  ['well', 'crypt-path-found'],
  ['bell', 'clapper-recovered'],
] as const) {
  const option = roads.options.find((entry) => entry.id === id)!
  assert.ok(optionBlockers(lastDay, option).length, `${id} must be earned`)
  assert.equal(
    optionBlockers(onDay(1, 50, { flags: [flag] }), option).length,
    0,
  )
}
// Every ending family is reachable, and losing the door outranks the peace.
const ended = (flags: string[], deaths = 0): string =>
  endingOf({
    ...createRun(1),
    day: LAST_DAY + 1,
    flags,
    memorials: Array.from({ length: deaths }, (_, i) => ({
      followerId: `F00${i + 1}`,
      questId: 'q-d50-last-dispatch',
      day: 50,
    })),
  }).id
assert.equal(ended(['peace-bell']), 'long-night', 'an open door is the end')
assert.equal(ended(['horror-sealed']), 'open-roads')
assert.equal(ended(['horror-sealed', 'peace-roads']), 'open-roads')
assert.equal(ended(['horror-sealed', 'peace-bell']), 'bell-restored')
assert.equal(ended(['horror-sealed', 'peace-iron']), 'iron-peace')
assert.equal(ended(['horror-sealed', 'peace-crows']), 'crows-bargain')
assert.equal(ended(['horror-sealed', 'peace-witchwater']), 'witchwater-throne')
assert.equal(ended(['horror-sealed', 'peace-tunnels']), 'tunnels-and-councils')
assert.equal(ended(['horror-sealed', 'peace-tunnels'], 3), 'hundred-candles')
assert.equal(ended(['horror-sealed', 'horror-wakes']), 'open-roads')
assert.equal(Object.keys(ENDINGS).length, 8, 'eight ending families')
// Each Day 49 peace sets exactly the flag its ending reads.
const peaceFlags = DAYS.find(
  (def) => def.day === 49,
)!.audiences[0]!.options.flatMap((option) => option.effects.flags ?? [])
assert.deepEqual([...peaceFlags].sort(), [
  'peace-bell',
  'peace-crows',
  'peace-iron',
  'peace-roads',
  'peace-tunnels',
  'peace-witchwater',
])

// --- t-009 balance mechanics ------------------------------------------------
// Pledges are real story flags, each set by some choice or quest.
const setFlags = new Set([
  ...DAYS.flatMap((def) =>
    def.audiences.flatMap((a) =>
      a.options.flatMap((o) => o.effects.flags ?? []),
    ),
  ),
  ...[
    ...ACT_ONE_QUESTS,
    ...ACT_ONE_LATE_QUESTS,
    ...ACT_TWO_QUESTS,
    ...ACT_THREE_QUESTS,
    ...ACT_FOUR_QUESTS,
    ...ACT_FIVE_QUESTS,
  ].flatMap((q) =>
    [q.rewards.triumph, q.rewards.success, q.rewards.partial].flatMap(
      (effects) => effects?.flags ?? [],
    ),
  ),
])
for (const [faction, flags] of Object.entries(PLEDGES))
  for (const flag of flags ?? [])
    assert.ok(setFlags.has(flag), `${faction} pledge ${flag} is earnable`)
// The coalition the crown chose outweighs the farms next door.
const courted: FortressRun = {
  ...createRun(1),
  day: 41,
  revealedFactions: [...KINGDOM_FACTIONS],
  affinity: { ...createRun(1).affinity, freeholds: 100, rustline: 60 },
  flags: ['blue-lantern-route', 'rustline-barricades', 'rustline-market'],
}
assert.equal(selectHideout(courted), 'rail-station')
assert.equal(
  selectHideout({ ...courted, flags: [] }),
  'freehold-barn',
  'without pledges, the highest affinity hosts',
)
// Every kingdom faction with a host or a peace has chores, and a fogged
// faction's chores wait for its banner.
for (const faction of [
  'moles',
  'storm-crows',
  'hollow-bell',
  'jackalwire',
  'saltroad',
  'freeholds',
  'rustline',
  'mire-mothers',
])
  assert.ok(
    QUEST_TEMPLATES.some((q) => q.faction === faction),
    `${faction} has a chore`,
  )
for (let seed = 1; seed <= 60; seed += 1)
  assert.ok(
    !onDay(seed, 5).board.some((entry) =>
      entry.questId.startsWith('r-salvage-claim@'),
    ),
    'no Rustline chores before the fog lifts',
  )
assert.ok(
  Array.from({ length: 60 }, (_, i) =>
    onDay(i + 1, 12, {
      revealedFactions: [...createRun(1).revealedFactions, 'rustline'],
    }),
  ).some((run) =>
    run.board.some((entry) => entry.questId.startsWith('r-salvage-claim@')),
  ),
  'Rustline chores once its banner is up',
)

// The barracks wears each follower's last homecoming for a day.
const homecoming = (tier: 'triumph' | 'success' | 'failure', day: number) =>
  withCast(1, 12, ['F001']).reports.concat({
    day,
    quests: [
      {
        questId: 'q-d01-well-road',
        tier,
        party: ['F001'],
        chance: 50,
        roll: 10,
        injuries: [],
        deaths: [],
        revealedTraits: [],
        effects: {},
      },
    ],
    taxes: 0,
    wages: 0,
    loanTaken: false,
    events: [],
  })
const moodAfter = (tier: 'triumph' | 'success' | 'failure', day = 12) =>
  followerMood(
    { ...withCast(1, 12, ['F001']), reports: homecoming(tier, day) },
    'F001',
  )
assert.equal(moodAfter('triumph'), 'excited')
assert.equal(moodAfter('success'), 'happy')
assert.equal(moodAfter('failure'), 'angry')
assert.equal(moodAfter('triumph', 9), 'neutral', 'the glow fades')
assert.equal(
  followerMood(
    {
      ...withCast(1, 12, ['F001']),
      roster: [
        { id: 'F001', joinedDay: 1, injuredUntilDay: 14, equipment: {} },
      ],
    },
    'F001',
  ),
  'sad',
)
// Every advisor has a face at the briefing.
for (const def of DAYS)
  assert.ok(
    castArtUrl(
      `npcs/${def.advisor?.npc ?? 'young-komodo'}/illustrated/neutral`,
    ),
    `day ${def.day} advisor art`,
  )

console.log('Emperor of Dust fortress contract: ok')
