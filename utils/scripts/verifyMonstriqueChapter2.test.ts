// MONSTRIQUE Chapter Two, Beach Hex (utils/monstressConvention/chapterTwo.ts):
// the Chapter One handoff, two routes for every required clue, graph search
// to "I made five knives" in both editions from a fresh start and from
// seeded random walks, edition filtering, Norb's hands-off rule, case files,
// achievements and save restore.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CASE_ENDINGS,
  EVIDENCE,
  HOTEL_ROOMS,
  ITEMS,
  TOPICS,
  availableTopics,
  beginChapterTwo,
  chapterMaxScore,
  chapterOf,
  chapterScore,
  maxScore,
  newCase,
  newChapterTwo,
  restoreCase,
  switchInvestigator,
  type CaseAction,
  type CaseEnding,
  type CaseResult,
  type CaseState,
  type RoomId,
} from '../monstressConvention/prologue'
import {
  CHAPTER_TWO_EVIDENCE,
  CHAPTER_TWO_MATURE_FLAGS,
  CHAPTER_TWO_MATURE_HOTSPOTS,
  CHAPTER_TWO_REQUIRED,
  CHAPTER_TWO_ROOMS,
  CHAPTER_TWO_ROOM_IDS,
  CHAPTER_TWO_TOPICS,
  chapterTwoMaxScore,
} from '../monstressConvention/chapterTwo'
import {
  MONSTRIQUE_GENERAL_SPEC,
  actionForAudience,
  roomForAudience,
  travelForAudience,
  type MonstriqueAudience,
} from '../monstressConvention/edition'
import { WALK_AREAS, travelRoute } from '../monstressConvention/navigation'
import {
  MONSTRIQUE_ENDINGS,
  achievementsFor,
} from '../monstressConvention/achievements'
import {
  ENDING_ROUTE_NOTES,
  missedLeads,
  parseRuns,
  recordRun,
  runEntryFor,
} from '../monstressConvention/runHistory'
import {
  generalSafeCase,
  parseAccountSave,
} from '../monstressConvention/accountSave'
import { achievementsForGame } from '../achievements/gameAchievements'
import { MONSTRESS_CONVENTION } from '../playbookKit/games/monstressConvention'
import {
  CHARACTER_MODELS,
  modelForHotspot,
  speakerOf,
} from '../monstrique/characterModels'
import { cutsceneTriggeredBy } from '../monstrique/cutscenes'
import { monstriqueMoodFor } from '../monstrique/sound'

const editions: MonstriqueAudience[] = ['general', 'mature']

// --- 1. Rooms, cast and canon ------------------------------------------------

assert.equal(CHAPTER_TWO_ROOM_IDS.length, 6)
for (const room of CHAPTER_TWO_ROOM_IDS) {
  assert.equal(HOTEL_ROOMS[room].id, room)
  assert.ok(WALK_AREAS[room], room + ' has a walk area')
  assert.ok(HOTEL_ROOMS[room].district, room + ' names its district')
  for (const hotspot of HOTEL_ROOMS[room].hotspots) {
    if (hotspot.verbs.includes('talk'))
      assert.ok(modelForHotspot(hotspot.id), 'model for ' + hotspot.id)
  }
}
assert.ok(HOTEL_ROOMS['city-map'].exits.includes('drive-in'))
assert.ok(HOTEL_ROOMS['city-map'].exits.includes('science-cinema'))
for (const key of Object.keys(CHAPTER_TWO_EVIDENCE)) assert.ok(EVIDENCE[key])
for (const key of Object.keys(CHAPTER_TWO_TOPICS)) assert.ok(TOPICS[key])
assert.ok(ITEMS['reel-can'] && ITEMS['invoice-sheet'])
assert.equal(CHARACTER_MODELS.francesca.general, true)
assert.equal(speakerOf('Dee Dee: Hon.')?.id, 'deedee')
assert.equal(speakerOf('Clem: Kid.')?.id, 'clem')
assert.equal(speakerOf('Francesca: Sit.')?.id, 'francesca')
assert.equal(speakerOf('Iris kills the overheads.'), null)
for (const id of ['clem', 'deedee'] as const)
  assert.match(CHARACTER_MODELS[id].apparentAge, /adult/)

