// /server/utils/formatSocialPost.ts
//
// Pure, dependency-free platform formatter. No secrets, no API clients —
// safe to import in both the browser (publisher preview) and the server
// (publish endpoint dryRun). Turns one canonical SocialPost into per-platform
// variants + copy-ready blocks so manual platforms paste in ~20 seconds.

import type { SocialPlatform } from '~/prisma/generated/prisma/client'

export type SocialMedia = {
  url: string
  type?: string | null // 'image' | 'video' | 'gif' | ...
  alt?: string | null
}

export type SocialCopyBlock = {
  label: string
  value: string
  kind: 'title' | 'body' | 'caption' | 'url' | 'media'
}

export type SocialVariant = {
  platform: SocialPlatform
  title?: string
  body: string
  limit: number | null
  remaining: number | null
  isOverLimit: boolean
  isAutomatable: boolean
  copyBlocks: SocialCopyBlock[]
  warnings: string[]
}

export type SocialSource = {
  title: string
  body: string // markdown source of truth
  url?: string | null // canonical link back to kindrobots
  media?: SocialMedia[] | null
  hashtags?: string[] | null
}

// Which platforms we can dispatch automatically in v1.
export const AUTOMATABLE_PLATFORMS: SocialPlatform[] = [
  'DISCORD',
  'MASTODON',
  'BLUESKY',
  'RSS',
] as unknown as SocialPlatform[]

export function isAutomatable(platform: SocialPlatform): boolean {
  return (AUTOMATABLE_PLATFORMS as string[]).includes(platform as string)
}

// ── Text utilities ──────────────────────────────────────────────────────────

// Strip the most common markdown so plain-text platforms read clean.
function stripMarkdown(md: string): string {
  return md
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // images -> alt text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)') // links -> "text (url)"
    .replace(/^#{1,6}\s+/gm, '') // headings
    .replace(/(\*\*|__)(.*?)\1/g, '$2') // bold
    .replace(/(\*|_)(.*?)\1/g, '$2') // italic
    .replace(/`{1,3}([^`]*)`{1,3}/g, '$1') // inline/fenced code
    .replace(/^\s*>\s?/gm, '') // blockquotes
    .replace(/^\s*[-*+]\s+/gm, '• ') // bullets
    .replace(/\n{3,}/g, '\n\n') // collapse blank runs
    .trim()
}

// Grapheme-aware length (Bluesky counts grapheme clusters, not UTF-16 units).
function graphemeLength(str: string): number {
  try {
    // @ts-ignore - Intl.Segmenter exists in modern runtimes
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      // @ts-ignore
      const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
      let count = 0
      // @ts-ignore
      for (const _ of seg.segment(str)) count++
      return count
    }
  } catch {
    /* fall through */
  }
  return Array.from(str).length // fallback: code points, better than .length
}

// Trim text to a grapheme budget with an ellipsis.
function clampGraphemes(str: string, max: number): string {
  if (graphemeLength(str) <= max) return str
  const units = Array.from(str)
  let out = ''
  for (const u of units) {
    if (graphemeLength(out + u) > max - 1) break
    out += u
  }
  return out.trimEnd() + '…'
}

function joinHashtags(tags?: string[] | null, max = 5): string {
  if (!tags?.length) return ''
  return tags
    .slice(0, max)
    .map((t) => (t.startsWith('#') ? t : `#${t.replace(/\s+/g, '')}`))
    .join(' ')
}

function mediaBlocks(media?: SocialMedia[] | null): SocialCopyBlock[] {
  if (!media?.length) return []
  return media.map((m, i) => ({
    label: `Media ${i + 1}${m.type ? ` (${m.type})` : ''}`,
    value: m.url,
    kind: 'media' as const,
  }))
}

// ── Per-platform formatters ───────────────────────────────────────────────

function formatDiscord(src: SocialSource): SocialVariant {
  const LIMIT = 2000
  const SAFE = 1900
  const url = src.url ? `\n\n${src.url}` : ''
  // Discord renders light markdown, so keep the source mostly intact.
  const header = src.title ? `**${src.title}**\n\n` : ''
  let body = `${header}${src.body.trim()}${url}`
  const warnings: string[] = []
  if (body.length > SAFE) {
    body = body.slice(0, SAFE - 1).trimEnd() + '…'
    warnings.push(`Trimmed to ${SAFE} chars (Discord cap is ${LIMIT}).`)
  }
  return {
    platform: 'DISCORD' as SocialPlatform,
    body,
    limit: LIMIT,
    remaining: LIMIT - body.length,
    isOverLimit: body.length > LIMIT,
    isAutomatable: true,
    warnings,
    copyBlocks: [
      { label: 'Message', value: body, kind: 'body' },
      ...mediaBlocks(src.media),
    ],
  }
}

function formatMastodon(src: SocialSource): SocialVariant {
  const LIMIT = 500
  const SAFE = 450 // leave room; links count as ~23 in-client
  const plainTitle = src.title ? `${src.title}\n\n` : ''
  const plainBody = stripMarkdown(src.body)
  const tags = joinHashtags(src.hashtags, 3)
  const url = src.url ? `\n${src.url}` : ''
  const tagLine = tags ? `\n${tags}` : ''
  let body = `${plainTitle}${plainBody}${url}${tagLine}`.trim()
  const warnings: string[] = []
  if (body.length > SAFE) {
    // Trim the body portion, preserve url + tags.
    const tail = `${url}${tagLine}`.trim()
    const budget = SAFE - plainTitle.length - tail.length - 2
    const trimmed = plainBody.slice(0, Math.max(0, budget)).trimEnd() + '…'
    body = `${plainTitle}${trimmed}\n${tail}`.trim()
    warnings.push(
      `Trimmed body to stay under ~${SAFE} (Mastodon cap ${LIMIT}).`,
    )
  }
  return {
    platform: 'MASTODON' as SocialPlatform,
    body,
    limit: LIMIT,
    remaining: LIMIT - body.length,
    isOverLimit: body.length > LIMIT,
    isAutomatable: true,
    warnings,
    copyBlocks: [
      { label: 'Toot', value: body, kind: 'body' },
      ...mediaBlocks(src.media),
    ],
  }
}

