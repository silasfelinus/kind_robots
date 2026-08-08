// /utils/scripts/verifyLayoutContract.ts
/*
 * Layout-contract verifier for conductor interface-vision/t-005.
 *
 * WHY THIS EXISTS
 * The previous attempt at a shared design system (conductor project `global-ui`)
 * was closed `finished` at 25/25 tasks while adoption sat around 7%, because
 * nobody ever measured the whole. This script is the measurement. It records a
 * baseline of today's violations and fails CI if any count goes UP.
 *
 * The baseline is a ratchet: `--update` will happily write smaller numbers and
 * REFUSES to write larger ones. So the only way to land a change that adds a
 * violation is to fix something else first, or to argue the rule is wrong and
 * change the rule deliberately.
 *
 *   npm run test:layout-contract            # verify against the baseline
 *   npm run test:layout-contract -- --report  # print current counts, no gate
 *   npm run test:layout-contract -- --update  # ratchet the baseline DOWN only
 *
 * THE RULES (see conductor projects/interface-vision/DESIGN-BRIEF.md)
 *   1. one-header    — the shell renders the page title; a page component never does
 *   2. one-scroll    — a component owns at most one scrolling region, unless it
 *                       declares the .kr-panes multi-owner primitive (t-058)
 *   3. no-viewport   — no h-screen/100vh inside a shell that is already h-dvh
 *   4. one-mdc       — a content page mounts one component, not several
 *   5. ghost-prop    — don't pass :show-header to a component that never declared it
 *   6. root-surface  — page components start with a shared kr-surface/kr-stage/kr-unbound root
 *   7. pane-display  — kr-panes/kr-pane never carry a display utility that fights
 *                       the one the primitive bakes in (t-097)
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, basename, extname } from 'node:path'
import {
  grownRatchetBuckets,
  loadRatchetBaseline,
  ratchetDelta,
  ratchetNote,
  ratchetRecordedAt,
  writeRatchetBaseline,
} from './ratchetBaseline'

const ROOT = process.cwd()
const BASELINE_PATH = join(ROOT, 'utils/scripts/layout-contract-baseline.json')
const PASCAL_ROOT_FIXTURE_PATH = join(
  ROOT,
  'utils/scripts/fixtures/layout-contract/pascal-root-page.vue',
)

type RuleId =
  | 'one-header'
  | 'one-scroll'
  | 'no-viewport'
  | 'one-mdc'
  | 'ghost-prop'
  | 'zero-scroll'
  | 'root-surface'
  | 'pane-display'

type Baseline = {
  note: string
  recorded: string
  violations: Record<RuleId, string[]>
}

const RULE_TITLES: Record<RuleId, string> = {
  'one-header': 'page components rendering their own <h1>',
  'one-scroll': 'components declaring more than one scroll region',
  'no-viewport': 'viewport-height units inside the h-dvh shell',
  'one-mdc': 'content pages mounting more than one component',
  'ghost-prop': ':show-header passed to a component that never declared it',
  'zero-scroll':
    'standalone page components with no scroll region of their own (app.vue no longer scrolls for them)',
  'root-surface':
    'page components whose root wrapper does not use kr-surface, kr-stage, or kr-unbound',
  'pane-display':
    'kr-panes/kr-pane elements carrying a display utility that contradicts the one the primitive bakes in',
}

/* screenfx is full-viewport effect canvases by design — genuinely exempt. */
const VIEWPORT_EXEMPT = ['components/screenfx/', 'components/butterfly/']

/**
 * Source with comments removed, for the rules that scan raw text rather than
 * the tokenizer's element stream.
 *
 * MENTION IS NOT USE. `no-viewport` tested the whole file, so a comment
 * SAYING the words tripped it -- kr-card-flip.vue was flagged in 2026-08-08
 * for a CSS comment reading "`100%` of the backdrop, NOT a dvh ...
 * verifyLayoutContract forbids viewport units", i.e. for documenting its own
 * compliance. The template rules never had this problem because the tokenizer
 * already skips `<!-- -->`; this rule was the one reading `source` directly.
 *
 * `//` needs the negative lookbehind or every `https://` in a file becomes the
 * start of a comment and everything after it on the line disappears.
 */
function codeOf(source: string): string {
  return source
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(?<!:)\/\/[^\n]*/g, ' ')
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

