/**
 * The art modeler's finished private paintings, recorded with ArtJob
 * provenance in conductor/projects/every-villain-tactics/art/
 * TACTICAL-ARENAS-ROUND-1.yaml plus dedicated diner, sunken-street and
 * Valcourt-library ledgers. All IDs below are DONE ArtImages.
 * Do not replace these with SVG or CSS illustrations in the playable map.
 */
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
  // LAST-ORDER-DINER-ROUND-1.yaml: ArtJob 71163.
  'last-order': 276806,
  // Temporary Harborline location plate, not Ferris Wheel production art.
  'ferris-wheel': 265022,
  // SUNKEN-STREET-ROUND-1.yaml: ArtJob 74323.
  'sunken-street': 277221,
  // VALCOURT-LIBRARY-ROUND-1.yaml: ArtJob 74324.
  'unlicensed-rescue': 277330,
  // Existing media-tower painting; unique studio arena art is still outstanding.
  'song-that-stopped': 265023,
}

export function paintedMapArtId(stageId: string | null): number | null {
  if (stageId === null) return PAINTED_EVT_MAP_ART['first-bell'] ?? null
  return PAINTED_EVT_MAP_ART[stageId] ?? null
}
