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
import { stripComments } from './lib/sourceText'

const failures: string[] = []
const notes: string[] = []

/*
 * WHY EVERY SCAN BELOW STRIPS COMMENTS FIRST.
 *
 * interface-vision t-068: "a doc comment can fail 29 source-text contracts".
 * This contract proved it on its own first run — scenario-card.vue was flagged
 * for hardcoding `variant="card"` when the only occurrence left was inside the
 * doc comment explaining that it USED to. A contract that punishes you for
 * documenting the thing it asked you to fix trains people to delete comments.
 *
 * The stripper itself lives in ./lib/sourceText, shared with every other
 * forbid-scanning verifier and covered by verifySourceTextComments.test.ts.
 */
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
// EVERY grid map in the vocabulary, not just the first one. DENSITY_GRID_CLASS
// was added for art-gallery's xs/sm/md/lg picker and its whole justification is
// that it replaces a hand-rolled VIEWPORT-keyed switch
// (`grid-cols-2 md:grid-cols-3 xl:grid-cols-4`) with container-responsive
// grids. A rule that only knew about MODE_GRID_CLASS would have let the new map
// reintroduce the exact defect this check exists to catch -- confirmed by
// mutation: swapping one DENSITY_GRID_CLASS entry back to breakpoints passed
// every contract in CI before this loop was generalised.
const GRID_MAPS = ['MODE_GRID_CLASS', 'DENSITY_GRID_CLASS']

