import assert from 'node:assert/strict'
import {
  caseThread,
  caseTrustModifier,
  recordCaseNight,
  validCaseHistory,
  type CaseMemory,
} from '../cometAcademy/caseMemory'
import {
  COMPLETE_NIGHT_DECK,
  dispatchModifier,
  incidentsFor,
  resolveDispatch,
  restoreAcademy,
  startFullAcademy,
} from '../cometAcademy/rules'

assert.equal(COMPLETE_NIGHT_DECK.length, 36)
assert.equal(
  new Set(COMPLETE_NIGHT_DECK.map((incident) => incident.id)).size,
  36,
)
assert.ok(COMPLETE_NIGHT_DECK.every((incident) => caseThread(incident.id)))
const prior: CaseMemory[] = [
  { day: 6, caseId: 'museum', grade: 'honors', unanswered: false },
]
assert.equal(caseTrustModifier(prior, 7, 'rally'), 2)
assert.equal(
  caseTrustModifier(prior, 7, 'flood'),
  0,
  'harbor does not inherit civic trust',
)
assert.equal(
  caseTrustModifier(prior, 12, 'rally'),
  0,
  'five-night memory expires',
)
assert.equal(
  caseTrustModifier(prior, 6, 'rally'),
  0,
  'same night has no prior benefit',
)
assert.equal(
  caseTrustModifier(prior, 7, 'museum'),
  0,
  'a case cannot boost itself',
)
assert.equal(
  caseTrustModifier(
    [{ day: 6, caseId: 'museum', grade: 'failed', unanswered: true }],
    7,
    'rally',
  ),
  -2,
)
assert.equal(
  caseTrustModifier(
    [{ day: 6, caseId: 'museum', grade: 'failed', unanswered: false }],
    7,
    'rally',
  ),
  -1,
)
assert.equal(
  caseTrustModifier(
    [
      ...prior,
      { day: 5, caseId: 'broadcast', grade: 'honors', unanswered: false },
    ],
    7,
    'rally',
  ),
  2,
  'district trust cannot grow beyond two',
)
const original = [
  { caseId: 'monorail', grade: 'pass' as const, names: 'YOU · on patrol' },
  { caseId: 'museum', grade: 'failed' as const, names: 'No team dispatched' },
]
assert.deepEqual(
  recordCaseNight([], 1, original),
  [],
  'training nights do not create city reputation',
)
const written = recordCaseNight([], 6, original)
assert.equal(written.length, 2)
assert.equal(written[1]!.unanswered, true)
assert.deepEqual(
  recordCaseNight(written, 6, original),
  written,
  'repeated resolution cannot double-credit',
)
assert.equal(recordCaseNight(written, 7, [original[0]!]).length, 3)
assert.ok(validCaseHistory(written, 7, 'map'))
assert.equal(
  validCaseHistory(written, 6, 'dispatch'),
  false,
  'history cannot predate debrief',
)
assert.equal(validCaseHistory([...written, written[0]!], 7, 'map'), false)
assert.equal(
  validCaseHistory([{ ...written[0]!, unanswered: true }], 7, 'map'),
  false,
)
assert.equal(validCaseHistory([{ ...written[0]!, day: 24 }], 7, 'map'), false)
assert.equal(
  validCaseHistory([{ ...written[0]!, caseId: 'invented' }], 7, 'map'),
  false,
)

const before = startFullAcademy('kinetic', 4402)
const target = COMPLETE_NIGHT_DECK.find((incident) => incident.id === 'rally')!
const base = dispatchModifier({ ...before, day: 7 }, target, ['mina'])
const helped = dispatchModifier(
  {
    ...before,
    day: 7,
    caseHistory: prior,
  },
  target,
  ['mina'],
)
assert.equal(
  helped,
  base + 2,
  'saved history must actually affect dispatch results',
)
const ignored = dispatchModifier(
  {
    ...before,
    day: 7,
    flowVersion: 2,
    caseHistory: prior,
  },
  target,
  ['mina'],
)
assert.equal(
  ignored,
  dispatchModifier({ ...before, day: 7, flowVersion: 2 }, target, ['mina']),
)

const night = { ...before, day: 8, phase: 'dispatch' as const }
const firstCall = incidentsFor(night)[0]!
const playable = {
  ...night,
  playerCaseId: firstCall.id,
  assignments: [],
}
const resolved = resolveDispatch(playable)
assert.equal(resolved.phase, 'debrief')
assert.equal(resolved.caseHistory?.length, incidentsFor(night).length)
assert.ok(
  resolved.caseHistory?.some((m) => m.caseId === firstCall.id && !m.unanswered),
)
assert.ok(resolved.caseHistory?.some((m) => m.unanswered))
assert.equal(
  restoreAcademy(JSON.parse(JSON.stringify(resolved)))?.caseHistory?.length,
  resolved.caseHistory?.length,
)
assert.equal(
  restoreAcademy({
    ...resolved,
    caseHistory: [
      ...(resolved.caseHistory ?? []),
      ...(resolved.caseHistory ?? []).slice(0, 1),
    ],
  }),
  null,
  'forged duplicate memories cannot be loaded',
)
const older = { ...before }
delete older.caseHistory
assert.ok(
  restoreAcademy(older),
  'existing thirty-day runs need no fabricated provenance',
)

console.log(
  'Prom of Doom: 36 cases retain district provenance, five-night effects, refusal penalties and safe saves.',
)
