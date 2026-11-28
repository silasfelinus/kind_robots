// MONSTRIQUE case files, the third ending and replay hooks
// (utils/monstressConvention/runHistory.ts, prologue.ts, accountSave.ts).
//
// 1. All three endings are reachable in both editions, scripted and by a
//    graph search: from any point a seeded random walk reaches, the full
//    file is still open, so no earlier choice locks out the third ending.
// 2. Each finished case files one run entry per edition; the general edition
//    never keeps a mature-only detail; old saves without case files load.
// 3. Both stores and the title console are wired to record, show, sync and
//    erase case files, and new cases take the next recorded seed.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  MONSTRIQUE_GENERAL_SPEC,
  actionForAudience,
  roomForAudience,
  travelForAudience,
  type MonstriqueAudience,
} from '../monstressConvention/edition'
import {
  CASE_ENDINGS,
  FIFTH_HEXBLADE_CLUES,
  availableTopics,
  maxScore,
  newCase,
  restoreCase,
  switchInvestigator,
  type CaseAction,
  type CaseEnding,
  type CaseResult,
  type CaseState,
  type RoomId,
} from '../monstressConvention/prologue'
import { travelRoute } from '../monstressConvention/navigation'
import {
  GENERAL_MAX_SCORE,
  MONSTRIQUE_ENDINGS,
} from '../monstressConvention/achievements'
import {
  mergeAccountRuns,
  parseAccountSave,
} from '../monstressConvention/accountSave'
import {
  ENDING_ROUTE_NOTES,
  RUN_HISTORY_LIMIT,
  RUN_NOTES,
  bestRun,
  mergeRuns,
  missedLeads,
  nextCaseSeed,
  noteLabels,
  parseRuns,
  recordRun,
  runEntryFor,
  type CaseRun,
} from '../monstressConvention/runHistory'
import { MONSTRESS_CONVENTION } from '../playbookKit/games/monstressConvention'
import { monstriqueMoodFor } from '../monstrique/sound'
import { achievementsForGame } from '../achievements/gameAchievements'

const source = (path: string) =>
  readFileSync(new URL('../../' + path, import.meta.url), 'utf8')
const editions: MonstriqueAudience[] = ['general', 'mature']

// --- 1. The third ending ----------------------------------------------------

assert.deepEqual([...CASE_ENDINGS].sort(), [...MONSTRIQUE_ENDINGS].sort())
for (const spec of [MONSTRESS_CONVENTION, MONSTRIQUE_GENERAL_SPEC])
  assert.deepEqual(
    spec.endings.map((ending) => ending.id).sort(),
    [...CASE_ENDINGS].sort(),
    spec.id + ' lists all three endings',
  )
const hexblade = MONSTRIQUE_GENERAL_SPEC.endings.find(
  (ending) => ending.id === 'fifth-hexblade',
)!
assert.equal(hexblade.title, 'The Fifth Hexblade')
assert.doesNotMatch(
  hexblade.summary + hexblade.hint + hexblade.art.brief,
  /kiss|flirt|romance|nude|sex|draculina/i,
  'the third ending is general-safe and spoiler-free',
)
assert.equal(
  monstriqueMoodFor(
    { room: 'convention-center', ending: 'fifth-hexblade' },
    true,
  ),
  'ending-lead',
)
const codes = new Set(
  achievementsForGame('monstress-convention').map((entry) => entry.code),
)
for (const code of [
  'monstress-convention-ending-hexblade',
  'monstress-convention-all-endings',
])
  assert.ok(codes.has(code), code)

/** One edition's scripted helpers; every step must change the case. */
function player(edition: MonstriqueAudience, seed = 3) {
  let state = newCase(seed)
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
        verb + ' ' + target,
      )
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

