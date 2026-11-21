// utils/scripts/verifyCthulhuquariumArtStyles.test.ts
//
// Contract for Cthulhuquarium's swappable art styles (conductor
// cthulhuquarium/t-107), the Shifting Desks pattern: presentation only, kept
// with the game settings per browser, a mirrored styles/<id>/ tree, Classic as
// the per-file fallback, and a style offered only once it is available.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  activeCthulhuquariumArtStyle,
  CTHULHUQUARIUM_ART_STYLES,
  CTHULHUQUARIUM_DEFAULT_ART_STYLE,
  normalizeCthulhuquariumArtStyle,
  pickCthulhuquariumStyledArt,
  selectableCthulhuquariumArtStyles,
  setCthulhuquariumArtStyle,
} from '../cthulhuquariumArtStyles.js'
import { readCthulhuquariumSettings } from '../cthulhuquariumSettings.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const read = (path: string) => readFileSync(join(root, path), 'utf8')

// The registry.
assert.equal(CTHULHUQUARIUM_DEFAULT_ART_STYLE, 'classic')
assert.equal(CTHULHUQUARIUM_ART_STYLES[0]?.id, 'classic')
assert.ok(
  CTHULHUQUARIUM_ART_STYLES.find((style) => style.id === 'classic')?.available,
  'Classic is always on offer',
)
const offered = selectableCthulhuquariumArtStyles().map((style) => style.id)
assert.equal(offered[0], 'classic', 'Classic is offered first')
for (const style of CTHULHUQUARIUM_ART_STYLES) {
  assert.equal(
    normalizeCthulhuquariumArtStyle(style.id),
    style.available ? style.id : 'classic',
    `${style.id}: offered only when available`,
  )
}
for (const junk of [undefined, null, '', 'western-cartoon', 42, {}]) {
  assert.equal(normalizeCthulhuquariumArtStyle(junk), 'classic')
}

// Settings carry it, defensively.
assert.equal(readCthulhuquariumSettings(null).artStyle, 'classic')
assert.equal(
  readCthulhuquariumSettings('{"artStyle":"nonsense"}').artStyle,
  'classic',
)
assert.equal(
  readCthulhuquariumSettings('{"artStyle":"classic"}').artStyle,
  'classic',
)

// The active style follows the setting, normalized.
setCthulhuquariumArtStyle('nonsense')
assert.equal(activeCthulhuquariumArtStyle.value, 'classic')

// Per-file resolution: a styled file when the style has it, else Classic (null).
const files = {
  'illustrious/portraits/wilbur-stint-explaining': '/s/wilbur.webp',
  'illustrious/sprites/lint-shrimp': '/s/lint.webp',
}
assert.equal(
  pickCthulhuquariumStyledArt(files, 'classic', 'sprites', 'lint-shrimp'),
  null,
  'Classic never reads the styled tree',
)
assert.equal(
  pickCthulhuquariumStyledArt(files, 'illustrious', 'sprites', 'lint-shrimp'),
  '/s/lint.webp',
)
assert.equal(
  pickCthulhuquariumStyledArt(files, 'illustrious', 'sprites', 'the-usher'),
  null,
  'a file the style has not rendered falls back to Classic',
)

// The resolvers ask the style first and fall back to Classic; Classic footage
// (fish clips, moving plates) pauses under another style.
const art = read('utils/cthulhuquariumArt.ts')
const sprites = read('utils/cthulhuquariumSprites.ts')
const styledArt = read('utils/cthulhuquariumStyledArt.ts')
assert.match(
  styledArt,
  /assets\/images\/cthulhuquarium\/styles\/\*\/\{sprites,portraits,heroes,backgrounds,plates,ui\}\/\*\.webp/,
  'the styled tree is bundled',
)
for (const resolver of [
  "styled('sprites', slug) ?? lookup('fish', slug)",
  "styled('portraits', stem)",
  "styled('backgrounds', key)",
  "styled('plates', key)",
  "styled('heroes', stem.slice(5))",
]) {
  assert.ok(art.includes(resolver), `cthulhuquariumArt: ${resolver}`)
}
assert.ok(
  /function movingArt[\s\S]*?cthulhuquariumStyleIsClassic\(\)\) return null/.test(
    art,
  ),
  'moving plates pause under another style',
)
assert.ok(
  sprites.includes("cthulhuquariumStyledArt('sprites', slug)") &&
    /function clipForSpecies[\s\S]*?cthulhuquariumStyleIsClassic\(\)\) return null/.test(
      sprites,
    ),
  'sprites are styled; clips pause under another style',
)

// Everything that caches or captures art follows a swap.
const game = read('components/cthulhuquarium/cthulhuquarium-game.vue')
assert.ok(
  game.includes('const shopHeaderArt = computed(') &&
    game.includes('`${activeCthulhuquariumArtStyle.value}:${slug}`') &&
    game.includes(
      '[tankStore.backgroundKey, activeCthulhuquariumArtStyle.value]',
    ),
  'game: header art computed, canvas caches and background keyed by style',
)
const tankView = read('components/cthulhuquarium/cthulhuquarium-tank-view.vue')
assert.ok(
  tankView.includes(
    '`${activeCthulhuquariumArtStyle.value}:${occupant.slug}`',
  ) &&
    tankView.includes(
      '[props.backgroundKey, activeCthulhuquariumArtStyle.value]',
    ),
  'tank view: caches and background keyed by style',
)
assert.ok(
  read('components/cthulhuquarium/cthulhuquarium-ui-art.vue').includes(
    "cthulhuquariumStyledArt('ui', name)",
  ),
  'painted UI art is styled',
)
assert.ok(
  read('components/cthulhuquarium/cthulhuquarium-shop-window.vue').includes(
    'const steps = computed(',
  ),
  'shop window plates follow a swap',
)

// The setting reaches the resolvers, and the picker is where players look.
assert.ok(
  read('stores/helpers/cthulhuquariumStory.ts').includes(
    'setCthulhuquariumArtStyle(settings.value.artStyle)',
  ),
  'the story helper applies the saved style',
)
const picker = read('components/cthulhuquarium/cthulhuquarium-style-picker.vue')
assert.ok(
  picker.includes('v-if="options.length > 1"') &&
    picker.includes('role="radiogroup"') &&
    picker.includes('tankStore.updateSettings({ artStyle: style })'),
  'the picker hides with one style, is a radiogroup and saves the setting',
)
for (const host of [
  'components/cthulhuquarium/cthulhuquarium-settings.vue',
  'components/cthulhuquarium/cthulhuquarium-title-card.vue',
]) {
  assert.ok(
    read(host).includes('<cthulhuquarium-style-picker'),
    `${host} mounts the picker`,
  )
}

// The canon sync mirrors each style whole.
assert.ok(
  read('scripts/sync_cthulhuquarium_canon.mjs').includes(
    "join('styles', style, folder)",
  ),
  'the sync copies styles/<id>/built/<folder>',
)

console.log(
  `✅ verifyCthulhuquariumArtStyles: ${CTHULHUQUARIUM_ART_STYLES.length} styles (${offered.join(', ')} offered), per-file Classic fallback, swaps reach every cache`,
)
