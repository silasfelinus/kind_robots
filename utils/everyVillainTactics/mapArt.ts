/**
 * The art modeler's finished private paintings, recorded with ArtJob
 * provenance in conductor/projects/every-villain-tactics/art/
 * TACTICAL-ARENAS-ROUND-1.yaml. All IDs below are DONE ArtImages.
 * Do not replace these with SVG or CSS illustrations in the playable map.
 */
export const PAINTED_EVT_MAP_ART: Readonly<Record<string, number>> = {
  'first-bell': 265014,
  'college-quad': 265015,
  'science-lab': 265017,
  'crosswalk-crisis': 265022,
  'quarry-lieutenant': 265019,
  'picnic-plaza': 265016,
  'quad-portal-watch': 265015,
  'fountain-hold': 265015,
  'lab-mascot-recall': 265017,
  'boiler-room': 265018,
}

export function paintedMapArtId(stageId: string | null): number | null {
  if (stageId === null) return PAINTED_EVT_MAP_ART['first-bell'] ?? null
  return PAINTED_EVT_MAP_ART[stageId] ?? null
}
