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
assert.match(hand, /v-if="imageOf\(choice\)"/, 'images fall through in order')
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
  /name="krh-deal"\s+appear/,
  'a freshly mounted hand deals in',
)
assert.match(
  hand,
  /watch\(\s*\(\) => props\.dealKey,\s*\(\) => \{\s*if \(playTimer\) clearTimeout\(playTimer\)/,
  'a new hand cancels a play still in flight',
)
assert.match(hand, /:aria-keyshortcuts="choice\.shortcut"/)
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
  [
    'Game of Captains',
    'components/game-of-captains/space-couch-choice-hand.vue',
    /<KrChoiceHand/,
  ],
  [
    'Game of Captains',
    'pages/play/game-of-captains.vue',
    /<SpaceCouchChoiceHand/,
  ],
  [
    'Game of Captains',
    'components/gameOfCaptains/alien-milestone.vue',
    /<SpaceCouchChoiceHand/,
  ],
  [
    'Game of Captains',
    'components/game-of-captains/space-couch-trio-interlude.vue',
    /<SpaceCouchChoiceHand/,
  ],
  [
    'Game of Captains',
    'components/gameOfCaptains/constellation-test.vue',
    /<SpaceCouchChoiceHand/,
  ],
  ['Comet City Academy', 'pages/play/comet-city-academy.vue', /<KrChoiceHand/],
  ['Slime City', 'components/slime-city-campaign.vue', /<KrChoiceHand/],
  ['Storybook', 'components/storybook/storybook-reading.vue', /<KrChoiceHand/],
  [
    'Zuzu Gamebook',
    'pages/play/zuzu-gamebook.vue',
    /<KrChoiceHand[\s\S]*?testid-prefix="zuzu-choice"/,
  ],
  [
    'Zuzu Gamebook',
    'pages/play/zuzu-gamebook.vue',
    /<KrChoiceHand[\s\S]*?testid-prefix="zuzu-move"/,
  ],
  [
    'Emperor of Dust',
    'components/EmperorFortressDialogue.vue',
    /<KrChoiceHand[\s\S]*?emit\('choose', answer\.id\)/,
  ],
  [
    'Emperor of Dust',
    'components/EmperorFortressBriefing.vue',
    /<KrChoiceHand[\s\S]*?pickChance\(choice\.id\)/,
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
