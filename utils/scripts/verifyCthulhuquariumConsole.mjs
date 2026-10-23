import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const page = readFileSync('components/conductor/aquarium-page.vue', 'utf8')
const game = readFileSync(
  'components/cthulhuquarium/cthulhuquarium-game.vue',
  'utf8',
)

assert.match(
  page,
  /class="kr-surface[^"]*"/,
  'game route owns a bounded surface',
)
assert.match(page, /class="kr-stage"/, 'game route fills the shell stage')
assert.doesNotMatch(
  page,
  /<project-front-page\b/,
  'no scrolling project front page behind the console',
)
assert.match(game, /\.cq-game:not\(\.cq-fullscreen\)\s*\{[^}]*height:\s*100%/s)
assert.doesNotMatch(
  game,
  /100dvh|calc\(100vh/,
  'nested console uses parent height, never viewport height',
)
assert.match(game, /\.cq-layout\s*\{[^}]*grid-template-areas:\s*'tank' 'deck'/s)
assert.match(
  game,
  /\.cq-side,\s*\.cq-roster,\s*\.cq-support-panel\s*\{[^}]*position:\s*absolute/s,
)
assert.match(game, /aria-label="Aquarium rooms"/)
assert.match(game, /v-show="activePanel === 'shop'"/)
assert.match(game, /v-show="activePanel === 'bestiary'"/)
assert.match(game, /v-show="activePanel === 'scenery'"/)
assert.match(
  game,
  /const activePanel = ref<AquariumPanel \| null>\(null\)/,
  'returning players should see the tank, not an automatically open shop',
)
assert.match(game, /class="cq-room-shade"/, 'open rooms shade the playable stage')
assert.match(game, /class="cq-room-heading"/, 'every room has a common header')
assert.match(game, /:aria-label="`Close \$\{activePanelName\}`"/, 'room has a named close control')
assert.match(
  game,
  /function selectPanel\(panel: AquariumPanel\) \{[\s\S]*?activePanel\.value === panel[\s\S]*?closePanel\(\)/,
  'selecting an active room toggles back to the tank',
)
assert.match(game, /function openFishMarket\(\) \{\s*openPanel\('shop'\)/)
assert.match(game, /\.cq-room-shade \{[\s\S]*?position: absolute/)
assert.match(game, /\.cq-command-deck \{[\s\S]*?grid-template-columns: repeat\(6/)

console.log('Aquarium bounded console shell contract passed.')
