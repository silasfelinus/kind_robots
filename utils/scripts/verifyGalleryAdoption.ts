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

// --- reachability ------------------------------------------------------------
/*
 * WHICH COMPONENTS A USER CAN ACTUALLY REACH.
 *
 * This exists because the first version of this file counted *-gallery.vue files
 * that mention kr-gallery and nothing else. It reported 2/7 core-object
 * galleries adopted -- and one of those two, facet-gallery.vue, is mounted
 * NOWHERE. /facets mounts facet-manager.vue. So an entire adoption PR landed
 * against dead code and the counter said it worked.
 *
 * That is precisely the failure this project exists to prevent, reproduced by
 * the instrument meant to prevent it, so a filename is no longer good enough
 * evidence: a gallery counts only if a content route actually renders it.
 *
 * The chain is real and worth stating, because it is the house pattern:
 *   content/<model>.md  ->  :<model>-manager   (tab router, the primary mount)
 *                       ->  <model>-interact   (the working surface)
 *                       ->  <model>-gallery    (inset picker, variant=dashboard)
 * A gallery is therefore typically THREE hops from its route, which is exactly
 * why a filename-level check could not see it.
 */
const componentsByName = new Map<string, string>()
for (const file of walk(resolve(root, 'components'))) {
  const name = basename(file, '.vue')
  if (!componentsByName.has(name)) componentsByName.set(name, file)
}

function kebab(tag: string): string {
  const name = /^[a-z]/.test(tag)
    ? tag
    : tag.replace(/(?<!^)(?=[A-Z])/g, '-').toLowerCase()
  // Nuxt's Lazy* prefix resolves to the same component.
  return name.replace(/^lazy-/, '')
}

const childCache = new Map<string, string[]>()
function childComponents(name: string): string[] {
  const cached = childCache.get(name)
  if (cached) return cached

  const file = componentsByName.get(name)
  if (!file) return []

  const template = templateOf(readFileSync(file, 'utf8')).replace(
    /<!--[\s\S]*?-->/g,
    '',
  )
  const found = new Set<string>()
  for (const [, tag] of template.matchAll(/<([A-Za-z][\w-]*)/g)) {
    const key = kebab(tag ?? '')
    if (key !== name && componentsByName.has(key)) found.add(key)
  }

  const result = [...found].sort()
  childCache.set(name, result)
  return result
}

/* Primary mounts, from the MDC body of every content page (not the channel
   manifest rows, which carry no mounts). Same block shape verifyChannelContent
   and verifyLayoutContract already parse. */
function primaryMounts(): { route: string; mount: string }[] {
  const out: { route: string; mount: string }[] = []
  const contentRoot = resolve(root, 'content')
  const walkMd = (dir: string): string[] => {
    const found: string[] = []
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        if (basename(full) !== 'channels') found.push(...walkMd(full))
      } else if (entry.endsWith('.md')) found.push(full)
    }
    return found
  }

  for (const file of walkMd(contentRoot)) {
    const body = readFileSync(file, 'utf8').replace(/^---[\s\S]*?\n---\n/, '')
    const route =
      '/' +
      relative(contentRoot, file).replace(/\\/g, '/').replace(/\.md$/, '')
    for (const line of body.split('\n')) {
      const trimmed = line.trim()
      if (/^:{1,2}[a-z][a-z0-9-]*$/.test(trimmed)) {
        out.push({ route, mount: trimmed.replace(/^:{1,2}/, '') })
      }
    }
  }
  return out
}

/** Every component transitively rendered from a content route, name -> a route. */
function reachableComponents(): Map<string, string> {
  const reached = new Map<string, string>()
  for (const { route, mount } of primaryMounts()) {
    const stack = [mount]
    const seen = new Set<string>()
    while (stack.length) {
      const current = stack.pop()
      if (!current || seen.has(current)) continue
      seen.add(current)
      if (!reached.has(current)) reached.set(current, route)
      for (const child of childComponents(current)) {
        if (!seen.has(child)) stack.push(child)
      }
    }
  }
  return reached
}

const reachable = reachableComponents()

// --- adoption ----------------------------------------------------------------
const KR_GALLERY_USE = /kr-gallery|KrGallery/

const galleryFiles = walk(resolve(root, 'components')).filter(
  (file) => basename(file).endsWith('-gallery.vue') && rel(file) !== GALLERY,
)
const adopters = galleryFiles.filter((file) =>
  KR_GALLERY_USE.test(templateOf(readFileSync(file, 'utf8'))),
)
const holdouts = galleryFiles.filter((file) => !adopters.includes(file))
const orphans = galleryFiles.filter(
  (file) => !reachable.has(basename(file, '.vue')),
)

console.log(
  `\ninfo - kr-gallery adopted by ${adopters.length}/${galleryFiles.length} gallery component(s)`,
)
for (const file of holdouts) console.log(`       · ${basename(file)}`)

if (orphans.length) {
  console.log(
    `\ninfo - ${orphans.length} gallery component(s) NO CONTENT ROUTE RENDERS.` +
      ' Adopting kr-gallery in one of these changes nothing a user can see:',
  )
  for (const file of orphans) console.log(`       ✗ ${rel(file)}`)
}

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

/*
 * LIVE means adopted AND reachable. Both halves are load-bearing: the first
 * version of this counter checked only the first half and scored a PR against
 * an orphan as progress.
 */
const coreAdopted = CORE_OBJECT_GALLERIES.filter((path) => {
  try {
    return (
      KR_GALLERY_USE.test(templateOf(read(path))) &&
      reachable.has(basename(path, '.vue'))
    )
  } catch {
    return false
  }
})

console.log(
  `\ninfo - core-object galleries on kr-gallery: ${coreAdopted.length}/${CORE_OBJECT_GALLERIES.length}` +
    ' — DESIGN-BRIEF beta gate: "all seven core objects share one gallery"',
)
for (const path of CORE_OBJECT_GALLERIES) {
  const name = basename(path, '.vue')
  const route = reachable.get(name)
  const mark = coreAdopted.includes(path) ? '✓' : '·'
  console.log(
    `       ${mark} ${basename(path).padEnd(36)} ${
      route ? `reached from ${route}` : 'UNREACHABLE — no content route renders it'
    }`,
  )
}

/*
 * The house pattern, counted. content/<model>.md mounts :<model>-manager, which
 * routes to <model>-interact, which insets <model>-gallery as its picker. A
 * model that skips a tier is the one that feels wrong to use -- Facets has
 * neither an interact nor a gallery and scored 3/10 on review while Dreams,
 * which has both, scored 7.5.
 */
const MODELS = ['bot', 'character', 'dream', 'facet', 'reward', 'scenario']
console.log('\ninfo - manager → interact → gallery, per model:')
for (const model of MODELS) {
  const tiers = [`${model}-manager`, `${model}-interact`, `${model}-gallery`]
  const present = tiers.map((tier) =>
    componentsByName.has(tier) ? (reachable.has(tier) ? '✓' : '~') : '✗',
  )
  console.log(
    `       ${model.padEnd(10)} manager ${present[0]}  interact ${present[1]}  gallery ${present[2]}`,
  )
}
console.log('       ✓ = reachable · ~ = exists but unreachable · ✗ = does not exist')

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
