// /utils/scripts/verifyNarrativeKit.ts
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildComponentGraph, mountsElement } from './componentGraph'

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
  return KIT_PIECES.some((piece) => mountsElement(source, piece))
}

/*
 * ADOPTION IS FOUND BY WALKING, NOT BY A LIST.
 *
 * Storybook and Taskmaster reach the kit through kr-narrator-stage rather than
 * mounting it themselves, so a check that only looked at each surface's own
 * file would report 0/7 while the components were demonstrably live in both
 * render paths.
 *
 * This was a hand-kept INTERMEDIARIES array once. It broke twice in one
 * afternoon: splitting scenario-workspace out of scenario-interact dropped the
 * count to 6/7, and splitting reward-workspace out of reward-interact dropped
 * it again. Both times the kit had not been abandoned; it had moved one hop
 * further down, and a list of names could not see that.
 *
 * The walk itself now lives in componentGraph.ts, shared with
 * verifyEntityArtManager -- which went red for exactly this reason a third
 * time, when the same splits carried <EntityArtManager down with them.
 */
const graph = buildComponentGraph(resolve(root, 'components'))

/** Does this surface, or anything it renders, mount a kit piece? */
function adopts(path: string): boolean {
  return graph.reaches(path, mountsKitPiece)
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
