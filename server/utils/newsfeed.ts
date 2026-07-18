// /server/utils/newsfeed.ts
//
// RSS/Atom aggregation for the newsfeed feature (conductor projects/newsfeed
// t-005, per DESIGN-BRIEF.md). Deliberately dependency-free: feeds are simple,
// well-formed RSS 2.0 / Atom documents and a handful of known tags don't
// justify a full XML parser dependency yet ("smallest reliable ingestion
// approach", DESIGN-BRIEF.md). Never throws -- a broken or slow source must
// not blank the rest of the feed, so failures are captured as data, not
// exceptions.
// Relative import (not the `@/` alias) so this module -- and its regression
// test, utils/scripts/verifyNewsfeedAggregation.ts -- can be run directly via
// tsx without a Nuxt build step.
import type {
  FeedDefinition,
  FeedSourceDefinition,
  NewsFeedItem,
} from '../../stores/helpers/newsfeed'
import { getFeedSources } from '../../stores/helpers/newsfeed'

const MAX_SUMMARY_LENGTH = 280
const MAX_TITLE_LENGTH = 200
const FETCH_TIMEOUT_MS = 8000

interface RawFeedEntry {
  title?: string
  link?: string
  description?: string
  pubDate?: string
  guid?: string
  image?: string
  categories: string[]
}

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
}

function stripCdata(value: string): string {
  const match = value.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/)
  return match ? (match[1] ?? '') : value
}

function extractTag(block: string, tag: string): string | undefined {
  const match = block.match(
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'),
  )
  return match ? decodeEntities(stripCdata(match[1] ?? '').trim()) : undefined
}

function extractAttr(
  block: string,
  tag: string,
  attr: string,
): string | undefined {
  const match = block.match(
    new RegExp(`<${tag}[^>]*\\b${attr}=["']([^"']+)["'][^>]*/?>`, 'i'),
  )
  return match ? match[1] : undefined
}

function extractCategories(block: string): string[] {
  const categories: string[] = []
  const re =
    /<category\b[^>]*>([\s\S]*?)<\/category>|<category\b[^>]*\bterm=["']([^"']+)["'][^>]*\/?>/gi
  let match: RegExpExecArray | null
  while ((match = re.exec(block))) {
    const value = match[1]
      ? decodeEntities(stripCdata(match[1]).trim())
      : match[2]
    if (value) categories.push(value)
  }
  return categories
}

/** Strips tags/entities and truncates -- feed HTML is never rendered raw. */
export function sanitizeText(
  html: string,
  maxLength = MAX_SUMMARY_LENGTH,
): string {
  const collapsed = decodeEntities(stripCdata(html))
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (collapsed.length <= maxLength) return collapsed
  return `${collapsed.slice(0, maxLength - 1).trimEnd()}…`
}

export function parseFeedXml(xml: string): RawFeedEntry[] {
  const rssItems = xml.match(/<item\b[\s\S]*?<\/item>/gi)
  if (rssItems) {
    return rssItems.map((block) => ({
      title: extractTag(block, 'title'),
      link: extractTag(block, 'link') || extractAttr(block, 'link', 'href'),
      description:
        extractTag(block, 'description') ||
        extractTag(block, 'content:encoded'),
      pubDate: extractTag(block, 'pubDate') || extractTag(block, 'dc:date'),
      guid: extractTag(block, 'guid'),
      image:
        extractAttr(block, 'enclosure', 'url') ||
        extractAttr(block, 'media:content', 'url') ||
        extractAttr(block, 'media:thumbnail', 'url'),
      categories: extractCategories(block),
    }))
  }

  const atomEntries = xml.match(/<entry\b[\s\S]*?<\/entry>/gi)
  if (atomEntries) {
    return atomEntries.map((block) => ({
      title: extractTag(block, 'title'),
      link: extractAttr(block, 'link', 'href') || extractTag(block, 'link'),
      description: extractTag(block, 'summary') || extractTag(block, 'content'),
      pubDate: extractTag(block, 'updated') || extractTag(block, 'published'),
      guid: extractTag(block, 'id'),
      categories: extractCategories(block),
    }))
  }

  return []
}

