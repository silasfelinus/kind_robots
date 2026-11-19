// Slime City Clash gamepad binding (conductor slime-city/t-012 input pass):
// standard-mapping pad buttons reach every Clash action through the same
// buttons the keyboard and touch audits use.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { newPadMemory, readPad } from '../consoleInput'
import {
  planClashPadCommand,
  type ClashPadContext,
} from '../slimeCity/clashGamepad'

function pad(pressed: number[], axes: number[] = [0, 0]): Gamepad {
  const buttons = Array.from({ length: 17 }, (_, i) => ({
    pressed: pressed.includes(i),
    touched: pressed.includes(i),
    value: pressed.includes(i) ? 1 : 0,
  }))
  return { buttons, axes } as unknown as Gamepad
}

const inMatch: ClashPadContext = {
  reportOpen: false,
  focusInside: true,
  handSize: 5,
  focusedHandIndex: 2,
}

// Raw pad → commands: A, Start, LB/RB, D-pad and stick all register once.
{
  const memory = newPadMemory()
  assert.deepEqual(readPad(pad([0]), memory, 0), ['confirm'])
  assert.deepEqual(readPad(pad([0]), memory, 16), [], 'A held does not repeat')
  assert.deepEqual(readPad(pad([9]), memory, 32), ['start'])
  assert.deepEqual(readPad(pad([5]), memory, 48), ['nextTab'])
  assert.deepEqual(readPad(pad([], [0.9, 0]), memory, 64), ['right'])
  assert.deepEqual(readPad(pad([12]), memory, 80), ['up'])
}

// Directions move focus once inside; from outside the first press lands focus.
assert.deepEqual(planClashPadCommand('left', inMatch), {
  kind: 'move',
  direction: 'left',
})
assert.deepEqual(
  planClashPadCommand('down', { ...inMatch, focusInside: false }),
  { kind: 'focus-first' },
)

// A presses whatever is focused (card, alley, power, FIGHT, report buttons).
assert.deepEqual(planClashPadCommand('confirm', inMatch), {
  kind: 'press-focused',
})

// Start sends the crew in; on the report it rematches.
assert.deepEqual(planClashPadCommand('start', inMatch), {
  kind: 'click',
  testid: 'clash-pass',
})
assert.deepEqual(
  planClashPadCommand('start', { ...inMatch, reportOpen: true }),
  {
    kind: 'click',
    testid: 'slime-match-report-rematch',
  },
)

// LB/RB cycle the hand and wrap at both ends.
assert.deepEqual(planClashPadCommand('nextTab', inMatch), {
  kind: 'focus',
  testid: 'clash-hand-3',
})
assert.deepEqual(
  planClashPadCommand('nextTab', { ...inMatch, focusedHandIndex: 4 }),
  { kind: 'focus', testid: 'clash-hand-0' },
)
assert.deepEqual(
  planClashPadCommand('prevTab', { ...inMatch, focusedHandIndex: 0 }),
  { kind: 'focus', testid: 'clash-hand-4' },
)
assert.deepEqual(
  planClashPadCommand('nextTab', { ...inMatch, focusedHandIndex: -1 }),
  { kind: 'focus', testid: 'clash-hand-0' },
)
assert.deepEqual(
  planClashPadCommand('prevTab', { ...inMatch, focusedHandIndex: -1 }),
  { kind: 'focus', testid: 'clash-hand-4' },
)
assert.deepEqual(planClashPadCommand('nextTab', { ...inMatch, handSize: 0 }), {
  kind: 'none',
})

// B closes the report, otherwise returns to the hand; Y peeks.
assert.deepEqual(
  planClashPadCommand('back', { ...inMatch, reportOpen: true }),
  {
    kind: 'click',
    testid: 'slime-match-report-close',
  },
)
assert.deepEqual(planClashPadCommand('back', inMatch), {
  kind: 'focus',
  testid: 'clash-hand-0',
})
assert.deepEqual(planClashPadCommand('details', inMatch), {
  kind: 'click',
  testid: 'clash-peek',
})

// Every testid the plan targets exists in the Clash templates, and the
// component actually polls the pad.
const templates = [
  'components/slime-city-clash.vue',
  'components/slime-city-clash-hand.vue',
  'components/slime-city-match-report.vue',
]
  .map((path) => readFileSync(path, 'utf8'))
  .join('\n')
for (const testid of [
  'clash-pass',
  'clash-peek',
  'slime-match-report',
  'slime-match-report-close',
  'slime-match-report-rematch',
])
  assert.ok(
    templates.includes(`data-testid="${testid}"`),
    `missing data-testid="${testid}"`,
  )
assert.ok(templates.includes(':data-testid="\'clash-hand-\' + index"'))
const clash = readFileSync('components/slime-city-clash.vue', 'utf8')
assert.ok(clash.includes('runClashPadCommand(root, command)'))
assert.ok(clash.includes("'gamepadconnected'"))

console.log('Slime City Clash gamepad binding: OK')