function formatBluesky(src: SocialSource): SocialVariant {
  const LIMIT = 300 // grapheme clusters
  const plain = stripMarkdown(src.body)
  // One short hook + canonical URL. Trim the hook, never the URL.
  const url = src.url ? `\n${src.url}` : ''
  const urlLen = graphemeLength(url)
  const hookBudget = LIMIT - urlLen - 1
  const hookSource = src.title ? `${src.title} — ${plain}` : plain
  const hook = clampGraphemes(hookSource, hookBudget)
  const body = `${hook}${url}`.trim()
  const len = graphemeLength(body)
  const warnings: string[] = []
  if (graphemeLength(hookSource) > hookBudget) {
    warnings.push('Hook trimmed to fit 300 graphemes; URL preserved.')
  }
  if (src.media?.length) {
    warnings.push('Attach media manually in the Bluesky composer (v1).')
  }
  return {
    platform: 'BLUESKY' as SocialPlatform,
    body,
    limit: LIMIT,
    remaining: LIMIT - len,
    isOverLimit: len > LIMIT,
    isAutomatable: true,
    warnings,
    copyBlocks: [
      { label: 'Post', value: body, kind: 'body' },
      ...mediaBlocks(src.media),
    ],
  }
}

function formatReddit(src: SocialSource): SocialVariant {
  const TITLE_LIMIT = 300
  const title = clampGraphemes(src.title || src.body.slice(0, 100), TITLE_LIMIT)
  // Reddit body keeps markdown. URL goes at the BOTTOM, never in the title.
  const url = src.url ? `\n\n${src.url}` : ''
  const body = `${src.body.trim()}${url}`.trim()
  const warnings: string[] = []
  if (!src.title) warnings.push('No title set; derived one from the body.')
  return {
    platform: 'REDDIT' as SocialPlatform,
    title,
    body,
    limit: TITLE_LIMIT,
    remaining: TITLE_LIMIT - title.length,
    isOverLimit: title.length > TITLE_LIMIT,
    isAutomatable: false,
    warnings,
    copyBlocks: [
      { label: 'Title', value: title, kind: 'title' },
      { label: 'Body (markdown OK)', value: body, kind: 'body' },
      ...mediaBlocks(src.media),
    ],
  }
}

function formatMetaCaption(
  platform: 'FACEBOOK' | 'INSTAGRAM',
  src: SocialSource,
): SocialVariant {
  const plain = stripMarkdown(src.body)
  const tags = joinHashtags(src.hashtags, 5)
  const url = src.url ? `\n\n${src.url}` : ''
  const tagLine = tags ? `\n\n${tags}` : ''
  // IG links aren't clickable, so URL is reference-only at the end.
  const caption = `${plain}${tagLine}${url}`.trim()
  const warnings: string[] = []
  if (platform === 'INSTAGRAM') {
    warnings.push('Instagram links are not tappable; URL is reference-only.')
    warnings.push('Attach the image/video in the Instagram composer.')
  }
  return {
    platform: platform as SocialPlatform,
    body: caption,
    limit: null,
    remaining: null,
    isOverLimit: false,
    isAutomatable: false,
    warnings,
    copyBlocks: [
      { label: 'Caption', value: caption, kind: 'caption' },
      ...mediaBlocks(src.media),
    ],
  }
}

function formatRss(src: SocialSource): SocialVariant {
  // RSS is generated server-side from the row; this is a passthrough preview.
  const body = src.body.trim()
  return {
    platform: 'RSS' as SocialPlatform,
    title: src.title,
    body,
    limit: null,
    remaining: null,
    isOverLimit: false,
    isAutomatable: true,
    warnings: [],
    copyBlocks: [
      { label: 'Title', value: src.title, kind: 'title' },
      { label: 'Content', value: body, kind: 'body' },
    ],
  }
}

// ── Public entry points ─────────────────────────────────────────────────────

export function formatForPlatform(
  platform: SocialPlatform,
  src: SocialSource,
): SocialVariant {
  switch (platform as string) {
    case 'DISCORD':
      return formatDiscord(src)
    case 'MASTODON':
      return formatMastodon(src)
    case 'BLUESKY':
      return formatBluesky(src)
    case 'REDDIT':
      return formatReddit(src)
    case 'FACEBOOK':
      return formatMetaCaption('FACEBOOK', src)
    case 'INSTAGRAM':
      return formatMetaCaption('INSTAGRAM', src)
    case 'RSS':
      return formatRss(src)
    default:
      return {
        platform,
        body: src.body,
        limit: null,
        remaining: null,
        isOverLimit: false,
        isAutomatable: false,
        warnings: [`No formatter for ${platform as string}.`],
        copyBlocks: [{ label: 'Body', value: src.body, kind: 'body' }],
      }
  }
}

export function formatVariants(
  platforms: SocialPlatform[],
  src: SocialSource,
): SocialVariant[] {
  return platforms.map((p) => formatForPlatform(p, src))
}
