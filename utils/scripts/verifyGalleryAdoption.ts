// /utils/scripts/verifyGalleryAdoption.ts
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/*
 * Adoption counter for the shared gallery shell.
 *
 * WHY THIS EXISTS
 * The predecessor project `global-ui` closed 25/25 tasks "done" with its design
 * system at roughly 7% adoption, because nobody measured the whole. Extraction
 * has never been the hard part in this codebase -- the shared pieces exist, are
 * documented, and work. Adoption is the hard part, and an unmeasured number
 * does not move.
 *
 * Two of the three shared pieces are now counted somewhere:
 *   components/narrative/  -> verifyNarrativeKit.ts prints its adoption count
 *   .kr-surface/.kr-stage  -> verifyLayoutContract.ts's root-surface rule
 *
 * components/gallery/kr-gallery.vue was the one nothing counted, which is why
 * it sat at a single adopter while "all seven core objects share one gallery"
 * remained an open beta gate in DESIGN-BRIEF.md.
 *
 * Shape follows verifyNarrativeKit.ts deliberately: INFORMATIONAL on adoption
 * (print the count, name the holdouts, never fail on non-adoption -- that would
 * block every unrelated PR), and HARD only on the invariants that make the
 * shared shell worth adopting at all.
 */
const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const root = resolve(scriptDirectory, '../..')

let failures = 0

function check(condition: boolean, message: string): void {
  if (condition) {
    console.log(`ok - ${message}`)
    return
  }
  failures += 1
  console.error(`FAIL - ${message}`)
}

function read(relativePath: string): string {
  return readFileSync(resolve(root, relativePath), 'utf8')
}

const SKIP_DIRS = new Set([
  'node_modules',
  '.nuxt',
  '.git',
  'dist',
  '.output',
  'abandonware',
  'archives',
  'cypress',
  'sample',
])

function walk(directory: string, out: string[] = []): string[] {
  let entries: string[]
  try {
    entries = readdirSync(directory)
  } catch {
    return out
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue
    const full = join(directory, entry)
    let isDirectory: boolean
    try {
      isDirectory = statSync(full).isDirectory()
    } catch {
      continue
    }
    if (isDirectory) walk(full, out)
    else if (extname(entry) === '.vue') out.push(full)
  }
  return out
}

const rel = (path: string): string => relative(root, path).replace(/\\/g, '/')

/* Strip <script> and <style> so a mention in a comment, or the style-guide's
   <code> reference to the component name, never reads as adoption. */
function templateOf(source: string): string {
  return source
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
}

// --- invariants --------------------------------------------------------------
// kr-gallery is controlled and presentational: the parent owns fetching,
// filtering and mode persistence (stores/galleryPreferenceStore.ts). The moment
// it reaches for a store it stops being droppable into seven different object
// galleries, which is the entire reason it was extracted.
const GALLERY = 'components/gallery/kr-gallery.vue'
const gallery = read(GALLERY)

check(
  !/from '@\/stores\//.test(gallery),
  'kr-gallery imports no store (the parent owns fetching and filtering)',
)
check(
  /update:mode/.test(gallery),
  'kr-gallery emits its view mode rather than persisting it itself',
)

// --- adoption ----------------------------------------------------------------
const KR_GALLERY_USE = /kr-gallery|KrGallery/

const galleryFiles = walk(resolve(root, 'components')).filter(
  (file) => basename(file).endsWith('-gallery.vue') && rel(file) !== GALLERY,
)
const adopters = galleryFiles.filter((file) =>
  KR_GALLERY_USE.test(templateOf(readFileSync(file, 'utf8'))),
)
const holdouts = galleryFiles.filter((file) => !adopters.includes(file))

console.log(
  `\ninfo - kr-gallery adopted by ${adopters.length}/${galleryFiles.length} gallery component(s)`,
)
for (const file of holdouts) console.log(`       · ${basename(file)}`)

/*
 * The seven core objects are counted separately because they are the actual
 * beta gate. The rest (icons, servers, loras, themes, butterflies...) are not
 * promised to anyone and may legitimately never converge -- lumping them in
 * would make the gate look further away than it is.
 */
const CORE_OBJECT_GALLERIES = [
  'components/bots/bot-gallery.vue',
  'components/characters/character-gallery.vue',
  'components/dreams/dream-gallery.vue',
  'components/facets/facet-gallery.vue',
  'components/rewards/reward-gallery.vue',
  'components/scenarios/scenario-gallery.vue',
  // The reference implementation kr-gallery was extracted FROM, and the one
  // Silas singled out as the shape the rest should follow.
  'components/pages/conductor-project-gallery-page.vue',
]

for (const path of CORE_OBJECT_GALLERIES) {
  check(
    (() => {
      try {
        readFileSync(resolve(root, path))
        return true
      } catch {
        return false
      }
    })(),
    `core-object gallery ${basename(path)} exists (rename it here if it moves)`,
  )
}

const coreAdopted = CORE_OBJECT_GALLERIES.filter((path) => {
  try {
    return KR_GALLERY_USE.test(templateOf(read(path)))
  } catch {
    return false
  }
})

console.log(
  `\ninfo - core-object galleries on kr-gallery: ${coreAdopted.length}/${CORE_OBJECT_GALLERIES.length}` +
    ' — DESIGN-BRIEF beta gate: "all seven core objects share one gallery"',
)
for (const path of CORE_OBJECT_GALLERIES) {
  console.log(
    `       ${coreAdopted.includes(path) ? '✓' : '·'} ${basename(path)}`,
  )
}

if (failures) {
  console.error(`\nGallery adoption contract failed with ${failures} error(s).`)
  process.exitCode = 1
} else {
  console.log(
    '\nGallery adoption contract passed: the shared shell is intact.' +
      ' The counts above are informational — they exist so the number moves on' +
      ' purpose rather than by accident.',
  )
}
