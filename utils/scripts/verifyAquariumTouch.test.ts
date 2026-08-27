// /utils/scripts/verifyAquariumTouch.test.ts
//
// Regression test for cthulhuquarium/t-020's touch-hit-radius scaling
// (utils/aquariumTouch.ts). No canvas, no DOM -- pure geometry, same
// discipline as verifyAquariumEconomy.test.ts.
import assert from 'node:assert/strict'

import { touchHitRadius } from '../aquariumTouch.js'

// --- at 1:1 scale, a target already >= the minimum is left alone ----------

assert.equal(touchHitRadius(30, 640, 640), 30)

// --- a small base radius grows to cover the minimum touch size ------------
// Even at full stage width (no scaling down), a 17px hit radius (MOTE_RADIUS
// + 8) is smaller than the 44px minimum touch diameter's 22px radius, so it
// grows to 22.

assert.equal(touchHitRadius(17, 640, 640), 22)

// --- shrunk to a phone-width canvas, the same radius must grow ------------
// display=320 against stage=640 is a 0.5 scale factor; a 44px touch target
// needs a 22px CSS radius, which is 44 stage units at 0.5 scale.

assert.equal(touchHitRadius(17, 640, 320), 44)

// --- an even smaller phone (or a narrow embedded panel) scales further -----

assert.equal(
  Math.round(touchHitRadius(17, 640, 200) * 100) / 100,
  Math.round((22 / (200 / 640)) * 100) / 100,
)

// --- degenerate inputs fall back to the base radius, never throw ----------

assert.equal(touchHitRadius(17, 640, 0), 17)
assert.equal(touchHitRadius(17, 640, -10), 17)
assert.equal(touchHitRadius(17, 0, 320), 17)
assert.equal(touchHitRadius(17, 640, Number.NaN), 17)

console.log('verifyAquariumTouch: all assertions passed')