// Spoiler rule: nothing in Chapter Two names the Countess.
assert.doesNotMatch(
  readFileSync(
    new URL('../monstressConvention/chapterTwo.ts', import.meta.url),
    'utf8',
  ),
  /draculina|countess/i,
)
assert.doesNotMatch(
  JSON.stringify(CHAPTER_TWO_ROOMS) +
    JSON.stringify(CHAPTER_TWO_EVIDENCE) +
    JSON.stringify(CHAPTER_TWO_TOPICS),
  /draculina|countess|vampire/i,
)

assert.equal(chapterTwoMaxScore('mature'), 64, 'sixty-four points, for 1964')
assert.ok(chapterTwoMaxScore('general') < 64)
assert.equal(maxScore('mature'), 205, 'Chapter One keeps its 205')

for (const spec of [MONSTRESS_CONVENTION, MONSTRIQUE_GENERAL_SPEC]) {
  assert.ok(spec.endings.some((ending) => ending.id === 'five-knives'))
  assert.ok(spec.acts.some((act) => act.id === 2))
  for (const id of [
    'midnight-matinee',
    'scratched-sleeve',
    'francesca-confesses',
  ])
    assert.ok(
      spec.moments.some((moment) => moment.id === id),
      spec.id + ' ' + id,
    )
}
const catalog = new Set(
  achievementsForGame('monstress-convention').map((entry) => entry.code),
)
for (const code of [
  'monstress-convention-midnight-matinee',
  'monstress-convention-scratched-sleeve',
  'monstress-convention-credit-due',
  'monstress-convention-ending-five-knives',
])
  assert.ok(catalog.has(code), code)

// --- 2. The handoff from Chapter One ----------------------------------------

const leadCase: CaseState = { ...newChapterTwoSource(), ending: 'lead-earned' }
function newChapterTwoSource(): CaseState {
  const filed = newChapterTwo(3)
  return {
    ...filed,
    chapter: undefined,
    filed: undefined,
    flags: filed.flags.filter((flag) => flag !== 'beach-lead'),
    room: 'convention-center',
    ending: null,
  }
}
for (const ending of CASE_ENDINGS) {
  const result = beginChapterTwo({ ...leadCase, ending })
  const opens = ending === 'lead-earned' || ending === 'fifth-hexblade'
  assert.equal(result.changed, opens, 'Chapter Two from ' + ending)
  if (!opens) continue
  assert.equal(chapterOf(result.state), 2)
  assert.deepEqual(result.state.filed, [ending])
  assert.equal(result.state.ending, null)
  assert.equal(result.state.room, 'city-map')
  assert.ok(result.state.flags.includes('beach-lead'))
  for (const clue of leadCase.evidence)
    assert.ok(result.state.evidence.includes(clue), 'keeps ' + clue)
  assert.match(result.line, /Starlite Drive-In/)
  assert.ok(
    cutsceneTriggeredBy(leadCase, result.state, 'general'),
    'the drive to the beach plays once',
  )
  assert.equal(
    beginChapterTwo(result.state).changed,
    false,
    'only Chapter One continues',
  )
}
assert.equal(beginChapterTwo(newCase()).changed, false, 'needs a filed lead')
const chapterOne = { ...newCase(2), flags: ['city-lead'], room: 'city-map' }
for (const edition of editions)
  assert.equal(
    travelForAudience(chapterOne as CaseState, 'drive-in', edition).changed,
    false,
    'the drive-in stays shut during Chapter One',
  )

// --- 3. Two routes per required clue, in both editions ----------------------

