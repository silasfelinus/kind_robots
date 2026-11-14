import assert from 'node:assert/strict'
import {
  chooseOverworldEvent,
  eventNeighbors,
  eventOpening,
  newOverworldEventProgress,
  restoreOverworldEventProgress,
  revealOverworldEvent,
  worldEvent,
  worldEvents,
  type OverworldEventProgress,
} from '../memoryDungeon/overworldEventCatalog'
import {
  MORROW_SHIFT_BY_KEY,
  MORROW_SHIFT_SITES,
  validateMorrowShift,
} from '../memoryDungeon/morrowShift'
import {
  earthRealityCoverage,
  earthRealityReady,
} from '../memoryDungeon/earthAct'
import { EARTH_PHOTOS } from '../memoryDungeon/chronicle'
import {
  MEMORY_REALITY_EXPERIENCES,
  MEMORY_REALITY_PAIRS,
  MEMORY_COLLISION_ORDER,
  MEMORY_RESEARCHER_NAME,
  memoryLeadFor,
  newMemoryCampaignProgress,
} from '../memoryDungeon/reimaginerCampaign'

// --- Authored e03 contract ---------------------------------------------------
assert.deepEqual(validateMorrowShift(), [])
assert.equal(MORROW_SHIFT_SITES.length, 64)
assert.deepEqual(earthRealityCoverage(), [])

const events = worldEvents('e03')
assert.equal(events.length, 64)
for (const event of events) {
  const site = MORROW_SHIFT_BY_KEY.get(event.key)!
  assert.equal(event.title, site.title, event.key + ' serves authored title')
  assert.equal(event.place, site.place)
  assert.ok(
    !/^At .+?, /.test(event.choices[0]!.label),
    event.key + ' must not fall back to template choice labels',
  )
  assert.ok(!event.title.includes(' / '), event.key + ' template title leaked')
}

// Fixed Chronicle photograph sites keep their photograph choices and ids.
for (const photo of EARTH_PHOTOS.filter((item) => item.experience === 'e03')) {
  const event = worldEvent('e03', photo.site)!
  assert.equal(event.photographId, photo.id)
  assert.deepEqual(
    event.choices.map((choice) => choice.id),
    ['challenge', 'hold'],
  )
  assert.equal(event.kind, 'memory')
}

// Pacing mix: not every square is a dilemma (Silas, 2026-11-03).
const instants = events.filter((event) => event.instant)
assert.ok(instants.length >= 12, 'at least 12 instant discoveries')
assert.ok(instants.every((event) => event.choices.length === 1))
const kinds = new Set(events.map((event) => event.kind))
for (const kind of ['puzzle', 'treasure', 'merchant', 'companion', 'dungeon'])
  assert.ok(kinds.has(kind as never), 'e03 needs ' + kind + ' sites')
assert.ok(events.filter((event) => event.kind === 'puzzle').length >= 6)
assert.equal(worldEvent('e03', '6,2')!.kind, 'dungeon')

// Both responses to Mara's first confrontation change the finale's remembered context.
const morrowFinaleSite = MORROW_SHIFT_BY_KEY.get('8,8')!
assert.ok(
  morrowFinaleSite.echoes?.some((echo) => echo.flag === 'e03:2,1:care'),
  'admitting the memory gap must be remembered at the finale',
)
assert.ok(
  morrowFinaleSite.echoes?.some((echo) => echo.flag === 'e03:2,1:risk'),
  'bluffing about the memory gap must be remembered at the finale',
)

// Echo coverage: later places remember earlier choices.
const echoCount = MORROW_SHIFT_SITES.reduce(
  (sum, site) => sum + (site.echoes?.length ?? 0),
  0,
)
assert.ok(echoCount >= 16, 'expected at least 16 authored echoes')
const finale = worldEvent('e03', '8,8')!
assert.deepEqual(
  finale.choices.map((choice) => choice.id),
  ['care', 'risk'],
)
const plain = eventOpening(finale, [])
assert.equal(plain, finale.opening)
const remembered = eventOpening(finale, ['e03:3,3:care', 'e03:8,6:risk'])
assert.ok(remembered.startsWith(finale.opening))
assert.ok(remembered.includes('Jun’s letter is still sealed'))
assert.ok(remembered.includes('the Sleeping One'))

// The finale reads actual choice flags after save/restore, not merely static text.
for (const choiceId of ['care', 'risk'] as const) {
  let progress = newOverworldEventProgress('e03')
  progress = revealOverworldEvent(progress, '2,1')
  progress = chooseOverworldEvent(progress, '2,1', choiceId)
  const saved = restoreOverworldEventProgress(
    JSON.parse(JSON.stringify(progress)),
  )!
  const opening = eventOpening(finale, saved.flags)
  assert.ok(
    opening.includes(
      choiceId === 'care'
        ? 'Mara wrote her name on the receipt'
        : 'The bluff has held so long',
    ),
    choiceId + ' choice must change the finale after save/restore',
  )
  assert.ok(
    !opening.includes(
      choiceId === 'care'
        ? 'The bluff has held so long'
        : 'Mara wrote her name on the receipt',
    ),
    'mutually exclusive Mara outcomes must not both appear',
  )
}

