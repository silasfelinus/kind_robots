// MONSTRIQUE opening slice (conductor projects/monstress-convention/
// OPENING-SLICE.md, "Fail-forward requirements"), in both editions:
//
// 1. Two ways into Room 205: Marta's key (staff assistance) and the fire
//    escape (a legitimate emergency entry: Dolores's window plus Pip's note
//    on 205's broken latch). Half the puzzle never changes anything.
// 2. Every ice-timing route works on its own.
// 3. Weapon origin has a lead that needs neither Norb nor the knife photo:
//    Dolores the superfan. Marta's answer supports the misdirect only.
// 4. Graph search from a fresh start: the full file is reachable, with each
//    route family blocked in turn, and no seeded random walk locks it out.
// 5. The fail-forward mini-case: a reckless headline becomes a retraction,
//    three facts file a correction, and the case runs on to the convention
//    lead, Chapter Two and the full file.
// 6. Saves round-trip (version 3, optional fields only), old saves restore,
//    nothing new is mature-only, the score stays 205 and the stage is wired.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CORRECTION_FLAG,
  FIFTH_HEXBLADE_CLUES,
  FIRE_ESCAPE_ENTRY,
  RETRACTION_FACTS,
  RETRACTION_FLAG,
  WINDOW_LATCH,
  availableTopics,
  beginChapterTwo,
  beginRetraction,
  caseScore,
  maxScore,
  missingFacts,
  newCase,
  newChapterTwo,
  restoreCase,
  retractionOpen,
  switchInvestigator,
  topicsFor,
  type CaseAction,
  type CaseEnding,
  type CaseResult,
  type CaseState,
  type Investigator,
  type RoomId,
} from '../monstressConvention/prologue'
import {
  actionForAudience,
  roomForAudience,
  travelForAudience,
  type MonstriqueAudience,
} from '../monstressConvention/edition'
import { travelRoute } from '../monstressConvention/navigation'
import {
  generalSafeCase,
  parseAccountSave,
} from '../monstressConvention/accountSave'
import { achievementsFor } from '../monstressConvention/achievements'
import { recordRun } from '../monstressConvention/runHistory'

const editions: MonstriqueAudience[] = ['general', 'mature']
const SPOILER = /draculina|countess/i
const UNSAFE = /kiss|back seat|necker|fun way|\bgin\b|\bsex/i
const source = (path: string) =>
  readFileSync(new URL('../../' + path, import.meta.url), 'utf8')