function player(edition: MonstriqueAudience, start = newChapterTwo(5)) {
  let state = start
  const apply = (result: CaseResult, label: string) => {
    assert.equal(result.changed, true, edition + ': ' + label)
    state = result.state
  }
  return {
    get state() {
      return state
    },
    act(
      verb: CaseAction['verb'],
      target: string,
      extra: Partial<CaseAction> = {},
    ) {
      apply(
        actionForAudience(state, { verb, target, ...extra }, edition),
        verb + ' ' + target + (extra.topic ? ':' + extra.topic : ''),
      )
    },
    refused(verb: CaseAction['verb'], target: string, extra = {}) {
      const result = actionForAudience(
        state,
        { verb, target, ...extra },
        edition,
      )
      assert.equal(result.changed, false, verb + ' ' + target + ' refused')
      return result.line
    },
    go(room: RoomId) {
      if (state.room === room) return
      apply(
        travelRoute(state, room, (here, there) =>
          travelForAudience(here, there, edition),
        ),
        'travel ' + room,
      )
    },
    swap() {
      apply(switchInvestigator(state), 'switch')
    },
  }
}
type Player = ReturnType<typeof player>
const holds = (p: Player, key: string) =>
  p.state.evidence.includes(key) || p.state.flags.includes(key)

const ROUTES: Record<string, Array<[string, (p: Player) => void]>> = {
  'reel-1964': [
    [
      'Clem runs the reel and Iris shoots the screen',
      (p) => {
        p.go('projection-booth')
        p.act('talk', 'clem')
        p.act('ask', 'clem', { topic: 'reel-1964' })
        p.act('use', 'projector', { item: 'reel-can' })
        p.go('drive-in')
        p.act('photograph', 'starlite-screen')
      },
    ],
    [
      'Iris pockets the can and cranks it on the rewind bench',
      (p) => {
        p.go('projection-booth')
        p.act('take', 'reel-can')
        p.act('use', 'rewind-bench', { item: 'reel-can' })
        assert.ok(!holds(p, 'reel-running'))
      },
    ],
    [
      'Clem runs the reel and Norb counts the knives',
      (p) => {
        p.go('projection-booth')
        p.act('take', 'reel-can')
        p.act('use', 'clem', { item: 'reel-can' })
        p.go('drive-in')
        p.swap()
        p.act('look', 'starlite-screen')
      },
    ],
  ],
  'prop-invoice': [
    [
      'Clem’s key and the invoice spike',
      (p) => {
        p.go('projection-booth')
        p.act('talk', 'clem')
        p.act('ask', 'clem', { topic: 'starlite-office' })
        p.go('starlite-office')
        p.act('photograph', 'invoice-spike')
      },
    ],
    [
      'Dee Dee’s loose plank and the filing-cabinet carbon',
      (p) => {
        p.go('snack-bar')
        p.act('talk', 'deedee')
        p.act('ask', 'deedee', { topic: 'starlite-office' })
        p.go('starlite-office')
        p.act('photograph', 'filing-cabinet')
      },
    ],
    [
      'the pocketed invoice against the colour card',
      (p) => {
        p.go('snack-bar')
        p.act('talk', 'deedee')
        p.act('ask', 'deedee', { topic: 'starlite-office' })
        p.go('starlite-office')
        p.act('take', 'invoice-spike')
        p.act('combine', 'camera', { item: 'invoice-sheet' })
      },
    ],
  ],
  'sleeve-face': [
    [
      'Dee Dee’s Aunt Bea',
      (p) => {
        p.go('snack-bar')
        p.act('talk', 'deedee')
        p.act('ask', 'deedee', { topic: 'scratched-sleeve' })
      },
    ],
    [
      'a raking flash through the glass',
      (p) => {
        p.go('snack-bar')
        p.act('look', 'sleeve-case')
        p.act('photograph', 'sleeve-case')
      },
    ],
  ],
  'office-access': [
    [
      'Clem',
      (p) => {
        p.go('projection-booth')
        p.act('talk', 'clem')
        p.act('ask', 'clem', { topic: 'starlite-office' })
      },
    ],
    [
      'Dee Dee',
      (p) => {
        p.go('snack-bar')
        p.act('talk', 'deedee')
        p.act('ask', 'deedee', { topic: 'starlite-office' })
      },
    ],
  ],
  'bolt-street-lead': [
    [
      'Clem',
      (p) => {
        p.go('projection-booth')
        p.act('talk', 'clem')
        p.act('ask', 'clem', { topic: 'beach-hex-1964' })
        p.act('ask', 'clem', { topic: 'francesca' })
      },
    ],
    [
      'Dee Dee',
      (p) => {
        p.go('snack-bar')
        p.act('talk', 'deedee')
        p.act('ask', 'deedee', { topic: 'francesca' })
      },
    ],
    [
      'the 1964 call sheet',
      (p) => {
        p.go('projection-booth')
        p.act('photograph', 'booth-schedules')
      },
    ],
    [
      'Harker File #2 in Room 205',
      (p) => {
        p.go('odette-room')
        p.act('ask', 'odette-ghost', { topic: 'harker-file-two' })
      },
    ],
  ],
  'lab-access': [
    [
      'the ticket window',
      (p) => {
        p.go('science-cinema')
        p.act('use', 'ticket-window')
      },
    ],
    [
      'the Tesla coil',
      (p) => {
        p.go('science-cinema')
        p.swap()
        p.act('look', 'tesla-jar')
        p.swap()
        p.act('use', 'tesla-jar')
      },
    ],
  ],
}

