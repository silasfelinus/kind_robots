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
const scrollRegions = (chat.match(/kr-scroll|overflow-y-auto|overflow-auto/g) ?? [])
  .length
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
    !/from '@\/stores\//.test(source) && !/useNarratorStore|storeToRefs/.test(source),
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
  'the art plate reads no variant field directly (that is the resolver\'s job)',
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
const KIT_USE =
  /kr-chat-window|KrChatWindow|kr-choice-list|KrChoiceList|kr-art-plate|KrArtPlate/

/*
 * Count TRANSITIVE adoption, one level deep.
 *
 * Storybook and Taskmaster reach the kit through kr-narrator-stage rather than
 * mounting it themselves, and a counter that missed that would report 0/7 while
 * the components were demonstrably live in both render paths -- understating
 * progress and, worse, hiding a regression if the stage stopped using them.
 */
const INTERMEDIARIES = [
  'components/narrative/kr-narrator-stage.vue',
  // Both of these are themselves mounted by the product pages, and both now
  // render kit pieces internally (the composer's suggested-response row is a
  // kr-choice-list; the art status' rendered illustration is a kr-art-plate).
  // A surface that mounts either is on the kit whether it says so or not.
  'components/narrative/narrative-response-composer.vue',
  'components/narrative/narrative-art-status.vue',
]
const liveIntermediaries = INTERMEDIARIES.filter((path) => KIT_USE.test(read(path)))

function adopts(path: string): boolean {
  const source = read(path)
  if (KIT_USE.test(source)) return true
  return liveIntermediaries.some((intermediary) => {
    const name = intermediary.split('/').pop()?.replace('.vue', '') ?? ''
    const pascal = name.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase())
    return new RegExp(`${name}|${pascal}|Lazy${pascal}`).test(source)
  })
}

const adopters = existing.filter(adopts)
console.log(
  `\ninfo - conversation kit adopted by ${adopters.length}/${existing.length} surface(s) ` +
    `(directly or via ${liveIntermediaries.length} shared stage)`,
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
  console.log('\nNarrative kit contract passed: all checks behaved as expected.')
}
