import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Silas, 2026-10-15, on an iPad: "Conversation threads should be on the top, not the bottom, they're
// blocked by the controls. B charge does nothing." The comms box and the Act-clear banners sit under
// the HUD; a fired super draws a pilot-coloured burst and a charged ship says so.

const engine = readFileSync(
  new URL('../arcade/games/rainbowPrincessPreview.ts', import.meta.url),
  'utf8',
)

assert.match(
  engine,
  /const commsTop = 33 \+ Math\.max\(0, activePlayers - 1\) \* 10/,
)
assert.match(engine, /g\.fillRect\(15, commsTop, W - 30, 51\)/)
assert.doesNotMatch(
  engine,
  /H - (63|47|33|28|17)\b/,
  'nothing in the comms or banner layout is anchored to the bottom, where the touch controls sit',
)
assert.match(
  engine,
  /bursts\.push\(\{ seat, pilot: kind, x: ship\.x, y: ship\.y, age: 0 \}\)/,
)
assert.match(engine, /for \(const burst of bursts\)/)
assert.match(engine, /SUPER READY · TAP B/)
assert.match(engine, /B FOCUS, SUPER AT 100% · X SPECIAL · Y EVADE/)
assert.match(
  engine,
  /const HUD_LEFT = 44\n/,
  'HUD text clears the close and fullscreen chips',
)

console.log('rainbow comms layout and super feedback: ok')
