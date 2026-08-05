// /utils/scripts/verifyPageBackdrop.ts
//
// The page-backdrop rails hold together.
//
// Silas, 2026-08-05, opening Stage 3: "I think a background image for each
// page, adjusted for mobile, tablet, or desktop layout, will help A LOT."
//
// Three things here can rot silently, and each has a specific failure mode
// worse than "the art does not show up":
//
//   1. A backdrop key declared in the content schema but missed in ONE of the
//      three pageStore sites. The page then typechecks, the frontmatter
//      validates, and the art simply never arrives — with nothing anywhere
//      saying why.
//   2. A new frontmatter key that collides case-insensitively with an existing
//      one. content.config.ts warns about this in prose only (lines ~78-82):
//      SQLite column names are case-insensitive, the collection's CREATE TABLE
//      fails, the content tables never get created, and EVERY PAGE 500s. That
//      is the worst outcome in this file and it is currently guarded by a
//      comment nobody is obliged to read.
//   3. A missing var() fallback in the breakpoint CSS. A page shipping only
//      `backgroundDesktop` then shows nothing on a phone instead of falling
//      back — invisible in review, and invisible on any desktop.
//
//   npx tsx utils/scripts/verifyPageBackdrop.ts
//   npx tsx utils/scripts/verifyPageBackdrop.ts --self-test
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = process.cwd()
const read = (rel: string) => readFileSync(resolve(root, rel), 'utf8')

/** Every file with `ext` under `dir`, recursively. */
function walkContent(dir: string, out: string[] = [], ext = '.md'): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walkContent(full, out, ext)
    else if (entry.endsWith(ext)) out.push(full)
  }
  return out
}

const VARIANTS = ['backgroundMobile', 'backgroundTablet', 'backgroundDesktop'] as const

const failures: string[] = []
const check = (ok: boolean, message: string) => {
  if (!ok) failures.push(message)
}

/* -- 1. the key exists in all four places ---------------------------------- */

/**
 * Where each variant has to appear. Absence is not the realistic bug — partial
 * presence is, because three of the four are in one file and easy to update
 * together while forgetting the fourth.
 */
const SITES: Array<{ file: string; label: string; pattern: (key: string) => RegExp }> = [
  {
    file: 'content.config.ts',
    label: 'the content frontmatter schema',
    pattern: (key) => new RegExp(`${key}:\\s*z\\.string\\(\\)\\.optional\\(\\)`),
  },
  {
    file: 'stores/pageStore.ts',
    label: "the WorkspacePage type",
    pattern: (key) => new RegExp(`${key}\\?:\\s*string`),
  },
  {
    file: 'stores/pageStore.ts',
    label: "the meta computed",
    pattern: (key) => new RegExp(`${key}:\\s*pageImagePath\\(`),
  },
  {
    file: 'stores/pageStore.ts',
    label: 'the flat re-exports',
    pattern: (key) => new RegExp(`${key}:\\s*computed\\(\\(\\)\\s*=>\\s*meta\\.value\\.${key}\\)`),
  },
]

for (const variant of VARIANTS) {
  for (const site of SITES) {
    check(
      site.pattern(variant).test(read(site.file)),
      `${variant} is missing from ${site.label} (${site.file})`,
    )
  }
}

/* -- 2. no case-insensitive key collision ---------------------------------- */

/**
 * Every key declared in content.config.ts, lowercased. A duplicate here is the
 * 500s-every-page bug the file warns about in prose.
 */
export function collidingSchemaKeys(source: string): string[] {
  const seen = new Map<string, string>()
  const collisions: string[] = []

  for (const match of source.matchAll(/^\s{2}([A-Za-z][A-Za-z0-9]*)\s*:\s*z\./gm)) {
    const key = match[1] as string
    const lower = key.toLowerCase()
    const previous = seen.get(lower)

    // Same spelling twice is a different (and harmless-to-SQLite) problem —
    // these schemas legitimately repeat a key name across sibling objects.
    if (previous && previous !== key) collisions.push(`${previous} vs ${key}`)
    else if (!previous) seen.set(lower, key)
  }

  return collisions
}

check(
  collidingSchemaKeys(read('content.config.ts')).length === 0,
  `content.config.ts has case-insensitive key collisions, which makes the content ` +
    `collection's CREATE TABLE fail and 500s every page: ` +
    collidingSchemaKeys(read('content.config.ts')).join(', '),
)

/* -- 3. the CSS fallback chain ---------------------------------------------- */

const css = read('assets/css/tailwind.css')

// Each breakpoint prefers its own variant, then degrades through the other two.
const CHAINS: Array<[string, string[]]> = [
  ['mobile (base)', ['--kr-bg-mobile', '--kr-bg-tablet', '--kr-bg-desktop']],
  ['tablet (768px)', ['--kr-bg-tablet', '--kr-bg-desktop', '--kr-bg-mobile']],
  ['desktop (1024px)', ['--kr-bg-desktop', '--kr-bg-tablet', '--kr-bg-mobile']],
]

