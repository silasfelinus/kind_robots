// /utils/pageImagePath.ts
//
// Bare frontmatter path -> servable URL.
//
// `content/*.md` writes art as a bare path (`background/taskmaster.webp`), and
// `/images/**` 302s to the media origin (vercel.json). Something has to put the
// prefix on, and four files were each doing it privately:
//
//   stores/pageStore.ts                      workspace-hand.vue
//   components/navigation/workspace-sheet.vue  abandonware/navigation/page-image.vue
//
// THEY HAD ALREADY DRIFTED, which is the real argument for a shared one. The
// sheet's copy handles `data:` URIs and maps `species/` and `rewards/` prefixes
// to a bare root (`species/x` -> `/species/x`), while the other three send the
// same input to `/images/species/x`. Two different URLs, one of which does not
// reach the media origin at all.
//
// So this is deliberately NOT a merge of all four. It is the majority
// behaviour — what pageStore does and what the backdrop needs — plus `data:`
// and the `images/` fix, both of which are strictly safe. The sheet's two extra
// prefix rules stay in the sheet, where their blast radius is known; unifying
// those is a behaviour change and wants its own change with its own testing.

/** Prefixes that are already rooted and must be returned untouched. */
const ALREADY_RESOLVED = ['/', 'http', 'data:']

/**
 * Resolve a frontmatter image path to something the browser can request.
 *
 * ```
 * ''                          -> ''
 * '/images/a.webp'            -> '/images/a.webp'   (already rooted)
 * 'https://cdn/a.webp'        -> unchanged
 * 'images/a.webp'             -> '/images/a.webp'   (NOT /images/images/a.webp)
 * 'background/taskmaster.webp'-> '/images/background/taskmaster.webp'
 * ```
 *
 * The `images/` case is a bug fix, not a new rule: three of the four private
 * copies double-prefixed that input into `/images/images/…`, which 404s.
 */
export function pageImagePath(path: string | null | undefined): string {
  const clean = (path ?? '').trim()
  if (!clean) return ''

  if (ALREADY_RESOLVED.some((prefix) => clean.startsWith(prefix))) return clean
  if (clean.startsWith('images/')) return `/${clean}`

  return `/images/${clean}`
}

/**
 * The same path wrapped for CSS `background-image`.
 *
 * Returns `''` rather than `url("")` for a missing path — an empty `url()`
 * resolves against the current document, so the browser re-requests the page
 * and paints it as a broken image. Callers must omit the declaration entirely
 * when this is empty, not emit it with a blank value.
 */
export function pageImageCssUrl(path: string | null | undefined): string {
  const resolved = pageImagePath(path)
  if (!resolved) return ''

  // Escape only what can terminate the quoted string or the declaration.
  const safe = resolved.replace(/["\\]/g, '\\$&').replace(/[\n\r]/g, '')
  return `url("${safe}")`
}
