import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { ACT_ONE_DAYS, ACT_ONE_QUESTS } from '../emperorOfDust/fortress/actOne'
import { ACT_ONE_LATE_QUESTS } from '../emperorOfDust/fortress/actOneLate'
import { ACT_TWO_QUESTS } from '../emperorOfDust/fortress/actTwo'
import { ACT_THREE_QUESTS } from '../emperorOfDust/fortress/actThree'
import { ACT_FOUR_QUESTS } from '../emperorOfDust/fortress/actFour'
import {
  ACT_FIVE_QUESTS,
  FINALE_AID,
  HOST_COLLECT_DAY,
  HOST_DEMAND,
} from '../emperorOfDust/fortress/actFive'
import { lawsInForce } from '../emperorOfDust/fortress/laws'
import {
  ENDINGS,
  type EndingId,
  candlesLine,
  endingOf,
} from '../emperorOfDust/fortress/endings'
import {
  MOLE_CONCESSIONS,
  MOLE_GRIEVANCES,
  MOLE_LEADERS,
  MOLE_REFORMS_OPEN,
  moleAccord,
} from '../emperorOfDust/fortress/moles'
import {
  DAYS,
  DUES,
  LAST_DAY,
  QUEST_TEMPLATES,
  dueDef,
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
  briefingMapLine,
  crisisLine,
  pendingDues,
  questOutcomeText,
  sceneLines,
  chooseAudienceOption,
  chooseTalkOption,
  createRun as createUnrecruitedRun,
  earnFlag,
  dailyIncome,
  dailyTaxes,
  dailyWages,
  equipItem,
  challengeRumour,
  finishDay,
  followerMood,
  followerStatus,
  forecastMark,
  injuryDaysLeft,
  isOver,
  lineText,
  mapWarnings,
  optionBlockers,
  optionVisible,
  partyLimit,
  postDawnQuests,
  previewQuest,
  recruit,
  regionHolder,
  regionTax,
  selectHideout,
  hideoutForecast,
  talkFor,
  talkScene,
  talkedToday,
  threatsFor,
  traitKnown,
  unmetRequirements,
  START_BRASS,
  upgradeBeds,
  withdrawQuest,
  LAMPLIGHT_SIGHT,
  tierOdds,
  ACT_NEED_SCALE,
  CHANCE_AT_NEED,
  CHORE_POSTINGS,
  LETHAL_BLOW,
  LETHAL_NEED_SCALE,
  bandNeed,
  injuryRisk,
  choreOpen,
  chorePostings,
  lethalScaled,
} from '../emperorOfDust/fortress/engine'
import {
  dangerLine,
  effectLines,
  expiryInfo,
  optionStakes,
  partyModifiers,
  rewardLines,
  sendWarnings,
} from '../emperorOfDust/fortress/board'
import {
  CODEX_SIZE,
  allegiancesKnown,
  codexPages,
  howLearned,
  isCodexId,
  revealLine,
} from '../emperorOfDust/fortress/codex'
import {
  FOLLOWERS,
  ITEMS,
  followerDef,
} from '../emperorOfDust/fortress/followers'
import { ITEM_ICONS, itemDef, itemIcon } from '../emperorOfDust/fortress/items'
import {
  BETRAYAL_DAY,
  BUYERS,
  BUYER_IDS,
  CAVE_SHARE,
  GUARDED_FLOOR,
  PRECAUTIONS,
  VERGE_PEACE,
  departureCap,
  stayedLine,
  towerTalks,
  DEPARTURE_LINES,
  FALL_OPENING,
  HIDEOUT_HOST,
  HIDEOUT_NAMES,
  HIDEOUT_WAGE,
  MAX_DEPARTURES,
  MIN_LEFT,
  OLD_HOUSES_LOST,
  VERGE_SLIGHTS,
  buyerOf,
  departedFollowers,
  departureCheck,
  fallText,
  hostShare,
  selectBuyer,
  selectDepartures,
  storyHeard,
  COURTING_FROM_DAY,
  KIN_FALL,
  komodoCourtingLine,
  komodoCourts,
  peopleBroken,
} from '../emperorOfDust/fortress/betrayal'
import {
  MIN_STOCK,
  POULTICE_PRICE,
  SURGEON_BASE,
  SURGEON_PER_DAY,
  boughtThisWindow,
  buyItem,
  effectReactions,
  isPeddler,
  itemEffects,
  marketStock,
  marketWindow,
  nextRestockDay,
  poulticeOffered,
  saltroadMedicine,
  sellItem,
  sellPrice,
  stallLines,
  stockBlocker,
  surgeonPrice,
  treatFollower,
  treatmentBlocker,
} from '../emperorOfDust/fortress/market'
import { ACT_END_DAWNS, REGIONS } from '../emperorOfDust/fortress/factions'
import { EPILOGUE, epilogueFor } from '../emperorOfDust/fortress/epilogue'
import { TALKS } from '../emperorOfDust/fortress/talks'
import { TIP_INSET, tipShift } from '../emperorOfDust/fortress/tipFit'
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
import type { SaveBook } from '../emperorOfDust/fortress/saves'
import { POLICIES, playCampaign } from '../emperorOfDust/fortress/balance'
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
  BETRAYAL_FLAG,
  dayBriefings,
  dayLines,
  FIRST_BELL_TRUTHS,
  FIRST_BELL_LIES,
  komodoLiesInHindsight,
  RUMOUR_BOUNTY,
  rumourPrompt,
  rumourTally,
  rumourVerdict,
  todaysChallenge,
} from '../emperorOfDust/fortress/briefings'
import {
  KINGDOM_FACTIONS,
  LOCAL_FACTIONS,
  STATS,
  gateHolds,
} from '../emperorOfDust/fortress/types'
import type {
  AudienceDef,
  AudienceOption,
  FortressRun,
  SceneLine,
} from '../emperorOfDust/fortress/types'
import {
  COURT_ONBOARDING_FLAG,
  COURT_RECRUITMENT_IDS,
  RANDOM_ARRIVALS,
  RIVAL_ARGUMENTS,
  FIRST_BELL_RIVAL_BARGAIN,
} from '../emperorOfDust/fortress/onboarding'

// Older systems tests exercise a fully staffed court. This is a deliberate
// legacy-game fixture; the true empty-roster onboarding is tested below.
const createRun: typeof createUnrecruitedRun = (seed, relics) => {
  const run = createUnrecruitedRun(seed, relics)
  run.roster = FOLLOWERS.filter((def) => def.starter).map((def) => ({
    id: def.id,
    joinedDay: 1,
    equipment: {},
  }))
  run.flags = run.flags.filter((flag) => flag !== COURT_ONBOARDING_FLAG)
  run.dayAudiences = ACT_ONE_DAYS[0]!.audiences.map((audience) => audience.id)
  return run
}

// New campaigns: appointments are court decisions, not starting inventory.
const firstBellVisitors = new Set<string>()
const firstBellArguments = new Set<string>()
for (let seed = 1; seed <= 40; seed += 1) {
  let run = createUnrecruitedRun(seed)
  assert.equal(run.roster.length, 0, 'new ruler has no automatic followers')
  assert.ok(validateRun(run))
  assert.ok(decodeBook(encodeBook(newBook(run))), 'empty roster saves safely')
  assert.equal(run.board.length, 1, 'only one authored opening quest')
  assert.equal(run.dailyEvent, undefined, 'no chance-event pile-up on day one')
  const court = audiencesToday(run)
  assert.equal(court.length, 4, 'three recruits and one first-day petition')
  const recruited = court.filter((audience) =>
    COURT_RECRUITMENT_IDS.includes(audience.id),
  )
  assert.equal(recruited.length, 3)
  const random = recruited.find((audience) =>
    RANDOM_ARRIVALS.includes(audience.id as (typeof RANDOM_ARRIVALS)[number]),
  )!
  const argument = recruited.find((audience) =>
    RIVAL_ARGUMENTS.includes(audience.id as (typeof RIVAL_ARGUMENTS)[number]),
  )!
  firstBellVisitors.add(random.id)
  firstBellArguments.add(argument.id)
  assert.throws(() => finishDay(run), /three recruiting petitions/)
  run = chooseAudienceOption(run, 'd01-kiyo-arrives', 'appoint').run
  run = chooseAudienceOption(run, random.id, 'appoint').run
  const winner = argument.options[seed % 2]!
  const loser = argument.options[(seed + 1) % 2]!
  run = chooseAudienceOption(run, argument.id, winner.id).run
  assert.equal(run.roster.length, 3, 'exactly one recruit per audience')
  assert.ok(run.roster.some((f) => f.id === 'F003'))
  const rejectedId = loser.effects.recruit![0]!
  assert.ok(run.flags.includes(`court-excluded:${rejectedId}`))
  assert.ok(
    unmetRequirements(run, undefined, [rejectedId]).length,
    'rejected rival can never be recruited later',
  )
  applyEffects(run, { recruitable: [rejectedId], recruit: [rejectedId] })
  assert.ok(!run.roster.some((f) => f.id === rejectedId))
  assert.ok(!run.recruitable.includes(rejectedId))
  assert.deepEqual(
    audiencesToday(run).map((a) => a.id),
    court.map((a) => a.id),
  )
  assert.ok(
    decodeBook(encodeBook(newBook(run))),
    'recruitment and exclusion save',
  )
  const day2 = finishDay(run).run
  assert.ok(audiencesToday(day2).some((a) => a.id === 'd01-toll'))
  assert.ok(!audiencesToday(day2).some((a) => a.id === 'd01-mirefen'))
  const day3 = finishDay(day2).run
  assert.ok(audiencesToday(day3).some((a) => a.id === 'd01-mirefen'))
}
assert.equal(firstBellVisitors.size, 4, 'all four chance recruits can visit')
assert.equal(
  firstBellArguments.size,
  2,
  'both authored feuding pairs can appear',
)

// Day One is a genuine seeded draw: nine possible truths, four lies, exactly
// two true reports plus one false. Twelve consecutive fresh starts are unique.
assert.ok(FIRST_BELL_TRUTHS.length >= 9)
assert.ok(FIRST_BELL_LIES.length >= 3)
const openings = new Set<string>()
for (let seed = 1; seed <= 12; seed += 1) {
  const run = createUnrecruitedRun(seed)
  const briefings = dayBriefings(run)!
  assert.equal(briefings.length, 3)
  assert.equal(briefings.filter((b) => b.truth).length, 2)
  assert.equal(briefings.filter((b) => !b.truth).length, 1)
  openings.add(
    briefings
      .map((b) => b.id)
      .sort()
      .join('/'),
  )
  assert.deepEqual(
    dayBriefings(run),
    briefings,
    'opening reports do not reroll',
  )
  const save = decodeBook(encodeBook(newBook(run)))!.current
  assert.deepEqual(dayBriefings(save), briefings, 'reports survive saves')
}
assert.equal(openings.size, 12, 'twelve seeded openings have distinct choices')

// Both feuding pairs can be hired at the expense of almost the whole treasury.
for (const argumentId of RIVAL_ARGUMENTS) {
  const seed = Array.from({ length: 40 }, (_, i) => i + 1).find((n) =>
    audiencesToday(createUnrecruitedRun(n)).some((a) => a.id === argumentId),
  )!
  let run = createUnrecruitedRun(seed)
  const both = audiencesToday(run)
    .find((a) => a.id === argumentId)!
    .options.find((o) => o.id === 'both')!
  assert.equal(both.requires?.cost, FIRST_BELL_RIVAL_BARGAIN)
  const hired = chooseAudienceOption(run, argumentId, 'both').run
  assert.equal(hired.brass, START_BRASS - FIRST_BELL_RIVAL_BARGAIN)
  assert.equal(hired.roster.length, 2)
  assert.ok(
    both.effects.recruit!.every((id) => hired.roster.some((m) => m.id === id)),
  )
  assert.ok(
    both.effects.recruit!.every(
      (id) => !hired.flags.includes(`court-excluded:${id}`),
    ),
  )
  assert.ok(validateRun(hired))
  run = { ...run, brass: 109 }
  assert.match(optionBlockers(run, both).join(' '), /Needs 110 brass/)
  assert.throws(
    () => chooseAudienceOption(run, argumentId, 'both'),
    /Needs 110 brass/,
  )
}

