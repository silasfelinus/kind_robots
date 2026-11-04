import type {
  ColoringBookProductionState,
  ColoringBookProposal,
  ColoringBookVariant,
} from '~/types/coloringBookStudio'

const REPO = 'silasfelinus/conductor'
const ROOT = 'projects/coloring-book'

export type ColoringBookVersion = {
  /** Set-relative path, the form adoption (`source_path`) expects. */
  path: string
  url: string
  label: string
  detail: string | null
  /** The version the card currently shows for this variant. */
  current: boolean
}

export function setRelativePath(path: string, bookSlug: string): string {
  const clean = path.trim().replace(/\\/g, '/').replace(/^\.\//, '')
  const prefix = `${ROOT}/sets/${bookSlug}/`
  return clean.startsWith(prefix) ? clean.slice(prefix.length) : clean
}

export function coloringAssetUrl(
  path: string,
  bookSlug: string,
): string | null {
  const clean = path.trim()
  if (
    !clean ||
    clean.includes(':') ||
    (clean.startsWith('projects/') &&
      !clean.startsWith(`${ROOT}/sets/${bookSlug}/`))
  ) {
    return null
  }
  return `https://raw.githubusercontent.com/${REPO}/main/${ROOT}/sets/${bookSlug}/${setRelativePath(clean, bookSlug)}`
}

function shortDate(value: string | null | undefined): string | null {
  return value ? value.slice(0, 10) : null
}

/**
 * Every image a page has had for one variant, newest-meaningful first, so the
 * studio can put any of them back (Silas, 2026-11-04 PT: "I actually like the
 * original frankenstein swap"). Only files inside the page's own set are
 * offered, because adoption refuses anything else.
 */
export function coloringBookVersions(
  bookSlug: string,
  proposal: ColoringBookProposal,
  production: ColoringBookProductionState | null,
  variant: ColoringBookVariant,
): ColoringBookVersion[] {
  const versions: ColoringBookVersion[] = []
  const seen = new Set<string>()
  const currentRaw =
    proposal.final[variant] ||
    proposal.accepted[variant] ||
    (variant === 'color'
      ? proposal.queue.renderedPath
      : production?.bwRenderedPath) ||
    null
  const current = currentRaw ? setRelativePath(currentRaw, bookSlug) : null

  const add = (
    raw: string | null | undefined,
    label: string,
    detail: string | null = null,
  ) => {
    if (!raw) return
    const path = setRelativePath(raw, bookSlug)
    if (seen.has(path) || !/\.(?:webp|png|jpe?g)$/i.test(path)) return
    const url = coloringAssetUrl(raw, bookSlug)
    if (!url) return
    seen.add(path)
    versions.push({ path, url, label, detail, current: path === current })
  }

  add(proposal.final[variant], 'Final')
  add(proposal.accepted[variant], 'Accepted')
  if (variant === 'color') add(proposal.queue.renderedPath, 'Latest render')
  else add(production?.bwRenderedPath, 'Latest render')

  for (const item of [...proposal.queue.acceptedHistory].reverse()) {
    if (item.variant === variant) {
      add(item.path, 'Earlier pick', shortDate(item.replacedAt))
    }
  }
  for (const item of production?.history ?? []) {
    if (item.variant !== variant) continue
    const label =
      item.kind === 'revision' ? 'Earlier render' : 'Rejected render'
    add(item.path, label, shortDate(item.createdAt))
  }
  for (const asset of proposal.inspirations) {
    const kind = asset.kind.toLowerCase()
    const matches =
      variant === 'bw' ? /\bbw\b|b&w|line/.test(kind) : kind.includes('color')
    if (matches) add(asset.path, 'Original', asset.kind.replace(/-/g, ' '))
  }
  return versions
}
