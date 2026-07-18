// /server/api/newsfeed/index.get.ts
//
// Aggregates one or more recommended feeds (conductor projects/newsfeed t-005).
// ?feed=ai-news              -- a single feed
// ?feeds=ai-news,activism    -- several feeds
// (neither)                  -- every default-enabled feed
//
// Cached 15 minutes via defineCachedEventHandler: this repo has no prior
// caching precedent (DESIGN-BRIEF.md), and 15 minutes is far below how often
// any of these RSS sources actually publish, so it bounds egress to the ~15
// source hosts to 4x/hour regardless of homepage traffic.
import { getQuery } from 'h3'
import {
  defaultEnabledFeedSlugs,
  getFeedDefinition,
  isFeedSlug,
} from '@/stores/helpers/newsfeed'
import { aggregateFeed } from '../../utils/newsfeed'
import { errorHandler } from '../../utils/error'

const CACHE_TTL_SECONDS = 60 * 15

function requestedSlugs(query: Record<string, unknown>): string[] {
  const single = typeof query.feed === 'string' ? [query.feed] : []
  const many =
    typeof query.feeds === 'string'
      ? query.feeds
          .split(',')
          .map((slug) => slug.trim())
          .filter(Boolean)
      : []

  const slugs = [...single, ...many]
  return slugs.length ? slugs : defaultEnabledFeedSlugs()
}

export default defineCachedEventHandler(
  async (event) => {
    try {
      const query = getQuery(event)
      const slugs = requestedSlugs(query)
      const invalid = slugs.filter((slug) => !isFeedSlug(slug))

      if (invalid.length) {
        throw createError({
          statusCode: 400,
          statusMessage: `Unknown feed slug(s): ${invalid.join(', ')}`,
        })
      }

      const feeds = slugs
        .map((slug) => getFeedDefinition(slug))
        .filter((feed): feed is NonNullable<typeof feed> => Boolean(feed))

      const aggregated = await Promise.all(
        feeds.map((feed) => aggregateFeed(feed)),
      )
      const itemCount = aggregated.reduce(
        (sum, feed) => sum + feed.items.length,
        0,
      )

      return {
        success: true,
        message: `Aggregated ${itemCount} item(s) across ${aggregated.length} feed(s).`,
        data: aggregated,
      }
    } catch (error) {
      const { message, statusCode } = errorHandler(error)
      event.node.res.statusCode = statusCode || 500

      return {
        success: false,
        message: message || 'Failed to aggregate newsfeed.',
        data: null,
        statusCode: event.node.res.statusCode,
      }
    }
  },
  {
    maxAge: CACHE_TTL_SECONDS,
    name: 'newsfeed',
    getKey: (event) =>
      requestedSlugs(getQuery(event)).slice().sort().join(',') || 'default',
  },
)
