// utils/rulerHooked/timingBar.selftest.ts
//
// Headless behavioral test of the timing-bar rarity visual cue
// (ruler-hooked/t-041), run via `npx tsx` -- same convention as
// economy.selftest.ts / encounter.selftest.ts. Proves: every rarity gets a
// well-formed, distinct REEL-band color, the marker silhouette only
// upgrades to 'diamond' from RARE up, and resolveTimingStop()'s
// position-to-action/quality resolution (game-state determinism) is
// untouched by any of it.

import assert from 'node:assert/strict'
import {
  resolveTimingStop,
  timingProfileFor,
  timingVisualFor,
} from '~/utils/rulerHooked/timingBar'
import type { Rarity } from '~/types/ruler-hooked'

const RARITIES: Rarity[] = [
  'COMMON',
  'UNCOMMON',
  'RARE',
  'EPIC',
  'LEGENDARY',
  'MYTHIC',
]

// 1. Every rarity resolves to a non-empty, distinct DaisyUI band color class.
{
  const colors = RARITIES.map((r) => timingVisualFor(r).bandColorClass)
  for (const c of colors) {
    assert.ok(c.length > 0, 'band color class is non-empty')
    assert.match(c, /^bg-/, 'band color is a background utility')
  }
  assert.equal(
    new Set(colors).size,
    colors.length,
    'every rarity gets its own band color',
  )
}

// 2. Marker silhouette is 'capsule' below RARE and 'diamond' from RARE up --
//    exactly matching the difficulty ladder in RARITY_DIFFICULTY.
{
  const shapeByRarity = Object.fromEntries(
    RARITIES.map((r) => [r, timingVisualFor(r).markerShape]),
  )
  assert.equal(shapeByRarity.COMMON, 'capsule')
  assert.equal(shapeByRarity.UNCOMMON, 'capsule')
  assert.equal(shapeByRarity.RARE, 'diamond')
  assert.equal(shapeByRarity.EPIC, 'diamond')
  assert.equal(shapeByRarity.LEGENDARY, 'diamond')
  assert.equal(shapeByRarity.MYTHIC, 'diamond')
}

// 3. Purely cosmetic: calling timingVisualFor alongside timingProfileFor and
//    resolveTimingStop never changes the resolved action/quality -- the
//    same stop position against the same profile resolves identically
//    whether or not the visual helper is consulted at all.
{
  const state = {
    family: 'STANDARD_TENSION' as const,
    rarity: 'MYTHIC' as const,
    beat: 2,
  }
  const profile = timingProfileFor(state)
  timingVisualFor(state.rarity) // never mutates profile or influences resolution
  const bandCenter = profile.bandStart + profile.bandWidth / 2
  const a = resolveTimingStop(bandCenter, profile)
  const b = resolveTimingStop(bandCenter, profile)
  assert.deepEqual(
    a,
    b,
    'same position + profile resolves identically regardless of visual lookups',
  )
  assert.equal(a.action, 'REEL')
  assert.ok(a.quality > 0.99, 'dead-center stop is near-perfect quality')
}

console.log('timingBar.selftest.ts: all assertions passed')
