// /server/utils/artFailureSignature.ts
//
// Normalizes an ArtJob.error string into a small, stable set of known
// failure signatures, and groups a batch of failed-job records by that
// signature (and, within each signature, by projectSlug).
//
// Why this exists (ai-art-academy/t-073): GET /api/art/queue/stats'
// `recentFailed` is a flat list of raw error strings. Two consumers had
// independently converged on the same workaround -- manually reading that
// raw list to answer "is my project's queue actually healthy, or is this
// just an already-tracked issue on a different project?":
//   - a human/agent verifying a render by eye (ai-art-academy/t-069's
//     close-out, which had to rule out t-068's facet-catalog/dream-cycle
//     CLIPTextEncode failures before trusting its own clean job)
//   - `scripts/recheck_render_queue.py`'s own `summarize_failures()`, whose
//     substring match on "workflow error" collapsed t-068's specific
//     `hostbuf_file_reader_read failed` CLIPTextEncode signature into the
//     same generic "workflow error" bucket as any other unrelated node
//     failure -- exactly the loss of detail this module fixes.
//
// Pure, dependency-free logic (no prisma, no H3) so it can be unit-tested
// directly and reused by any consumer (this repo's stats endpoint today;
// conductor's recheck_render_queue.py mirrors the same signature set in
// Python since it runs outside this repo's runtime).

export type ArtFailureSignatureId =
  | 'connection-refused'
  | 'lora-not-in-list'
  | 'hostbuf-file-reader-read'
  | 'charmap-codec'
  | 'workflow-error-other'
  | 'no-error-text'
  | 'other'

export interface ArtFailureSignatureMatch {
  /** Stable, machine-readable key -- safe to use as a grouping/sort key. */
  signature: ArtFailureSignatureId
  /** Short human-readable description of what this signature means. */
  label: string
}

interface KnownSignature {
  id: ArtFailureSignatureId
  label: string
  test: (error: string) => boolean
}

// Order matters: more specific patterns are checked before the generic
// "workflow error" catch-all, so a known node-level failure (e.g.
// hostbuf_file_reader_read) is never swallowed by the broader substring
// match the way recheck_render_queue.py's original summarize_failures() did.
const KNOWN_SIGNATURES: KnownSignature[] = [
  {
    id: 'connection-refused',
    label: 'ComfyUI unreachable (connection refused)',
    test: (error) =>
      /actively refused/i.test(error) ||
      /\b10061\b/.test(error) ||
      /ConnectionRefused/i.test(error),
  },
  {
    id: 'lora-not-in-list',
    label: 'LoRA name not in list (asset-name resolution)',
    test: (error) => /lora_name/i.test(error) && /not in \(?list/i.test(error),
  },
  {
    id: 'hostbuf-file-reader-read',
    label: 'hostbuf_file_reader_read failed (CLIPTextEncode node)',
    test: (error) => /hostbuf_file_reader_read/i.test(error),
  },
  {
    id: 'charmap-codec',
    label: "'charmap' codec encoding crash (non-ASCII log line)",
    test: (error) => /'charmap' codec/i.test(error),
  },
  {
    id: 'workflow-error-other',
    label: 'ComfyUI workflow error (other/unspecified node)',
    test: (error) => /workflow error/i.test(error),
  },
]

/**
 * Classify a single raw ArtJob.error string into a known signature, or an
 * `other` fallback carrying a truncated, id/path-stripped snippet of the raw
 * text (so distinct-but-unrecognized errors don't all collapse into one
 * bucket, while still remaining a bounded, stable-ish grouping key).
 */
export function classifyArtFailureSignature(
  error: string | null | undefined,
): ArtFailureSignatureMatch {
  const text = String(error ?? '').trim()
  if (!text) {
    return { signature: 'no-error-text', label: '(no error text)' }
  }

  for (const known of KNOWN_SIGNATURES) {
    if (known.test(text)) {
      return { signature: known.id, label: known.label }
    }
  }

  // Fallback: strip common job-specific/variable substrings (numeric ids,
  // file paths, quoted asset names) so near-identical unrecognized errors
  // still collapse together instead of each producing its own bucket.
  const normalized = text
    .replace(/\b\d{3,}\b/g, '#') // job/node/line-ish numeric ids
    .replace(/(['"])(?:(?!\1).)*\1/g, '<name>') // quoted names/paths
    .replace(/[\\/][\w.-]+(?:[\\/][\w.-]+)+/g, '<path>') // file paths
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)

  return { signature: 'other', label: normalized || '(unrecognized error)' }
}

export interface ArtFailureGroupProjectCount {
  projectSlug: string | null
  count: number
}

export interface ArtFailureSignatureGroup {
  signature: ArtFailureSignatureId
  label: string
  count: number
  projectSlugs: ArtFailureGroupProjectCount[]
}

/**
 * Group a batch of failed-job records (as returned by the recentFailed
 * query -- anything carrying `error` and `projectSlug`) by normalized error
 * signature, and within each signature by projectSlug. Sorted by count
 * descending (signature, then projectSlug within it) so the most impactful
 * failure pattern for the busiest project surfaces first.
 */
export function groupArtFailuresBySignature<
  T extends { error?: string | null; projectSlug?: string | null },
>(entries: readonly T[]): ArtFailureSignatureGroup[] {
  const bySignature = new Map<
    ArtFailureSignatureId,
    { label: string; byProject: Map<string | null, number> }
  >()

  for (const entry of entries) {
    const { signature, label } = classifyArtFailureSignature(entry.error)
    const projectSlug = entry.projectSlug ?? null

    let group = bySignature.get(signature)
    if (!group) {
      group = { label, byProject: new Map() }
      bySignature.set(signature, group)
    }
    group.byProject.set(
      projectSlug,
      (group.byProject.get(projectSlug) ?? 0) + 1,
    )
  }

  const groups: ArtFailureSignatureGroup[] = []
  for (const [signature, { label, byProject }] of bySignature) {
    const projectSlugs = Array.from(byProject.entries())
      .map(([projectSlug, count]) => ({ projectSlug, count }))
      .sort((a, b) => b.count - a.count)
    const count = projectSlugs.reduce((sum, p) => sum + p.count, 0)
    groups.push({ signature, label, count, projectSlugs })
  }

  return groups.sort((a, b) => b.count - a.count)
}
