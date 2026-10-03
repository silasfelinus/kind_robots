// /utils/oracle/types.ts
//
// Shared types for the Kind Oracle reading engine (kind-oracle/t-004).
// Pure and DB-free: content is passed in, never fetched.

export type OracleSuit = 'cogs' | 'sparks' | 'currents' | 'breezes'
export type OracleOrientation = 'upright' | 'reversed'
export type OracleEnergy = 'begin' | 'build' | 'hold' | 'flow' | 'shift' | 'end' | 'open'
export type OracleSpreadId = 'one' | 'three' | 'five'
export type OraclePositionId =
  | 'today'
  | 'past'
  | 'present'
  | 'future'
  | 'heart'
  | 'help'
  | 'hinder'
  | 'ground'
  | 'next'

export type OracleCard = {
  id: string
  arcana: 'major' | 'minor'
  order: number
  suit?: OracleSuit
  title: string
  energy: OracleEnergy
  upright: string
  reversed: string
  /** One-line question; the closing line ends on the last card's prompt. */
  prompt: string
}

export type OracleSpreadPosition = { id: OraclePositionId; label: string; frame: string }
export type OracleSpread = { id: OracleSpreadId; label: string; positions: OracleSpreadPosition[] }

export type OracleDrawnCard = {
  card: OracleCard
  orientation: OracleOrientation
  position: OracleSpreadPosition
}

export type OraclePairKind = 'echo' | 'contrast'

/** Everything the engine needs to assemble text; authored elsewhere, shipped as static data. */
export type OracleContent = {
  openings: Record<OracleSpreadId, string[]>
  closings: Record<OracleSpreadId, string[]>
  /** Bespoke passages; optional per card/position, falls back to the position frame. */
  positionText: Partial<
    Record<OraclePositionId, Record<string, Partial<Record<OracleOrientation, string>>>>
  >
  /** Keyed by `${sortedPairKey(energyA, energyB)}:${echo|contrast}`. */
  energyPairs: Record<string, string>
  /** Keyed by sortedPairKey(cardIdA, cardIdB). */
  specialPairs: Record<string, string>
}

export type OracleReading = {
  seed: string
  spread: OracleSpreadId
  cards: OracleDrawnCard[]
  opening: string
  passages: string[]
  pairs: string[]
  closing: string
  /** Opening, each passage followed by its pair text, then closing. */
  text: string
}