// --- startup overlay contract ----------------------------------------------
// The splash fades for 600ms before it unmounts. On a new game, the first
// introduction scene must already cover the live Komodo briefing underneath.
const startupPage = readFileSync(
  new URL('../../pages/play/emperor-of-dust.vue', import.meta.url),
  'utf8',
)
const startupIntro = readFileSync(
  new URL('../../components/EmperorFortressIntro.vue', import.meta.url),
  'utf8',
)
assert.match(
  startupPage,
  /<EmperorFortressIntro\s+v-if="court\.loaded && court\.introOpen"\s+:active="!splashing"/,
  'mount the map introduction under the fading splash, not after it',
)
assert.match(startupIntro, /:inert="!active"/)
assert.match(startupIntro, /:aria-hidden="!active"/)
assert.match(
  startupIntro,
  /watch\(\s*\[index, \(\) => props\.active\]/,
  'intro text animation starts after the splash, never unseen behind it',
)
assert.match(startupIntro, /if \(props\.active\) stream\(\)/)

// --- content contract -------------------------------------------------------
assert.equal(FOLLOWERS.length, 25, 'twenty regulars and five hidden travelers')
assert.deepEqual(
  FOLLOWERS.map((def) => def.id),
  Array.from({ length: 25 }, (_, i) => `F${String(i + 1).padStart(3, '0')}`),
)
assert.equal(
  FOLLOWERS.filter((def) => def.romanceable).length,
  7,
  'seven romanceable followers, including Kiyo',
)
assert.equal(
  new Set(FOLLOWERS.slice(0, 20).map((def) => def.ability.kind)).size,
  20,
  'the original cast retain distinct abilities',
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
    if (audience.npc)
      assert.ok(npcDef(audience.npc) || followerDef(audience.npc), audience.npc)
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
assert.ok(kiyo.starter && kiyo.romanceable)
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
  0,
  'scripted day leaves room for deliberate quests',
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
// t-041: Saffron's Bridge-builder applies here and the Codex has not read it,
// so the preview is a range that holds the true odds, not a point.
assert.equal(odds.estimate, true, 'an unread trait makes it an estimate')
assert.equal(odds.unread, 1)
assert.ok(odds.low < odds.high && odds.low <= odds.chance)
const readOdds = previewQuest(
  repaired,
  'q-d01-aqueduct-repair',
  ['F002'],
  ['F002-bridge-builder'],
)
assert.equal(readOdds.estimate, false, 'read traits give a point')
assert.equal(readOdds.unread, undefined)
assert.ok(readOdds.chance >= odds.low && readOdds.chance <= odds.high)
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
assert.equal(bigger.beds, 7)
assert.equal(bigger.brass, fullBarracks.brass - 100)
assert.equal(recruit(bigger, 'F005').roster.length, 7)
assert.throws(() => upgradeBeds(bigger), /Needs 150 brass/)
const funded = { ...bigger, brass: 200 }
assert.equal(upgradeBeds(funded).beds, 8)
assert.throws(
  () => upgradeBeds({ ...funded, beds: 9, brass: 400 }),
  /gate-watch support 12/,
)

// Seed 1234 lays out the Surveyor's Glass on Day 1 (the market owns buying).
assert.ok(marketStock(start).includes('surveyors-glass'))
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
assert.ok(
  !createRun(77).revealedFactions.includes('black-verge') &&
    !day11.revealedFactions.includes('black-verge'),
  'the Black Verge stays fogged through Act I',
)
assert.ok(
  finishDay({ ...day10, day: 20 }).run.revealedFactions.includes('black-verge'),
  'Black Verge revealed after Act II',
)
assert.deepEqual(
  finishDay(day10).report.map?.filter((e) => e.kind === 'revealed'),
  [{ day: 11, kind: 'revealed', faction: 'rustline' }],
  'the Act I dawn shows the Rustline reveal as a map event',
)

// --- the map: wipe-outs and raids only at act ends, always warned ------------
// An unwarned faction at zero strength is not wiped at the act end: it is
// warned there, and falls at the next act end only if nothing changes.
const doomed: FortressRun = {
  ...day10,
  strength: { ...day10.strength, freeholds: 0 },
}
const warnedDawn = finishDay(doomed)
assert.ok(
  !warnedDawn.run.wipedOut.includes('freeholds'),
  'no wipe-out without a warning an act ahead',
)
assert.ok(
  warnedDawn.run.mapWatch?.some(
    (t) => t.kind === 'wipe' && t.faction === 'freeholds' && t.dueDay === 21,
  ),
  'the act end warns the failing faction for the next act end',
)
assert.ok(
  warnedDawn.report.map?.some(
    (e) => e.kind === 'warned-wipe' && e.faction === 'freeholds',
  ),
  'the warning is in the dawn report',
)
const warning = mapWarnings(warnedDawn.run).find(
  (w) => w.kind === 'wipe' && w.faction === 'freeholds',
)
assert.ok(warning, 'the map room shows the live warning')
assert.equal(warning.daysLeft, 10)
assert.match(warning.text, /Day 20 map/)
assert.match(warning.remedy, /Strength 0 of 10\. One point saves them/)
assert.ok(briefingMapLine(warnedDawn.run), 'the briefing carries the warning')
// Mid-act, nothing falls, whatever the strength.
const midAct = finishDay({ ...warnedDawn.run, day: 15, board: [] }).run
assert.ok(!midAct.wipedOut.includes('freeholds'), 'no wipe-outs mid-act')
assert.ok(
  !midAct.mapLog?.some((e) => e.day === 16),
  'the map is quiet on ordinary dawns',
)
// At the act end it was warned for, a faction still at zero falls...
const fallDawn = finishDay({ ...warnedDawn.run, day: 20, board: [] })
assert.ok(fallDawn.run.wipedOut.includes('freeholds'), 'warned and fell')
assert.ok(fallDawn.report.map?.some((e) => e.kind === 'wiped'))
const freeholdQuest = ACT_FOUR_QUESTS.find((q) => q.faction === 'freeholds')!
const closed = finishDay({
  ...warnedDawn.run,
  day: 20,
  board: [{ questId: freeholdQuest.id, postedDay: 20, lastDay: 22 }],
}).run
assert.ok(
  !closed.board.some((entry) => entry.questId === freeholdQuest.id),
  'a wiped faction’s notices come down',
)
const freeholdDawn = DAYS.find((def) =>
  def.quests.some((id) => questDef(id)?.faction === 'freeholds'),
)!
const freeholdPosted = freeholdDawn.quests.find(
  (id) => questDef(id)?.faction === 'freeholds',
)!
const wipedDawn: FortressRun = {
  ...fallDawn.run,
  day: freeholdDawn.day,
  board: [],
  reports: [],
}
postDawnQuests(wipedDawn)
assert.ok(
  !wipedDawn.board.some((entry) => entry.questId === freeholdPosted),
  'and no new ones go up',
)
assert.equal(
  regionTax(fallDawn.run, 'east-ford').paid,
  0,
  'a wiped faction pays no taxes',
)
// ...and one that found a point of strength holds.
const heldDawn = finishDay({
  ...warnedDawn.run,
  day: 20,
  board: [],
  strength: { ...warnedDawn.run.strength, freeholds: 1 },
})
assert.ok(!heldDawn.run.wipedOut.includes('freeholds'), 'saved in time')
assert.ok(
  heldDawn.report.map?.some(
    (e) => e.kind === 'held' && e.faction === 'freeholds' && !e.region,
  ),
)
// Warnings are honest: only banners on the map, only factions that can fall.
const fogTest: FortressRun = {
  ...createRun(5),
  strength: { ...createRun(5).strength, rustline: 0, 'hollow-bell': 2 },
}
assert.ok(
  !threatsFor(fogTest, 11).some((t) => t.faction === 'rustline'),
  'no warning for a fogged faction',
)
assert.ok(
  !threatsFor(fogTest, 11).some((t) => t.faction === 'hollow-bell'),
  'no warning for a faction nothing in the campaign can weaken',
)
assert.ok(
  threatsFor(
    { ...fogTest, strength: { ...fogTest.strength, 'hollow-bell': 0 } },
    11,
  ).some((t) => t.faction === 'hollow-bell'),
  'a faction already at zero is always warned',
)
assert.ok(
  threatsFor(
    { ...fogTest, strength: { ...fogTest.strength, freeholds: 2 } },
    11,
  ).some((t) => t.kind === 'wipe' && t.faction === 'freeholds'),
  'a faction that can still lose strength is warned at peril',
)
assert.ok(
  !threatsFor({ ...fogTest, wipedOut: ['freeholds'] }, 11).some(
    (t) => t.faction === 'freeholds' || t.by === 'freeholds',
  ),
  'no warnings for a banner already gone',
)
// Raids: a rival RAID_GAP stronger is warned an act ahead, then takes the land
// only if the gap still stands, and the land's taxes follow the new holder.
const raidRun: FortressRun = {
  ...day10,
  strength: { ...day10.strength, jackalwire: 7, freeholds: 4 },
}
const raidWarned = finishDay(raidRun).run
const raid = raidWarned.mapWatch?.find((t) => t.kind === 'raid')
assert.deepEqual(
  raid && [raid.faction, raid.by, raid.region, raid.dueDay],
  ['freeholds', 'jackalwire', 'east-ford', 21],
  'the Pack is warned on the Eastern Ford',
)
assert.equal(regionHolder(raidWarned, 'east-ford'), 'freeholds')
const raided = finishDay({ ...raidWarned, day: 20, board: [] })
assert.equal(regionHolder(raided.run, 'east-ford'), 'jackalwire', 'taken')
assert.ok(raided.report.map?.some((e) => e.kind === 'taken'))
assert.equal(
  regionTax(raided.run, 'east-ford').holder,
  'jackalwire',
  'the taken land pays as its new holder stands',
)
assert.equal(
  regionTax(
    {
      ...raided.run,
      affinity: { ...raided.run.affinity, jackalwire: -40 },
    },
    'east-ford',
  ).paid,
  0,
  'a Wary holder withholds the taken land',
)
const repelled = finishDay({
  ...raidWarned,
  day: 20,
  board: [],
  strength: { ...raidWarned.strength, jackalwire: 6, freeholds: 4 },
})
assert.equal(
  regionHolder(repelled.run, 'east-ford'),
  'freeholds',
  'closing the gap holds the land',
)
// An unwarned gap takes nothing at the act end.
const unwarned = finishDay({
  ...raidRun,
  day: 20,
  board: [],
  strength: { ...raidRun.strength, freeholds: 1 },
}).run
assert.equal(regionHolder(unwarned, 'east-ford'), 'freeholds')
// Taxes by tier: Wary and Hostile withhold, Neutral and Friendly pay the rate,
// Allied adds half again.
const taxRun = createRun(3)
for (const [value, paid] of [
  [-80, 0],
  [-40, 0],
  [0, 6],
  [30, 6],
  [70, 9],
] as const)
  assert.equal(
    regionTax(
      { ...taxRun, affinity: { ...taxRun.affinity, saltroad: value } },
      'saltroad',
    ).paid,
    paid,
    `Saltroad tax at affinity ${value}`,
  )
assert.equal(
  dailyTaxes(taxRun),
  REGIONS.reduce((sum, region) => sum + regionTax(taxRun, region.id).paid, 0),
  'the treasury collects exactly what the map room lists',
)
// Saves keep the map and refuse a corrupt one.
assert.ok(validateRun(raided.run), 'a run with map history validates')
assert.ok(
  !validateRun({ ...raided.run, controllers: { 'east-ford': 'nobody' } }),
  'an unknown holder is refused',
)
assert.ok(
  !validateRun({
    ...raided.run,
    mapLog: [{ day: 11, kind: 'nonsense', faction: 'freeholds' }],
  } as unknown as FortressRun),
  'an unknown map event is refused',
)
// Whole campaigns: every wipe-out and every taken region was warned at the
// act end before, every map change lands on an act-end dawn, and reveals
// keep to schedule.
const campaignKinds = new Set<string>()
for (const [seed, pick] of [
  [1, 0],
  [2, 0],
  [3, -1],
  [4, -1],
] as const) {
  let run = createRun(seed)
  while (!isOver(run)) {
    for (const audience of audiencesToday(run))
      for (let beat = 0; beat < 8; beat += 1) {
        if (run.audiencesHeard.includes(audience.id)) break
        const open = audienceScene(run, audience).options.filter(
          (option) => optionBlockers(run, option).length === 0,
        )
        const option = open.at(pick)
        if (!option) break
        run = chooseAudienceOption(run, audience.id, option.id).run
      }
    const dawn = finishDay(run)
    run = dawn.run
    assert.deepEqual(
      dawn.report.map ?? [],
      (run.mapLog ?? []).filter((e) => e.day === run.day),
      'the dawn shows exactly the day’s map events',
    )
  }
  const log = run.mapLog ?? []
  for (const event of log) {
    if (event.kind !== 'revealed')
      assert.ok(
        (ACT_END_DAWNS as readonly number[]).includes(event.day),
        `${event.kind} on an act-end dawn (${event.day})`,
      )
    if (event.kind === 'wiped' || event.kind === 'taken')
      assert.ok(
        log.some(
          (warned) =>
            warned.day === event.day - 10 &&
            warned.faction === event.faction &&
            warned.kind ===
              (event.kind === 'wiped' ? 'warned-wipe' : 'warned-raid'),
        ),
        `${event.kind} ${event.faction} on ${event.day} was warned an act ahead`,
      )
  }
  assert.deepEqual(
    log.filter((e) => e.kind === 'revealed').map((e) => [e.faction, e.day]),
    [
      ['rustline', 11],
      ['black-verge', 21],
    ],
    'reveals on schedule',
  )
  assert.deepEqual(
    [...run.wipedOut].sort(),
    log
      .filter((e) => e.kind === 'wiped')
      .map((e) => e.faction)
      .sort(),
    'every wipe-out is in the map log',
  )
  for (const event of log) campaignKinds.add(event.kind)
}
for (const kind of ['wiped', 'taken', 'held', 'warned-wipe', 'warned-raid'])
  assert.ok(campaignKinds.has(kind), `a neglected court sees ${kind}`)
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

// --- barracks talks ---------------------------------------------------------
{
  const talkIds = TALKS.map((talk) => talk.id)
  assert.equal(new Set(talkIds).size, talkIds.length, 'talk ids are unique')
  const allFlags = new Set(
    TALKS.flatMap((talk) =>
      [
        ...talk.options,
        ...(talk.beats ?? []).flatMap((b) => b.options),
      ].flatMap((option) => option.effects.flags ?? []),
    ),
  )
  for (const talk of TALKS) {
    assert.ok(followerDef(talk.follower), `${talk.id} follower`)
    assert.ok(talk.fromDay >= 1 && talk.fromDay <= LAST_DAY, talk.id)
    const byId = new Map((talk.beats ?? []).map((beat) => [beat.id, beat]))
    assert.equal(byId.size, (talk.beats ?? []).length, `${talk.id} beat ids`)
    const reached = new Set<string>()
    const walk = (options: AudienceOption[], path: string[]) => {
      assert.ok(options.length >= 1, `${talk.id} every beat can be answered`)
      const ids = options.map((option) => option.id)
      assert.equal(new Set(ids).size, ids.length, `${talk.id} option ids`)
      for (const option of options) {
        assert.ok(option.response.trim(), `${talk.id}/${option.id} reply`)
        assert.equal(option.postsQuests, undefined, 'talks post no quests')
        assert.equal(option.effects.recruit, undefined, 'talks recruit no one')
        if (!option.next) continue
        assert.ok(byId.has(option.next), `${talk.id} -> ${option.next}`)
        assert.ok(!path.includes(option.next), `${talk.id} loops`)
        reached.add(option.next)
        walk(byId.get(option.next)!.options, [...path, option.next])
      }
    }
    walk(talk.options, [])
    for (const id of byId.keys()) assert.ok(reached.has(id), `${talk.id}/${id}`)
    // A talk that waits on another talk waits on one that exists and comes first.
    for (const flag of talk.requires?.flags ?? []) {
      if (!flag.startsWith('heard:')) continue
      const before = TALKS.find((entry) => entry.id === flag.slice(6))
      assert.ok(before, `${talk.id} waits on ${flag}`)
      assert.ok(before.fromDay <= talk.fromDay, `${talk.id} after ${before.id}`)
    }
  }
  // Every talk-only allegiance can be revealed by some talk or audience.
  const audienceFlags = new Set(
    DAYS.flatMap((def) =>
      def.audiences.flatMap((audience) =>
        [
          ...audience.options,
          ...(audience.beats ?? []).flatMap((b) => b.options),
        ].flatMap((option) => option.effects.flags ?? []),
      ),
    ),
  )
  for (const def of FOLLOWERS)
    for (const trait of def.traits)
      if (trait.revealFlag && TALKS.some((t) => t.follower === def.id))
        assert.ok(
          allFlags.has(trait.revealFlag) || audienceFlags.has(trait.revealFlag),
          `${trait.id} can be revealed`,
        )

  // Day 2: Rook has something to say; asking leads on; the day's talk is spent.
  let run = finishDay(createRun(777)).run
  const rook = talkFor(run, 'F001')!
  assert.equal(rook?.id, 'rook-1')
  assert.equal(talkScene(run, rook).npc, 'F001')
  assert.ok(!talkedToday(run))
  run = chooseTalkOption(run, 'rook-1', 'ask-name').run
  assert.equal(run.talkOpen?.beat, 'wrong-side')
  assert.ok(!talkedToday(run), 'a talk under way is not yet spent')
  assert.ok(validateRun(run), 'a run mid-talk saves')
  assert.equal(talkFor(run, 'F002'), undefined, 'one conversation at a time')
  const closed = chooseTalkOption(run, 'rook-1', 'honest').run
  assert.ok(closed.flags.includes('heard:rook-1'))
  assert.ok(closed.flags.includes('talk:rook-1:honest'))
  assert.ok(talkedToday(closed))
  assert.throws(() => chooseTalkOption(closed, 'rook-1', 'honest'))
  // A talk left open closes at dawn, heard, with its answers standing.
  const dawn = finishDay(run).run
  assert.equal(dawn.talkOpen, undefined)
  assert.ok(dawn.talksHeard?.includes('rook-1'))
  assert.ok(dawn.flags.includes('talk:rook-1:ask-name'))
  // Saffron's badge reveals her allegiance through talk.
  let shop = finishDay(finishDay(createRun(778)).run).run
  shop = chooseTalkOption(shop, 'saffron-1', 'ask-badge').run
  shop = chooseTalkOption(shop, 'saffron-1', 'keep-secret').run
  const insignia = followerDef('F002')!.traits.find(
    (trait) => trait.kind === 'allegiance',
  )!
  assert.ok(traitKnown(shop, insignia, []), 'talk reveals an allegiance')
  // Followers away on a quest have nothing to say.
  const away = { ...shop, talkDay: undefined }
  away.active = [
    {
      questId: 'x',
      party: ['F003'],
      departedDay: 3,
      returnsDay: 5,
      postedDay: 3,
      lastDay: 3,
    },
  ]
  assert.equal(talkFor(away, 'F003'), undefined)
}

// --- talk pacing (t-042) -----------------------------------------------------
{
  // A talk never names a follower who may not be at court: another follower
  // is named only in the talk's own follower's scene, or in a talk, answer or
  // beat that waits on that follower being present (`requires.follower`).
  const names = FOLLOWERS.map((def) => ({
    id: def.id,
    patterns: [
      new RegExp(
        `\\b${def.name.replace(/^(Duchess|Brother) /, '').split(' ')[0]}\\b`,
      ),
      new RegExp(`\\bthe ${def.species}\\b`, 'i'),
    ],
  }))
  const textOf = (line: string | { text: string }) =>
    typeof line === 'string' ? line : line.text
  const checkNames = (
    talkId: string,
    where: string,
    text: string,
    present: Set<string>,
  ) => {
    for (const name of names)
      if (!present.has(name.id) && name.patterns.some((p) => p.test(text)))
        assert.fail(`${talkId} ${where} names ${name.id}, who may be absent`)
  }
  for (const talk of TALKS) {
    const base = new Set([talk.follower])
    if (talk.requires?.follower) base.add(talk.requires.follower)
    // A beat may assume whoever every answer leading into it waited on.
    const beatGates = new Map<string, Set<string>>()
    const visit = (
      options: readonly AudienceOption[],
      present: Set<string>,
      where: string,
    ) => {
      for (const option of options) {
        const gated = new Set(present)
        if (option.requires?.follower) gated.add(option.requires.follower)
        checkNames(talk.id, `${where}/${option.id}`, option.label, gated)
        checkNames(talk.id, `${where}/${option.id}`, option.response, gated)
        if (!option.next) continue
        const before = beatGates.get(option.next)
        beatGates.set(
          option.next,
          before ? new Set([...before].filter((id) => gated.has(id))) : gated,
        )
      }
    }
    talk.lines.forEach((line, i) =>
      checkNames(talk.id, `line ${i}`, textOf(line), base),
    )
    visit(talk.options, base, 'opening')
    // Beats only lead forward (checked above), so a few passes settle them.
    for (let pass = 0; pass < (talk.beats ?? []).length; pass += 1)
      for (const beat of talk.beats ?? []) {
        const present = beatGates.get(beat.id)
        if (!present) continue
        beat.lines.forEach((line, i) =>
          checkNames(talk.id, `${beat.id} line ${i}`, textOf(line), present),
        )
        visit(beat.options, present, beat.id)
      }
  }

  // A player who sits with someone every day finds someone with something to
  // say on most days. Measured 2026-10-21 over 13 balance policies x 5 seeds,
  // talking to the follower whose talk has waited longest: before t-042,
  // 64.7% of days with a full barracks (longest dry spell 9 days) and 35.1%
  // with only the four starters (19 days). After: 96.3% and 86.9%, and never
  // more than three dry days running. The floors below sit under those.
  const sitDaily = (seed: number, recruits: boolean) => {
    let run = createRun(seed)
    const days: boolean[] = []
    const open = (options: readonly AudienceOption[]) =>
      options.find(
        (option) =>
          optionVisible(run, option) &&
          optionBlockers(run, option).length === 0,
      )
    while (!isOver(run)) {
      for (const id of recruits ? [...run.recruitable] : []) {
        try {
          run = recruit(run, id)
        } catch {
          try {
            run = recruit(upgradeBeds(run), id)
          } catch {
            // No bed or no brass: the offer waits.
          }
        }
      }
      for (const audience of audiencesToday(run))
        for (let beat = 0; beat < 8; beat += 1) {
          if (run.audiencesHeard.includes(audience.id)) break
          const option = open(audienceScene(run, audience).options)
          if (!option) break
          run = chooseAudienceOption(run, audience.id, option.id).run
        }
      const waiting = run.roster
        .map((state) => talkFor(run, state.id))
        .filter((talk) => !!talk)
        .sort((a, b) => a.fromDay - b.fromDay)
      days.push(waiting.length > 0)
      const talk = waiting[0]
      for (let beat = 0; talk && beat < 8; beat += 1) {
        if ((run.talksHeard ?? []).includes(talk.id)) break
        const option = open(talkScene(run, talk).options)
        if (!option) break
        run = chooseTalkOption(run, talk.id, option.id).run
      }
      for (const entry of [...run.board]) {
        const quest = questDef(entry.questId)!
        const ready = run.roster
          .map((state) => state.id)
          .filter((id) => followerStatus(run, id) === 'ready')
        const party = quest.mustInclude
          ? [
              quest.mustInclude,
              ...ready.filter((id) => id !== quest.mustInclude),
            ]
          : ready
        if (quest.mustInclude && !ready.includes(quest.mustInclude)) continue
        if (party.length < quest.party.min) continue
        const picked = party.slice(0, quest.party.min)
        if (previewQuest(run, quest.id, picked).chance < 45) continue
        try {
          run = assignQuest(run, entry.questId, picked)
        } catch {
          // A party the engine refuses stays home.
        }
      }
      run = finishDay(run).run
    }
    let dry = 0
    let longest = 0
    for (const talked of days) {
      dry = talked ? 0 : dry + 1
      longest = Math.max(longest, dry)
    }
    return { share: days.filter(Boolean).length / days.length, longest }
  }
  for (const seed of [1, 2, 3]) {
    const full = sitDaily(seed, true)
    assert.ok(full.share >= 0.9, `seed ${seed}: talks on ${full.share} of days`)
    assert.ok(full.longest <= 3, `seed ${seed}: ${full.longest} dry days`)
    const starters = sitDaily(seed, false)
    assert.ok(
      starters.share >= 0.8,
      `seed ${seed}, starters only: talks on ${starters.share} of days`,
    )
    assert.ok(starters.longest <= 3, `seed ${seed}: ${starters.longest} dry`)
  }
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
// --- afterwards: the consequences epilogue ----------------------------------
{
  // Every flag an epilogue reads is one the game can set.
  const settable = new Set<string>()
  const addEffects = (effects?: { flags?: string[] }) => {
    for (const flag of effects?.flags ?? []) settable.add(flag)
  }
  for (const def of DAYS)
    for (const audience of def.audiences)
      for (const option of [
        ...audience.options,
        ...(audience.beats ?? []).flatMap((beat) => beat.options),
      ])
        addEffects(option.effects)
  for (const quest of [
    ...ACT_ONE_QUESTS,
    ...ACT_ONE_LATE_QUESTS,
    ...ACT_TWO_QUESTS,
    ...ACT_THREE_QUESTS,
    ...ACT_FOUR_QUESTS,
    ...ACT_FIVE_QUESTS,
    ...QUEST_TEMPLATES,
  ]) {
    for (const effects of Object.values(quest.rewards)) addEffects(effects)
    addEffects(quest.expired)
  }
  for (const talk of TALKS)
    for (const option of [
      ...talk.options,
      ...(talk.beats ?? []).flatMap((beat) => beat.options),
    ])
      addEffects(option.effects)
  const engineSource = readFileSync(
    new URL('../emperorOfDust/fortress/engine.ts', import.meta.url),
    'utf8',
  )
  const canSet = (flag: string) =>
    settable.has(flag) ||
    /^(chose|talk|heard|hideout):/.test(flag) ||
    engineSource.includes(`'${flag}'`)
  const subjectIds = EPILOGUE.map((subject) => subject.id)
  assert.equal(new Set(subjectIds).size, subjectIds.length, 'epilogue ids')
  for (const subject of EPILOGUE) {
    assert.ok(subject.variants.length >= 1, subject.id)
    if (subject.follower) assert.ok(followerDef(subject.follower), subject.id)
    if (subject.npc) assert.ok(npcDef(subject.npc), subject.id)
    for (const variant of subject.variants) {
      assert.ok(variant.text.trim().length > 40, `${subject.id} has words`)
      const when = variant.when ?? {}
      for (const flag of [
        ...(when.flags ?? []),
        ...(when.anyFlags ?? []),
        ...(when.notFlags ?? []),
      ])
        assert.ok(
          canSet(flag),
          `${subject.id} reads ${flag}, which nothing sets`,
        )
      for (const id of [...(when.alive ?? []), ...(when.dead ?? [])])
        assert.ok(followerDef(id), `${subject.id} names ${id}`)
      for (const id of when.endings ?? [])
        assert.ok(ENDINGS[id], `${subject.id} ending ${id}`)
    }
  }
}
const afterwards = epilogueFor(book.current, endingOf(book.current).id)
assert.ok(
  afterwards.length >= 3,
  'a finished campaign tells what became of them',
)
for (const entry of afterwards)
  if (entry.subject.follower)
    assert.ok(
      book.current.roster.some((s) => s.id === entry.subject.follower),
      'only followers who joined are remembered',
    )

const encoded = encodeBook(book)
assert.deepEqual(decodeBook(encoded), book)
assert.ok(
  encoded.length < 250_000,
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
// Over many seeds, rewinding a dawn can bring a different encounter.
let differs = 0
for (let seed = 1; seed <= 40; seed += 1) {
  const fresh = newBook(createRun(seed))
  const dawn2 = recordDawn(fresh, finishDay(fresh.current).run)
  const again = rewindTo(dawn2, 2)
  if (again.current.dailyEvent !== dawn2.current.dailyEvent) differs += 1
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

// --- compact save books (t-032) ---------------------------------------------
// Dawns are stored packed against the next snapshot, so a whole campaign's
// book stays small: an autosave and three full slots sit far under the ~5 MB
// browser quota. Decoding rebuilds every dawn exactly, so a rewind from a
// packed book is the same rewind as from the full one.
{
  const CAMPAIGNS: [string, number][] = [
    ['greedy', 3],
    ['patron:saltroad', 7],
    ['reckless', 12],
    ['spurn-all', 5],
    ['idle', 2],
  ]
  for (const [policyId, seed] of CAMPAIGNS) {
    const policy = POLICIES.find((p) => p.id === policyId)!
    let full: SaveBook | null = null
    playCampaign(policy, seed, (run) => {
      full = full ? recordDawn(full, run) : newBook(run)
    })
    const whole = full! as SaveBook
    const label = `${policyId} seed ${seed}`
    assert.equal(whole.dawns.length, LAST_DAY, label)
    const legacy = JSON.stringify(whole)
    const raw = encodeBook(whole)
    assert.ok(
      raw.length < 250_000,
      `${label}: a full book is ${raw.length} bytes`,
    )
    assert.ok(
      raw.length * 5 < legacy.length,
      `${label}: packed ${raw.length} vs ${legacy.length} bytes in full`,
    )
    const back = decodeBook(raw)!
    assert.deepEqual(back, whole, `${label}: every dawn comes back exactly`)
    assert.deepEqual(decodeBook(legacy), whole, `${label}: version 3 loads`)
    for (const day of [1, 2, 17, 33, LAST_DAY])
      assert.deepEqual(
        rewindTo(back, day),
        rewindTo(whole, day),
        `${label}: rewinding a packed book to dawn ${day}`,
      )
    const rewound = rewindTo(back, 25)
    assert.deepEqual(decodeBook(encodeBook(rewound)), rewound)
    const at = new Date('2026-10-20T00:00:00Z')
    const slotRaw = encodeSlot('Late', whole, at)
    assert.ok(slotRaw.length < 250_000, `${label}: a full slot`)
    assert.deepEqual(decodeSlot(slotRaw)?.book, whole)
    const oldSlot = JSON.stringify({
      version: 3,
      label: 'Old',
      savedAt: at.toISOString(),
      book: whole,
    })
    assert.deepEqual(decodeSlot(oldSlot)?.book, whole, `${label}: old slots`)
    assert.ok(
      raw.length * 4 < 5_000_000 / 2,
      'an autosave and three slots use under half a 5 MB quota',
    )
  }

  // A history that drops a flag (a crisis resolved) still packs exactly.
  let book = newBook(earnFlag(earnFlag(createRun(77), 'crisis:yard'), 'kept'))
  const next = finishDay(book.current).run
  next.flags = next.flags.filter((flag) => flag !== 'crisis:yard')
  book = recordDawn(book, next)
  const packed = JSON.parse(encodeBook(book))
  assert.equal(packed.version, 4)
  assert.deepEqual(decodeBook(JSON.stringify(packed)), book)

  // Tampered packing is unreadable, never half-loaded.
  type Stored = {
    version: number
    dawns: {
      day: number
      seed: number
      flags: unknown
      reports: { p: unknown; t: unknown; z?: unknown }
    }[]
  }
  const long: Stored = JSON.parse(
    encodeBook(
      recordDawn(
        recordDawn(book, finishDay(book.current).run),
        finishDay(finishDay(book.current).run).run,
      ),
    ),
  )
  const reject = (mutate: (stored: Stored) => void, why: string) => {
    const copy: Stored = JSON.parse(JSON.stringify(long))
    mutate(copy)
    assert.equal(decodeBook(JSON.stringify(copy)), null, why)
  }
  assert.ok(decodeBook(JSON.stringify(long)), 'the untampered book reads')
  assert.ok(!Array.isArray(long.dawns[1]!.reports), 'reports are packed')
  reject((s) => (s.dawns[1]!.reports.p = 99), 'a prefix longer than the next')
  reject((s) => (s.dawns[1]!.reports.p = 0), 'an empty prefix is never written')
  reject((s) => (s.dawns[1]!.reports.t = 'x'), 'a tail that is not a list')
  reject((s) => (s.dawns[1]!.reports.z = 1), 'an unknown packing key')
  reject((s) => (s.dawns[1]!.flags = { p: 1, t: [7] }), 'a bad flag in a tail')
  reject((s) => (s.dawns[0]!.day = 2), 'dawns out of order')
  reject((s) => s.dawns.push(s.dawns[0]!), 'too many dawns')
  reject((s) => (s.version = 5), 'an unknown version')
  reject((s) => (s.dawns[1]!.seed = 1), 'a dawn from another campaign')
}

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
// Komodo lies four times by the end of Act III, each one his own, and four
// more in Act IV as the betrayal nears (Days 32, 37, 38 and 40).
const komodoLies = (days: typeof DAYS) =>
  days.flatMap((def) => def.briefings).filter((b) => b.komodoLie).length
assert.equal(komodoLies(DAYS.filter((def) => def.day <= 30)), 4)
assert.equal(komodoLies(DAYS), 8)

{
  // --- t-037: Act III playtest rewrite ----------------------------------------
  const act3 = (id: string): AudienceDef =>
    DAYS.flatMap((def) => def.audiences).find((a) => a.id === id)!
  const act3Options = (audience: AudienceDef) => [
    ...audience.options,
    ...(audience.beats ?? []).flatMap((beat) => beat.options),
  ]
  const act3Text = DAYS.filter((def) => def.day >= 21 && def.day <= 30)
    .flatMap((def) => def.audiences)
    .flatMap((audience) => [
      ...[audience, ...(audience.beats ?? [])].flatMap((scene) => [
        ...scene.lines,
        ...(scene.variants ?? []).flatMap((v) => v.lines),
      ]),
      ...act3Options(audience).flatMap((o) => [o.label, o.response]),
    ])
    .map((line) => (typeof line === 'string' ? line : line.text))
    .join('\n')
  // The winks are gone: the Abbey must stay doubtable until Mara's page.
  for (const wink of [
    'purse that never empties',
    'Or anything',
    'well chosen',
    'lose anyone',
    'I cannot find the flaw',
    'It sounds like a threat',
    'such a friend to the mission',
    'Four cots',
  ])
    assert.ok(!act3Text.includes(wink), `Act III no longer says “${wink}”`)
  assert.ok(
    !questDef('q-d24-coldbrook-visit')!.outcomes.success!.includes('Four'),
    'Wenna gave the Abbey three children',
  )

  // Every alliance on Day 21 is an alliance: the hideout and epilogue see it.
  const d21 = onDay(1, 21, { flags: ['pack-medicine', 'pack-camp-mapped'] })
  const allied = (beat: string, option: string) => {
    const opened = chooseAudienceOption(
      d21,
      'd21-captains-promise',
      beat === 'price' ? 'ask-price' : 'ask-saffron',
    ).run
    return chooseAudienceOption(opened, 'd21-captains-promise', option).run
  }
  for (const [beat, option] of [
    ['price', 'pups-as-guests'],
    ['price', 'tincture-debt'],
    ['price', 'camp-threat'],
    ['saffron', 'pups-back'],
  ] as const) {
    const run = allied(beat, option)
    assert.ok(run.flags.includes('pack-alliance'), `${option} allies`)
    assert.equal(
      run.strength.jackalwire,
      d21.strength.jackalwire + 1,
      `${option} strengthens the Pack`,
    )
  }

  // Vane asks for the rhino only when Mags is at court.
  const raid = act3('d26-friendly-raid')
  for (const option of act3Options(raid))
    if (/rhino/i.test(option.response))
      assert.equal(option.requires?.follower, 'F013', option.id)
  const withoutMags = withCast(1, 26, ['F001'])
  const withMags = withCast(1, 26, ['F001', 'F013'])
  const magsOption = raid.options.find((o) => o.id === 'help-mags')!
  assert.ok(!optionVisible(withoutMags, magsOption))
  assert.ok(optionVisible(withMags, magsOption))

  // Day 25: every probe can still reach the orphan writ.
  const abbess = act3('d25-the-abbess')
  for (const beat of ['census', 'komodo', 'teodor'])
    assert.ok(
      abbess
        .beats!.find((b) => b.id === beat)!
        .options.some((o) => o.next === 'offer'),
      `${beat} leads on to the writ`,
    )
  // Taxing the Abbey costs the Yard its bread, wherever it is asked.
  for (const option of act3Options(abbess).filter((o) => o.id === 'tax'))
    assert.ok((option.effects.local?.yard ?? 0) < 0, 'the tithe costs bread')
  // She has heard what the court did to her this week.
  const heard = (flags: string[]) =>
    sceneLines({ flags }, abbess)
      .map((line) => (typeof line === 'string' ? line : line.text))
      .join(' ')
  assert.match(heard(['d23-mission-syrup-seized']), /fever ward cried/)
  assert.match(heard(['asked-abbey-politely']), /Ormond boy/)
  assert.match(
    heard(['d23-mission-syrup-seized', 'asked-abbey-politely']),
    /fever ward cried.*Ormond boy/,
  )
  assert.equal(sceneLines({ flags: [] }, abbess), abbess.lines)
  // The cough comes back to the Yard when the sisters are barred.
  const barred = dayBriefings(onDay(1, 25, { flags: ['d23-sisters-barred'] }))!
  assert.match(barred[2]!.text, /cough came back/)

  // Day 29: letting Pip read is a reading, not the end of the scene.
  const mara = act3('d29-mayors-secret')
  assert.equal(mara.options.find((o) => o.id === 'pip')!.next, 'price')
  assert.ok(
    mara
      .beats!.find((b) => b.id === 'envelope')!
      .options.some((o) => o.next === 'price'),
    'the envelope does not lock out Mara’s price',
  )

  // Day 30: the Abbey's wagons take the children and the grown still need a
  // gate; sheltering every child is gone once they are on the wagons.
  const terms = onDay(1, 30)
  const atGate = chooseAudienceOption(terms, 'd30-terms', 'ask-gate').run
  const wagons = chooseAudienceOption(
    atGate,
    'd30-terms',
    'abbey-takes-children',
  )
  assert.equal(wagons.next, 'losses')
  assert.ok(!wagons.run.audiencesHeard.includes('d30-terms'))
  const losses = audienceScene(wagons.run, act3('d30-terms'))
  assert.ok(
    !losses.options.some(
      (o) => o.id === 'children-first' && optionVisible(wagons.run, o),
    ),
  )
  const grown = chooseAudienceOption(wagons.run, 'd30-terms', 'freeholds').run
  assert.ok(grown.flags.includes('sheltered-freeholds'))
  assert.ok(grown.flags.includes('d30-children-to-abbey'))
  assert.deepEqual(
    grown.dues?.find((due) => due.id === 'abbey-wagons-return')?.day,
    34,
    'the wagons come back on Day 34',
  )
  // Hidden from the throne: the court does not see the return coming.
  assert.ok(
    !optionStakes(
      atGate,
      act3('d30-terms')
        .beats!.find((b) => b.id === 'marrow')!
        .options.find((o) => o.id === 'abbey-takes-children')!,
    ).some((stake) => /Comes due/.test(stake.text)),
  )
  const back = finishDay(
    onDay(1, 33, {
      flags: ['d30-children-to-abbey'],
      dues: [{ id: 'abbey-wagons-return', day: 34, from: 30 }],
    }),
  )
  assert.ok(back.report.events.some((e) => /Forty-one children/.test(e)))
  // Marrow and Hester remember the week; the first match is the fullest.
  const marrow = act3('d30-terms').beats!.find((b) => b.id === 'marrow')!
  const marrowSays = (flags: string[]) =>
    sceneLines({ flags }, marrow)
      .map((line) => (typeof line === 'string' ? line : line.text))
      .join(' ')
  assert.match(marrowSays(['d23-tam-visited']), /Tam Coldbrook asked/)
  assert.match(
    marrowSays(['abbess-honored', 'd24-form-letter-told']),
    /remembers how this court honoured her.*Bett Ormond sleeps/,
  )
  assert.match(
    marrowSays(['d23-tam-visited', 'abbess-honored']),
    /Tam Coldbrook asked/,
    'one aside per group, by priority',
  )
  assert.doesNotMatch(marrowSays([]), /Tam|Bett Ormond/)
  // The Watch that followed the dry well reports, and says so at the gate.
  const follow = act3('d26-friendly-raid')
    .beats!.find((b) => b.id === 'where')!
    .options.find((o) => o.id === 'follow')!
  assert.ok(
    optionStakes(onDay(1, 26), follow).some((s) =>
      /Comes due Day 28: The Watch on the dry-well road/.test(s.text),
    ),
  )
  assert.match(
    sceneLines({ flags: ['d26-dry-well-followed'] }, act3('d30-terms'))
      .map((line) => (typeof line === 'string' ? line : line.text))
      .join(' '),
    /eleven people go by on a rope/,
  )
  // Keeping the orphans from the Abbey fills the Yard after the act's end.
  const writ = act3('d25-the-abbess').beats!.find((b) => b.id === 'offer')!
  assert.ok(
    optionStakes(
      onDay(1, 25, { brass: 100 }),
      writ.options.find((o) => o.id === 'refuse-writ')!,
    ).some((s) => /Comes due Day 31: Orphans at the Yard gate/.test(s.text)),
  )
  // Act III's dues all belong to answers somebody can give.
  for (const id of [
    'midnight-visit',
    'census-clerk-report',
    'dry-well-watch',
    'war-orphans',
    'quiet-watch-report',
    'abbey-wagons-return',
  ]) {
    assert.ok(dueDef(id), id)
    assert.ok(
      DAYS.some((def) =>
        def.audiences.some((a) =>
          act3Options(a).some((o) => o.effects.schedule?.includes(id)),
        ),
      ),
      `${id} is scheduled by an answer`,
    )
  }

  // The epilogue remembers the war-night children and Bett Ormond.
  const told = (flags: string[], ending: EndingId = 'open-roads') =>
    epilogueFor({ ...onDay(1, 50), flags }, ending).map((e) => e.subject.id)
  assert.ok(told(['d30-children-to-abbey']).includes('war-children'))
  assert.ok(told(['d24-letter-read-kindly']).includes('ormond'))
  assert.ok(!told([]).includes('yard-sisters'), 'only in the Yard branch')
  assert.ok(told(['d23-sisters-welcome']).includes('yard-sisters'))
  assert.match(
    epilogueFor(
      { ...onDay(1, 50), flags: ['d30-children-to-abbey'] },
      'long-night',
    ).find((e) => e.subject.id === 'war-children')!.variant.text,
    /singing/,
  )
}

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
assert.equal(injuryDaysLeft(finishDay(sore(['F008'])).run, 'F001'), 0)
assert.equal(injuryDaysLeft(finishDay(sore([])).run, 'F001'), 0)
// Reads the Wind: Nera marks the false briefing, but not Komodo's own lie.
const marks = (day: number, ids: string[]) =>
  DAYS.find((def) => def.day === day)!.briefings.map((b) =>
    forecastMark(withCast(1, day, ids), b),
  )
assert.deepEqual(marks(1, ['F006']), [null, 'false', null])
assert.deepEqual(marks(7, ['F006']), [null, 'unreadable', null])
assert.deepEqual(marks(1, ['F001']), [null, null, null])

{
  // --- The fifty briefings (t-013) ---------------------------------------------
  // The lie moves: every slot carries it on at least ten days, never four days
  // running, and Act I already uses all three.
  const lieSlots = DAYS.map((def) => def.briefings.findIndex((b) => !b.truth))
  for (const slot of [0, 1, 2])
    assert.ok(
      lieSlots.filter((entry) => entry === slot).length >= 10,
      `slot ${slot + 1} holds the lie often enough`,
    )
  for (let i = 3; i < lieSlots.length; i += 1)
    assert.ok(
      new Set(lieSlots.slice(i - 3, i + 1)).size > 1,
      `days ${i - 2}–${i + 1} keep the lie in one slot`,
    )
  assert.equal(new Set(lieSlots.slice(0, 10)).size, 3, 'Act I rotates the lie')
  // Stark reports: no soft words in what the runners say or what hindsight shows.
  const SOFT_WORDS =
    /\b(eerie|sinister|lovely|gentle|gently|very|seems to|something like|a little too)\b/i
  for (const def of DAYS) {
    assert.equal(new Set(def.briefings.map((b) => b.id)).size, 3, `${def.day}`)
    for (const report of def.briefings) {
      const texts = [
        report.text,
        report.hindsight ?? '',
        ...(report.variants ?? []).map((v) => v.text ?? ''),
      ]
      for (const text of texts)
        assert.ok(!SOFT_WORDS.test(text), `${report.id}: stark prose`)
      if (report.komodoLie) {
        assert.ok(def.day <= 40, `${report.id}: he lies only while at court`)
        assert.ok(/Komodo’s/.test(report.source), `${report.id}: his runner`)
        assert.ok(
          (report.hindsight?.length ?? 0) >= 40,
          `${report.id}: what was true instead`,
        )
      } else assert.equal(report.hindsight, undefined, report.id)
    }
  }
  // Every [K] day of the anchor calendar before the betrayal carries his lie.
  for (const day of [7, 17, 25, 32, 38])
    assert.ok(
      DAYS.find((def) => def.day === day)!.briefings.some((b) => b.komodoLie),
      `day ${day} is a Komodo day`,
    )
  // Early lies are flavor: a briefing has no effects, and the first lie he tells
  // himself comes only after the court has had a week to learn the reports.
  assert.ok(
    DAYS.filter((def) => def.day < 7).every((def) =>
      def.briefings.every((b) => !b.komodoLie),
    ),
  )

  // Conditional variants read only story flags that earlier days settle, so a
  // report says the same thing all day, after a reload and after a rewind.
  type FlagSource = {
    audienceDays: number[]
    laterDays: number[]
    talk: boolean
    cleared: boolean
  }
  const flagSources = new Map<string, FlagSource>()
  const flagSource = (flag: string): FlagSource => {
    let entry = flagSources.get(flag)
    if (!entry) {
      entry = { audienceDays: [], laterDays: [], talk: false, cleared: false }
      flagSources.set(flag, entry)
    }
    return entry
  }
  const noteEffects = (
    effects: { flags?: string[]; clearFlags?: string[] } | undefined,
    mark: (entry: FlagSource) => void,
  ) => {
    for (const flag of effects?.flags ?? []) mark(flagSource(flag))
    for (const flag of effects?.clearFlags ?? [])
      flagSource(flag).cleared = true
  }
  // Quest results land at a later dawn, never in the middle of a day.
  const noteQuest = (id: string, day: number) => {
    const quest = questDef(id)
    if (!quest) return
    for (const effects of [
      quest.rewards.triumph,
      quest.rewards.success,
      quest.rewards.partial,
      quest.rewards.failure,
      quest.expired,
    ])
      noteEffects(effects, (entry) => entry.laterDays.push(day + 1))
  }
  const sceneOptions = (scene: {
    options: AudienceOption[]
    beats?: { options: AudienceOption[] }[]
  }) => [...scene.options, ...(scene.beats ?? []).flatMap((b) => b.options)]
  for (const def of DAYS) {
    for (const id of def.quests) noteQuest(id, def.day)
    for (const audience of def.audiences)
      for (const option of sceneOptions(audience)) {
        flagSource(`chose:${audience.id}:${option.id}`).audienceDays.push(
          def.day,
        )
        noteEffects(option.effects, (entry) => entry.audienceDays.push(def.day))
        for (const id of option.postsQuests ?? []) noteQuest(id, def.day)
      }
  }
  for (const quest of QUEST_TEMPLATES) noteQuest(quest.id, 1)
  // A due with a fixed day sets its flags at that dawn (t-040).
  for (const due of DUES)
    if (due.day && !due.every)
      // t-035: an unpaid or lapsed due sets its flags at that same dawn.
      for (const effects of [
        due.effects,
        due.unpaid?.effects,
        due.lapsed?.effects,
      ])
        noteEffects(effects, (entry) => entry.laterDays.push(due.day!))
  for (const talk of TALKS) {
    flagSource(`heard:${talk.id}`).talk = true
    for (const option of sceneOptions(talk)) {
      flagSource(`talk:${talk.id}:${option.id}`).talk = true
      noteEffects(option.effects, (entry) => {
        entry.talk = true
      })
    }
  }
  // The Day 41 dawn sets the betrayal and the host.
  const HIDEOUT_IDS = [
    'mole-tunnels',
    'crow-cave',
    'bell-cellars',
    'wagon-circle',
    'moving-caravan',
    'freehold-barn',
    'rail-station',
    'nameless-cave',
  ]
  for (const flag of [
    BETRAYAL_FLAG,
    ...HIDEOUT_IDS.map((h) => `hideout:${h}`),
    ...BUYER_IDS.map((b) => `buyer:${b}`),
  ])
    flagSource(flag).laterDays.push(41)

  let variantCount = 0
  const variantFlags = new Set<string>()
  for (const def of DAYS)
    for (const report of def.briefings)
      for (const variant of report.variants ?? []) {
        variantCount += 1
        const keys = [...(variant.flags ?? []), ...(variant.notFlags ?? [])]
        assert.ok(keys.length > 0, `${report.id}: a variant is keyed`)
        assert.ok(variant.source || variant.text, `${report.id}: it changes`)
        assert.notEqual(variant.text, report.text, report.id)
        for (const flag of variant.flags ?? []) variantFlags.add(flag)
        for (const flag of keys) {
          const entry = flagSources.get(flag)
          assert.ok(entry, `${report.id}: ${flag} is set somewhere`)
          assert.ok(
            entry.audienceDays.every((day) => day < def.day),
            `${report.id}: ${flag} cannot change on Day ${def.day} or later`,
          )
          assert.ok(!entry.talk, `${report.id}: ${flag} is not a barracks flag`)
          assert.ok(!entry.cleared, `${report.id}: ${flag} is never cleared`)
          assert.ok(
            entry.audienceDays.some((day) => day < def.day) ||
              entry.laterDays.some((day) => day <= def.day),
            `${report.id}: ${flag} can be earned before Day ${def.day}`,
          )
        }
      }
  assert.ok(variantCount >= 30, `${variantCount} conditional briefings`)
  assert.ok(
    DAYS.filter((def) => def.briefings.some((b) => b.variants?.length))
      .length >= 15,
    'variants spread across the campaign',
  )

  // The first matching variant wins, and the lie stays where it was.
  const briefed = (day: number, flags: string[]) =>
    dayBriefings(onDay(1, day, { flags }))!
  assert.equal(
    briefed(26, [])[2]!.source,
    'Granny Umber’s cell',
    'no flag, no variant',
  )
  assert.equal(
    briefed(26, ['mole-messenger-arrested', 'moles-blamed'])[2]!.source,
    'Chalk on the postern gate',
  )
  assert.match(briefed(26, ['moles-blamed'])[2]!.text, /the Ford/)
  assert.match(
    briefed(12, ['mire-road-closed', 'mire-quiet-count'])[2]!.text,
    /the road the crown closed/,
  )
  assert.match(
    briefed(12, ['mire-road-closed', 'd03-mire-road-reopened'])[2]!.text,
    /^Lanterns move through the empty fen again\. In step\.$/,
    'notFlags: a reopened road reads as plain',
  )
  // The Eye still finds exactly one lie, whichever variant a run reads.
  const eyeRun = (day: number) => ({
    ...onDay(1, day, { flags: [...variantFlags] }),
    equippedRelics: ['eye-of-elder-crow'],
  })
  for (const def of DAYS) {
    const run = eyeRun(def.day)
    const reports = dayBriefings(run)!
    assert.equal(
      reports.filter((b) => eyeReveals(run, b.truth)).length,
      1,
      `day ${def.day}: the Eye marks one report`,
    )
    assert.deepEqual(
      reports.map((b) => [b.id, b.truth, b.komodoLie]),
      def.briefings.map((b) => [b.id, b.truth, b.komodoLie]),
    )
  }
  assert.match(
    dayBriefings(eyeRun(22))!.find((b) => eyeReveals(eyeRun(22), b.truth))!
      .text,
    /whole choir/,
    'the Eye marks the variant text of a lie',
  )
  // Act V names the host who briefs you.
  const hostSources = HIDEOUT_IDS.map(
    (h) => briefed(42, [BETRAYAL_FLAG, `hideout:${h}`])[1]!.source,
  )
  assert.equal(new Set(hostSources).size, HIDEOUT_IDS.length)
  assert.ok(!hostSources.includes('Your host'))
  assert.equal(
    briefed(41, [BETRAYAL_FLAG, 'hideout:mole-tunnels'])[2]!.source,
    'Mole sappers at the listening holes',
  )

  // A real run: arrest Granny Umber on Day 17 and the Day 26 truce report reads
  // differently, the same after an audience, a reload and a rewind. Rewinding to
  // Day 17 and opening talks instead changes it back.
  let briefBook = newBook(createRun(5))
  while (briefBook.current.day < 26) {
    let run = briefBook.current
    if (run.day === 17)
      run = chooseAudienceOption(run, 'd17-manifesto', 'arrest').run
    briefBook = recordDawn(briefBook, finishDay(run).run)
  }
  const truceReport = (run: FortressRun) => dayBriefings(run)![2]!
  assert.equal(
    truceReport(briefBook.current).source,
    'Chalk on the postern gate',
  )
  const afterAudience = chooseAudienceOption(
    briefBook.current,
    'd26-friendly-raid',
    'decline',
  ).run
  assert.deepEqual(dayBriefings(afterAudience), dayBriefings(briefBook.current))
  assert.deepEqual(
    dayBriefings(decodeBook(encodeBook(briefBook))!.current),
    dayBriefings(briefBook.current),
    'a reload reads the same reports',
  )
  assert.deepEqual(
    dayBriefings(rewindTo(briefBook, 26).current),
    dayBriefings(briefBook.current),
    'a rewound dawn reads the same reports',
  )
  let talksBook = rewindTo(briefBook, 17)
  talksBook = updateCurrent(
    talksBook,
    chooseAudienceOption(talksBook.current, 'd17-manifesto', 'meet').run,
  )
  while (talksBook.current.day < 26)
    talksBook = recordDawn(talksBook, finishDay(talksBook.current).run)
  assert.equal(truceReport(talksBook.current).source, 'Granny Umber’s cell')

  // Hindsight: once Komodo has gone, the Archive reads his lies back.
  assert.deepEqual(komodoLiesInHindsight(onDay(1, 40)), [], 'not before')
  const betrayed = finishDay(
    onDay(1, 40, { flags: ['d38-rosters-changed'] }),
  ).run
  assert.ok(betrayed.flags.includes(BETRAYAL_FLAG))
  const hindsight = komodoLiesInHindsight(betrayed)
  assert.deepEqual(
    hindsight.map((entry) => entry.day),
    [7, 17, 25, 29, 32, 37, 38, 40],
  )
  assert.ok(hindsight.every((entry) => entry.briefing.komodoLie))
  assert.match(
    hindsight.at(-1)!.briefing.text,
    /new rosters/,
    'hindsight shows the report as this run heard it',
  )
}

// --- The Mole Revolutionaries (t-016) ----------------------------------------
{
  const dayOf = (day: number) => DAYS.find((def) => def.day === day)!
  const audienceOn = (day: number, id: string) =>
    dayOf(day).audiences.find((audience) => audience.id === id)!
  const MOLE_AUDIENCES: [number, string][] = [
    [21, 'd21-fen-weir'],
    [32, 'd32-reform-list'],
    [33, 'd33-sappers'],
    [44, 'd44-coal-powder'],
    [50, 'd50-burrows'],
  ]
  // New audiences come after the day's existing ones, and no day holds more
  // than four.
  for (const [day, id] of MOLE_AUDIENCES) {
    assert.equal(dayOf(day).audiences.at(-1)!.id, id, `${id} comes last`)
    assert.ok(dayOf(day).audiences.length <= 4, `day ${day} audiences`)
  }
  const allOptions = (audience: AudienceDef) => [
    ...audience.options,
    ...(audience.beats ?? []).flatMap((beat) => beat.options),
  ]
  // Every flag on the reconciliation track is earned somewhere in the story.
  const earned = new Set<string>()
  for (const def of DAYS)
    for (const audience of def.audiences)
      for (const option of allOptions(audience))
        for (const flag of option.effects.flags ?? []) earned.add(flag)
  for (const talk of TALKS)
    for (const option of [
      ...talk.options,
      ...(talk.beats ?? []).flatMap((beat) => beat.options),
    ])
      for (const flag of option.effects.flags ?? []) earned.add(flag)
  for (const flag of [...MOLE_CONCESSIONS, ...MOLE_GRIEVANCES])
    assert.ok(earned.has(flag), `${flag} can be earned`)
  assert.equal(
    new Set([...MOLE_CONCESSIONS, ...MOLE_GRIEVANCES]).size,
    MOLE_CONCESSIONS.length + MOLE_GRIEVANCES.length,
    'a flag is a concession or a grievance, never both',
  )
  // Named leaders, each on stage somewhere.
  const spoken = DAYS.flatMap((def) =>
    def.audiences.flatMap((audience) => [
      audience.speaker,
      ...[audience.lines, ...(audience.beats ?? []).map((b) => b.lines)]
        .flat()
        .map((line) => (typeof line === 'string' ? line : line.who)),
    ]),
  ).join('\n')
  assert.ok(MOLE_LEADERS.length >= 5)
  for (const leader of MOLE_LEADERS) {
    const surname = leader.name.split(' ').at(-1)!
    assert.ok(spoken.includes(surname), `${leader.name} appears`)
    if (leader.npc) assert.ok(npcDef(leader.npc), leader.npc)
    if (leader.follower)
      assert.equal(followerDef(leader.follower)?.origin, 'moles')
  }
  // Anti-witch dilemmas teeter: the burrows' gain is the fen's loss and the
  // other way round, and there is a third road that costs something else.
  for (const id of ['d33-sappers', 'd44-coal-powder']) {
    const [day] = MOLE_AUDIENCES.find(([, aud]) => aud === id)!
    const options = allOptions(audienceOn(day, id))
    const moles = (o: AudienceOption) => o.effects.affinity?.moles ?? 0
    const fen = (o: AudienceOption) => o.effects.affinity?.['mire-mothers'] ?? 0
    assert.ok(
      options.some((o) => moles(o) > 0 && fen(o) < 0),
      `${id} burrows`,
    )
    assert.ok(
      options.some((o) => fen(o) > 0 && moles(o) < 0),
      `${id} fen`,
    )
    assert.ok(
      options.some(
        (o) => moles(o) >= 0 && fen(o) >= 0 && moles(o) + fen(o) > 0,
      ),
      `${id} has a road between`,
    )
  }
  assert.ok(
    allOptions(audienceOn(21, 'd21-fen-weir')).some(
      (o) =>
        (o.effects.affinity?.moles ?? 0) > 0 &&
        (o.effects.affinity?.['mire-mothers'] ?? 0) < 0,
    ),
    'blowing the weir costs the fen',
  )

  // The standing gate: Lumen's reform list waits for two real concessions,
  // and the whole assembly turns out on Day 50 only for five.
  const reformDay = (flags: string[]) =>
    audiencesToday(onDay(1, 32, { flags })).some(
      (audience) => audience.id === 'd32-reform-list',
    )
  assert.ok(!reformDay([]))
  assert.ok(!reformDay(['mole-talks-opened', 'moles-blamed']))
  assert.ok(reformDay(['mole-talks-opened', 'mole-truce']))
  assert.deepEqual(
    unmetRequirements(onDay(1, 32), { standing: MOLE_REFORMS_OPEN }),
    ['Not yet possible'],
  )
  const burrowsDay = (count: number) =>
    audiencesToday(
      onDay(1, 50, { flags: MOLE_CONCESSIONS.slice(0, count) }),
    ).some((audience) => audience.id === 'd50-burrows')
  assert.ok(!burrowsDay(4))
  assert.ok(burrowsDay(5))
  // Two reforms bring Lumen Shale to the barracks; the second offers only
  // reforms not yet granted.
  let reforms = onDay(1, 32, { flags: ['mole-talks-opened', 'mole-truce'] })
  reforms = chooseAudienceOption(reforms, 'd32-reform-list', 'councils').run
  const second = audienceScene(
    reforms,
    audienceOn(32, 'd32-reform-list'),
  ).options.filter((o) => optionVisible(reforms, o))
  assert.deepEqual(
    second.map((o) => o.id),
    ['second-ledger', 'second-sedition', 'one'],
  )
  reforms = chooseAudienceOption(
    reforms,
    'd32-reform-list',
    'second-sedition',
  ).run
  assert.ok(reforms.recruitable.includes('F010'), 'Lumen will join')
  assert.ok(
    ['d32-reform-councils', 'd32-reform-sedition'].every((f) =>
      reforms.flags.includes(f),
    ),
  )
  // A crown that frees Granny Umber on Day 21 is not blamed for her on Day 26.
  const freed = chooseAudienceOption(
    onDay(1, 21, { flags: ['mole-messenger-arrested'] }),
    'd21-fen-weir',
    'free-umber',
  ).run
  assert.notEqual(
    dayBriefings({ ...freed, day: 26 })![2]!.source,
    'Chalk on the postern gate',
  )
  // The accord reads the whole track.
  assert.equal(moleAccord(onDay(1, 30)).standing, 'wary')
  assert.equal(
    moleAccord({ flags: ['mole-messenger-arrested', 'moles-blamed'] }).standing,
    'enemies',
  )
  assert.equal(
    moleAccord({ flags: MOLE_CONCESSIONS.slice(0, 7) }).standing,
    'reconciled',
  )
  assert.equal(
    moleAccord({
      flags: [...MOLE_CONCESSIONS.slice(0, 7), ...MOLE_GRIEVANCES.slice(0, 4)],
    }).standing,
    'talking',
    'wrongs weigh against deeds',
  )

  // Day 50 endings remember the burrows.
  const moleEnding = (flags: string[], ending: EndingId) =>
    epilogueFor({ ...onDay(1, 50), flags }, ending).find(
      (entry) => entry.subject.id === 'moles',
    )?.variant.text ?? ''
  const coalEnding = (flags: string[], ending: EndingId) =>
    epilogueFor({ ...onDay(1, 50), flags }, ending).find(
      (entry) => entry.subject.id === 'coal-harrow',
    )?.variant.text ?? ''
  assert.match(moleEnding(['d44-dike-blown'], 'witchwater-throne'), /lake/)
  assert.match(moleEnding([], 'witchwater-throne'), /underground/)
  assert.match(moleEnding(['d50-moles-dig'], 'open-roads'), /two hundred/)
  assert.match(
    moleEnding(MOLE_CONCESSIONS.slice(0, 7), 'bell-restored'),
    /ceasefire/,
  )
  assert.match(moleEnding([], 'iron-peace'), /burrow mouth/)
  assert.match(coalEnding(['d33-coal-disowned'], 'open-roads'), /east/)
  assert.match(coalEnding([], 'open-roads'), /powder/)
  assert.match(coalEnding([], 'long-night'), /fuse/)
}

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
// Every follower has shipped art: the original twenty, and the five secret
// recruits F021-F025 (conductor SECRET-FOLLOWERS-ROUND-1, exported 2026-10-26).
for (const def of FOLLOWERS.slice(0, 25)) {
  assert.ok(castArtUrl(`followers/${def.id}/illustrated/neutral`), def.id)
  assert.ok(castArtUrl(`followers/${def.id}/portrait/neutral`), def.id)
}
// These newly identified audience faces have private Arthemy requests in Conductor.
// Never claim their art shipped before the actual export has been registered.
const queuedAudienceArt = new Set([
  'conclave-messenger',
  'jackalwire-toll-captain',
  'aldous-hopper',
  'mirefen-reed-cutter',
  'saltroad-tincture-factor',
  'jackalwire-wagon-painter',
  'storm-crow-envoy',
])
for (const def of NPCS) {
  const art = castArtUrl(`npcs/${def.slug}/illustrated/neutral`)
  if (queuedAudienceArt.has(def.slug)) continue
  assert.ok(art, def.slug)
}
assert.equal(queuedAudienceArt.size, 7)
assert.ok(castArtUrl('npcs/young-komodo/illustrated/betrayal'))
// The full t-012 set: 25 followers x 8 images, 17 NPCs x 5 moods, the betrayal.
assert.equal(CAST_ART.length, 25 * 8 + 17 * 5 + 1)
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
// The quiet word is a room the player walks into (t-038 R8): no answer
// closes it before the physician question.
const quietWord = (
  run: FortressRun,
  path: string[] = ['sit', 'ask', 'ask-me', 'leave'],
): FortressRun =>
  path.reduce(
    (state, option) =>
      chooseAudienceOption(state, 'd40-quiet-word', option).run,
    run,
  )
const lastNight = quietWord(onDay(1, 40))
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
const betrayed = finishDay(quietWord(onDay(1, 40))).run
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
// t-040: the Bell's peace needs the bell to have rung.
assert.equal(
  ended(['horror-sealed', 'peace-bell', 'bell-rung']),
  'bell-restored',
)
assert.equal(
  ended(['horror-sealed', 'peace-bell']),
  'open-roads',
  'a Bell peace whose bell never rang comes home as Open Roads',
)
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
      [...a.options, ...(a.beats ?? []).flatMap((b) => b.options)].flatMap(
        (o) => o.effects.flags ?? [],
      ),
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

// --- quest room board (t-022) -------------------------------------------------
{
  // Tier odds are a full distribution; Heeded Omens leaves no failure.
  for (const chance of [5, 37, 60, 95]) {
    for (const party of [
      { lucky: false, encore: false, omen: false },
      { lucky: true, encore: true, omen: false },
      { lucky: false, encore: false, omen: true },
    ]) {
      const odds = tierOdds(chance, party)
      const total = Object.values(odds).reduce((sum, p) => sum + p, 0)
      assert.ok(Math.abs(total - 1) < 1e-9, `tiers sum to one at ${chance}%`)
      assert.ok(Object.values(odds).every((p) => p >= 0))
      if (party.omen) assert.equal(odds.failure, 0)
    }
  }
  // Danger is printed with its wound range; a lethal mark is explicit.
  const convoy = questDef('q-d09-iron-convoy')!
  assert.match(dangerLine(convoy), /wounds 3–8 days · Lethal$/)
  assert.doesNotMatch(dangerLine(questDef('q-d01-well-road')!), /Lethal/)
  // Honest odds: the shown wound and death chances match what play does.
  const weak = previewQuest(onDay(1, 9), 'q-d09-iron-convoy', ['F003', 'F004'])
  assert.ok(weak.deathChance > 0, 'a lethal quest shows a death chance')
  let wounded = 0
  let died = 0
  for (let seed = 1; seed <= 400; seed += 1) {
    let run = assignQuest(onDay(seed, 9), 'q-d09-iron-convoy', ['F003', 'F004'])
    run = finishDay(run).run
    const report = finishDay(run).report.quests.find(
      (q) => q.questId === 'q-d09-iron-convoy',
    )!
    wounded += report.injuries.length + report.deaths.length
    if (report.deaths.length) died += 1
  }
  assert.ok(
    Math.abs(wounded / 8 - weak.injuryRisk) <= 8,
    `wound risk is honest (${weak.injuryRisk}% shown, ${wounded / 8}% played)`,
  )
  assert.ok(
    Math.abs(died / 4 - weak.deathChance) <= 5,
    `death risk is honest (${weak.deathChance}% shown, ${died / 4}% played)`,
  )
  // No lethal marker, no death chance; Last Wall shows nobody dies.
  const warded = previewQuest(
    withCast(1, 9, ['F003', 'F013']),
    'q-d09-iron-convoy',
    ['F003', 'F013'],
  )
  assert.equal(warded.deathChance, 0, 'Last Wall shows a zero death chance')
  const repairOdds = previewQuest(repaired, 'q-d01-aqueduct-repair', ['F002'])
  assert.equal(repairOdds.deathChance, 0, 'not lethal, no death chance')
  assert.ok(repairOdds.injuryRisk >= 0 && repairOdds.injuryRisk <= 100)

  // Requirement bands: hidden needs stay "?" until the Lamplight reads them.
  const blindBoard = previewQuest(inspecting, 'q-d01-mirefen-inspect', [])
  assert.equal(blindBoard.perRequirement[1]?.hidden, true, '? on the notice')
  assert.equal(blindBoard.perRequirement[1]?.needed, 0, 'a ? hides its need')
  const archive = { ...inspecting, local: { ...inspecting.local } }
  archive.local.lamplight = LAMPLIGHT_SIGHT
  const read = previewQuest(archive, 'q-d01-mirefen-inspect', ['F003'])
  assert.equal(read.estimate, false, 'the Lamplight Archive reads the ?')
  assert.ok(read.perRequirement.every((req) => !req.hidden && req.needed > 0))

  // Expiry: the countdown, and the consequence stated before it happens.
  const day1 = createRun(42)
  const well = day1.board.find((entry) => entry.questId === 'q-d01-well-road')!
  const wellExpiry = expiryInfo(day1, questDef(well.questId)!, well.lastDay)
  assert.equal(wellExpiry.daysLeft, 2)
  assert.equal(wellExpiry.countdown, '2 days left')
  assert.match(wellExpiry.consequence, /^If nobody goes: The Yard −2\.$/)
  assert.ok(wellExpiry.punishes)
  const tonight = expiryInfo(day1, questDef(well.questId)!, day1.day)
  assert.equal(tonight.countdown, 'Last day')
  assert.equal(tonight.when, 'Comes down tonight.')
  const quiet = expiryInfo(
    day1,
    { ...questDef(well.questId)!, expired: {} },
    well.lastDay,
  )
  assert.ok(!quiet.punishes, 'not every expiry punishes')
  assert.match(quiet.consequence, /passes/)
  // Board lines never print hidden strength or a fogged faction's name.
  const lines = effectLines(day1, {
    strength: { 'storm-crows': -2 },
    affinity: { rustline: 5 },
  })
  assert.ok(lines.every((line) => !/\d/.test(line) && !/Rustline/.test(line)))
  assert.ok(rewardLines(day1, questDef('q-d01-well-road')!).length > 0)

  // What counts: faction modifiers and known traits are listed; unknown
  // secrets are not, so they can surprise.
  const engine = withCast(1, 13, ['F002'])
  engine.board = [{ questId: 'q-d13-water-engine', postedDay: 13, lastDay: 14 }]
  const engineQuest = questDef('q-d13-water-engine')!
  const silent = partyModifiers(engine, engineQuest, ['F002'], [])
  assert.ok(
    !silent.some((mod) => mod.label === 'The Welded Insignia'),
    'a hidden allegiance is not listed',
  )
  const told = earnFlag(engine, 'talk-saffron-insignia')
  assert.ok(
    partyModifiers(told, engineQuest, ['F002'], []).some(
      (mod) => mod.label === 'The Welded Insignia' && mod.amount === 2,
    ),
    'a revealed allegiance is listed',
  )
  // Hidden modifiers apply silently: play counts the allegiance the preview
  // could not show.
  const shown = previewQuest(engine, 'q-d13-water-engine', ['F002'])
  const truth = previewQuest(
    engine,
    'q-d13-water-engine',
    ['F002'],
    ['F002-welded-insignia', 'F002-bridge-builder'],
  )
  const played = finishDay(
    finishDay(assignQuest(engine, 'q-d13-water-engine', ['F002'])).run,
  ).report.quests.find((q) => q.questId === 'q-d13-water-engine')!
  assert.ok(truth.chance > shown.chance, 'the secret is worth something')
  assert.equal(played.chance, truth.chance, 'play counts every secret')

  // Warnings inform and never block: a short, lethal party can still go.
  const short = previewQuest(onDay(1, 9), 'q-d09-iron-convoy', ['F003', 'F004'])
  const warnings = sendWarnings(
    onDay(1, 9),
    convoy,
    short,
    partyModifiers(onDay(1, 9), convoy, ['F003', 'F004'], []),
  )
  assert.ok(warnings.some((w) => /^Short on Might/.test(w)))
  assert.ok(warnings.some((w) => /^Lethal\. About \d+%/.test(w)))
  assert.ok(
    assignQuest(onDay(1, 9), 'q-d09-iron-convoy', ['F003', 'F004']),
    'warnings never block Send',
  )
  const late = onDay(1, 50)
  late.board = [{ questId: 'q-d09-iron-convoy', postedDay: 50, lastDay: 50 }]
  assert.ok(
    sendWarnings(
      late,
      convoy,
      previewQuest(late, 'q-d09-iron-convoy', ['F003', 'F004']),
      [],
    ).some((w) => /before the reign ends/.test(w)),
  )
  // Send and withdraw the same day restores the notice and its countdown.
  const sentToday = assignQuest(day1, 'q-d01-well-road', ['F001'])
  const back = withdrawQuest(sentToday, 'q-d01-well-road')
  assert.deepEqual(
    back.board.find((entry) => entry.questId === 'q-d01-well-road'),
    well,
  )
  assert.throws(
    () => withdrawQuest(finishDay(sentToday).run, 'q-d01-well-road'),
    /only today/,
  )
}

// --- Codex (t-023) --------------------------------------------------------------
{
  // Only follower trait ids enter the Codex: never items, brass or
  // relationships, whatever the stored record claims.
  assert.ok(isCodexId('F002-welded-insignia'))
  assert.ok(!isCodexId(ITEMS[0]!.id), 'an item id is not a Codex entry')
  assert.ok(!isCodexId('brass') && !isCodexId('F001'))
  const smuggled = decodeCodex(
    JSON.stringify({
      version: 1,
      revealed: ['F002-bridge-builder', ITEMS[0]!.id, 'brass', 'romance:F001'],
      brass: 900,
      items: [ITEMS[0]!.id],
      relationships: { F001: 'beloved' },
    }),
  )!
  assert.deepEqual(smuggled, { version: 1, revealed: ['F002-bridge-builder'] })
  assert.deepEqual(Object.keys(smuggled).sort(), ['revealed', 'version'])
  const merged = mergeCodex(smuggled, [ITEMS[0]!.id, 'brass'])
  assert.equal(merged, smuggled, 'merging non-traits changes nothing')
  assert.equal(CODEX_SIZE, FOLLOWERS.flatMap((def) => def.traits).length)

  // The six talk-revealed allegiances all reach the Codex from their flags.
  const TALK_FLAGS: Record<string, string> = {
    'talk-saffron-insignia': 'F002-welded-insignia',
    'talk-pip-ledger': '',
    'talk-tamsin-bonds': '',
    'talk-teodor-letters': '',
    'talk-isolde-coven': '',
    'talk-sable-flight': '',
  }
  for (const flag of Object.keys(TALK_FLAGS)) {
    const trait = FOLLOWERS.flatMap((def) => def.traits).find(
      (t) => t.revealFlag === flag,
    )
    assert.ok(trait, `${flag} reveals an allegiance`)
    assert.equal(trait.kind, 'allegiance')
    if (TALK_FLAGS[flag]) assert.equal(trait.id, TALK_FLAGS[flag])
    const run = earnFlag(createRun(5), flag)
    assert.deepEqual(allegiancesKnown(run), [trait.id])
    assert.ok(
      mergeCodex(
        { version: 1 as const, revealed: [] },
        allegiancesKnown(run),
      ).revealed.includes(trait.id),
    )
    assert.ok(revealLine(trait.id).includes(trait.name))
  }

  // A quest whose reward speaks the flag reveals the allegiance at dawn.
  const pack = withCast(3, 13, ['F002'])
  pack.board = [{ questId: 'q-d13-water-engine', postedDay: 13, lastDay: 14 }]
  let revealedAtDawn = 0
  for (let seed = 1; seed <= 40; seed += 1) {
    const run = { ...pack, seed }
    const night = finishDay(
      finishDay(assignQuest(run, 'q-d13-water-engine', ['F002'])).run,
    )
    const report = night.report.quests.find(
      (q) => q.questId === 'q-d13-water-engine',
    )!
    const won = report.tier === 'success' || report.tier === 'triumph'
    assert.equal(
      report.revealedTraits.includes('F002-welded-insignia'),
      won,
      'the engine tells the Pack’s secret only when it runs',
    )
    if (won) {
      revealedAtDawn += 1
      assert.match(
        howLearned(night.run, 'F002-welded-insignia'),
        /^The Pack’s Water Engine, dawn of Day 15\.$/,
      )
    }
    // Already in the Codex: not revealed twice.
    const again = finishDay(
      finishDay(assignQuest(run, 'q-d13-water-engine', ['F002'])).run,
      ['F002-welded-insignia'],
    ).report.quests.find((q) => q.questId === 'q-d13-water-engine')!
    assert.ok(!again.revealedTraits.includes('F002-welded-insignia'))
  }
  assert.ok(revealedAtDawn > 0, 'the engine runs on some seeds')

  // The Codex lives outside the run: a new run and a rewind keep it, and no
  // save book carries it.
  const codexNow = mergeCodex({ version: 1 as const, revealed: [] }, [
    'F001-reads-the-ruts',
    'F002-welded-insignia',
  ])
  const raw = JSON.stringify(codexNow)
  const fresh = createRun(99)
  const book = recordDawn(newBook(fresh), finishDay(fresh).run)
  const rewound = rewindTo(book, 1)
  assert.ok(!JSON.stringify(rewound).includes('"revealed"'))
  assert.deepEqual(decodeCodex(raw), codexNow, 'the Codex survives as stored')
  // Known traits show in a new run's preview without being learned again.
  const knownPreview = previewQuest(
    chooseAudienceOption(fresh, 'd01-aqueduct', 'repair').run,
    'q-d01-aqueduct-repair',
    ['F002'],
    ['F002-bridge-builder'],
  )
  assert.ok(knownPreview.perRequirement[0]!.total >= 12)
  assert.equal(
    howLearned(fresh, 'F001-reads-the-ruts'),
    'Learned in another reign, or on a road you rewound.',
  )
  // Pages: one per follower with anything learned, hidden count honest.
  const pages = codexPages(codexNow, fresh)
  assert.deepEqual(
    pages.map((page) => page.follower.id),
    ['F001', 'F002'],
  )
  assert.equal(
    pages[1]!.unknown,
    followerDef('F002')!.traits.length - 1,
    'secrets still hidden are counted, never named',
  )
  assert.equal(pages[1]!.entries[0]!.kindLabel, 'True allegiance')
}

// --- market (t-024) ---------------------------------------------------------
{
  // The catalog: 20-30 tools and charms, one stark line each, art-ready.
  assert.ok(ITEMS.length >= 20 && ITEMS.length <= 34, `${ITEMS.length} items`)
  assert.equal(new Set(ITEMS.map((item) => item.id)).size, ITEMS.length)
  const iconFiles = new Set(
    readdirSync('assets/icons').map((file) => file.replace(/\.svg$/, '')),
  )
  for (const item of ITEMS) {
    assert.ok(item.slot === 'tool' || item.slot === 'charm', item.id)
    assert.ok(item.price > 0 && item.price <= 80, `${item.id} price`)
    assert.ok(itemEffects(item).length > 0, `${item.id} does something`)
    assert.ok(
      item.text.length <= 72 && !item.text.includes('\n'),
      `${item.id}: one short line`,
    )
    assert.ok(
      !/\b(very|lovely|gentle|eerie|sinister|seems to)\b/i.test(item.text),
      `${item.id}: stark prose`,
    )
    assert.ok(ITEM_ICONS[item.id], `${item.id} has a placeholder glyph`)
    assert.ok(
      iconFiles.has(itemIcon(item).replace('kind-icon:', '')),
      `${item.id}: ${itemIcon(item)} exists`,
    )
    assert.ok(
      !/(fill|stroke)="#/.test(
        readFileSync(
          `assets/icons/${itemIcon(item).replace('kind-icon:', '')}.svg`,
          'utf8',
        ),
      ),
      `${item.id}: a single-colour glyph the seller tint can colour`,
    )
    if (item.ability)
      assert.ok(
        ![
          'forecast',
          'stall',
          'quartermaster',
          'thick-hide',
          'undermine',
          'many-hands',
        ].includes(item.ability.kind),
        `${item.id}: its power works from a slot`,
      )
  }
  assert.ok(ITEMS.filter((item) => item.slot === 'tool').length >= 10)
  assert.ok(ITEMS.filter((item) => item.slot === 'charm').length >= 10)
  assert.ok(
    ITEMS.filter((item) => item.onBuy).length >= 6,
    'some goods carry a price beyond brass',
  )
  assert.deepEqual(
    effectReactions(itemDef('reed-poppet')!.onBuy),
    ['The Abbey −3'],
    'the Abbey hears about Mire charms',
  )

  // Stalls turn over three times an act: days 1-3, 4-6, 7-10.
  assert.deepEqual(
    [1, 3, 4, 6, 7, 10, 11, 14, 17, 20, 41, 50].map(marketWindow),
    [0, 0, 1, 1, 2, 2, 3, 4, 5, 5, 12, 14],
  )
  assert.equal(nextRestockDay(1), 4)
  assert.equal(nextRestockDay(7), 11)
  assert.equal(nextRestockDay(50), 51)

  // Deterministic within a branch: same run, same stalls, all window long.
  const fair = createRun(4321)
  const stockOf = (run: FortressRun) => marketStock(run).join(',')
  assert.equal(stockOf(fair), stockOf(createRun(4321)))
  assert.equal(stockOf(fair), stockOf({ ...fair, day: 3 }))
  assert.ok(marketStock(fair).length >= MIN_STOCK)
  assert.ok(
    marketStock(fair).every((id) => !stockBlocker(fair, itemDef(id)!)),
    'only eligible goods are laid out',
  )
  // The stock rotates, and a rewind's new branch lays out fresh stalls.
  const windows = new Set(
    [1, 4, 7, 11, 14, 17, 21].map((day) => stockOf({ ...fair, day })),
  )
  assert.ok(windows.size >= 5, `stalls rotate (${windows.size} layouts)`)
  const branches = new Set(
    [0, 1, 2, 3, 4].map((branch) => stockOf({ ...fair, branch })),
  )
  assert.ok(branches.size >= 3, 'random stays random on a new branch')
  // A rewind through the save book rerolls the replayed window too.
  const twoDays = recordDawn(newBook(fair), finishDay(fair).run)
  const rewound = rewindTo(twoDays, 2).current
  assert.equal(rewound.branch, 1)
  assert.equal(stockOf(rewound), stockOf({ ...finishDay(fair).run, branch: 1 }))

  // The roads decide the stock: trust, reveals, wipe-outs, local support.
  const crowItems = ITEMS.filter((item) => item.faction === 'storm-crows')
  assert.ok(crowItems.length >= 2)
  for (const item of crowItems)
    assert.match(stockBlocker(fair, item) ?? '', /Storm Crow Conclave Friendly/)
  const crowFriends: FortressRun = {
    ...fair,
    affinity: { ...fair.affinity, 'storm-crows': 40 },
  }
  for (const item of crowItems)
    assert.equal(stockBlocker(crowFriends, item), null)
  // Each item rolls on its own: warming a faction only adds to the stalls
  // (beyond the MIN_STOCK top-up).
  let checked = 0
  for (let seed = 1; seed <= 20; seed += 1) {
    const cold = marketStock({ ...fair, seed })
    if (cold.length <= MIN_STOCK) continue
    const warm = new Set(marketStock({ ...crowFriends, seed }))
    for (const id of cold)
      assert.ok(warm.has(id), `${id} stays laid out when the Crows warm`)
    checked += 1
  }
  assert.ok(checked >= 5)
  const rustItems = ITEMS.filter((item) => item.faction === 'rustline')
  for (const item of rustItems)
    assert.match(stockBlocker(fair, item) ?? '', /Nobody on the map/)
  const actTwo = finishDay({ ...fair, day: 10, board: [], reports: [] }).run
  assert.equal(stockBlocker(actTwo, itemDef('rustline-cutters')!), null)
  const mireGone: FortressRun = { ...fair, wipedOut: ['mire-mothers'] }
  assert.match(
    stockBlocker(mireGone, itemDef('reed-poppet')!) ?? '',
    /gone from the map/,
  )
  for (let day = 1; day <= 40; day += 3)
    assert.ok(
      !marketStock({ ...mireGone, day }).some(
        (id) => itemDef(id)?.faction === 'mire-mothers',
      ),
      'a wiped-out faction sells nothing',
    )
  assert.match(
    stockBlocker(fair, itemDef('watch-buckler')!) ?? '',
    /Gate Watch 14/,
  )
  assert.equal(
    stockBlocker(
      { ...fair, local: { ...fair.local, 'gate-watch': 14 } },
      itemDef('watch-buckler')!,
    ),
    null,
  )
  assert.ok(stallLines(fair).length >= 1)

  // Act V: the court buys from its host's peddler.
  const hiding: FortressRun = {
    ...crowFriends,
    day: 43,
    hideout: 'crow-cave',
  }
  assert.ok(isPeddler(hiding) && !isPeddler(fair))
  assert.match(stallLines(hiding)[0] ?? '', /peddler/)
  let hostShare = 0
  let exileShare = 0
  for (let seed = 1; seed <= 30; seed += 1) {
    const stalls = marketStock({ ...hiding, seed })
    hostShare += stalls.filter(
      (id) => itemDef(id)?.faction === 'storm-crows',
    ).length
    exileShare += stalls.filter(
      (id) => itemDef(id)?.faction === 'jackalwire',
    ).length
  }
  assert.ok(
    hostShare > exileShare,
    `the host's goods travel with the court (${hostShare} vs ${exileShare})`,
  )

  // Buying: only what is laid out, once a window, and word gets out.
  const findSeedWith = (id: string, base: FortressRun): FortressRun => {
    for (let seed = 1; seed < 500; seed += 1) {
      const run = { ...base, seed }
      if (marketStock(run).includes(id)) return run
    }
    throw new Error(`no seed lays out ${id}`)
  }
  const poppetDay = findSeedWith('reed-poppet', fair)
  const poppet = buyItem(poppetDay, 'reed-poppet')
  assert.equal(poppet.brass, poppetDay.brass - itemDef('reed-poppet')!.price)
  assert.deepEqual(poppet.inventory, ['reed-poppet'])
  assert.equal(poppet.affinity.abbey, poppetDay.affinity.abbey - 3)
  assert.deepEqual(boughtThisWindow(poppet), ['reed-poppet'])
  assert.throws(() => buyItem(poppet, 'reed-poppet'), /no other/)
  assert.ok(validateRun(poppet), 'a run with market state saves')
  // The next window restocks the stall.
  assert.deepEqual(boughtThisWindow({ ...poppet, day: 4 }), [])
  const notLaid = ITEMS.find((item) => !marketStock(fair).includes(item.id))!
  assert.throws(() => buyItem(fair, notLaid.id), /not on the stalls/)
  assert.throws(
    () => buyItem({ ...poppetDay, brass: 3 }, 'reed-poppet'),
    /Needs 35 brass/,
  )
  assert.throws(() => buyItem(fair, 'no-such-thing'), /unknown item/)
  const draughtDay = findSeedWith('night-draught', {
    ...fair,
    day: 22,
    revealedFactions: [...fair.revealedFactions, 'rustline', 'black-verge'],
    affinity: { ...fair.affinity, 'black-verge': 0 },
  })
  const drank = buyItem(draughtDay, 'night-draught')
  assert.ok(drank.flags.includes('bought:night-draught'))
  assert.equal(drank.local.yard, draughtDay.local.yard - 2)

  // Selling: half the price, storeroom only.
  const sold = sellItem(poppet, 'reed-poppet')
  assert.equal(sold.brass, poppet.brass + sellPrice(itemDef('reed-poppet')!))
  assert.equal(sellPrice(itemDef('reed-poppet')!), 17)
  assert.deepEqual(sold.inventory, [])
  assert.throws(() => sellItem(sold, 'reed-poppet'), /does not hold/)
  const worn = equipItem(poppet, 'F001', 'charm', 'reed-poppet')
  assert.throws(() => sellItem(worn, 'reed-poppet'), /does not hold/)
  assert.throws(() => buyItem(sold, 'reed-poppet'), /no other/)

  // Item edges: a waybill knows the Saltroad's roads and nobody else's.
  const saltQuest = QUEST_TEMPLATES.find(
    (quest) => quest.faction === 'saltroad',
  )
  const otherQuest = QUEST_TEMPLATES.find(
    (quest) => quest.faction && quest.faction !== 'saltroad',
  )
  assert.ok(saltQuest && otherQuest)
  const onBoard = (run: FortressRun, id: string): FortressRun => ({
    ...run,
    board: [{ questId: `${id}@1`, postedDay: 1, lastDay: 3 }],
  })
  const carrying: FortressRun = {
    ...fair,
    roster: fair.roster.map((state) =>
      state.id === 'F001'
        ? { ...state, equipment: { tool: 'saltroad-waybill' } }
        : state,
    ),
  }
  const total = (run: FortressRun, id: string) =>
    previewQuest(onBoard(run, id), `${id}@1`, ['F001'], []).perRequirement[0]!
      .total
  assert.equal(
    total(carrying, saltQuest.id) - total(fair, saltQuest.id),
    2 +
      (itemDef('saltroad-waybill')!.stats?.[saltQuest.requirements[0]!.stat] ??
        0),
    'the waybill adds its edge on Saltroad quests',
  )
  assert.equal(
    total(carrying, otherQuest.id) - total(fair, otherQuest.id),
    itemDef('saltroad-waybill')!.stats?.[otherQuest.requirements[0]!.stat] ?? 0,
    'and nothing extra elsewhere',
  )

  // Treatments: the wounded at court, once a day, priced by the wound.
  const hurt: FortressRun = {
    ...fair,
    brass: 100,
    roster: fair.roster.map((state) =>
      state.id === 'F001' ? { ...state, injuredUntilDay: 5 } : state,
    ),
  }
  assert.equal(surgeonPrice(hurt, 'F001'), SURGEON_BASE + SURGEON_PER_DAY * 4)
  const stitched = treatFollower(hurt, 'F001', 'surgeon')
  assert.equal(stitched.healed, 4)
  assert.equal(injuryDaysLeft(stitched.run, 'F001'), 0)
  assert.equal(followerStatus(stitched.run, 'F001'), 'ready')
  assert.equal(stitched.run.brass, 100 - surgeonPrice(hurt, 'F001'))
  assert.match(
    treatmentBlocker(stitched.run, 'F001', 'surgeon') ?? '',
    /Only the wounded/,
  )
  assert.throws(
    () => treatFollower(stitched.run, 'F001', 'surgeon'),
    /Only the wounded/,
  )
  assert.ok(validateRun(stitched.run), 'a treated run saves')
  // Full recovery means no further treatment is available tomorrow.
  assert.match(
    treatmentBlocker({ ...stitched.run, day: 2 }, 'F001', 'surgeon') ?? '',
    /Only the wounded/,
  )
  assert.match(
    treatmentBlocker(hurt, 'F002', 'surgeon') ?? '',
    /Only the wounded/,
  )
  assert.match(
    treatmentBlocker({ ...hurt, brass: 2 }, 'F001', 'surgeon') ?? '',
    /Needs 16 brass/,
  )
  // A last day of a wound closed means the follower can ride today.
  const nearly: FortressRun = {
    ...hurt,
    roster: hurt.roster.map((state) =>
      state.id === 'F001' ? { ...state, injuredUntilDay: 2 } : state,
    ),
  }
  assert.equal(
    followerStatus(treatFollower(nearly, 'F001', 'surgeon').run, 'F001'),
    'ready',
  )
  // Saltroad medicine: a quarter off while they are Friendly.
  const caravans: FortressRun = {
    ...hurt,
    affinity: { ...hurt.affinity, saltroad: 30 },
  }
  assert.ok(saltroadMedicine(caravans) && !saltroadMedicine(hurt))
  assert.equal(surgeonPrice(caravans, 'F001'), 12)
  // The Mire poultice: cheap and seeded, either a full immediate cure or no effect.
  assert.ok(poulticeOffered(hurt))
  const outcomes = new Set<number>()
  for (let seed = 1; seed <= 40; seed += 1) {
    const run = { ...hurt, seed }
    const result = treatFollower(run, 'F001', 'poultice')
    assert.deepEqual(
      result,
      treatFollower(run, 'F001', 'poultice'),
      'the poultice is seeded',
    )
    assert.ok([4, 0].includes(result.healed))
    assert.equal(
      injuryDaysLeft(result.run, 'F001'),
      4 - result.healed,
      'a successful poultice restores duty immediately',
    )
    assert.equal(result.run.brass, 100 - POULTICE_PRICE)
    assert.equal(result.run.affinity.abbey, hurt.affinity.abbey - 1)
    outcomes.add(result.healed)
  }
  assert.equal(outcomes.size, 2, 'the poultice either takes or fails')
  assert.ok(!poulticeOffered({ ...hurt, wipedOut: ['mire-mothers'] }))
  assert.match(
    treatmentBlocker(
      { ...hurt, affinity: { ...hurt.affinity, 'mire-mothers': -80 } },
      'F001',
      'poultice',
    ) ?? '',
    /No Mire woman/,
  )

  // Saves: market state is optional and validated.
  const noMarket: FortressRun = JSON.parse(JSON.stringify(poppet))
  delete noMarket.market
  assert.ok(validateRun(noMarket), 'a run from before the market still loads')
  assert.ok(
    !validateRun({ ...poppet, market: { ...poppet.market!, bought: ['x'] } }),
    'unknown bought items are refused',
  )
  assert.ok(
    !validateRun({
      ...poppet,
      market: { ...poppet.market!, treated: ['F001', 'F001'] },
    }),
    'a follower is treated once',
  )
  assert.ok(
    !validateRun({
      ...poppet,
      market: { window: 99 } as unknown as FortressRun['market'],
    }),
  )
}

// --- t-028: Komodo's buyer, who goes with him, and the host's share ----------
{
  /** The last night: every banner on the map, twelve beds, no talks heard. */
  const eve = (
    patch: Partial<FortressRun> = {},
    extra: string[] = [],
    joinedDay = 5,
  ): FortressRun => {
    const base = onDay(1, 40)
    return {
      ...base,
      board: [],
      beds: 12,
      revealedFactions: [...KINGDOM_FACTIONS],
      roster: [
        ...base.roster,
        ...extra.map((id) => ({ id, joinedDay, equipment: {} })),
      ],
      ...patch,
    }
  }
  const fall = (run: FortressRun) => finishDay(run)
  assert.equal(BETRAYAL_DAY, 41)

  // The buyer: the Abbey by default, read from state, never rolled.
  const plain = eve()
  const fell = fall(plain)
  assert.equal(buyerOf(plain), undefined, 'no buyer before the betrayal')
  assert.equal(buyerOf(fell.run), 'abbey', 'the Abbey is the default buyer')
  assert.ok(fell.run.flags.includes('buyer:abbey'))
  assert.equal(fell.report.betrayal?.buyer, 'abbey')
  assert.equal(fell.report.betrayal?.hideout, fell.run.hideout)
  assert.ok(fell.report.events.includes(BUYERS.abbey.fell))
  for (const patch of [{ seed: 999 }, { branch: 7 }, { seed: -5, branch: 2 }])
    assert.equal(
      selectBuyer({ ...plain, ...patch }),
      'abbey',
      'seed and branch never change the buyer',
    )
  assert.deepEqual(
    fall(eve()).run.roster,
    fell.run.roster,
    'the same night ends the same way',
  )
  const slighted = (count: number, patch: Partial<FortressRun> = {}) => {
    const run = eve(patch)
    return { ...run, flags: [...run.flags, ...VERGE_SLIGHTS.slice(0, count)] }
  }
  assert.equal(selectBuyer(slighted(3)), 'black-verge', 'three slights')
  assert.equal(selectBuyer(slighted(2)), 'abbey', 'two slights are not enough')
  assert.equal(
    selectBuyer(
      slighted(3, {
        strength: { ...plain.strength, 'black-verge': plain.strength.abbey },
      }),
    ),
    'abbey',
    'a Verge no stronger than the Abbey leaves the walls to the sisters',
  )
  assert.equal(
    selectBuyer(slighted(3, { wipedOut: ['black-verge'] })),
    'abbey',
    'a Verge wiped from the map buys nothing',
  )
  assert.equal(
    selectBuyer(
      slighted(3, {
        revealedFactions: KINGDOM_FACTIONS.filter((f) => f !== 'black-verge'),
      }),
    ),
    'abbey',
    'an unrevealed Verge buys nothing',
  )
  assert.equal(
    selectBuyer(eve({ affinity: { ...plain.affinity, 'black-verge': -70 } })),
    'black-verge',
    'an open feud is enough on its own',
  )
  assert.equal(
    selectBuyer(
      slighted(3, {
        wipedOut: ['abbey'],
        strength: { ...plain.strength, 'black-verge': 2 },
      }),
    ),
    'black-verge',
    'with the Abbey gone, the Verge holds the walls for the Abbess',
  )
  const lostHouses = (support: number, patch: Partial<FortressRun> = {}) => {
    const run = eve(patch)
    return { ...run, local: { ...run.local, 'old-houses': support } }
  }
  assert.equal(selectBuyer(lostHouses(OLD_HOUSES_LOST)), 'old-houses')
  assert.equal(selectBuyer(lostHouses(OLD_HOUSES_LOST + 1)), 'abbey')
  const both = lostHouses(0)
  assert.equal(
    selectBuyer({
      ...both,
      flags: [...both.flags, ...VERGE_SLIGHTS.slice(0, 3)],
    }),
    'black-verge',
    'the Verge comes before House Vask',
  )
  // A save from before t-028 that is already past the betrayal reads as the Abbey.
  assert.equal(
    buyerOf({
      ...fell.run,
      flags: fell.run.flags.filter((flag) => !flag.startsWith('buyer:')),
    }),
    'abbey',
  )
  for (const buyer of BUYER_IDS) {
    const run =
      buyer === 'abbey'
        ? plain
        : buyer === 'black-verge'
          ? slighted(3)
          : lostHouses(0)
    const dawn = fall(run)
    assert.equal(buyerOf(dawn.run), buyer, `${buyer} bought the tower`)
    assert.ok(dawn.report.events.includes(BUYERS[buyer].fell))
    assert.ok(
      dawn.run.flags.filter((flag) => flag.startsWith('buyer:')).length === 1,
      'one buyer',
    )
  }

  // Every Act V line that names who holds the tower reads right for each buyer.
  const BANNER: Record<string, RegExp> = {
    abbey: /Abbey’s grey banner/,
    'black-verge': /plum banner of the Black Verge/,
    'old-houses': /black swan of House Vask/,
  }
  const ABBEY_HOLDS =
    /Abbey’s grey banner|flying grey\.|Abbess’s guards|recognise the Abbess|Abbess has offered to surrender/
  for (const buyer of BUYER_IDS) {
    const flags = [BETRAYAL_FLAG, 'hideout:mole-tunnels', `buyer:${buyer}`]
    const texts: string[] = []
    for (const def of DAYS.filter((d) => d.day >= 41)) {
      const run = onDay(1, def.day, { hideout: 'mole-tunnels', flags })
      texts.push(...dayBriefings(run, def)!.map((b) => b.text))
      for (const audience of def.audiences) {
        texts.push(...audienceScene(run, audience).lines.map(lineText))
        for (const beat of audience.beats ?? [])
          texts.push(
            ...audienceScene(
              { ...run, audienceBeats: { [audience.id]: beat.id } },
              audience,
            ).lines.map(lineText),
          )
      }
    }
    const all = texts.join('\n')
    assert.match(all, BANNER[buyer]!, `${buyer}: the banner line`)
    if (buyer !== 'abbey')
      assert.doesNotMatch(
        all,
        ABBEY_HOLDS,
        `${buyer}: nobody says the Abbey holds the tower`,
      )
    else assert.match(all, /Abbess’s guards/, 'the Abbey reading is unchanged')
  }
  // Scene variants only swap lines: same length, never empty, keyed on the
  // Day 41 buyer or (t-040) on an answer given on an earlier day.
  const answeredBy = new Map<string, number>()
  for (const def of DAYS)
    for (const audience of def.audiences)
      for (const option of [
        ...audience.options,
        ...(audience.beats ?? []).flatMap((beat) => beat.options),
      ])
        for (const flag of [
          ...(option.effects.flags ?? []),
          // t-035: the answer itself is an earlier day's answer too.
          `chose:${audience.id}:${option.id}`,
        ])
          answeredBy.set(flag, Math.min(answeredBy.get(flag) ?? 99, def.day))
  // t-038: or a quest result from an earlier day (a broken promise read at
  // the long table), dated by the day in its id.
  for (const quest of [
    ...ACT_ONE_QUESTS,
    ...ACT_ONE_LATE_QUESTS,
    ...ACT_TWO_QUESTS,
    ...ACT_THREE_QUESTS,
    ...ACT_FOUR_QUESTS,
  ]) {
    const day = Number(/^q-d(\d+)-/.exec(quest.id)?.[1] ?? 99)
    for (const effects of [...Object.values(quest.rewards), quest.expired])
      for (const flag of effects?.flags ?? [])
        answeredBy.set(flag, Math.min(answeredBy.get(flag) ?? 99, day))
  }
  let sceneVariants = 0
  for (const def of DAYS)
    for (const audience of def.audiences)
      for (const scene of [audience, ...(audience.beats ?? [])])
        for (const variant of scene.variants ?? []) {
          sceneVariants += 1
          assert.ok(variant.flags?.length, `${audience.id}: a variant is keyed`)
          for (const flag of variant.flags ?? [])
            assert.ok(
              (BUYER_IDS.some((b) => flag === `buyer:${b}`) && def.day >= 41) ||
                (answeredBy.get(flag) ?? 99) < def.day,
              `${audience.id}: ${flag} is the Day 41 buyer or an earlier answer`,
            )
          assert.equal(variant.lines.length, scene.lines.length)
          assert.notDeepEqual(variant.lines, scene.lines, audience.id)
        }
  assert.ok(sceneVariants >= 5, `${sceneVariants} buyer scene variants`)

  // Who goes with him. Brother Teodor writes to the Abbess; Saffron's Pack is
  // Wary of the crown by default. Nobody has sat with anyone.
  const eight = eve({}, ['F005', 'F008', 'F012', 'F013'])
  eight.roster.find((s) => s.id === 'F012')!.equipment = {
    tool: 'old-road-crowbar',
  }
  assert.equal(
    departureCheck(
      eight,
      'abbey',
      eight.roster.find((s) => s.id === 'F012')!,
    ).why,
    'allegiance',
  )
  assert.equal(
    departureCheck(
      eight,
      'abbey',
      eight.roster.find((s) => s.id === 'F002')!,
    ).why,
    'neglect',
  )
  assert.equal(
    departureCheck(
      eight,
      'abbey',
      eight.roster.find((s) => s.id === 'F003')!,
    ).why,
    null,
    'the Saltroad is Neutral',
  )
  assert.equal(
    departureCheck(
      eight,
      'black-verge',
      eight.roster.find((s) => s.id === 'F012')!,
    ).why,
    null,
    'an allegiance to the Abbess does not pull toward the Verge',
  )
  const gone = fall(eight)
  assert.deepEqual(
    gone.report.betrayal?.departed,
    [
      { followerId: 'F012', why: 'allegiance' },
      { followerId: 'F002', why: 'neglect' },
    ],
    'allegiance first, then neglect, in the order they joined',
  )
  assert.equal(followerStatus(gone.run, 'F012'), 'departed')
  assert.equal(followerStatus(gone.run, 'F002'), 'departed')
  assert.ok(
    !gone.run.roster.find((s) => s.id === 'F012')!.dead,
    'gone, not dead',
  )
  assert.equal(bedsUsed(gone.run), 6, 'their beds are free')
  assert.equal(talkFor(gone.run, 'F012'), undefined, 'their talks stop')
  assert.ok(
    unmetRequirements(gone.run, { follower: 'F012' }).length > 0 &&
      !optionVisible(gone.run, {
        id: 'x',
        label: 'x',
        effects: {},
        response: 'x',
        requires: { follower: 'F012' },
      }),
    'scenes that need them do not open',
  )
  const someQuest = gone.run.board[0]
  if (someQuest)
    assert.throws(
      () => assignQuest(gone.run, someQuest.questId, ['F012']),
      /not ready|must go|needs/,
      'nobody can send them',
    )
  assert.ok(gone.run.inventory.includes('old-road-crowbar'), 'their kit stays')
  assert.deepEqual(gone.run.roster.find((s) => s.id === 'F012')!.equipment, {})
  assert.ok(
    gone.report.events.some((e) =>
      /Brother Teodor Lull went with Young Komodo/.test(e),
    ),
  )
  assert.equal(
    gone.report.wages,
    HIDEOUT_WAGE * bedsUsed(gone.run),
    'nobody pays the gone',
  )
  const reasons = departedFollowers(gone.run)
  assert.equal(reasons.length, 2)
  const reasonOf = (id: string) =>
    reasons.find((entry) => entry.followerId === id)!.reason
  assert.equal(
    reasonOf('F012'),
    'Letters to the Abbess. The Abbey called. He went.',
  )
  assert.equal(
    reasonOf('F002'),
    `${41 - 1} days at court. Nobody sat with her once. Her people are wary of the crown.`,
  )
  for (const def of FOLLOWERS)
    assert.ok(DEPARTURE_LINES[def.id], `${def.name}: a line for leaving`)

  // Protections: a heard story, a sealed romance, being away.
  const kept = (patch: Partial<FortressRun>, id: string) =>
    departureCheck(
      { ...eight, ...patch },
      'abbey',
      eight.roster.find((s) => s.id === id)!,
    )
  assert.deepEqual(kept({ talksHeard: ['teodor-1', 'teodor-2'] }, 'F012'), {
    why: null,
    kept: 'story',
  })
  assert.ok(
    storyHeard({ ...eight, talksHeard: ['lumen-1'] }, 'F010'),
    'Lumen has one tower talk',
  )
  assert.deepEqual(kept({ flags: ['romance-saffron-sealed'] }, 'F002'), {
    why: null,
    kept: 'romance',
  })
  assert.deepEqual(
    kept(
      {
        active: [
          {
            questId: 'q',
            party: ['F012'],
            departedDay: 40,
            returnsDay: 42,
            postedDay: 40,
            lastDay: 40,
          },
        ],
      },
      'F012',
    ),
    { why: null, kept: 'away' },
  )
  assert.equal(
    kept({ talksHeard: ['saffron-1'] }, 'F002').why,
    null,
    'one talk is enough against neglect',
  )
  assert.equal(
    kept({ talksHeard: ['teodor-1'] }, 'F012').why,
    'allegiance',
    'one talk does not answer an allegiance',
  )
  const late = eve({}, ['F005', 'F008', 'F013'], 35)
  assert.equal(
    departureCheck(
      late,
      'abbey',
      late.roster.find((s) => s.id === 'F013')!,
    ).why,
    null,
    'too new to be neglected',
  )
  // Whose people are crossed: wary or hostile, wiped out, or a local faction losing faith.
  const crossed = (patch: Partial<FortressRun>, id: string) => {
    const run = { ...eve({}, ['F008', 'F011', 'F013', 'F016']), ...patch }
    return departureCheck(
      run,
      'abbey',
      run.roster.find((s) => s.id === id)!,
    ).why
  }
  assert.equal(crossed({ wipedOut: ['freeholds'] }, 'F008'), 'neglect')
  assert.equal(crossed({}, 'F008'), null)
  assert.equal(
    crossed({ local: { ...plain.local, 'gate-watch': 5 } }, 'F013'),
    'neglect',
  )
  assert.equal(
    crossed({ local: { ...plain.local, 'gate-watch': 6 } }, 'F013'),
    null,
  )
  assert.equal(
    crossed({ affinity: { ...plain.affinity, 'storm-crows': -40 } }, 'F011'),
    null,
    'Tamsin owes the Conclave nothing either: no pull',
  )
  assert.equal(
    crossed({ affinity: { ...plain.affinity, 'black-verge': -90 } }, 'F016'),
    null,
    'Sable is hunted by the Verge: never pulled to it',
  )

  // Caps: never more than MAX_DEPARTURES; never fewer than MIN_LEFT kept.
  const everyone = FOLLOWERS.map((def) => def.id)
  const cold = (ids: string[]) => {
    const run = eve({
      roster: ids.map((id) => ({ id, joinedDay: 1, equipment: {} })),
      affinity: Object.fromEntries(
        KINGDOM_FACTIONS.map((f) => [f, -40]),
      ) as FortressRun['affinity'],
      local: Object.fromEntries(
        LOCAL_FACTIONS.map((f) => [f, 0]),
      ) as FortressRun['local'],
    })
    return run
  }
  assert.equal(
    selectDepartures(cold(everyone.slice(0, 12)), 'abbey').length,
    MAX_DEPARTURES,
  )
  assert.equal(selectDepartures(cold(everyone.slice(0, 6)), 'abbey').length, 2)
  assert.equal(
    selectDepartures(cold(everyone.slice(0, MIN_LEFT)), 'abbey').length,
    0,
  )
  assert.equal(
    selectDepartures(cold([...everyone.slice(0, 4), 'F012']), 'abbey')[0]!
      .followerId,
    'F012',
    'an allegiance outranks neglect when room is short',
  )
  const coldFall = fall(cold(everyone.slice(0, 12)))
  assert.equal(
    coldFall.run.roster.filter((s) => s.departed).length,
    MAX_DEPARTURES,
  )
  assert.ok(validateRun(coldFall.run), 'a run with departures saves')
  // Whole campaigns: the cap and the floor hold, and the court is never empty.
  for (const policy of POLICIES.slice(0, 6))
    for (let seed = 1; seed <= 2; seed += 1)
      playCampaign(policy, seed, (run) => {
        if (run.day !== 41) return
        const left = run.roster.filter((s) => !s.dead && !s.departed).length
        const went = run.roster.filter((s) => s.departed).length
        assert.ok(went <= MAX_DEPARTURES, `${policy.id}: ${went} went`)
        assert.ok(went === 0 || left >= MIN_LEFT, `${policy.id}: ${left} left`)
        assert.ok(left > 0, `${policy.id}: the court has hands`)
      })

  // The epilogue: a follower who went with Komodo is told as gone, not dead or at court.
  for (const def of FOLLOWERS) {
    const base = onDay(1, 50)
    const run: FortressRun = {
      ...base,
      flags: [BETRAYAL_FLAG, 'horror-sealed'],
      roster: [
        {
          id: def.id,
          joinedDay: 1,
          departed: { day: 41, why: 'neglect' },
          equipment: {},
        },
      ],
    }
    const told = epilogueFor(run, 'open-roads').find(
      (e) => e.subject.follower === def.id,
    )
    assert.ok(told, `${def.name} is in the epilogue`)
    assert.deepEqual(
      told!.variant.when?.departed,
      [def.id],
      `${def.name}: the gone variant`,
    )
    const night = epilogueFor(run, 'long-night').find(
      (e) => e.subject.follower === def.id,
    )
    assert.deepEqual(
      night?.variant.when?.departed,
      [def.id],
      `${def.name}: gone under the Long Night too`,
    )
  }

  // Saves: the new fields are optional and validated.
  assert.ok(validateRun(gone.run), 'a betrayed run with departures saves')
  const before: FortressRun = JSON.parse(JSON.stringify(gone.run))
  for (const state of before.roster) delete state.departed
  for (const report of before.reports) {
    delete report.betrayal
    delete report.income
  }
  assert.ok(validateRun(before), 'a save from before t-028 still loads')
  const tampered = (mutate: (run: FortressRun) => void) => {
    const run: FortressRun = JSON.parse(JSON.stringify(gone.run))
    mutate(run)
    return validateRun(run)
  }
  assert.ok(
    !tampered((run) => {
      run.roster.find((s) => s.id === 'F012')!.departed = {
        day: 41,
        why: 'bored' as 'neglect',
      }
    }),
    'unknown reasons are refused',
  )
  assert.ok(
    !tampered((run) => {
      run.active.push({
        questId: 'q-d41-stragglers',
        party: ['F012'],
        departedDay: 41,
        returnsDay: 42,
        postedDay: 41,
        lastDay: 42,
      })
    }),
    'a follower who left cannot ride out for the crown',
  )
  assert.ok(
    !tampered((run) => {
      run.reports.at(-1)!.betrayal!.buyer = 'moles' as 'abbey'
    }),
    'unknown buyers are refused',
  )
  assert.ok(
    !tampered((run) => {
      run.reports.at(-1)!.income = 'taxes' as 'host'
    }),
  )

  // Income: the regions pay until the tower falls; then only the host shares.
  assert.equal(dailyIncome(plain), dailyTaxes(plain))
  assert.equal(dailyWages(plain), WAGE * bedsUsed(plain))
  assert.equal(fall({ ...plain, day: 39 }).report.income, undefined)
  assert.equal(fell.run.hideout, 'nameless-cave')
  assert.equal(fell.report.income, 'host')
  assert.equal(fell.report.taxes, CAVE_SHARE, 'the cave shares little')
  assert.equal(fell.report.wages, HIDEOUT_WAGE * bedsUsed(fell.run))
  const moleNight = eve({ affinity: { ...plain.affinity, moles: 70 } })
  const moleDawn = fall(moleNight)
  assert.equal(moleDawn.run.hideout, 'mole-tunnels')
  assert.equal(
    moleDawn.report.taxes,
    moleDawn.run.strength.moles * 3,
    'an Allied host shares three brass per point of strength',
  )
  assert.equal(moleDawn.report.taxes, hostShare(moleDawn.run)!.paid)
  assert.notEqual(
    moleDawn.report.taxes,
    dailyTaxes(moleDawn.run),
    'not the regions’ taxes',
  )
  const friendlyMoles = {
    ...moleDawn.run,
    affinity: { ...moleDawn.run.affinity, moles: 30 },
  }
  assert.equal(hostShare(friendlyMoles)!.paid, friendlyMoles.strength.moles * 2)
  const waryMoles = {
    ...moleDawn.run,
    affinity: { ...moleDawn.run.affinity, moles: -30 },
  }
  assert.equal(
    hostShare(waryMoles)!.paid,
    0,
    'a host the crown has crossed shares nothing',
  )
  const nextDawn = finishDay(moleDawn.run).report
  assert.equal(nextDawn.income, 'host')
  assert.equal(nextDawn.taxes, hostShare(finishDay(moleDawn.run).run)!.paid)
  assert.equal(nextDawn.betrayal, undefined, 'the betrayal is told once')
  for (const [hideout, faction] of Object.entries(HIDEOUT_HOST))
    assert.equal(
      selectHideout(eve({ affinity: { ...plain.affinity, [faction]: 90 } })),
      hideout,
      `${faction} hides the court in ${hideout}`,
    )
}

// --- t-040: playtest engine hooks ---------------------------------------------
{
  const sceneOpts = (scene: {
    options: AudienceOption[]
    beats?: { options: AudienceOption[] }[]
  }) => [...scene.options, ...(scene.beats ?? []).flatMap((b) => b.options)]
  const everyOption = [
    ...DAYS.flatMap((def) => def.audiences.flatMap(sceneOpts)),
    ...TALKS.flatMap(sceneOpts),
  ]
  // Content contract: every hook names something real.
  const allEffects = [
    ...everyOption.map((option) => option.effects),
    ...DUES.flatMap((due) => [
      due.effects,
      due.unpaid?.effects,
      due.lapsed?.effects,
    ]),
  ]
  for (const effects of allEffects) {
    for (const id of effects?.schedule ?? []) assert.ok(dueDef(id), `due ${id}`)
    for (const id of effects?.cancelDues ?? [])
      assert.ok(dueDef(id), `due ${id}`)
    for (const aid of effects?.questAid ?? [])
      assert.ok(questDef(aid.questId) && aid.label, `aid ${aid.questId}`)
    for (const leaving of effects?.dismiss ?? [])
      assert.ok(followerDef(leaving.follower) && leaving.reason)
    if (effects?.relocate) assert.ok(effects.relocate in HIDEOUT_NAMES)
  }
  assert.equal(new Set(DUES.map((due) => due.id)).size, DUES.length)
  for (const due of DUES) {
    assert.ok(due.day !== undefined || due.inDays !== undefined, due.id)
    assert.ok(due.line && due.title, due.id)
    if (due.cost) assert.ok(due.unpaid?.line, `${due.id}: unpaid is told`)
    if (!due.hidden) assert.ok(due.warning, `${due.id}: the ledger says why`)
  }

  // 1. An answer helps, or settles, a quest.
  const flour = 'q-d05-flour-barrels'
  const flourDef = questDef(flour)!
  const d5 = onDay(1, 5)
  assert.ok(d5.board.some((entry) => entry.questId === flour))
  // Saffron alone is short on Heart: room for help to show.
  const two = ['F002']
  const bare = previewQuest(d5, flour, two)
  const aided = structuredClone(d5)
  applyEffects(aided, {
    questAid: [
      {
        questId: flour,
        label: 'The Watch carts the barrels',
        bonus: 4,
        resolve: 'partial',
        outcome: 'The Watch carted half the barrels in. Nobody thanked them.',
      },
    ],
  })
  const helped = previewQuest(aided, flour, two)
  assert.ok(helped.chance > bare.chance, 'aid raises the honest odds')
  assert.ok(helped.perRequirement.every((req) => req.aid === 4))
  assert.deepEqual(
    helped.perRequirement.map((req) => req.total - req.aid),
    bare.perRequirement.map((req) => req.total),
    'the party’s own share is unchanged',
  )
  assert.deepEqual(helped.aid, [
    { label: 'The Watch carts the barrels', bonus: 4 },
  ])
  assert.equal(helped.resolvesAs, 'partial')
  assert.equal(previewQuest(aided, flour, []).chance, 0, 'nobody, no odds')
  assert.match(
    expiryInfo(aided, flourDef, 6).consequence,
    /The Watch carts the barrels\. It ends as a partial success/,
  )
  // Nobody goes: at the dawn it leaves the board, it settles at the aid's tier.
  let walk = aided
  while (walk.day < 7) walk = finishDay(walk).run
  const settled = walk.reports
    .flatMap((report) => report.quests)
    .find((quest) => quest.questId === flour)!
  assert.equal(settled.tier, 'partial')
  assert.equal(settled.aided, true)
  assert.equal(
    settled.text,
    'The Watch carted half the barrels in. Nobody thanked them.',
  )
  assert.deepEqual(settled.effects, flourDef.rewards.partial ?? {})
  assert.ok(walk.flags.includes(`quest:${flour}:partial`))
  assert.equal(walk.aid, undefined, 'aid is spent')
  // Without aid it expires as written, and says so.
  let lone = d5
  while (lone.day < 7) lone = finishDay(lone).run
  const expired = lone.reports
    .flatMap((report) => report.quests)
    .find((quest) => quest.questId === flour)!
  assert.equal(expired.tier, 'expired')
  assert.equal(expired.text, flourDef.outcomes.expired)
  assert.ok(lone.flags.includes(`quest:${flour}:expired`))
  // A party sent anyway rolls with the aid, and spends it.
  const sent = finishDay(assignQuest(aided, flour, two))
  const rolled = sent.report.quests.find((quest) => quest.questId === flour)!
  assert.equal(rolled.chance, helped.chance, 'the roll uses the previewed odds')
  assert.equal(sent.run.aid, undefined)
  // Aid for a quest already settled is ignored.
  const late = structuredClone(lone)
  applyEffects(late, {
    questAid: [{ questId: flour, label: 'Too late', bonus: 1 }],
  })
  assert.equal(late.aid, undefined)

  // 2. Flag-keyed text: quest outcomes, the betrayal page, the advisor, Day 43.
  const varied = {
    ...flourDef,
    outcomeVariants: {
      expired: [
        { flags: ['d05-promised'], text: 'The carts waited. Nobody came.' },
      ],
    },
  }
  assert.equal(
    questOutcomeText({ flags: ['d05-promised'] }, varied, 'expired'),
    'The carts waited. Nobody came.',
  )
  assert.equal(
    questOutcomeText({ flags: [] }, varied, 'expired'),
    flourDef.outcomes.expired,
  )
  assert.equal(
    questOutcomeText({ flags: [] }, flourDef, 'triumph'),
    flourDef.outcomes.triumph ?? flourDef.outcomes.success,
  )
  assert.ok(gateHolds(['a', 'b'], { flags: ['a'], anyFlags: ['x', 'b'] }))
  assert.ok(!gateHolds(['a'], { flags: ['a'], anyFlags: ['x'] }))
  assert.ok(!gateHolds(['a', 'n'], { flags: ['a'], notFlags: ['n'] }))
  for (const [flag, pattern] of [
    ['d40-komodo-held', /spent midnight in your cells/],
    ['d40-seals-checked', /an order you had read/],
    ['d40-watch-recalled', /lifted the bar for him from inside/],
  ] as const) {
    for (const buyer of BUYER_IDS) {
      const read = fallText(onDay(1, 41, { flags: [flag] }), BUYERS[buyer])
      assert.match(read.fell, pattern, `${buyer}: ${flag}`)
      assert.doesNotMatch(read.fell, /with your seal\./, `${buyer}: ${flag}`)
      assert.ok(
        read.fell.endsWith(BUYERS[buyer].fell.slice(FALL_OPENING.length)),
      )
    }
    const fall = finishDay(onDay(1, 40, { flags: [flag] }))
    assert.match(fall.report.betrayal!.fell!, pattern, `the dawn reads ${flag}`)
    assert.ok(fall.report.events.includes(fall.report.betrayal!.fell!))
    assert.ok(validateRun(fall.run), 'a betrayal with its fall text saves')
    const d43 = DAYS.find((def) => def.day === 43)!.audiences.find(
      (audience) => audience.id === 'd43-defector',
    )!
    const opening = sceneLines({ flags: [flag] }, d43)
      .map(lineText)
      .join(' ')
    assert.doesNotMatch(
      opening,
      /order under your seal/,
      `Day 43 reads ${flag}`,
    )
  }
  assert.equal(
    fallText(onDay(1, 41), BUYERS.abbey).fell,
    BUYERS.abbey.fell,
    'no precaution, the fall as written',
  )
  const d34 = DAYS.find((def) => def.day === 34)!
  assert.notEqual(dayLines({ flags: [] }, d34).komodo, d34.komodo)
  assert.equal(
    dayLines({ flags: ['crow-debt-called'] }, d34).komodo,
    d34.komodo,
  )

  // The playtest's leaked id: a crisis line names the faction.
  const crisis = createRun(2)
  const crisisEvents: string[] = []
  applyEffects(crisis, { local: { 'old-houses': -30 } }, crisisEvents)
  assert.deepEqual(crisisEvents, [
    'The Old Houses have lost all faith in the throne.',
  ])
  assert.equal(
    crisisLine('ledger'),
    'The Ledger has lost all faith in the throne.',
  )

  // 3a. The Ledger's loan comes due at season's end.
  const d8 = onDay(1, 8, { flags: ['market-charter'] })
  const loanTaken = chooseAudienceOption(d8, 'd08-ledger-loan', 'accept').run
  assert.deepEqual(loanTaken.dues, [{ id: 'ledger-loan', day: 20, from: 8 }])
  assert.deepEqual(
    pendingDues(loanTaken).map((due) => [due.def.id, due.day, due.daysLeft]),
    [['ledger-loan', 20, 12]],
  )
  const loanOption = audienceScene(
    loanTaken,
    audiencesToday(d8).find((audience) => audience.id === 'd08-ledger-loan')!,
  ).options.find((option) => option.id === 'accept')!
  assert.ok(
    optionStakes(d8, loanOption).some(
      (stake) =>
        stake.tone === 'warning' &&
        /Comes due Day 20.*50 brass/.test(stake.text),
    ),
    'the throne says when the loan comes due',
  )
  const eveOfLoan = (brass: number) =>
    onDay(1, 19, {
      brass,
      flags: ['ledger-credit'],
      dues: [{ id: 'ledger-loan', day: 20, from: 8 }],
    })
  const repaid = finishDay(eveOfLoan(300))
  assert.equal(
    repaid.run.brass,
    300 + repaid.report.taxes - repaid.report.wages - 50,
  )
  assert.ok(repaid.run.flags.includes('ledger-loan-repaid'))
  assert.ok(!repaid.run.flags.includes('ledger-credit'))
  assert.ok(repaid.report.events.some((line) => /wrote PAID/.test(line)))
  assert.equal(repaid.run.dues, undefined)
  const broke = finishDay(eveOfLoan(10))
  assert.ok(broke.run.flags.includes('ledger-loan-defaulted'))
  assert.equal(broke.run.local.ledger, eveOfLoan(10).local.ledger - 4)
  assert.deepEqual(broke.run.dues, [
    { id: 'ledger-loan-late', day: 25, from: 20 },
  ])
  assert.ok(broke.run.brass >= 0, 'an unpaid due never empties the strongbox')
  const declined = onDay(1, 19, {
    dues: [{ id: 'ledger-loan', day: 20, from: 8 }],
  })
  const noLoan = finishDay(declined)
  assert.ok(
    !noLoan.run.flags.includes('ledger-loan-repaid'),
    'no loan, no bill',
  )
  assert.equal(
    noLoan.run.brass,
    declined.brass + noLoan.report.taxes - noLoan.report.wages,
  )
  // A due can be called off before it comes due.
  const cancelled = structuredClone(loanTaken)
  applyEffects(cancelled, { cancelDues: ['ledger-loan'] })
  assert.equal(cancelled.dues, undefined)
  // Scheduling the same due twice books it once.
  const twice = structuredClone(loanTaken)
  applyEffects(twice, { schedule: ['ledger-loan'] })
  assert.equal(twice.dues!.length, 1)

  // 3b. The Day 2 rate is a standing law.
  const d2 = onDay(1, 2)
  const base = dailyTaxes(d2)
  const hard = chooseAudienceOption(d2, 'd02-dust-tax', 'high').run
  assert.equal(dailyTaxes(hard), base + 2)
  assert.deepEqual(
    lawsInForce(hard).map((law) => law.id),
    ['market-rate-hard'],
  )
  assert.deepEqual(hard.dues, [{ id: 'market-rate-hard', day: 9, from: 2 }])
  const light = chooseAudienceOption(d2, 'd02-dust-tax', 'low').run
  assert.equal(dailyTaxes(light), Math.max(0, base - 2))
  assert.equal(
    lawsInForce({ ...hard, hideout: 'crow-cave' }).length,
    0,
    'no gate in hiding',
  )
  const week = finishDay({ ...structuredClone(hard), day: 8 })
  assert.equal(week.run.local.ledger, hard.local.ledger - 1, 'the Ledger cools')
  assert.deepEqual(week.run.dues, [
    { id: 'market-rate-hard', day: 16, from: 9 },
  ])
  const repealed = finishDay({
    ...structuredClone(hard),
    day: 8,
    flags: hard.flags.filter((flag) => flag !== 'tax-high'),
  })
  assert.equal(
    repealed.run.local.ledger,
    hard.local.ledger,
    'repealed: no pull',
  )
  assert.equal(repealed.run.dues, undefined, 'and no next week')
  assert.ok(
    optionStakes(
      d2,
      DAYS[1]!.audiences
        .find((a) => a.id === 'd02-dust-tax')!
        .options.find((option) => option.id === 'high')!,
    ).some((stake) => /The hard rate: every 7 days/.test(stake.text)),
  )

  // 3c. The rain covenant: only a covenant still owed is billed on Day 34.
  const billed = (flags: string[]) => {
    const eve = onDay(1, 33, {
      flags,
      dues: [{ id: 'crow-debt', day: 34, from: 20 }],
    })
    const dawn = finishDay(eve).run
    return audiencesToday(dawn).some(
      (audience) => audience.id === 'd34-crow-debt',
    )
  }
  assert.ok(billed(['rain-covenant']), 'a covenant never settled')
  assert.ok(billed(['covenant-broken']), 'a covenant broken')
  // Lead decision (t-036): a covenant paid in runners is not billed in
  // brass. A person comes due instead: Linnet at the gate.
  assert.ok(!billed(['covenant-paid-in-runners']), 'runners are not billed')
  assert.ok(!billed(['covenant-bought-out']), 'bought out: owes nothing')
  assert.ok(!billed(['d20-pastures-ceded']), 'settled in pastures')
  assert.ok(
    !billed(['covenant-paid-in-runners', 'd20-runners-term-fixed']),
    'a fixed term closes it',
  )
  const neverSigned = finishDay(onDay(1, 33)).run
  assert.ok(
    !audiencesToday(neverSigned).some(
      (audience) => audience.id === 'd34-crow-debt',
    ),
    'a run that never signed is never billed',
  )
  assert.match(dayBriefings(neverSigned)![1]!.text, /owes the Conclave nothing/)
  assert.equal(dayBriefings(neverSigned)![1]!.truth, true)
  const signed = chooseAudienceOption(onDay(1, 11), 'd11-rainmaker', 'covenant')
  assert.deepEqual(signed.run.dues, [
    { id: 'rain-covenant', day: 20, from: 11 },
  ])

  // Saves keep dues and aid, and refuse nonsense.
  assert.ok(validateRun(aided) && validateRun(loanTaken))
  assert.ok(
    !validateRun({
      ...loanTaken,
      dues: [{ id: 'no-such-due', day: 20, from: 8 }],
    }),
  )
  assert.ok(
    !validateRun({
      ...loanTaken,
      dues: [...loanTaken.dues!, ...loanTaken.dues!],
    }),
    'one of each due',
  )
  assert.ok(!validateRun({ ...aided, aid: { 'no-such-quest': [] } }))
  const book: SaveBook = {
    version: 3,
    current: loanTaken,
    dawns: Array.from({ length: 8 }, (_, d) => ({ ...loanTaken, day: d + 1 })),
  }
  assert.deepEqual(decodeBook(encodeBook(book))!.current.dues, loanTaken.dues)

  // 4. A follower leaves by choice, never below the floor.
  const sendHome: AudienceOption = {
    id: 'home',
    label: 'Send Kiyo home.',
    effects: {
      dismiss: [{ follower: 'F003', reason: 'Kiyo went home to her boy.' }],
    },
    response: '',
  }
  const four = onDay(1, 12)
  assert.equal(bedsUsed(four), MIN_LEFT)
  assert.ok(
    optionBlockers(four, sendHome).some((reason) =>
      /cannot spare/.test(reason),
    ),
    'the floor holds',
  )
  const five = recruit({ ...four, brass: 500, recruitable: ['F005'] }, 'F005')
  assert.deepEqual(optionBlockers(five, sendHome), [])
  assert.ok(
    optionStakes(five, sendHome).some(
      (s) => s.text === 'Kiyo leaves the court',
    ),
  )
  const gone = structuredClone(five)
  const goneEvents: string[] = []
  applyEffects(gone, sendHome.effects, goneEvents)
  assert.equal(followerStatus(gone, 'F003'), 'departed')
  assert.deepEqual(gone.roster.find((s) => s.id === 'F003')!.departed, {
    day: 12,
    why: 'dismissed',
    reason: 'Kiyo went home to her boy.',
  })
  assert.deepEqual(goneEvents, ['Kiyo went home to her boy.'])
  assert.equal(bedsUsed(gone), MIN_LEFT)
  assert.ok(!optionVisible(gone, sendHome), 'nobody is sent home twice')
  assert.deepEqual(
    departedFollowers(gone).map((entry) => [
      entry.followerId,
      entry.why,
      entry.reason,
    ]),
    [['F003', 'dismissed', 'Kiyo went home to her boy.']],
  )
  assert.ok(validateRun(gone))
  const away = assignQuest(
    { ...five, board: [{ questId: flour, postedDay: 12, lastDay: 13 }] },
    flour,
    ['F003'],
  )
  assert.ok(
    optionBlockers(away, sendHome).some((reason) => /is away/.test(reason)),
  )

  // 5. Hideout terms: accept promises hands, paying owes nothing later.
  const molesD42 = onDay(1, 42, {
    hideout: 'mole-tunnels',
    flags: ['komodo-betrayal', 'hideout:mole-tunnels'],
  })
  const terms = 'd42-terms-mole-tunnels'
  assert.ok(audiencesToday(molesD42).some((audience) => audience.id === terms))
  const accepted = chooseAudienceOption(molesD42, terms, 'accept').run
  assert.deepEqual(accepted.dues, [
    { id: 'host-due:mole-tunnels', day: HOST_COLLECT_DAY, from: 42 },
  ])
  const asked = chooseAudienceOption(molesD42, terms, 'ask').run
  const paidAgain = chooseAudienceOption(
    { ...asked, brass: 100 },
    terms,
    'bargain',
  ).run
  assert.ok(paidAgain.flags.includes('host-terms-paid'))
  assert.equal(
    paidAgain.affinity.moles,
    asked.affinity.moles + 5,
    'the bargain does what it says',
  )
  assert.equal(paidAgain.dues, undefined, 'paid in brass: nothing comes due')
  const collect = (patch: Partial<FortressRun>) =>
    finishDay({
      ...structuredClone(accepted),
      day: HOST_COLLECT_DAY - 1,
      board: [],
      ...patch,
    })
  const paidHost = collect({ brass: 200 })
  assert.equal(
    paidHost.run.brass,
    200 + paidHost.report.taxes - paidHost.report.wages - HOST_DEMAND,
  )
  const unpaidHost = collect({ brass: 0 })
  assert.equal(unpaidHost.run.affinity.moles, accepted.affinity.moles - 10)
  assert.ok(unpaidHost.run.flags.includes('host-demand-unpaid'))
  const keptHost = collect({
    brass: 200,
    flags: [...accepted.flags, 'quest:q-d42-tunnel-props:success'],
  })
  assert.equal(keptHost.run.affinity.moles, accepted.affinity.moles + 5)
  assert.ok(keptHost.run.flags.includes('host-terms-kept'))
  assert.equal(
    keptHost.run.brass,
    200 + keptHost.report.taxes - keptHost.report.wages,
    'work done: nothing to pay',
  )
  // The court can leave its host.
  const moved = structuredClone(accepted)
  applyEffects(moved, { relocate: 'nameless-cave' })
  assert.equal(moved.hideout, 'nameless-cave')
  assert.ok(moved.flags.includes('hideout:nameless-cave'))
  assert.ok(!moved.flags.includes('hideout:mole-tunnels'))
  assert.equal(hostShare(moved)!.paid, CAVE_SHARE)

  // 6. The finale reads Act V; the Bell must ring; the Candles are warned.
  const dispatchDef = questDef('q-d50-last-dispatch')!
  assert.equal(dispatchDef.aid, FINALE_AID)
  const d50 = onDay(1, 50, { hideout: 'crow-cave', flags: ['komodo-betrayal'] })
  const party = d50.roster.slice(0, 3).map((state) => state.id)
  const alone = previewQuest(d50, 'q-d50-last-dispatch', party)
  assert.deepEqual(alone.aid, [])
  const allied = previewQuest(
    {
      ...d50,
      flags: [
        ...d50.flags,
        'verge-allied',
        'watch-returned',
        'reedlight-lantern',
        'crow-sightings',
      ],
    },
    'q-d50-last-dispatch',
    party,
  )
  assert.deepEqual(
    allied.aid.map((aid) => [aid.label, aid.bonus, aid.stat ?? 'all']),
    [
      ['The Black Verge rides at your flank', 3, 'might'],
      ['The Watch came down off the ridge', 2, 'might'],
      ['Reedlight’s lantern, which does not speak back', 3, 'heart'],
      ['The Crows counted every lantern on the Abbey road', 1, 'all'],
    ],
  )
  assert.deepEqual(
    allied.perRequirement.map((req) => [req.stat, req.aid]),
    [
      ['might', 6],
      ['lore', 1],
      ['heart', 4],
    ],
  )
  assert.ok(allied.chance > alone.chance, 'alliances reach the Day 50 odds')
  const cryptAid = previewQuest(
    { ...d50, flags: [...d50.flags, 'verge-allied'] },
    'q-d50-crypt-path',
    party,
  )
  assert.deepEqual(
    cryptAid.aid,
    [],
    'might help is not shown where might is not needed',
  )
  assert.equal(
    questDef('q-d48-bell-clapper')!.durationDays,
    1,
    'home for Day 49',
  )
  assert.equal(candlesLine(onDay(1, 44)), undefined)
  assert.match(
    candlesLine({
      day: 45,
      memorials: [{ followerId: 'F001', questId: flour, day: 9 }],
    })!.text,
    /Two names on the memorial row.*A Hundred Candles.*One name so far/,
  )
  assert.match(
    candlesLine({
      day: 49,
      memorials: [
        { followerId: 'F001', questId: flour, day: 9 },
        { followerId: 'F002', questId: flour, day: 19 },
      ],
    })!.text,
    /^Two names already/,
  )

  // 7. Honest stakes: direction, never flags or hidden truths.
  const taxScene = DAYS[1]!.audiences.find((a) => a.id === 'd02-dust-tax')!
  for (const option of sceneOpts(taxScene)) {
    const stakes = optionStakes(d2, option)
    for (const stake of stakes)
      for (const flag of option.effects.flags ?? [])
        assert.ok(
          !stake.text.includes(flag),
          `${option.id}: ${flag} stays hidden`,
        )
    if (option.next)
      assert.ok(stakes.some((stake) => /audience continues/.test(stake.text)))
  }
  assert.deepEqual(
    optionStakes(
      d2,
      taxScene.options.find((o) => o.id === 'high')!,
    ).map((s) => [s.text, s.tone]),
    [
      ['+30 brass', 'gain'],
      ['Cools the Ledger', 'loss'],
      ['Cools the Yard', 'loss'],
      ['The hard rate: every 7 days', 'warning'],
    ],
  )
  const voidChits = taxScene.beats![0]!.options.find(
    (o) => o.id === 'void-chits',
  )!
  assert.equal(optionStakes(d2, voidChits)[0]!.text, '−25 brass')
  assert.deepEqual(
    optionStakes(createRun(1), {
      id: 'x',
      label: 'x',
      effects: { affinity: { rustline: 5, freeholds: -5 } },
      response: '',
    }).map((s) => s.text),
    ['Cools Border Freeholds', 'Someone unseen takes note'],
    'a faction in the fog stays in the fog',
  )
  assert.ok(
    optionStakes(d5, {
      id: 'x',
      label: 'x',
      effects: {
        questAid: [{ questId: flour, label: 'x', resolve: 'success' }],
      },
      response: '',
    }).some((s) => /Settles “.*” if nobody goes/.test(s.text)),
  )
}

// --- t-039: Act V and the endings, rewritten from the 2026-10-21 playtest ------
{
  const dayOf = (day: number) => DAYS.find((def) => def.day === day)!
  const scene = (day: number, id: string) =>
    dayOf(day).audiences.find((audience) => audience.id === id)!
  const optionIn = (audience: AudienceDef, id: string, beat?: string) =>
    (beat
      ? audience.beats!.find((entry) => entry.id === beat)!.options
      : audience.options
    ).find((option) => option.id === id)!
  const court = (day: number, flags: string[] = []): FortressRun => {
    const run = onDay(5, day, { flags: ['komodo-betrayal', ...flags] })
    for (const id of ['F005', 'F006', 'F007'])
      if (!run.roster.some((state) => state.id === id))
        run.roster.push({ id, joinedDay: 1, equipment: {} })
    run.beds = 9
    return run
  }
  const lineTexts = (lines: SceneLine[]) =>
    lines.map((line) => (typeof line === 'string' ? line : line.text))

  // Day 47: going home is real. Kiyo and Saffron leave; the Pack rides.
  const kiyoHome = optionIn(scene(47, 'd47-kiyo'), 'home')
  assert.equal(kiyoHome.effects.dismiss?.[0]?.follower, 'F003')
  const d47 = court(47)
  if (!d47.roster.some((state) => state.id === 'F002'))
    d47.roster.push({ id: 'F002', joinedDay: 1, equipment: {} })
  const sentHome = chooseAudienceOption(d47, 'd47-kiyo', 'home').run
  assert.equal(followerStatus(sentHome, 'F003'), 'departed')
  assert.ok(
    epilogueFor(sentHome, 'open-roads')
      .find((entry) => entry.subject.id === 'kiyo')!
      .variant.text.includes('went home'),
    'Kiyo sent home is told as home, not gone with Komodo',
  )
  const saffronGo = chooseAudienceOption(d47, 'd47-saffron', 'go').run
  assert.ok(saffronGo.flags.includes('d47-pack-rides'))
  assert.ok(
    saffronGo.roster.find((state) => state.id === 'F002')!.departed,
    'Saffron goes home',
  )
  const stays = chooseAudienceOption(d47, 'd47-saffron', 'stay').run
  assert.ok(!stays.flags.includes('d47-pack-rides'), 'stay: the Pack stays')
  for (const [flag, label] of [
    ['d47-pack-rides', 'The Pack rides at the Abbey wall'],
    ['d44-dike-blown', 'The fen went down the Abbey’s deep well'],
  ] as const)
    assert.ok(
      FINALE_AID.some(
        (aid) => aid.flags?.includes(flag) && aid.label === label,
      ),
      `${flag} reaches the Day 50 odds`,
    )

  // Day 50: one road with every hand on it is a real choice; dig costs Moles,
  // holding the stairs hands the court a lamp.
  const d50 = court(50)
  const front = chooseAudienceOption(d50, 'd50-roads-in', 'front').run
  const party = d50.roster.slice(0, 3).map((state) => state.id)
  assert.ok(
    previewQuest(front, 'q-d50-last-dispatch', party).aid.some(
      (aid) => aid.label === 'Every hand at the front door',
    ),
    'the front door gets every hand',
  )
  const burrows = scene(50, 'd50-burrows')
  assert.equal(optionIn(burrows, 'dig').effects.strength?.moles, -1)
  assert.ok(optionIn(burrows, 'stairs').effects.items?.includes('carbide-lamp'))
  assert.equal(
    optionIn(burrows, 'vote-dig', 'lumen').effects.strength?.moles,
    -1,
  )
  // Reedlight's lantern lights the well it was made for.
  const lantern = optionIn(scene(46, 'd46-reedlight'), 'take')
  assert.equal(lantern.effects.questAid?.[0]?.questId, 'q-d46-well-that-spoke')

  // Continuity: the last fire seats who is there, at the rank Day 43 left.
  const peace = scene(49, 'd49-whose-peace')
  const plain = lineTexts(sceneLines(court(49), peace)).join('\n')
  assert.match(plain, /Captain Dunmark/)
  assert.match(plain, /Sister Reedlight has set her lantern/)
  const after = lineTexts(
    sceneLines(
      court(49, ['d43-dunmark-demoted', 'd44-dike-blown', 'verge-allied']),
      peace,
    ),
  ).join('\n')
  assert.match(after, /Sergeant Dunmark/)
  assert.doesNotMatch(after, /Captain Dunmark/)
  assert.match(after, /Sister Reedlight did not come/)
  assert.match(after, /Envoy of the Black Verge/)
  const leftOut = peace.beats!.find((beat) => beat.id === 'left-out')!
  assert.match(
    lineTexts(leftOut.lines).join('\n'),
    /Bury two more/,
    'the Candles rule is spoken at the last fire',
  )
  assert.match(dayOf(50).komodo, /here at the fire/, 'Vellum is at the fire')
  assert.ok(
    !/Captain/.test(scene(50, 'd50-if-you-find-him').speaker),
    'Day 50 never re-promotes a demoted Dunmark',
  )
  // The cook walked through the kitchen door the crown opened.
  assert.match(
    lineTexts(
      sceneLines(
        court(47, ['d41-kitchen-door-open']),
        scene(47, 'd47-letter-in-the-flour'),
      ),
    ).join('\n'),
    /Through the door you opened/,
  )
  // Speech in the powder and burrows scenes is quoted.
  for (const line of [
    ...scene(44, 'd44-coal-powder').beats![0]!.lines,
    ...burrows.beats![0]!.lines,
  ])
    assert.match(
      typeof line === 'string' ? line : line.text,
      /^“/,
      'spoken lines are quoted',
    )

  // Day 42: every host's bargain buys something and every host collects in
  // its own voice; Jinx's terms send half an engine up the mission road.
  for (const audience of dayOf(42).audiences.filter((a) =>
    a.id.startsWith('d42-terms-'),
  )) {
    const bargain = optionIn(audience, 'bargain', 'price')
    const flags = bargain.effects.flags ?? []
    assert.ok(
      Object.keys(bargain.effects).some((key) => key !== 'flags') ||
        flags.length > 1,
      `${audience.id}: the bargain does what it says`,
    )
    const hideout = audience.id.slice('d42-terms-'.length)
    assert.ok(
      dueDef(`host-due:${hideout}`)!.line !==
        dueDef('host-due:mole-tunnels')!.line || hideout === 'mole-tunnels',
      `${hideout} collects in its own words`,
    )
  }
  const rail = scene(42, 'd42-terms-rail-station')
  assert.ok(
    optionIn(rail, 'accept').effects.flags?.includes('d42-engine-half-sold'),
  )
  // Brass buys more than words, where both are offered.
  const thistle = scene(42, 'd42-thistledown')
  assert.ok(
    optionIn(thistle, 'repay').effects.affinity!.freeholds! >
      optionIn(thistle, 'names').effects.affinity!.freeholds!,
  )
  const graves = scene(42, 'd42-waystation-graves')
  assert.ok(
    optionIn(graves, 'pay').effects.affinity!.saltroad! >
      optionIn(graves, 'face').effects.affinity!.saltroad!,
  )

  // The epilogue: the vote survives the Candles and the Long Night, and the
  // names are read once, by the ending, not by three subjects.
  const finished = (flags: string[]): FortressRun => ({
    ...createRun(3),
    day: LAST_DAY + 1,
    flags,
  })
  const told = (flags: string[], ending: EndingId) =>
    epilogueFor(finished(flags), ending)
  const candles = told(['horror-sealed', 'peace-iron'], 'hundred-candles')
  assert.match(
    candles.find((entry) => entry.subject.id === 'charter')!.variant.text,
    /iron peace/,
    'A Hundred Candles remembers the vote',
  )
  for (const id of ['yard', 'archive'])
    assert.ok(
      !candles
        .find((entry) => entry.subject.id === id)
        ?.variant.text.match(/names/),
      `${id} does not repeat the reading of the names`,
    )
  const night = told(
    [
      'hideout:mole-tunnels',
      'd42-faced-the-thirty',
      'd50-moles-hold-stairs',
      'peace-tunnels',
    ],
    'long-night',
  )
  for (const [id, words] of [
    ['hideout', /thirty/],
    ['moles', /held the stairs/],
    ['charter', /last fire/],
  ] as const)
    assert.match(
      night.find((entry) => entry.subject.id === id)!.variant.text,
      words,
      `the Long Night remembers ${id}`,
    )
  assert.ok(
    told(['d49-crown-laid-down', 'peace-roads'], 'open-roads').some(
      (entry) => entry.subject.id === 'charter',
    ),
    'laying the crown down is remembered apart from Open Roads',
  )
  assert.doesNotMatch(ENDINGS['hundred-candles'].text, /cost too much/)
}

// t-034: a header tooltip never runs past the header. At 390px a long tab tip centred on an
// edge tab widened the page shell's scroll range by ~24px and anything that scrolled a tab into
// view slid the whole fortress sideways; visible, the tip was cut off mid-word.
{
  // 390px phone: header [20, 370], the Quest-room tab at [249, 268] with a 286.5px tip.
  const shift = tipShift(249, 19, 286.5, 20, 370)
  const left = 249 + 19 / 2 + shift
  assert.ok(left >= 20 + TIP_INSET, 'the tip starts inside the header')
  assert.ok(left + 286.5 <= 370 - TIP_INSET, 'the tip ends inside the header')
  // A tip with room to spare stays centred on its button.
  assert.equal(tipShift(600, 180, 280, 32, 1408), -140)
  // The ledger chip at the far left is pushed right, never left of the header.
  assert.equal(27 + 84 + tipShift(27, 168, 320, 20, 370), 20 + TIP_INSET)
  // Wider than the header: it starts at the header's left edge.
  assert.equal(30 + tipShift(20, 20, 400, 20, 370), 20 + TIP_INSET)

  const page = readFileSync(
    new URL('../../pages/play/emperor-of-dust.vue', import.meta.url),
    'utf8',
  )
  const shell = page.match(/<div\s+v-else\s+class="([^"]*)"/)?.[1] ?? ''
  assert.ok(
    shell.includes('overflow-clip') && !shell.includes('overflow-hidden'),
    'the fortress shell clips; it is not a scroll container a tab can slide',
  )
  assert.match(page, /ref="bar"/, 'the header is measured for its tooltips')
  assert.match(
    page,
    /<header-page-bar console-theme="emperor">[\s\S]*?ref="bar"[\s\S]*?aria-label="Fortress rooms"[\s\S]*?<\/header-page-bar>/,
    'the fortress header rides the shared console system bar',
  )
  assert.match(page, /tipShift\(/, 'header tooltips are fitted with tipShift')
  assert.match(
    page,
    /\.eod-bar \.tooltip-bottom::after\s*\{\s*transform: translateX\(-50%\)/,
    'the tooltip tail stays on its button when the bubble shifts',
  )
}

// --- t-035: Act I playtest rewrites ------------------------------------------
{
  const answer = (run: FortressRun, audience: string, ...ids: string[]) => {
    for (const id of ids) run = chooseAudienceOption(run, audience, id).run
    return run
  }
  const dueIds = (run: FortressRun) => (run.dues ?? []).map((due) => due.id)
  const thistle = 'q-d10-freehold-raid'

  // Day 10: riding out saves Thistledown in part and costs the gate tonight.
  const rode = answer(onDay(5, 10), 'd10-oath', 'ask-ranks', 'ride-out')
  assert.ok(rode.aid?.[thistle]?.some((aid) => aid.resolve === 'partial'))
  assert.ok(
    previewQuest(rode, thistle, ['F003', 'F004']).chance >
      previewQuest(onDay(5, 10), thistle, ['F003', 'F004']).chance,
    'the Watch riding out helps whoever goes',
  )
  for (const id of ['d10-postern-night', 'd10-postern-shut'])
    assert.ok(dueIds(rode).includes(id), id)
  const rodeDawn = finishDay(rode)
  const raid = rodeDawn.report.quests.find((q) => q.questId === thistle)!
  assert.equal(raid.tier, 'partial', 'nobody went, the Watch held the door')
  assert.ok(raid.aided && !rodeDawn.run.flags.includes('thistledown-burned'))
  assert.ok(rodeDawn.report.events.some((e) => /fifteen brass/.test(e)))
  const held = finishDay(
    answer(onDay(5, 10), 'd10-oath', 'ask-ranks', 'hold-gate'),
  )
  assert.ok(
    held.run.flags.includes('thistledown-burned'),
    'the gate, not the village',
  )
  assert.equal(dueDef('d10-postern-night')!.effects!.brass, -15)
  assert.ok(!held.report.events.some((e) => /postern/.test(e)), 'gate held')
  // The Day 6 stocks nailed the postern shut: the theft never happens.
  const nailed = finishDay(
    answer(
      onDay(5, 10, { flags: ['d06-stablehand-stocks'] }),
      'd10-oath',
      'ask-ranks',
      'ride-out',
    ),
  )
  assert.ok(nailed.report.events.some((e) => /nailed shut/.test(e)))
  assert.ok(!nailed.report.events.some((e) => /fifteen brass/.test(e)))

  // “Never cheaply” breaks if the lethal convoy is lost after it is sworn.
  const sworn = (flags: string[]) =>
    finishDay(answer(onDay(5, 10, { flags }), 'd10-oath', 'care')).run
  const broken = sworn(['quest:q-d09-iron-convoy:failure'])
  assert.ok(!broken.flags.includes('oath-of-care'))
  assert.ok(broken.flags.includes('d10-oath-of-care-broken'))
  assert.ok(sworn([]).flags.includes('oath-of-care'), 'kept when nobody fell')

  // A promise to Thistledown nobody keeps costs the Freeholds' trust.
  const promised = answer(onDay(5, 10), 'd10-thistledown', 'promise')
  const unkept = finishDay(promised).run
  assert.ok(unkept.flags.includes('d10-promise-broken'))
  // Striking the Pack's camp settles Thistledown as the scene narrates.
  const struck = finishDay(
    answer(
      onDay(5, 10, { flags: ['pack-camp-mapped'] }),
      'd10-thistledown',
      'ask-colors',
      'strike-camp',
    ),
  ).run
  assert.ok(struck.flags.includes('thistledown-held'))

  // Day 9's two canyon bargains unlock different, costly ways to help
  // Thistledown. Neither can be forged without its actual Day 9 decision.
  const fedCanyon = answer(
    onDay(5, 9),
    'd09-convoy',
    'ask-bands',
    'farmers-fed',
  )
  const ironCanyon = answer(
    onDay(5, 9),
    'd09-convoy',
    'ask-bands',
    'leave-wagon',
  )
  const fedDay10 = onDay(5, 10, { flags: fedCanyon.flags })
  const ironDay10 = onDay(5, 10, { flags: ironCanyon.flags })
  const colorsBeat = DAYS[9]!.audiences
    .find((audience) => audience.id === 'd10-thistledown')!
    .beats!.find((beat) => beat.id === 'colors')!
  const guidesOption = colorsBeat.options.find(
    (option) => option.id === 'hill-guides',
  )!
  const barricadeOption = colorsBeat.options.find(
    (option) => option.id === 'iron-barricade',
  )!
  assert.ok(optionVisible(fedDay10, guidesOption))
  assert.ok(!optionVisible(ironDay10, guidesOption))
  assert.ok(!optionVisible(onDay(5, 10), guidesOption))
  assert.ok(optionVisible(ironDay10, barricadeOption))
  assert.ok(!optionVisible(fedDay10, barricadeOption))
  assert.ok(optionBlockers(fedDay10, barricadeOption).length > 0)

  const guided = answer(
    fedDay10,
    'd10-thistledown',
    'ask-colors',
    'hill-guides',
  )
  assert.equal(guided.local.yard, fedDay10.local.yard - 2)
  assert.ok(guided.flags.includes('d10-hill-guides'))
  assert.ok(dueIds(guided).includes('d10-hill-guides-return'))
  assert.ok(
    previewQuest(guided, thistle, ['F003', 'F004']).chance >
      previewQuest(fedDay10, thistle, ['F003', 'F004']).chance,
  )
  const guidedDawn = finishDay(guided)
  assert.ok(guidedDawn.run.flags.includes('d11-hill-guides-returned'))
  assert.ok(
    guidedDawn.report.events.some((event) =>
      /seven Thistledown families/.test(event),
    ),
  )
  assert.ok(validateRun(JSON.parse(JSON.stringify(guidedDawn.run))))

  const barricaded = answer(
    ironDay10,
    'd10-thistledown',
    'ask-colors',
    'iron-barricade',
  )
  assert.equal(
    barricaded.local['gate-watch'],
    ironDay10.local['gate-watch'] - 2,
  )
  assert.equal(barricaded.affinity.saltroad, ironDay10.affinity.saltroad - 5)
  assert.ok(barricaded.flags.includes('d10-iron-barricade'))
  assert.ok(dueIds(barricaded).includes('d10-iron-barricade-return'))
  assert.ok(
    previewQuest(barricaded, thistle, ['F003', 'F004']).chance >
      previewQuest(ironDay10, thistle, ['F003', 'F004']).chance,
  )
  const barricadeDawn = finishDay(barricaded)
  assert.ok(barricadeDawn.run.flags.includes('d11-iron-barricade-spent'))
  assert.ok(
    barricadeDawn.report.events.some((event) =>
      /burned down to its axles/.test(event),
    ),
  )
  assert.ok(validateRun(JSON.parse(JSON.stringify(barricadeDawn.run))))

  // Day 8's seed-cart choice returns at Thistledown. The player can risk
  // the Watch to retrieve Wenna's family or send a cheaper, uncertain warning.
  const coldRun = onDay(5, 10, {
    flags: ['d08-coldbrooks-home'],
    brass: 50,
  })
  const plainRun = onDay(5, 10, { brass: 50 })
  const coldScene = audiencesToday(coldRun).find(
    (audience) => audience.id === 'd10-thistledown',
  )!
  const coldOption = coldScene.options.find(
    (option) => option.id === 'ask-coldbrook',
  )!
  assert.ok(optionVisible(coldRun, coldOption))
  assert.ok(!optionVisible(plainRun, coldOption))
  assert.ok(optionBlockers(plainRun, coldOption).length > 0)
  const asked = chooseAudienceOption(
    coldRun,
    'd10-thistledown',
    'ask-coldbrook',
  )
  assert.equal(asked.next, 'coldbrook-road')
  const rescued = chooseAudienceOption(
    asked.run,
    'd10-thistledown',
    'escort-coldbrooks',
  ).run
  assert.equal(rescued.brass, coldRun.brass - 15)
  assert.ok(rescued.local.yard < coldRun.local.yard)
  assert.ok(rescued.flags.includes('d10-coldbrooks-escorted'))
  assert.ok(dueIds(rescued).includes('d10-coldbrooks-return'))
  const rescuedDawn = finishDay(rescued)
  assert.ok(rescuedDawn.run.flags.includes('d11-coldbrooks-safe'))
  assert.ok(
    rescuedDawn.report.events.some((event) =>
      /Wenna Coldbrook counts four children/.test(event),
    ),
  )
  assert.ok(validateRun(JSON.parse(JSON.stringify(rescuedDawn.run))))

  const warned = answer(
    onDay(5, 10, { flags: ['d08-coldbrooks-home'], brass: 50 }),
    'd10-thistledown',
    'ask-coldbrook',
    'warn-coldbrooks',
  )
  assert.equal(warned.brass, 50, 'the runner costs no brass')
  assert.ok(dueIds(warned).includes('d10-coldbrooks-warning'))
  const warningDawn = finishDay(warned)
  assert.ok(warningDawn.run.flags.includes('d11-coldbrooks-unaccounted'))
  assert.ok(!warningDawn.run.flags.includes('d11-coldbrooks-safe'))
  assert.ok(warningDawn.report.events.some((event) => /empty cart/.test(event)))
  const villageFirst = answer(
    onDay(5, 10, { flags: ['d08-coldbrooks-home'] }),
    'd10-thistledown',
    'ask-coldbrook',
    'promise',
  )
  assert.ok(villageFirst.flags.includes('d10-thistledown-promised'))
  assert.ok(!villageFirst.flags.includes('d10-coldbrooks-escorted'))

  // Day 9: hiring the Pack rides alongside, it does not replace the escort.
  const convoy = 'q-d09-iron-convoy'
  const day9 = onDay(5, 9, {
    affinity: { ...createRun(5).affinity, jackalwire: 0 },
  })
  const hired = answer(day9, 'd09-convoy', 'hire-pack')
  assert.ok(hired.board.some((entry) => entry.questId === convoy))
  assert.ok(
    previewQuest(hired, convoy, ['F003', 'F004']).chance >
      previewQuest(day9, convoy, ['F003', 'F004']).chance,
  )
  assert.ok(
    /not be home tomorrow/.test(dayLines(day9, DAYS[8]).komodo),
    'Day 9 warns that the convoy party misses Thistledown',
  )

  // Day 7: the storm lands on Day 10, kinder with the crows' hour.
  const crowed = answer(onDay(5, 7), 'd07-crow-warning', 'warn-freeholds')
  assert.equal(crowed.dues?.find((due) => due.id === 'd07-storm')?.day, 10)
  const storm = (flags: string[]) =>
    finishDay(
      onDay(5, 9, { flags, dues: [{ id: 'd07-storm', day: 10, from: 7 }] }),
    ).run
  assert.ok(storm(['crow-forecast-day10']).flags.includes('d10-harvest-in'))
  const lost = storm([])
  assert.ok(lost.flags.includes('d10-harvest-lost'))
  assert.match(dayBriefings(lost)![0].text, /storm took/)
  // Komodo's Day 7 lie can be tested, and he answers for it on Day 10.
  const doubted = answer(
    onDay(5, 7),
    'd07-crow-warning',
    'ask-shelter',
    'galleries-anyway',
  )
  assert.ok(doubted.board.some((entry) => entry.questId === 'q-d07-galleries'))
  assert.match(
    dayLines({ flags: ['d07-galleries-found'] }, DAYS[9]).komodo,
    /clean boots/,
  )

  // Dominant answers now cost something.
  const brokeVane = onDay(5, 5, { flags: ['feast-armed'], brass: 30 })
  const apology = audienceScene(
    answer(brokeVane, 'd05-toll-grudge', 'ask-feast'),
    DAYS[4]!.audiences.find((a) => a.id === 'd05-toll-grudge')!,
  ).options.find((option) => option.id === 'apologize')!
  assert.ok(optionBlockers(brokeVane, apology).length, 'an apology costs forty')
  const flour = DAYS[4]!.audiences.find((a) => a.id === 'd05-flour')!
  const polite = flour.options.find((option) => option.id === 'old-houses')!
  assert.ok(
    optionBlockers(onDay(5, 5), polite).length,
    'the polite ask needs a crown that courted the Houses',
  )
  const charter = DAYS[5]!.audiences.find((a) => a.id === 'd06-market-charter')!
  const rules = charter.options.find((option) => option.id === 'archive-rules')!
  assert.ok(optionBlockers(onDay(5, 6), rules).length, 'the Archive is earned')
  const fair = DAYS[1]!.audiences
    .find((a) => a.id === 'd02-dust-tax')!
    .options.find((option) => option.id === 'fair')!
  assert.ok(
    Object.values(fair.effects.local ?? {}).some((delta) => (delta ?? 0) < 0),
    'a fair rate costs somebody',
  )
  // The Day 3 tincture fee rises, as the factor said.
  const fee = answer(
    onDay(5, 3, { flags: ['pack-medicine'] }),
    'd03-tincture-letter',
    'pay-fee',
  )
  assert.equal(fee.dues?.find((due) => due.id === 'd03-tincture-fee')?.day, 8)
  // Day 5 never tells the dust-lung story twice.
  const toll = DAYS[4]!.audiences.find((a) => a.id === 'd05-toll')!
  const prices = toll.beats!.find((beat) => beat.id === 'prices')!
  assert.doesNotMatch(
    sceneLines({ flags: ['chose:d01-toll:ask-toll'] }, prices)
      .map(lineText)
      .join(' '),
    /Dust lung/,
  )
}

{
  // --- t-038: Act IV playtest rewrites ---------------------------------------
  const act4 = (day: number) => DAYS.find((def) => def.day === day)!
  const scene = (day: number, id: string) =>
    act4(day).audiences.find((audience) => audience.id === id)!
  const everyOption = (audience: AudienceDef, id: string) =>
    [
      ...audience.options,
      ...(audience.beats ?? []).flatMap((beat) => beat.options),
    ].filter((option) => option.id === id)
  /** The run at the dawn a quest leaves the board, nobody sent. */
  const settle = (run: FortressRun, questId: string) => {
    let state = run
    for (let i = 0; i < 4; i += 1) {
      const dawn = finishDay(state)
      state = dawn.run
      const report = dawn.report.quests.find((q) => q.questId === questId)
      if (report) return { run: state, report }
    }
    throw new Error(`${questId} never left the board`)
  }

  // R1: every way to help the Ford costs someone, and the board listens.
  const muster = scene(31, 'd31-muster')
  for (const id of ['pack', 'rustline'])
    for (const option of everyOption(muster, id))
      assert.ok(
        (option.effects.affinity?.freeholds ?? 0) < 0,
        `d31 ${id} costs the Freeholds`,
      )
  for (const option of everyOption(muster, 'volunteers'))
    assert.ok(
      (option.effects.local?.['gate-watch'] ?? 0) < 0,
      'volunteers cost the walls',
    )
  for (const id of ['march', 'pack', 'rustline', 'volunteers', 'porters'])
    for (const option of everyOption(muster, id))
      assert.equal(
        option.effects.questAid?.[0]?.questId,
        'q-d31-iron-rain',
        `d31 ${id} helps the Ford`,
      )
  const marched = chooseAudienceOption(onDay(5, 31), 'd31-muster', 'march').run
  const ford = settle(marched, 'q-d31-iron-rain')
  assert.equal(ford.report.tier, 'partial', 'the Watch held the near bank')
  assert.ok(ford.report.aided)
  assert.ok(!ford.run.flags.includes('ford-lost'), 'nobody says nobody rode')
  // R2: the Watch sent to Thistledown keeps it off the abandoned list.
  let roads = onDay(5, 33, {
    local: { ...createRun(5).local, 'gate-watch': 15 },
  })
  roads = chooseAudienceOption(roads, 'd33-both-roads', 'watch').run
  const thistle = settle(roads, 'q-d33-thistledown')
  assert.ok(thistle.report.aided)
  assert.ok(!thistle.run.flags.includes('thistledown-abandoned'))
  for (const option of everyOption(scene(33, 'd33-both-roads'), 'salt-house'))
    assert.ok((option.effects.affinity?.freeholds ?? 0) < 0)
  // #5: the old win-wins cost a rival now.
  for (const option of everyOption(scene(33, 'd33-sappers'), 'disown'))
    assert.ok((option.effects.strength?.moles ?? 0) < 0, 'the burrows split')
  for (const option of everyOption(scene(35, 'd35-two-bridges'), 'saffron'))
    assert.ok((option.effects.affinity?.moles ?? 0) < 0, 'Granny minds')
  // #8: a road that falls is nobody's road out, or anyone's pledge.
  for (const [questId, route] of [
    ['q-d35-tunnel', 'route-tunnel'],
    ['q-d35-trestle', 'route-trestle'],
  ] as const) {
    const quest = questDef(questId)!
    for (const effects of [quest.rewards.failure, quest.expired])
      assert.ok(effects.clearFlags?.includes(route), `${questId} clears`)
  }
  const dug = chooseAudienceOption(onDay(5, 35), 'd35-two-bridges', 'tunnel')
  const collapsed = settle(dug.run, 'q-d35-tunnel').run
  assert.ok(collapsed.flags.includes('tunnel-collapsed'))
  assert.ok(!collapsed.flags.includes('route-tunnel'), 'no pledge in rubble')

  // R3: the militia can stand the gate, and that is remembered at the fall.
  const militia = scene(34, 'd34-outer-court')
  assert.ok(militia.options.some((o) => o.id === 'stay-on-gate'))
  // R4: the decoy and Teodor really help the cellar party.
  let rehearsal = onDay(5, 36)
  rehearsal = chooseAudienceOption(
    rehearsal,
    'd36-invitation',
    'ask-performance',
  ).run
  rehearsal = chooseAudienceOption(rehearsal, 'd36-invitation', 'decoy').run
  assert.ok(
    previewQuest(rehearsal, 'q-d36-bell-rehearsal', ['F001']).aid.length,
    'the front row draws the sisters’ eyes',
  )
  // Teodor sent to the Abbess goes when she buys, story heard or not.
  const teodorRun = onDay(5, 41, {
    roster: [
      ...createRun(5).roster,
      { id: 'F012', joinedDay: 12, equipment: {} },
    ],
    talksHeard: towerTalks('F012').map((talk) => talk.id),
  })
  const teodor = teodorRun.roster.find((state) => state.id === 'F012')!
  assert.equal(departureCheck(teodorRun, 'abbey', teodor).why, null)
  teodorRun.flags.push('d36-teodor-at-rehearsal')
  assert.equal(departureCheck(teodorRun, 'abbey', teodor).why, 'allegiance')
  assert.equal(departureCheck(teodorRun, 'old-houses', teodor).why, null)
  for (const [buyer, flag, pattern] of [
    ['abbey', 'd36-komodo-at-rehearsal', /You sent him to her yourself/],
    ['abbey', 'rehearsal-attended', /held your hand three hours/],
    ['old-houses', 'd37-vask-son-sent', /Lady Vask’s son/],
    ['black-verge', 'd37-verge-refused', /named three prices/],
  ] as const)
    assert.match(
      fallText(onDay(5, 41, { flags: [flag] }), BUYERS[buyer]).why,
      pattern,
      `${buyer} why reads ${flag}`,
    )

  // #5: the Black Verge is a party the crown can bargain with.
  const terms = scene(37, 'd37-verge-terms')
  for (const option of terms.options.filter((o) =>
    o.effects.flags?.includes(VERGE_PEACE),
  ))
    assert.ok(
      Object.values(option.effects.affinity ?? {}).some((v) => v! < 0) ||
        Object.values(option.effects.local ?? {}).some((v) => v! < 0) ||
        option.effects.dismiss?.length,
      `every Verge price lands on someone: ${option.id}`,
    )
  const vergeRun = onDay(5, 41, {
    strength: { ...createRun(5).strength, 'black-verge': 9, abbey: 1 },
    revealedFactions: [...KINGDOM_FACTIONS],
    flags: ['d20-verge-answered', 'd28-pups-asked', 'sable-sheltered'],
    local: { ...createRun(5).local, 'old-houses': 10 },
  })
  assert.equal(selectBuyer(vergeRun), 'black-verge')
  assert.equal(
    selectBuyer({ ...vergeRun, flags: [...vergeRun.flags, VERGE_PEACE] }),
    'abbey',
    'a peace keeps the Verge from bidding',
  )
  assert.equal(
    selectBuyer({
      ...vergeRun,
      flags: [...vergeRun.flags, VERGE_PEACE, 'congress-common-front'],
    }),
    'black-verge',
    'a common front breaks the peace',
  )
  assert.ok(VERGE_SLIGHTS.includes('d37-verge-refused'))

  // R8: the quiet word is a room the player walks into.
  const quiet = scene(40, 'd40-quiet-word')
  assert.deepEqual(
    quiet.options.map((o) => o.id),
    ['sit', 'accounts'],
    'no one-click exit',
  )
  // Every road to the door goes through the physician question.
  const byBeat = new Map((quiet.beats ?? []).map((beat) => [beat.id, beat]))
  const walkQuiet = (options: AudienceOption[], seen: string[]): void => {
    for (const option of options) {
      if (!option.next) {
        assert.ok(seen.includes('question'), `${option.id} skips the question`)
        continue
      }
      walkQuiet(byBeat.get(option.next)!.options, [...seen, option.next])
    }
  }
  walkQuiet(quiet.options, [])
  assert.ok(!/Tonight I would like/.test(act4(40).komodo), 'morning line')

  // R9: precautions are read at the fall and keep people.
  for (const [flag, pattern] of [
    ['komodo-escorted', /Dunmark at his side/],
    ['d40-seal-order-stood', /by your order/],
  ] as const) {
    const fall = finishDay(onDay(5, 40, { flags: [flag] }))
    assert.match(fall.report.betrayal!.fell!, pattern, flag)
  }
  assert.equal(departureCap(onDay(5, 40)), MAX_DEPARTURES)
  const guarded = onDay(5, 40, {
    flags: ['d40-watch-recalled', 'd38-rosters-changed', 'd40-komodo-held'],
  })
  assert.equal(departureCap(guarded), GUARDED_FLOOR)
  const ready = finishDay(
    quietWord(guarded, ['sit', 'ask', 'no-cure', 'leave']),
  ).report.betrayal!
  assert.equal(ready.ready?.length, 3, 'one line per precaution')
  assert.match(ready.note!, /selling it anyway/, 'the physician answer kept')
  assert.ok(validateRun(finishDay(guarded).run), 'precautions save')
  for (const entry of PRECAUTIONS) assert.ok(entry.line.trim(), entry.id)
  // A neglected court: the guards keep some who had packed.
  const neglected = onDay(5, 41, {
    roster: createRun(5).roster.map((state) => ({ ...state, joinedDay: 1 })),
    local: { ...createRun(5).local, yard: 0, ledger: 0, lamplight: 0 },
  })
  const unguarded = selectDepartures(neglected, 'abbey', MAX_DEPARTURES)
  if (unguarded.length > GUARDED_FLOOR)
    assert.ok(
      selectDepartures(neglected, 'abbey', GUARDED_FLOOR).length <
        unguarded.length,
    )
  assert.match(stayedLine('F003'), /put the bag down/)

  // The map room's hint names the host selectHideout will choose.
  for (let seed = 1; seed <= 20; seed += 1) {
    const run = onDay(seed, 39, {
      revealedFactions: [...KINGDOM_FACTIONS],
      affinity: {
        ...createRun(seed).affinity,
        moles: 40 + seed,
        freeholds: 60 - seed,
      },
      flags: seed % 2 ? ['route-tunnel'] : [],
    })
    assert.equal(
      hideoutForecast(run)[0]?.hideout ?? 'nameless-cave',
      selectHideout(run),
      `forecast seed ${seed}`,
    )
  }
  assert.ok(
    readFileSync('components/EmperorFortressMapRoom.vue', 'utf8').includes(
      'hideoutForecast',
    ),
  )
  // The answer on the step is asked again on Day 50.
  const ifFound = DAYS.find((def) => def.day === 50)!.audiences.find(
    (audience) => audience.id === 'd50-if-you-find-him',
  )!
  for (const flag of [
    'd40-komodo-told-ask',
    'd40-komodo-told-do-it',
    'd40-komodo-told-no-cure',
    'd40-komodo-asked-who',
  ])
    assert.ok(
      ifFound.options.some((o) => o.requires?.flags?.includes(flag)),
      `Day 50 reads ${flag}`,
    )
}

// --- t-041: risk, economy and chores ------------------------------------------
{
  // Needs rise by act; lethal roads ask a quarter more, except roads that
  // carry standing aid (Day 50), where preparation decides the odds.
  assert.deepEqual(ACT_NEED_SCALE.length, 5)
  assert.equal(bandNeed('mid', 1), BAND_NEED.mid)
  assert.equal(
    bandNeed('mid', 45),
    Math.round(BAND_NEED.mid * ACT_NEED_SCALE[4]!),
  )
  assert.ok(bandNeed('high', 31) > bandNeed('high', 21))
  assert.equal(
    bandNeed('high', 9, true),
    Math.round(BAND_NEED.high * LETHAL_NEED_SCALE),
  )
  assert.ok(lethalScaled(questDef('q-d09-iron-convoy')!))
  assert.ok(
    !lethalScaled(questDef('q-d50-last-dispatch')!),
    'finale: aid decides',
  )
  const late = onDay(1, 33)
  late.board.push({
    questId: 'r-bandit-sighting@33',
    postedDay: 33,
    lastDay: 34,
  })
  assert.equal(
    previewQuest(late, 'r-bandit-sighting@33', ['F001'], ['x'])
      .perRequirement[0]?.needed,
    bandNeed('mid', 33),
    'the preview shows the act’s need',
  )
  // Meeting every need exactly is a real call, not a sure thing.
  assert.equal(CHANCE_AT_NEED, 75)

  // A lethal partial can kill too, so an Omen party is not death-proof.
  assert.ok((LETHAL_BLOW.partial ?? 0) > 0 && (LETHAL_BLOW.failure ?? 0) > 0)
  const convoy = questDef('q-d09-iron-convoy')!
  const risky = injuryRisk(convoy, 60, {
    lucky: false,
    encore: false,
    omen: true,
    warden: false,
    guardian: 0,
    surgery: 0,
    size: 3,
  })
  assert.ok(risky.deathChance > 0, 'omen turns failure into a deadly partial')
  assert.equal(
    injuryRisk(convoy, 60, {
      lucky: false,
      encore: false,
      omen: false,
      warden: true,
      guardian: 0,
      surgery: 0,
      size: 3,
    }).deathChance,
    0,
    'a warden still keeps everyone alive',
  )

  // Honest previews: across real campaigns the odds that are rolled always lie
  // inside the range the quest room showed, Cave-Luck included.
  for (const seed of [1, 2, 3]) {
    let run = createRun(seed)
    const known: string[] = []
    let checked = 0
    while (run.day <= 20) {
      const shown = new Map<string, { low: number; high: number }>()
      for (const entry of [...run.board]) {
        const quest = questDef(entry.questId)!
        const ready = run.roster
          .filter((state) => followerStatus(run, state.id) === 'ready')
          .map((state) => state.id)
        const party = quest.mustInclude
          ? [
              quest.mustInclude,
              ...ready.filter((id) => id !== quest.mustInclude),
            ]
          : ready
        const pick = party.slice(
          0,
          Math.max(quest.party.min, Math.min(2, quest.party.max)),
        )
        if (
          pick.length < quest.party.min ||
          pick.some((id) => !ready.includes(id))
        )
          continue
        try {
          const preview = previewQuest(run, entry.questId, pick, known)
          run = assignQuest(run, entry.questId, pick)
          shown.set(entry.questId, preview)
        } catch {
          // A quest this naive party cannot take stays on the board.
        }
      }
      const dawn = finishDay(run, known)
      for (const quest of dawn.report.quests) {
        known.push(...quest.revealedTraits)
        const range = shown.get(quest.questId)
        if (!range || !quest.party.length) continue
        checked += 1
        assert.ok(
          quest.chance >= range.low && quest.chance <= range.high,
          `${quest.questId}: rolled at ${quest.chance}, shown ${range.low}-${range.high}`,
        )
      }
      run = dawn.run
    }
    assert.ok(checked > 10, `seed ${seed}: ${checked} quests checked`)
  }

  // Chores: thirty of them, each with a window, alternates and modest pay.
  assert.ok(QUEST_TEMPLATES.length >= 30, `${QUEST_TEMPLATES.length} chores`)
  for (const chore of QUEST_TEMPLATES) {
    assert.ok(chore.days && chore.days[0] >= 1 && chore.days[1] <= 50, chore.id)
    assert.ok(
      Object.values(chore.outcomeAlts ?? {}).some((lines) => lines.length),
      `${chore.id}: a second line for a second trip`,
    )
    assert.ok((chore.rewards.success.brass ?? 0) <= 12, `${chore.id}: pay`)
  }
  assert.ok(
    QUEST_TEMPLATES.some((chore) => chore.lethal),
    'one chore can cost a friend',
  )
  assert.ok(
    QUEST_TEMPLATES.filter((chore) => chore.days![0] > 40).length >= 3,
    'the court in hiding has its own chores',
  )
  // Whole campaigns: never two copies of a chore at once, never a third
  // posting, never outside its days, never beside its authored twin, and a
  // chore's second trip home never repeats the first trip's line.
  const greedy = POLICIES.find((policy) => policy.id === 'greedy')!
  for (const seed of [1, 2, 3, 4]) {
    let last: FortressRun | undefined
    playCampaign(greedy, seed, (run) => {
      last = run
      const live = [...run.board, ...run.active].map((entry) => entry.questId)
      const chores = live.filter((id) => id.includes('@'))
      assert.equal(
        new Set(chores.map((id) => id.split('@')[0])).size,
        chores.length,
        `seed ${seed} day ${run.day}: two copies of one chore`,
      )
      for (const id of chores) {
        const def = questDef(id)!
        const posted = Number(id.split('@')[1])
        assert.ok(posted >= def.days![0] && posted <= def.days![1], id)
        assert.ok(chorePostings(run, def.id) <= CHORE_POSTINGS, id)
        for (const twin of def.shuns ?? [])
          assert.ok(
            !run.board.some(
              (entry) => entry.questId === twin && entry.postedDay < posted,
            ),
            `${id} beside ${twin}`,
          )
      }
    })
    const lines = new Map<string, string[]>()
    for (const report of last!.reports)
      for (const quest of report.quests)
        if (quest.questId.includes('@')) {
          const key = `${quest.questId.split('@')[0]}:${quest.tier}`
          lines.set(key, [...(lines.get(key) ?? []), quest.text ?? ''])
        }
    for (const [key, texts] of lines) {
      const chore = questDef(key.split(':')[0]!)!
      if ((chore.outcomeAlts?.[key.split(':')[1] as 'success'] ?? []).length)
        assert.equal(new Set(texts).size, texts.length, `${key} repeats itself`)
    }
  }
  const glass = onDay(1, 15)
  glass.board = [{ questId: 'q-d15-study-glass', postedDay: 15, lastDay: 16 }]
  assert.ok(
    !choreOpen(glass, questDef('r-strange-relic')!),
    'the chore never sits beside its authored twin',
  )
  assert.ok(!choreOpen(onDay(1, 20), questDef('r-hidden-bread')!), 'Act V only')

  // Departures with weight. A follower the emperor sat with goes home when
  // the crown turns their own people (kin)...
  const night = (patch: Partial<FortressRun> = {}): FortressRun => {
    const base = onDay(1, 40)
    return {
      ...base,
      board: [],
      beds: 12,
      revealedFactions: [...KINGDOM_FACTIONS],
      roster: [
        ...base.roster,
        ...['F005', 'F008', 'F013'].map((id) => ({
          id,
          joinedDay: 5,
          equipment: {},
        })),
      ],
      ...patch,
    }
  }
  const pack = night({
    talksHeard: ['saffron-1', 'saffron-2'],
    affinity: { ...plain.affinity, jackalwire: -20 - KIN_FALL },
  })
  const saffron = pack.roster.find((state) => state.id === 'F002')!
  assert.ok(
    peopleBroken(pack, followerDef('F002')!),
    'the crown turned the Pack',
  )
  assert.equal(departureCheck(pack, 'abbey', saffron).why, 'kin')
  assert.equal(
    departureCheck(
      { ...pack, affinity: { ...plain.affinity, jackalwire: -20 } },
      'abbey',
      saffron,
    ).why,
    null,
    'a people that was always wary does not pull a heard follower',
  )
  assert.equal(
    departureCheck(
      { ...pack, flags: ['romance-saffron-sealed'] },
      'abbey',
      saffron,
    ).why,
    null,
    'a sealed romance still keeps her',
  )
  const kinFall = finishDay(pack)
  assert.ok(
    kinFall.report.betrayal?.departed.some(
      (entry) => entry.followerId === 'F002' && entry.why === 'kin',
    ),
  )
  assert.match(
    departedFollowers(kinFall.run).find((entry) => entry.followerId === 'F002')!
      .reason,
    /^You sat with her\. Her people .*She went to them\.$/,
  )

  // ...and when nobody else goes, Komodo takes the one the emperor sat with
  // most, named in the briefing from Day 37.
  const close = night({
    // Saffron heard once, so the wary Pack does not pull her by neglect.
    talksHeard: ['rook-1', 'rook-2', 'rook-3', 'saffron-1', 'kiyo-1', 'kiyo-2'],
  })
  const closeRoster = close.roster.map((state) => state.id)
  assert.equal(komodoCourts(close), 'F001', 'the one the emperor sat with most')
  const warned = { ...close, day: COURTING_FROM_DAY }
  assert.match(komodoCourtingLine(warned)!.text, /Rook/)
  assert.equal(
    komodoCourtingLine({ ...close, day: COURTING_FROM_DAY - 1 }),
    undefined,
  )
  const taken = finishDay(close)
  assert.deepEqual(taken.report.betrayal?.departed, [
    { followerId: 'F001', why: 'persuaded' },
  ])
  assert.match(
    departedFollowers(taken.run).find((entry) => entry.followerId === 'F001')!
      .reason,
    /You sat with .* three times\. Young Komodo sat with .* the last night\./,
  )
  assert.ok(validateRun(taken.run), 'saves keep a persuaded departure')
  // Three things stop it: Komodo watched, a sealed romance, or away.
  for (const flag of ['d40-komodo-held', 'd40-komodo-followed']) {
    assert.equal(komodoCourts({ ...close, flags: [flag] }), undefined, flag)
    assert.equal(komodoCourtingLine({ ...warned, flags: [flag] }), undefined)
    assert.deepEqual(
      finishDay({ ...close, flags: [flag] }).report.betrayal?.departed,
      [],
    )
  }
  assert.equal(
    komodoCourts({ ...close, flags: ['romance-rook-sealed'] }),
    'F003',
    'with Rook sealed, Komodo turns to Kiyo',
  )
  const away = {
    ...close,
    active: [
      {
        questId: 'q',
        party: ['F001'],
        departedDay: 40,
        returnsDay: 42,
        postedDay: 40,
        lastDay: 40,
      },
    ],
  }
  assert.equal(komodoCourts(away), 'F003', 'Rook is away; Kiyo is not')
  assert.equal(
    komodoCourts(night()),
    undefined,
    'nobody he can use: no one sat with',
  )
  assert.ok(closeRoster.length > 4)
}

// --- t-036: Act II playtest rewrites ------------------------------------------
{
  const answer = (run: FortressRun, id: string, ...path: string[]) => {
    for (const option of path) run = chooseAudienceOption(run, id, option).run
    return run
  }
  const lineTexts = (run: FortressRun, id: string) => {
    const audience = audiencesToday(run).find((a) => a.id === id)!
    return audienceScene(run, audience).lines.map(lineText).join(' ')
  }
  const seen = (run: FortressRun, id: string) =>
    audiencesToday(run).some((a) => a.id === id)
  const optionIds = (run: FortressRun, id: string) =>
    audienceScene(
      run,
      audiencesToday(run).find((a) => a.id === id)!,
    )
      .options.filter((option) => optionVisible(run, option))
      .map((option) => option.id)

  // 1. Clause eleven can be read for free, and reading it keeps the scene open.
  const d11 = { ...onDay(1, 11), brass: 100 }
  const read = answer(d11, 'd11-rainmaker', 'ask-service', 'read-eleven')
  assert.equal(read.brass, d11.brass, 'reading the clause costs nothing')
  assert.ok(!read.audiencesHeard.includes('d11-rainmaker'), 'still open')
  assert.match(lineTexts(read, 'd11-rainmaker'), /counted by the Conclave/)
  assert.ok(optionIds(read, 'd11-rainmaker').includes('amend-term'))
  // Tamsin reads it aloud and the court still decides.
  const tamsinDay = { ...withCast(4, 11, ['F001', 'F011']), brass: 100 }
  for (const path of [['tamsin'], ['ask-service', 'tamsin']]) {
    const reading = answer(tamsinDay, 'd11-rainmaker', ...path)
    assert.ok(!reading.audiencesHeard.includes('d11-rainmaker'), 'Tamsin')
    assert.match(lineTexts(reading, 'd11-rainmaker'), /I was counted/)
    const signed = answer(reading, 'd11-rainmaker', 'covenant')
    assert.ok(
      signed.flags.includes('rain-covenant') &&
        signed.flags.includes('bonded-runner-clause'),
      'Tamsin’s reading and a signature can stand together',
    )
    // ...so Day 20's question about the clause she read can be asked.
    const day20 = onDay(1, 20, { flags: signed.flags })
    assert.ok(optionIds(day20, 'd20-covenant-due').includes('clause-eleven'))
  }
  // A clause read yourself has its own Day 20 question.
  const selfRead = answer(read, 'd11-rainmaker', 'covenant')
  assert.ok(
    optionIds(
      onDay(1, 20, { flags: selfRead.flags }),
      'd20-covenant-due',
    ).includes('ask-eleven'),
  )
  // A season fixed in the margin on Day 11 is honoured on Day 20, and closes
  // the covenant: nothing more is owed on Day 34.
  const termed = answer(read, 'd11-rainmaker', 'amend-term')
  assert.ok(termed.flags.includes('d11-term-fixed'))
  const termDay = onDay(1, 20, { flags: termed.flags })
  assert.ok(optionIds(termDay, 'd20-covenant-due').includes('hold-term'))
  const kept = answer(termDay, 'd20-covenant-due', 'hold-term', 'keep-term')
  assert.ok(kept.flags.includes('d20-runners-term-fixed'))
  assert.ok(!kept.flags.includes('rain-covenant'))
  // Rain bought for one season is remembered, and can be pledged to the Bell.
  const bought = answer(d11, 'd11-rainmaker', 'one-season')
  assert.ok(bought.flags.includes('d11-rain-bought'))
  assert.ok(
    optionIds(onDay(1, 19, { flags: bought.flags }), 'd19-bell-vote').includes(
      'water',
    ),
  )
  assert.match(
    epilogueFor({ ...onDay(1, 50), flags: bought.flags }, 'open-roads').find(
      (entry) => entry.subject.id === 'crows',
    )!.variant.text,
    /bought one season/,
  )

  // 2. The rain keeps one clock: it breaks on the Day 20 dawn, or never.
  const rainReport = (flags: string[]) =>
    dayBriefings(onDay(1, 20, { flags }))!.find((b) => b.id === 'rains-coming')!
  assert.match(rainReport(['d11-rain-signed']).text, /broke over the Ford/)
  assert.match(rainReport(['d11-rain-bought']).text, /broke over the Ford/)
  assert.match(rainReport(['no-rain']).text, /stop at the tower’s border/)
  assert.doesNotMatch(rainReport([]).text, /within two days/)
  assert.match(dueDef('rain-covenant')!.line, /before dawn/)
  const dam = questDef('q-d20-ford-dam')!
  assert.doesNotMatch(dam.summary, /covenant or not/)
  assert.match(
    questOutcomeText({ ...onDay(1, 21), flags: ['no-rain'] }, dam, 'expired'),
    /the kind the Conclave does not sell/,
  )

  // 3. How the covenant was settled is what later days remember.
  const paid = (flags: string[]) => {
    const eve = onDay(1, 33, {
      flags,
      dues: [
        { id: 'crow-debt', day: 34, from: 20 },
        { id: 'runner-at-gate', day: 34, from: 20 },
      ],
    })
    return finishDay(eve).run
  }
  // A covenant paid in runners sends a person to the gate, not a bill.
  const gate = paid(['covenant-paid-in-runners'])
  assert.ok(seen(gate, 'd34-runner-at-gate'))
  assert.ok(!seen(gate, 'd34-crow-debt'), 'no brass bill on top')
  assert.ok(!seen(paid(['rain-covenant']), 'd34-runner-at-gate'))
  assert.ok(seen(paid(['rain-covenant']), 'd34-crow-debt'), 'brass bills stay')
  assert.ok(
    !seen(
      paid(['covenant-paid-in-runners', 'd20-runners-term-fixed']),
      'd34-runner-at-gate',
    ),
    'a fixed term sends nobody down',
  )
  assert.match(dayBriefings(gate)![1]!.text, /runner in a Conclave sash/)
  // Buy-out comes first (the old brass flow), then the harder roads.
  const gateOptions = audiencesToday(gate).find(
    (a) => a.id === 'd34-runner-at-gate',
  )!.options
  assert.deepEqual(
    gateOptions.map((o) => o.id),
    ['buy-out', 'leave', 'tamsin-goes'],
  )
  assert.equal(gateOptions[0]!.requires?.cost, 60, 'the old bill, in a person')
  assert.ok(
    (gateOptions[0]!.effects.affinity?.['storm-crows'] ?? 0) < 0,
    'buying her out early cools the Crows',
  )
  assert.ok(!optionVisible(gate, gateOptions[2]!), 'no Tamsin, no swap')
  const withTamsin = paid(['covenant-paid-in-runners'])
  withTamsin.roster = [
    ...withTamsin.roster,
    { id: 'F011', joinedDay: 1, equipment: {} },
  ]
  const swapped = answer(
    { ...withTamsin, brass: 0 },
    'd34-runner-at-gate',
    'tamsin-goes',
  )
  assert.equal(
    swapped.roster.find((s) => s.id === 'F011')?.departed?.why,
    'dismissed',
    'Tamsin goes up the Heights in Linnet’s place',
  )
  const left = answer({ ...gate, brass: 0 }, 'd34-runner-at-gate', 'leave')
  assert.ok(left.flags.includes('crow-debt-paid'), 'the term is served')
  assert.match(
    epilogueFor({ ...onDay(1, 50), flags: left.flags }, 'open-roads').find(
      (entry) => entry.subject.id === 'runners',
    )!.variant.text,
    /went off the high path/,
  )
  const courtGate = paid(['covenant-paid-in-runners', 'd20-court-runners'])
  assert.match(lineTexts(courtGate, 'd34-runner-at-gate'), /clerk’s girl/)
  // Day 42 hears the same history the Day 34 gate made.
  const d42 = (flags: string[]) =>
    onDay(1, 42, {
      flags: ['hideout:crow-cave', 'covenant-paid-in-runners', ...flags],
    })
  assert.match(
    lineTexts(d42(left.flags), 'd42-bonded-runners'),
    /sent her back/,
  )
  assert.match(
    lineTexts(d42(['d20-runners-term-fixed']), 'd42-bonded-runners'),
    /to the hour/,
  )
  assert.doesNotMatch(
    lineTexts(d42(['d20-court-runners']), 'd42-bonded-runners'),
    /from the Yard/,
  )
  assert.match(
    epilogueFor(
      {
        ...onDay(1, 50),
        flags: ['covenant-paid-in-runners', 'd20-court-runners'],
      },
      'open-roads',
    ).find((entry) => entry.subject.id === 'runners')!.variant.text,
    /Lady Vask’s nephew/,
  )
  // Brass instead of runners is remembered; pastures ceded keep a pledge.
  const covenant20 = onDay(1, 20, { flags: ['rain-covenant'], brass: 100 })
  const boughtOut = answer(covenant20, 'd20-covenant-due', 'pay-brass')
  assert.ok(boughtOut.dues?.some((due) => due.id === 'crow-substitution'))
  assert.ok(PLEDGES['storm-crows']!.includes('d20-pastures-ceded'))
  assert.ok(PLEDGES['hollow-bell']!.includes('wells-shared'))
  assert.ok(PLEDGES.freeholds!.includes('wells-closed'))
  // The Yard that lost its brass and its children the same morning says so.
  const levied = answer(covenant20, 'd20-levy', 'levy-yard')
  const sent = answer(levied, 'd20-covenant-due', 'send-runners')
  assert.ok(
    finishDay(sent).report.events.some((line) =>
      /Yard gate at dawn/.test(line),
    ),
  )
  const courtSent = answer(
    levied,
    'd20-covenant-due',
    'ask-season',
    'court-runners',
  )
  assert.ok(
    !finishDay(courtSent).report.events.some((line) =>
      /Yard gate at dawn/.test(line),
    ),
    'not when the court sent its own',
  )

  // 4. Hollow Bell votes on its history with the crown.
  const bell = (flags: string[]) => onDay(1, 19, { flags })
  assert.match(
    lineTexts(bell(['d13-bell-saboteur-named']), 'd19-bell-vote'),
    /Hessle boy/,
  )
  assert.match(
    lineTexts(bell(['d18-strangers-walked']), 'd19-bell-vote'),
    /strangers/,
  )
  assert.match(
    lineTexts(bell(['d13-bell-warned']), 'd19-bell-vote'),
    /knocks first/,
  )
  assert.ok(
    optionIds(bell(['d13-bell-saboteur-named']), 'd19-bell-vote').includes(
      'free-miller-son',
    ),
  )
  assert.ok(!optionIds(bell([]), 'd19-bell-vote').includes('free-miller-son'))
  const speechDay = { ...bell(['d13-bell-warned', 'd18-strangers-walked']) }
  speechDay.board = [
    { questId: 'q-d19-bell-speech', postedDay: 19, lastDay: 19 },
  ]
  assert.equal(
    previewQuest(speechDay, 'q-d19-bell-speech', ['F001']).aid.length,
    2,
    'what the crown did for the Bell helps its speaker',
  )
  // A garrison costs the Watch at the Bell every week, and Day 20 notices.
  const garrisoned = answer(
    { ...bell([]), local: { ...bell([]).local, 'gate-watch': 12 } },
    'd19-bell-vote',
    'garrison',
  )
  assert.ok(garrisoned.dues?.some((due) => due.id === 'bell-garrison'))
  assert.equal(dueDef('bell-garrison')!.every, 7)
  assert.match(
    lineTexts(onDay(1, 20, { flags: garrisoned.flags }), 'd20-levy'),
    /at Hollow Bell. You put them there yesterday/,
  )

  // 5. Threats made in Act II come back as dues.
  const scheduled = (effects: { schedule?: string[] } | undefined) =>
    effects?.schedule ?? []
  const sabotage = questDef('q-d13-engine-sabotage')!
  assert.ok(scheduled(sabotage.rewards.failure).includes('vane-bolt'))
  assert.ok(scheduled(sabotage.rewards.success).includes('engine-fails'))
  assert.ok(scheduled(dam.rewards.failure).includes('ford-burrows'))
  assert.ok(scheduled(dam.expired).includes('ford-burrows'))
  assert.ok(
    scheduled(questDef('q-d19-bell-speech')!.expired).includes(
      'bell-gate-shut',
    ),
  )
  assert.ok(VERGE_SLIGHTS.includes('d16-border-silver-seized'))
  const hoard = onDay(1, 16, { brass: 100 })
  const seized = answer(hoard, 'd16-hoarders', 'ask-vask', 'seize-silver')
  assert.ok(seized.dues?.some((due) => due.id === 'verge-change'))
  const plum = answer(
    onDay(1, 20, { flags: seized.flags }),
    'd20-levy',
    'ask-riders',
  )
  assert.match(lineTexts(plum, 'd20-levy'), /silver that went astray/)
  const tokens = answer(
    { ...onDay(1, 18, { flags: ['thistledown-burned'] }), brass: 100 },
    'd18-strangers',
    'ask-thistledown',
    'crown-tokens',
  )
  assert.ok(tokens.dues?.some((due) => due.id === 'thistledown-tokens'))
  assert.equal(dueDef('thistledown-tokens')!.cost, 15, 'the crown answers')

  // 6. Day 12: investigating no longer comes free.
  const cellars = questDef('q-d12-mirefen-cellars')!
  assert.ok((cellars.expired.affinity?.['mire-mothers'] ?? 0) < 0)
  const sworn = answer(onDay(1, 12), 'd12-mire-protection', 'swear-unsearched')
  assert.ok(sworn.board.some((q) => q.questId === 'q-d12-mirefen-defense'))
  assert.ok(!sworn.board.some((q) => q.questId === 'q-d12-mirefen-cellars'))
  assert.ok(
    sworn.local.lamplight < onDay(1, 12).local.lamplight,
    'the oath costs',
  )
  assert.match(
    questOutcomeText(
      { ...onDay(1, 14), flags: ['d12-names-spoken'] },
      cellars,
      'success',
    ),
    /say aloud/,
  )

  // 7. Effects agree with their words.
  const ledgerLevy = audiencesToday(onDay(1, 20))
    .find((a) => a.id === 'd20-levy')!
    .options.find((o) => o.id === 'levy-ledger')!
  assert.ok((ledgerLevy.effects.local?.yard ?? 0) < 0, 'Yard loans go up')
  const fair = audiencesToday(onDay(1, 18))
    .find((a) => a.id === 'd18-fair')!
    .beats!.find((b) => b.id === 'cider')!
    .options.find((o) => o.id === 'barrels-to-road')!
  assert.ok(fair.effects.recruitable?.includes('F018'), 'Vesper, for the road')
}

// --- t-041: the Day 50 roads -----------------------------------------------------
{
  // Every Day 50 road can kill, and no result comes home without a line.
  for (const id of [
    'q-d50-last-dispatch',
    'q-d50-crypt-path',
    'q-d50-ring-the-bell',
  ]) {
    const road = questDef(id)!
    assert.ok(road.lethal, `${id} can cost a follower`)
    for (const tier of ['success', 'partial', 'failure'] as const)
      assert.ok(road.outcomes[tier], `${id}: a ${tier} line`)
    assert.ok(
      road.rewards.partial?.flags?.includes('horror-sealed'),
      `${id}: a partial still shuts the door`,
    )
  }
  // A partial at the bell seals the horror but cracks the bell: no Bell peace.
  const bell = questDef('q-d50-ring-the-bell')!
  assert.ok(!bell.rewards.partial?.flags?.includes('bell-rung'))
  assert.ok(bell.rewards.success.flags?.includes('bell-rung'))
}

// --- t-043: playtest follow-ups --------------------------------------------------
{
  const fortressSource = (file: string) =>
    readFileSync(
      new URL(`../emperorOfDust/fortress/${file}`, import.meta.url),
      'utf8',
    )
  const audienceOn = (day: number, id: string) =>
    DAYS.find((def) => def.day === day)!.audiences.find((a) => a.id === id)!
  const sceneText = (run: FortressRun, day: number, id: string) =>
    audienceScene(run, audienceOn(day, id)).lines.map(lineText).join(' ')
  const optionIds = (run: FortressRun, day: number, id: string) =>
    audienceScene(run, audienceOn(day, id))
      .options.filter((option) => optionVisible(run, option))
      .map((option) => option.id)
  const aidLabels = (run: FortressRun, questId: string, party: string[]) =>
    previewQuest(run, questId, party).aid.map((aid) => aid.label)

  // (4) One Linnet: the Day 34 runner keeps the name; the otter sister on
  // Day 25 is Moll. One Tobin: Pip's lost boy; Granny's grandson is Odo.
  assert.ok(!fortressSource('actThree.ts').includes('Linnet'))
  assert.ok(fortressSource('actThree.ts').includes('That’s Moll.'))
  for (const file of ['actFive.ts', 'moles.ts', 'epilogue.ts'])
    assert.ok(!fortressSource(file).includes('Tobin Umber'), file)
  assert.ok(fortressSource('moles.ts').includes('Odo Umber'))

  // (2) A tied vote leaves a flag, and Day 29 can ask which way Mara broke it.
  assert.ok(
    questDef('q-d19-bell-speech')!.rewards.partial?.flags?.includes(
      'bell-vote-tied',
    ),
  )
  const d29 = (flags: string[]) =>
    chooseAudienceOption(
      onDay(1, 29, { flags }),
      'd29-mayors-secret',
      'ask-cost',
    ).run
  assert.ok(!optionIds(d29([]), 29, 'd29-mayors-secret').includes('ask-tie'))
  const tied = chooseAudienceOption(
    d29(['bell-vote-tied']),
    'd29-mayors-secret',
    'ask-tie',
  ).run
  assert.match(sceneText(tied, 29, 'd29-mayors-secret'), /For the crown/)
  assert.ok(
    chooseAudienceOption(
      tied,
      'd29-mayors-secret',
      'confession',
    ).run.flags.includes('d29-mara-confession'),
  )

  // The hill's plans, copied first on Day 14: the Abbess answers on Day 25,
  // and the plans light the well road on Day 50 unless they went back.
  const d25 = onDay(1, 25, { flags: ['d14-abbey-maps-first'] })
  assert.ok(!optionIds(onDay(1, 25), 25, 'd25-the-abbess').includes('ask-hill'))
  const hill = chooseAudienceOption(d25, 'd25-the-abbess', 'ask-hill').run
  assert.match(sceneText(hill, 25, 'd25-the-abbess'), /Underneath/)
  const returned = chooseAudienceOption(
    hill,
    'd25-the-abbess',
    'return-plans',
  ).run
  assert.ok(returned.flags.includes('d25-hill-plans-returned'))
  const d50 = onDay(1, 50, { hideout: 'crow-cave', flags: ['komodo-betrayal'] })
  const four = d50.roster.slice(0, 3).map((state) => state.id)
  const plans = 'The hill’s old plans: a stair from the well to the lowest room'
  assert.ok(!aidLabels(d50, 'q-d50-crypt-path', four).includes(plans))
  assert.ok(
    aidLabels(
      { ...d50, flags: [...d50.flags, 'd14-abbey-maps-first'] },
      'q-d50-crypt-path',
      four,
    ).includes(plans),
  )
  assert.ok(
    !aidLabels(
      {
        ...d50,
        flags: [
          ...d50.flags,
          'd14-abbey-maps-first',
          'd25-hill-plans-returned',
        ],
      },
      'q-d50-crypt-path',
      four,
    ).includes(plans),
    'plans handed back light nothing',
  )

  // The Archive's copy of the Ford reaches the bodies at the Ford.
  const d22 = onDay(1, 22)
  const pair = d22.roster.slice(0, 2).map((state) => state.id)
  const fordMap = 'The Archive’s copy of the Ford before it moved'
  assert.ok(!aidLabels(d22, 'q-d22-ford-bodies', pair).includes(fordMap))
  assert.ok(
    aidLabels(
      { ...d22, flags: ['maps-copied'] },
      'q-d22-ford-bodies',
      pair,
    ).includes(fordMap),
  )

  // The Saltroad pays the Ledger to read its own roads, and can buy them back.
  const losses = (flags: string[]) =>
    chooseAudienceOption(
      onDay(1, 30, { flags, brass: 100 }),
      'd30-terms',
      'ask-losses',
    ).run
  assert.ok(!optionIds(losses([]), 30, 'd30-terms').includes('buy-roads-back'))
  assert.doesNotMatch(sceneText(losses([]), 30, 'd30-terms'), /Ledger a toll/)
  const sold = losses(['d14-ledger-owns-roads'])
  assert.match(sceneText(sold, 30, 'd30-terms'), /Ledger a toll/)
  const bought = chooseAudienceOption(sold, 'd30-terms', 'buy-roads-back').run
  assert.equal(bought.brass, sold.brass - 20)
  for (const flag of ['sheltered-saltroad', 'd30-roads-bought-back'])
    assert.ok(bought.flags.includes(flag), flag)

  // The Ford dam's reservoir narrows the Iron Rain; a held Ford reaches
  // Thistledown; the waystation and the water tax reach the epilogue.
  const d31 = onDay(1, 31)
  const reservoir = 'The new reservoir drowns the old crossing'
  assert.ok(!aidLabels(d31, 'q-d31-iron-rain', pair).includes(reservoir))
  assert.ok(
    aidLabels(
      { ...d31, flags: ['ford-dam-built'] },
      'q-d31-iron-rain',
      pair,
    ).includes(reservoir),
  )
  const ironRain = questDef('q-d31-iron-rain')!
  assert.match(
    questOutcomeText({ flags: ['ford-dam-built'] }, ironRain, 'triumph'),
    /reservoir/,
  )
  const thistledown = questDef('q-d33-thistledown')!
  for (const tier of ['success', 'failure'] as const)
    assert.match(
      questOutcomeText({ flags: ['ford-held'] }, thistledown, tier),
      /long way round/,
    )
  const told = (flags: string[], id: string) =>
    epilogueFor({ ...onDay(1, 50), flags }, 'iron-peace').find(
      (entry) => entry.subject.id === id,
    )?.variant.text ?? ''
  assert.match(told(['d18-water-taxed'], 'freeholds'), /crown’s well/)
  assert.match(told(['waystation-defended'], 'saltroad'), /gatepost/)

  // Caught at the rehearsal: the Abbey sends plums the next dawn.
  assert.ok(
    questDef('q-d36-bell-rehearsal')!.rewards.failure?.schedule?.includes(
      'marrow-plums',
    ),
  )
  assert.ok(dueDef('marrow-plums')?.hidden)
  // The Crows remember the debt the crown told to wait.
  assert.match(
    sceneText(
      onDay(1, 44, { flags: ['crow-debt-defaulted'] }),
      44,
      'd44-crow-name',
    ),
    /debt would wait/,
  )

  // (3) The deserter saw who opened the gate; what he saw follows the
  // last night. Carrying it home under oath is its own road.
  const cave = (flags: string[]) =>
    chooseAudienceOption(
      chooseAudienceOption(
        onDay(1, 42, {
          hideout: 'nameless-cave',
          flags: ['komodo-betrayal', 'hideout:nameless-cave', ...flags],
        }),
        'd42-terms-nameless-cave',
        'ask',
      ).run,
      'd42-terms-nameless-cave',
      'who-opened',
    ).run
  const caveText = (flags: string[]) =>
    sceneText(cave(flags), 42, 'd42-terms-nameless-cave')
  assert.match(caveText([]), /lifted it himself/)
  assert.match(caveText(['d40-watch-recalled']), /Holloway/)
  assert.match(caveText(['komodo-asked-to-stay']), /A woman of the Watch/)
  assert.match(caveText(['komodo-leave-granted']), /a paper with your seal/)
  assert.match(
    caveText(['d40-komodo-held', 'komodo-asked-to-stay']),
    /postern/,
    'the fall as told outranks the quiet word',
  )
  const witness = chooseAudienceOption(
    cave([]),
    'd42-terms-nameless-cave',
    'carry-it',
  ).run
  assert.ok(witness.flags.includes('d42-deserter-witness'))
  assert.match(
    told(['hideout:nameless-cave', 'd42-deserter-witness'], 'hideout'),
    /under oath/,
  )

  // A host whose demand went unpaid comes to the fire on Day 46: pay late,
  // leave someone, ask for time, or walk out into the nameless cave.
  for (const [hideout, faction] of [
    ['mole-tunnels', 'moles'],
    ['crow-cave', 'storm-crows'],
    ['bell-cellars', 'hollow-bell'],
    ['wagon-circle', 'jackalwire'],
    ['moving-caravan', 'saltroad'],
    ['freehold-barn', 'freeholds'],
    ['rail-station', 'rustline'],
  ] as const) {
    const id = `d46-patience-${hideout}`
    const base = {
      hideout,
      flags: ['komodo-betrayal', `hideout:${hideout}`, 'host-terms-accepted'],
    }
    const calm = onDay(1, HOST_COLLECT_DAY, base)
    assert.ok(
      !audiencesToday(calm).some((a) => a.id === id),
      `${id}: unpaid only`,
    )
    const angry = onDay(1, HOST_COLLECT_DAY, {
      ...base,
      brass: 0,
      flags: [...base.flags, 'host-demand-unpaid'],
    })
    assert.ok(
      audiencesToday(angry).some((a) => a.id === id),
      id,
    )
    const def = audienceOn(HOST_COLLECT_DAY, id)
    const option = (key: string) => def.options.find((o) => o.id === key)!
    assert.equal(option('pay').requires?.cost, HOST_DEMAND)
    assert.equal(option('surety').effects.dismiss?.length, 1)
    assert.equal(
      option('surety').requires?.follower,
      option('surety').effects.dismiss![0]!.follower,
      `${id}: only someone at court can be left`,
    )
    const left = chooseAudienceOption(angry, id, 'leave').run
    assert.equal(left.hideout, 'nameless-cave', `${id}: the court walks out`)
    assert.equal(left.affinity[faction], angry.affinity[faction] - 10)
    const owed = chooseAudienceOption(angry, id, 'time').run
    assert.equal(owed.hideout, hideout)
    assert.equal(owed.affinity[faction], angry.affinity[faction] - 5)
  }
  // In play the Day 46 dawn collects first, then the host comes in person.
  const owing = onDay(1, HOST_COLLECT_DAY - 1, {
    hideout: 'mole-tunnels',
    brass: 0,
    flags: ['komodo-betrayal', 'hideout:mole-tunnels', 'host-terms-accepted'],
    dues: [{ id: 'host-due:mole-tunnels', day: HOST_COLLECT_DAY, from: 42 }],
  })
  const collected = finishDay(owing).run
  assert.ok(collected.flags.includes('host-demand-unpaid'))
  assert.ok(
    audiencesToday(collected).some((a) => a.id === 'd46-patience-mole-tunnels'),
    'the unpaid host is at the fire that evening',
  )

  // (7) Act I's late flags reach later days.
  const briefing = (day: number, id: string) =>
    DAYS.find((def) => def.day === day)!.briefings.find((b) => b.id === id)!
  assert.ok(
    briefing(31, 'watch-thin').variants?.some((v) =>
      v.flags?.includes('d10-oath-of-care-broken'),
    ),
  )
  assert.ok(
    briefing(21, 'vane-offer').variants?.some((v) =>
      v.flags?.includes('d03-tincture-fee-lapsed'),
    ),
  )
  assert.match(
    questOutcomeText({ flags: ['d10-promise-broken'] }, thistledown, 'expired'),
    /Two promises/,
  )
  assert.ok(
    BUYERS['old-houses'].whyVariants?.some((v) =>
      v.flags?.includes('d10-oath-names-houses'),
    ),
  )
  assert.match(
    told(['hideout:nameless-cave', 'd46-host-left'], 'hideout'),
    /walked out/,
  )
}

{
  // --- Challenge a rumour: one look a day, a bounty for the false report ------
  const fresh = onDay(3, 12)
  const reports = dayBriefings(fresh)!
  const lie = reports.find((b) => !b.truth)!
  const truths = reports.filter((b) => b.truth)
  assert.equal(todaysChallenge(fresh), undefined)
  assert.match(
    rumourPrompt(fresh),
    /not every rumour/i,
    'Komodo explains first',
  )

  const caught = challengeRumour(fresh, lie.id)
  assert.equal(caught.caught, true)
  assert.equal(caught.run.brass, fresh.brass + RUMOUR_BOUNTY)
  assert.equal(caught.response, rumourVerdict(lie))
  assert.deepEqual(todaysChallenge(caught.run), {
    day: 12,
    briefingId: lie.id,
    caught: true,
  })
  assert.throws(
    () => challengeRumour(caught.run, truths[0]!.id),
    /already been looked into today/,
  )
  assert.equal(fresh.rumourChallenges, undefined, 'the run is not mutated')

  const cleared = challengeRumour(fresh, truths[0]!.id)
  assert.equal(cleared.caught, false)
  assert.equal(cleared.run.brass, fresh.brass, 'no penalty for a wrong guess')
  assert.match(rumourPrompt(cleared.run), /which of these rings false/i)
  assert.throws(() => challengeRumour(fresh, 'not-a-report'), /did not come in/)

  // The challenge resets each dawn, and saves keep at most one a day.
  const nextDay = finishDay(caught.run).run
  assert.equal(todaysChallenge(nextDay), undefined)
  const second = challengeRumour(
    nextDay,
    dayBriefings(nextDay)!.find((b) => b.truth)!.id,
  ).run
  assert.deepEqual(rumourTally(second), { caught: 1, made: 2 })
  assert.ok(validateRun(JSON.parse(JSON.stringify(second))))
  const doubled = {
    ...second,
    rumourChallenges: [
      ...second.rumourChallenges!,
      second.rumourChallenges![0]!,
    ],
  }
  assert.ok(!validateRun(doubled), 'one challenge a day')

  // Every report has its own investigation line, and they vary across the reign.
  const verdicts = DAYS.flatMap((def) => def.briefings).map(rumourVerdict)
  assert.ok(verdicts.every((line) => line.length >= 40))
  assert.ok(new Set(verdicts).size >= 40, 'investigation lines vary')
  const komodo = DAYS.flatMap((def) => def.briefings).find((b) => b.komodoLie)!
  assert.match(rumourVerdict(komodo), /Komodo laughs it off/)
}

{
  // Act I's Day 6 informant and Day 8 loan have reachable Day 9 consequences.
  const ordinary = onDay(919, 9)
  assert.ok(!audiencesToday(ordinary).some((a) => a.id === 'd09-ledger-cart'))
  assert.ok(!audiencesToday(ordinary).some((a) => a.id === 'd09-postern-list'))

  const debtor = onDay(919, 9, { flags: ['ledger-credit'], brass: 50 })
  const ledgerScene = audiencesToday(debtor).find(
    (a) => a.id === 'd09-ledger-cart',
  )!
  assert.ok(ledgerScene)
  assert.equal(ledgerScene.requires?.flags?.[0], 'ledger-credit')
  const manifest = chooseAudienceOption(
    debtor,
    'd09-ledger-cart',
    'ask-manifest',
  )
  assert.equal(manifest.next, 'manifest')
  assert.equal(manifest.run.audienceBeats?.['d09-ledger-cart'], 'manifest')
  const escort = chooseAudienceOption(
    manifest.run,
    'd09-ledger-cart',
    'escort',
  ).run
  assert.equal(escort.brass, 40, 'escorting medicine costs real brass')
  assert.ok(escort.flags.includes('d09-ledger-cart-witnessed'))
  assert.ok(escort.audiencesHeard.includes('d09-ledger-cart'))
  assert.ok(!escort.audienceBeats?.['d09-ledger-cart'])
  const searched = chooseAudienceOption(debtor, 'd09-ledger-cart', 'search').run
  assert.ok(searched.flags.includes('d09-ledger-cart-searched'))
  assert.ok(searched.local['gate-watch'] > debtor.local['gate-watch'])

  const informant = onDay(919, 9, {
    flags: ['d06-postern-informant'],
  })
  const posternScene = audiencesToday(informant).find(
    (a) => a.id === 'd09-postern-list',
  )!
  assert.ok(posternScene)
  assert.equal(posternScene.requires?.flags?.[0], 'd06-postern-informant')
  const first = chooseAudienceOption(informant, 'd09-postern-list', 'ask-first')
  assert.equal(first.next, 'first-name')
  const witness = chooseAudienceOption(
    first.run,
    'd09-postern-list',
    'take-blame',
  ).run
  assert.ok(witness.flags.includes('d09-postern-crown-witness'))
  assert.ok(witness.audiencesHeard.includes('d09-postern-list'))
  const filed = chooseAudienceOption(
    informant,
    'd09-postern-list',
    'file-list',
  ).run
  assert.ok(filed.flags.includes('d09-postern-list-filed'))
  assert.ok(filed.local['gate-watch'] > informant.local['gate-watch'])
  assert.ok(
    DAYS.find((day) => day.day === 9)!.audiences.length <= 4,
    'Day 9 remains within the four-audience cap',
  )
}

// --- Playbook Forge court additions (conductor emperor-of-dust t-061) ----------
// Four audiences and three quests, each reachable in play: the audience holds
// court on its day, its decisive answer closes it, and the quest is posted.
{
  const ADDED: [number, string, string, string | null][] = [
    [12, 'd12-cistern', 'send-party', 'q-d12-cistern-crack'],
    [28, 'd28-returned-letters', 'carry', 'q-d28-returned-letters'],
    [31, 'd31-seed-corn', 'bring', 'q-d31-seed-corn'],
    [36, 'd36-postern-ladder', 'hang', null],
  ]
  for (const [day, id, optionId, questId] of ADDED) {
    const def = DAYS.find((entry) => entry.day === day)!
    assert.equal(def.audiences.at(-1)!.id, id, `${id} comes last on its day`)
    assert.ok(def.audiences.length <= 4, `day ${day} audiences`)
    const run = onDay(11, day, { brass: 200 })
    assert.ok(
      audiencesToday(run).some((audience) => audience.id === id),
      `${id} holds court on day ${day}`,
    )
    const after = chooseAudienceOption(run, id, optionId).run
    assert.ok(after.audiencesHeard.includes(id), `${id} closes on ${optionId}`)
    if (questId) {
      assert.ok(questDef(questId), `${questId} is authored`)
      assert.ok(
        after.board.some((entry) => entry.questId === questId),
        `${questId} is posted by ${id}`,
      )
    }
  }
  // Asking first still reaches the quest, from inside the probe beat.
  const probes: [number, string, string, string, string][] = [
    [12, 'd12-cistern', 'ask-ash', 'send-party', 'q-d12-cistern-crack'],
    [28, 'd28-returned-letters', 'ask-read', 'carry', 'q-d28-returned-letters'],
    [31, 'd31-seed-corn', 'ask-carts', 'bring', 'q-d31-seed-corn'],
  ]
  for (const [day, id, probe, optionId, questId] of probes) {
    let run = onDay(11, day, { brass: 200 })
    run = chooseAudienceOption(run, id, probe).run
    assert.ok(!run.audiencesHeard.includes(id), `${probe} opens a beat`)
    run = chooseAudienceOption(run, id, optionId).run
    assert.ok(
      run.board.some((entry) => entry.questId === questId),
      `${id}: ${probe} then ${optionId} posts ${questId}`,
    )
  }
  // Callbacks show only to the runs whose past opened them.
  const callbacks: [number, string, string, string][] = [
    [12, 'd12-cistern', 'ask-galleries', 'd07-galleries-found'],
    [28, 'd28-returned-letters', 'maps', 'maps-copied'],
    [31, 'd31-seed-corn', 'remind-wells', 'wells-closed'],
    [36, 'd36-postern-ladder', 'oath-care', 'oath-of-care'],
    [36, 'd36-postern-ladder', 'oath-crown', 'oath-of-crown'],
  ]
  for (const [day, id, optionId, flag] of callbacks) {
    const audience = DAYS.find((entry) => entry.day === day)!.audiences.find(
      (entry) => entry.id === id,
    )!
    const option = audience.options.find((entry) => entry.id === optionId)!
    assert.ok(!optionVisible(onDay(11, day), option), `${optionId} hidden`)
    const remembered = onDay(11, day, { brass: 200, flags: [flag] })
    assert.ok(optionVisible(remembered, option), `${optionId} after ${flag}`)
    chooseAudienceOption(remembered, id, optionId)
  }
  // Quest results land: the cistern seals, the letters go home, the seed comes in.
  for (const [questId, flag] of [
    ['q-d12-cistern-crack', 'd12-cistern-sealed'],
    ['q-d28-returned-letters', 'd28-letters-delivered'],
    ['q-d31-seed-corn', 'd31-seed-in-granary'],
  ] as const)
    assert.ok(questDef(questId)!.rewards.success.flags?.includes(flag), flag)
}

console.log('Emperor of Dust fortress contract: ok')
