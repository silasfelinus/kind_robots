// utils/scripts/verifyCthulhuquariumSound.test.ts
//
// Contract for Cthulhuquarium's sound (conductor cthulhuquarium/t-110): every
// game event has a short, quiet effect that something actually triggers, and
// the synthesized theme has one variation per floor, each lower, slower and
// darker than the one above, composed deterministically and in key.

import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  CTHULHUQUARIUM_SFX,
  cthulhuquariumSfxSeconds,
  type CthulhuquariumSfxName,
} from '../cthulhuquariumSfx.js'
import {
  composeCthulhuquariumPhrase,
  CTHULHUQUARIUM_FLOOR_THEMES,
  CTHULHUQUARIUM_PHRASE_BEATS,
  cthulhuquariumThemeFor,
} from '../cthulhuquariumMusic.js'
import { readCthulhuquariumSettings } from '../cthulhuquariumSettings.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '../..')
const read = (path: string) => readFileSync(join(root, path), 'utf8')

// Effects: short, quiet, audible.
const names = Object.keys(CTHULHUQUARIUM_SFX) as CthulhuquariumSfxName[]
assert.ok(names.length >= 20, `${names.length} effects`)
for (const name of names) {
  const voices = CTHULHUQUARIUM_SFX[name]
  assert.ok(voices.length > 0, `${name}: has a voice`)
  assert.ok(cthulhuquariumSfxSeconds(name) <= 3.5, `${name}: under 3.5s`)
  for (const voice of voices) {
    assert.ok(voice.peak > 0 && voice.peak <= 0.3, `${name}: quiet peak`)
    assert.ok(voice.seconds > 0 && voice.at >= 0, `${name}: timed`)
    for (const hz of [voice.from, voice.to]) {
      assert.ok(hz >= 40 && hz <= 8000, `${name}: ${hz}Hz audible`)
    }
  }
}

// Every effect is triggered by something: the store, a scene, or the console.
const sources = [
  read('stores/cthulhuquariumTankStore.ts'),
  read('components/cthulhuquarium/cthulhuquarium-dialogue.vue'),
  read('components/cthulhuquarium/cthulhuquarium-game.vue'),
].join('\n')
for (const name of names) {
  assert.ok(
    sources.includes(`emitSfx('${name}')`) ||
      sources.includes(`sfx('${name}')`),
    `${name}: triggered somewhere`,
  )
}
const game = read('components/cthulhuquarium/cthulhuquarium-game.vue')
assert.ok(
  game.includes('() => tankStore.sfx') && game.includes('tankSound.play(name)'),
  'the console plays the store events while sound is on',
)

// The theme: five floors, each descending in register, tempo and brightness.
const themes = [1, 2, 3, 4, 5].map(
  (floor) => CTHULHUQUARIUM_FLOOR_THEMES[floor as 1],
)
for (let index = 1; index < themes.length; index += 1) {
  const above = themes[index - 1]!
  const theme = themes[index]!
  assert.ok(theme.bpm < above.bpm, `${theme.name}: slower than ${above.name}`)
  assert.ok(theme.rootMidi < above.rootMidi, `${theme.name}: lower`)
  assert.ok(theme.padCutoff < above.padCutoff, `${theme.name}: darker`)
  assert.ok(theme.bellDensity < above.bellDensity, `${theme.name}: sparser`)
}
assert.equal(cthulhuquariumThemeFor(0).floor, 1)
assert.equal(cthulhuquariumThemeFor(9).floor, 5)

for (const theme of themes) {
  const phrase = composeCthulhuquariumPhrase(theme.floor, 3)
  assert.deepEqual(
    phrase,
    composeCthulhuquariumPhrase(theme.floor, 3),
    `${theme.name}: deterministic`,
  )
  assert.notDeepEqual(
    phrase,
    composeCthulhuquariumPhrase(theme.floor, 4),
    `${theme.name}: phrases vary`,
  )
  const inScale = new Set(
    theme.scale.map((step) => (theme.rootMidi + step) % 12),
  )
  for (const note of phrase) {
    assert.ok(
      note.beat >= 0 && note.beat < CTHULHUQUARIUM_PHRASE_BEATS,
      `${theme.name}: note inside the phrase`,
    )
    assert.ok(note.midi >= 20 && note.midi <= 100, `${theme.name}: playable`)
    assert.ok(
      inScale.has(((note.midi % 12) + 12) % 12),
      `${theme.name}: in key`,
    )
  }
  for (let chord = 0; chord < 4; chord += 1) {
    assert.ok(
      phrase.some(
        (note) =>
          note.voice === 'bell' &&
          note.beat >= chord * 4 &&
          note.beat < chord * 4 + 4,
      ),
      `${theme.name}: a bell under every chord`,
    )
  }
}

// The music setting.
assert.equal(readCthulhuquariumSettings(null).music, true)
assert.equal(readCthulhuquariumSettings('{"music":false}').music, false)
assert.ok(
  read('components/cthulhuquarium/cthulhuquarium-settings.vue').includes(
    'updateSettings({ music: checked($event) })',
  ),
  'settings has a Music toggle',
)
assert.ok(
  game.includes('tankSound.playMusic(tankStore.storyFloor)'),
  'the theme follows the floor',
)

console.log(
  `✅ verifyCthulhuquariumSound: ${names.length} effects all triggered, five floor themes descending and in key`,
)
