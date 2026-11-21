import { ALIEN_SPECIES, type AlienSpecies } from './alienSpecies'
import { isAlienRunaway, type AlienGuide } from './alienFieldGuide'

export type AlienShelfFilter = 'all' | 'recorded' | 'escaped' | 'unseen'
export type AlienShelfStatus = Exclude<AlienShelfFilter, 'all'>

export type AlienShelfEntry = {
  species: AlienSpecies
  number: number
  status: AlienShelfStatus
}

export const ALIEN_SHELF_FILTERS: readonly {
  id: AlienShelfFilter
  label: string
}[] = [
  { id: 'all', label: 'ALL' },
  { id: 'recorded', label: 'RECORDED' },
  { id: 'escaped', label: 'ESCAPED' },
  { id: 'unseen', label: 'UNSEEN' },
]

const STATUS_ORDER: Record<AlienShelfStatus, number> = {
  recorded: 0,
  escaped: 1,
  unseen: 2,
}

/**
 * A stable, spoiler-safe view of the 101-page field guide.
 * Catalogue numbers never change, and undiscovered species names cannot
 * be searched until a sighting reveals them.
 */
export function alienScrapbookShelf(
  guide: AlienGuide,
  filter: AlienShelfFilter = 'all',
  query = '',
): AlienShelfEntry[] {
  const discovered = new Set(guide.discovered)
  const search = query.trim().toLocaleLowerCase()

  return ALIEN_SPECIES.map((species, index): AlienShelfEntry => ({
    species,
    number: index + 1,
    status: discovered.has(species.id)
      ? 'recorded'
      : isAlienRunaway(guide, species.id)
        ? 'escaped'
        : 'unseen',
  }))
    .filter((entry) => {
      if (filter !== 'all' && entry.status !== filter) return false
      if (!search) return true

      const catalogNumber = String(entry.number).padStart(3, '0')
      return (
        catalogNumber.includes(search) ||
        (entry.status !== 'unseen' &&
          entry.species.name.toLocaleLowerCase().includes(search))
      )
    })
    .sort(
      (a, b) =>
        STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
        a.number - b.number,
    )
}
