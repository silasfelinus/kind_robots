// /utils/comments/populationTargets.ts
//
// The target list for the population pass, defined once.
//
// WHY
// ---
// #1769 filled every Reward and Facet. Everything else a visitor can open is
// still silent: 69 Bots, 227 Characters, 48 Dreams, 116 Scenarios and 36
// Projects, all public, all allowReviews, all with exactly zero comments
// (surveyed 2026-08-13 against the live API).
//
// Silas: "We want the users to feel like they're stepping into a populated
// universe where there are interactions anywhere you look."
//
// The facet lane learned one thing the hard way: the payload is matched to
// production targets BY POSITION, so the exporter and the publisher have to
// derive the eligible list identically. There they were two functions in two
// files that happened to agree. Here the ordering, the filter and the shape
// rule live in this module and both sides import them, so they cannot drift.
//
// EXCLUDED, deliberately
// ----------------------
// Art objects (ArtImage, ArtCollection), Achievements, Icons and Themes are out
// at Silas's instruction. Prompt (3,274 rows) and Chat (3,585) are out by
// judgement: those are user-generated volume rather than catalogue entries --
// ten times the rest of the site combined -- and a hand-authored remark on
// somebody's chat log reads as surveillance, not atmosphere.

/** The object types this pass writes comments onto. */
export const POPULATION_TARGET_TYPES = [
  'BOT',
  'CHARACTER',
  'DREAM',
  'SCENARIO',
  'PROJECT',
] as const

export type PopulationTargetType = (typeof POPULATION_TARGET_TYPES)[number]

/**
 * Exchange shapes for this pass.
 *
 * SOLO is one remark about the object.
 *
 * VISIT_REPLY is the shape Silas asked for on anything that can talk back:
 * "it should be someone commenting on a bot and the bot responding to them."
 * Speaker 0 is a visitor cast from the pool; speaker 1 is THE TARGET ITSELF,
 * answering. That second speaker is not a casting decision -- it is determined
 * by which object is being commented on -- which is what separates this from
 * the facet lane's DUET_REPLY, where both halves were cast.
 */
export type PopulationShape = 'SOLO' | 'VISIT_REPLY'

export function populationSpeakerCount(shape: PopulationShape): number {
  return shape === 'SOLO' ? 1 : 2
}

/**
 * Bots and Characters are first-party speakers in this system -- they own
 * authorBotId / authorCharacterId, voice seeds and archived samples -- so they
 * can answer for themselves. Nothing else here can, so nothing else replies.
 */
export function populationShapeFor(
  type: PopulationTargetType,
): PopulationShape {
  return type === 'BOT' || type === 'CHARACTER' ? 'VISIT_REPLY' : 'SOLO'
}

/**
 * For a VISIT_REPLY target, the speaker that must occupy slot 1. A Bot answers
 * as itself; a Character answers as itself. Returns null for SOLO targets.
 *
 * Both sides check against this rather than trusting the packet, because a
 * mismatch here would publish a Bot's own answer under another Bot's name.
 */
export function populationSelfSpeaker(
  type: PopulationTargetType,
  id: number,
): { kind: 'BOT' | 'CHARACTER'; id: number } | null {
  if (type === 'BOT') return { kind: 'BOT', id }
  if (type === 'CHARACTER') return { kind: 'CHARACTER', id }
  return null
}

/** Minimal row shape shared by the API and the database loaders. */
export type PopulationRow = Record<string, unknown>

const text = (value: unknown): string => String(value ?? '').trim()

/**
 * A target is eligible when it is public, not switched off, and has enough text
 * to react to honestly. The last clause matters: an untitled Dream with no
 * pitch gives a speaker nothing to say, and a comment written about nothing
 * reads as filler -- which is the failure this whole pass exists to avoid.
 */
export function isEligiblePopulationRow(
  type: PopulationTargetType,
  row: PopulationRow,
): boolean {
  if (row.isPublic === false) return false
  if (row.allowReviews === false) return false
  // Bot and Character have no isActive column; the rest default it to true.
  if (type !== 'BOT' && type !== 'CHARACTER' && row.isActive === false) {
    return false
  }
  return Boolean(populationTargetTitle(type, row)) && hasSubstance(type, row)
}

function hasSubstance(type: PopulationTargetType, row: PopulationRow): boolean {
  switch (type) {
    case 'BOT':
      return Boolean(
        text(row.botIntro) ||
          text(row.description) ||
          text(row.personality) ||
          text(row.tagline) ||
          text(row.subtitle),
      )
    case 'CHARACTER':
      return Boolean(
        text(row.personality) ||
          text(row.backstory) ||
          text(row.drive) ||
          text(row.quirks) ||
          text(row.role),
      )
    case 'DREAM':
      return Boolean(
        text(row.pitch) || text(row.description) || text(row.flavorText),
      )
    case 'SCENARIO':
      return Boolean(
        text(row.description) ||
          text(row.intro) ||
          text(row.locations) ||
          text(row.genres),
      )
    case 'PROJECT':
      return Boolean(text(row.description) || text(row.pitch))
  }
}

/** The display name for a target, by type. Each model spells it differently. */
export function populationTargetTitle(
  type: PopulationTargetType,
  row: PopulationRow,
): string {
  if (type === 'PROJECT' || type === 'DREAM' || type === 'SCENARIO') {
    return text(row.title) || text(row.name)
  }
  return text(row.name) || text(row.title)
}

/**
 * Order the eligible rows into the positional list both sides rely on: by type
 * in POPULATION_TARGET_TYPES order, then by ascending id within each type.
 *
 * Sorting numerically on Number(id) rather than lexically is not incidental --
 * a string sort puts id 10 before id 9 and silently shifts every later comment
 * onto the wrong object.
 */
export function orderPopulationTargets<
  T extends { type: PopulationTargetType; id: number },
>(targets: T[]): T[] {
  const rank = new Map<PopulationTargetType, number>(
    POPULATION_TARGET_TYPES.map((type, index) => [type, index]),
  )
  return [...targets].sort((left, right) => {
    const byType = rank.get(left.type)! - rank.get(right.type)!
    return byType !== 0 ? byType : left.id - right.id
  })
}

/** `BOT:14`, `CHARACTER:215`. The key a packet item carries. */
export function populationTargetKey(
  type: PopulationTargetType,
  id: number,
): string {
  return `${type}:${id}`
}