function fileTheLead(p: ReturnType<typeof player>): void {
  if (!p.state.flags.includes('crime-room-access')) {
    p.go('front-office')
    p.act('look', 'guest-ledger')
    p.act('ask', 'marta', { topic: 'room-access' })
  }
  p.go('odette-room')
  if (!p.state.evidence.includes('knife-photo')) p.act('photograph', 'knife')
  p.act('talk', 'odette-ghost')
  p.act('ask', 'odette-ghost', { topic: 'agent-deals' })
  p.act('talk', 'violet-ghost')
  p.act('ask', 'violet-ghost', { topic: 'violet-witness' })
  p.go('ice-alcove')
  p.act('photograph', 'ice-machine')
  p.go('motel-exterior')
  p.act('photograph', 'fan-camera')
  p.go('investigators-room')
  p.act('use', 'desk')
  assert.ok(p.state.flags.includes('city-lead'))
}

function followTheBucket(p: ReturnType<typeof player>): void {
  p.go('investigators-room')
  p.act('ask', 'nico', { topic: 'knife-origin' })
  p.swap()
  p.act('ask', 'nico', { topic: 'knife-origin' })
  p.swap()
  p.go('front-office')
  p.act('photograph', 'memorabilia-case')
  p.go('odette-room')
  p.act('photograph', 'ice-ring')
  p.act('ask', 'violet-ghost', { topic: 'missing-fangs' })
  p.go('ice-alcove')
  p.act('use', 'ice-machine')
  p.go('odette-room')
  p.act('use', 'violet-ghost', { item: 'plastic-fangs' })
}

for (const edition of editions) {
  // The impatient route: both ghosts heard, filed without the knife.
  const rushed = player(edition)
  rushed.go('front-office')
  rushed.act('look', 'guest-ledger')
  rushed.act('ask', 'marta', { topic: 'room-access' })
  rushed.go('odette-room')
  rushed.act('talk', 'odette-ghost')
  rushed.act('ask', 'odette-ghost', { topic: 'agent-deals' })
  rushed.act('talk', 'violet-ghost')
  rushed.act('ask', 'violet-ghost', { topic: 'violet-witness' })
  rushed.go('investigators-room')
  rushed.act('use', 'desk')
  assert.equal(rushed.state.ending, 'reckless', edition)

  // The convention lead without the bucket trail.
  const lead = player(edition)
  fileTheLead(lead)
  lead.go('convention-center')
  lead.act('photograph', 'idol-poster')
  assert.equal(lead.state.ending, 'lead-earned', edition)

  // The full file: the lead plus the bucket trail, in either order.
  for (const bucketFirst of [false, true]) {
    const full = player(edition)
    if (bucketFirst) {
      full.go('front-office')
      full.act('look', 'guest-ledger')
      full.act('ask', 'marta', { topic: 'room-access' })
      full.go('odette-room')
      full.act('photograph', 'knife')
      full.act('talk', 'violet-ghost')
      followTheBucket(full)
      fileTheLead(full)
    } else {
      fileTheLead(full)
      followTheBucket(full)
    }
    for (const clue of FIFTH_HEXBLADE_CLUES)
      assert.ok(full.state.evidence.includes(clue), edition + ' ' + clue)
    full.go('convention-center')
    full.act('photograph', 'idol-poster')
    assert.equal(full.state.ending, 'fifth-hexblade', edition)
    assert.match(full.state.transcript.at(-1)!, /who made five knives/)
    if (edition === 'general')
      assert.doesNotMatch(full.state.transcript.join(' '), /kiss|condom/i)
    assert.ok(restoreCase(JSON.parse(JSON.stringify(full.state))))
    assert.equal(
      actionForAudience(
        full.state,
        { verb: 'look', target: 'idol-poster' },
        edition,
      ).changed,
      false,
      'the case is closed',
    )
  }
}

// Graph search. Every action the stage can offer in an edition, except the
// ones that end the case.
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

const facts = (state: CaseState) =>
  [
    state.room,
    state.actor,
    ...[...state.flags, ...state.evidence, ...state.topics, ...state.inventory]
      .slice()
      .sort(),
    state.asked.length,
  ].join('|')

