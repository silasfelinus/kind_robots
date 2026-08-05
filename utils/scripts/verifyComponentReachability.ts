// /utils/scripts/verifyComponentReachability.ts
//
// Which components can the app actually reach?
//
// Silas, 2026-08-05: "if a component is truly orphaned, we should move it to
// abandonware, which includes components that just refer to each other. if it
// isn't referenced by something in content as an md or app.vue, it is likely
// orphaned."
//
// WHY A GREP IS NOT ENOUGH. "Is anything referencing this file?" has the wrong
// shape. model-gallery referenced model-card, which referenced lora-card — all
// three looked referenced, and all three were dead, because nothing reachable
// referenced model-gallery. Only a TRAVERSAL from the real entry points can
// tell a live chain from a closed loop that happens to cite itself.
//
// THE ROOT SET is what the app boots or routes into: app.vue, error.vue,
// layouts/, pages/, and the `:component` MDC mounts inside content/*.md. Every
// component reachable from those by following template references is live.
// Everything else is a candidate for components/abandonware/.
//
// PLUS ONE ROOT THAT IS NOT A TEMPLATE: a directory-local `import.meta.glob`.
// components/screenfx/effect-component-registry.ts globs `./*.vue` and mounts
// the result by name from stores/animationCatalog — so all 47 screenfx effects
// are live while no template names any of them. A glob like that IS the
// declaration "everything in this folder is mountable", and honouring it is the
// difference between a 132-orphan report and an 85-orphan one that is true.
//
// Only SINGLE-DIRECTORY globs count. A `**` glob is a catalog, not a mount
// point — the museum's own `@/components/**/*.vue` would otherwise make the
// entire tree reachable and the check could only ever report zero.
//
// WHY THIS REPORTS RATHER THAN FAILS. Static traversal cannot see every edge:
//
//   - `<component :is="someName">` resolves at runtime.
//   - resolveComponent('Foo') and registry-driven mounts take string names.
//   - plugins/*.client.ts address components by CSS selector, not by import.
//
// So an unreachable component is a CANDIDATE, not a verdict — every removal
// still wants a human look. The ratchet keeps the number honest: it may shrink
// freely, and growth is a new orphan someone just created.
//
//   npx tsx utils/scripts/verifyComponentReachability.ts
//   npx tsx utils/scripts/verifyComponentReachability.ts --update
//   npx tsx utils/scripts/verifyComponentReachability.ts --self-test
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, resolve, basename, relative } from 'node:path'
import {
  grownRatchetBuckets,
  loadRatchetBaseline,
  ratchetDelta,
  ratchetNote,
  ratchetRecordedAt,
  writeRatchetBaseline,
} from './ratchetBaseline'

const root = process.cwd()
const BASELINE = resolve(root, 'utils/scripts/component-reachability-baseline.json')
const SCRIPT = 'utils/scripts/verifyComponentReachability.ts'

/** Parked components are deliberately unreachable — that is what parking means. */
const PARKED_SEGMENT = 'abandonware'

/**
 * The museum mounts EVERY component through `import.meta.glob`, so traversing
 * out of it would make the whole tree look reachable and the check would only
 * ever report zero. Being exhibited is not being used.
 */
const MUSEUM_MOUNTS_EVERYTHING = 'components/wonderlab/wonderlab-preview-host.vue'

/**
 * One key per component regardless of how a template spells it: Nuxt registers
 * `lora-card.vue` so that both `<lora-card>` and `<LoraCard>` resolve to it.
 */
export function componentKey(name: string): string {
  return name.replace(/[-_]/g, '').toLowerCase()
}

/**
 * The key(s) a template tag can mean.
 *
 * Nuxt registers every auto-imported component a second time under a `Lazy`
 * prefix, so `<LazyWorkspaceNarrator>` mounts workspace-narrator.vue. Missing
 * that parked the narrator dock and the narrator stage — both demonstrably live
 * in Dreams, Storybook and Taskmaster — on the first run.
 *
 * BOTH keys are returned, never just the stripped one: a component genuinely
 * named `LazyLoader` must not be read as a reference to `loader.vue`.
 */
