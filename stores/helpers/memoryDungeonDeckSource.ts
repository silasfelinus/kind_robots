import { useArtStore } from '../artStore'
import { useUserStore } from '../userStore'
import { useDreamStore } from '../dreamStore'
import { useCharacterStore } from '../characterStore'
import { useBotStore } from '../botStore'
import { useRewardStore } from '../rewardStore'
import { useScenarioStore } from '../scenarioStore'
import { useFacetStore } from '../facetStore'
import {
  DESIGNED_DUNGEON_ART,
  imageUrlForDeck,
  isEligibleDungeonArt,
  uniqueDeckPaths,
  type DungeonDeckSelection,
  type VisibleDeckImage,
} from '~/utils/memoryDungeonDeck'

function loadImage(path: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    const timeout = window.setTimeout(() => resolve(false), 4000)
    img.onload = () => {
      window.clearTimeout(timeout)
      resolve(true)
    }
    img.onerror = () => {
      window.clearTimeout(timeout)
      resolve(false)
    }
    img.src = path
  })
}

export async function resolveMemoryDungeonDeck(
  choice: DungeonDeckSelection,
  needed: number,
  designedOffset = 0,
): Promise<string[]> {
  if (choice.family === 'designed') {
    const paths = DESIGNED_DUNGEON_ART.map((item) => item.imagePath)
    return paths.slice(designedOffset, designedOffset + needed)
  }

  const user = useUserStore()
  const matureAllowed =
    user.showMature === true || user.user?.showMature === true
  const includeMature = choice.includeMature && matureAllowed
  const art = useArtStore()
  const viewerId = Number(user.userId ?? user.user?.id ?? 0)

  if (choice.family === 'gallery') {
    let candidates: VisibleDeckImage[] = []
    const selectedCollection = choice.gallery === 'collections'
    const generated = choice.gallery === 'generated'

    if (selectedCollection) {
      if (!choice.collectionIds.length) {
        throw new Error('Choose at least one collection before entering the dungeon.')
      }
      // Fetch ONLY selected shelves. Fetching the whole archive with every image
      // used to time out or leave the memory selector apparently empty.
      for (const id of choice.collectionIds) {
        const reply = await $fetch<{
          success: boolean
          message?: string
          data?: Array<{
            id: number
            userId: number
            isPublic: boolean
            isMature: boolean
            isActive: boolean
            ArtImages?: VisibleDeckImage[]
            artImages?: VisibleDeckImage[]
          }>
        }>('/api/art/collection', {
          query: {
            id,
            includePrivate: true,
            includeMature: true,
            includeImages: true,
            counts: true,
          },
        })
        if (!reply.success) throw new Error(reply.message || 'Unable to load that art collection.')
        for (const shelf of reply.data ?? []) {
          const owner = viewerId > 0 && shelf.userId === viewerId
          if ((!shelf.isPublic && !owner) || shelf.isActive === false ||
            (shelf.isMature && !includeMature)) continue
          candidates.push(...(shelf.ArtImages ?? shelf.artImages ?? []))
        }
      }
    } else {
      await art.initialize({
        fetchRemote: true,
        hydrateImages: true,
        initializeCollections: false,
      })
      candidates = generated ? art.generatedArtImages : art.artImages
      if (candidates.length < needed) {
        const refreshed = await art.fetchAllArtImages({ force: true })
        candidates = generated
          ? [
              ...art.generatedArtImages,
              ...refreshed
                .filter((image) => viewerId > 0 && image.userId === viewerId)
                .sort((a, b) => b.id - a.id)
                .slice(0, 80),
            ]
          : refreshed
      }
    }

    const allowed = candidates.filter((image) =>
      isEligibleDungeonArt(
        image,
        includeMature,
        matureAllowed,
        viewerId,
        selectedCollection || generated,
      ),
    )
    const urls = uniqueDeckPaths(allowed.map(imageUrlForDeck))
    return loadDungeonImagePaths(urls, needed)
  }

  let records: VisibleDeckImage[]
  if (choice.entityKind === 'dreams') {
    const source = useDreamStore()
    await source.fetchDreams()
    records = source.dreams
  } else if (choice.entityKind === 'characters') {
    const source = useCharacterStore()
    await source.fetchCharacters()
    records = source.characters
  } else if (choice.entityKind === 'bots') {
    const source = useBotStore()
    await source.fetchBots()
    records = source.bots.map((bot) => ({
      ...bot,
      imagePath: bot.imagePath || bot.avatarImage,
    }))
  } else if (choice.entityKind === 'rewards') {
    const source = useRewardStore()
    await source.fetchRewards()
    records = source.rewards
  } else if (choice.entityKind === 'scenarios') {
    const source = useScenarioStore()
    await source.fetchScenarios()
    records = source.scenarios
  } else {
    const source = useFacetStore()
    await source.fetchFacets({ includeMature })
    records = source.facets
  }
  await art.initialize({
    fetchRemote: true,
    hydrateImages: true,
    initializeCollections: false,
  })
  const byId = new Map(art.artImages.map((item) => [item.id, item]))
  const paths = uniqueDeckPaths(
    records
      .filter((record) => {
        if (!isEligibleDungeonArt(record, includeMature, matureAllowed, viewerId))
          return false
        const artId = (record as { artImageId?: number | null }).artImageId
        if (!artId) return true
        const linkedArt = byId.get(artId)
        return linkedArt
          ? isEligibleDungeonArt(linkedArt, includeMature, matureAllowed, viewerId)
          : false
      })
      .map(imageUrlForDeck),
  )
  return loadDungeonImagePaths(paths, needed)
}

async function loadDungeonImagePaths(paths: string[], needed: number): Promise<string[]> {
  const candidates = [...paths].sort(() => Math.random() - 0.5)
  const selected: string[] = []
  for (let offset = 0; offset < candidates.length && selected.length < needed; offset += 8) {
    const chunk = candidates.slice(offset, offset + 8)
    const loaded = await Promise.all(chunk.map(async (path) => ({ path, ok: await loadImage(path) })))
    for (const result of loaded) {
      if (result.ok && selected.length < needed) selected.push(result.path)
    }
  }
  if (selected.length < needed) {
    throw new Error(
      `Only ${selected.length} distinct usable images are available; this round needs ${needed}. Try the designed deck, a different public collection, or check saved art paths.`,
    )
  }
  return selected
}