function withBoltStreet(p: Player): void {
  p.go('snack-bar')
  if (!p.state.flags.includes('deedee-met')) p.act('talk', 'deedee')
  if (!holds(p, 'bolt-street-lead'))
    p.act('ask', 'deedee', { topic: 'francesca' })
}

for (const edition of editions)
  for (const [key, routes] of Object.entries(ROUTES)) {
    assert.ok(routes.length >= 2, key + ' has two routes')
    for (const [name, route] of routes) {
      const p = player(edition)
      if (key === 'lab-access') withBoltStreet(p)
      assert.ok(!holds(p, key), key + ' starts missing')
      route(p)
      assert.ok(holds(p, key), `${edition}: ${key} via ${name}`)
    }
  }

// The finale: Francesca will not talk until all three clues are in.
function fileChapterTwo(edition: MonstriqueAudience, seed = 5): Player {
  const p = player(edition, newChapterTwo(seed))
  ROUTES['sleeve-face']![1]![1](p)
  ROUTES['reel-1964']![1]![1](p)
  withBoltStreet(p)
  ROUTES['lab-access']![0]![1](p)
  p.go('francesca-lab')
  p.act('talk', 'francesca')
  const line = p.refused('ask', 'francesca', { topic: 'hexblades' })
  assert.match(line, /her prop invoice/)
  assert.doesNotMatch(line, /1964 reel|scratched sleeve/)
  assert.ok(availableTopics(p.state, 'francesca').includes('hexblades'))
  ROUTES['prop-invoice']![1]![1](p)
  p.go('francesca-lab')
  p.act('ask', 'francesca', { topic: 'hexblades' })
  return p
}

for (const edition of editions) {
  const p = fileChapterTwo(edition)
  for (const clue of CHAPTER_TWO_REQUIRED) assert.ok(holds(p, clue), clue)
  assert.equal(p.state.ending, 'five-knives')
  assert.match(p.state.transcript.at(-1)!, /I made five knives/)
  assert.equal(
    actionForAudience(
      p.state,
      { verb: 'look', target: 'five-blueprint' },
      edition,
    ).line,
    'Chapter Two has gone to press.',
  )
  assert.equal(
    monstriqueMoodFor(p.state, true),
    'ending-lead',
    'the chapter resolves on the lead theme',
  )
  assert.ok(chapterScore(p.state, edition) > 30)
  assert.equal(chapterMaxScore(p.state, edition), chapterTwoMaxScore(edition))

  // Case file and achievements for the chapter.
  const at = '2026-11-28T06:00:00.000Z'
  const run = runEntryFor(p.state, edition, at)!
  assert.equal(run.ending, 'five-knives')
  assert.equal(run.maxScore, chapterTwoMaxScore(edition))
  assert.ok(run.notes.every((note) => !['shrine', 'bucket'].includes(note)))
  assert.ok(missedLeads(run).length > 0)
  assert.ok(ENDING_ROUTE_NOTES['five-knives'].length > 30)
  const chapterOneRun = runEntryFor(
    { ...newChapterTwoSource(), ending: 'lead-earned' },
    edition,
    '2026-11-28T05:00:00.000Z',
  )!
  assert.equal(chapterOneRun.maxScore, edition === 'general' ? 194 : 205)
  const files = recordRun([chapterOneRun], p.state, edition, at)
  assert.deepEqual(
    parseRuns(JSON.parse(JSON.stringify(files)), edition),
    files,
    'old Chapter One files and new Chapter Two files both survive a reload',
  )
  const before = { ...p.state, ending: null, flags: [...p.state.flags] }
  before.flags = before.flags.filter((flag) => flag !== 'chapter-two-filed')
  const codes = achievementsFor(before, p.state, MONSTRIQUE_ENDINGS.length)
  assert.ok(codes.includes('monstress-convention-ending-five-knives'))
  assert.ok(!codes.includes('monstress-convention-all-endings'))
  assert.ok(!codes.includes('monstress-convention-both-endings'))
  assert.ok(!codes.includes('monstress-convention-full-file'))
  assert.ok(restoreCase(JSON.parse(JSON.stringify(p.state))))
}

