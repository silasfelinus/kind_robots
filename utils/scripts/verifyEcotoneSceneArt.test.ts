import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

// Every Ecotone picture is drawn by EcotoneScene, which fades the generated art
// in over a code-drawn fallback once the image has loaded. On kindrobots.org the
// server-rendered images finished loading before hydration attached @load, so
// the generated art sat at opacity 0 and players saw only the fallback
// (found 2026-11-19 PT). The component must read the element's own state too.
const scene = readFileSync('components/ecotone-scene.vue', 'utf8')
assert.match(scene, /ref="artImg"/, 'the art <img> is reachable after mount')
assert.match(scene, /onMounted\(syncArtState\)/, 'load state is read on mount')
assert.match(
  scene,
  /img\.complete[\s\S]{0,120}img\.naturalWidth > 0\) loadedArt\.value = true/,
  'an already-loaded image is shown',
)
assert.match(
  scene,
  /else failed\.value = true/,
  'an image that already failed falls back instead of hiding',
)
const watcher = scene.slice(scene.indexOf('watch(src'))
assert.match(
  watcher.slice(0, watcher.indexOf('})')),
  /await nextTick\(\)\s+syncArtState\(\)/,
  'a source change re-checks the new image once it is in the DOM',
)
assert.match(scene, /@load="loadedArt = true"/, 'the load event still counts')

console.log('Ecotone scene art: generated pictures survive SSR hydration')