function walk(dir: string, ext: string, out: string[] = []): string[] {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue

    const full = join(dir, entry)
    let isDir: boolean
    try {
      isDir = statSync(full).isDirectory()
    } catch {
      continue
    }

    if (isDir) walk(full, ext, out)
    else if (extname(entry) === ext) out.push(full)
  }

  return out
}

const read = (path: string): string => readFileSync(path, 'utf8')
const rel = (path: string): string => relative(ROOT, path).replace(/\\/g, '/')

/* Strip <script> and <style> so we only ever match real template markup. */
function templateOf(source: string): string {
  return source
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
}

/*
 * A "page component" is one that occupies the whole content host: anything under
 * pages/, anything under components/pages/, or a *-page.vue anywhere. These are
 * the ones competing with workspace-header for the title.
 */
function isPageComponent(path: string): boolean {
  const r = rel(path)
  return (
    r.startsWith('pages/') ||
    r.startsWith('components/pages/') ||
    basename(r).endsWith('-page.vue')
  )
}

function staticClassLists(template: string): string[] {
  const classLists: string[] = []
  for (const tag of template.matchAll(/<[A-Za-z][\w-]*\b[^>]*>/g)) {
    const openingTag = tag[0]
    for (const attribute of openingTag.matchAll(
      /\sclass\s*=\s*(["'])([\s\S]*?)\1/g,
    )) {
      classLists.push(attribute[2] ?? '')
    }
  }
  return classLists
}

type TemplateNode = {
  tag: string
  classTokens: string[]
  vif: 'if' | 'elseif' | 'else' | null
  children: TemplateNode[]
}

const VOID_ELEMENTS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])

/*
 * Matches a comment, a closing tag (group 1 = name), or an opening tag
 * (group 2 = name, group 3 = raw attributes, group 4 = trailing "/" if
 * self-closing). The attribute alternation treats a whole quoted string as
 * one unit so a "v-if" expression containing a literal ">" (e.g.
 * `v-if="count > 0"`) doesn't get mistaken for the tag's own close.
 */