// Room 205 reacts to the Starlite and hands over Harker File #2.
for (const edition of editions) {
  const p = player(edition)
  p.go('odette-room')
  assert.ok(
    !availableTopics(p.state, 'violet-ghost').includes('starlite-findings'),
  )
  p.act('ask', 'odette-ghost', { topic: 'harker-file-two' })
  assert.ok(holds(p, 'harker-file-2'))
  ROUTES['sleeve-face']![0]![1](p)
  p.go('odette-room')
  p.act('ask', 'violet-ghost', { topic: 'starlite-findings' })
  assert.ok(holds(p, 'pommel-five'))
  p.act('ask', 'odette-ghost', { topic: 'starlite-findings' })
}

// The invoice favour: gratitude only, never a gate.
{
  const p = player('mature')
  ROUTES['prop-invoice']![2]![1](p)
  assert.ok(p.state.inventory.includes('invoice-sheet'))
  withBoltStreet(p)
  ROUTES['lab-access']![0]![1](p)
  p.go('francesca-lab')
  p.act('use', 'francesca', { item: 'invoice-sheet' })
  assert.ok(holds(p, 'invoice-returned'))
  assert.equal(p.state.gratitude.francesca, 1)
  p.act('flirt', 'francesca')
  assert.ok(holds(p, 'francesca-spark'), 'the coil kiss is mature-only')
  assert.equal(generalSafeCase(p.state), false)
}

// --- 4. Norb never handles items --------------------------------------------

for (const edition of editions) {
  const p = player(edition)
  ROUTES['prop-invoice']![2]![1](p)
  p.go('projection-booth')
  p.act('take', 'reel-can')
  p.swap()
  for (const room of CHAPTER_TWO_ROOM_IDS) {
    const state: CaseState = {
      ...p.state,
      room,
      flags: [...p.state.flags, 'lab-access', 'bolt-street-lead'],
    }
    for (const hotspot of roomForAudience(room, edition).hotspots) {
      for (const verb of ['take', 'use', 'photograph'] as const) {
        const result = actionForAudience(
          state,
          { verb, target: hotspot.id },
          edition,
        )
        assert.equal(result.changed, false, `Norb ${verb} ${hotspot.id}`)
      }
      for (const item of state.inventory)
        assert.equal(
          actionForAudience(
            state,
            { verb: 'use', target: hotspot.id, item },
            edition,
          ).changed,
          false,
          `Norb uses ${item} on ${hotspot.id}`,
        )
    }
    assert.equal(
      actionForAudience(
        state,
        { verb: 'combine', item: 'camera', target: 'invoice-sheet' },
        edition,
      ).changed,
      false,
    )
  }
}

// --- 5. Edition filtering ----------------------------------------------------

