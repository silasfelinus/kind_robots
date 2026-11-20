import manifest from './deliveredEventArt.json'
import type { OverworldArt } from './overworldEventCatalog'

/**
 * Memory Dungeon event art that is verifiably served by the media host.
 *
 * The overworld catalog builds every scene, portrait and choice image path from
 * its content. A path is only shown in-game once a file exists at it, so the
 * stages read this committed manifest instead of assuming art is missing.
 * Regenerate with `npm run memory:delivered-art` after renders land (it probes
 * each catalog path with a ranged GET; the media host answers HEAD with 404).
 */
const DELIVERED: ReadonlySet<string> = new Set(manifest.paths)

export function isDeliveredEventArt(path: string): boolean {
  return DELIVERED.has(path)
}

export function eventArtStatus(path: string): OverworldArt['status'] {
  return DELIVERED.has(path) ? 'delivered' : 'placeholder'
}

export const DELIVERED_EVENT_ART_PATHS: readonly string[] = manifest.paths