const TAG_RE =
  /<!--[\s\S]*?-->|<\/([A-Za-z][\w-]*)\s*>|<([A-Za-z][\w-]*)((?:"[^"]*"|'[^']*'|[^"'/>])*)(\/)?>/g

function classTokensOf(attrs: string): string[] {
  const match = attrs.match(/\sclass\s*=\s*(["'])([\s\S]*?)\1/)
  return (match?.[2] ?? '').split(/\s+/).filter(Boolean)
}

function vifOf(attrs: string): TemplateNode['vif'] {
  if (/\bv-else-if\s*=/.test(attrs)) return 'elseif'
  if (/\bv-if\s*=/.test(attrs)) return 'if'
  if (/\bv-else\b(?!-if)/.test(attrs)) return 'else'
  return null
}

/*
 * Parses <template> markup into a tree so scroll-region counting can tell a
 * mutually-exclusive v-if/v-else-if/v-else branch apart from a sibling that
 * really does render concurrently (interface-vision t-058). Best-effort, not
 * a full HTML parser: assumes well-formed nesting (true across this
 * codebase's SFCs) and only reads static class attributes, matching the rest
 * of this file's scope.
 */
function parseTemplate(template: string): TemplateNode[] {
  const root: TemplateNode = {
    tag: '',
    classTokens: [],
    vif: null,
    children: [],
  }
  let current = root
  const ancestors: TemplateNode[] = []

  for (const match of template.matchAll(TAG_RE)) {
    const [full, closeTag, openTag, rawAttrs, selfClose] = match
    if ((full ?? '').startsWith('<!--')) continue
    if (closeTag) {
      const parent = ancestors.pop()
      if (parent) current = parent
      continue
    }
    if (!openTag) continue

    const attrs = rawAttrs ?? ''
    const node: TemplateNode = {
      tag: openTag,
      classTokens: classTokensOf(attrs),
      vif: vifOf(attrs),
      children: [],
    }
    current.children.push(node)

    const isVoid = VOID_ELEMENTS.has(openTag.toLowerCase())
    if (!selfClose && !isVoid) {
      ancestors.push(current)
      current = node
    }
  }

  return root.children
}

/*
 * A static max-h-* region is deliberately bounded inside its parent (log
 * tail, JSON preview, swatch grid), so it is not a competing page-level
 * scroll owner. kr-scroll always counts because it is the explicit
 * full-region primitive. kr-pane-scroll is deliberately excluded here -- it
 * is the multi-owner primitive's scroll marker and is counted separately,
 * below.
 */
function ownScrollCount(node: TemplateNode): number {
  const hasKrScroll = node.classTokens.includes('kr-scroll')
  const hasRawScroll =
    node.classTokens.includes('overflow-y-auto') ||
    node.classTokens.includes('overflow-auto')
  const isBounded = node.classTokens.some((token) => token.startsWith('max-h-'))
  return hasKrScroll || (hasRawScroll && !isBounded) ? 1 : 0
}

/*
 * `fixed inset-0` takes an element out of normal document flow and layers it
 * over the entire viewport (interface-vision t-058's Shape B follow-on: a
 * modal/lightbox, not a co-resident grid pane). Its content is never visible
 * or interactive alongside the page's base scroll region the way a real
 * Shape B aside+main pair is -- the two can't compete for the user's scroll
 * gesture at the same time -- so a scroll region inside one doesn't compete
 * with the page's own owner. Unlike swapping h-screen for h-dvh (t-017's
 * documented gaming risk), `fixed inset-0` isn't a quiet drop-in substitute
 * for anything else: it fundamentally changes how the element renders, so
 * it isn't a plausible way to dodge this rule while keeping the same shape.
 */
function isFixedOverlay(node: TemplateNode): boolean {
  return (
    node.classTokens.includes('fixed') && node.classTokens.includes('inset-0')
  )
}

function subtreeScrollCount(node: TemplateNode): number {
  if (isFixedOverlay(node)) return 0
  return ownScrollCount(node) + combineScrollCounts(node.children)
}

/*
 * Siblings forming a v-if/v-else-if/v-else chain render at most one branch
 * at a time, so the chain contributes the MAX across its members, not the
 * sum -- that's the whole fix. Anything else (a lone v-if with no following
 * v-else-if/v-else, or a plain sibling) is counted on its own, so two
 * independent v-if blocks that can both be true simultaneously still add.
 */
function combineScrollCounts(siblings: TemplateNode[]): number {
  let total = 0
  let i = 0
  while (i < siblings.length) {
    const node = siblings[i]
    if (!node) break

    if (node.vif === 'if') {
      let groupMax = subtreeScrollCount(node)
      let j = i + 1
      let next = siblings[j]
      while (next && (next.vif === 'elseif' || next.vif === 'else')) {
        groupMax = Math.max(groupMax, subtreeScrollCount(next))
        j++
        next = siblings[j]
      }
      total += groupMax
      i = j
    } else {
      total += subtreeScrollCount(node)
      i++
    }
  }
  return total
}

/* Count actual scroll-owner elements, not raw utility-string occurrences. */
function scrollRegionCount(template: string): number {
  return combineScrollCounts(parseTemplate(template))
}

/*
 * .kr-pane-scroll (interface-vision t-058) is the multi-owner primitive's
 * scroll marker -- a component may declare more than one, but only once it
 * has also declared the .kr-panes grid container that makes multiple owners
 * legitimate. Mixing it with the single-owner primitive (kr-scroll / raw
 * overflow-y-auto) in the same component is not allowed -- pick one pattern.
 */
function paneScrollRegionCount(template: string): number {
  return staticClassLists(template).filter((classList) =>
    classList.split(/\s+/).filter(Boolean).includes('kr-pane-scroll'),
  ).length
}

function hasKrPanes(template: string): boolean {
  return staticClassLists(template).some((classList) =>
    classList.split(/\s+/).filter(Boolean).includes('kr-panes'),
  )
}

/*
 * .kr-anchor-scroll (interface-vision t-058 follow-on, conductor issue
 * #1690) is the overlay-safe sibling of .kr-pane-scroll: legitimate for an
 * anchored control (e.g. a dropdown menu) whose absolutely-positioned
 * flyout child is simultaneously interactive and independently scrollable.
 * Gated behind .kr-anchor-panes exactly like .kr-pane-scroll is gated
 * behind .kr-panes, so an arbitrary absolutely-positioned element can't
 * opt itself out of the one-scroll rule without also declaring the marker.
 */
function anchorScrollRegionCount(template: string): number {
  return staticClassLists(template).filter((classList) =>
    classList.split(/\s+/).filter(Boolean).includes('kr-anchor-scroll'),
  ).length
}

/*
 * .kr-panes bakes in `grid`; .kr-pane bakes in `flex flex-col`. Tailwind's
 * utilities layer outranks the components layer, so a leftover `grid` sitting
 * next to .kr-pane doesn't lose the cascade -- it WINS, and the element quietly
 * stops being the flex column the primitive promised. That is exactly what
 * dream-brainstorm.vue's `grid grid-rows-[auto_minmax(0,1fr)_auto]` main hit
 * during t-058: it had to be converted to a flex header/scroll/footer shape
 * rather than just gaining a .kr-pane alongside the grid classes.
 *
 * Nothing else in CI can see this. TypeScript and ESLint don't read class
 * strings, and every other rule in this file counts class names without
 * asking whether two of them contradict. It took reading the primitive's CSS
 * by hand to catch (interface-vision t-097).
 *
 * Deliberately narrow -- only the display axis, and only the direction that
 * actually breaks:
 *   - grid-family utilities on .kr-pane (its `flex` makes them inert or
 *     hijacks its display outright)
 *   - flex-family utilities on .kr-panes (same, mirrored)
 * Supplying grid-cols-* to .kr-panes is the primitive's DOCUMENTED contract
 * ("caller supplies grid-cols"), never a violation. Overriding a baked
 * non-display utility on purpose -- `kr-panes gap-0` in
 * animation-manager.vue -- is legitimate too, and stays unflagged. Merely
 * redundant repeats (`kr-panes grid min-h-0 flex-1`) are noise, not breakage,
 * and are also left alone: this rule fails builds, so it only fires on a mix
 * that changes what the element does.
 */
const GRID_DISPLAY_TOKEN = /^(?:[a-z0-9-]+:)*(?:inline-)?grid$/
const GRID_TEMPLATE_TOKEN =
  /^(?:[a-z0-9-]+:)*(?:grid-cols|grid-rows|auto-cols|auto-rows|grid-flow)-/
const FLEX_DISPLAY_TOKEN = /^(?:[a-z0-9-]+:)*(?:inline-)?flex$/
const FLEX_DIRECTION_TOKEN = /^(?:[a-z0-9-]+:)*flex-(?:col|row)(?:-reverse)?$/

function paneDisplayConflicts(template: string): string[] {
  const conflicts: string[] = []

  for (const classList of staticClassLists(template)) {
    const tokens = classList.split(/\s+/).filter(Boolean)
    // .kr-pane-scroll declares no display of its own, so it is not in scope.
    const isPanes = tokens.includes('kr-panes')
    const isPane = tokens.includes('kr-pane')
    if (!isPanes && !isPane) continue

    const offenders = tokens.filter((token) =>
      isPane
        ? GRID_DISPLAY_TOKEN.test(token) || GRID_TEMPLATE_TOKEN.test(token)
        : FLEX_DISPLAY_TOKEN.test(token) || FLEX_DIRECTION_TOKEN.test(token),
    )

    if (offenders.length) {
      conflicts.push(
        `${isPane ? 'kr-pane' : 'kr-panes'} + ${offenders.join(' ')}`,
      )
    }
  }

  return conflicts
}

function hasKrAnchorPanes(template: string): boolean {
  return staticClassLists(template).some((classList) =>
    classList.split(/\s+/).filter(Boolean).includes('kr-anchor-panes'),
  )
}

/*
 * This checks the literal first element inside <template>, not whichever nested
 * wrapper looks visually dominant. Put the kr-* marker on that opening tag.
 */
function rootClassList(template: string): string | null {
  const root = template
    .match(/<template\b[^>]*>([\s\S]*)<\/template>/)?.[1]
    ?.trim()
  const openingTag = root?.match(/^<([A-Za-z][\w-]*)\b([^>]*)>/)
  if (!openingTag) return null

  const attributes = openingTag[2] ?? ''
  return attributes.match(/\bclass\s*=\s*["']([^"']*)["']/)?.[1] ?? ''
}

function verifyRootClassListFixture(): void {
  const fixtureClasses = rootClassList(
    templateOf(read(PASCAL_ROOT_FIXTURE_PATH)),
  )
  if (fixtureClasses !== 'kr-surface') {
    throw new Error(
      `PascalCase root fixture was not parsed correctly: ${String(fixtureClasses)}`,
    )
  }
}

function verifyScrollRegionCountFixture(): void {
  const fixture = `
    <template>
      <main class="min-h-0 flex-1 overflow-y-auto"></main>
      <pre class="max-h-48 overflow-auto"></pre>
      <section class="kr-scroll"></section>
    </template>
  `
  const count = scrollRegionCount(templateOf(fixture))
  if (count !== 2) {
    throw new Error(
      `Scroll-region fixture was not classified correctly: ${count}`,
    )
  }
}

function verifyScrollExclusivityFixture(): void {
  const chained = templateOf(`
    <template>
      <section v-if="tab === 'a'" class="overflow-y-auto"></section>
      <section v-else-if="tab === 'b'" class="overflow-y-auto"></section>
      <section v-else class="overflow-y-auto"></section>
    </template>
  `)
  if (scrollRegionCount(chained) !== 1) {
    throw new Error(
      'Scroll-exclusivity fixture (chained branches) was not classified correctly.',
    )
  }

  const twoOwnerBranch = templateOf(`
    <template>
      <section v-if="tab === 'overview'">
        <div class="overflow-y-auto"></div>
        <div class="overflow-y-auto"></div>
      </section>
      <section v-else-if="tab === 'art'" class="overflow-y-auto"></section>
    </template>
  `)
  if (scrollRegionCount(twoOwnerBranch) !== 2) {
    throw new Error(
      'Scroll-exclusivity fixture (two-owner branch) was not classified correctly.',
    )
  }

  const independentIfs = templateOf(`
    <template>
      <div v-if="showBanner" class="overflow-y-auto"></div>
      <section v-if="tab === 'a'" class="overflow-y-auto"></section>
      <section v-else class="overflow-y-auto"></section>
    </template>
  `)
  if (scrollRegionCount(independentIfs) !== 2) {
    throw new Error(
      'Scroll-exclusivity fixture (independent v-if siblings) was not classified correctly.',
    )
  }

  const literalGtInExpression = templateOf(`
    <template>
      <section v-if="count > 0" class="overflow-y-auto"></section>
      <section v-else class="overflow-y-auto"></section>
    </template>
  `)
  if (scrollRegionCount(literalGtInExpression) !== 1) {
    throw new Error(
      "Scroll-exclusivity fixture (literal '>' inside a v-if expression) was not classified correctly.",
    )
  }
}

function verifyFixedOverlayFixture(): void {
  const overlayOverBaseScroll = templateOf(`
    <template>
      <section class="overflow-y-auto"></section>
      <div v-if="open" class="fixed inset-0">
        <div class="overflow-y-auto"></div>
      </div>
    </template>
  `)
  if (scrollRegionCount(overlayOverBaseScroll) !== 1) {
    throw new Error(
      'Fixed-overlay fixture (modal over base scroll) was not classified correctly.',
    )
  }

  const twoScrollsInsideOverlay = templateOf(`
    <template>
      <div class="fixed inset-0">
        <div class="overflow-y-auto"></div>
        <div class="overflow-y-auto"></div>
      </div>
    </template>
  `)
  if (scrollRegionCount(twoScrollsInsideOverlay) !== 0) {
    throw new Error(
      'Fixed-overlay fixture (nested scrolls all exempt) was not classified correctly.',
    )
  }

  const fixedWithoutInset0 = templateOf(`
    <template>
      <section class="overflow-y-auto"></section>
      <div class="fixed bottom-4 right-4">
        <div class="overflow-y-auto"></div>
      </div>
    </template>
  `)
  if (scrollRegionCount(fixedWithoutInset0) !== 2) {
    throw new Error(
      'Fixed-overlay fixture (fixed without inset-0 still counts) was not classified correctly.',
    )
  }
}

function verifyPaneDisplayFixture(): void {
  /* The mix that broke dream-brainstorm.vue, plus its mirror on .kr-panes. */
  const conflicting = templateOf(`
    <template>
      <main class="kr-pane grid grid-rows-[auto_minmax(0,1fr)_auto]"></main>
      <section class="kr-panes flex flex-col"></section>
    </template>
  `)
  const found = paneDisplayConflicts(conflicting)
  if (found.length !== 2) {
    throw new Error(
      `Pane-display fixture (conflicting) was not classified correctly: ${found.join(' | ')}`,
    )
  }
  if (!found[0]?.includes('grid-rows-') || !found[1]?.includes('flex-col')) {
    throw new Error(
      `Pane-display fixture did not name the offending tokens: ${found.join(' | ')}`,
    )
  }

  /*
   * Everything here is legitimate and must stay silent: .kr-panes with the
   * caller-supplied grid template it documents (including a responsive
   * variant), a deliberate `gap-0` override, .kr-pane-scroll with its own
   * display (it declares none), and `flex-1`, which is sizing rather than a
   * flex-direction token and must not be caught by the `flex-` prefix.
   */
  const legitimate = templateOf(`
    <template>
      <section class="kr-panes gap-0 grid-cols-1 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <aside class="kr-pane-scroll flex flex-col gap-4"></aside>
        <div class="kr-pane-scroll grid auto-rows-min grid-cols-2"></div>
        <main class="kr-pane min-w-0 flex-1"></main>
      </section>
    </template>
  `)
  const quiet = paneDisplayConflicts(legitimate)
  if (quiet.length) {
    throw new Error(
      `Pane-display fixture (legitimate) produced false positives: ${quiet.join(' | ')}`,
    )
  }
}

function verifyPaneScrollFixture(): void {
  const withPanes = templateOf(`
    <template>
      <section class="kr-panes grid-cols-2">
        <aside class="kr-pane-scroll"></aside>
        <main class="kr-pane-scroll"></main>
      </section>
    </template>
  `)
  const withoutPanes = templateOf(`
    <template>
      <section>
        <aside class="kr-pane-scroll"></aside>
        <main class="kr-pane-scroll"></main>
      </section>
    </template>
  `)

  if (paneScrollRegionCount(withPanes) !== 2) {
    throw new Error('Pane-scroll fixture was not classified correctly (count).')
  }
  if (!hasKrPanes(withPanes)) {
    throw new Error(
      'Pane-scroll fixture was not classified correctly (kr-panes present).',
    )
  }
  if (hasKrPanes(withoutPanes)) {
    throw new Error(
      'Pane-scroll fixture was not classified correctly (kr-panes absent).',
    )
  }
}

function verifyAnchorScrollFixture(): void {
  const withAnchorPanes = templateOf(`
    <template>
      <div class="dropdown-content kr-anchor-panes">
        <ul class="kr-anchor-scroll"></ul>
        <ul class="absolute left-full kr-anchor-scroll"></ul>
      </div>
    </template>
  `)
  const withoutAnchorPanes = templateOf(`
    <template>
      <div class="dropdown-content">
        <ul class="kr-anchor-scroll"></ul>
        <ul class="absolute left-full kr-anchor-scroll"></ul>
      </div>
    </template>
  `)

  if (anchorScrollRegionCount(withAnchorPanes) !== 2) {
    throw new Error(
      'Anchor-scroll fixture was not classified correctly (count).',
    )
  }
  if (!hasKrAnchorPanes(withAnchorPanes)) {
    throw new Error(
      'Anchor-scroll fixture was not classified correctly (kr-anchor-panes present).',
    )
  }
  if (hasKrAnchorPanes(withoutAnchorPanes)) {
    throw new Error(
      'Anchor-scroll fixture was not classified correctly (kr-anchor-panes absent).',
    )
  }

  /* An arbitrary absolutely-positioned element cannot bypass the
     one-scroll rule just by borrowing the .kr-anchor-scroll class name
     without its component ever declaring .kr-anchor-panes (conductor
     issue #1690's item 4) -- this is asserted end-to-end via `collect()`
     in the one-scroll rule itself, not just these two helpers, since a
     lone .kr-anchor-scroll with no .kr-anchor-panes anywhere in the file
     must still surface as a violation. */
}

function collect(): Record<RuleId, string[]> {
  const vueFiles = [
    ...walk(join(ROOT, 'components'), '.vue'),
    ...walk(join(ROOT, 'pages'), '.vue'),
  ]
  const mdFiles = walk(join(ROOT, 'content'), '.md')

  const violations: Record<RuleId, string[]> = {
    'one-header': [],
    'one-scroll': [],
    'no-viewport': [],
    'one-mdc': [],
    'ghost-prop': [],
    'zero-scroll': [],
    'root-surface': [],
    'pane-display': [],
  }

  /*
   * MDC-mounted components inherit the single scroll owner from
   * pages/[...slug].vue's content-host. Giving them another overflow region would
   * create the nested-scroll regression this contract is meant to prevent.
   */
  const mdcMountedComponents = new Set<string>()
  for (const file of mdFiles) {
    const body = read(file).replace(/^---[\s\S]*?\n---\n/, '')
    const blocks = body
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => /^:{1,2}[a-z][a-z0-9-]*\s*$/.test(line))

    for (const block of blocks) {
      mdcMountedComponents.add(block.replace(/^:{1,2}/, ''))
    }

    if (blocks.length > 1) violations['one-mdc'].push(rel(file))
  }

  /* Components that legitimately declare a showHeader prop. */
  const declaresShowHeader = new Set<string>()
  for (const file of vueFiles) {
    const source = read(file)
    if (
      /\bshowHeader\b\s*[?:]/.test(source) ||
      /['"]show-header['"]/.test(source)
    ) {
      declaresShowHeader.add(basename(file, '.vue'))
    }
  }

  for (const file of vueFiles) {
    const source = read(file)
    const template = templateOf(source)
    const r = rel(file)
    const pageComponent = isPageComponent(file)

    if (pageComponent && /<h1[\s>]/.test(template)) {
      violations['one-header'].push(r)
    }

    if (pageComponent) {
      const rootClasses = rootClassList(template)
      if (
        rootClasses === null ||
        !/(?:^|\s)kr-(?:surface|stage|unbound)(?:\s|$)/.test(rootClasses)
      ) {
        violations['root-surface'].push(r)
      }
    }

    /*
     * .kr-scroll (interface-vision t-004) is the primitive's own scroll-owner
     * class (`min-h-0 flex-1 overflow-y-auto overscroll-contain`) — a page
     * that adopts it declares its scroll region through the class, not a raw
     * overflow-y-auto utility string. Bounded max-h-* regions are intentionally
     * nested previews, not page-level owners, and do not count toward one-scroll.
     *
     * .kr-pane-scroll (interface-vision t-058) is the multi-owner escape
     * hatch: any number of them is fine once .kr-panes is also declared, but
     * mixing them with the single-owner primitive in the same component, or
     * using .kr-pane-scroll without .kr-panes, is still a violation.
     *
     * .kr-anchor-scroll (t-058 follow-on, conductor issue #1690) is the
     * overlay-safe sibling escape hatch for an anchor + absolutely-positioned
     * flyout shape (.kr-panes' overflow-hidden would clip the flyout). Same
     * gating rule, scoped to .kr-anchor-panes instead of .kr-panes.
     */
    const scrollers = scrollRegionCount(template)
    const paneScrollers = paneScrollRegionCount(template)
    const declaresPanes = hasKrPanes(template)
    const anchorScrollers = anchorScrollRegionCount(template)
    const declaresAnchorPanes = hasKrAnchorPanes(template)

    if (scrollers > 1) violations['one-scroll'].push(r)
    else if (paneScrollers > 0 && (!declaresPanes || scrollers > 0)) {
      violations['one-scroll'].push(r)
    } else if (
      anchorScrollers > 0 &&
      (!declaresAnchorPanes || scrollers > 0 || paneScrollers > 0)
    ) {
      violations['one-scroll'].push(r)
    }

    if (
      scrollers === 0 &&
      paneScrollers === 0 &&
      anchorScrollers === 0 &&
      pageComponent &&
      !mdcMountedComponents.has(basename(file, '.vue'))
    ) {
      violations['zero-scroll'].push(r)
    }

    for (const conflict of paneDisplayConflicts(template)) {
      violations['pane-display'].push(`${r} → ${conflict}`)
    }

    const exempt = VIEWPORT_EXEMPT.some((prefix) => r.startsWith(prefix))
    if (
      !exempt &&
      /\b(h-screen|min-h-screen)\b|100vh|100dvh/.test(codeOf(source))
    ) {
      violations['no-viewport'].push(r)
    }

    /*
     * A call site passing :show-header to a component whose file never declares
     * it. Vue silently turns that into a fallthrough attribute and it does
     * nothing, which reads as "this is configurable" when it isn't.
     */
    for (const match of template.matchAll(
      /<([a-z][a-z0-9]*(?:-[a-z0-9]+)+)\b[^>]*?:show-header/g,
    )) {
      const target = match[1]
      if (target && !declaresShowHeader.has(target)) {
        violations['ghost-prop'].push(`${r} → <${target}>`)
      }
    }
  }

  for (const key of Object.keys(violations) as RuleId[]) {
    violations[key] = [...new Set(violations[key])].sort()
  }

  return violations
}

function report(
  current: Record<RuleId, string[]>,
  baseline: Baseline | null,
): void {
  console.log('\nLayout contract — current state\n')
  for (const key of Object.keys(RULE_TITLES) as RuleId[]) {
    const now = current[key].length
    const was = baseline?.violations?.[key]?.length
    const delta = ratchetDelta(now, was)
    console.log(`  ${String(now).padStart(4)}  ${RULE_TITLES[key]}${delta}`)
  }
  console.log('')
}

function main(): void {
  const args = process.argv.slice(2)
  verifyRootClassListFixture()
  verifyScrollRegionCountFixture()
  verifyScrollExclusivityFixture()
  verifyFixedOverlayFixture()
  verifyPaneScrollFixture()
  verifyPaneDisplayFixture()
  verifyAnchorScrollFixture()
  const current = collect()
  const baseline = loadRatchetBaseline<Baseline>(BASELINE_PATH)

  if (args.includes('--report')) {
    report(current, baseline)
    for (const key of Object.keys(RULE_TITLES) as RuleId[]) {
      if (!current[key].length) continue
      console.log(`${key} — ${RULE_TITLES[key]}:`)
      for (const entry of current[key]) console.log(`  ${entry}`)
      console.log('')
    }
    return
  }

  if (args.includes('--update')) {
    const next: Baseline = {
      note: ratchetNote(
        'Layout-contract allow-list.',
        'utils/scripts/verifyLayoutContract.ts',
      ),
      recorded: ratchetRecordedAt(),
      violations: current,
    }

    const grew = grownRatchetBuckets(current, baseline?.violations ?? null)

    if (grew.length) {
      report(current, baseline)
      throw new Error(
        `Refusing to update the baseline — these rules got WORSE: ${grew.join(', ')}.\n` +
          'The allow-list is a ratchet. Fix the new violations, or change the rule deliberately.',
      )
    }

    writeRatchetBaseline(BASELINE_PATH, next)
    report(current, baseline)
    console.log(`Baseline written to ${rel(BASELINE_PATH)}`)
    return
  }

  if (!baseline) {
    report(current, null)
    throw new Error(
      `No baseline at ${rel(BASELINE_PATH)}. Run: npm run test:layout-contract -- --update`,
    )
  }

  const failures: string[] = []

  for (const key of Object.keys(RULE_TITLES) as RuleId[]) {
    const allowed = new Set(baseline.violations[key] ?? [])
    const added = current[key].filter((entry) => !allowed.has(entry))

    if (added.length) {
      failures.push(
        `${key} — ${RULE_TITLES[key]}\n${added.map((entry) => `    + ${entry}`).join('\n')}`,
      )
    }
  }

  report(current, baseline)

  if (failures.length) {
    throw new Error(
      `Layout contract violated by new code:\n\n${failures.join('\n\n')}\n\n` +
        'These are new since the baseline. Fix them — the allow-list only shrinks.\n' +
        'See conductor projects/interface-vision/DESIGN-BRIEF.md for the three rules.',
    )
  }

  const shrunk = (Object.keys(RULE_TITLES) as RuleId[]).filter(
    (key) => current[key].length < (baseline.violations[key]?.length ?? 0),
  )

  if (shrunk.length) {
    console.log(
      `Contract improved (${shrunk.join(', ')}). Run with --update to ratchet the baseline down.\n`,
    )
    for (const key of shrunk) {
      const currentEntries = new Set(current[key])
      const removed = (baseline.violations[key] ?? []).filter(
        (entry) => !currentEntries.has(entry),
      )
      console.log(
        `${key} baseline can remove ${removed.length} entr${removed.length === 1 ? 'y' : 'ies'}:`,
      )
      for (const entry of removed) console.log(`  - ${entry}`)
      console.log('')
    }
  }

  console.log('Layout contract holds — no new violations.\n')
}

main()
