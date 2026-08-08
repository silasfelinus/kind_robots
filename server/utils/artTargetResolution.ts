// /server/utils/artTargetResolution.ts
//
// Maps a requested image PATH to the entity ROW that owns it.
//
// Why this exists: `projects/art-prompts.yaml` is a durable replay queue. Art
// requests were written into that file, committed to Conductor over the GitHub
// API, and drained by an hourly consumer that minted ArtJobs from whatever text
// was stored there. On 2026-08-08 that cost a full day — every repair to the
// live queue was silently undone when the consumer replayed the stale prompt at
// a higher priority, re-rendering the crowd on top of the corrected image.
//
// The file only ever existed because some art targets are identified by file
// path rather than by a row. A Reward, Dream, Character, Scenario, Facet or
// Project already HAS a row, and `entityArt` attaches art to it directly — that
// lane never needed the YAML and never had the replay bug. Measured on the live
// queue: 2,782 of 2,868 pending jobs already target an entity row. The path-only
// remainder is roughly 3% (page channels, dashboard tabs, academy assets), and
// those genuinely need byte placement at an exact media path until they get
// rows of their own.
//
// So: resolve what we can to a row and enqueue it directly, leaving a small,
// named, measurable tail rather than a blanket rewrite.
import type { EntityArtType } from './entityArt'

export type ResolvedArtTarget = {
  entityType: EntityArtType
  field: string
  /** Slug or identifying fragment lifted from the path; the caller looks it up. */
  lookup: { slug?: string; id?: number; rewardType?: string; variant?: string }
}

const VARIANT_FIELD: Record<string, string> = {
  icon: 'imagePath',
  card: 'cardPath',
  hero: 'heroPath',
}

/**
 * Patterns are ordered most-specific first. Each captures enough to find the
 * row without guessing: a slug, or a slug plus the variant that names the slot.
 */
const PATH_RULES: Array<{
  pattern: RegExp
  build: (match: RegExpMatchArray) => ResolvedArtTarget
}> = [
  // public/images/rewards/item/item-tidefortune-ladle.webp
  {
    pattern:
      /^public\/images\/rewards\/(item|skill|pet|power|favor|magic)\/([a-z0-9-]+)\.[a-z0-9]+$/i,
    build: (m) => ({
      entityType: 'reward',
      field: 'imagePath',
      lookup: { slug: m[2]!.toLowerCase(), rewardType: m[1]!.toUpperCase() },
    }),
  },
  // Deliberately NOT handled: public/images/dreams/<dream>/<element>-card.webp.
  // A dream folder holds elements of four different types — its world and
  // location are Dream rows, but its character is a Character, its rewards are
  // Rewards, and its scenario is a Scenario. The path cannot tell them apart:
  // `dreams/undermoon-bloom/mythroot-whisper-card.webp` looks like a Dream and
  // is in fact a Reward. Resolving it by folder would attach art to the wrong
  // row, or to no row at all.
  //
  // Nothing is lost by skipping it. Dream art is already enqueued with an
  // explicit entity target by Conductor's build_dream_records (`queue_art`
  // passes entity_type/entity_id), so this path only appears on legacy jobs.
  // Guessing here would be worse than falling through to path delivery.
  // projects/images/<slug>-icon.webp   (Conductor's own project assets — the
  // only generated images still committed to a git repo)
  {
    pattern: /^projects\/images\/([a-z0-9-]+)-(icon|card|hero)\.[a-z0-9]+$/i,
    build: (m) => ({
      entityType: 'project',
      field: VARIANT_FIELD[m[2]!.toLowerCase()]!,
      lookup: { slug: m[1]!.toLowerCase(), variant: m[2]!.toLowerCase() },
    }),
  },
  // public/images/projects/<slug>/hero.webp
  {
    pattern:
      /^public\/images\/projects\/([a-z0-9-]+)\/(icon|card|hero)\.[a-z0-9]+$/i,
    build: (m) => ({
      entityType: 'project',
      field: VARIANT_FIELD[m[2]!.toLowerCase()]!,
      lookup: { slug: m[1]!.toLowerCase(), variant: m[2]!.toLowerCase() },
    }),
  },
]

/**
 * Targets with no row today. Named explicitly rather than falling through
 * silently, so the remaining migration surface is countable instead of folklore.
 */
export const UNROWED_PATH_PREFIXES = [
  'public/images/channels/',
  'public/images/dashboard-tabs/',
  'public/images/academy/',
  'public/images/artcollections/',
] as const

export function isKnownUnrowedTarget(imagePath: string): boolean {
  const path = String(imagePath || '').replace(/^\/+/, '')
  return UNROWED_PATH_PREFIXES.some((prefix) => path.startsWith(prefix))
}

/**
 * The entity a requested image path belongs to, or null when the path has no
 * row behind it. Null is a legitimate answer — see UNROWED_PATH_PREFIXES — and
 * means the caller should fall back to path-based delivery.
 */
export function resolveArtTargetFromPath(
  imagePath: string,
): ResolvedArtTarget | null {
  const path = String(imagePath || '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .split(/[?#]/, 1)[0]!
  if (!path) return null

  for (const rule of PATH_RULES) {
    const match = path.match(rule.pattern)
    if (match) return rule.build(match)
  }
  return null
}