function player(edition: MonstriqueAudience, start: CaseState = newCase(5)) {
  let state = start
  const apply = (result: CaseResult, label: string) => {
    assert.equal(result.changed, true, `${edition}: ${label}: ${result.line}`)
    state = result.state
    return result
  }
  return {
    get state() {
      return state
    },
    set state(next: CaseState) {
      state = next
    },
    act(
      verb: CaseAction['verb'],
      target: string,
      extra: Partial<CaseAction> = {},
    ) {
      return apply(
        actionForAudience(state, { verb, target, ...extra }, edition),
        `${verb} ${target}`,
      )
    },
    /** An action that must leave the case exactly as it was. */
    try(
      verb: CaseAction['verb'],
      target: string,
      extra: Partial<CaseAction> = {},
    ) {
      const result = actionForAudience(
        state,
        { verb, target, ...extra },
        edition,
      )
      assert.equal(result.changed, false, `${edition}: ${verb} ${target}`)
      assert.equal(result.state, state)
      return result
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
    as(actor: Investigator) {
      if (state.actor !== actor) apply(switchInvestigator(state), 'swap')
    },
  }
}
type Player = ReturnType<typeof player>
const holds = (state: CaseState, key: string) =>
  state.evidence.includes(key) || state.flags.includes(key)

function seeTheScene(p: Player): void {
  p.go('front-office')
  p.act('look', 'guest-ledger')
  p.act('use', 'marta')
  p.go('odette-room')
}

// --- 1. Two ways into Room 205 ----------------------------------------------

for (const edition of editions) {
  const room = roomForAudience('neighbor-room', edition)
  const window = room.hotspots.find((spot) => spot.id === 'fire-escape')
  assert.ok(window, edition + ': the fire escape window is on stage')
  assert.deepEqual(window.verbs, ['look', 'use'])

  // Staff assistance: Marta's key, asked or handed over.
  for (const ask of [true, false]) {
    const p = player(edition)
    p.go('front-office')
    if (ask) {
      p.act('talk', 'marta')
      p.act('ask', 'marta', { topic: 'room-access' })
    } else {
      p.act('look', 'guest-ledger')
      p.act('use', 'marta')
    }
    assert.ok(holds(p.state, 'crime-room-access'))
    assert.ok(p.state.inventory.includes('motel-key'))
    p.go('odette-room')
    assert.ok(p.state.evidence.includes('double-murder'))
  }

  // Emergency entry, in either order, without Marta.
  for (const logFirst of [true, false]) {
    const p = player(edition)
    const readLog = () => {
      p.go('ice-alcove')
      p.act('look', 'maintenance-log')
      assert.ok(p.state.flags.includes(WINDOW_LATCH))
      assert.match(p.state.transcript.at(-1)!, /LATCH BROKEN/)
    }
    if (logFirst) readLog()
    p.go('neighbor-room')
    p.act('look', 'fire-escape')
    p.try('use', 'fire-escape')
    assert.match(
      actionForAudience(
        p.state,
        { verb: 'use', target: 'fire-escape' },
        edition,
      ).line,
      /Ask me about last night/,
    )
    p.act('talk', 'neighbor')
    p.act('ask', 'neighbor', { topic: 'unknown-visitor' })
    assert.ok(!holds(p.state, 'crime-room-access'), 'Dolores is no free pass')
    assert.match(p.state.transcript.at(-1)!, /fire escape/)
    if (!logFirst) {
      const half = p.try('use', 'fire-escape')
      assert.match(half.line, /writes everything down/)
      readLog()
      p.go('neighbor-room')
    }
    p.as('nico')
    const norb = p.try('use', 'fire-escape')
    assert.match(norb.line, /^Norb:/, 'Norb never climbs or touches')
    p.as('iris')
    p.act('use', 'fire-escape')
    assert.ok(holds(p.state, 'crime-room-access'))
    assert.ok(p.state.flags.includes(FIRE_ESCAPE_ENTRY))
    assert.ok(!p.state.inventory.includes('motel-key'), 'no key needed')
    assert.equal(
      p.state.asked.some((entry) => entry.includes(':marta:')),
      false,
    )
    p.try('use', 'fire-escape')
    p.go('odette-room')
    assert.ok(p.state.evidence.includes('double-murder'))
  }

  // Photographing Pip's log teaches the latch too.
  const photo = player(edition)
  photo.go('ice-alcove')
  photo.act('photograph', 'maintenance-log')
  assert.ok(photo.state.flags.includes(WINDOW_LATCH))
  assert.ok(photo.state.evidence.includes('ice-timing'))
}

// --- 2. Every ice-timing route on its own -----------------------------------

const ICE_ROUTES: Record<string, (p: Player) => void> = {
  'Dolores, asked': (p) => {
    p.go('neighbor-room')
    p.act('talk', 'neighbor')
    p.act('ask', 'neighbor', { topic: 'ice-clank' })
  },
  'her clock, photographed': (p) => {
    p.go('neighbor-room')
    p.act('photograph', 'wall-clock')
  },
  'Norb corrects her fast clock': (p) => {
    p.go('neighbor-room')
    p.act('talk', 'neighbor')
    p.act('ask', 'neighbor', { topic: 'unknown-visitor' })
    p.as('nico')
    p.act('look', 'wall-clock')
  },
  'the machine, timed': (p) => {
    p.go('ice-alcove')
    p.act('photograph', 'ice-machine')
  },
  'Pip’s log, photographed': (p) => {
    p.go('ice-alcove')
    p.act('photograph', 'maintenance-log')
  },
}
for (const edition of editions)
  for (const [name, route] of Object.entries(ICE_ROUTES)) {
    const p = player(edition)
    route(p)
    assert.ok(p.state.evidence.includes('ice-timing'), `${edition}: ${name}`)
  }

// --- 3. Weapon origin without Norb and without the knife photo --------------

assert.ok(topicsFor('neighbor').includes('knife-origin'))
assert.ok(topicsFor('marta').includes('knife-origin'))
for (const edition of editions) {
  // Asked before anyone has seen the knife: a pointer, and nothing spent.
  const early = player(edition)
  early.go('investigators-room')
  early.act('talk', 'nico')
  early.go('neighbor-room')
  early.act('talk', 'neighbor')
  const tooSoon = early.try('ask', 'neighbor', { topic: 'knife-origin' })
  assert.match(tooSoon.line, /go and look at it/)
  assert.ok(availableTopics(early.state, 'neighbor').includes('knife-origin'))
  early.go('front-office')
  early.try('ask', 'marta', { topic: 'knife-origin' })

  // Dolores the superfan, after Iris has seen the scene.
  const fan = player(edition)
  seeTheScene(fan)
  assert.ok(!fan.state.evidence.includes('knife-photo'))
  fan.go('neighbor-room')
  fan.act('talk', 'neighbor')
  fan.act('ask', 'neighbor', { topic: 'knife-origin' })
  assert.ok(fan.state.evidence.includes('knife-prop-mark'), edition + ' fan')
  assert.ok(fan.state.topics.includes('shrine'))
  assert.match(fan.state.transcript.at(-1)!, /Hexblade/)
  assert.ok(
    !fan.state.asked.some((entry) => entry.startsWith('nico:')),
    'Norb was never asked',
  )

  // Marta: the misdirect, never a clue.
  const marta = player(edition)
  seeTheScene(marta)
  marta.go('front-office')
  const evidence = [...marta.state.evidence]
  marta.act('ask', 'marta', { topic: 'knife-origin' })
  assert.deepEqual(marta.state.evidence, evidence, 'Marta grants nothing')
  assert.ok(marta.state.topics.includes('shrine'))
  assert.match(marta.state.transcript.at(-1)!, /a little fast/)

  // Norb's two photo routes still stand.
  for (const ask of [true, false]) {
    const norb = player(edition)
    seeTheScene(norb)
    norb.act('photograph', 'knife')
    norb.as('nico')
    if (ask) {
      norb.go('investigators-room')
      norb.act('ask', 'nico', { topic: 'knife-origin' })
    } else norb.act('look', 'knife')
    assert.ok(norb.state.evidence.includes('knife-prop-mark'))
  }
}

// --- 4. Graph search ----------------------------------------------------------

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

type Step = { action: CaseAction; actor: Investigator; room: RoomId }
type Block = (step: Step) => boolean

/** Every action the stage offers here, in this edition. */
function offered(state: CaseState, edition: MonstriqueAudience): Step[] {
  const steps: Step[] = []
  const at = (action: CaseAction) =>
    steps.push({ action, actor: state.actor, room: state.room })
  for (const hotspot of roomForAudience(state.room, edition).hotspots) {
    for (const verb of hotspot.verbs) {
      if (verb === 'walk') continue
      if (verb === 'ask')
        for (const topic of availableTopics(state, hotspot.id))
          at({ verb, target: hotspot.id, topic })
      else at({ verb, target: hotspot.id })
    }
    for (const item of state.inventory)
      at({ verb: 'use', target: hotspot.id, item })
  }
  for (const item of state.inventory)
    for (const other of state.inventory)
      if (item !== other) at({ verb: 'combine', item, target: other })
  for (const first of state.evidence)
    for (const second of state.evidence)
      if (first < second) at({ verb: 'compare', target: first, item: second })
  return steps
}

const known = (state: CaseState) =>
  state.flags.length +
  state.evidence.length +
  state.topics.length +
  state.asked.length +
  (state.deductions?.length ?? 0)

function goTo(
  state: CaseState,
  room: RoomId,
  edition: MonstriqueAudience,
): CaseState | null {
  if (state.room === room) return state
  const result = travelRoute(state, room, (here, there) =>
    travelForAudience(here, there, edition),
  )
  return result.changed ? result.state : null
}

/**
 * Greedy closure: in every room and as either investigator, take any
 * non-ending action that teaches the case something, until nothing does.
 * Endings are recorded, not taken.
 */
function closure(
  start: CaseState,
  edition: MonstriqueAudience,
  block: Block = () => false,
) {
  let state = start
  const endings = new Set<CaseEnding>()
  search: for (let guard = 0; guard < 2000; guard++) {
    for (const actor of ['iris', 'nico'] as const)
      for (const room of ROOMS) {
        let here = goTo(state, room, edition)
        if (!here) continue
        if (here.actor !== actor) here = switchInvestigator(here).state
        if (known(here) > known(state)) {
          state = here
          continue search
        }
        for (const step of offered(here, edition)) {
          if (block(step)) continue
          const result = actionForAudience(here, step.action, edition)
          if (!result.changed) continue
          if (result.state.ending) {
            endings.add(result.state.ending)
            continue
          }
          if (known(result.state) > known(here)) {
            state = result.state
            continue search
          }
        }
      }
    break
  }
  return { state, endings }
}

const is =
  (verb: string, target: string, topic?: string, actor?: Investigator) =>
  (step: Step) =>
    step.action.verb === verb &&
    step.action.target === target &&
    (topic === undefined || step.action.topic === topic) &&
    (actor === undefined || step.actor === actor)
const any =
  (...blocks: Block[]): Block =>
  (step) =>
    blocks.some((block) => block(step))

for (const edition of editions) {
  const full = closure(newCase(1), edition)
  assert.ok(full.endings.has('fifth-hexblade'), edition + ': full file')
  for (const clue of FIFTH_HEXBLADE_CLUES)
    assert.ok(full.state.evidence.includes(clue), edition + ' ' + clue)

  // Scene entry with Marta blocked entirely: the fire escape.
  const noMarta = closure(
    newCase(1),
    edition,
    (step) => step.action.target === 'marta',
  )
  assert.ok(noMarta.state.flags.includes(FIRE_ESCAPE_ENTRY), edition)
  assert.ok(noMarta.endings.has('fifth-hexblade'), edition + ' no Marta')

  // Scene entry with the fire escape blocked: Marta.
  const noWindow = closure(newCase(1), edition, is('use', 'fire-escape'))
  assert.ok(!noWindow.state.flags.includes(FIRE_ESCAPE_ENTRY))
  assert.ok(noWindow.endings.has('fifth-hexblade'), edition + ' no window')

  // Weapon origin and the whole lead without Norb doing anything at all.
  const irisAlone = closure(
    newCase(1),
    edition,
    (step) => step.actor === 'nico',
  )
  assert.ok(irisAlone.state.evidence.includes('knife-prop-mark'), edition)
  assert.ok(irisAlone.endings.has('fifth-hexblade'), edition + ' Iris alone')
  // ...and that lead really is Dolores: block her too and it is gone.
  const noLead = closure(
    newCase(1),
    edition,
    any((step) => step.actor === 'nico', is('ask', 'neighbor', 'knife-origin')),
  )
  assert.ok(!noLead.state.evidence.includes('knife-prop-mark'), edition)

  // Each ice route alone, the other four blocked.
  const iceRoutes: Record<string, Block> = {
    dolores: is('ask', 'neighbor', 'ice-clank'),
    clock: is('photograph', 'wall-clock'),
    norb: is('look', 'wall-clock', undefined, 'nico'),
    machine: is('photograph', 'ice-machine'),
    log: is('photograph', 'maintenance-log'),
  }
  for (const name of Object.keys(iceRoutes)) {
    const others = Object.entries(iceRoutes)
      .filter(([other]) => other !== name)
      .map(([, block]) => block)
    const alone = closure(newCase(1), edition, any(...others))
    assert.ok(alone.state.evidence.includes('ice-timing'), `${edition} ${name}`)
    assert.ok(alone.endings.has('fifth-hexblade'), `${edition} ice ${name}`)
  }
  const noIce = closure(newCase(1), edition, any(...Object.values(iceRoutes)))
  assert.ok(!noIce.state.evidence.includes('ice-timing'), 'five routes, all')
}

function random(seed: number) {
  let value = seed
  return () => {
    value = (value * 1103515245 + 12345) % 2147483648
    return value / 2147483648
  }
}

// Seeded random walks, a reckless headline failed forward on the way: from
// wherever a walk stops, the full file is still open.
for (const edition of editions) {
  for (let walk = 1; walk <= 16; walk++) {
    const roll = random(walk * 104729)
    let state = newCase(walk)
    for (let step = 0; step < 70; step++) {
      const moves: CaseResult[] = [switchInvestigator(state)]
      for (const room of roomForAudience(state.room, edition).exits)
        moves.push(travelForAudience(state, room, edition))
      for (const option of offered(state, edition))
        moves.push(actionForAudience(state, option.action, edition))
      const changed = moves.filter((result) => result.changed)
      if (!changed.length) break
      const pick = changed[Math.floor(roll() * changed.length)]!.state
      if (pick.ending === 'reckless') {
        const reopened = beginRetraction(pick)
        assert.equal(reopened.changed, true)
        state = reopened.state
      } else if (pick.ending) break
      else state = pick
    }
    if (state.ending) continue
    const rest = closure(state, edition)
    assert.ok(
      rest.endings.has('fifth-hexblade'),
      `${edition}: walk ${walk} still reaches the full file`,
    )
  }
}

// --- 5. The fail-forward mini-case -------------------------------------------

function rush(edition: MonstriqueAudience): Player {
  const p = player(edition, newCase(21))
  seeTheScene(p)
  p.act('talk', 'odette-ghost')
  p.act('ask', 'odette-ghost', { topic: 'agent-deals' })
  p.act('talk', 'violet-ghost')
  p.act('ask', 'violet-ghost', { topic: 'violet-witness' })
  p.go('investigators-room')
  p.act('use', 'desk')
  assert.equal(p.state.ending, 'reckless')
  return p
}

assert.deepEqual(
  RETRACTION_FACTS.map((fact) => fact.key),
  ['knife-photo', 'ice-timing', 'fan-exonerated'],
)
for (const edition of editions) {
  const p = rush(edition)
  const reckless = p.state
  assert.equal(beginRetraction(newCase(2)).changed, false, 'nothing to retract')
  const opened = beginRetraction(reckless)
  assert.equal(opened.changed, true)
  p.state = opened.state
  assert.equal(p.state.ending, null)
  assert.equal(p.state.room, 'investigators-room')
  assert.ok(retractionOpen(p.state))
  assert.ok(p.state.flags.includes(RETRACTION_FLAG))
  for (const topic of ['knife-origin', 'ice-clank', 'fan-alibi'])
    assert.ok(p.state.topics.includes(topic), topic + ' on the list')
  assert.match(opened.line, /the knife on film, the clock, Gavin’s alibi/)
  assert.deepEqual(achievementsFor(reckless, p.state), [], 'no free badges')
  assert.equal(caseScore(p.state), caseScore(reckless), 'no free points')

  // Filing again too early is refused with what is missing, never a loop.
  const refused = p.try('use', 'desk')
  assert.match(refused.line, /the knife on film, the clock, Gavin’s alibi/)

  // The three facts, each one by a different route than the main script.
  p.go('odette-room')
  p.act('photograph', 'knife')
  p.go('neighbor-room')
  p.act('photograph', 'wall-clock')
  assert.deepEqual(
    missingFacts(p.state).map((fact) => fact.key),
    ['fan-exonerated'],
  )
  p.go('investigators-room')
  assert.match(p.try('use', 'desk').line, /Gavin’s alibi\.$/)
  p.go('motel-exterior')
  p.act('talk', 'gavin')
  p.act('ask', 'gavin', { topic: 'fan-alibi' })
  assert.deepEqual(missingFacts(p.state), [])
  p.go('investigators-room')
  p.act('use', 'desk')
  assert.ok(p.state.flags.includes(CORRECTION_FLAG))
  assert.ok(p.state.flags.includes('city-lead'))
  assert.ok(!retractionOpen(p.state))
  assert.match(p.state.transcript.at(-1)!, /Retraction printed/)
  p.go('convention-center')
  p.act('photograph', 'idol-poster')
  assert.equal(p.state.ending, 'lead-earned', edition + ' corrected')
  assert.equal(beginRetraction(p.state).changed, false)
  const runs = recordRun(
    recordRun([], reckless, edition, '2026-11-28T09:00:00.000Z'),
    p.state,
    edition,
    '2026-11-28T09:30:00.000Z',
  )
  assert.deepEqual(
    runs.map((run) => run.ending),
    ['lead-earned', 'reckless'],
    'both case files kept',
  )
  const two = beginChapterTwo(p.state)
  assert.equal(two.changed, true, 'Chapter Two opens after a correction')
  assert.equal(two.state.chapter, 2)
  assert.equal(beginRetraction(newChapterTwo(3)).changed, false)

  // From the reopened case, nothing is locked out: the full file is open.
  const onward = closure(opened.state, edition)
  assert.ok(onward.endings.has('fifth-hexblade'), edition + ' after retraction')
  assert.ok(onward.state.flags.includes(CORRECTION_FLAG))
  assert.ok(!onward.endings.has('reckless'), 'a retraction never re-fails')

  const text = p.state.transcript.join(' ')
  assert.doesNotMatch(text, SPOILER)
  if (edition === 'general') assert.doesNotMatch(text, UNSAFE)
}

// The fire-escape route and the superfan in the general edition stay clean.
{
  const p = player('general')
  p.go('ice-alcove')
  p.act('look', 'maintenance-log')
  p.go('neighbor-room')
  p.act('talk', 'neighbor')
  p.act('ask', 'neighbor', { topic: 'unknown-visitor' })
  p.act('use', 'fire-escape')
  p.go('odette-room')
  p.go('neighbor-room')
  p.act('ask', 'neighbor', { topic: 'knife-origin' })
  p.go('front-office')
  p.act('ask', 'marta', { topic: 'knife-origin' })
  const text = p.state.transcript.join(' ')
  assert.doesNotMatch(text, UNSAFE)
  assert.doesNotMatch(text, SPOILER)
}

// --- 6. Saves, editions, score and stage wiring --------------------------------

assert.equal(maxScore('mature'), 205, 'Chapter One still scores 205')
for (const edition of editions) {
  const p = rush(edition)
  p.state = beginRetraction(p.state).state
  const states = [p.state, noMartaState(edition)]
  for (const state of states) {
    assert.equal(state.version, 3)
    const saved = JSON.parse(JSON.stringify(state))
    assert.deepEqual(restoreCase(saved), state, edition + ' round trip')
    assert.ok(generalSafeCase(state), 'nothing new is mature-only')
    const account = parseAccountSave(
      {
        version: 1,
        savedAt: '2026-11-28T09:00:00.000Z',
        case: saved,
        kit: null,
        runs: [],
      },
      edition,
    )
    assert.deepEqual(account?.case, state, edition + ' account save')
  }
  // A reckless save from before the retraction existed reopens the same way.
  const old = JSON.parse(JSON.stringify(rush(edition).state)) as CaseState
  const restored = restoreCase(old)!
  assert.equal(restored.ending, 'reckless')
  assert.equal(beginRetraction(restored).changed, true)
}

function noMartaState(edition: MonstriqueAudience): CaseState {
  const p = player(edition)
  p.go('ice-alcove')
  p.act('photograph', 'maintenance-log')
  p.go('neighbor-room')
  p.act('talk', 'neighbor')
  p.act('ask', 'neighbor', { topic: 'unknown-visitor' })
  p.act('use', 'fire-escape')
  return p.state
}

// An old save that got into 205 through Dolores keeps its access.
{
  const old = {
    ...newCase(8),
    room: 'odette-room',
    flags: ['crime-room-access'],
    evidence: ['neighbor-testimony', 'double-murder'],
  }
  const restored = restoreCase(JSON.parse(JSON.stringify(old)))
  assert.equal(restored?.room, 'odette-room', 'old access survives')
  assert.ok(!('chapter' in restored!) && !('deductions' in restored!))
}

const scene = source(
  'components/monstress-convention/monstress-convention-scene.vue',
)
assert.match(scene, /data-testid="monstrique-print-retraction"/)
assert.match(scene, /data-testid="monstrique-retraction"/)
assert.match(scene, /story\.value\.printRetraction\(\)/)
for (const store of [
  'stores/monstressConventionStore.ts',
  'stores/monstriquePublicStore.ts',
]) {
  const text = source(store)
  assert.match(text, /beginRetraction\(state\.value\)/, store)
  assert.match(text, /\n\s+printRetraction,\n/, store + ' exposes it')
}
const workflow = source('.github/workflows/contract-tests.yml')
assert.match(
  workflow,
  /run: npx tsx utils\/scripts\/verifyMonstriqueOpening\.test\.ts/,
  'runs in CI',
)

console.log(
  'Monstrique opening: two ways into 205, five ice routes, a Norb-free knife lead, graph search without lockouts, the retraction mini-case and saves passed in both editions',
)
