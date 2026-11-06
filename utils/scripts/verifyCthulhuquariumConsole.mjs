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
assert.match(
  game,
  /\.cq-layout\s*\{[^}]*grid-template-areas:\s*'top' 'tank' 'deck'/s,
  'the bezel stacks the HUD band, the tank stage and the command deck',
)
assert.match(
  game,
  /\.cq-side,\s*\.cq-roster,\s*\.cq-support-panel\s*\{[^}]*position:\s*absolute/s,
)
assert.match(game, /aria-label="Aquarium rooms"/)
assert.match(game, /v-show="activePanel === 'shop'"/)
assert.match(
  game,
  /v-show="activePanel === 'roster' \|\| activePanel === 'bestiary'"/,
  'the Creatures room holds the roster and the book',
)
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
assert.match(
  game,
  /<page-help label="How to tend the tank" @open="tankStore\.openGuide\(\)" \/>/,
  'the system bar "?" opens the illustrated tutorial',
)
assert.match(game, /<cthulhuquarium-guide \/>/, 'the tutorial deck is mounted')
assert.match(
  game,
  /class="cq-controller"[\s\S]*?v-for="tab in CONSOLE_TABS"[\s\S]*?:data-tab="tab\.id"[\s\S]*?class="cq-prompts"/,
  'the controller is the five-tab command deck with its button-prompt row',
)
assert.match(
  game,
  /class="cq-meter cq-action-clean"/,
  'Clean stays one tap away as the cleanliness meter on the water',
)
assert.match(
  game,
  /case 'feed':[\s\S]*?label: 'Feed hungriest'[\s\S]*?run: onFeed/,
  'the Feed tab feeds the hungriest or every hungry creature',
)
assert.match(
  game,
  /KeyQ: 'prevTab'[\s\S]*?BracketLeft: 'prevTab'[\s\S]*?KeyE: 'nextTab'[\s\S]*?BracketRight: 'nextTab'/,
  'Q/E and [ ] cycle the deck like shoulder buttons',
)
assert.match(
  game,
  /readPad\(pad, padMemory, timestamp\)/,
  'a gamepad drives the same console commands (LB/RB, A, B, X, Y)',
)
assert.match(
  game,
  /if \(isTextEntry\(document\.activeElement\) \|\| consoleBlocked\(\)\) return/,
  'console keys never steal typing or fire under a modal',
)
assert.match(
  game,
  /@media \(prefers-reduced-motion: reduce\)/,
  'the console respects reduced motion',
)
assert.match(
  game,
  /\.cq-room-layer \{[^}]*grid-area: tank/,
  'rooms open over the tank, never over the controller',
)
assert.match(game, /\.cq-room-shade \{[\s\S]*?position: absolute/)
assert.match(
  game,
  /\.cq-command-deck \{[\s\S]*?grid-template-columns: auto repeat\(5, minmax\(0, 1fr\)\) auto/,
  'five tabs between the L and R shoulder hints',
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

const play = readFileSync(
  'components/cthulhuquarium/cthulhuquarium-play.vue',
  'utf8',
)
assert.match(
  play,
  /<shell-console-theme theme="cthulhuquarium" \/>/,
  'the whole shell wears the aquarium console skin',
)
const css = readFileSync('assets/css/tailwind.css', 'utf8')
assert.match(css, /name: 'cthulhuquarium';/, 'the console theme is defined')
const guide = readFileSync(
  'components/cthulhuquarium/cthulhuquarium-guide.vue',
  'utf8',
)
assert.match(guide, /role="dialog"/)
assert.match(guide, /aria-modal="true"/)
assert.match(
  guide,
  /data-theme="cthulhuquarium"/,
  'teleported tutorial keeps the skin',
)
const story = readFileSync('stores/helpers/cthulhuquariumStory.ts', 'utf8')
assert.match(
  story,
  /scene\.id === 'intro' && !guideSeen\.value\) guideOpen\.value = true/,
  'the tutorial follows the welcome for a new player',
)

console.log('Aquarium bounded console shell contract passed.')
