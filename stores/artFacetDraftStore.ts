// /stores/artFacetDraftStore.ts
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useFacetCatalogStore } from '@/stores/facetCatalogStore'
import { composeArtPromptWithFacets } from '@/utils/artFacetPrompt'

export const ART_FACET_WORKFLOW_KEY = '__kindRobotsFacetSelection'

type WorkflowRecord = Record<string, unknown>

function asWorkflow(value: unknown): WorkflowRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? { ...(value as WorkflowRecord) }
    : {}
}

export const useArtFacetDraftStore = defineStore('artFacetDraftStore', () => {
  const catalog = useFacetCatalogStore()
  const selectedIds = ref<number[]>([])

  const selectedFacets = computed(() => {
    const byId = new Map(catalog.entries.map((entry) => [entry.id, entry]))
    return selectedIds.value
      .map((id) => byId.get(id))
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
  })

  async function initialize(): Promise<void> {
    if (!catalog.loaded) {
      await catalog.fetchCatalog({ includeMature: true, take: 1000 })
    }
  }

  function setSelectedIds(ids: number[]): void {
    selectedIds.value = [
      ...new Set(ids.filter((id) => Number.isInteger(id) && id > 0)),
    ].slice(0, 50)
  }

  function clear(): void {
    selectedIds.value = []
  }

  function decorateGenerationData<T extends Record<string, unknown>>(
    data: T,
    basePrompt: string,
  ): T & { promptString: string; workflow: WorkflowRecord } {
    const cleanBase = String(basePrompt || '').replace(/\s+/g, ' ').trim()
    const workflow = asWorkflow(data.workflow)
    workflow[ART_FACET_WORKFLOW_KEY] = {
      facetIds: [...selectedIds.value],
      basePromptString: cleanBase,
    }

    return {
      ...data,
      promptString: composeArtPromptWithFacets(cleanBase, selectedFacets.value),
      workflow,
    }
  }

  return {
    selectedIds,
    selectedFacets,
    initialize,
    setSelectedIds,
    clear,
    decorateGenerationData,
  }
})