for (const [label, order] of CHAINS) {
  const chain = new RegExp(
    `var\\(\\s*${order[0]},\\s*var\\(${order[1]},\\s*var\\(${order[2]},\\s*none\\)\\)\\s*\\)`.replace(
      /\s+/g,
      '\\s*',
    ),
  )
  check(
    chain.test(css),
    `the ${label} backdrop rule does not fall back through ${order.join(' → ')} → none. ` +
      `Without it a page declaring only one variant renders nothing at the other sizes.`,
  )
}

/* -- 4. surface tokens exist and default to the theme ----------------------- */

const TOKENS = ['--kr-surface', '--kr-surface-raised', '--kr-surface-sunken', '--kr-surface-border']

for (const token of TOKENS) {
  check(
    new RegExp(`${token}:\\s*var\\(--color-base-`).test(css),
    `${token} must DEFAULT to a --color-base-* value, so a page with no backdrop ` +
      `renders exactly as it did before and every daisyUI theme keeps working.`,
  )
  check(
    new RegExp(`${token}:\\s*color-mix\\(`).test(css),
    `${token} has no translucent override under [data-kr-backdrop] — panels would ` +
      `stay opaque and cover the art.`,
  )
}

/* -- 5. the kit reads the tokens -------------------------------------------- */

// Structural surfaces only. Skeletons, progress tracks, avatar rings and the
// floating karma/action chips stay opaque on purpose — they are not panels
// sitting over artwork.
const KIT = [
  'components/gallery/kr-gallery.vue',
  'components/gallery/kr-entity-card-body.vue',
  'components/narrative/kr-chat-window.vue',
  'components/narrative/kr-choice-list.vue',
  'components/wonderlab/reactable-card.vue',
]

