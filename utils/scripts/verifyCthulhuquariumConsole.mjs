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
assert.match(
  game,
  /class="cq-room-shade"/,
  'open rooms shade the playable stage',
)
assert.match(game, /class="cq-room-heading"/, 'every room has a common header')
assert.match(
  game,
  /:aria-label="`Close \$\{activePanelName\}`"/,
  'room has a named close control',
)
assert.match(
  game,
  /function selectPanel\(panel: AquariumPanel\) \{[\s\S]*?activePanel\.value === panel[\s\S]*?closePanel\(\)/,
  'selecting an active room toggles back to the tank',
)
assert.match(game, /function openFishMarket\(\) \{\s*openPanel\('shop'\)/)
assert.match(game, /\.cq-room-shade \{[\s\S]*?position: absolute/)
assert.match(
  game,
  /\.cq-command-deck \{[\s\S]*?grid-template-columns: repeat\(6/,
)

const dialogue = readFileSync(
  'components/cthulhuquarium/cthulhuquarium-dialogue.vue',
  'utf8',
)
assert.match(
  dialogue,
  /class="cq-vn-stage pointer-events-auto"/,
  'intro and illustrated interstitials must occupy a cinematic scene',
)
assert.match(
  dialogue,
  /class="cq-vn-character"/,
  'NPC art is a primary full-length scene composition',
)
assert.match(
  dialogue,
  /:aria-modal="cinematic \? true : undefined"/,
  'full-screen story moments announce the dialog to assistive technology',
)
assert.doesNotMatch(
  dialogue,
  /\d+(?:\.\d+)?dvh/,
  'the fixed cinematic overlay must not introduce a nested viewport-height shell',
)
assert.match(game, /const activePanel = ref<AquariumPanel \| null>\(null\)/)
assert.match(
  game,
  /class="cq-room-backdrop pointer-events-none absolute object-cover"/,
)
assert.match(
  game,
  /\.cq-side,\s*\.cq-roster,\s*\.cq-support-panel\s*\{[\s\S]*?width:\s*100%/,
  'all rooms occupy the console scene rather than tiny sidebars',
)
assert.doesNotMatch(
  game,
  /const activePanel = ref<AquariumPanel>\('shop'\)/,
  'no room should open by default over the aquarium',
)
const { existsSync } = await import('node:fs')
for (const asset of [
  'portraits/charlotte-fishmonger-welcome.webp',
  'portraits/wilbur-stint-greeting.webp',
  'plates/screen-arrival.webp',
  'videos/charlotte-fishmonger-hero.webp',
  'videos/wilbur-stint-hero.webp',
]) {
  assert.ok(
    existsSync(`assets/images/cthulhuquarium/${asset}`),
    `missing intro cinematic art: ${asset}`,
  )
}

console.log('Aquarium bounded console shell contract passed.')
