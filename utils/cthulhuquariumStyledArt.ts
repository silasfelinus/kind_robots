// utils/cthulhuquariumStyledArt.ts
//
// The files of every non-Classic art style (conductor cthulhuquarium/t-107),
// bundled like the Classic art: assets/images/cthulhuquarium/styles/<id>/
// <folder>/<stem>.webp, synced from the canon by
// scripts/sync_cthulhuquarium_canon.mjs. cthulhuquariumArt.ts and
// cthulhuquariumSprites.ts ask `styledArt(folder, stem)` first and fall back to
// their Classic file when it answers null. Reads the active style, so callers'
// computeds follow a swap.

import {
  activeCthulhuquariumArtStyle,
  pickCthulhuquariumStyledArt,
} from './cthulhuquariumArtStyles'

const modules = import.meta.glob<string>(
  '../assets/images/cthulhuquarium/styles/*/{sprites,portraits,heroes,backgrounds,plates,ui}/*.webp',
  { eager: true, query: '?url', import: 'default' },
)

/** `<style>/<folder>/<stem>` -> built asset URL. */
const styledFiles: Record<string, string> = {}
for (const [path, url] of Object.entries(modules)) {
  const parts = path.split('/')
  const stem = parts[parts.length - 1]?.replace(/\.webp$/, '')
  const folder = parts[parts.length - 2]
  const style = parts[parts.length - 3]
  if (style && folder && stem) styledFiles[`${style}/${folder}/${stem}`] = url
}

/** The active style's file for `folder/stem`, or null to keep Classic. */
export function cthulhuquariumStyledArt(
  folder: string,
  stem: string | null | undefined,
): string | null {
  if (!stem) return null
  return pickCthulhuquariumStyledArt(
    styledFiles,
    activeCthulhuquariumArtStyle.value,
    folder,
    stem.trim().toLowerCase(),
  )
}

/**
 * A style's own file, whatever style is active: the picker shows every style's
 * sample side by side. Null when that style has not rendered it.
 */
export function cthulhuquariumStyleFile(
  style: string,
  folder: string,
  stem: string,
): string | null {
  return styledFiles[`${style}/${folder}/${stem}`] ?? null
}

/** True while a non-Classic style is active (clips and moving plates pause). */
export function cthulhuquariumStyleIsClassic(): boolean {
  return activeCthulhuquariumArtStyle.value === 'classic'
}