for (const file of KIT) {
  check(
    /bg-\(--kr-surface/.test(read(file)),
    `${file} has no bg-(--kr-surface*) — its panels will cover page backdrop art.`,
  )
}

/* -- 6. the backdrop is mounted, and mounted correctly ----------------------- */

const app = read('app.vue')
check(/<kr-page-backdrop/.test(app), 'kr-page-backdrop is not mounted in app.vue')
check(
  app.indexOf('<kr-page-backdrop') < app.indexOf('<fx-region region="page"'),
  'kr-page-backdrop must precede <fx-region region="page"> — both sit at z-0, so ' +
    'DOM order is what puts the effects layer above the art.',
)
check(
  /data-kr-backdrop=/.test(app),
  'app.vue does not set data-kr-backdrop, so the surface tokens never flip and ' +
    'panels stay opaque over the art.',
)

/**
 * Source with comments removed.
 *
 * The JS-breakpoint check below must read CODE, not prose. Its first run failed
 * on kr-page-backdrop's own comment explaining why `window.innerWidth` is the
 * wrong approach — a check that cannot tell a warning against a thing from the
 * thing itself would punish documenting the decision.
 */
function withoutComments(source: string): string {
  return source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
}

const backdrop = withoutComments(read('components/ui/kr-page-backdrop.vue'))
check(
  !/innerWidth|matchMedia|useMediaQuery|useBreakpoint/.test(backdrop),
  'kr-page-backdrop must not choose its variant in JS — that renders one variant on ' +
    'the server and swaps on the client (hydration mismatch + flash). The choice ' +
    'belongs in the .kr-backdrop media queries.',
)

/* -- 7. queued art and declaring frontmatter agree -------------------------- */

/*
 * Every queued backdrop prompt must be claimed by a page, and every page's
 * declared backdrop must be queued.
 *
 * The two live in different files edited for different reasons, and a mismatch
 * is silent in both directions: a prompt with no page burns a priority-100
 * queue slot producing art nothing renders, and a page with no prompt waits for
 * art no one asked for.
 *
 * The join is the SLUG now, not a file path. Frontmatter declares
 * `/api/art/backdrop/<page>-<variant>`, and that route derives
 * `page-backdrop-<page>-<variant>` to find the completed job — the same
 * requestId the seeder writes. Checking the slugs match is therefore checking
 * the route can actually resolve, which is the thing that matters.
 */
const BACKDROP_ROUTE = /^\/api\/art\/backdrop\/([a-z0-9-]+)-(mobile|tablet|desktop)$/

const declaredSlugs = new Set<string>()
for (const file of walkContent(resolve(root, 'content'))) {
  for (const match of readFileSync(file, 'utf8').matchAll(
    /^background(?:Mobile|Tablet|Desktop):\s*(\S+)\s*$/gm,
  )) {
    const value = match[1] as string
    const route = BACKDROP_ROUTE.exec(value)
    check(
      Boolean(route),
      `${file.split('/').slice(-2).join('/')} declares "${value}", which is not a ` +
        `backdrop route. Use /api/art/backdrop/<page>-<variant> so the art ` +
        `resolves by slug once its job completes.`,
    )
    if (route) declaredSlugs.add(`${route[1]}-${route[2]}`)
  }
}

const seed = read('stores/seeds/pageBackdropArtPrompts.ts')
const queuedPages = [...seed.matchAll(/^\s*page:\s*'([a-z0-9-]+)',$/gm)].map(
  (m) => m[1] as string,
)
const queuedSlugs = new Set(
  queuedPages.flatMap((page) =>
    ['mobile', 'tablet', 'desktop'].map((variant) => `${page}-${variant}`),
  ),
)

for (const slug of queuedSlugs) {
  check(
    declaredSlugs.has(slug),
    `${slug} is queued for generation but no page declares ` +
      `/api/art/backdrop/${slug} — the art would render nowhere.`,
  )
}

for (const slug of declaredSlugs) {
  check(
    queuedSlugs.has(slug),
    `/api/art/backdrop/${slug} is declared in frontmatter but nothing queues it ` +
      `— the route will 404 forever. Add its page to ` +
      `stores/seeds/pageBackdropArtPrompts.ts, or drop the frontmatter key.`,
  )
}

/*
 * The resolver route must exist and derive the requestId the seeder writes.
 * If those two ever disagree the route 404s on art that generated perfectly.
 */
const resolver = read('server/api/art/backdrop/[slug].get.ts')
check(
  /page-backdrop-\$\{slug\}/.test(resolver),
  'The backdrop resolver no longer derives `page-backdrop-<slug>`, so it cannot ' +
    'match the requestId enqueuePageBackdropArt writes.',
)
check(
  /status:\s*'DONE'/.test(resolver) && /artImageId:\s*\{\s*not:\s*null\s*\}/.test(resolver),
  'The backdrop resolver must require status DONE and a non-null artImageId, or ' +
    'it can redirect to a job that has no image yet.',
)

/* -- 8. one art mechanism, not several -------------------------------------- */

/*
 * A page-specific backdrop component must not load its own art.
 *
 * This is the failure that actually happened on 2026-08-05, and it happened
 * without anyone making a mistake: two agents solved "pages need backgrounds" in
 * parallel — one generically (kr-page-backdrop + frontmatter keys), one
 * bespoke (taskmaster-backdrop rendering the page thumbnail stretched to fill).
 * Both shipped. Taskmaster ended up with two backdrops stacked, and it was
 * invisible only because the generic layer's art had not been uploaded yet.
 *
 * Silas settled it: "lets go generic, because doing it right wins every time."
 * Bespoke scenes stay as DECORATION over the shared art layer — they just do
 * not source their own image. This check makes the next fork fail loudly at the
 * moment it is introduced, rather than surfacing as a doubled background weeks
 * later when someone finally uploads a file.
 */
for (const file of walkContent(resolve(root, 'components'), [], '.vue')) {
  const name = file.split('/').pop() ?? ''
  if (!/-backdrop\.vue$/.test(name)) continue
  if (name === 'kr-page-backdrop.vue') continue // the one that IS the mechanism

  const source = withoutComments(readFileSync(file, 'utf8'))
  check(
    !/<img\b/.test(source) && !/background-image\s*:/.test(source),
    `${name} loads its own art (an <img> or background-image). Page backdrops ` +
      `come from kr-page-backdrop via the background* frontmatter keys — a ` +
      `second art source stacks two backdrops on the same page. Keep the ` +
      `bespoke scene as decoration and drop the image.`,
  )
}

/* --------------------------------------------------------------------------- */

function selfTest(): void {
  const collisions = collidingSchemaKeys(`
  amiTip: z.string().optional(),
  amitip: z.string().optional(),
  title: z.string().optional(),
`)
  if (!collisions.length) {
    throw new Error('a case-insensitive collision must be detected')
  }

  // The same key repeated across sibling schema objects is normal and must not
  // register — content.config.ts declares `image` in three separate objects.
  if (
    collidingSchemaKeys(`
  image: z.string().optional(),
  image: z.string().optional(),
`).length
  ) {
    throw new Error('an identically-spelled repeat is not a SQLite collision')
  }

  console.log('✅ verifyPageBackdrop self-test passed.')
}

if (process.argv.includes('--self-test')) {
  selfTest()
} else {
  selfTest()

  if (failures.length) {
    console.error(`\n❌ Page backdrop contract failed with ${failures.length} problem(s):\n`)
    for (const failure of failures) console.error(`  - ${failure}`)
    console.error('')
    process.exitCode = 1
  } else {
    console.log(
      `Page backdrop contract passed: ${VARIANTS.length} variants wired through ` +
        `${SITES.length} sites, fallback chains intact, ${KIT.length} kit components on tokens.`,
    )
  }
}
