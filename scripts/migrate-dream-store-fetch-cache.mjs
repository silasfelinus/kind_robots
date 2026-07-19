import { readFileSync, writeFileSync } from 'node:fs'

const path = 'stores/dreamStore.ts'
const source = readFileSync(path, 'utf8')
const newline = source.includes('\r\n') ? '\r\n' : '\n'
let updated = source.replace(/\r\n/g, '\n')

function replaceExact(target, replacement, label) {
  if (!updated.includes(target)) {
    throw new Error(`Expected ${label} was not found in ${path}.`)
  }

  updated = updated.replace(target, replacement)
}

replaceExact(
  `} from '@/stores/helpers/dreamHelper'
import type {`,
  `} from '@/stores/helpers/dreamHelper'
import {
  mergeDefinedRecord,
  mergeRecordsById,
} from '@/stores/helpers/recordMerge'
import type {`,
  'record merge helper import',
)

replaceExact(
  `  const fetchPromise = ref<Promise<DreamWithRelations[]> | null>(null)`,
  `  const fetchPromises = ref<Record<string, Promise<DreamWithRelations[]>>>({})`,
  'URL-keyed fetch promise state',
)

replaceExact(
  `  function upsertDream(dream: DreamWithRelations) {
    const normalized = normalizeDream(dream)
    const index = dreams.value.findIndex((entry) => entry.id === normalized.id)

    if (index >= 0) dreams.value.splice(index, 1, normalized)
    else dreams.value.push(normalized)`,
  `  function upsertDream(dream: DreamWithRelations) {
    const incoming = normalizeDream(dream)
    const index = dreams.value.findIndex((entry) => entry.id === incoming.id)
    const normalized = mergeDefinedRecord(
      index >= 0 ? dreams.value[index] : undefined,
      incoming,
    )

    if (index >= 0) dreams.value.splice(index, 1, normalized)
    else dreams.value.push(normalized)`,
  'detail-preserving Dream upsert',
)

replaceExact(
  `  async function fetchDreams(
    options: FetchDreamOptions = {},
  ): Promise<DreamWithRelations[]> {
    if (
      !Object.keys(options).length &&
      hasLoaded.value &&
      dreams.value.length &&
      fetchPromise.value
    ) {
      return fetchPromise.value
    }

    const request = (async () => {
      loading.value = true
      clearError()

      try {
        const query = buildQuery({
          mine: options.userOnly ? 'true' : undefined,
          includeInactive: options.showInactive ? 'true' : undefined,
          includeMature: options.includeMature ? 'true' : undefined,
          artCollectionId: options.artCollectionId,
          galleryId: options.galleryId,
          scenarioId: options.scenarioId,
          dreamType: options.dreamType
            ? parseDreamType(options.dreamType)
            : undefined,
          tagId: options.tagId,
          characterId: options.characterId,
          rewardId: options.rewardId,
          search: options.search,
          take: options.limit,
        })

        const url = query ? \`/api/dreams?\${query}\` : '/api/dreams'
        const res = await performFetch<DreamWithRelations[]>(url)

        if (!res.success || !res.data)
          throw new Error(res.message || 'Failed to fetch dreams.')

        dreams.value = res.data.map(normalizeDream).sort(sortDreamsByNewest)
        hasLoaded.value = true
        saveStateToLocalStorage()

        return dreams.value
      } catch (fetchError) {
        hasLoaded.value = false
        reportError(
          fetchError,
          'fetching dreams',
          'Failed to fetch dreams.',
          ErrorType.NETWORK_ERROR,
        )
        return dreams.value
      } finally {
        loading.value = false
        fetchPromise.value = null
      }
    })()

    if (!Object.keys(options).length) fetchPromise.value = request
    return request
  }`,
  `  async function fetchDreams(
    options: FetchDreamOptions = {},
  ): Promise<DreamWithRelations[]> {
    const query = buildQuery({
      mine: options.userOnly ? 'true' : undefined,
      includeInactive: options.showInactive ? 'true' : undefined,
      includeMature: options.includeMature ? 'true' : undefined,
      artCollectionId: options.artCollectionId,
      galleryId: options.galleryId,
      scenarioId: options.scenarioId,
      dreamType: options.dreamType
        ? parseDreamType(options.dreamType)
        : undefined,
      tagId: options.tagId,
      characterId: options.characterId,
      rewardId: options.rewardId,
      search: options.search,
      take: options.limit,
    })
    const url = query ? \`/api/dreams?\${query}\` : '/api/dreams'
    const existingRequest = fetchPromises.value[url]

    if (existingRequest) return existingRequest

    const request = (async () => {
      loading.value = true
      clearError()

      try {
        const res = await performFetch<DreamWithRelations[]>(url)

        if (!res.success || !res.data)
          throw new Error(res.message || 'Failed to fetch dreams.')

        const normalizedIncoming = res.data.map(normalizeDream)
        dreams.value = mergeRecordsById(dreams.value, normalizedIncoming)
          .map(normalizeDream)
          .sort(sortDreamsByNewest)

        const cachedById = new Map(dreams.value.map((dream) => [dream.id, dream]))
        const fetched = normalizedIncoming.map(
          (dream) => cachedById.get(dream.id) ?? dream,
        )

        if (!query) hasLoaded.value = true
        saveStateToLocalStorage()

        return fetched
      } catch (fetchError) {
        if (!query && dreams.value.length === 0) hasLoaded.value = false
        reportError(
          fetchError,
          'fetching dreams',
          'Failed to fetch dreams.',
          ErrorType.NETWORK_ERROR,
        )
        return []
      } finally {
        loading.value = false
        delete fetchPromises.value[url]
      }
    })()

    fetchPromises.value[url] = request
    return request
  }`,
  'Dream fetch merge and URL dedupe implementation',
)

replaceExact(
  `    fetchPromise.value = null`,
  `    fetchPromises.value = {}`,
  'fetch reset state',
)

replaceExact(
  `    fetchPromise,`,
  `    fetchPromises,`,
  'exposed fetch state',
)

writeFileSync(path, updated.replace(/\n/g, newline), 'utf8')
