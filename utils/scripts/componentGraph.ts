// /utils/scripts/componentGraph.ts
//
// Walking the component render graph, for contracts that ask "does this
// surface reach X?" rather than "is X written in this exact file?".
//
// WHY THIS IS SHARED
// ------------------
// Three separate contracts in this repo have now had to learn the same lesson,
// and the first two each grew their own copy of the answer:
//
//   verifyRouteGalleryContract   keyed on `*-gallery.vue` filenames, so a
//                                second facet browser living inside
//                                facet-manager.vue was invisible to it.
//   verifyNarrativeKit           kept an INTERMEDIARIES array of names and
//                                reported 6/7 twice in one afternoon, each
//                                time because a split moved the kit one hop
//                                further down rather than abandoning it.
//   verifyEntityArtManager       asserted <EntityArtManager appeared literally
//                                in each *-interact.vue, and went red when
//                                three interacts became routers.
//
// In every case the code was fine and the check was wrong, in the same way: a
// hardcoded list of filenames cannot tell a refactor from a regression. The
// component graph can, so it lives here once instead of being pasted a fourth
// time.
//
// A NOTE ON WHAT COUNTS AS A USE. mountsElement matches an opening ELEMENT in
// the TEMPLATE, after comments are stripped -- never a substring of the whole
// file. `class="kr-gallery"` is not a gallery, and
// `import type { NarrativeTurn } from '.../kr-chat-window.vue'` is not
// adoption. Both of those produced real false passes here before the checks
// were tightened; asserting on a mention rather than a use is this repo's
// house failure mode.

import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

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

/*
 * wonderlab-preview-host mounts every component in the repo through
 * import.meta.glob. Traversing into it would make every surface reach
 * everything -- being exhibited in the museum is not being used.
 */
export const MUSEUM_MOUNTS_EVERYTHING = 'wonderlab-preview-host'

export function walkVue(directory: string, out: string[] = []): string[] {
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

/** Template text only: no <script>, no <style>, no comments. */
export function templateOf(source: string): string {
  return source
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
}

export function kebab(tag: string): string {
  return (
    /^[a-z]/.test(tag)
      ? tag
      : tag.replace(/(?<!^)(?=[A-Z])/g, '-').toLowerCase()
  ).replace(/^lazy-/, '')
}

/**
 * Does `source` MOUNT `name` as an element? Accepts kebab or Pascal, plain or
 * Lazy-prefixed. Not a substring test — see the note at the top of the file.
 */
export function mountsElement(source: string, name: string): boolean {
  const key = kebab(name)
  const pascal = key
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
  return new RegExp(`<\\s*(?:Lazy|lazy-)?(?:${key}|${pascal})(?=[\\s/>])`).test(
    templateOf(source),
  )
}

export type ComponentGraph = {
  /** kebab component name → absolute path */
  files: Map<string, string>
  /** Components this one renders directly. */
  children: (name: string) => string[]
  /**
   * Does `start`, or anything it transitively renders, satisfy `predicate`?
   * Cycle-safe: a component that renders itself terminates.
   */
  reaches: (start: string, predicate: (source: string) => boolean) => boolean
}

export function buildComponentGraph(componentsDir: string): ComponentGraph {
  const files = new Map<string, string>()
  for (const file of walkVue(componentsDir)) {
    const name = file.split('/').pop()?.replace('.vue', '') ?? ''
    if (name && !files.has(name)) files.set(name, file)
  }

  const childCache = new Map<string, string[]>()
  function children(name: string): string[] {
    const cached = childCache.get(name)
    if (cached) return cached
    const file = files.get(name)
    if (!file) {
      childCache.set(name, [])
      return []
    }
    const template = templateOf(readFileSync(file, 'utf8'))
    const found = new Set<string>()
    for (const [, tag] of template.matchAll(/<([A-Za-z][\w-]*)/g)) {
      const key = kebab(tag ?? '')
      if (key !== name && key !== MUSEUM_MOUNTS_EVERYTHING && files.has(key)) {
        found.add(key)
      }
    }
    const result = [...found].sort()
    childCache.set(name, result)
    return result
  }

  function reaches(
    start: string,
    predicate: (source: string) => boolean,
  ): boolean {
    const seen = new Set<string>()
    const stack = [kebab(start.split('/').pop()?.replace('.vue', '') ?? '')]
    while (stack.length) {
      const current = stack.pop()
      if (!current || seen.has(current)) continue
      seen.add(current)
      const file = files.get(current)
      if (!file) continue
      if (predicate(readFileSync(file, 'utf8'))) return true
      for (const child of children(current)) {
        if (!seen.has(child)) stack.push(child)
      }
    }
    return false
  }

  return { files, children, reaches }
}
