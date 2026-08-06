// /utils/scripts/verifyRouteGalleryContract.ts
//
// Does the page a user actually lands on render the shared gallery?
//
// WHY THIS EXISTS, AND WHY IT IS NOT verifyGalleryAdoption.ts
// -----------------------------------------------------------
// verifyGalleryAdoption.ts answers "is component X on kr-gallery, and does SOME
// content route reach it?". That is a weaker question than it looks, and the
// gap between the two cost a whole task cycle:
//
//   1. `/facets` shipped for weeks mounting facet-manager -- an admin table --
//      while facet-gallery.vue sat correctly on kr-gallery with no route
//      pointing at it. Every filename-level assertion passed. The gallery work
//      was reported finished. The route was untouched.
//
//   2. SOME-route reachability is not the route you think it is. Today
//      verifyGalleryAdoption prints "dream-gallery ... reached from /academy",
//      because academy-manager -> image-upload -> dream-gallery. True, and
//      useless: it says nothing about whether /dreams renders a gallery. A
//      route-blind check would go on passing if /dreams lost its gallery
//      entirely, so long as one image picker somewhere still embedded one.
//
// So this file asks the user's question instead: FOR EACH ROUTE, walk the
// component the route actually mounts, and judge what that subtree contains.
//
// TWO RULES
// ---------
// Rule 1 (ratcheted). Every `*-gallery` component reachable from a content
// route must MOUNT kr-gallery. Holdouts are bucketed by component, with the
// routes that render them listed as the evidence -- so the report says where a
// user sees the inconsistency, and adopting the shell removes a whole bucket.
// Ratcheted rather than hard because thirteen live galleries are hand-rolled
// today; failing on all of them would block every unrelated PR, which is how a
// contract gets deleted instead of satisfied.
//
// Rule 2 (hard). Each core object has ONE route, that route reaches ITS OWN
// object gallery, and that gallery is on kr-gallery. All seven pass today, so
// this is a hard gate from the first commit -- it is the assertion that was
// missing when /facets regressed, and the one that stops a future refactor
// from "passing" by deleting a gallery or by splitting an object across two
// routes ("two different routes, that way will lie madness" -- Silas).
//
// ELEMENT-LEVEL DETECTION, NOT SUBSTRING
// --------------------------------------
// Adoption means `<kr-gallery>` appears as a MOUNT. A substring test counts
// `class="kr-gallery ..."` as adoption -- which is exactly why ui-gallery.vue
// reads as an adopter in the older counter while mounting nothing of the sort.
// See mountsKrGallery() and its self-test.
//
//   npx tsx utils/scripts/verifyRouteGalleryContract.ts
//   npx tsx utils/scripts/verifyRouteGalleryContract.ts --update    # shrink only
//   npx tsx utils/scripts/verifyRouteGalleryContract.ts --self-test
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, extname, join, relative, resolve } from 'node:path'
import { CORE_OBJECT_ROUTES, type CoreObject } from './coreObjectRoutes'
import {
  grownRatchetBuckets,
  loadRatchetBaseline,
  ratchetDelta,
  ratchetNote,
  ratchetRecordedAt,
  writeRatchetBaseline,
  type RatchetEntries,
} from './ratchetBaseline'

const root = process.cwd()
const BASELINE = resolve(root, 'utils/scripts/route-gallery-baseline.json')
const SCRIPT = 'utils/scripts/verifyRouteGalleryContract.ts'

const SHARED_GALLERY = 'kr-gallery'
const SHARED_MANAGER = 'kr-manager'

/*
 * The tab managers that must wear the shared shell.
 *
 * conductor is deliberately absent: components/pages/conductor-manager.vue
 * routes on pageStore.workspaceCardKey rather than dashboard tabs, has no
 * status banner and no tab machinery, and is 54 lines. Forcing it into a shape
 * it does not have would be pretend-consistency, which is worse than none.
 */
const TAB_MANAGERS = [
  'bot-manager',
  'character-manager',
  'dream-manager',
  'facet-manager',
  'reward-manager',
  'scenario-manager',
]

type RouteGalleryBaseline = {
  note: string
  recorded: string
  /** Rule 1: live `*-gallery` components not on the shared shell. */
  total: number
  holdouts: RatchetEntries
  /** Rule 3: second browsers for an object on its own route. */
  shadowTotal: number
  shadows: RatchetEntries
  /** Rule 4: tab managers not yet on the shared manager shell. */
  managerTotal: number
  managers: RatchetEntries
  /** Rule 5: how big each core-object interact is. May only ever shrink. */
  interactLines: Record<string, number>
}

const rel = (path: string): string => relative(root, path).replace(/\\/g, '/')

/* -------------------------------------------------------------------------- */
/* detection                                                                   */
/* -------------------------------------------------------------------------- */

/** Strip the parts of an SFC that can mention a tag without rendering it. */
export function templateOf(source: string): string {
  return source
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
}

