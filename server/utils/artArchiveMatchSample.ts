// /server/utils/artArchiveMatchSample.ts
//
// Caps the per-file resource-match evidence a scan response carries.
//
// The dry-run and import endpoints returned one entry per scanned file. The
// aggregate counts beside it (filesWithMatchEvidence, unmatchedModels,
// confidenceCounts) are what the admin panel and the CLI actually read; the
// array was for eyeballing provenance, and on a large archive it is the single
// largest thing the handler builds and serializes -- while that handler is
// already the one that SIGKILLed the container mid-scan (art-archive/t-041,
// 2026-09-22).
//
// So it stays, bounded: the files that actually carry evidence come first,
// because a file with no metadata match is the least interesting row to read.
// The counts are never sampled.

export const RESOURCE_MATCH_SAMPLE_LIMIT = 50

type MatchEntry = {
  relativePath: string
  matches: { checkpoint: unknown; loras: unknown[] }
}

export function sampleResourceMatches<Entry extends MatchEntry>(
  entries: readonly Entry[],
  limit: number = RESOURCE_MATCH_SAMPLE_LIMIT,
): {
  resourceMatches: Entry[]
  resourceMatchesTotal: number
  resourceMatchesTruncated: boolean
} {
  // Single pass, and it stops as soon as the cap is met: this runs over every
  // file in the archive, so an O(n^2) "is it already in the list" check here
  // would reintroduce the class of problem this file exists to remove.
  const sample: Entry[] = []
  const withoutEvidence: Entry[] = []
  for (const entry of entries) {
    const hasEvidence =
      entry.matches.checkpoint !== null || entry.matches.loras.length > 0
    if (hasEvidence) {
      if (sample.length < limit) sample.push(entry)
    } else if (withoutEvidence.length < limit) {
      withoutEvidence.push(entry)
    }
  }
  for (const entry of withoutEvidence) {
    if (sample.length >= limit) break
    sample.push(entry)
  }

  return {
    resourceMatches: sample,
    resourceMatchesTotal: entries.length,
    resourceMatchesTruncated: entries.length > sample.length,
  }
}