for (const room of CHAPTER_TWO_ROOM_IDS) {
  const view = roomForAudience(room, 'general')
  assert.ok(view.hotspots.length > 0, room + ' is a general room')
  for (const hotspot of view.hotspots) {
    assert.ok(
      !(CHAPTER_TWO_MATURE_HOTSPOTS as readonly string[]).includes(hotspot.id),
    )
    assert.ok(!hotspot.verbs.includes('flirt'))
  }
  assert.ok(roomForAudience('city-map', 'general').exits.includes('drive-in'))
}
{
  const p = player('general')
  p.go('drive-in')
  assert.equal(
    actionForAudience(
      p.state,
      { verb: 'use', target: 'convertible' },
      'general',
    ).changed,
    false,
  )
  p.go('snack-bar')
  p.act('talk', 'deedee')
  assert.equal(
    actionForAudience(
      p.state,
      { verb: 'ask', target: 'deedee', topic: 'iris-neck' },
      'general',
    ).changed,
    false,
    'the neck-plaster gag is mature-only',
  )
  const mature = player('mature')
  mature.go('drive-in')
  mature.act('use', 'convertible')
  assert.ok(holds(mature, 'back-seat'))
  assert.equal(generalSafeCase(mature.state), false)
  for (const flag of CHAPTER_TWO_MATURE_FLAGS)
    assert.equal(
      parseAccountSave(
        {
          version: 1,
          savedAt: '2026-11-28T06:00:00.000Z',
          case: { ...newChapterTwo(1), flags: [flag] },
          kit: null,
        },
        'general',
      ),
      null,
      flag + ' never enters a general account save',
    )
}

// --- 6. Graph search: no lockouts, from a fresh start and random walks -------

function offered(state: CaseState, edition: MonstriqueAudience) {
  const steps: Array<() => CaseResult> = []
  const room = roomForAudience(state.room, edition)
  for (const exit of room.exits)
    steps.push(() => travelForAudience(state, exit, edition))
  steps.push(() => switchInvestigator(state))
  for (const hotspot of room.hotspots) {
    for (const verb of hotspot.verbs) {
      if (verb === 'walk') continue
      if (verb === 'ask') {
        for (const topic of availableTopics(state, hotspot.id))
          steps.push(() =>
            actionForAudience(
              state,
              { verb, target: hotspot.id, topic },
              edition,
            ),
          )
        continue
      }
      steps.push(() =>
        actionForAudience(state, { verb, target: hotspot.id }, edition),
      )
    }
    for (const item of state.inventory)
      steps.push(() =>
        actionForAudience(
          state,
          { verb: 'use', target: hotspot.id, item },
          edition,
        ),
      )
  }
  for (const item of state.inventory)
    for (const other of state.inventory)
      if (item !== other)
        steps.push(() =>
          actionForAudience(
            state,
            { verb: 'combine', item, target: other },
            edition,
          ),
        )
  return steps
}

const known = (state: CaseState) =>
  state.flags.length +
  state.evidence.length +
  state.topics.length +
  state.inventory.length +
  state.asked.length

const ROOMS = Object.keys(HOTEL_ROOMS) as RoomId[]

/** Greedy closure: take every new non-ending action until nothing changes. */
function closure(start: CaseState, edition: MonstriqueAudience) {
  let state = start
  const endings = new Set<CaseEnding>()
  const tried = new Set<string>()
  const lines: string[] = []
  for (let guard = 0; guard < 4000; guard++) {
    let moved = false
    for (const step of offered(state, edition)) {
      const result = step()
      if (!result.changed) continue
      if (result.state.ending) {
        endings.add(result.state.ending)
        lines.push(result.line)
        continue
      }
      if (known(result.state) > known(state)) {
        if (CHAPTER_TWO_ROOM_IDS.includes(result.state.room as never))
          lines.push(result.line)
        state = result.state
        moved = true
        break
      }
    }
    if (moved) continue
    const fact = [state.room, state.actor, known(state)].join('|')
    if (!tried.has(fact + '>swap')) {
      tried.add(fact + '>swap')
      state = switchInvestigator(state).state
      continue
    }
    let walked = false
    for (const target of ROOMS) {
      if (target === state.room || tried.has(fact + '>' + target)) continue
      tried.add(fact + '>' + target)
      const result = travelRoute(state, target, (here, there) =>
        travelForAudience(here, there, edition),
      )
      if (result.changed && !result.state.ending) {
        state = result.state
        walked = true
        break
      }
    }
    if (!walked) break
  }
  return { state, endings, lines }
}

function random(seed: number) {
  let value = seed
  return () => {
    value = (value * 1103515245 + 12345) % 2147483648
    return value / 2147483648
  }
}