// The immediately preceding fountain approach must change the last decision.
const fountainApproaches = [
  ['care', 'You already promised Mara'],
  ['risk', 'You looked into the dry basin'],
  ['offer', 'The tea you poured into the basin'],
] as const
for (const [chosen, expected] of fountainApproaches) {
  let progress = newOverworldEventProgress('e03')
  progress = revealOverworldEvent(progress, '7,8')
  progress = chooseOverworldEvent(progress, '7,8', chosen)
  const restored = restoreOverworldEventProgress(
    JSON.parse(JSON.stringify(progress)),
  )!
  const opening = eventOpening(finale, restored.flags)
  assert.ok(opening.includes(expected), chosen + ' must echo at the finale')
  for (const [other, phrase] of fountainApproaches)
    if (other !== chosen)
      assert.ok(!opening.includes(phrase), 'other fountain branch must stay absent')
}

// --- Save compatibility ------------------------------------------------------
// A template-era save answered every non-photo site with care or risk.
function walkAll(choose: (key: string) => string): OverworldEventProgress {
  let progress = newOverworldEventProgress('e03')
  for (let pass = 0; pass < 64; pass++)
    for (const event of events)
      progress = revealOverworldEvent(progress, event.key)
  for (const event of events)
    progress = chooseOverworldEvent(progress, event.key, choose(event.key))
  return progress
}
const legacyRisk = walkAll((key) =>
  ['1,3', '6,4'].includes(key) ? 'hold' : 'risk',
)
assert.equal(Object.keys(legacyRisk.choices).length, 64)
const restored = restoreOverworldEventProgress(
  JSON.parse(JSON.stringify(legacyRisk)),
)!
assert.deepEqual(restored.choices, legacyRisk.choices)
assert.deepEqual(restored.flags, legacyRisk.flags)
for (const event of instants)
  assert.equal(
    legacyRisk.choices[event.key],
    'notice',
    event.key + ' legacy answer replays as the discovery',
  )
assert.ok(earthRealityReady('e03', legacyRisk))

// An old serialized save that still says care/risk at an instant site.
const instantKey = instants[0]!.key
const oldSave = {
  ...newOverworldEventProgress('e03'),
  revealed: events.map((event) => event.key),
  choices: { [instantKey]: 'care' },
}
const migrated = restoreOverworldEventProgress(oldSave)!
assert.equal(migrated.choices[instantKey], 'notice')

// Once-only: an instant discovery cannot be farmed by repeating it.
const once = chooseOverworldEvent(migrated, instantKey, 'notice')
assert.equal(once, migrated)

// Every site is reachable from the 1,1 start.
const seen = new Set(['1,1'])
const queue = ['1,1']
while (queue.length) {
  const key = queue.shift()!
  for (const next of eventNeighbors(key))
    if (worldEvent('e03', next) && !seen.has(next)) {
      seen.add(next)
      queue.push(next)
    }
}
assert.equal(seen.size, 64)

// --- One lead per pair, storyline-dependent e11 lead -------------------------
for (const [first, second] of MEMORY_REALITY_PAIRS) {
  const a = MEMORY_REALITY_EXPERIENCES.find((entry) => entry.id === first)!
  const b = MEMORY_REALITY_EXPERIENCES.find((entry) => entry.id === second)!
  assert.equal(a.viewpoint, b.viewpoint, first + '/' + second + ' share a lead')
}
assert.deepEqual(
  MEMORY_REALITY_PAIRS.map(([first]) => memoryLeadFor(first)),
  ['researcher', 'morrow', 'scylla', 'vesper'],
)
assert.deepEqual(
  MEMORY_COLLISION_ORDER.map((id) => memoryLeadFor(id)),
  ['researcher', 'morrow', 'char', 'vesper'],
)
const charLost = {
  ...newMemoryCampaignProgress(),
  pairDecisions: { e04: 'open-the-tide-gate' },
} as Parameters<typeof memoryLeadFor>[1]
const charAlive = {
  ...newMemoryCampaignProgress(),
  pairDecisions: { e04: 'seal-the-tide-gate' },
} as Parameters<typeof memoryLeadFor>[1]
assert.equal(memoryLeadFor('e11', charLost), 'scylla')
assert.equal(memoryLeadFor('e11', charAlive), 'char')
assert.equal(memoryLeadFor('e10', charLost), 'morrow')

// The researcher is named (Silas, 2026-11-05 PT) and he/him.
assert.equal(MEMORY_RESEARCHER_NAME, 'Rowan')
const e03Text = MORROW_SHIFT_SITES.flatMap((site) => [
  site.opening,
  ...site.choices.map((choice) => choice.outcome),
  ...(site.echoes ?? []).map((echo) => echo.text),
]).join(' ')
assert.ok(
  !/the researcher/i.test(e03Text),
  'e03 names Rowan, not “the researcher”',
)
assert.ok(e03Text.split(MEMORY_RESEARCHER_NAME).length > 20)
assert.ok(!/Rowan[^.]{0,80}\b(their|theirs|they)\b/.test(e03Text))

console.log(
  'Morrow’s Shift: 64 authored sites, ' +
    instants.length +
    ' instant discoveries, ' +
    echoCount +
    ' echoes; legacy saves replay; one lead per pair.',
)
