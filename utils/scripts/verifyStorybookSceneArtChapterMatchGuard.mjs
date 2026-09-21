// /utils/scripts/verifyStorybookSceneArtChapterMatchGuard.mjs
//
// Contract check for components/storybook/storybook-reading.vue (storybook/t-010).
//
// sceneArt's own comment says the illustration is "drawn from what the run
// actually holds for this chapter, and is simply absent until there is
// something -- an empty frame is worse than no frame." The computed used to
// contradict that: when the current chapter had no art yet, it fell back to
// `runStore.art[runStore.art.length - 1]` -- the LAST art entry regardless of
// chapter, i.e. a previous scene's illustration shown next to the current
// scene's narrative text. That is worse than no frame, not better: a reader
// sees art that does not match what they are reading, with nothing marking
// it as stale. Pins that the fallback stays gone.

import { readFileSync } from 'node:fs'

const COMPONENT_PATH = 'components/storybook/storybook-reading.vue'
const source = readFileSync(COMPONENT_PATH, 'utf8')

let failures = 0

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  PASS  ${name}`)
  } else {
    failures += 1
    console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

console.log('Storybook reading — scene art never shows a mismatched chapter')

const start = source.indexOf('const sceneArt = computed(')
if (start === -1) {
  console.error(`  FAIL  could not find sceneArt computed in ${COMPONENT_PATH}`)
  process.exit(1)
}
const sceneArtBody = source.slice(start, source.indexOf('})', start) + 2)

check(
  'sceneArt only reads the entry matching the current chapter',
  sceneArtBody.includes('const image = forTurn?.ArtImage'),
  sceneArtBody.replace(/\s+/g, ' ').trim(),
)
check(
  'sceneArt no longer falls back to the last art entry regardless of chapter',
  !sceneArtBody.includes('art.length - 1'),
  'a stale-chapter fallback would show art from an earlier scene next to the current narrative text',
)

if (failures) {
  console.error(`\n${failures} check(s) failed.`)
  process.exit(1)
}
console.log('\nAll Storybook scene-art chapter-match checks passed.')
