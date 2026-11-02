// Shared choice hand contract (components/narrative/kr-choice-hand.vue).
// Silas, 2026-11-02: Ecotone's hand of result-art choice cards becomes "a
// general interface upgrade for all our relevant games". Every adopter
// renders its set of choices through the one shared hand.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const hand = readFileSync('components/narrative/kr-choice-hand.vue', 'utf8')

assert.match(hand, /export type KrHandChoice = \{/)
assert.match(
  hand,
  /<slot name="art" :choice="choice">/,
  'games supply card art',
)
assert.match(hand, /v-if="choice\.image && !failed\.includes\(choice\.id\)"/)
assert.match(hand, /emit\('play', choice\)/, 'one tap plays the card')
assert.doesNotMatch(
  hand,
  /Confirm your decision|confirmDecision|stagedChoice/,
  'no confirm step',
)
assert.match(hand, /:aria-label="ariaFor\(choice\)"/, 'full text is accessible')
assert.match(hand, /:title="ariaFor\(choice\)"/)
assert.match(hand, /prefers-reduced-motion: reduce/)
assert.match(
  hand,
  /if \(!props\.animate \|\| reducedMotion\(\)\)/,
  'game motion setting',
)
assert.match(
  hand,
  /:disabled="Boolean\(playing\)"[\s\S]*?:aria-disabled="choice\.disabled/,
  'locked cards stay focusable so their reason can be read',
)
assert.match(hand, /if \(choice\.disabled \|\| playing\.value\) return/)
assert.match(
  hand,
  /clip-path: inset\(-200rem -200rem 0 -200rem\)/,
  'the tucked edge is clipped by paint, not a scroll box',
)
assert.doesNotMatch(
  hand,
  /\.krh-scroll \{[^}]*overflow/,
  'a scrolling hand would scroll itself to reveal a lifted card',
)
assert.match(hand, /container-type: inline-size/, 'cards size to the hand')
assert.doesNotMatch(hand, /100vh|100dvh/)

const adopters: Array<[game: string, file: string, pattern: RegExp]> = [
  ['Ecotone', 'components/ecotone-choice-hand.vue', /<KrChoiceHand/],
  ['Ecotone', 'components/ecotone-board.vue', /<EcotoneChoiceHand/],
  [
    'Crystal Street',
    'components/crystal-street/crystal-street-encounter.vue',
    /<KrChoiceHand[\s\S]*testid-prefix="cs-choice"/,
  ],
  [
    'Shifting Lands',
    'components/shifting-lands-journey-board.vue',
    /<KrChoiceHand\s+:choices="encounterHand"/,
  ],
  [
    'Shifting Lands',
    'components/shifting-lands-journey-board.vue',
    /<KrChoiceHand\s+:choices="trialHand"/,
  ],
]
for (const [game, file, pattern] of adopters) {
  assert.match(
    readFileSync(file, 'utf8'),
    pattern,
    `${game}: ${file} uses the hand`,
  )
}

const games = [...new Set(adopters.map(([game]) => game))]
console.log(
  `Shared choice hand contract passed (${games.length} games: ${games.join(', ')})`,
)
