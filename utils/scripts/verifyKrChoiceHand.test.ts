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

const adopters: Array<[file: string, pattern: RegExp]> = [
  ['components/ecotone-choice-hand.vue', /<KrChoiceHand/],
  ['components/ecotone-board.vue', /<EcotoneChoiceHand/],
]
for (const [file, pattern] of adopters) {
  assert.match(readFileSync(file, 'utf8'), pattern, `${file} uses the hand`)
}

console.log(
  `Shared choice hand contract passed (${adopters.length - 1} game${adopters.length === 2 ? '' : 's'})`,
)
