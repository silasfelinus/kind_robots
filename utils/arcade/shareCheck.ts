// /utils/arcade/shareCheck.ts
//
// What a shared Arcade link needs on the live site (kr-arcade/t-167, t-171):
// each hall cabinet's title art must be served as an image, and a crawler
// fetching the cabinet link must find a title, a description and an
// absolute raster image in its og: tags.

import { HALL_GAMES } from './games'
import type { ArcadeGameMeta } from './types'

export const CRAWLER_AGENTS = [
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)',
  'Twitterbot/1.0',
] as const

export type ArcadeShareTarget = {
  slug: string
  title: string
  shelf: NonNullable<ArcadeGameMeta['shelf']> | 'standard'
  pageUrl: string
  artUrl: string
}

export function arcadeShareTargets(
  base: string,
  games: readonly ArcadeGameMeta[] = HALL_GAMES,
): ArcadeShareTarget[] {
  const origin = base.replace(/\/+$/, '')
  return games.map((game) => ({
    slug: game.slug,
    title: game.title,
    shelf: game.shelf ?? 'standard',
    pageUrl:
      origin +
      (game.route ?? `/play/arcade?game=${encodeURIComponent(game.slug)}`),
    artUrl: new URL(game.titleArt, origin + '/').toString(),
  }))
}

const META_TAG = /<meta\b[^>]*>/gi
const ATTR = /([a-zA-Z:-]+)\s*=\s*("([^"]*)"|'([^']*)')/g

function decode(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

export function readShareTags(html: string): Record<string, string> {
  const tags: Record<string, string> = {}
  for (const tag of html.match(META_TAG) ?? []) {
    const attrs: Record<string, string> = {}
    for (const match of tag.matchAll(ATTR))
      attrs[match[1]!.toLowerCase()] = decode(match[3] ?? match[4] ?? '')
    const key = attrs.property ?? attrs.name
    if (key && attrs.content !== undefined && !(key in tags))
      tags[key.toLowerCase()] = attrs.content
  }
  return tags
}

export function unfurlProblems(tags: Record<string, string>): string[] {
  const problems: string[] = []
  const title = tags['og:title'] ?? ''
  const description = tags['og:description'] ?? ''
  const image = tags['og:image'] ?? ''
  if (!title) problems.push('missing og:title')
  if (description.length < 40) problems.push('og:description under 40 chars')
  if (!/^https?:\/\//.test(image)) problems.push('og:image is not absolute')
  else if (!/\.(webp|png|jpe?g)(\?|$)/i.test(image))
    problems.push('og:image is not a raster file')
  if (!tags['twitter:card']) problems.push('missing twitter:card')
  return problems
}

export function namesThisCabinet(
  tags: Record<string, string>,
  target: Pick<ArcadeShareTarget, 'title'>,
): boolean {
  return (tags['og:title'] ?? '').includes(target.title)
}
