// /utils/comments/fitnessLoader.ts
//
// One loader for the fitness lane, shared by the audit and the proposer.
//
// It exists so the two cannot disagree about what production looks like. The
// audit reporting a gap the proposer has already filled -- or the proposer
// working from a narrower read than the audit -- is the failure mode this
// prevents, and it is invisible when it happens: both sides just print numbers.
import {
  buildInventory,
  type CharacterFacetLink,
  type CharacterRow,
  type DreamRow,
  type FacetRow,
  type Inventory,
  type ScenarioRow,
} from '@/utils/comments/fitnessInventory'

export type LoadedInventory = Inventory & {
  /** dreamId -> facetIds. The Dream LIST does not carry these at all. */
  dreamFacetIds: Map<number, number[]>
}

/**
 * The Dream list endpoint, asked for all of them.
 *
 * `/api/dreams` defaults to a `take` of 48 and there are 75. Every tool in this
 * lane fetched the bare path and therefore validated against a truncated
 * catalog, which produced one real false positive: the connection contract
 * refused four assignments with "Dream #50 does not exist in production" when
 * Dream 50 was simply row 49.
 *
 * That failure was fail-closed and got caught. The dangerous one was silent:
 * verifyDreamLocations checks new slugs and titles against this list, so a new
 * location colliding with an existing Dream past row 48 would have been created
 * as a duplicate world. (Checked after the fact -- none of the sixteen
 * collided.)
 *
 * Characters, Scenarios and Bots return everything by default; only Dreams cap.
 */
const ALL_DREAMS = '/api/dreams?take=1000'

export function createFetcher(baseUrl: string) {
  return async function get<T>(path: string): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      try {
        const response = await fetch(`${baseUrl}${path}`, {
          headers: { accept: 'application/json' },
        })
        if (!response.ok) throw new Error(`status ${response.status}`)
        const body = (await response.json()) as unknown
        if (Array.isArray(body)) return body as T
        const data = (body as { data?: unknown }).data
        return (data === undefined ? body : data) as T
      } catch (error) {
        if (attempt === 3) {
          throw new Error(`GET ${path} failed: ${(error as Error).message}`, {
            cause: error,
          })
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
      }
    }
    throw new Error('unreachable')
  }
}

export async function pool<T, R>(
  items: readonly T[],
  fn: (item: T) => Promise<R>,
  width = 8,
): Promise<R[]> {
  const out = new Array<R>(items.length)
  let cursor = 0
  await Promise.all(
    Array.from({ length: Math.min(width, items.length) || 1 }, async () => {
      while (cursor < items.length) {
        const index = cursor
        cursor += 1
        out[index] = await fn(items[index]!)
      }
    }),
  )
  return out
}

export async function loadFitnessInventory(
  baseUrl: string,
): Promise<LoadedInventory> {
  const get = createFetcher(baseUrl.replace(/\/+$/, ''))

  // /api/facets caps take at 250, so the catalog has to be walked.
  const facets: FacetRow[] = []
  for (let skip = 0; ; skip += 250) {
    const page = await get<FacetRow[]>(`/api/facets?take=250&skip=${skip}`)
    facets.push(...page)
    if (page.length < 250) break
  }

  const [characters, dreamList, scenarios] = await Promise.all([
    get<CharacterRow[]>('/api/characters'),
    get<DreamRow[]>(ALL_DREAMS),
    get<ScenarioRow[]>('/api/scenarios'),
  ])

  // The Dream LIST caps Characters and Scenarios at 3 each. Re-read every Dream
  // individually or a well-populated Dream is indistinguishable from an empty one.
  const dreams = await pool(dreamList, (dream) =>
    get<DreamRow>(`/api/dreams/${dream.id}`),
  )

  const dreamFacetSets = await pool(dreamList, async (dream) => ({
    id: dream.id,
    links: await get<Array<{ facetId: number }>>(
      `/api/dreams/${dream.id}/facets`,
    ),
  }))

  const characterFacetSets = await pool(characters, async (character) => ({
    id: character.id,
    links: await get<Array<{ facetId: number; fieldKey: string }>>(
      `/api/characters/${character.id}/facets`,
    ),
  }))

  const characterFacets: CharacterFacetLink[] = characterFacetSets.flatMap(
    (set) =>
      (set.links || []).map((link) => ({
        characterId: set.id,
        facetId: link.facetId,
        fieldKey: link.fieldKey,
      })),
  )

  const dreamFacetIds = new Map<number, number[]>()
  for (const set of dreamFacetSets) {
    dreamFacetIds.set(
      set.id,
      [...new Set((set.links || []).map((link) => link.facetId))],
    )
  }

  const inventory = buildInventory({
    characters,
    dreams,
    scenarios,
    facets,
    characterFacets,
  })

  return { ...inventory, dreamFacetIds }
}