/** Greedy closure: take every new non-ending action until nothing changes. */
function closure(
  start: CaseState,
  edition: MonstriqueAudience,
  avoid: string[] = [],
) {
  let state = start
  const endings = new Set<CaseEnding>()
  for (let guard = 0; guard < 4000; guard++) {
    let moved = false
    for (const step of offered(state, edition)) {
      const result = step()
      if (!result.changed) continue
      if (avoid.some((clue) => result.state.evidence.includes(clue))) continue
      if (result.state.ending) {
        endings.add(result.state.ending)
        continue
      }
      const knownBefore =
        state.flags.length +
        state.evidence.length +
        state.topics.length +
        state.inventory.length +
        state.asked.length
      const knownAfter =
        result.state.flags.length +
        result.state.evidence.length +
        result.state.topics.length +
        result.state.inventory.length +
        result.state.asked.length
      if (knownAfter > knownBefore) {
        state = result.state
        moved = true
        break
      }
    }
    if (moved) continue
    // Nothing new here: walk to the next room that still offers something.
    let walked = false
    if (!visited.has(facts(state) + '>swap')) {
      visited.add(facts(state) + '>swap')
      state = switchInvestigator(state).state
      continue
    }
    for (const target of ROOMS) {
      if (target === state.room || visited.has(facts(state) + '>' + target))
        continue
      visited.add(facts(state) + '>' + target)
      const result = travelRoute(state, target, (here, there) =>
        travelForAudience(here, there, edition),
      )
      if (
        result.changed &&
        !result.state.ending &&
        !avoid.some((clue) => result.state.evidence.includes(clue))
      ) {
        state = result.state
        walked = true
        break
      }
    }
    if (!walked) break
  }
  return { state, endings }
}
const ROOMS: RoomId[] = [
  'motel-exterior',
  'front-office',
  'ice-alcove',
  'balcony',
  'investigators-room',
  'neighbor-room',
  'odette-room',
  'city-map',
  'convention-center',
]
const visited = new Set<string>()

function random(seed: number) {
  let value = seed
  return () => {
    value = (value * 1103515245 + 12345) % 2147483648
    return value / 2147483648
  }
}

for (const edition of editions) {
  visited.clear()
  const reached = new Set(closure(newCase(1), edition).endings)
  assert.ok(
    reached.has('fifth-hexblade'),
    edition + ' full file from the start',
  )
  // Leave any one clue of the bucket trail unfound and the case files the
  // plain convention lead instead.
  for (const clue of FIFTH_HEXBLADE_CLUES) {
    visited.clear()
    const partial = closure(newCase(1), edition, [clue])
    assert.ok(partial.endings.has('lead-earned'), edition + ' without ' + clue)
    assert.ok(
      !partial.endings.has('fifth-hexblade'),
      edition + ' needs ' + clue,
    )
    for (const ending of partial.endings) reached.add(ending)
  }
  // Without the knife photo, the desk only ever publishes too early.
  visited.clear()
  const knifeless = closure(newCase(1), edition, ['knife-photo'])
  assert.deepEqual([...knifeless.endings], ['reckless'], edition + ' no knife')
  reached.add('reckless')
  for (let walk = 1; walk <= 24; walk++) {
    const roll = random(walk * 7919)
    let state = newCase(walk)
    for (let step = 0; step < 90; step++) {
      const results = offered(state, edition)
        .map((next) => next())
        .filter((result) => result.changed)
      for (const result of results)
        if (result.state.ending) reached.add(result.state.ending)
      const options = results.filter((result) => !result.state.ending)
      if (!options.length) break
      state = options[Math.floor(roll() * options.length)]!.state
    }
    visited.clear()
    const rest = closure(state, edition)
    for (const ending of rest.endings) reached.add(ending)
    assert.ok(
      rest.endings.has('fifth-hexblade'),
      `${edition} walk ${walk}: the full file stays open (${state.room})`,
    )
  }
  for (const ending of CASE_ENDINGS)
    assert.ok(reached.has(ending), edition + ' graph reaches ' + ending)
}

// --- 2. Case files ----------------------------------------------------------