/** The `<script>` body, where a loop's source is actually defined. */
export function scriptOf(source: string): string {
  return [...source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
    .map((match) => match[1] ?? '')
    .join('\n')
}

/**
 * Does this source MOUNT kr-gallery?
 *
 * The tag must open an element: `<kr-gallery`, `<KrGallery`, and Nuxt's
 * auto-registered `<LazyKrGallery>` / `<lazy-kr-gallery>` all count. A class
 * name, a prop value, or a doc comment naming the component does not -- that
 * distinction is the whole point, and `class="kr-gallery h-full ..."` in
 * ui-gallery.vue is the live example that a substring test gets wrong.
 */
export function mountsKrGallery(source: string): boolean {
  return mountsComponent(source, SHARED_GALLERY)
}

/**
 * Does this source MOUNT the named kebab-case component?
 *
 * The tag must open an element: `<kr-gallery`, `<KrGallery`, and Nuxt's
 * auto-registered `<LazyKrGallery>` / `<lazy-kr-gallery>` all count. A class
 * name, a prop value, or a doc comment naming the component does not -- that
 * distinction is the whole point, and `class="kr-gallery h-full ..."` in
 * ui-gallery.vue is the live example that a substring test gets wrong.
 */
export function mountsComponent(source: string, kebabName: string): boolean {
  const pascal = kebabName
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
  const pattern = new RegExp(
    `<\\s*(?:Lazy|lazy-)?(?:${kebabName}|${pascal})(?=[\\s/>])`,
  )
  return pattern.test(templateOf(source))
}

/* -------------------------------------------------------------------------- */
/* the component graph                                                         */
/* -------------------------------------------------------------------------- */

const SKIP_DIRS = new Set([
  'node_modules',
  '.nuxt',
  '.git',
  'dist',
  '.output',
  // Parked components are deliberately unreachable, and fixtures/samples are
  // not routes a user can land on.
  'abandonware',
  'archives',
  'cypress',
  'sample',
])

function walkVue(directory: string, out: string[] = []): string[] {
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
    if (isDirectory) walkVue(full, out)
    else if (extname(entry) === '.vue') out.push(full)
  }
  return out
}

const componentsByName = new Map<string, string>()
for (const file of walkVue(resolve(root, 'components'))) {
  const name = basename(file, '.vue')
  if (!componentsByName.has(name)) componentsByName.set(name, file)
}

/** `<DreamGallery>` and `<LazyDreamGallery>` both mean dream-gallery.vue. */
function kebab(tag: string): string {
  const name = /^[a-z]/.test(tag)
    ? tag
    : tag.replace(/(?<!^)(?=[A-Z])/g, '-').toLowerCase()
  return name.replace(/^lazy-/, '')
}

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
    if (key !== name && componentsByName.has(key)) found.add(key)
  }

  const result = [...found].sort()
  childCache.set(name, result)
  return result
}

/* -------------------------------------------------------------------------- */
/* the routes                                                                  */
/* -------------------------------------------------------------------------- */

type ContentRoute = { route: string; mounts: string[] }

/**
 * Every route a user can land on, with the component(s) its MDC body mounts.
 *
 * `content/channels/` holds manifest rows rather than pages and carries no
 * mounts. A page with `redirect:` in its frontmatter is a legacy stub that
 * bounces elsewhere, so judging it would double-count the destination.
 */
function contentRoutes(): ContentRoute[] {
  const contentRoot = resolve(root, 'content')
  const files: string[] = []
  const walkMd = (directory: string): void => {
    for (const entry of readdirSync(directory)) {
      const full = join(directory, entry)
      if (statSync(full).isDirectory()) {
        if (basename(full) !== 'channels') walkMd(full)
      } else if (entry.endsWith('.md')) files.push(full)
    }
  }
  walkMd(contentRoot)

  const routes: ContentRoute[] = []
  for (const file of files.sort()) {
    const raw = readFileSync(file, 'utf8')
    const frontmatter = /^---\n([\s\S]*?)\n---\n/.exec(raw)?.[1] ?? ''
    if (/^redirect:\s*\S/m.test(frontmatter)) continue

    const body = raw.replace(/^---[\s\S]*?\n---\n/, '')
    const route =
      '/' + relative(contentRoot, file).replace(/\\/g, '/').replace(/\.md$/, '')

    const mounts: string[] = []
    for (const line of body.split('\n')) {
      const trimmed = line.trim()
      if (/^:{1,2}[a-z][a-z0-9-]*$/.test(trimmed)) {
        mounts.push(trimmed.replace(/^:{1,2}/, ''))
      }
    }
    if (mounts.length) routes.push({ route, mounts })
  }
  return routes
}

/** Everything the route's mounts render, transitively. */
export function subtreeOf(
  mounts: readonly string[],
  children: (name: string) => string[],
): Set<string> {
  const seen = new Set<string>()
  const stack = [...mounts]
  while (stack.length) {
    const current = stack.pop()
    if (!current || seen.has(current)) continue
    seen.add(current)
    for (const child of children(current)) {
      if (!seen.has(child)) stack.push(child)
    }
  }
  return seen
}

const isGalleryComponent = (name: string): boolean =>
  name !== SHARED_GALLERY &&
  (name.endsWith('-gallery') || name.endsWith('-gallery-page'))

/* -------------------------------------------------------------------------- */
/* rule 1 — live galleries not on the shared shell                             */
/* -------------------------------------------------------------------------- */

/**
 * Bucket hand-rolled galleries by COMPONENT, listing the routes that render
 * them.
 *
 * Bucketing by component rather than by route is deliberate: user-manager is
 * mounted by /achievements, /dashboard and /themes, so a route-keyed baseline
 * would record achievement-gallery three times and adopting the shell once
 * would appear to fix three separate things. Keyed by component, one adoption
 * deletes one bucket, and a NEW route rendering an existing holdout still
 * grows that bucket and fails.
 */
export function bucketHoldouts(
  routes: readonly { route: string; galleries: readonly string[] }[],
  adopted: (name: string) => boolean,
): RatchetEntries {
  const buckets: RatchetEntries = {}
  for (const { route, galleries } of routes) {
    for (const gallery of galleries) {
      if (adopted(gallery)) continue
      ;(buckets[gallery] ??= []).push(route)
    }
  }
  for (const key of Object.keys(buckets)) {
    buckets[key] = [...new Set(buckets[key])].sort((a, b) => a.localeCompare(b))
  }
  return buckets
}

export function totalHoldouts(buckets: RatchetEntries): number {
  return Object.keys(buckets).length
}

/* -------------------------------------------------------------------------- */
/* rule 5 — the interact tier is a router, not a workspace                     */
/* -------------------------------------------------------------------------- */

