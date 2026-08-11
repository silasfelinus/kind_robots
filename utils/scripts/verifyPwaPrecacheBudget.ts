// /utils/scripts/verifyPwaPrecacheBudget.ts
//
// Kind Robots is installable, not a full offline app. Pages are SSR/API-driven,
// so precaching every built JS chunk buys no offline refresh while forcing every
// install/update to download the whole feature graph. Keep Workbox limited to
// stable install chrome unless the product explicitly adopts an offline mode.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const config = await readFile('nuxt.config.ts', 'utf8')
const workbox = config.match(/workbox:\s*\{([\s\S]*?)\n\s*\},\n\s*\},/m)?.[1] ?? ''

assert.ok(workbox, 'nuxt.config.ts must keep an explicit Workbox configuration')
assert.doesNotMatch(
  workbox,
  /\*\.\{[^}]*\b(?:js|css)\b[^}]*\}|\*\.js|\*\.css/,
  'PWA precache must not glob built JS/CSS; route-local bundles load on demand',
)
assert.match(workbox, /icon-192x192\.png/)
assert.match(workbox, /icon-512x512\.png/)
assert.match(workbox, /apple-touch-icon\.png/)
assert.match(workbox, /navigateFallback:\s*null/)

console.log(
  'PWA precache budget verified: install chrome only; no whole-product JS/CSS precache.',
)
