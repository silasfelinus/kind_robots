import { useMemoryStore } from '../memoryStore'
import { useArtStore } from '../artStore'
import { useCollectionStore } from '../collectionStore'
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
): Promise<string[]> {
  if (choice.family === 'designed') {
    const paths = DESIGNED_DUNGEON_ART.map((item) => item.imagePath)
    return paths.slice(0, needed)
  }

  const user = useUserStore()
  const matureAllowed =
    user.showMature === true || user.user?.showMature === true
  const includeMature = choice.includeMature && matureAllowed
  const memory = useMemoryStore()

  if (choice.family === 'gallery') {
    if (choice.gallery === 'collections') {
      if (!choice.collectionIds.length) return []
      const collections = useCollectionStore()
      await collections.fetchCollections()
      const selectedPublic = choice.collectionIds.filter((id) => {
        const collection = collections.findCollectionById(id)
        return collection?.isPublic === true &&
          collection.isActive !== false &&
          (!collection.isMature || includeMature)
      })
      if (!selectedPublic.length) return []
      memory.useCollections(selectedPublic)
    } else {
      memory.useAllArtImages()
    }
    const all = await memory.getMemoryCardPool()
    const filtered = all.filter((image) =>
      isEligibleDungeonArt(image, includeMature, matureAllowed),
    )
    const distinctPaths = uniqueDeckPaths(filtered.map(imageUrlForDeck))
    if (distinctPaths.length < needed) return distinctPaths
    return memory.selectLoadableImagePaths(filtered, needed)
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
  const art = useArtStore()
  await art.initialize({
    fetchRemote: true,
    hydrateImages: true,
    initializeCollections: false,
  })
  const byId = new Map(art.artImages.map((item) => [item.id, item]))
  const paths = uniqueDeckPaths(
    records
      .filter((record) => {
        if (!isEligibleDungeonArt(record, includeMature, matureAllowed))
          return false
        const artId = (record as { artImageId?: number | null }).artImageId
        if (!artId) return true
        const linkedArt = byId.get(artId)
        return linkedArt
          ? isEligibleDungeonArt(linkedArt, includeMature, matureAllowed)
          : false
      })
      .map(imageUrlForDeck),
  )
  const selected: string[] = []
  for (const path of paths.sort(() => Math.random() - 0.5)) {
    if (await loadImage(path)) selected.push(path)
    if (selected.length >= needed) break
  }
  return selected
}