function stableId(sourceId: string, raw: RawFeedEntry): string {
  const basis = raw.guid || raw.link || `${sourceId}:${raw.title ?? ''}`
  let hash = 0
  for (let i = 0; i < basis.length; i += 1) {
    hash = (hash * 31 + basis.charCodeAt(i)) | 0
  }
  return `${sourceId}-${(hash >>> 0).toString(36)}`
}

function parseDate(value: string | undefined): string {
  if (!value) return new Date(0).toISOString()
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime())
    ? new Date(0).toISOString()
    : parsed.toISOString()
}

export function normalizeEntry(
  raw: RawFeedEntry,
  source: FeedSourceDefinition,
): NewsFeedItem | null {
  if (!raw.title || !raw.link) return null

  return {
    id: stableId(source.id, raw),
    title: sanitizeText(raw.title, MAX_TITLE_LENGTH),
    summary: raw.description ? sanitizeText(raw.description) : '',
    source: source.name,
    url: raw.link,
    publishedAt: parseDate(raw.pubDate),
    category: raw.categories,
    image: raw.image,
    perspective: source.perspective
      ? {
          label: source.perspective.label,
          source: source.perspective.source,
          confidence: source.perspective.confidence,
        }
      : undefined,
  }
}

export interface SourceFetchResult {
  sourceId: string
  items: NewsFeedItem[]
  error?: string
}

export async function fetchSourceItems(
  source: FeedSourceDefinition,
): Promise<SourceFetchResult> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    let res: Response
    try {
      res = await fetch(source.url, {
        signal: controller.signal,
        headers: {
          Accept:
            'application/rss+xml, application/atom+xml, application/xml, text/xml',
        },
      })
    } finally {
      clearTimeout(timeout)
    }

    if (!res.ok) {
      return { sourceId: source.id, items: [], error: `HTTP ${res.status}` }
    }

    const xml = await res.text()
    const items = parseFeedXml(xml)
      .map((raw) => normalizeEntry(raw, source))
      .filter((item): item is NewsFeedItem => item !== null)

    return { sourceId: source.id, items }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown fetch error'
    console.warn(`📰 Newsfeed source "${source.id}" failed: ${message}`)
    return { sourceId: source.id, items: [], error: message }
  }
}

export interface AggregatedFeed {
  slug: string
  items: NewsFeedItem[]
  sourceErrors: Array<{ sourceId: string; error: string }>
}

function matchesTagFilters(item: NewsFeedItem, feed: FeedDefinition): boolean {
  const haystack = [item.title, item.summary, ...item.category]
    .join(' ')
    .toLowerCase()

  if (feed.excludeTags?.some((tag) => haystack.includes(tag.toLowerCase()))) {
    return false
  }
  if (feed.includeTags?.length) {
    return feed.includeTags.some((tag) => haystack.includes(tag.toLowerCase()))
  }
  return true
}

/** Fetches every source in a feed in parallel and merges into one sorted, deduped list. */
export async function aggregateFeed(
  feed: FeedDefinition,
): Promise<AggregatedFeed> {
  const sources = getFeedSources(feed)
  const results = await Promise.all(
    sources.map((source) => fetchSourceItems(source)),
  )

  const seen = new Set<string>()
  const items: NewsFeedItem[] = []
  const sourceErrors: Array<{ sourceId: string; error: string }> = []

  for (const result of results) {
    if (result.error)
      sourceErrors.push({ sourceId: result.sourceId, error: result.error })

    for (const item of result.items) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      if (matchesTagFilters(item, feed)) items.push(item)
    }
  }

  items.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))

  return { slug: feed.slug, items, sourceErrors }
}