/*
 * WHAT IS UNIFORM HERE IS THE FRAME, NOT THE CONTENTS.
 *
 * Silas, 2026-08-06, approving this pass: "it will be inevitably less
 * consistent across models, since that's where we are actually hitting 'what we
 * do with them uniquely'."
 *
 * That is the whole design constraint, and it makes this rule deliberately
 * different from Rule 4. The managers all do the SAME job, so they were made to
 * share one layout outright. The interacts do DIFFERENT jobs -- a Bot is
 * chatted with, a Reward is encountered, a Scenario is played -- so mandating a
 * shared shell there would be forcing a uniformity the domain does not have.
 *
 * What they can share is the frame:
 *
 *   <x-gallery v-if="!selected" />     <x-workspace v-else />
 *
 * dream-interact is 56 lines because both its markup and its logic live in
 * dream-workspace. reward-interact is 1096 because a complete encounter engine
 * -- tone controls, prompt preview, session chats, narrative turns, a hero
 * carousel -- sits in the router itself. Nothing about WHAT that engine does is
 * wrong; it is in the wrong file.
 *
 * So this rule asserts the frame (hard: the interact renders its own object's
 * gallery) and ratchets the router's SIZE (it may only shrink), rather than
 * mandating a component name or a layout. A model whose workspace genuinely
 * needs to be enormous can have that -- somewhere other than here.
 */

/* -------------------------------------------------------------------------- */
/* rule 3 — the shadow-browser rule                                            */
/* -------------------------------------------------------------------------- */

/*
 * A SECOND browser for the same object, on that object's own route.
 *
 * This rule exists because Rules 1 and 2 — and every gallery check that came
 * before them — key on components NAMED `*-gallery.vue`. A filename is not a
 * shape, and the gap is not hypothetical:
 *
 *   /facets shipped with TWO facet browsers. The Gallery tab went through
 *   facet-gallery -> kr-gallery and satisfied every existing assertion. The
 *   Library tab, inside facet-manager.vue, rendered its own
 *   `<article v-for="facet in filteredFacets">` card grid over all ~1611 rows,
 *   whose only click target expanded an editor INSIDE the grid cell and which
 *   linked to the canonical Facet profile from nowhere at all.
 *
 * Nothing named `*-gallery` was involved, so nothing saw it. Silas did, by eye,
 * after two automated passes reported the work finished.
 *
 * So this rule asks a structural question instead of a naming one: does a
 * component on this object's route READ the object's store and RENDER its
 * collection as a multi-column grid, without going through the shared shell?
 *
 * CANDIDATE, NOT VERDICT — the same framing verifyComponentReachability.ts
 * uses. A static read of a template cannot prove intent, and there are honest
 * reasons to draw a grid of an object that is not a rival browser. The ratchet
 * is what makes the number trustworthy: everything true today is recorded, and
 * a NEW one has to be justified by whoever added it.
 */

/** Elements that never take children, so they must not open a stack frame. */
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

export interface GridLoop {
  /** The expression iterated, e.g. `filteredFacets`. */
  source: string
  /** The class attribute(s) of the element CONTAINING the loop. */
  parentClass: string
}

/**
 * Every `v-for` in a template, paired with its parent element's classes.
 *
 * The parent is what matters: `<div class="grid md:grid-cols-2">` wrapping
 * `<article v-for=...>` is a gallery, and the same `v-for` inside
 * `<div class="grid gap-2">` is a single-column sidebar list. Both spellings
 * are live in this repo, which is why the grid class cannot be read off the
 * looping element itself.
 */
export function gridLoops(template: string): GridLoop[] {
  const found: GridLoop[] = []
  const stack: { tag: string; cls: string }[] = []

  // Attribute values may contain `>` (`:class="a > b ? x : y"`), so quoted
  // runs are consumed whole rather than stopping at the first bracket.
  const tagPattern =
    /<(\/?)([A-Za-z][\w.-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)(\/?)>/g

  for (const match of template.matchAll(tagPattern)) {
    const [, closing, rawTag, attributes = '', selfClosing] = match
    const tag = (rawTag ?? '').toLowerCase()

    if (closing) {
      for (let index = stack.length - 1; index >= 0; index -= 1) {
        if (stack[index]?.tag === tag) {
          stack.length = index
          break
        }
      }
      continue
    }

    // Static and bound classes both, so a grid declared through :class still
    // counts. Concatenating is enough — this is only ever pattern-matched.
    const cls = [...attributes.matchAll(/(?::|v-bind:)?class\s*=\s*"([^"]*)"/g)]
      .map((entry) => entry[1] ?? '')
      .join(' ')

    const loop = /(?:^|\s)v-for\s*=\s*"([^"]*)"/.exec(attributes)?.[1]
    if (loop) {
      const source = /\bin\s+([\w.?[\]()]+)/.exec(loop)?.[1]
      if (source) {
        found.push({ source, parentClass: stack[stack.length - 1]?.cls ?? '' })
      }
    }

    if (!selfClosing && !VOID_ELEMENTS.has(tag)) stack.push({ tag, cls })
  }

  return found
}

/**
 * Is this container a gallery grid rather than a list?
 *
 * A bare `grid` with only `gap-*` is a single column — dream-brainstorm's Dream
 * picker is exactly that, and it is a sidebar, not a second Dreams browser. It
 * takes an explicit column count, a responsive column bump, or an auto-fill
 * track list before a grid is showing a collection two-dimensionally.
 */
export function isMultiColumnGrid(cls: string): boolean {
  if (!/\bgrid\b/.test(cls) && !/grid-template-columns/.test(cls)) return false
  return (
    /grid-cols-(?:[2-9]|1[0-2])\b/.test(cls) ||
    /\b(?:sm|md|lg|xl|2xl):grid-cols-/.test(cls) ||
    /auto-fill|auto-fit/.test(cls)
  )
}

