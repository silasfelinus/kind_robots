// /utils/scripts/verifyNarrativeKit.ts
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// Contract for the shared conversation kit (interface-vision, 2026-08-02).
//
// Silas: "a lot of these are just going to be variations of each other, so the
// more we can work on modular pieces for things like chat windows, multiple
// choice returns, and image presentations, the better."
//
// The kit already failed once by being ignored. components/narrative/ has
// existed for a while and was adopted by exactly TWO of seven conversational
// surfaces; meanwhile workspace-narrator.vue grew its own 1,477-line copy of
// the same three ideas. Shared components do not stay shared on their own.
//
// So this pins the properties that make the kit worth adopting, and — as
// surfaces migrate — the fact that they stay migrated. It is a source-text
// contract, so it needs no DOM and no database and can gate every PR.
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

const CHAT = 'components/narrative/kr-chat-window.vue'
const CHOICE = 'components/narrative/kr-choice-list.vue'
const PLATE = 'components/narrative/kr-art-plate.vue'

const chat = read(CHAT)
const choice = read(CHOICE)
const plate = read(PLATE)

// --- one scroll owner --------------------------------------------------------
// The layout contract counts components declaring more than one scroll region.
// The chat window exists partly to REMOVE those, so it must not add one: every
// surface that adopts it should shed scroll regions, never gain them.
const scrollRegions = (
  chat.match(/kr-scroll|overflow-y-auto|overflow-auto/g) ?? []
).length
check(
  scrollRegions === 1,
  `the chat window declares exactly one scroll region (found ${scrollRegions})`,
)
check(
  /ref="scrollEl"/.test(chat) && /scrollHeight/.test(chat),
  'the chat window follows the conversation as it grows',
)
check(
  /autoScroll/.test(chat),
  'auto-scroll is opt-out, so a reader reviewing an earlier scene can stay put',
)
// Trailing conversation-level content (Taskmaster's ledger, Dreams' musings)
// must be able to sit INSIDE the scroll region. Without this slot a caller has
// to put it in a sibling element, which means a second scroll region — the one
// thing this component exists to remove.
check(
  /<slot name="footer" \/>/.test(chat),
  'the chat window offers a footer slot inside its scroll region',
)

// --- no store coupling -------------------------------------------------------
// The kit is presentational. The moment one of these imports a store it stops
// being droppable into a bot chat, a dock and a scenario editor alike, which is
// the entire reason for extracting them.
for (const [path, source] of [
  [CHAT, chat],
  [CHOICE, choice],
  [PLATE, plate],
] as const) {
  check(
    !/from '@\/stores\//.test(source) &&
      !/useNarratorStore|storeToRefs/.test(source),
    `${path.split('/').pop()} imports no store (stays droppable anywhere)`,
  )
}

// --- the art plate must not re-roll the fallback chain -----------------------
// cardPath/heroPath/iconPath shipped in t-007 and stayed invisible for a day
// because every surface had its own idea of which field to read. One resolver.
check(
  /resolveArtVariantSrc/.test(plate),
  'the art plate resolves through resolveArtVariantSrc rather than its own chain',
)
check(
  !/\.cardPath|\.heroPath|\.iconPath/.test(plate),
  "the art plate reads no variant field directly (that is the resolver's job)",
)

// --- theme-agnostic ----------------------------------------------------------
// All three must inherit whatever reading mode their subtree declares. A
// hardcoded colour would survive a theme switch and break Classic mode, which
// exists precisely to defer to the reader's own theme.
const HEX = /#[0-9a-fA-F]{6}\b/
for (const [path, source] of [
  [CHAT, chat],
  [CHOICE, choice],
  [PLATE, plate],
] as const) {
  // The plate's ink-tinted drop shadow is an rgba() on purpose; only flat hex
  // palette values are the problem.
  check(
    !HEX.test(source.replace(/rgba\([^)]*\)/g, '')),
    `${path.split('/').pop()} hardcodes no palette hex (inherits the active theme)`,
  )
}

// --- no second transcript ----------------------------------------------------
// narrative-transcript.vue was kr-chat-window with different markup. Phase 3
// deleted it and moved both products across. A file reappearing under that name
// is the kit splitting in two again, which is exactly how it failed last time.
check(
  !readdirSync(resolve(root, 'components/narrative')).includes(
    'narrative-transcript.vue',
  ),
  'the duplicate transcript has not come back',
)

