// /utils/scripts/verifyGalleryConsistency.ts
//
// The three ways a gallery adoption silently fails to look consistent.
//
// Silas, 2026-08-04, after the first scenario-gallery adoption landed:
//
//   "I do not actually see a difference, the individual scenarios are appearing
//    but with formatting that is awkward (small card, excessive padding, no
//    different layouts). Why am I asked to vet this when it isn't up to
//    standard?"
//
// and then, on the remaining four galleries:
//
//   "can we make sure that when we do the other models we aren't repeating this
//    error. we are trying to create a consistent look, but seem to keep hitting
//    the same walls because we aren't expecting a consistent style"
//
// That is the right diagnosis: the defects were not carelessness, they were
// UNEXPECTED. Nothing in the repo said what a consistent gallery owes the user,
// so each adoption rediscovered the same three walls. verifyGalleryAdoption.ts
// counts WHETHER a gallery adopted the shell; this asserts the adoption is
// worth having.
//
// Every check below is a defect that actually shipped, not a hypothetical.

import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

const failures: string[] = []
const notes: string[] = []

/**
 * Strip comments before any forbid-scan.
 *
 * interface-vision t-068: "a doc comment can fail 29 source-text contracts".
 * This contract proved it on its own first run — scenario-card.vue was flagged
 * for hardcoding `variant="card"` when the only occurrence left was inside the
 * doc comment explaining that it USED to. A contract that punishes you for
 * documenting the thing it asked you to fix trains people to delete comments.
 */
function stripComments(src: string): string {
  return src
    .replace(/<!--[\s\S]*?-->/g, '') // template
    .replace(/\/\*[\s\S]*?\*\//g, '') // block
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1') // line, sparing protocol slashes
}

const fail = (msg: string) => failures.push(msg)
const ok = (msg: string) => notes.push(`ok - ${msg}`)

/* ------------------------------------------------------------------ *
 * 1. Gallery grids must be CONTAINER-responsive, never viewport-keyed.
 * ------------------------------------------------------------------ */
//
// MODE_GRID_CLASS shipped as `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
// xl:grid-cols-4`. Tailwind breakpoints key off the VIEWPORT, but these
// galleries mount inside manager panels. On a 1440px screen `xl:grid-cols-4`
// fired while the container was 320px wide: four columns, 71px cards.
//
// Measured, viewport pinned at 1440px, only the container varying:
//   panel 320px -> before 4 cols/71px   after 1 col /320px
//   panel 480px -> before 4 cols/111px  after 2 cols/234px
//
// auto-fill + minmax needs no breakpoints: it fills the width it is actually
// given, and min(..., 100%) guarantees it collapses to one column rather than
// overflowing when that width is below the minimum.
const VIEWPORT_PREFIX = /\b(sm|md|lg|xl|2xl):/

const vocabSrc = stripComments(
  await readFile('utils/galleryVocabulary.ts', 'utf8'),
)
const gridBlock = vocabSrc.match(
  /export const MODE_GRID_CLASS[\s\S]*?\n\}/,
)?.[0]

if (!gridBlock) {
  fail(
    'utils/galleryVocabulary.ts: MODE_GRID_CLASS not found. If it moved, update this contract.',
  )
} else {
  const offenders = gridBlock
    .split('\n')
    .filter((line) => VIEWPORT_PREFIX.test(line))
    .map((line) => line.trim())

  if (offenders.length) {
    fail(
      'MODE_GRID_CLASS uses VIEWPORT breakpoints. Galleries mount inside panels, ' +
        'so sm:/lg:/xl: sizes columns by the screen while the container is narrow ' +
        '-- this is the "small card" defect (4 columns of 71px in a 320px panel). ' +
        'Use repeat(auto-fill, minmax(min(<rem>,100%),1fr)) instead:\n' +
        offenders.map((o) => `           ${o}`).join('\n'),
    )
  } else if (!gridBlock.includes('auto-fill')) {
    fail(
      'MODE_GRID_CLASS no longer uses auto-fill. Container-responsive sizing is ' +
        'the contract; a fixed column count cannot adapt to the panel it is in.',
    )
  } else {
    ok(
      'gallery grids are container-responsive (auto-fill, no viewport breakpoints)',
    )
  }
}