/**
 * Does `source` trace back to the object's store collection?
 *
 * Name-matching the loop source is not enough: `FACET_TAXONOMIES` contains
 * "facet" and is a `<select>`'s options, while `filteredFacets` is the browser.
 * The difference is only visible by following the definition —
 *
 *   filteredFacets -> visibleFacets -> facetStore.facets / .activeFacets
 *
 * — which is two hops in the real file, hence the bounded recursion. An
 * imported constant has no local `const` body, so it terminates immediately and
 * correctly reads as "not a collection".
 */
/**
 * The expression(s) a definition is BUILT FROM — its receivers.
 *
 * `const filteredFacets = computed(() => visibleFacets.value.filter(...))`
 *   -> visibleFacets.value
 * `const populatedTaxonomies = computed(() => FACET_TAXONOMIES.filter(...))`
 *   -> FACET_TAXONOMIES
 * `const visibleFacets = computed(() => flag ? store.facets : store.active)`
 *   -> store.facets, store.active   (a ternary has two, and the test is neither)
 *
 * Following the receiver rather than any mention is what separates a list of
 * the object from a list derived about it. facet-manager's replacement Library
 * tab renders a per-taxonomy COUNT, whose chain reaches facetStore.facets
 * inside a different computed's callback -- a "does it mention the collection"
 * test flags that as a second Facet browser, which it plainly is not.
 */
