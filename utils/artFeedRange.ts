// /utils/artFeedRange.ts
//
// The Art Gallery feed's creation-date windows, shared by the feed component,
// artFeedStore and GET /api/art/image/feed so all three agree on what each
// choice means. `recent` stays the seven-day default it has always been.
export type ArtFeedRange =
  'day' | 'recent' | 'month' | 'quarter' | 'year' | 'all'

export type ArtFeedRangeOption = {
  value: ArtFeedRange
  label: string
  days: number | null
}

export const ART_FEED_RANGES: readonly ArtFeedRangeOption[] = [
  { value: 'day', label: 'Last 24 hours', days: 1 },
  { value: 'recent', label: 'Last 7 days', days: 7 },
  { value: 'month', label: 'Last 30 days', days: 30 },
  { value: 'quarter', label: 'Last 90 days', days: 90 },
  { value: 'year', label: 'Last year', days: 365 },
  { value: 'all', label: 'All time', days: null },
]

export const DEFAULT_ART_FEED_RANGE: ArtFeedRange = 'recent'

export function isArtFeedRange(value: unknown): value is ArtFeedRange {
  return ART_FEED_RANGES.some((option) => option.value === value)
}

export function artFeedRangeDays(value: unknown): number | null {
  return ART_FEED_RANGES.find((option) => option.value === value)?.days ?? null
}

export function artFeedRangeLabel(value: unknown): string {
  return (
    ART_FEED_RANGES.find((option) => option.value === value)?.label ??
    'All time'
  )
}
