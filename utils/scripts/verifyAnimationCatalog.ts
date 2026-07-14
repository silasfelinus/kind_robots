// /utils/scripts/verifyAnimationCatalog.ts
// "the animation verification script" referenced by conductor's animation-manager SPEC.md —
// a candidate animation must pass this alongside TypeScript, contract tests, and the browser
// smoke matrix (docs/architecture/animation-catalog-smoke-matrix.md) before promotion.
import assert from 'node:assert/strict'
import { readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  animationEffects,
  getAnimationComponentName,
  isAnimationEffectId,
} from '@/stores/animationCatalog'
import { DEFAULT_PREFERENCES } from '@/stores/animationPreferenceStore'
import { narratorAnimationAliases } from '@/stores/helpers/narratorHelper'

const VALID_SURFACES = new Set(['header', 'sheet', 'page', 'hand', 'fullscreen'])

const ids = animationEffects.map((effect) => effect.id)
const idSet = new Set(ids)

assert.equal(
  idSet.size,
  ids.length,
  `duplicate animation ids in ANIMATION_EFFECTS: ${ids
    .filter((id, index) => ids.indexOf(id) !== index)
    .join(', ')}`,
)

// Nuxt's `pathPrefix: false` component scanner derives a PascalCase name from the filename by
// splitting on any run of "-", "_", or "." — components/screenfx/fireworks.effect.vue resolves
// to the same "FireworksEffect" name as a hyphenated file would. Mirror that here rather than
// assuming a literal "<id>.vue" filename.
function pascalFromFilename(filename: string): string {
  return filename
    .replace(/\.vue$/, '')
    .split(/[-_.]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join('')
}

const screenfxDir = join(dirname(fileURLToPath(import.meta.url)), '../../components/screenfx')
const componentNames = new Set(
  readdirSync(screenfxDir)
    .filter((file) => file.endsWith('.vue'))
    .map(pascalFromFilename),
)

for (const effect of animationEffects) {
  const expectedComponent = getAnimationComponentName(effect.id).replace(/^Lazy/, '')
  assert.ok(
    componentNames.has(expectedComponent),
    `catalog id "${effect.id}" expects a components/screenfx file resolving to "${expectedComponent}", but none was found`,
  )

  if (effect.preferredSurface !== undefined) {
    assert.ok(
      VALID_SURFACES.has(effect.preferredSurface),
      `catalog id "${effect.id}" has invalid preferredSurface "${effect.preferredSurface}"`,
    )
  }

  // pickRandomEffect() (animationStore.ts) and the startup/random preference paths
  // (animationPreferenceStore.ts) only filter by `generationSafe` — a `blocksInput: true`
  // effect that also claims `generationSafe: true` could surface as a blocking generation
  // overlay or startup wallpaper, breaking the SPEC.md passive-experience contract.
  if (effect.blocksInput) {
    assert.equal(
      effect.generationSafe,
      false,
      `catalog id "${effect.id}" sets blocksInput: true but generationSafe: true — random selection paths do not filter blocksInput separately`,
    )
  }
}

const defaultStartupEffect = DEFAULT_PREFERENCES.startupEffect
if (!isAnimationEffectId(defaultStartupEffect)) {
  throw new Error(
    `animationPreferenceStore's DEFAULT_PREFERENCES.startupEffect ("${defaultStartupEffect}") is not a catalog id`,
  )
}

const defaultEffect = animationEffects.find(
  (effect) => effect.id === defaultStartupEffect,
)
assert.ok(
  defaultEffect?.generationSafe && !defaultEffect.blocksInput,
  `animationPreferenceStore's default startup effect ("${defaultStartupEffect}") must be generationSafe and non-blocking`,
)

// animationStore.ts's pickRandomEffect() falls back to this literal id if safeEffects is
// somehow empty — verify it hasn't gone stale independently of the DEFAULT_PREFERENCES check.
assert.ok(
  idSet.has('starfield-effect'),
  'animationStore.pickRandomEffect\'s fallback id "starfield-effect" is no longer in the catalog',
)

for (const [alias, id] of Object.entries(narratorAnimationAliases)) {
  assert.ok(
    isAnimationEffectId(id),
    `narratorAnimationAliases["${alias}"] points at nonexistent catalog id "${id}"`,
  )
}

console.log(
  `Animation catalog verified: ${animationEffects.length} effects, unique ids, ` +
    `${componentNames.size} screenfx components resolved, ${
      Object.keys(narratorAnimationAliases).length
    } narrator aliases checked.`,
)
