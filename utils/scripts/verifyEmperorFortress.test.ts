import assert from 'node:assert/strict'
import { ACT_ONE_DAYS, ACT_ONE_QUESTS } from '../emperorOfDust/fortress/actOne'
import { ACT_ONE_LATE_QUESTS } from '../emperorOfDust/fortress/actOneLate'
import { ACT_TWO_QUESTS } from '../emperorOfDust/fortress/actTwo'
import { DAYS, LAST_DAY, questDef } from '../emperorOfDust/fortress/content'
import {
  BAND_NEED,
  WAGE,
  applyEffects,
  assignQuest,
  audiencesToday,
  bedsUsed,
  buyItem,
  chooseAudienceOption,
  createRun,
  dailyTaxes,
  equipItem,
  finishDay,
  followerStatus,
  injuryDaysLeft,
  isOver,
  optionBlockers,
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
import { STATS } from '../emperorOfDust/fortress/types'
import type { FortressRun } from '../emperorOfDust/fortress/types'

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
const lateKinds = FOLLOWERS.slice(10).map((def) => def.ability.kind)
assert.equal(new Set(lateKinds).size, 10, 'F011-F020 abilities are distinct')
for (const kind of lateKinds)
  assert.equal(
    FOLLOWERS.filter((def) => def.ability.kind === kind).length,
    1,
    `${kind} belongs to one follower`,
  )
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
  Array.from({ length: 20 }, (_, i) => i + 1),
  'Acts I and II are scripted end to end',
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

console.log('Emperor of Dust fortress contract: ok')
