// /stores/packStore.ts
//
// Packmaker admin generator state (conductor project: packmaker, task t-004).
// Drives pack manifests (stores/seeds/packManifests.ts + admin-pasted JSON)
// through the EXISTING kind_robots creation pipelines, one item at a time:
//
//   dream item     → POST /api/dreams      (dreamType LOCATION/CHARACTER)
//   facet item     → POST /api/facets      (kind GENRE)
//   character item → POST /api/characters
//   reward item    → POST /api/rewards     (rewardType ITEM)
//   item art       → artStore.generateArt() then PATCH artImageId onto the row
//
// No new generation logic, model routing, or backend surface is added here
// (packmaker SPEC.md §2, BOUNDARY.md). Every row is created isPublic: false —
// the interim all-or-nothing privacy rule from SPEC.md §4. "Ready" is a local
// bookkeeping flag meaning "all items generated"; actually releasing a pack
// (flipping isPublic / storefront wiring) stays a separately-gated human step
// and is intentionally NOT implemented by this store.
//
// Build progress (which manifest item became which row) persists in
// localStorage so re-running or resuming a pack is cheap — the whole point of
// t-004 is making the NEXT pack cheap to produce.

import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { performFetch } from '@/stores/utils'
import { useArtStore } from '@/stores/artStore'
import {
  seedPackManifests,
  type PackManifest,
  type PackManifestItem,
  type PackItemShape,
} from '@/stores/seeds/packManifests'

export type PackItemBuildStatus =
  'draft' | 'creating' | 'created' | 'generating-art' | 'complete' | 'error'

export interface PackItemBuildState {
  status: PackItemBuildStatus
  refId: number | null
  artImageId: number | null
  error: string | null
}

export type PackBuildStatus = 'draft' | 'ready'

const BUILD_STATE_KEY = 'packmaker-build-state'
const IMPORTED_MANIFESTS_KEY = 'packmaker-imported-manifests'
const PACK_STATUS_KEY = 'packmaker-pack-status'

const ITEM_SHAPES: PackItemShape[] = ['dream', 'facet', 'character', 'reward']
const ITEM_TYPES = ['location', 'genre', 'character', 'reward']
const PRICE_HOOKS = ['free', 'one-time', 'dlc']

function defaultItemState(): PackItemBuildState {
  return { status: 'draft', refId: null, artImageId: null, error: null }
}

/**
 * Validate a parsed JSON value against the schemaVersion 1 manifest shape
 * (conductor projects/packmaker/packs/SCHEMA.md). Returns an error string, or
 * null when the manifest is usable.
 */
export function validatePackManifest(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 'Manifest must be a JSON object.'
  }
  const pack = value as Record<string, unknown>
  if (pack.schemaVersion !== 1) return 'schemaVersion must be 1.'
  if (typeof pack.id !== 'string' || !pack.id.trim()) {
    return 'Pack "id" is required.'
  }
  if (typeof pack.title !== 'string' || !pack.title.trim()) {
    return 'Pack "title" is required.'
  }
  if (pack.visibility !== 'draft' && pack.visibility !== 'released') {
    return 'visibility must be "draft" or "released".'
  }
  const price = pack.price as Record<string, unknown> | undefined
  if (!price || !PRICE_HOOKS.includes(String(price.hook))) {
    return 'price.hook must be free, one-time, or dlc.'
  }
  if (!Array.isArray(pack.items) || pack.items.length === 0) {
    return 'Pack must contain at least one item.'
  }
  for (const [index, raw] of pack.items.entries()) {
    if (!raw || typeof raw !== 'object')
      return `Item ${index} must be an object.`
    const item = raw as Record<string, unknown>
    if (typeof item.id !== 'string' || !item.id.trim()) {
      return `Item ${index} is missing "id".`
    }
    if (!ITEM_TYPES.includes(String(item.type))) {
      return `Item "${item.id}" has unknown type "${item.type}".`
    }
    if (!ITEM_SHAPES.includes(item.itemShape as PackItemShape)) {
      return `Item "${item.id}" has unknown itemShape "${item.itemShape}".`
    }
    const payload = item.draftPayload as Record<string, unknown> | undefined
    if (!item.refId && !payload) {
      return `Item "${item.id}" needs a draftPayload (or a refId).`
    }
    if (payload) {
      for (const field of ['title', 'description'] as const) {
        if (typeof payload[field] !== 'string' || !payload[field]) {
          return `Item "${item.id}" draftPayload is missing "${field}".`
        }
      }
    }
  }
  return null
}

