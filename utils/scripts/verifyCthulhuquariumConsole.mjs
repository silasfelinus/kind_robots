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
console.log('Aquarium bounded console shell contract passed.')
