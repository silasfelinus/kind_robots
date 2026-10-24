import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import {
  RAINBOW_OPENING,
  RAINBOW_OPENING_TRACK,
} from '../arcade/games/rainbowOpening'

// Conductor rainbow t-034, Silas 2026-10-23 PT: "We can use a real animation at the beginning, maybe a 15 second
// high energy thrash metal music video." The track brief is instrumental thrash metal at a thrash tempo, long
// enough to cover the cut; a shipped opening names files that exist, about fifteen seconds long, and the Fly tab
// offers it over the cabinet with the cabinet held still while it shows.

assert.equal(RAINBOW_OPENING_TRACK.id, 'opening')
assert.ok(RAINBOW_OPENING_TRACK.prompt.includes('thrash metal'))
assert.ok(RAINBOW_OPENING_TRACK.prompt.startsWith('instrumental, no vocals'))
assert.ok(RAINBOW_OPENING_TRACK.bpm >= 160, 'a thrash tempo')
assert.ok(RAINBOW_OPENING_TRACK.seconds >= 15)

if (RAINBOW_OPENING) {
  for (const path of [
    RAINBOW_OPENING.webm,
    RAINBOW_OPENING.mp4,
    RAINBOW_OPENING.poster,
  ]) {
    const file = join('public', path)
    assert.ok(existsSync(file), `${path} is shipped`)
    assert.ok(statSync(file).size > 10_000, `${path} is not empty`)
  }
  assert.ok(
    RAINBOW_OPENING.seconds >= 12 && RAINBOW_OPENING.seconds <= 18,
    'about fifteen seconds',
  )
  assert.ok(RAINBOW_OPENING.clips <= RAINBOW_OPENING.shots)
}

const page = readFileSync(
  'pages/play/rainbow-bullet-hell-space-princess.vue',
  'utf8',
)
assert.ok(page.includes('<RainbowOpening'), 'the Fly tab offers it')
assert.ok(
  page.includes(':suspended="view !== \'flight\' || openingShowing"'),
  'the cabinet holds still while the opening shows',
)
const overlay = readFileSync('components/arcade/rainbow-opening.vue', 'utf8')
assert.ok(
  overlay.includes('markOpeningSeen'),
  'watched or skipped is remembered',
)
assert.ok(overlay.includes('Skip'), 'the opening can be skipped')

console.log(
  `rainbow opening: ok (${RAINBOW_OPENING ? `${RAINBOW_OPENING.seconds}s, ${RAINBOW_OPENING.clips}/${RAINBOW_OPENING.shots} shots animated` : 'not shipped yet'})`,
)