const played = (() => {
  const p = player('general', 4)
  fileTheLead(p)
  followTheBucket(p)
  p.go('convention-center')
  p.act('photograph', 'idol-poster')
  return p.state
})()
const at = '2026-11-28T04:00:00.000Z'
const general = runEntryFor(played, 'general', at)!
assert.equal(general.ending, 'fifth-hexblade')
assert.equal(general.edition, 'general')
assert.equal(general.seed, 4)
assert.equal(general.maxScore, GENERAL_MAX_SCORE)
assert.ok(general.score > 0 && general.score <= GENERAL_MAX_SCORE)
assert.equal(general.moves, played.transcript.length - 1)
assert.equal(general.clues, played.evidence.length)
assert.equal(general.rebuffs, 0)
for (const id of [
  'prop-mark',
  'shrine',
  'ice-ring',
  'bucket',
  'fangs-returned',
])
  assert.ok(general.notes.includes(id as never), id)
assert.ok(!general.notes.includes('violet-paid'))
assert.deepEqual(missedLeads(general, 1), [RUN_NOTES['violet-paid'].missed])
assert.ok(noteLabels(general).includes(RUN_NOTES.shrine.done))
assert.equal(runEntryFor(newCase(), 'general', at), null)
for (const ending of CASE_ENDINGS)
  assert.ok(ENDING_ROUTE_NOTES[ending].length > 30)

// Mature details stay in the mature edition.
const kissed: CaseState = {
  ...played,
  flags: [...played.flags, 'ghost-kiss'],
  rebuffs: 4,
}
const mature = runEntryFor(kissed, 'mature', '2026-11-28T05:00:00.000Z')!
assert.ok(mature.notes.includes('cold-kiss'))
assert.equal(mature.rebuffs, 4)
assert.equal(mature.maxScore, maxScore('mature'))
const generalOnly = runEntryFor(kissed, 'general', at)!
assert.ok(!generalOnly.notes.includes('cold-kiss'))
assert.equal(generalOnly.rebuffs, 0)
assert.ok(
  !missedLeads({ ...general, notes: [] }, 99).includes(
    RUN_NOTES['cold-kiss'].missed,
  ),
)
assert.deepEqual(parseRuns([mature, general], 'general'), [general])
assert.deepEqual(parseRuns([mature, general], 'mature'), [mature])
assert.deepEqual(
  parseRuns(
    [{ ...general, notes: [...general.notes, 'cold-kiss'], rebuffs: 9 }],
    'general',
  ),
  [general],
  'a forged general entry loses mature details',
)
for (const broken of [
  null,
  'runs',
  [{ ...general, ending: 'secret' }],
  [{ ...general, maxScore: 999 }],
  [{ ...general, score: GENERAL_MAX_SCORE + 1 }],
  [{ ...general, finishedAt: 'yesterday' }],
  [{ ...general, seed: 1.5 }],
])
  assert.deepEqual(
    parseRuns(broken, 'general'),
    [],
    JSON.stringify(broken).slice(0, 60),
  )

// History: newest first, permanent, merged, capped.
let history: CaseRun[] = []
for (let n = 0; n < RUN_HISTORY_LIMIT + 5; n++)
  history = recordRun(
    history,
    { ...played, seed: n + 1 },
    'general',
    new Date(Date.UTC(2026, 10, 1, 0, n)).toISOString(),
  )
assert.equal(history.length, RUN_HISTORY_LIMIT)
assert.equal(history[0]!.seed, RUN_HISTORY_LIMIT + 5)
assert.equal(nextCaseSeed(history), RUN_HISTORY_LIMIT + 6)
assert.equal(nextCaseSeed([]), 1, 'the first case keeps the original seed')
assert.deepEqual(recordRun(history, newCase(), 'general', at), history)
assert.deepEqual(mergeRuns(history, history), history)
const phone = [general]
const laptop = [
  runEntryFor(
    { ...played, ending: 'lead-earned' },
    'general',
    '2026-11-27T01:00:00.000Z',
  )!,
]
assert.deepEqual(
  mergeRuns(phone, laptop).map((run) => run.ending),
  ['fifth-hexblade', 'lead-earned'],
)
const weaker = { ...laptop[0]!, id: 'weaker', score: general.score - 10 }
assert.equal(bestRun([weaker, general])?.id, general.id)
assert.equal(bestRun([general, weaker])?.id, general.id)
assert.equal(bestRun([]), null)