for (const edition of editions) {
  const fresh = closure(newChapterTwo(1), edition)
  assert.ok(fresh.endings.has('five-knives'), edition + ' fresh Chapter Two')
  assert.ok(generalSafeCase(fresh.state) || edition === 'mature')
  const said = fresh.lines.join(' ')
  assert.ok(said.length > 2000, 'Chapter Two lines were collected')
  assert.doesNotMatch(said, /draculina|countess/i, edition + ' spoiler-free')
  if (edition === 'general') {
    assert.doesNotMatch(said, /kiss|back seat|necker|fun way/i, 'general-safe')
    for (const flag of CHAPTER_TWO_MATURE_FLAGS)
      assert.ok(!fresh.state.flags.includes(flag))
    assert.ok(!fresh.state.flags.some((flag) => flag.startsWith('flirted-')))
  }
  for (let walk = 1; walk <= 16; walk++) {
    const roll = random(walk * 104729)
    let state = newChapterTwo(walk)
    for (let step = 0; step < 80; step++) {
      const options = offered(state, edition)
        .map((next) => next())
        .filter((result) => result.changed && !result.state.ending)
      if (!options.length) break
      state = options[Math.floor(roll() * options.length)]!.state
    }
    const rest = closure(state, edition)
    assert.ok(
      rest.endings.has('five-knives'),
      `${edition} walk ${walk}: Chapter Two stays winnable (${state.room})`,
    )
    if (edition === 'general') assert.ok(generalSafeCase(rest.state))
  }
}

// --- 7. Saves ----------------------------------------------------------------

const oldSave = { ...newCase(4), room: 'front-office' as RoomId }
const restoredOld = restoreCase(JSON.parse(JSON.stringify(oldSave)))!
assert.deepEqual(restoredOld, oldSave, 'a Chapter One save is untouched')
assert.ok(!('chapter' in restoredOld) && !('filed' in restoredOld))
const legacy = JSON.parse(JSON.stringify(oldSave)) as Record<string, unknown>
legacy.version = 2
delete legacy.gratitude
delete legacy.rebuffs
assert.equal(chapterOf(restoreCase(legacy)!), 1)

const midway = fileChapterTwo('general').state
const roundTrip = restoreCase(JSON.parse(JSON.stringify(midway)))!
assert.equal(roundTrip.chapter, 2)
assert.deepEqual(roundTrip.filed, ['lead-earned'])
assert.equal(roundTrip.ending, 'five-knives')

assert.equal(restoreCase({ ...midway, chapter: 3 }), null)
assert.equal(restoreCase({ ...midway, filed: ['nope'] }), null)
assert.equal(restoreCase({ ...midway, filed: 'lead-earned' }), null)

// A hand-edited Chapter Two save without a filed lead falls back to Chapter
// One and never strands Iris in a Chapter Two room.
const forged = restoreCase({
  ...midway,
  filed: ['reckless'],
  room: 'francesca-lab',
  ending: null,
})!
assert.equal(chapterOf(forged), 1)
assert.ok(!CHAPTER_TWO_ROOM_IDS.includes(forged.room as never))
assert.ok(!('filed' in forged))
const leadOnly = newChapterTwo(2)
const stray = restoreCase({
  ...leadOnly,
  flags: [...leadOnly.flags, 'bolt-street-lead'],
  room: 'francesca-lab',
})!
assert.equal(stray.room, 'science-cinema', 'the lab needs its own way in')
const strayest = restoreCase({ ...leadOnly, room: 'francesca-lab' })!
assert.equal(strayest.room, 'city-map', 'and the cinema needs an address')
const strayer = restoreCase({ ...newChapterTwo(2), room: 'starlite-office' })!
assert.equal(strayer.room, 'drive-in')
const wrongEnding = restoreCase({ ...newChapterTwo(2), ending: 'reckless' })!
assert.equal(wrongEnding.ending, null, 'an ending belongs to its chapter')
const chapterOneFive = restoreCase({ ...newCase(2), ending: 'five-knives' })!
assert.equal(chapterOneFive.ending, null)

assert.ok(
  parseAccountSave(
    {
      version: 1,
      savedAt: '2026-11-28T06:00:00.000Z',
      case: midway,
      kit: null,
    },
    'general',
  ),
  'a general Chapter Two case syncs to the account',
)

console.log(
  'Monstrique Chapter Two: Beach Hex handoff, two routes per clue, both editions to "I made five knives", random walks, Norb hands-off, case files and saves passed',
)
