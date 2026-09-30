// /utils/cthulhuquariumBook.ts
//
// The Ichthyonomicon's vocabulary: which lineage each plate comes from (the
// canon's ART-DIRECTION.md "The eight plates" -- the book is a scrapbook
// assembled over eighty years, and each species was recorded in whatever
// medium existed when it was found), and the compact stat line the book and
// the tank cards share.

import { CTHULHUQUARIUM_PLATES } from './cthulhuquariumCanon.generated'

export const PLATE_LINEAGES: Record<string, { name: string; note: string }> = {
  gosse: {
    name: 'Hand-coloured lithograph',
    note: 'after Gosse, 1850s',
  },
  blaschka: {
    name: 'Lampworked glass model',
    note: 'after the Blaschkas, 1860–1930',
  },
  gyotaku: { name: 'Ink rubbing', note: 'pressed from the animal' },
  'trade-card': { name: 'Cigarette card', note: 'chromolithograph, c.1900' },
  scraperboard: { name: 'Scraperboard', note: 'white line cut from black' },
  haeckel: { name: 'Ornamental plate', note: 'after Haeckel' },
  moulage: { name: 'Wet specimen', note: 'kept in fluid' },
  riso: { name: 'Risograph', note: 'two spot inks, misregistered' },
}

export function plateFor(
  slug: string | null | undefined,
): { key: string; name: string; note: string } | null {
  const key = slug ? CTHULHUQUARIUM_PLATES[slug] : undefined
  const lineage = key ? PLATE_LINEAGES[key] : undefined
  return key && lineage ? { key, ...lineage } : null
}

export type StatBlock = {
  charm: number | null
  empathy: number | null
  grace: number | null
  luck: number | null
  might: number | null
  wits: number | null
}

const STAT_LABELS: Record<keyof StatBlock, string> = {
  charm: 'CHA',
  empathy: 'EMP',
  grace: 'GRA',
  luck: 'LUC',
  might: 'MGT',
  wits: 'WIT',
}

/** "CHA 3 · GRA 5": only the stats that were ever recorded. */
export function formatBestStats(stats: StatBlock): string {
  return (Object.keys(STAT_LABELS) as Array<keyof StatBlock>)
    .filter((key) => stats[key] != null)
    .map((key) => `${STAT_LABELS[key]} ${stats[key]}`)
    .join(' · ')
}