// Account saves carry case files; old saves without them still load.
const save = {
  version: 1,
  savedAt: at,
  case: played,
  kit: null,
  runs: [general, mature],
}
const parsedGeneral = parseAccountSave(save, 'general')
assert.ok(parsedGeneral)
assert.deepEqual(
  parsedGeneral.runs,
  [general],
  'the general slot keeps no mature run',
)
assert.deepEqual(
  parseAccountSave({ ...save, runs: undefined }, 'general')?.runs,
  [],
)
assert.deepEqual(
  parseAccountSave({ ...save, runs: 'nope' }, 'general')?.runs,
  [],
)
assert.equal(parseAccountSave(save, 'mature')?.runs.length, 1)
assert.deepEqual(mergeAccountRuns(phone, null), { runs: phone, upload: true })
assert.deepEqual(mergeAccountRuns([], { ...parsedGeneral, runs: laptop }), {
  runs: laptop,
  upload: false,
})
assert.equal(
  mergeAccountRuns(phone, { ...parsedGeneral, runs: laptop }).upload,
  true,
)

// --- 3. Wiring ----------------------------------------------------------------

const publicStore = source('stores/monstriquePublicStore.ts')
const adminStore = source('stores/monstressConventionStore.ts')
for (const [path, store] of [
  ['public', publicStore],
  ['admin', adminStore],
] as const) {
  assert.match(
    store,
    /ending && !prev\.ending\)\s+storeRuns\(/,
    path + ' files a run once per ending',
  )
  assert.match(store, /recordRun\(/, path)
  assert.match(
    store,
    /newCase\(nextCaseSeed\(runs\.value\)\)/,
    path + ' seeds each new case',
  )
  assert.match(
    store,
    /localStorage\.removeItem\(runsKey\(?[^)]*\)?\)/,
    path + ' erase clears case files',
  )
  assert.match(
    store,
    /runsUnreadable/,
    path + ' leaves unreadable case files untouched',
  )
  for (const loader of ['function load(', 'function loadMode(']) {
    const from = store.indexOf(loader)
    if (from < 0) continue
    const indent = store.slice(store.lastIndexOf('\n', from) + 1, from)
    const close = store.indexOf('\n' + indent + '}\n', from)
    assert.ok(close > from, path + ' ' + loader + ' body found')
    const body = store.slice(from, close)
    assert.match(body, /loadRuns\(/, path + ' loads case files with the case')
    assert.ok(
      !body.includes('recordRun'),
      path + ' never files a run while loading',
    )
  }
}
assert.match(
  publicStore,
  /runs: runsRef\(mode\)\.value/,
  'account save carries case files',
)
assert.match(
  publicStore,
  /mergeRemoteRuns\(mode, remote\)/,
  'account sync merges case files',
)
assert.match(
  publicStore,
  /key\(mode\) \+ '-runs'/,
  'case files are kept per edition',
)

const front = source('components/monstrexx/monstrexx-front.vue')
assert.match(front, /data-testid="monstrique-scrapbook-cases"/)
assert.match(front, /data-testid="monstrique-case-files"/)
assert.match(front, /v-for="file in caseFiles"/)
assert.match(front, /run\.edition === 'mature' && audience\.value === 'mature'/)
assert.match(front, /<MonstriqueAlbumArchive[\s\S]*v-else/)
const scene = source(
  'components/monstress-convention/monstress-convention-scene.vue',
)
assert.match(
  scene,
  /<h2 class="text-3xl font-bold">\{\{ endingTitle \}\}<\/h2>/,
)
assert.match(scene, /data-testid="monstrique-ending-route"/)
assert.match(
  scene,
  /\.mc-ending-card \{\s+max-height: 100%;\s+overflow-y: auto;/,
  'a long ending scrolls inside its card so NEW CASE stays reachable on phones',
)

console.log(
  'Monstrique case files: three endings reachable in both editions, the full file never locked out, edition-scoped run history, account sync and replay seeds passed',
)