/* ------------------------------------------------------------------ *
 * 2. An object card must accept `variant` — never hardcode it.
 * ------------------------------------------------------------------ */
//
// scenario-card.vue passed `variant="card"` as a literal to
// kr-entity-card-body and exposed no prop, so the gallery's Cards/Heroes/Icons
// bar changed nothing visible: every mode rendered the identical portrait card.
// That is half of "no different layouts". A card that cannot be told which
// variant to render makes the whole vocabulary decorative.
const CARD_FILES = [
  'components/bots/bot-card.vue',
  'components/characters/character-card.vue',
  'components/dreams/dream-card.vue',
  'components/rewards/reward-card.vue',
  'components/scenarios/scenario-card.vue',
]

for (const file of CARD_FILES) {
  const src = await readFile(file, 'utf8').catch(() => '')
  if (!src) {
    fail(`${file}: not found. If the card moved, update this contract.`)
    continue
  }
  if (!src.includes('kr-entity-card-body')) continue

  const code = stripComments(src)
  const hardcoded = code.match(/\bvariant="(card|hero|icon)"/)
  if (hardcoded) {
    fail(
      `${file}: hardcodes ${hardcoded[0]} on kr-entity-card-body, so a gallery ` +
        'mode switch cannot reach the art. Take a `variant?: ArtVariant` prop ' +
        "(default 'card') and bind it, as dream-card and scenario-card do.",
    )
  } else if (!/variant\?:\s*ArtVariant/.test(code)) {
    fail(
      `${file}: renders kr-entity-card-body but declares no ` +
        '`variant?: ArtVariant` prop, so it cannot follow the gallery mode.',
    )
  }
}
if (!failures.length) ok(`${CARD_FILES.length} object cards accept a variant`)

/* ------------------------------------------------------------------ *
 * 3. A kr-gallery mount that shows a mode bar must bind :mode.
 * ------------------------------------------------------------------ */
//
// The other half of "no different layouts": scenario-gallery mounted
// <kr-gallery> and never bound :mode, so the shell sat on its default 'cards'
// forever. A mode bar the parent never reads is a control that does nothing.
//
// `:modes="[]"` is the legitimate opt-out -- it hides the bar entirely, which
// facet-gallery uses because a picker above drives every group at once.
const COMPONENT_ROOTS = ['components']

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(path)
    else if (entry.name.endsWith('.vue')) yield path
  }
}

let mountCount = 0
for (const root of COMPONENT_ROOTS) {
  for await (const file of walk(root)) {
    const src = stripComments(await readFile(file, 'utf8'))
    if (!src.includes('<kr-gallery')) continue

    // Each mount, from the tag through its closing bracket.
    for (const mount of src.match(/<kr-gallery[\s\S]*?>/g) ?? []) {
      mountCount += 1
      const hidesBar = /:modes="\[\]"/.test(mount)
      const bindsMode = /:mode="/.test(mount)

      if (!hidesBar && !bindsMode) {
        fail(
          `${file}: mounts <kr-gallery> showing its mode bar but never binds ` +
            ':mode, so the shell stays on its default and the buttons do ' +
            'nothing. Bind :mode + @update:mode, or pass :modes="[]" to hide ' +
            'the bar deliberately.',
        )
      }
    }
  }
}
ok(`${mountCount} kr-gallery mount(s) either bind :mode or opt out of the bar`)

/* ------------------------------------------------------------------ */

for (const note of notes) console.log(note)

if (failures.length) {
  console.error('\nGallery consistency contract FAILED:\n')
  for (const f of failures) console.error(`  ✗ ${f}\n`)
  process.exit(1)
}

console.log(
  '\nGallery consistency contract passed: grids size to their container, cards ' +
    'follow the gallery mode, and every mode bar is wired to something.',
)
