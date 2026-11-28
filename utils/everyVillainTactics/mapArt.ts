import { VERIFIED_EVT_ARENA_RECEIPTS } from './verifiedArenaReceipts.generated'

/**
 * The art modeler's finished private paintings, recorded with ArtJob
 * provenance in conductor/projects/every-villain-tactics/art/
 * TACTICAL-ARENAS-ROUND-1.yaml plus dedicated diner, sunken-street and
 * Valcourt-library ledgers. Verified private media receipts override fallback
 * mappings; a DONE ledger without byte proof cannot displace an original.
 * Do not replace these with SVG or CSS illustrations in the playable map.
 */
const verifiedArenaImageIds = Object.fromEntries(
  Object.entries(VERIFIED_EVT_ARENA_RECEIPTS).map(([stage, receipt]) => [
    stage,
    receipt.imageId,
  ]),
)

export const PAINTED_EVT_MAP_ART: Readonly<Record<string, number>> = {
  'first-bell': 265014,
  'college-quad': 265015,
  'science-lab': 265017,
  'crosswalk-crisis': 265022,
  'rooftop-broadcast': 265023,
  'under-comet-breach': 265024,
  'prom-night-finale': 265025,
  'quarry-lieutenant': 265019,
  'picnic-plaza': 265016,
  'quad-portal-watch': 265015,
  'fountain-hold': 265015,
  'lab-mascot-recall': 265017,
  'boiler-room': 265018,
  // Temporary Harborline location plate, not Ferris Wheel production art.
  'ferris-wheel': 265022,
  // Existing media-tower painting; unique studio arena art is still outstanding.
  'song-that-stopped': 265023,
  'hydrant-blue': 265018,
  'clocktower-collapse': 265015,
  'equation-that-escaped': 265017,
  'candle-that-wouldnt-die': 265015,
  'orchard-under-asphalt': 265015,
  'future-in-the-glass': 265017,
  'overdue-thunder': 265015,
  'bell-and-the-door': 265015,
  'when-two-plus-two-screamed': 265017,
  'heir-who-said-no': 265015,
  'empty-applause': 265015,
  'ashes-of-the-ledger': 265015,
  'balcony-witness': 265015,
  'bridge-of-last-chances': 265022,
  'ship-with-no-port': 265022,
  'four-hands-and-a-promise': 265014,
  'probability-of-panic': 265017,
  'keys-to-the-shelter': 265015,
  'friend-nobody-remembers': 265015,
  ...verifiedArenaImageIds,
}

export function paintedMapArtId(stageId: string | null): number | null {
  if (stageId === null) return PAINTED_EVT_MAP_ART['first-bell'] ?? null
  return PAINTED_EVT_MAP_ART[stageId] ?? null
}