// The THIRD copy was workspace-narrator's own seededMessages/followups loop,
// grown independently while a shared component sat unused two directories away.
// Pin its absence rather than trusting that nobody re-adds it.
const dock = read('components/navigation/workspace-narrator.vue')
check(
  !/v-for="message in seededMessages"/.test(dock) &&
    !/v-for="starter in (message\.followups|selectedTopicStarters)"/.test(dock),
  'the narrator dock has not re-grown its own transcript or follow-up loop',
)
check(
  (dock.match(/overflow-y-auto|overflow-auto/g) ?? []).length <= 1,
  'the narrator dock keeps at most one scroll region of its own',
)

// --- adoption ratchet --------------------------------------------------------
// Purely informational today, and deliberately so: failing on non-adoption
// before the surfaces have migrated would just block every unrelated PR. The
// count is printed so the next phase can see the needle move, and so a
// REGRESSION (a surface dropping back to a hand-rolled loop) is visible in CI
// output rather than silent.
const SURFACES = [
  'components/conductor/storybook-page.vue',
  'components/pages/taskmaster-page.vue',
  'components/bots/bot-interact.vue',
  'components/rewards/reward-interact.vue',
  'components/characters/character-interact.vue',
  'components/scenarios/scenario-interact.vue',
  'components/dreams/dream-interact.vue',
]
const existing = SURFACES.filter((path) => {
  try {
    readFileSync(resolve(root, path))
    return true
  } catch {
    return false
  }
})
/*
 * THE CONVERSATION PIECES, and deliberately not kr-art-plate.
 *
 * This used to include the art plate, which was harmless while adoption was
 * checked one hop deep off a hand-kept list. Under a transitive walk it makes
 * the number a lie: kr-art-plate is rendered by nearly every card in the app,
 * so ANY surface that shows a card reaches it, and the count can never fall.
 * A metric that cannot go down is worse than no metric -- it reports success
 * for work nobody did.
 *
 * Caught by mutation: stripping kr-chat-window and kr-choice-list out of
 * reward-workspace entirely left the count at a cheerful 7/7.
 *
 * The heading says "conversation kit", so this counts the conversation: the
 * transcript, the choices, and the composer that takes a custom reply. The art
 * plate's own invariants are asserted directly above by file, which is where
 * they belong.
 */
const KIT_PIECES = [
  'kr-chat-window',
  'kr-choice-list',
  'narrative-response-composer',
]

/**
 * Does this source MOUNT a conversation piece?
 *
 * ELEMENT-LEVEL, IN THE TEMPLATE. This was a substring test over the whole
 * file, which counted
 *
 *   import type { NarrativeTurn } from '@/components/narrative/kr-chat-window.vue'
 *
 * as adoption -- so a surface that imported a TYPE and hand-rolled everything
 * else scored a tick. Caught by mutation: stripping every kit element out of
 * reward-workspace left the count at 7/7 because the type import remained.
 *
 * That is the fourth time in one session that asserting on a mention rather
 * than a use produced a false pass in this repo's verifiers. It is the house
 * failure mode, and the fix is always the same: require the tag to open an
 * element, in the template, after comments are stripped.
 */
function mountsKitPiece(source: string): boolean {
  const template = source
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
  return KIT_PIECES.some((piece) => {
    const pascal = piece
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')
    return new RegExp(
      `<\\s*(?:Lazy|lazy-)?(?:${piece}|${pascal})(?=[\\s/>])`,
    ).test(template)
  })
}

/*
 * Count TRANSITIVE adoption, one level deep.
 *
 * Storybook and Taskmaster reach the kit through kr-narrator-stage rather than
 * mounting it themselves, and a counter that missed that would report 0/7 while
 * the components were demonstrably live in both render paths -- understating
 * progress and, worse, hiding a regression if the stage stopped using them.
 */