function tagKeys(name: string): string[] {
  const key = componentKey(name)
  const unlazied = /^lazy./.test(key) ? key.slice(4) : null
  return unlazied ? [key, unlazied] : [key]
}

/** Every component tag a file mentions, in either casing. */
export function referencedComponentKeys(source: string): Set<string> {
  const keys = new Set<string>()

  // Opening tags: <foo-bar, <FooBar. Native/HTML tags are all-lowercase with no
  // dash, so requiring a dash OR a capital keeps them out.
  for (const match of source.matchAll(/<([A-Za-z][A-Za-z0-9]*(?:-[A-Za-z0-9]+)+|[A-Z][A-Za-z0-9]*)\b/g)) {
    for (const key of tagKeys(match[1] as string)) keys.add(key)
  }

  // resolveComponent('Foo') / component: 'foo-bar' — string-addressed mounts.
  for (const match of source.matchAll(/resolveComponent\(\s*['"]([^'"]+)['"]/g)) {
    for (const key of tagKeys(match[1] as string)) keys.add(key)
  }

  // Explicit `.vue` imports. Auto-import means most components are never
  // imported by path, so it is easy to forget these exist — but stage-manager
  // imports its three cards this way, and a first pass without this rule parked
  // all three and broke the typecheck. Type-only imports count too: they are
  // not a runtime edge, but the file still cannot leave the build surface.
  // Static (`from '…'`) and dynamic (`import('…')`) alike — animation-loader
  // reaches four effects through the latter.
  for (const match of source.matchAll(/(?:from|import)\s*\(?\s*['"]([^'"]+\.vue)['"]/g)) {
    keys.add(componentKey(basename(match[1] as string, '.vue')))
  }

  return keys
}

/**
 * Directory-local `import.meta.glob` patterns in a source file, as repo-relative
 * directory paths.
 *
 * `import.meta.glob('./*.vue')` inside components/screenfx/ yields
 * `components/screenfx`. Recursive `**` patterns are deliberately ignored — see
 * the header note; a whole-tree glob catalogues components, it does not mount
 * them.
 */
export function globMountDirs(source: string, fileDir: string): Set<string> {
  const dirs = new Set<string>()

  for (const match of source.matchAll(/import\.meta\.glob[^(]*\(\s*['"]([^'"]+)['"]/g)) {
    const pattern = match[1] as string
    if (pattern.includes('**')) continue
    if (!pattern.endsWith('.vue')) continue

    // Drop the filename segment; keep the directory the pattern points at.
    const dir = pattern.split('/').slice(0, -1).join('/') || '.'
    const resolved = dir.startsWith('@/')
      ? dir.slice(2)
      : dir.startsWith('~/')
        ? dir.slice(2)
        : join(fileDir, dir)

    dirs.add(resolved.replace(/\\/g, '/').replace(/^\.\//, ''))
  }

  return dirs
}

/** `:component-name` and `::component-name` MDC mounts in a content file. */
export function mdcMountKeys(markdown: string): Set<string> {
  const keys = new Set<string>()
  for (const match of markdown.matchAll(/^:{1,3}([a-z0-9][a-z0-9-]*)/gm)) {
    keys.add(componentKey(match[1] as string))
  }
  return keys
}

function walk(dir: string, test: (f: string) => boolean, out: string[] = []): string[] {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, test, out)
    else if (test(entry)) out.push(full)
  }
  return out
}

const isVue = (f: string) => f.endsWith('.vue')
const isMd = (f: string) => f.endsWith('.md')
const isSource = (f: string) =>
  (f.endsWith('.vue') || f.endsWith('.ts') || f.endsWith('.js')) &&
  !f.endsWith('.d.ts')

/* ------------------------------------------------------------------------ */

type Graph = {
  /** component key -> repo-relative path */
  files: Map<string, string>
  /** component key -> keys it references */
  edges: Map<string, Set<string>>
}

function buildGraph(): Graph {
  const files = new Map<string, string>()
  const edges = new Map<string, Set<string>>()

  for (const abs of walk(resolve(root, 'components'), isVue)) {
    const rel = relative(root, abs).replace(/\\/g, '/')
    if (rel.split('/').includes(PARKED_SEGMENT)) continue

    const key = componentKey(basename(rel, '.vue'))
    files.set(key, rel)
    edges.set(
      key,
      rel === MUSEUM_MOUNTS_EVERYTHING
        ? new Set<string>()
        : referencedComponentKeys(readFileSync(abs, 'utf8')),
    )
  }

  return { files, edges }
}

function rootKeys(): Set<string> {
  const keys = new Set<string>()

  // Entry points and routes.
  for (const entry of ['app.vue', 'error.vue']) {
    const abs = resolve(root, entry)
    if (existsSync(abs)) {
      for (const key of referencedComponentKeys(readFileSync(abs, 'utf8'))) keys.add(key)
    }
  }
  for (const dir of ['pages', 'layouts']) {
    for (const abs of walk(resolve(root, dir), isVue)) {
      for (const key of referencedComponentKeys(readFileSync(abs, 'utf8'))) keys.add(key)
    }
  }

  // Content pages mount a component by name.
  for (const abs of walk(resolve(root, 'content'), isMd)) {
    for (const key of mdcMountKeys(readFileSync(abs, 'utf8'))) keys.add(key)
  }

  return keys
}

/**
 * Component keys mounted by a directory-local `import.meta.glob` registry.
 *
 * Scanned across the source tree rather than just components/, because the
 * registry is often a plain .ts module sitting next to the components it mounts
 * (screenfx) or one directory up.
 */
function globMountedKeys(files: Map<string, string>): Set<string> {
  const dirs = new Set<string>()

  for (const dir of ['components', 'composables', 'stores', 'utils', 'plugins']) {
    for (const abs of walk(resolve(root, dir), isSource)) {
      const rel = relative(root, abs).replace(/\\/g, '/')
      if (rel === MUSEUM_MOUNTS_EVERYTHING) continue
      if (rel.split('/').includes(PARKED_SEGMENT)) continue

      const source = readFileSync(abs, 'utf8')
      if (!source.includes('import.meta.glob')) continue
      for (const mounted of globMountDirs(source, rel.split('/').slice(0, -1).join('/'))) {
        dirs.add(mounted)
      }
    }
  }

  const keys = new Set<string>()
  for (const [key, rel] of files) {
    if (dirs.has(rel.split('/').slice(0, -1).join('/'))) keys.add(key)
  }
  return keys
}

/** Everything reachable from `roots` by following template references. */
export function reachableFrom(roots: Set<string>, edges: Map<string, Set<string>>): Set<string> {
  const seen = new Set<string>()
  const queue = [...roots]

  while (queue.length) {
    const key = queue.pop() as string
    if (seen.has(key)) continue
    seen.add(key)
    for (const next of edges.get(key) ?? []) {
      if (!seen.has(next)) queue.push(next)
    }
  }

  return seen
}

/* ------------------------------------------------------------------------ */

/**
 * Every import inside a parked component must still resolve.
 *
 * Parking moves a file one directory deeper, which silently breaks any
 * `./../../stores/x` that was correct at the old depth — and nothing else
 * catches it. tsconfig excludes components/abandonware/, so vue-tsc is blind
 * here by design, and the museum's glob means Vite compiles these files anyway,
 * so a stale specifier is a hard `nuxt build` failure rather than a dead file
 * nobody notices. That is exactly what happened on the first parking run:
 * builder-art-input kept `~/components/builder/art-builder.vue` pointing at a
 * path that had just moved, and the build died on it.
 *
 * Prefer `@/`-anchored specifiers in parked files — they do not care how deep
 * the file sits.
 */
export function unresolvedParkedImports(exists: (p: string) => boolean): string[] {
  const broken: string[] = []
  const parked = resolve(root, 'components', PARKED_SEGMENT)

  for (const abs of walk(parked, isSource)) {
    const rel = relative(root, abs).replace(/\\/g, '/')
    const dir = rel.split('/').slice(0, -1).join('/')
    const source = readFileSync(abs, 'utf8')

    for (const match of source.matchAll(
      /(?:from|import)\s*\(?\s*['"](\.[^'"]*|[@~]\/[^'"]*)['"]/g,
    )) {
      const spec = match[1] as string
      const base = spec.startsWith('.') ? join(dir, spec) : spec.slice(2)
      const path = base.replace(/\\/g, '/')

      // No extension means TS/Vite resolution rules; accept any of the shapes.
      const candidates = /\.[a-z]+$/.test(path)
        ? [path]
        : ['.ts', '.js', '.vue', '/index.ts', '/index.js'].map((ext) => path + ext)

      if (!candidates.some((candidate) => exists(resolve(root, candidate)))) {
        broken.push(`${rel} → ${spec}`)
      }
    }
  }

  return broken
}

function selfTest(): void {
  // Both spellings collapse to one component.
  if (componentKey('LoraCard') !== componentKey('lora-card')) {
    throw new Error('PascalCase and kebab-case must resolve to the same key')
  }

  const refs = referencedComponentKeys(
    `<template><lora-card /><CheckpointCard /><div /><span></span></template>`,
  )
  if (!refs.has('loracard') || !refs.has('checkpointcard')) {
    throw new Error('component tags must be detected in both casings')
  }
  if (refs.has('div') || refs.has('span')) {
    throw new Error('native elements must not be treated as components')
  }

  // Explicit imports, value and type-only. Missing this parked three live
  // components on the first run; vue-tsc caught it, this test now does.
  const imports = referencedComponentKeys(
    `import StagePresetCard from './stage-preset.vue'\n` +
      `import type { GalleryItem } from '@/components/gallery/kr-gallery.vue'\n`,
  )
  if (!imports.has('stagepreset') || !imports.has('krgallery')) {
    throw new Error(`.vue imports must count as references, got ${[...imports]}`)
  }

  // Nuxt's Lazy prefix. Missing this parked workspace-narrator (mounted by
  // Dreams as <LazyWorkspaceNarrator>) and kr-narrator-stage (Storybook,
  // Taskmaster) on the first run — three live components, all invisible.
  const lazy = referencedComponentKeys('<LazyWorkspaceNarrator />')
  if (!lazy.has('workspacenarrator')) {
    throw new Error(`a Lazy-prefixed tag must reach its component, got ${[...lazy]}`)
  }
  // ...but the prefixed name must survive too, or a component actually called
  // LazyLoader would be read as a reference to loader.vue and nothing else.
  if (!lazy.has('lazyworkspacenarrator')) {
    throw new Error('the literal Lazy-prefixed key must be kept as well')
  }

  if (!mdcMountKeys(':reward-manager\n::foo-bar\n').has('rewardmanager')) {
    throw new Error('MDC mounts must be detected')
  }

  // A directory-local glob is a mount point...
  const local = globMountDirs(
    `const m = import.meta.glob<EffectModule>('./*.vue')`,
    'components/screenfx',
  )
  if (!local.has('components/screenfx')) {
    throw new Error(`directory-local glob must mount its own directory, got ${[...local]}`)
  }

  // ...but a recursive one is a catalog. If this ever passes, the museum's
  // `@/components/**/*.vue` makes every component reachable and the whole
  // check silently reports zero orphans forever.
  if (globMountDirs(`import.meta.glob('@/components/**/*.vue')`, 'components/wonderlab').size) {
    throw new Error('a ** glob must NOT confer reachability')
  }

  // Non-component globs are irrelevant here.
  if (globMountDirs(`import.meta.glob('../fallback/*.json')`, 'stores/helpers').size) {
    throw new Error('a non-.vue glob must be ignored')
  }

  // THE CASE THAT MOTIVATED THIS SCRIPT: a closed loop citing itself is still
  // unreachable. a -> b -> c, with nothing pointing at a.
  const edges = new Map<string, Set<string>>([
    ['live', new Set(['leaf'])],
    ['leaf', new Set()],
    ['a', new Set(['b'])],
    ['b', new Set(['c'])],
    ['c', new Set(['a'])],
  ])
  const reached = reachableFrom(new Set(['live']), edges)
  for (const orphan of ['a', 'b', 'c']) {
    if (reached.has(orphan)) {
      throw new Error(`${orphan} is in a self-referencing loop and must NOT be reachable`)
    }
  }
  if (!reached.has('leaf')) throw new Error('a genuinely reached component must be reachable')

  // The parked-import guard must actually fail on a missing target. Injecting
  // an `exists` that says no to everything is the cheapest way to prove it can
  // fail at all — a guard only ever seen to pass is indistinguishable from one
  // that cannot.
  if (existsSync(resolve(root, 'components', PARKED_SEGMENT))) {
    if (!unresolvedParkedImports(() => false).length) {
      throw new Error('the parked-import guard reports nothing even when NOTHING resolves')
    }
  }

  console.log('✅ verifyComponentReachability self-test passed.')
}

/* ------------------------------------------------------------------------ */

function main(): void {
  if (process.argv.includes('--self-test')) return selfTest()
  selfTest()

  const update = process.argv.includes('--update')

  const broken = unresolvedParkedImports(existsSync)
  if (broken.length) {
    console.error(`\n❌ ${broken.length} import(s) in components/abandonware/ do not resolve:\n`)
    for (const entry of broken) console.error(`     ${entry}`)
    console.error(
      `\nParking moves a file one directory deeper, so a relative specifier that` +
        `\nwas correct before is not correct now. Re-anchor these on '@/' — the` +
        `\nmuseum still compiles parked components, so a stale path fails the build.\n`,
    )
    process.exitCode = 1
    return
  }

  const { files, edges } = buildGraph()
  const roots = rootKeys()
  for (const key of globMountedKeys(files)) roots.add(key)
  const reached = reachableFrom(roots, edges)

  const orphans = [...files.keys()]
    .filter((key) => !reached.has(key))
    .map((key) => files.get(key) as string)
    .sort((a, b) => a.localeCompare(b))

  const current = { orphans }
  const baseline = loadRatchetBaseline<{ orphans: string[]; total?: number }>(BASELINE)
  const grown = grownRatchetBuckets(current, baseline ? { orphans: baseline.orphans } : null)

  process.stdout.write(
    `Component reachability: ${files.size} live components, ` +
      `${orphans.length} unreachable from app.vue / pages / layouts / content mounts` +
      `${ratchetDelta(orphans.length, baseline?.orphans.length)}\n`,
  )

  if (update) {
    if (grown.length) {
      console.error(
        `Refusing to record MORE orphans (${baseline?.orphans.length ?? 0} → ${orphans.length}).\n` +
          `Park the new ones in components/abandonware/, or explain in the PR why they must stay.`,
      )
      process.exitCode = 1
      return
    }
    writeRatchetBaseline(BASELINE, {
      note: ratchetNote('Component reachability', SCRIPT),
      recorded: ratchetRecordedAt(),
      total: orphans.length,
      orphans,
    })
    process.stdout.write(`Baseline updated: ${BASELINE}\n`)
    return
  }

  if (!baseline) {
    console.error(`No baseline. Record one with:\n  npm run test:component-reachability -- --update`)
    process.exitCode = 1
    return
  }

  if (!grown.length) {
    process.stdout.write('Reachability holds — no new orphans.\n')
    return
  }

  const known = new Set(baseline.orphans)
  console.error('\n❌ New unreachable component(s):\n')
  for (const entry of orphans.filter((o) => !known.has(o))) console.error(`     ${entry}`)
  console.error(
    `\nNothing in app.vue, pages/, layouts/ or a content MDC mount reaches these,` +
      `\neven transitively. Park them in components/abandonware/ — they stay` +
      `\nreviewable in WonderLab but leave the app build. If one IS reached by a` +
      `\nruntime path this cannot see (<component :is>, a string-addressed mount,` +
      `\nor a plugin selector), say so in the PR and re-record with --update.\n`,
  )
  process.exitCode = 1
}

main()