for (const mapName of GRID_MAPS) {
  const gridBlock = vocabSrc.match(
    new RegExp(`export const ${mapName}[\\s\\S]*?\\n\\}`),
  )?.[0]

  if (!gridBlock) {
    fail(
      `utils/galleryVocabulary.ts: ${mapName} not found. If it moved, update this contract.`,
    )
    continue
  }

  /*
   * Test the CLASS STRING, not the whole line.
   *
   * DENSITY_GRID_CLASS is keyed `xs/sm/md/lg` -- the density names collide
   * exactly with Tailwind's breakpoint names, so `sm: '...'` as an object KEY
   * matches /\b(sm|md|lg|xl|2xl):/ and every correct entry reported itself as
   * an offender. MODE_GRID_CLASS never exposed this because its keys are
   * cards/heroes/icons. Found by running the full CI sweep after the rule was
   * generalised, which is also why the earlier mutation run on this rule
   * proved nothing: the check was already red on unmutated source.
   */
  const classStringOf = (line: string): string =>
    [...line.matchAll(/'([^']*)'|"([^"]*)"/g)]
      .map((match) => match[1] ?? match[2] ?? '')
      .join(' ')

  const offenders = gridBlock
    .split('\n')
    .filter((line) => VIEWPORT_PREFIX.test(classStringOf(line)))
    .map((line) => line.trim())

  if (offenders.length) {
    fail(
      `${mapName} uses VIEWPORT breakpoints. Galleries mount inside panels, ` +
        'so sm:/lg:/xl: sizes columns by the screen while the container is narrow ' +
        '-- this is the "small card" defect (4 columns of 71px in a 320px panel). ' +
        'Use repeat(auto-fill, minmax(min(<rem>,100%),1fr)) instead:\n' +
        offenders.map((o) => `           ${o}`).join('\n'),
    )
  } else if (!gridBlock.includes('auto-fill')) {
    fail(
      `${mapName} no longer uses auto-fill. Container-responsive sizing is ` +
        'the contract; a fixed column count cannot adapt to the panel it is in.',
    )
  } else {
    ok(
      `${mapName} is container-responsive (auto-fill, no viewport breakpoints)`,
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
      `${file}: hardcodes ${hardcoded?.[0] ?? 'a literal variant'} on kr-entity-card-body, so a gallery ` +
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

/* ------------------------------------------------------------------ *
 * 4. The four shapes must stay mapped, and derived rather than hand-passed.
 * ------------------------------------------------------------------ */
//
// Silas, 2026-08-04, spelling out a spec that had never been written down --
// which is exactly why card and icon kept coming out wrong:
//
//   "we have four images: image path (square), image hero: horizontal, card:
//    vertical, icon: simple text based layout with square image as intro piece"
//   "Why do we keep getting confused about this?"
//
// Because `variant` (which image) and `shape` (which box) were independent
// props with nothing tying them together, and kr-entity-card-body defaulted
// shape to `wide` -- 4:3 HORIZONTAL -- for every variant. Cards loaded the
// vertical art and letterboxed it; icon had no case in the aspect map at all.
const EXPECTED_VARIANT_SHAPE: Record<string, string> = {
  card: 'card',
  hero: 'hero',
  icon: 'square',
}

const variantShapeBlock = vocabSrc.match(
  /export const VARIANT_SHAPE[\s\S]*?\n\}/,
)?.[0]

if (!variantShapeBlock) {
  fail(
    'utils/galleryVocabulary.ts: VARIANT_SHAPE not found. It is the single ' +
      'answer to "which box does this variant draw in" -- without it, callers ' +
      'hand-pass `shape` beside `variant` and the two drift.',
  )
} else {
  for (const [variant, shape] of Object.entries(EXPECTED_VARIANT_SHAPE)) {
    if (!new RegExp(`${variant}:\\s*'${shape}'`).test(variantShapeBlock)) {
      fail(
        `VARIANT_SHAPE must map ${variant} -> '${shape}'. The four shapes are ` +
          'fixed: imagePath square, hero horizontal, card vertical, icon square.',
      )
    }
  }
  if (!failures.length)
    ok('VARIANT_SHAPE maps all three variants to their shape')
}

const cardBody = stripComments(
  await readFile('components/gallery/kr-entity-card-body.vue', 'utf8'),
)
if (/shape:\s*'(card|hero|square|wide|plate)'/.test(cardBody)) {
  fail(
    'kr-entity-card-body defaults `shape` to a literal. That is the original ' +
      'bug: a fixed default (it was `wide`, 4:3 horizontal) overrides every ' +
      "variant's real shape. Derive it from VARIANT_SHAPE instead.",
  )
} else if (!cardBody.includes('VARIANT_SHAPE')) {
  fail(
    'kr-entity-card-body no longer derives its shape from VARIANT_SHAPE, so ' +
      'variant and shape can disagree again.',
  )
} else {
  ok('kr-entity-card-body derives its shape from the variant')
}

/* ------------------------------------------------------------------ *
 * 5. One mode bar, in one place.
 * ------------------------------------------------------------------ */
//
// Silas, 2026-08-04: "stories and dreams have different layouts, why? ... I
// wouldn't be clicking the layout options on one side of the screen for one and
// the other for, well, you know you can extrapolate."
//
// dream-gallery hand-rolled its own Cards/Heroes/Icons bar in its toolbar while
// the other six used kr-gallery's, so the same control lived in two places. A
// shared shell whose control the caller re-implements is not shared.
for await (const file of walk('components')) {
  if (file.includes('kr-gallery.vue')) continue
  const src = stripComments(await readFile(file, 'utf8'))
  if (!/v-for="mode in/.test(src)) continue
  if (!/GALLERY_MODES|modeOptions/.test(src)) continue

  fail(
    `${file}: hand-rolls a gallery mode bar (v-for over GALLERY_MODES). The ` +
      'shell renders one already -- two bars for the same state is how the ' +
      'control ended up on a different side of the screen per gallery.',
  )
}
ok('no gallery hand-rolls its own mode bar')

/* ------------------------------------------------------------------ *
 * 6. Every core object carries all four art variants.
 * ------------------------------------------------------------------ */
//
// Silas, 2026-08-04: "please make sure that all our major objects have the
// needs image variables: card icon hero and path."
//
// The gallery vocabulary is only as real as the schema behind it: a mode whose
// column does not exist silently falls back through resolveArtVariantSrc and
// renders the same art as another mode, which is indistinguishable from the
// bug where the shape was wrong. Dream was missing iconPath (t-077) and Project
// was missing it too and had never been filed -- found by auditing all four
// fields across every core model instead of acting on the one known report.
const SCHEMA = await readFile('prisma/schema.prisma', 'utf8')
const ART_FIELDS = ['imagePath', 'cardPath', 'heroPath', 'iconPath']
const CORE_MODELS = [
  'Bot',
  'Character',
  'Dream',
  'Reward',
  'Scenario',
  'Facet',
  'Project',
]

for (const model of CORE_MODELS) {
  const body = SCHEMA.match(
    new RegExp(`^model ${model} \\{([\\s\\S]*?)^\\}`, 'm'),
  )?.[1]

  if (!body) {
    fail(
      `prisma/schema.prisma: model ${model} not found. If it was renamed, update this contract.`,
    )
    continue
  }

  const missing = ART_FIELDS.filter(
    (field) => !new RegExp(`^\\s*${field}\\s+`, 'm').test(body),
  )

  if (missing.length) {
    fail(
      `${model} is missing ${missing.join(', ')}. All four art variants are ` +
        'required on a core object: imagePath (square), cardPath (vertical), ' +
        'heroPath (horizontal), iconPath (square). A gallery mode whose column ' +
        "does not exist renders another mode's art and looks like a layout bug.",
    )
  }
}
ok(`${CORE_MODELS.length} core objects carry all four art variants`)

/* ------------------------------------------------------------------ *
 * 7. kr-gallery's built-in renderer must implement the same vocabulary.
 * ------------------------------------------------------------------ */
const sharedGallery = stripComments(
  await readFile('components/gallery/kr-gallery.vue', 'utf8'),
)
const projectGallery = stripComments(
  await readFile('components/pages/conductor-project-gallery-page.vue', 'utf8'),
)

if (!sharedGallery.includes(`v-if="mode === 'icons'"`)) {
  fail(
    'kr-gallery has no dedicated Icons branch. Icons are a text-forward row, not a centered mini-card.',
  )
}
if (!sharedGallery.includes('size-16 shrink-0')) {
  fail(
    'kr-gallery Icons mode no longer reserves a small fixed square intro image before the text.',
  )
}
if (
  !sharedGallery.includes(
    `:class="mode === 'cards' ? 'aspect-2/3' : 'aspect-video'"`,
  )
) {
  fail(
    'kr-gallery built-in Cards/Heroes geometry drifted. Cards must be 2:3 portrait and Heroes 16:9.',
  )
}
if (/<h2[^>]*\btruncate\b/.test(sharedGallery)) {
  fail(
    'kr-gallery truncates a built-in item title. Gallery titles must wrap so the shared renderer does not silently discard names.',
  )
}
if (/<template\s+#item(?:=|\s|>)/.test(projectGallery)) {
  fail(
    'conductor-project-gallery-page.vue reintroduced a bespoke item renderer. Projects fit GalleryItem and must exercise the shared renderer so gallery geometry cannot drift separately again.',
  )
}
if (!failures.length) {
  ok('kr-gallery built-in Cards/Heroes/Icons renderer follows the shared vocabulary')
}

/* ------------------------------------------------------------------ */

for (const note of notes) console.log(note)

if (failures.length) {
  console.error('\nGallery consistency contract FAILED:\n')
  for (const f of failures) console.error(`  ✗ ${f}\n`)
  process.exit(1)
}

console.log(
  '\nGallery consistency contract passed: grids size to their container, cards ' +
    'follow the gallery mode, built-in rendering matches the shared vocabulary, ' +
    'and every mode bar is wired to something.',
)