/*
 * ADOPTION IS FOUND BY WALKING, NOT BY A LIST.
 *
 * This used to be a hand-kept INTERMEDIARIES array -- kr-narrator-stage, the
 * response composer, the art status, the Dreams dock -- matched one level deep.
 * It broke twice in one afternoon: splitting scenario-workspace out of
 * scenario-interact dropped the count to 6/7, and splitting reward-workspace
 * out of reward-interact dropped it again. Both times the kit had not been
 * abandoned; it had moved one hop further down, and a list of names could not
 * see that.
 *
 * Reporting a refactor as a regression is the same filename-shaped blindness
 * verifyRouteGalleryContract.ts had to learn out of. So this follows the actual
 * component graph from each surface: a surface adopts the kit if anything it
 * transitively renders does.
 *
 * ONE EXCLUSION. wonderlab-preview-host.vue mounts every component in the repo
 * through import.meta.glob, so traversing into it would make every surface look
 * adopted. Being exhibited in the museum is not being used.
 */
const MUSEUM_MOUNTS_EVERYTHING = 'wonderlab-preview-host'

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

function walkVue(directory: string, out: string[] = []): string[] {
  let entries: string[]
  try {
    entries = readdirSync(directory, { withFileTypes: true }).map((e) => e.name)
  } catch {
    return out
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue
    const full = resolve(directory, entry)
    if (entry.endsWith('.vue')) out.push(full)
    else if (!entry.includes('.')) walkVue(full, out)
  }
  return out
}

const componentsByName = new Map<string, string>()
for (const file of walkVue(resolve(root, 'components'))) {
  const name = file.split('/').pop()?.replace('.vue', '') ?? ''
  if (name && !componentsByName.has(name)) componentsByName.set(name, file)
}

const templateOf = (source: string): string =>
  source
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')

const kebab = (tag: string): string =>
  (/^[a-z]/.test(tag)
    ? tag
    : tag.replace(/(?<!^)(?=[A-Z])/g, '-').toLowerCase()
  ).replace(/^lazy-/, '')

const childCache = new Map<string, string[]>()
function childComponents(name: string): string[] {
  const cached = childCache.get(name)
  if (cached) return cached
  const file = componentsByName.get(name)
  if (!file) {
    childCache.set(name, [])
    return []
  }
  const template = templateOf(readFileSync(file, 'utf8'))
  const found = new Set<string>()
  for (const [, tag] of template.matchAll(/<([A-Za-z][\w-]*)/g)) {
    const key = kebab(tag ?? '')
    if (
      key !== name &&
      key !== MUSEUM_MOUNTS_EVERYTHING &&
      componentsByName.has(key)
    ) {
      found.add(key)
    }
  }
  const result = [...found].sort()
  childCache.set(name, result)
  return result
}

/** Does this surface, or anything it renders, mount a kit piece? */
function adopts(path: string): boolean {
  const seen = new Set<string>()
  const stack = [path.split('/').pop()?.replace('.vue', '') ?? '']
  while (stack.length) {
    const current = stack.pop()
    if (!current || seen.has(current)) continue
    seen.add(current)
    const file = componentsByName.get(current)
    if (!file) continue
    if (mountsKitPiece(readFileSync(file, 'utf8'))) return true
    for (const child of childComponents(current)) {
      if (!seen.has(child)) stack.push(child)
    }
  }
  return false
}

const adopters = existing.filter(adopts)
console.log(
  `\ninfo - conversation kit adopted by ${adopters.length}/${existing.length} surface(s) ` +
    '(directly, or through anything they render)',
)
for (const path of existing) {
  console.log(
    `       ${adopters.includes(path) ? '✓' : '·'} ${path.split('/').pop()}`,
  )
}

// The kit lives in one directory; a fourth piece landing elsewhere is how a
// shared kit quietly becomes two.
const kitFiles = readdirSync(resolve(root, 'components/narrative'))
check(
  kitFiles.includes('kr-chat-window.vue') &&
    kitFiles.includes('kr-choice-list.vue') &&
    kitFiles.includes('kr-art-plate.vue'),
  'all three shared pieces live together in components/narrative/',
)

if (failures) {
  console.error(`\nNarrative kit contract failed with ${failures} error(s).`)
  process.exitCode = 1
} else {
  console.log(
    '\nNarrative kit contract passed: all checks behaved as expected.',
  )
}