export function receiversOf(definition: string): string[] {
  let body = definition.trim()

  // Unwrap the reactive wrapper and any arrow head.
  body = body.replace(/^(?:computed|ref|shallowRef)\s*\(/, '').trim()
  body = body.replace(/^(?:\([^)]*\)|\w+)\s*=>\s*/, '').trim()

  // A block body: everything after the first top-level `return`.
  if (body.startsWith('{')) {
    const at = /\breturn\b/.exec(body)?.index
    if (at === undefined) return []
    body = body.slice(at + 'return'.length).trim()
  }

  const heads: string[] = []
  for (const part of splitTernary(body)) {
    const head = /^[([\s]*([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)/.exec(
      part.trim(),
    )?.[1]
    if (head) heads.push(head)
  }
  return heads
}

/**
 * A ternary's two branches, or the whole expression when it is not one.
 *
 * DEPTH-AWARE, and that is the whole point. A regex `?`-split matched inside
 * the filter callback of facet-manager's real `filteredFacets` —
 *
 *   return visibleFacets.value.filter((facet) => {
 *     ... facet.metadata ? JSON.stringify(facet.metadata) : '' ...
 *   })
 *
 * — and returned `JSON.stringify` as the receiver, which resolves to nothing
 * and quietly stopped the rule detecting the very grid it was written for.
 * Only a `?` at bracket depth zero starts a ternary; `?.` and `??` never do.
 */
export function splitTernary(expression: string): string[] {
  let depth = 0
  let quote: string | null = null

  for (let index = 0; index < expression.length; index += 1) {
    const char = expression[index] as string

    if (quote) {
      if (char === '\\') index += 1
      else if (char === quote) quote = null
      continue
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char
      continue
    }
    if (char === '(' || char === '[' || char === '{') depth += 1
    else if (char === ')' || char === ']' || char === '}') depth -= 1
    else if (char === '?' && depth === 0) {
      const next = expression[index + 1]
      if (next === '.' || next === '?') {
        index += 1
        continue
      }
      const colon = matchingColon(expression, index + 1)
      if (colon === -1) break
      return [expression.slice(index + 1, colon), expression.slice(colon + 1)]
    }
  }
  return [expression]
}

/** The `:` that closes a ternary opened at `from`, at the same depth. */
function matchingColon(expression: string, from: number): number {
  let depth = 0
  let nested = 0
  for (let index = from; index < expression.length; index += 1) {
    const char = expression[index]
    if (char === '(' || char === '[' || char === '{') depth += 1
    else if (char === ')' || char === ']' || char === '}') depth -= 1
    else if (char === '?' && depth === 0) nested += 1
    else if (char === ':' && depth === 0) {
      if (nested === 0) return index
      nested -= 1
    }
  }
  return -1
}

/**
 * Does `source` trace back to the object's store collection?
 *
 * Name-matching the loop source is not enough: `FACET_TAXONOMIES` contains
 * "facet" and is a <select>'s options, while `filteredFacets` is the browser.
 * The difference is only visible by following the definition —
 *
 *   filteredFacets -> visibleFacets -> facetStore.facets / .activeFacets
 *
 * — which is two hops in the real file, hence the bounded recursion. An
 * imported constant has no local `const` body, so it terminates immediately and
 * correctly reads as "not a collection".
 */
export function resolvesToCollection(
  source: string,
  script: string,
  collection: RegExp,
  depth = 0,
): boolean {
  if (depth > 4) return false
  if (collection.test(source)) return true

  const identifier = source.split(/[.?[(]/)[0]
  if (!identifier) return false

  // The definition runs until the next top-level declaration or comment.
  const definition = new RegExp(
    `\\b(?:const|let|var)\\s+${identifier}\\s*=\\s*([\\s\\S]*?)(?=\\n(?:const|let|var|function|async|export|/\\*|//)\\b|$)`,
  ).exec(script)?.[1]
  if (!definition) return false

  for (const receiver of receiversOf(definition)) {
    if (collection.test(receiver)) return true

    const next = receiver.replace(/\.value$/, '')
    if (next === identifier) continue
    if (resolvesToCollection(next, script, collection, depth + 1)) return true
  }
  return false
}

/* -------------------------------------------------------------------------- */
/* rule 2 — one route per core object, and it renders that object's gallery    */
/* -------------------------------------------------------------------------- */

/*
 * The seven core objects and the single route each one lives at.
 *
 * This is the list DESIGN-BRIEF.md's beta gate ("all seven core objects share
 * one gallery") is actually about, expressed as something a user can check by
 * visiting a URL. Moving an object to a new route means editing this map --
 * which is the point: the edit is where somebody notices an object just grew a
 * second front door.
 */
/**
 * Components on this object's route that draw its collection as a multi-column
 * grid without going through the shared shell.
 *
 * The canonical gallery is excluded by name, and so is anything that mounts
 * kr-gallery — a component that already delegates to the shell is by definition
 * not a rival to it.
 */
export function shadowBrowsers(
  subtree: Iterable<string>,
  core: CoreObject,
  sourceOf: (name: string) => string | null,
): string[] {
  const found: string[] = []
  for (const name of subtree) {
    if (name === core.gallery || name === SHARED_GALLERY) continue

    const source = sourceOf(name)
    if (!source) continue

    const template = templateOf(source)
    if (mountsKrGallery(source)) continue

    const script = scriptOf(source)
    const drawsCollection = gridLoops(template).some(
      (loop) =>
        isMultiColumnGrid(loop.parentClass) &&
        resolvesToCollection(loop.source, script, core.collection),
    )
    if (drawsCollection) found.push(name)
  }
  return found.sort((a, b) => a.localeCompare(b))
}

/* -------------------------------------------------------------------------- */
/* self-test                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * A ratchet only ever seen to pass is indistinguishable from one that cannot
 * fail, so every assertion below is watched to fail under mutation before it is
 * believed. The cases that matter are the SILENT ones: a CSS class read as a
 * mount, and a holdout that quietly spread to another route.
 */
function selfTest(): void {
  const fail = (message: string): never => {
    throw new Error(message)
  }

  // --- mountsKrGallery -----------------------------------------------------
  const mounts: [string, boolean][] = [
    ['<template><kr-gallery :items="x" /></template>', true],
    ['<template><KrGallery :items="x" /></template>', true],
    ['<template><LazyKrGallery :items="x" /></template>', true],
    ['<template><lazy-kr-gallery :items="x" /></template>', true],
    ['<template><kr-gallery></kr-gallery></template>', true],
    // The live false positive this check exists for.
    ['<template><div class="kr-gallery h-full" /></template>', false],
    // A doc comment naming the component is documentation, not adoption.
    ['<template><!-- extracted from kr-gallery --><div /></template>', false],
    // So is a script-block type import.
    [
      "<script setup>import type { GalleryItem } from '@/components/gallery/kr-gallery.vue'</script><template><div /></template>",
      false,
    ],
    // Prefix collisions must not read as the shared shell.
    ['<template><kr-gallery-header /></template>', false],
  ]
  for (const [source, expected] of mounts) {
    if (mountsKrGallery(source) !== expected) {
      fail(
        `mountsKrGallery(${JSON.stringify(source)}) = ${!expected}, expected ${expected}`,
      )
    }
  }

  // The generalised matcher must keep the same discipline for kr-manager: a
  // manager that merely mentions the shell in a comment has not adopted it.
  if (
    !mountsComponent(
      '<template><kr-manager :loading="x" /></template>',
      'kr-manager',
    )
  ) {
    fail('mountsComponent must match the kebab tag')
  }
  if (!mountsComponent('<template><KrManager /></template>', 'kr-manager')) {
    fail('mountsComponent must match the Pascal tag')
  }
  if (
    mountsComponent(
      '<template><div class="kr-manager" /></template>',
      'kr-manager',
    )
  ) {
    fail('a class named kr-manager must NOT count as a mount')
  }
  if (
    mountsComponent('<template><kr-manager-header /></template>', 'kr-manager')
  ) {
    fail('a longer tag sharing the prefix must NOT count as a mount')
  }

  // --- subtreeOf -----------------------------------------------------------
  const graph: Record<string, string[]> = {
    'facet-manager': ['facet-interact'],
    'facet-interact': ['facet-gallery'],
    'facet-gallery': [],
    'lonely-gallery': [],
    // A cycle must terminate rather than hang.
    'a-loop': ['b-loop'],
    'b-loop': ['a-loop'],
  }
  const children = (name: string): string[] => graph[name] ?? []

  const facets = subtreeOf(['facet-manager'], children)
  if (!facets.has('facet-gallery')) {
    fail('subtreeOf must follow manager -> interact -> gallery transitively')
  }
  if (facets.has('lonely-gallery')) {
    fail('subtreeOf must not reach a component nothing renders')
  }
  if (!subtreeOf(['a-loop'], children).has('b-loop')) {
    fail('subtreeOf must handle cycles without losing a node')
  }

  // --- bucketHoldouts ------------------------------------------------------
  const sample = [
    {
      route: '/achievements',
      galleries: ['achievement-gallery', 'bot-gallery'],
    },
    { route: '/dashboard', galleries: ['achievement-gallery'] },
    { route: '/bots', galleries: ['bot-gallery'] },
  ]
  const adopted = (name: string): boolean => name === 'bot-gallery'
  const buckets = bucketHoldouts(sample, adopted)

  if (
    JSON.stringify(buckets) !==
    JSON.stringify({ 'achievement-gallery': ['/achievements', '/dashboard'] })
  ) {
    fail(`bucketHoldouts mismatch: ${JSON.stringify(buckets)}`)
  }
  if (totalHoldouts(buckets) !== 1) {
    fail(`totalHoldouts = ${totalHoldouts(buckets)}, expected 1`)
  }

  // A holdout spreading to one more route must read as growth.
  if (
    !grownRatchetBuckets(buckets, {
      'achievement-gallery': ['/achievements'],
    }).includes('achievement-gallery')
  ) {
    fail('a holdout gaining a route must count as growth')
  }
  // A brand-new hand-rolled gallery has no baseline bucket, which must read as
  // growth rather than being waved through.
  if (!grownRatchetBuckets(buckets, {}).includes('achievement-gallery')) {
    fail('a bucket absent from the baseline must count as growth')
  }
  // Adoption (bucket gone) and shrinkage must both pass.
  if (
    grownRatchetBuckets(buckets, {
      'achievement-gallery': ['/achievements', '/dashboard', '/themes'],
    }).length
  ) {
    fail('shrinking must not fail')
  }

  // --- rule 3: gridLoops ---------------------------------------------------
  // Both spellings below are live in this repo, and telling them apart is the
  // whole job: the first is the Facets Library browser, the second is the Dream
  // picker in a sidebar.
  const facetsLibrary = `<template>
    <div class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      <article v-for="facet in filteredFacets" :key="facet.id"><img src="x" /></article>
    </div>
  </template>`
  const dreamPicker = `<template>
    <div class="kr-pane-scroll p-2">
      <div v-if="filteredDreams.length" class="grid gap-2">
        <button v-for="dream in filteredDreams" :key="dream.id" type="button" />
      </div>
    </div>
  </template>`

  const libraryLoops = gridLoops(facetsLibrary)
  if (
    libraryLoops.length !== 1 ||
    libraryLoops[0]?.source !== 'filteredFacets'
  ) {
    fail(`gridLoops missed the library loop: ${JSON.stringify(libraryLoops)}`)
  }
  if (!isMultiColumnGrid(libraryLoops[0]?.parentClass ?? '')) {
    fail('a md:grid-cols-2 parent must read as a multi-column grid')
  }

  const pickerLoops = gridLoops(dreamPicker)
  if (pickerLoops.length !== 1) {
    fail(`gridLoops mismatch on the picker: ${JSON.stringify(pickerLoops)}`)
  }
  if (isMultiColumnGrid(pickerLoops[0]?.parentClass ?? '')) {
    fail(
      'a bare `grid gap-2` is a single column and must NOT read as a gallery',
    )
  }

  // A void element must not swallow the following siblings into its stack
  // frame, or every later loop reports the wrong parent.
  const afterVoid = gridLoops(`<template>
    <div class="grid md:grid-cols-2">
      <img src="a">
      <article v-for="x in things" />
    </div>
  </template>`)
  if (!isMultiColumnGrid(afterVoid[0]?.parentClass ?? '')) {
    fail('an unclosed <img> must not break parent tracking')
  }

  // --- rule 3: resolvesToCollection ----------------------------------------
  // Two hops, exactly as facet-manager.vue defines it.
  const facetScript = `
    const showArchived = ref(false)
    const visibleFacets = computed(() =>
      showArchived.value ? facetStore.facets : facetStore.activeFacets,
    )
    const filteredFacets = computed(() => {
      const needle = normalizeFacetLookupKey(search.value)
      return visibleFacets.value.filter((facet) => !needle || match(facet))
    })
  `
  const facetCollection = /facetStore\.\w*[Ff]acets\b|catalog\.entries\b/
  if (!resolvesToCollection('filteredFacets', facetScript, facetCollection)) {
    fail('filteredFacets must resolve through visibleFacets to facetStore')
  }
  // The trap this function exists for: a name containing the object, that is an
  // imported constant of <select> options rather than a collection.
  if (resolvesToCollection('FACET_TAXONOMIES', facetScript, facetCollection)) {
    fail('an imported constant must NOT resolve to the store collection')
  }
  if (resolvesToCollection('search', facetScript, facetCollection)) {
    fail('an unrelated local must NOT resolve to the store collection')
  }
  // Self-reference must terminate rather than recurse forever.
  if (
    resolvesToCollection(
      'loop',
      'const loop = computed(() => loop.value)',
      facetCollection,
    )
  ) {
    fail('a self-referential computed must terminate as unresolved')
  }

  // --- rule 3: splitTernary / receiversOf ----------------------------------
  /*
   * The case that silently broke this rule once already. A regex `?`-split
   * found the ternary INSIDE the filter callback and returned JSON.stringify
   * as the receiver, so the detector stopped seeing the exact grid it exists
   * for -- while still reporting a clean pass.
   */
  const nested = `computed(() => {
    const needle = normalize(search.value)
    return visibleFacets.value.filter((facet) => {
      const values = [facet.title, facet.metadata ? JSON.stringify(facet.metadata) : '']
      return values.some((value) => value.includes(needle))
    })
  })`
  if (
    JSON.stringify(receiversOf(nested)) !==
    JSON.stringify(['visibleFacets.value.filter'])
  ) {
    fail(
      `a ternary inside a callback must not become the receiver: ${JSON.stringify(receiversOf(nested))}`,
    )
  }

  // A real top-level ternary still yields BOTH branches, never the test.
  const branches = receiversOf(
    'computed(() => showArchived.value ? facetStore.facets : facetStore.activeFacets)',
  )
  if (
    JSON.stringify(branches) !==
    JSON.stringify(['facetStore.facets', 'facetStore.activeFacets'])
  ) {
    fail(`ternary branches mismatch: ${JSON.stringify(branches)}`)
  }
  // Optional chaining and nullish coalescing are not ternaries.
  if (splitTernary('store?.facets ?? []').length !== 1) {
    fail('?. and ?? must not read as a ternary')
  }
  // An aggregate built from a constant does not resolve to the collection,
  // which is what keeps a per-taxonomy count grid from reading as a browser.
  const aggregate = `
    const taxonomyCounts = computed(() => {
      const counts = {}
      for (const facet of facetStore.facets) counts[facet.taxonomy] = 1
      return counts
    })
    const populatedTaxonomies = computed(() =>
      FACET_TAXONOMIES.filter((taxonomy) => taxonomyCounts.value[taxonomy]),
    )
  `
  if (resolvesToCollection('populatedTaxonomies', aggregate, facetCollection)) {
    fail('a list derived from a CONSTANT must not resolve to the collection')
  }

  // --- rule 3: shadowBrowsers ----------------------------------------------
  const sources: Record<string, string> = {
    'facet-manager': `${facetsLibrary}<script setup>${facetScript}</script>`,
    'facet-gallery': `${facetsLibrary}<script setup>${facetScript}</script>`,
    'dream-brainstorm': `${dreamPicker}<script setup>${facetScript}</script>`,
    'facet-interact': `<template><kr-gallery :items="x" /></template><script setup>${facetScript}</script>`,
  }
  const facetCore = CORE_OBJECT_ROUTES.find((entry) => entry.object === 'facet')
  if (!facetCore) fail('the facet core-object entry went missing')

  const shadows = shadowBrowsers(
    Object.keys(sources),
    facetCore as CoreObject,
    (name) => sources[name] ?? null,
  )
  if (JSON.stringify(shadows) !== JSON.stringify(['facet-manager'])) {
    fail(`shadowBrowsers mismatch: ${JSON.stringify(shadows)}`)
  }
  // Each exclusion, checked on its own so a single over-broad rule cannot hide
  // behind the others passing.
  if (shadows.includes('facet-gallery')) {
    fail('the canonical gallery must be excluded by name')
  }
  if (shadows.includes('facet-interact')) {
    fail('a component that mounts kr-gallery is not a rival browser')
  }
  if (shadows.includes('dream-brainstorm')) {
    fail('a single-column picker must not be reported as a browser')
  }

  console.log('✅ verifyRouteGalleryContract self-test passed.')
}

/* -------------------------------------------------------------------------- */
/* main                                                                        */
/* -------------------------------------------------------------------------- */

function main(): void {
  if (process.argv.includes('--self-test')) {
    selfTest()
    return
  }
  selfTest()

  const update = process.argv.includes('--update')
  let failures = 0

  const adoptionCache = new Map<string, boolean>()
  const adopted = (name: string): boolean => {
    const cached = adoptionCache.get(name)
    if (cached !== undefined) return cached
    const file = componentsByName.get(name)
    const result = file ? mountsKrGallery(readFileSync(file, 'utf8')) : false
    adoptionCache.set(name, result)
    return result
  }

  const routes = contentRoutes().map(({ route, mounts }) => {
    const subtree = subtreeOf(mounts, childComponents)
    return {
      route,
      mounts,
      subtree,
      galleries: [...subtree].filter(isGalleryComponent).sort(),
    }
  })

  // --- rule 2, first: it is the hard one -----------------------------------
  console.log(
    'Core-object routes — one route per object, rendering that object’s gallery:',
  )
  for (const { object, route, gallery } of CORE_OBJECT_ROUTES) {
    const entry = routes.find((candidate) => candidate.route === route)

    if (!entry) {
      failures += 1
      console.error(
        `FAIL - ${route} has no content page (the ${object} route moved or was deleted)`,
      )
      continue
    }
    if (!entry.subtree.has(gallery)) {
      failures += 1
      console.error(
        `FAIL - ${route} mounts ${entry.mounts.join(', ')} but never reaches ${gallery}` +
          ' — the route a user lands on for this object renders no gallery',
      )
      continue
    }
    if (!adopted(gallery)) {
      failures += 1
      console.error(
        `FAIL - ${route} reaches ${gallery}, but ${gallery} does not mount ${SHARED_GALLERY}`,
      )
      continue
    }
    console.log(`ok   - ${route.padEnd(12)} → ${gallery}`)
  }

  const routesByGallery = new Map<string, string[]>()
  for (const { route, galleries } of routes) {
    for (const gallery of galleries) {
      routesByGallery.set(gallery, [
        ...(routesByGallery.get(gallery) ?? []),
        route,
      ])
    }
  }

  // --- rule 3 ---------------------------------------------------------------
  const readSource = (name: string): string | null => {
    const file = componentsByName.get(name)
    return file ? readFileSync(file, 'utf8') : null
  }

  const shadows: RatchetEntries = {}
  for (const core of CORE_OBJECT_ROUTES) {
    const entry = routes.find((candidate) => candidate.route === core.route)
    if (!entry) continue
    for (const name of shadowBrowsers(entry.subtree, core, readSource)) {
      shadows[name] = [...new Set([...(shadows[name] ?? []), core.route])].sort(
        (a, b) => a.localeCompare(b),
      )
    }
  }

  // --- rule 4 ---------------------------------------------------------------
  /*
   * The tab managers on the shared shell.
   *
   * This is the rule that makes Rule 3 mostly redundant, and that is the point:
   * a free-form manager always has somewhere to hand-roll a rival grid, so the
   * durable fix is a layout with no free space in it rather than a heuristic
   * that hunts for strays. Ratcheted while facet-manager still carries its
   * Library grid; hard once it does not.
   */
  const managers: RatchetEntries = {}
  for (const name of TAB_MANAGERS) {
    const source = readSource(name)
    if (!source) {
      failures += 1
      console.error(
        `FAIL - ${name}.vue is missing (rename it in TAB_MANAGERS if it moved)`,
      )
      continue
    }
    if (!mountsComponent(source, SHARED_MANAGER)) managers[name] = ['off-shell']
  }

  // --- rule 5 ---------------------------------------------------------------
  const interactLines: Record<string, number> = {}
  for (const core of CORE_OBJECT_ROUTES) {
    const name = `${core.object}-interact`
    const file = componentsByName.get(name)
    if (!file) continue

    const source = readFileSync(file, 'utf8')
    interactLines[name] = source.split('\n').length

    if (!mountsComponent(source, core.gallery)) {
      failures += 1
      console.error(
        `FAIL - ${name} does not mount ${core.gallery}. The interact tier is the` +
          ` browse-until-you-pick-one frame; without its gallery there is nothing to pick from.`,
      )
    }
  }

  // --- rule 1 ---------------------------------------------------------------
  const buckets = bucketHoldouts(routes, adopted)
  const total = totalHoldouts(buckets)
  const baseline = loadRatchetBaseline<RouteGalleryBaseline>(BASELINE)
  const grown = grownRatchetBuckets(buckets, baseline?.holdouts ?? null)

  const liveGalleries = new Set(routes.flatMap((entry) => entry.galleries))
  console.log(
    `\nLive galleries on ${SHARED_GALLERY}: ` +
      `${liveGalleries.size - total}/${liveGalleries.size}` +
      `${ratchetDelta(total, baseline?.total)}`,
  )
  for (const gallery of [...liveGalleries].sort()) {
    const where = routesByGallery.get(gallery) ?? []
    console.log(
      `  ${adopted(gallery) ? '✓' : '·'} ${gallery.padEnd(32)} ${where.join(' ')}`,
    )
  }

  const shadowCount = Object.keys(shadows).length
  const grownShadows = grownRatchetBuckets(shadows, baseline?.shadows ?? null)

  console.log(
    `\nShadow browsers — a second grid of the object on its own route:` +
      ` ${shadowCount}${ratchetDelta(shadowCount, baseline?.shadowTotal)}`,
  )
  if (!shadowCount) {
    console.log('  (none — each core object has exactly one browser)')
  }
  for (const [name, where] of Object.entries(shadows).sort()) {
    const file = componentsByName.get(name)
    console.log(
      `  ⚠ ${name.padEnd(28)} ${where.join(' ')}` +
        `${file ? `  (${rel(file)})` : ''}`,
    )
  }

  const grownInteracts = Object.entries(interactLines).filter(
    ([name, lines]) => lines > (baseline?.interactLines?.[name] ?? Infinity),
  )

  console.log('\nCore-object interacts — routers, not workspaces:')
  for (const [name, lines] of Object.entries(interactLines).sort()) {
    const was = baseline?.interactLines?.[name]
    console.log(
      `  ${String(lines).padStart(5)} lines  ${name}${ratchetDelta(lines, was)}`,
    )
  }

  const managerCount = Object.keys(managers).length
  const grownManagers = grownRatchetBuckets(
    managers,
    baseline?.managers ?? null,
  )

  console.log(
    `\nTab managers on ${SHARED_MANAGER}: ` +
      `${TAB_MANAGERS.length - managerCount}/${TAB_MANAGERS.length}` +
      `${ratchetDelta(managerCount, baseline?.managerTotal)}`,
  )
  for (const name of TAB_MANAGERS) {
    console.log(`  ${managers[name] ? '·' : '✓'} ${name}`)
  }

  if (update) {
    const regressed = [
      ...grown,
      ...grownShadows,
      ...grownManagers,
      ...grownInteracts.map(([name]) => name),
    ]
    if (regressed.length) {
      console.error(
        `\n--update refuses to record growth. These got worse than the baseline:\n` +
          regressed.map((key) => `  ${key}`).join('\n'),
      )
      process.exitCode = 1
      return
    }
    writeRatchetBaseline(BASELINE, {
      note: ratchetNote('Route gallery', SCRIPT),
      recorded: ratchetRecordedAt(),
      total,
      holdouts: buckets,
      shadowTotal: shadowCount,
      shadows,
      managerTotal: managerCount,
      managers,
      interactLines,
    })
    console.log(
      `\nRecorded ${total} holdout gallery/galleries and ${shadowCount} shadow browser(s) to ${BASELINE}.`,
    )
    return
  }

  if (grown.length) {
    failures += grown.length
    console.error(
      `\nFAIL - ${grown.length} gallery/galleries got WORSE since the baseline:`,
    )
    for (const key of grown) {
      const was = baseline?.holdouts?.[key] ?? []
      const now = buckets[key] ?? []
      console.error(
        `  ${key}: ${was.length ? was.join(' ') : '(not in baseline)'} → ${now.join(' ')}`,
      )
    }
    console.error(
      `\nEither mount <${SHARED_GALLERY}> in it, or — if this is a brand-new gallery —` +
        ` build it on the shared shell in the first place.`,
    )
  }

  if (grownShadows.length) {
    failures += grownShadows.length
    console.error(
      `\nFAIL - ${grownShadows.length} NEW shadow browser(s) — a second grid of an` +
        ` object on the route that already has a gallery:`,
    )
    for (const key of grownShadows) {
      const was = baseline?.shadows?.[key] ?? []
      const now = shadows[key] ?? []
      console.error(
        `  ${key}: ${was.length ? was.join(' ') : '(not in baseline)'} → ${now.join(' ')}`,
      )
    }
    console.error(
      `\nThis is how /facets ended up with two Facet browsers, one of which linked` +
        ` to the canonical profile from nowhere. Route the grid through <${SHARED_GALLERY}>,` +
        ` or hand selection to the object's gallery instead of drawing a rival one.`,
    )
  }

  if (grownManagers.length) {
    failures += grownManagers.length
    console.error(
      `\nFAIL - ${grownManagers.length} manager(s) came OFF the shared shell:\n` +
        grownManagers.map((key) => `  ${key}`).join('\n') +
        `\n\nA manager that owns its own frame is where the next rival grid goes.` +
        ` Wrap it in <${SHARED_MANAGER}> and put each tab in a slot.`,
    )
  }

  if (grownInteracts.length) {
    failures += grownInteracts.length
    console.error(
      `\nFAIL - ${grownInteracts.length} interact(s) GREW. The router is where the` +
        ` frame lives; model-specific work belongs in a workspace component:`,
    )
    for (const [name, lines] of grownInteracts) {
      console.error(
        `  ${name}: ${baseline?.interactLines?.[name] ?? '(not in baseline)'} → ${lines} lines`,
      )
    }
  }

  if (failures) {
    console.error(`\nRoute gallery contract failed with ${failures} error(s).`)
    process.exitCode = 1
    return
  }

  console.log(
    `\nRoute gallery contract passed. Every core object has one route, that route` +
      ` renders its gallery, and no live gallery drifted off the shared shell.` +
      `\nThe ${total} holdout(s) and ${shadowCount} shadow browser(s) above are recorded` +
      ` in the baseline and may only shrink: ${SCRIPT} --update`,
  )
}

main()