export const usePackStore = defineStore('packStore', () => {
  const importedManifests = ref<PackManifest[]>([])
  const buildState = ref<Record<string, Record<string, PackItemBuildState>>>({})
  const packStatus = ref<Record<string, PackBuildStatus>>({})
  const isInitialized = ref(false)

  const manifests = computed<PackManifest[]>(() => {
    const importedIds = new Set(importedManifests.value.map((m) => m.id))
    // An imported manifest with a seed's id overrides the seed copy.
    return [
      ...seedPackManifests.filter((m) => !importedIds.has(m.id)),
      ...importedManifests.value,
    ]
  })

  function packById(packId: string): PackManifest | null {
    return manifests.value.find((m) => m.id === packId) || null
  }

  function itemState(packId: string, itemId: string): PackItemBuildState {
    return buildState.value[packId]?.[itemId] || defaultItemState()
  }

  function packBuildStatus(packId: string): PackBuildStatus {
    return packStatus.value[packId] || 'draft'
  }

  function packProgress(packId: string): { done: number; total: number } {
    const pack = packById(packId)
    if (!pack) return { done: 0, total: 0 }
    const done = pack.items.filter(
      (item) => itemState(packId, item.id).refId !== null,
    ).length
    return { done, total: pack.items.length }
  }

  function isPackComplete(packId: string): boolean {
    const { done, total } = packProgress(packId)
    return total > 0 && done === total
  }

  function initialize(): void {
    if (isInitialized.value || !import.meta.client) return
    try {
      const storedBuild = localStorage.getItem(BUILD_STATE_KEY)
      if (storedBuild) buildState.value = JSON.parse(storedBuild)
      const storedImports = localStorage.getItem(IMPORTED_MANIFESTS_KEY)
      if (storedImports) importedManifests.value = JSON.parse(storedImports)
      const storedStatus = localStorage.getItem(PACK_STATUS_KEY)
      if (storedStatus) packStatus.value = JSON.parse(storedStatus)
    } catch {
      // Corrupt local state falls back to a clean slate; the database rows
      // themselves are untouched.
      buildState.value = {}
      importedManifests.value = []
      packStatus.value = {}
    }
    isInitialized.value = true
  }

  function persist(): void {
    if (!import.meta.client) return
    try {
      localStorage.setItem(BUILD_STATE_KEY, JSON.stringify(buildState.value))
      localStorage.setItem(
        IMPORTED_MANIFESTS_KEY,
        JSON.stringify(importedManifests.value),
      )
      localStorage.setItem(PACK_STATUS_KEY, JSON.stringify(packStatus.value))
    } catch {
      // Storage quota/private-mode failures only lose resume convenience.
    }
  }

  function setItemState(
    packId: string,
    itemId: string,
    updates: Partial<PackItemBuildState>,
  ): void {
    const packBucket = { ...(buildState.value[packId] || {}) }
    packBucket[itemId] = {
      ...(packBucket[itemId] || defaultItemState()),
      ...updates,
    }
    buildState.value = { ...buildState.value, [packId]: packBucket }
    persist()
  }

  /** Paste-a-manifest path for future packs: JSON with the schema v1 shape. */
  function importManifest(rawJson: string): {
    success: boolean
    message: string
  } {
    let parsed: unknown
    try {
      parsed = JSON.parse(rawJson)
    } catch {
      return { success: false, message: 'Manifest is not valid JSON.' }
    }
    const problem = validatePackManifest(parsed)
    if (problem) return { success: false, message: problem }
    const manifest = parsed as PackManifest
    importedManifests.value = [
      ...importedManifests.value.filter((m) => m.id !== manifest.id),
      manifest,
    ]
    persist()
    return { success: true, message: `Loaded pack "${manifest.title}".` }
  }

  function removeImportedManifest(packId: string): void {
    importedManifests.value = importedManifests.value.filter(
      (m) => m.id !== packId,
    )
    persist()
  }

  /**
   * Materialize one manifest item as a real database row through the model's
   * existing create endpoint. Always isPublic: false (SPEC.md §4 interim rule).
   */
  async function createItemRecord(
    packId: string,
    itemId: string,
  ): Promise<{ success: boolean; message: string }> {
    const pack = packById(packId)
    const item = pack?.items.find((entry) => entry.id === itemId)
    if (!pack || !item) {
      return { success: false, message: 'Unknown pack or item.' }
    }
    const payload = item.draftPayload
    if (!payload) {
      return {
        success: false,
        message: `Item "${itemId}" has no draftPayload.`,
      }
    }

    setItemState(packId, itemId, { status: 'creating', error: null })

    const { url, body } = buildCreateRequest(item)
    const response = await performFetch<{ id: number }>(url, {
      method: 'POST',
      body: JSON.stringify(body),
    })

    if (!response.success || !response.data?.id) {
      const message = response.message || 'Create request failed.'
      setItemState(packId, itemId, { status: 'error', error: message })
      return { success: false, message }
    }

    setItemState(packId, itemId, {
      status: 'created',
      refId: response.data.id,
      error: null,
    })
    return {
      success: true,
      message: `Created ${item.itemShape} #${response.data.id} for "${payload.title}".`,
    }
  }

  function buildCreateRequest(item: PackManifestItem): {
    url: string
    body: Record<string, unknown>
  } {
    const payload = item.draftPayload!
    const shared = {
      description: payload.description,
      artPrompt: payload.artPrompt,
      isPublic: false,
      isMature: false,
      designer: 'packmaker',
    }
    switch (item.itemShape) {
      case 'dream':
        return {
          url: '/api/dreams',
          body: {
            ...shared,
            title: payload.title,
            dreamType: item.type === 'character' ? 'CHARACTER' : 'LOCATION',
          },
        }
      case 'facet':
        return {
          url: '/api/facets',
          body: { ...shared, title: payload.title, kind: 'GENRE' },
        }
      case 'character':
        return {
          url: '/api/characters',
          body: {
            name: payload.title,
            backstory: payload.description,
            artPrompt: payload.artPrompt,
            isPublic: false,
            isMature: false,
            designer: 'packmaker',
          },
        }
      case 'reward':
        return {
          url: '/api/rewards',
          body: { ...shared, name: payload.title, rewardType: 'ITEM' },
        }
    }
  }

  /**
   * Generate art for an already-created item through the shared art pipeline,
   * then attach the finished ArtImage to the row. Requires the record first so
   * there is always something to attach the image to.
   */
  async function generateItemArt(
    packId: string,
    itemId: string,
  ): Promise<{ success: boolean; message: string }> {
    const pack = packById(packId)
    const item = pack?.items.find((entry) => entry.id === itemId)
    if (!pack || !item?.draftPayload) {
      return { success: false, message: 'Unknown pack or item.' }
    }
    const state = itemState(packId, itemId)
    if (!state.refId) {
      return {
        success: false,
        message: 'Create the item record before generating its art.',
      }
    }

    setItemState(packId, itemId, { status: 'generating-art', error: null })

    const artStore = useArtStore()
    const result = await artStore.generateArt({
      promptString: item.draftPayload.artPrompt,
      title: item.draftPayload.title,
      designer: 'packmaker',
      isPublic: false,
      isMature: false,
    })

    if (!result.success || !result.data?.id) {
      const message = result.message || 'Art generation failed.'
      setItemState(packId, itemId, { status: 'error', error: message })
      return { success: false, message }
    }

    const patch = await performFetch(
      `${patchBase(item.itemShape)}/${state.refId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ artImageId: result.data.id }),
      },
    )

    if (!patch.success) {
      const message =
        patch.message ||
        `Art image ${result.data.id} rendered but could not be attached.`
      setItemState(packId, itemId, {
        status: 'error',
        artImageId: result.data.id,
        error: message,
      })
      return { success: false, message }
    }

    setItemState(packId, itemId, {
      status: 'complete',
      artImageId: result.data.id,
      error: null,
    })
    return {
      success: true,
      message: `Art attached to ${item.itemShape} #${state.refId}.`,
    }
  }

  function patchBase(shape: PackItemShape): string {
    switch (shape) {
      case 'dream':
        return '/api/dreams'
      case 'facet':
        return '/api/facets'
      case 'character':
        return '/api/characters'
      case 'reward':
        return '/api/rewards'
    }
  }

  /** Forget the local link so the item can be re-generated as a fresh row. */
  function resetItem(packId: string, itemId: string): void {
    setItemState(packId, itemId, defaultItemState())
    if (packStatus.value[packId] === 'ready') {
      packStatus.value = { ...packStatus.value, [packId]: 'draft' }
      persist()
    }
  }

  /**
   * Local bookkeeping only: all items generated, pack is ready for the (still
   * human-gated) release step. Does NOT flip isPublic or touch the storefront.
   */
  function markPackReady(packId: string): {
    success: boolean
    message: string
  } {
    if (!isPackComplete(packId)) {
      return {
        success: false,
        message: 'Every item needs a generated record first.',
      }
    }
    packStatus.value = { ...packStatus.value, [packId]: 'ready' }
    persist()
    return {
      success: true,
      message:
        'Pack marked ready. Releasing it (making items public / storefront wiring) stays a separate human-approved step.',
    }
  }

  function markPackDraft(packId: string): void {
    packStatus.value = { ...packStatus.value, [packId]: 'draft' }
    persist()
  }

  return {
    manifests,
    importedManifests,
    buildState,
    isInitialized,

    packById,
    itemState,
    packBuildStatus,
    packProgress,
    isPackComplete,

    initialize,
    importManifest,
    removeImportedManifest,
    createItemRecord,
    generateItemArt,
    resetItem,
    markPackReady,
    markPackDraft,
  }
})
