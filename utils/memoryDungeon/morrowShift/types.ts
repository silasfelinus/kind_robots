/**
 * Authored contract for e03 "Morrow's Shift", the first fully hand-written
 * Earth overworld. Row y is one district of the shared Earth geography that
 * e04 later revisits; column x is a stable place inside that district.
 *
 * Choice ids are save data. Regular sites keep the legacy `care` / `risk`
 * ids used by the template-era catalog so existing e03 saves replay; an
 * optional third id may be added. Instant discoveries have exactly one
 * choice, `notice`, which resolves on first arrival and also absorbs any
 * legacy `care` / `risk` answer stored before the rewrite.
 */
import type { OverworldKind } from '../overworldEventCatalog'

export interface MorrowShiftEffects {
  supplies?: number
  trust?: number
  evidence?: number
  danger?: number
}

export interface MorrowShiftChoice {
  /** `care`, `risk`, an optional third id, or `notice` for instant sites. */
  id: string
  label: string
  outcome: string
  effects: MorrowShiftEffects
  /** Concrete visual subject for this choice's illustration. */
  artSubject: string
}

/**
 * Extra line appended to a site's opening when the player already holds
 * `flag` (format `e03:<x>,<y>:<choiceId>`), so earlier decisions are visibly
 * remembered by later places.
 */
export interface MorrowShiftEcho {
  flag: string
  text: string
}

export interface MorrowShiftSite {
  key: string
  /** Stable geography label shared with e04's enchanted revisit. */
  place: string
  title: string
  speaker: string
  kind: OverworldKind
  opening: string
  artSubject: string
  instant?: true
  /** Empty only at the two fixed Chronicle photograph sites (1,3 and 6,4). */
  choices: readonly MorrowShiftChoice[]
  echoes?: readonly MorrowShiftEcho[]
}
