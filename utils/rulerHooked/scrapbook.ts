import type {
  ContentBundle,
  FishopediaEntry,
  RunSave,
} from '~/types/ruler-hooked'

export interface ReignKeepsake {
  saveId: string
  name: string
  turnCount: number
  endingKeys: string[]
  fish: Record<string, FishopediaEntry>
  characters: string[]
}

export type RoyalScrapbook = Record<string, ReignKeepsake>

export function rememberReign(
  archive: RoyalScrapbook,
  save: RunSave,
  bundle: ContentBundle,
): RoyalScrapbook {
  const previous = Object.hasOwn(archive, save.saveId)
    ? archive[save.saveId]
    : undefined
  const fish = { ...previous?.fish }
  for (const [slug, entry] of Object.entries(save.fishopedia)) {
    const old = Object.hasOwn(fish, slug) ? fish[slug] : undefined
    fish[slug] = {
      fishSlug: slug,
      firstCaughtTurn: Math.min(
        old?.firstCaughtTurn ?? entry.firstCaughtTurn,
        entry.firstCaughtTurn,
      ),
      countCaught: Math.max(old?.countCaught ?? 0, entry.countCaught),
      bestSizeCm: Math.max(old?.bestSizeCm ?? 0, entry.bestSizeCm),
      bestQualityScore: Math.max(
        old?.bestQualityScore ?? 0,
        entry.bestQualityScore,
      ),
    }
  }
  const seen = new Set([
    ...save.deckState.seenCardIds,
    ...save.choiceLog.map((entry) => entry.cardId),
  ])
  const cards = [
    ...bundle.decks.flatMap((deck) => deck.cards),
    ...bundle.arcs.flatMap((arc) => arc.steps),
  ]
  const known = new Set(bundle.characters.map((character) => character.slug))
  const characters = new Set(previous?.characters ?? [])
  for (const card of cards) {
    if (!seen.has(card.id)) continue
    for (const slug of card.characters ?? []) {
      if (known.has(slug)) characters.add(slug)
    }
  }
  const endings = new Set(previous?.endingKeys ?? [])
  if (
    save.status === 'COMPLETE' &&
    save.endingKey &&
    bundle.endings.some((ending) => ending.outcomeKey === save.endingKey)
  ) {
    endings.add(save.endingKey)
  }
  return {
    ...archive,
    [save.saveId]: {
      saveId: save.saveId,
      name: save.name,
      turnCount: Math.max(previous?.turnCount ?? 0, save.turnCount),
      endingKeys: [...endings].sort(),
      fish,
      characters: [...characters].sort(),
    },
  }
}

export function scrapbookSummary(archive: RoyalScrapbook) {
  const reigns = Object.values(archive)
  const fish = new Map<
    string,
    { count: number; bestSizeCm: number; bestQualityScore: number }
  >()
  const endings = new Set<string>()
  const characters = new Set<string>()
  for (const reign of reigns) {
    for (const ending of reign.endingKeys) endings.add(ending)
    for (const slug of reign.characters) characters.add(slug)
    for (const [slug, entry] of Object.entries(reign.fish)) {
      const previous = fish.get(slug)
      fish.set(slug, {
        count: (previous?.count ?? 0) + entry.countCaught,
        bestSizeCm: Math.max(previous?.bestSizeCm ?? 0, entry.bestSizeCm),
        bestQualityScore: Math.max(
          previous?.bestQualityScore ?? 0,
          entry.bestQualityScore,
        ),
      })
    }
  }
  return { reigns, fish, endings, characters }
}
