import assert from 'node:assert/strict'
import { ACT_ONE_DAYS, ACT_ONE_QUESTS } from '../emperorOfDust/fortress/actOne'
import { DAYS, LAST_DAY, questDef } from '../emperorOfDust/fortress/content'
import {
  BAND_NEED,
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
  previewQuest,
  recruit,
  selectHideout,
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
import { STATS } from '../emperorOfDust/fortress/types'
import type { FortressRun } from '../emperorOfDust/fortress/types'

// --- content contract -------------------------------------------------------
assert.equal(FOLLOWERS.length, 10, 'F001-F010 are re-expressed; t-011 adds ten')
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
for (const quest of ACT_ONE_QUESTS) {
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
assert.equal(day2.brass, sent.brass + dailyTaxes(day2) - 4 * bedsUsed(day2))
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

// --- barracks and market ----------------------------------------------------
const pip = chooseAudienceOption(
  { ...createRun(5), day: 4, board: [] },
  'd04-letter-from-bell',
  'welcome',
).run
assert.ok(pip.roster.some((state) => state.id === 'F005'))
assert.equal(bedsUsed(pip), 5)
const turnedAway = chooseAudienceOption(
  { ...createRun(5), day: 4, board: [] },
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
      (o) => !(o.requires?.cost ?? 0) || o.requires!.cost! <= run.brass,
    )
    if (option) run = chooseAudienceOption(run, audience.id, option.id).run
  }
  for (const entry of [...run.board]) {
    const quest = questDef(entry.questId)!
    const ready = run.roster
      .filter((state) => followerStatus(run, state.id) === 'ready')
      .map((state) => state.id)
      .slice(0, quest.party.min)
    if (ready.length === quest.party.min)
      run = assignQuest(run, entry.questId, ready)
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

console.log('Emperor of Dust fortress contract: ok')
