import type { Playbook } from '../playbook/types'
import type { AdditionKind } from './adjust'
import type { Design } from './designs'
import { newDesignId } from './designs'
import { SPARK_SLOTS, type FacetCard, type Spark } from './facets'

// The Forge catalogue: everything Kind Robots already has, browsed by its art
// for brainstorming. Facets, Characters, Scenarios, Rewards, Locations (SETTING
// Facets, Scenario locations and every game's places) and the games' own
// painted beats. Picks go to a tray that starts a playbook or adds designs to
// an open one.

export const CATALOG_TABS = [
  { id: 'facets', label: 'Facets' },
  { id: 'characters', label: 'Characters' },
  { id: 'locations', label: 'Locations' },
  { id: 'scenarios', label: 'Scenarios' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'beats', label: 'Game art' },
] as const
export type CatalogTab = (typeof CATALOG_TABS)[number]['id']

export type CatalogItem = {
  /** `<tab>:<id>`, unique across the catalogue. */
  key: string
  tab: CatalogTab
  title: string
  /** Taxonomy, class, rarity, game: one short line. */
  label: string
  blurb: string
  imageUrl: string | null
  prompt: string | null
  facet?: FacetCard
}

type Raw = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/** An entity's picture: its own path, else its ArtImage file. */
export function entityImage(raw: Raw): string | null {
  const path = str(raw.imagePath)
  if (path)
    return path.startsWith('/') || path.startsWith('http') ? path : `/${path}`
  const id = Number(raw.artImageId)
  return Number.isInteger(id) && id > 0 ? `/api/art/images/${id}/file` : null
}

export function facetItem(card: FacetCard): CatalogItem {
  return {
    key: `facets:${card.id}`,
    tab: 'facets',
    title: card.title,
    label: card.taxonomy.toLowerCase().replace(/_/g, ' '),
    blurb: (card.flavorText || card.description || '').trim(),
    imageUrl: card.imagePath
      ? entityImage({ imagePath: card.imagePath })
      : null,
    prompt: card.artPrompt,
    facet: card,
  }
}

export function characterItem(raw: Raw): CatalogItem | null {
  const name = str(raw.name)
  if (!name) return null
  return {
    key: `characters:${raw.id}`,
    tab: 'characters',
    title: [str(raw.honorific), name].filter(Boolean).join(' '),
    label: [str(raw.species), str(raw.class), str(raw.genre)]
      .filter(Boolean)
      .join(' · '),
    blurb: str(raw.title) || str(raw.role),
    imageUrl: entityImage(raw),
    prompt: null,
  }
}

export function scenarioItem(raw: Raw): CatalogItem | null {
  const title = str(raw.title)
  if (!title) return null
  return {
    key: `scenarios:${raw.id}`,
    tab: 'scenarios',
    title,
    label: str(raw.genres).split(/[,|]/)[0]?.trim() ?? '',
    blurb: str(raw.description),
    imageUrl: entityImage(raw),
    prompt: str(raw.artPrompt) || null,
  }
}

export function rewardItem(raw: Raw): CatalogItem | null {
  const name = str(raw.name)
  if (!name) return null
  return {
    key: `rewards:${raw.id}`,
    tab: 'rewards',
    title: name,
    label: str(raw.rarity).toLowerCase(),
    blurb: str(raw.flavorText) || str(raw.description),
    imageUrl: entityImage(raw),
    prompt: null,
  }
}

/** Scenario locations, one item per named place (they are stored as text). */
export function scenarioLocations(raw: Raw): CatalogItem[] {
  const text = str(raw.locations)
  if (!text) return []
  return text
    .split(/\n|;|\|/)
    .map((line) => line.replace(/^[-*•\s]+/, '').trim())
    .filter((line) => line.length > 2 && line.length < 140)
    .slice(0, 12)
    .map((line, i) => ({
      key: `locations:scenario-${raw.id}-${i}`,
      tab: 'locations' as const,
      title: line.split(/[:—-]/)[0]!.trim() || line,
      label: `from ${str(raw.title)}`,
      blurb: line,
      imageUrl: null,
      prompt: null,
    }))
}

/** Every place the games already paint, one card per place with its first picture. */
export function gamePlaces(game: string, book: Playbook): CatalogItem[] {
  const seen = new Map<string, CatalogItem>()
  for (const key of book.order) {
    const node = book.nodes[key]
    const place = node?.place?.split('·')[0]?.trim()
    if (!node || !place || seen.has(place)) continue
    seen.set(place, {
      key: `locations:${game}:${place}`,
      tab: 'locations',
      title: place,
      label: book.title,
      blurb: node.title,
      imageUrl: node.artUrl,
      prompt: node.artPrompt ?? null,
    })
  }
  return [...seen.values()]
}

/** Every painted beat of a game, for the game-art shelf. */
export function gameBeats(game: string, book: Playbook): CatalogItem[] {
  return book.order.flatMap((key) => {
    const node = book.nodes[key]
    if (!node?.artUrl) return []
    return [
      {
        key: `beats:${game}:${key}`,
        tab: 'beats' as const,
        title: node.title,
        label: `${book.title} · ${node.kind}`,
        blurb: node.place,
        imageUrl: node.artUrl,
        prompt: node.artPrompt ?? null,
      },
    ]
  })
}

const KIND_FOR: Record<CatalogTab, AdditionKind> = {
  facets: 'other',
  characters: 'follower',
  locations: 'place',
  scenarios: 'other',
  rewards: 'other',
  beats: 'other',
}

/** A tray pick as a design for a playbook: a character becomes a follower, a location a place. */
export function itemDesign(item: CatalogItem): Design {
  return {
    id: newDesignId(),
    kind:
      item.tab === 'facets' && item.facet?.taxonomy === 'SETTING'
        ? 'place'
        : KIND_FOR[item.tab],
    title: item.title,
    note: [item.label, item.blurb].filter(Boolean).join(' — ').slice(0, 600),
    ...(item.prompt ? { prompt: item.prompt } : {}),
    ...(item.imageUrl ? { imageUrl: item.imageUrl } : {}),
    source: `Catalogue: ${item.tab} ${item.title}`,
  }
}

/** Facet picks become sparks in the slot their taxonomy feeds; a GENRE pick is the genre. */
export function itemSpark(item: CatalogItem): Spark | null {
  const card = item.facet
  if (!card) return null
  const slot =
    card.taxonomy === 'GENRE'
      ? 'genre'
      : SPARK_SLOTS.find((s) => s.taxonomies.includes(card.taxonomy))?.id
  if (!slot) return null
  return {
    slot,
    facetId: card.id,
    taxonomy: card.taxonomy,
    title: card.title,
    description: item.blurb.slice(0, 240),
    ...(card.artPrompt ? { artPrompt: card.artPrompt.slice(0, 400) } : {}),
  }
}

export function matches(item: CatalogItem, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return `${item.title} ${item.label} ${item.blurb}`.toLowerCase().includes(q)
}
